// plan.js
import { supabase } from './config.js';
import { state } from './state.js';

let currentScale = 1;

export async function loadStudentPlan(userId) {
    const canvas = document.getElementById('plan-tree-canvas');
    if (!canvas) return;

    // Reset layout
    canvas.innerHTML = '';
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

        // 3. Build & Normalize Layout
        const layoutData = calculateTreeLayout(state.planRoots, state.planLinks);
        
        // 4. Resize Canvas to Fit Content
        canvas.style.width = `${layoutData.width}px`;
        canvas.style.height = `${layoutData.height}px`;

        // 5. Render Lines FIRST (so they are behind nodes)
        renderConnections(layoutData.edges, layoutData.nodes);
        
        // 6. Render Nodes
        renderNodes(layoutData.nodes, passed, registered);

        // 7. Initialize Dragging
        enableDragScroll();

    } catch (err) {
        console.error("Plan Error:", err);
    }
}

function calculateTreeLayout(roots, links) {
    const nodes = [];
    const edges = [];
    const levelMap = {}; 
    const childrenMap = {}; 

    // 1. Build Adjacency Map
    links.forEach(l => {
        if (!childrenMap[l.s]) childrenMap[l.s] = [];
        childrenMap[l.s].push(l.t);
    });

    // 2. BFS for Levels
    const queue = roots.map(r => ({ id: r, level: 0 }));
    const visited = new Set();
    const levelCounts = {}; // How many nodes at each level

    const NODE_WIDTH = 160;
    const NODE_HEIGHT = 90;
    const GAP_X = 60;
    const GAP_Y = 150;

    // BFS Traversal
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

    // 3. Initial Placement (Centered around 0)
    const rowPlacement = {}; // Track how many we've placed in this row so far
    let minX = Infinity;
    let maxX = -Infinity;
    let maxY = 0;

    visited.forEach(nodeId => {
        const lvl = levelMap[nodeId];
        const countInRow = levelCounts[lvl];
        
        if (typeof rowPlacement[lvl] === 'undefined') rowPlacement[lvl] = 0;
        
        // Calculate row width to center it
        const rowWidth = countInRow * NODE_WIDTH + (countInRow - 1) * GAP_X;
        const rowStart = -(rowWidth / 2); // Start centering around 0
        
        const x = rowStart + (rowPlacement[lvl] * (NODE_WIDTH + GAP_X));
        const y = 50 + (lvl * (NODE_HEIGHT + GAP_Y)); // 50px top padding

        if (x < minX) minX = x;
        if (x + NODE_WIDTH > maxX) maxX = x + NODE_WIDTH;
        if (y + NODE_HEIGHT > maxY) maxY = y + NODE_HEIGHT;

        nodes.push({ id: nodeId, rawX: x, y: y });
        rowPlacement[lvl]++;
    });

    // 4. Normalization (Shift everything right so minX becomes 50)
    const PADDING_LEFT = 50;
    const shiftX = PADDING_LEFT - minX;

    const finalNodes = nodes.map(n => ({
        id: n.id,
        x: n.rawX + shiftX,
        y: n.y
    }));

    return { 
        nodes: finalNodes, 
        edges: edges, 
        width: (maxX - minX) + (PADDING_LEFT * 2),
        height: maxY + 100
    };
}

function renderNodes(nodes, passed, registered) {
    const container = document.getElementById('plan-tree-canvas');
    
    nodes.forEach(n => {
        const course = state.allCoursesData.find(c => c.course_code == n.id) || { course_name_en: n.id, credit_hours: 3 };
        const name = state.currentLang === 'ar' ? (course.course_name_ar || course.course_name_en) : course.course_name_en;

        let status = 'locked';
        if (passed.has(n.id)) status = 'passed';
        else if (registered.has(n.id)) status = 'registered';
        else if (isPrereqMet(n.id, passed)) status = 'open';

        const el = document.createElement('div');
        el.className = `node-card ${status}`;
        el.id = `node-${n.id}`; 
        el.style.left = `${n.x}px`;
        el.style.top = `${n.y}px`;
        
        el.innerHTML = `
            <div class="nc-code">${n.id}</div>
            <div class="nc-name">${name}</div>
            <div class="nc-credits">${course.credit_hours} Cr</div>
        `;

        el.onclick = () => window.showCoursePopup(n.id, course, status, 'status_'+status, el);
        container.appendChild(el);
    });
}

function renderConnections(edges, nodes) {
    const container = document.getElementById('plan-tree-canvas');
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNs, "svg");
    
    // --- FIX IS HERE: Use setAttribute instead of .className ---
    svg.setAttribute("class", "tree-svg-layer");
    
    // Set SVG to full size of canvas to ensure lines aren't cut off
    svg.style.width = "100%";
    svg.style.height = "100%";

    const NODE_WIDTH = 160;
    const NODE_HEIGHT = 90; 

    // Helper to find node coordinates quickly
    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    edges.forEach(edge => {
        const sNode = nodeMap[edge.s];
        const tNode = nodeMap[edge.t];
        
        if (sNode && tNode) {
            const sx = sNode.x + NODE_WIDTH / 2;
            const sy = sNode.y + NODE_HEIGHT; // Bottom of source
            const tx = tNode.x + NODE_WIDTH / 2;
            const ty = tNode.y; // Top of target

            const path = document.createElementNS(svgNs, "path");
            
            // Curve logic: Down from source, Up from target
            const c1x = sx; const c1y = sy + 60;
            const c2x = tx; const c2y = ty - 60;
            
            const d = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`;
            
            path.setAttribute("d", d);
            path.setAttribute("class", "connector-path");
            svg.appendChild(path);
        }
    });

    container.appendChild(svg);
}

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
    if (currentScale < 0.4) currentScale = 0.4;
    if (currentScale > 1.5) currentScale = 1.5;
    updateZoom();
};

window.fitToScreen = function() {
    currentScale = 0.8;
    updateZoom();
    const wrapper = document.getElementById('tree-wrapper');
    // Center scroll
    wrapper.scrollLeft = (wrapper.scrollWidth - wrapper.clientWidth) / 2;
};

function enableDragScroll() {
    const slider = document.getElementById('tree-wrapper');
    let isDown = false;
    let startX, startY, scrollLeft, scrollTop;

    slider.addEventListener('mousedown', (e) => {
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
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        slider.scrollLeft = scrollLeft - walkX;
        slider.scrollTop = scrollTop - walkY;
    });
}