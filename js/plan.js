// plan.js
import { supabase } from './config.js';
import { state, ROOT_SE_ID } from './state.js';

let currentScale = 1;
// Store graph data globally for hover lookup
let globalEdges = []; 

export async function loadStudentPlan(userId) {
    const canvas = document.getElementById('plan-tree-canvas');
    if (!canvas) return;

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
        const layoutData = calculateTreeLayout(state.planRoots, state.planLinks);
        
        // Save edges for hover logic
        globalEdges = layoutData.edges;

        // 4. Render
        canvas.innerHTML = '';
        canvas.style.width = `${layoutData.width + 100}px`; 
        canvas.style.height = `${layoutData.height + 100}px`;

        renderConnections(layoutData.edges, layoutData.nodes);
        renderNodes(layoutData.nodes, passed, registered);

        // 5. Setup
        setTimeout(fitToScreen, 100);
        enableDragScroll();

    } catch (err) {
        console.error("Plan Error:", err);
        canvas.innerHTML = '<div style="color:red; padding:20px;">Error loading plan map.</div>';
    }
}

// --- Layout Engine ---
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

    const NODE_WIDTH = 180;
    const NODE_HEIGHT = 100;
    const GAP_X = 40;
    const GAP_Y = 100;

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
        
        let x, y;
        if (lvl === 0) {
             x = -(250 / 2); 
             y = 50;
        } else {
             x = rowStart + (rowPlacement[lvl] * (NODE_WIDTH + GAP_X));
             y = 50 + (lvl * (NODE_HEIGHT + GAP_Y)) + (lvl === 1 ? 40 : 0);
        }

        if (x < minX) minX = x;
        if (x + NODE_WIDTH > maxX) maxX = x + NODE_WIDTH;
        if (y + NODE_HEIGHT > maxY) maxY = y + NODE_HEIGHT;

        nodes.push({ id: nodeId, rawX: x, y: y, level: lvl });
        rowPlacement[lvl]++;
    });

    const PADDING_LEFT = 50;
    const shiftX = PADDING_LEFT - minX;

    const finalNodes = nodes.map(n => ({
        ...n,
        x: n.rawX + shiftX,
        cx: n.rawX + shiftX + (n.level === 0 ? 125 : NODE_WIDTH / 2) 
    }));

    return { 
        nodes: finalNodes, 
        edges: edges, 
        width: (maxX - minX) + (PADDING_LEFT * 2),
        height: maxY + 100
    };
}

// --- Node Renderer (With Hover Events) ---
function renderNodes(nodes, passed, registered) {
    const container = document.getElementById('plan-tree-canvas');
    
    nodes.forEach(n => {
        const el = document.createElement('div');
        el.style.left = `${n.x}px`;
        el.style.top = `${n.y}px`;
        el.id = `node-${n.id}`;

        // Add Hover Events for Highlighting
        el.onmouseenter = () => highlightTrace(n.id);
        el.onmouseleave = () => resetTrace();

        if (n.id === ROOT_SE_ID) {
            el.className = 'super-root-node';
            el.innerHTML = `
                <div class="sr-title">Software Engineering</div>
                <div class="sr-subtitle">132 Credit Hours</div>
            `;
        } else {
            const course = state.allCoursesData.find(c => c.course_code == n.id) || { course_name_en: n.id, credit_hours: 3 };
            const name = state.currentLang === 'ar' ? (course.course_name_ar || course.course_name_en) : course.course_name_en;

            let status = 'locked';
            let icon = '🔒';
            if (passed.has(n.id)) { status = 'passed'; icon = '✅'; }
            else if (registered.has(n.id)) { status = 'registered'; icon = '📘'; }
            else if (isPrereqMet(n.id, passed)) { status = 'open'; icon = '🔓'; }

            el.className = `node-card ${status}`;
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

// --- Connection Renderer (Orthogonal + IDs) ---
function renderConnections(edges, nodes) {
    const container = document.getElementById('plan-tree-canvas');
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("class", "tree-svg-layer");
    svg.style.width = "100%"; svg.style.height = "100%";

    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    const COURSE_H = 100;
    const ROOT_H = 80;

    edges.forEach(edge => {
        const sNode = nodeMap[edge.s];
        const tNode = nodeMap[edge.t];
        
        if (sNode && tNode) {
            const sH = sNode.level === 0 ? ROOT_H : COURSE_H;
            const sx = sNode.cx; 
            const sy = sNode.y + sH; 
            const tx = tNode.cx;
            const ty = tNode.y;

            const path = document.createElementNS(svgNs, "path");
            
            const midY = sy + (ty - sy) / 2;
            const d = `M ${sx} ${sy} V ${midY} H ${tx} V ${ty}`;
            
            path.setAttribute("d", d);
            path.setAttribute("class", "connector-path");
            
            // Add ID to path so we can find it easily during hover
            // ID Format: path-[source]-[target]
            path.setAttribute("id", `path-${edge.s}-${edge.t}`);
            
            svg.appendChild(path);
        }
    });

    container.appendChild(svg);
}

// --- Interaction Logic: Trace Highlighting ---
function highlightTrace(nodeId) {
    const canvas = document.getElementById('plan-tree-canvas');
    if(!canvas) return;

    // 1. Dim everything
    canvas.classList.add('canvas-hovered');

    // 2. Highlight Self
    const self = document.getElementById(`node-${nodeId}`);
    if(self) self.classList.add('active-node');

    // 3. Highlight Downstream (Children)
    // Find all edges where this node is the source
    globalEdges.forEach(edge => {
        if(edge.s === nodeId) {
            // Highlight Edge
            const path = document.getElementById(`path-${edge.s}-${edge.t}`);
            if(path) path.classList.add('active-path');
            
            // Highlight Child Node
            const child = document.getElementById(`node-${edge.t}`);
            if(child) child.classList.add('active-node');
        }
    });

    // 4. Highlight Upstream (Parents)
    // Find all edges where this node is the target
    globalEdges.forEach(edge => {
        if(edge.t === nodeId) {
            // Highlight Edge
            const path = document.getElementById(`path-${edge.s}-${edge.t}`);
            if(path) path.classList.add('active-path');
            
            // Highlight Parent Node
            const parent = document.getElementById(`node-${edge.s}`);
            if(parent) parent.classList.add('active-node');
        }
    });
}

function resetTrace() {
    const canvas = document.getElementById('plan-tree-canvas');
    if(!canvas) return;

    // Remove dimming class
    canvas.classList.remove('canvas-hovered');

    // Remove all active classes
    canvas.querySelectorAll('.active-node').forEach(el => el.classList.remove('active-node'));
    canvas.querySelectorAll('.active-path').forEach(el => el.classList.remove('active-path'));
}

// --- Utils ---
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
    if (currentScale < 0.3) currentScale = 0.3;
    if (currentScale > 1.5) currentScale = 1.5;
    updateZoom();
};

window.fitToScreen = function() {
    const wrapper = document.getElementById('tree-wrapper');
    const canvas = document.getElementById('plan-tree-canvas');
    if(!wrapper || !canvas) return;

    const scaleX = (wrapper.clientWidth - 100) / canvas.scrollWidth;
    currentScale = Math.min(Math.max(scaleX, 0.4), 1.0); 
    
    updateZoom();
    
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
        const walkX = (x - startX) * 1.2; 
        const walkY = (y - startY) * 1.2;
        slider.scrollLeft = scrollLeft - walkX;
        slider.scrollTop = scrollTop - walkY;
    });
}