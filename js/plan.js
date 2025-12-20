// plan.js
import { supabase } from './config.js';
import { state, ROOT_SE_ID } from './state.js'; // Import the new ID

let currentScale = 1;

export async function loadStudentPlan(userId) {
    const canvas = document.getElementById('plan-tree-canvas');
    if (!canvas) return;

    // Reset layout & show loading
    canvas.innerHTML = '<div style="color:#fff; padding:20px;">Generating Plan Map...</div>';
    currentScale = 1;
    updateZoom();

    try {
        // 1. Fetch User Progress
        const { data: history } = await supabase
            .from('enrollments')
            .select('status, sections(course_code)')
            .eq('user_id', userId)
            .in('status', ['COMPLETED', 'REGISTERED', 'ENROLLED']);

        const passed = new Set();
        const registered = new Set();
        history?.forEach(h => {
            const code = h.sections?.course_code;
            if (h.status === 'COMPLETED') passed.add(code);
            else registered.add(code);
        });

        // 2. Fetch Course Info
        if (!state.allCoursesData || state.allCoursesData.length === 0) {
            const { data: courses } = await supabase.from('courses').select('*');
            state.allCoursesData = courses || [];
        }

        // 3. Calculate Layout
        // Note: state.planRoots now only contains [ROOT_SE_ID]
        const layoutData = calculateTreeLayout(state.planRoots, state.planLinks);
        
        // 4. Clear loading & resize canvas
        canvas.innerHTML = '';
        // Add padding to calculated size
        canvas.style.width = `${layoutData.width + 100}px`; 
        canvas.style.height = `${layoutData.height + 100}px`;

        // 5. Render Lines FIRST (behind nodes)
        renderConnections(layoutData.edges, layoutData.nodes);
        
        // 6. Render Nodes
        renderNodes(layoutData.nodes, passed, registered);

        // 7. Center view initially
        setTimeout(fitToScreen, 100);
        enableDragScroll();

    } catch (err) {
        console.error("Plan Error:", err);
        canvas.innerHTML = '<div style="color:red; padding:20px;">Error loading plan map.</div>';
    }
}

// --- Layout Engine (Updated settings) ---
function calculateTreeLayout(roots, links) {
    const nodes = [];
    const edges = [];
    const levelMap = {}; 
    const childrenMap = {}; 

    links.forEach(l => {
        if (!childrenMap[l.s]) childrenMap[l.s] = [];
        childrenMap[l.s].push(l.t);
    });

    const queue = roots.map(r => ({ id: r, level: 0 }));
    const visited = new Set();
    const levelCounts = {};

    // --- Config: Tighter, grid-like spacing ---
    const NODE_WIDTH = 180; // Matches CSS
    const NODE_HEIGHT = 100; // Approx height of new card style
    const GAP_X = 40; // Horizontal gap
    const GAP_Y = 100; // Vertical gap (larger for clear separation)

    while (queue.length > 0) {
        const { id, level } = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);

        levelMap[id] = level;
        if (!levelCounts[level]) levelCounts[level] = 0;
        levelCounts[level]++;

        const children = childrenMap[id] || [];
        children.forEach(childId => {
            queue.push({ id: childId, level: level + 1 });
            edges.push({ s: id, t: childId });
        });
    }

    const rowPlacement = {};
    let minX = Infinity; let maxX = -Infinity; let maxY = 0;

    visited.forEach(nodeId => {
        const lvl = levelMap[nodeId];
        const countInRow = levelCounts[lvl];
        
        if (typeof rowPlacement[lvl] === 'undefined') rowPlacement[lvl] = 0;
        
        const rowWidth = countInRow * NODE_WIDTH + (countInRow - 1) * GAP_X;
        const rowStart = -(rowWidth / 2);
        
        // Special handling for Super Root (Level 0) to center perfectly
        let x, y;
        if (lvl === 0) {
             x = -(250 / 2); // Assuming approx width of super root pill
             y = 50;
        } else {
             x = rowStart + (rowPlacement[lvl] * (NODE_WIDTH + GAP_X));
             // Add extra gap after level 0 for visual separation
             y = 50 + (lvl * (NODE_HEIGHT + GAP_Y)) + (lvl === 1 ? 40 : 0);
        }

        if (x < minX) minX = x;
        if (x + NODE_WIDTH > maxX) maxX = x + NODE_WIDTH;
        if (y + NODE_HEIGHT > maxY) maxY = y + NODE_HEIGHT;

        nodes.push({ id: nodeId, rawX: x, y: y, level: lvl });
        rowPlacement[lvl]++;
    });

    // Normalize X coordinates starting at 50px padding
    const PADDING_LEFT = 50;
    const shiftX = PADDING_LEFT - minX;

    const finalNodes = nodes.map(n => ({
        ...n,
        x: n.rawX + shiftX,
        // Recalculate center X for easier connector drawing later
        cx: n.rawX + shiftX + (n.level === 0 ? 125 : NODE_WIDTH / 2) 
    }));

    return { 
        nodes: finalNodes, 
        edges: edges, 
        width: (maxX - minX) + (PADDING_LEFT * 2),
        height: maxY + 100
    };
}

// --- Node Renderer (Handles Super Root vs Regular Courses) ---
function renderNodes(nodes, passed, registered) {
    const container = document.getElementById('plan-tree-canvas');
    
    nodes.forEach(n => {
        const el = document.createElement('div');
        el.style.left = `${n.x}px`;
        el.style.top = `${n.y}px`;
        el.id = `node-${n.id}`;

        // --- CASE 1: Super Root Node ---
        if (n.id === ROOT_SE_ID) {
            el.className = 'super-root-node';
            el.innerHTML = `
                <div class="sr-title">Software Engineering</div>
                <div class="sr-subtitle">132 Credit Hours</div>
            `;
            // No click action for root currently
        } 
        // --- CASE 2: Regular Course Node ---
        else {
            const course = state.allCoursesData.find(c => c.course_code == n.id) || { course_name_en: n.id, credit_hours: 3 };
            const name = state.currentLang === 'ar' ? (course.course_name_ar || course.course_name_en) : course.course_name_en;

            let status = 'locked';
            let icon = '🔒';
            if (passed.has(n.id)) { status = 'passed'; icon = '✅'; }
            else if (registered.has(n.id)) { status = 'registered'; icon = '📘'; }
            else if (isPrereqMet(n.id, passed)) { status = 'open'; icon = '🔓'; }

            el.className = `node-card ${status}`;
            // New internal structure matching image style
            el.innerHTML = `
                <div class="nc-header">
                    <span class="nc-code">${n.id}</span>
                    <span class="nc-icon">${icon}</span>
                </div>
                <div class="nc-body">
                    <div class="nc-name">${name}</div>
                    <div class="nc-credits">${course.credit_hours} Credits</div>
                </div>
            `;
            el.onclick = () => window.showCoursePopup(n.id, course, status, 'status_'+status, el);
        }

        container.appendChild(el);
    });
}

// --- Connection Renderer (Now Orthogonal/Straight Lines) ---
function renderConnections(edges, nodes) {
    const container = document.getElementById('plan-tree-canvas');
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("class", "tree-svg-layer");
    svg.style.width = "100%"; svg.style.height = "100%";

    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    // Dimensions needed for calculating connection points
    const COURSE_W = 180; const COURSE_H = 100;
    const ROOT_W = 250; const ROOT_H = 80; // Approx based on CSS padding

    edges.forEach(edge => {
        const sNode = nodeMap[edge.s];
        const tNode = nodeMap[edge.t];
        
        if (sNode && tNode) {
            // Calculate Source Bottom Center coordinate
            const sH = sNode.level === 0 ? ROOT_H : COURSE_H;
            const sx = sNode.cx; // Use pre-calculated center X
            const sy = sNode.y + sH; 

            // Calculate Target Top Center coordinate
            const tx = tNode.cx;
            const ty = tNode.y;

            const path = document.createElementNS(svgNs, "path");
            
            // --- ORTHOGONAL PATH LOGIC (Circuit board style) ---
            // 1. Move to source bottom (M sx sy)
            // 2. Draw vertical down to halfway point (V midY)
            // 3. Draw horizontal to target X (H tx)
            // 4. Draw vertical down to target top (V ty)
            
            const midY = sy + (ty - sy) / 2; // Midpoint between levels
            // Using SVG path commands: M=Move, V=Vertical Line, H=Horizontal Line
            const d = `M ${sx} ${sy} V ${midY} H ${tx} V ${ty}`;
            
            path.setAttribute("d", d);
            path.setAttribute("class", "connector-path");
            // Add markers if desired (e.g., arrows), but image didn't have them
            svg.appendChild(path);
        }
    });

    container.appendChild(svg);
}

// --- Helper Utils (Unchanged) ---
function isPrereqMet(code, passed) {
    const c = state.allCoursesData.find(x => x.course_code == code);
    if (!c || !c.prerequisites || !c.prerequisites.length) return true;
    return c.prerequisites.every(p => passed.has(p.prereq_code));
}

function updateZoom() {
    const canvas = document.getElementById('plan-tree-canvas');
    if(canvas) canvas.style.transform = `scale(${currentScale})`;
}

window.changeZoom = function(delta) {
    currentScale += delta;
    if (currentScale < 0.3) currentScale = 0.3; // Allow smaller zoom for big map
    if (currentScale > 1.5) currentScale = 1.5;
    updateZoom();
};

window.fitToScreen = function() {
    const wrapper = document.getElementById('tree-wrapper');
    const canvas = document.getElementById('plan-tree-canvas');
    if(!wrapper || !canvas) return;

    // Calculate scale to fit width
    const scaleX = (wrapper.clientWidth - 100) / canvas.scrollWidth;
    // Don't zoom in too much if it fits easily, limit max initial zoom
    currentScale = Math.min(Math.max(scaleX, 0.4), 1.0); 
    
    updateZoom();
    
    // Center horizontally
    setTimeout(() => {
         wrapper.scrollLeft = (wrapper.scrollWidth - wrapper.clientWidth) / 2;
    }, 50);
};

function enableDragScroll() {
    const slider = document.getElementById('tree-wrapper');
    if(!slider) return;
    let isDown = false;
    let startX, startY, scrollLeft, scrollTop;

    slider.addEventListener('mousedown', (e) => {
        // Don't drag if clicking a node
        if(e.target.closest('.node-card') || e.target.closest('.super-root-node')) return;
        isDown = true;
        slider.style.cursor = 'grabbing';
        startX = e.pageX - slider.offsetLeft;
        startY = e.pageY - slider.offsetTop;
        scrollLeft = slider.scrollLeft;
        scrollTop = slider.scrollTop;
    });
    slider.addEventListener('mouseleave', () => { isDown = false; slider.style.cursor = 'grab'; });
    slider.addEventListener('mouseup', () => { isDown = false; slider.style.cursor = 'grab'; });
    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const y = e.pageY - slider.offsetTop;
        // Slower drag speed for better control
        const walkX = (x - startX) * 1.2; 
        const walkY = (y - startY) * 1.2;
        slider.scrollLeft = scrollLeft - walkX;
        slider.scrollTop = scrollTop - walkY;
    });
}