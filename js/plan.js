// plan.js
import { supabase } from './config.js';
import { state, ROOT_SE_ID } from './state.js';

let currentScale = 1;
let globalEdges = []; 

// Groups for the side list
const ELECTIVE_GROUPS = [
    { id: 'elec_major', name: 'Major Electives', category: 'Major Elective', count: '12 Cr' },
    { id: 'elec_uni', name: 'Uni Electives', category: 'University Elective', count: '6 Cr' },
    { id: 'elec_supp', name: 'Support Electives', category: 'Support Compulsory', count: '3 Cr' }
];

export async function loadStudentPlan(userId) {
    const wrapper = document.getElementById('tree-wrapper');
    const canvas = document.getElementById('plan-tree-canvas');
    if (!wrapper || !canvas) return;

    canvas.innerHTML = '<div style="color:#fff; padding:50px; text-align:center;">Generating Plan...</div>';
    
    // Reset view
    canvas.style.transform = 'translate(0px, 0px) scale(1)';
    currentScale = 1;

    try {
        // 1. Fetch History
        const { data: history } = await supabase
            .from('enrollments')
            .select('status, sections(course_code)')
            .eq('user_id', userId)
            .in('status', ['COMPLETED', 'REGISTERED', 'ENROLLED']);

        const passed = new Set();
        const registered = new Set();
        state.userHistory = history || [];

        history?.forEach(h => {
            const code = h.sections?.course_code;
            if (h.status === 'COMPLETED') passed.add(code);
            else registered.add(code);
        });

        // 2. Ensure Course Data
        if (!state.allCoursesData || state.allCoursesData.length === 0) {
            const { data: courses } = await supabase.from('courses').select('*');
            state.allCoursesData = courses || [];
        }

        // 3. Calculate Layout (Grid/Tree)
        const layoutData = calculateTreeLayout(state.planRoots, state.planLinks);
        globalEdges = layoutData.edges;

        const ELECTIVE_AREA_WIDTH = 300; 
        const totalWidth = Math.max(wrapper.clientWidth, layoutData.width + ELECTIVE_AREA_WIDTH);
        const totalHeight = Math.max(wrapper.clientHeight, layoutData.height + 200);

        // 4. Render
        canvas.innerHTML = '';
        canvas.style.width = `${totalWidth}px`; 
        canvas.style.height = `${totalHeight}px`;

        // Draw connections FIRST
        renderOrthogonalConnections(layoutData.edges, layoutData.nodes);
        
        // Draw Nodes
        renderNodes(layoutData.nodes, passed, registered);
        
        // Render Electives to the right of the tree
        renderElectives(canvas, layoutData.width + 50); 

        // 5. Init Dragging
        initDragLogic(wrapper, canvas);

        // Center the view initially
        const startX = (wrapper.clientWidth - totalWidth) / 2;
        if (totalWidth > wrapper.clientWidth) {
            wrapper.scrollLeft = (totalWidth - wrapper.clientWidth) / 2;
        }

    } catch (err) {
        console.error("Plan Error:", err);
        canvas.innerHTML = '<div style="color:red; padding:20px;">Error loading plan.</div>';
    }
}

/**
 * Standard Tree Layout Algorithm
 */
function calculateTreeLayout(roots, links) {
    const nodes = [];
    const edges = [];
    const childrenMap = {}; 

    links.forEach(l => {
        if (!childrenMap[l.s]) childrenMap[l.s] = [];
        childrenMap[l.s].push(l.t);
    });

    const levelMap = {};
    const queue = roots.map(r => ({ id: r, level: 0 }));
    const visited = new Set();
    const levelCounts = {};

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

    const NODE_W = 200;
    const NODE_H = 75; 
    const GAP_X = 60;
    const GAP_Y = 100;
    const ROW_OFFSET = {}; 

    let minX = Infinity; let maxX = -Infinity; let maxY = 0;

    visited.forEach(nodeId => {
        const lvl = levelMap[nodeId];
        const countInRow = levelCounts[lvl];
        
        if (typeof ROW_OFFSET[lvl] === 'undefined') ROW_OFFSET[lvl] = 0;
        
        const rowTotalWidth = countInRow * NODE_W + (countInRow - 1) * GAP_X;
        const rowStart = -(rowTotalWidth / 2);
        
        let x, y;
        
        if (lvl === 0) {
             x = 0; 
             y = 60;
        } else {
             x = rowStart + (ROW_OFFSET[lvl] * (NODE_W + GAP_X)) + (NODE_W / 2);
             y = 60 + (lvl * (NODE_H + GAP_Y));
        }

        if (x < minX) minX = x;
        if (x + NODE_W > maxX) maxX = x + NODE_W;
        if (y + NODE_H > maxY) maxY = y + NODE_H;

        nodes.push({ 
            id: nodeId, 
            left: x, 
            top: y,  
            cx: x + (lvl === 0 ? 0 : 0), 
            cy: y + (lvl === 0 ? 50 : NODE_H/2),
            level: lvl
        });
        
        ROW_OFFSET[lvl]++;
    });

    const PADDING_LEFT = 100;
    const xShift = Math.abs(minX) + PADDING_LEFT;

    const finalNodes = nodes.map(n => ({
        ...n,
        left: n.left + xShift,
        cx: n.left + xShift + (n.id === ROOT_SE_ID ? 0 : NODE_W/2), 
        cy: n.top + (n.id === ROOT_SE_ID ? 100 : NODE_H/2) 
    }));

    return { 
        nodes: finalNodes, 
        edges: edges, 
        width: maxX + xShift + PADDING_LEFT,
        height: maxY + 150
    };
}

function renderNodes(nodes, passed, registered) {
    const container = document.getElementById('plan-tree-canvas');
    
    nodes.forEach(n => {
        const el = document.createElement('div');
        el.style.left = `${n.left}px`;
        el.style.top = `${n.top}px`;
        el.id = `node-${n.id}`; // CRITICAL: ID must match highlight logic

        // Event Listeners for Recursive Trace
        el.onmouseenter = () => highlightTrace(n.id);
        el.onmouseleave = () => resetTrace();

        if (n.id === ROOT_SE_ID) {
            el.className = 'super-root-node';
            el.innerHTML = `
                <div class="sr-title">Software Engineering</div>
                <div class="sr-subtitle">132 Hours</div>
            `;
            el.style.transform = "translateX(-50%)"; 
        } 
        else {
            const course = state.allCoursesData.find(c => c.course_code == n.id) 
                           || { course_name_en: n.id, credit_hours: 3, course_code: n.id };
            
            const name = state.currentLang === 'ar' ? (course.course_name_ar || course.course_name_en) : course.course_name_en;

            let status = 'locked';
            let icon = '🔒'; 
            
            if (passed.has(n.id)) { status = 'passed'; icon = '✔'; } 
            else if (registered.has(n.id)) { status = 'registered'; icon = '⏳'; } 
            else if (isPrereqMet(n.id, passed)) { status = 'open'; icon = '🔓'; }

            el.className = `node-card ${status}`;
            
            el.innerHTML = `
                <div class="nc-status-bar"></div>
                <div class="nc-content">
                    <div class="nc-name">${name}</div>
                    <div class="nc-code">${course.course_code}</div>
                </div>
                <div class="nc-credits-badge">${course.credit_hours} Cr</div>
                <div class="nc-icon-wrapper">
                    <span class="nc-icon">${icon}</span>
                </div>
            `;
            
            el.onclick = () => window.showCoursePopup(course, status);
        }
        container.appendChild(el);
    });
}

function renderOrthogonalConnections(edges, nodes) {
    const container = document.getElementById('plan-tree-canvas');
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("class", "tree-svg-layer");
    svg.style.width = "100%"; svg.style.height = "100%";

    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    edges.forEach(edge => {
        const s = nodeMap[edge.s];
        const t = nodeMap[edge.t];
        
        if (s && t) {
            const sx = s.cx; 
            const sy = s.top + (s.id === ROOT_SE_ID ? 80 : 75); 
            const tx = t.cx; 
            const ty = t.top;
            
            // To prevent lines from overlapping exactly, we add a tiny random jitter
            // or we could use levels. For now, a clean midY is sufficient.
            const midY = sy + (ty - sy) / 2;
            
            const d = `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
            
            const path = document.createElementNS(svgNs, "path");
            path.setAttribute("d", d);
            path.setAttribute("class", "connector-path");
            
            // CRITICAL: ID must match highlight logic (String conversion)
            path.setAttribute("id", `path-${String(edge.s)}-${String(edge.t)}`);
            
            svg.appendChild(path);
        }
    });
    container.appendChild(svg);
}

function renderElectives(canvas, startX) {
    const groupContainer = document.createElement('div');
    groupContainer.className = 'elective-group-container';
    groupContainer.style.left = `${startX}px`;
    groupContainer.style.top = '120px'; 
    
    const title = document.createElement('div');
    title.className = 'elective-section-title';
    title.innerText = 'Electives';
    groupContainer.appendChild(title);

    ELECTIVE_GROUPS.forEach(group => {
        const btn = document.createElement('div');
        btn.className = 'elective-card-btn';
        btn.innerHTML = `
            <div class="ecb-icon">⚡</div>
            <div class="ecb-info">
                <div class="ecb-title">${group.name}</div>
                <div class="ecb-sub">${group.count}</div>
            </div>
            <div class="ecb-arrow">→</div>
        `;
        btn.onclick = () => openElectiveDrawer(group);
        groupContainer.appendChild(btn);
    });

    canvas.appendChild(groupContainer);
}

// --- Interactions ---

function initDragLogic(wrapper, canvas) {
    let isDown = false;
    let startX, startY, scrollLeft, scrollTop;

    wrapper.addEventListener('mousedown', (e) => {
        if(e.target.closest('.node-card') || e.target.closest('.elective-card-btn')) return;
        isDown = true;
        wrapper.style.cursor = 'grabbing';
        startX = e.pageX - wrapper.offsetLeft;
        startY = e.pageY - wrapper.offsetTop;
        scrollLeft = wrapper.scrollLeft;
        scrollTop = wrapper.scrollTop;
    });

    wrapper.addEventListener('mouseleave', () => { isDown = false; wrapper.style.cursor = 'grab'; });
    wrapper.addEventListener('mouseup', () => { isDown = false; wrapper.style.cursor = 'grab'; });
    
    wrapper.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - wrapper.offsetLeft;
        const y = e.pageY - wrapper.offsetTop;
        const walkX = (x - startX); 
        const walkY = (y - startY);
        wrapper.scrollLeft = scrollLeft - walkX;
        wrapper.scrollTop = scrollTop - walkY;
    });
}

// --- RECURSIVE TRACE LOGIC ---
function highlightTrace(nodeId) {
    const canvas = document.getElementById('plan-tree-canvas');
    if(!canvas) return;
    
    // 1. Activate Canvas Mode (Dim everything else)
    canvas.classList.add('canvas-hovered');

    // 2. Identify all connected nodes/edges
    const activeNodes = new Set();
    const activeEdges = new Set();

    // Helper: Trace Up (Parents)
    function traceUp(currId) {
        if(activeNodes.has(currId)) return;
        activeNodes.add(currId);
        
        // Find edges where target == currId
        globalEdges.forEach(edge => {
            if(String(edge.t) === String(currId)) {
                activeEdges.add(`path-${edge.s}-${edge.t}`);
                traceUp(edge.s);
            }
        });
    }

    // Helper: Trace Down (Children)
    function traceDown(currId) {
        // Note: We don't stop if visited because we might reach a node from a different path
        // but for simple trees Set check is fine.
        activeNodes.add(currId);

        // Find edges where source == currId
        globalEdges.forEach(edge => {
            if(String(edge.s) === String(currId)) {
                activeEdges.add(`path-${edge.s}-${edge.t}`);
                traceDown(edge.t);
            }
        });
    }

    // Start Trace
    traceUp(nodeId);
    traceDown(nodeId);

    // 3. Apply CSS Classes
    activeNodes.forEach(nid => {
        const el = document.getElementById(`node-${nid}`);
        if(el) el.classList.add('active-node');
    });

    activeEdges.forEach(eid => {
        const el = document.getElementById(eid);
        if(el) el.classList.add('active-path');
    });
}

function resetTrace() {
    const canvas = document.getElementById('plan-tree-canvas');
    if(!canvas) return;
    canvas.classList.remove('canvas-hovered');
    
    // Remove all active classes
    const activeNodes = canvas.querySelectorAll('.active-node');
    activeNodes.forEach(el => el.classList.remove('active-node'));
    
    const activePaths = canvas.querySelectorAll('.active-path');
    activePaths.forEach(el => el.classList.remove('active-path'));
}

function isPrereqMet(code, passed) {
    const c = state.allCoursesData.find(x => x.course_code == code);
    if (!c || !c.prerequisites || !c.prerequisites.length) return true;
    return c.prerequisites.every(p => passed.has(p.prereq_code));
}

// --- Popup & Drawer Functions ---

window.showCoursePopup = function(course, status) {
    const popup = document.getElementById('course-popup');
    const overlay = document.getElementById('plan-overlay');
    if(!popup || !overlay) return;

    document.getElementById('popup-title').innerText = course.course_name_en || course.course_code;
    
    const desc = course.description || "This course introduces fundamental concepts in " + course.course_name_en + ". Students will learn key methodologies and apply them in practical scenarios.";
    document.getElementById('popup-desc').innerText = course.course_code;
    document.getElementById('popup-long-desc').innerText = desc;
    
    document.getElementById('popup-credits').innerText = `${course.credit_hours} Credit Hours`;
    
    const statusBadge = document.getElementById('popup-status');
    statusBadge.innerText = status.toUpperCase();
    statusBadge.className = 'badge'; 
    if(status === 'passed') statusBadge.classList.add('badge-green');
    else if(status === 'registered') statusBadge.classList.add('badge-blue');
    else if(status === 'open') statusBadge.classList.add('badge-yellow');
    else statusBadge.classList.add('badge-gray');

    popup.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

window.closePlanPopup = function() {
    document.getElementById('course-popup')?.classList.add('hidden');
    document.getElementById('plan-overlay')?.classList.add('hidden');
}

async function openElectiveDrawer(group) {
    const drawer = document.getElementById('elective-drawer');
    const overlay = document.getElementById('elective-drawer-overlay');
    const listContainer = document.getElementById('drawer-content');
    const titleEl = document.getElementById('drawer-title');
    
    if(!drawer) return;
    
    titleEl.textContent = group.name;
    listContainer.innerHTML = '';
    
    const relevantCourses = state.allCoursesData.filter(c => 
        c.category && c.category.toLowerCase().includes(group.category.toLowerCase())
    );

    relevantCourses.forEach(course => {
        const item = document.createElement('div');
        item.className = 'drawer-item';
        
        item.innerHTML = `
            <div class="di-header">
                <span class="di-code">${course.course_code}</span>
                <span class="di-credits">${course.credit_hours} Cr</span>
            </div>
            <div class="di-name">${course.course_name_en}</div>
        `;
        listContainer.appendChild(item);
    });

    drawer.classList.add('open');
    overlay.classList.add('open');
}

window.closeDrawer = function() {
    document.getElementById('elective-drawer')?.classList.remove('open');
    document.getElementById('elective-drawer-overlay')?.classList.remove('open');
}