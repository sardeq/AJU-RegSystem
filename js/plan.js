// plan.js
import { supabase } from './config.js';
import { state, ROOT_SE_ID } from './state.js';

// --- Zoom & Pan State ---
let transformState = {
    scale: 0.75, // Default zoomed out "a bit more"
    x: 0,
    y: 0
};
let isDragging = false;
let startX = 0;
let startY = 0;
let globalEdges = []; 

const ELECTIVE_GROUPS = [
    { 
        id: 'elec_major', 
        name: 'Major Electives', 
        category: 'Major Elective', 
        count: '12 Cr',
        icon: '⚡',
        cssClass: 'stack-major'
    },
    { 
        id: 'elec_uni', 
        name: 'Uni Electives', 
        category: 'University Elective', 
        count: '6 Cr', 
        icon: '🏛️',
        cssClass: 'stack-uni'
    },
    { 
        id: 'elec_supp', 
        name: 'Support Electives', 
        category: 'Support Compulsory', 
        count: '3 Cr', 
        icon: '🛠️',
        cssClass: 'stack-supp'
    }
];

export async function loadStudentPlan(userId) {
    const wrapper = document.getElementById('tree-wrapper');
    const canvas = document.getElementById('plan-tree-canvas');
    if (!wrapper || !canvas) return;

    canvas.innerHTML = '<div style="color:#fff; padding:50px; text-align:center;">Generating Plan...</div>';
    
    // Reset State
    transformState = { scale: 0.75, x: 0, y: 0 };
    updateTransform();

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

        // 4. Render
        canvas.innerHTML = '';
        // Note: Width/Height on canvas aren't strictly necessary with infinite pan/zoom 
        // but can help with bounds if needed. We'll leave them unset or large.
        canvas.style.width = `${layoutData.width + 500}px`; 
        canvas.style.height = `${layoutData.height + 500}px`;

        // Draw connections FIRST
        renderOrthogonalConnections(layoutData.edges, layoutData.nodes);
        
        // Draw Nodes
        renderNodes(layoutData.nodes, passed, registered);
        
        // Render Electives to the right of the tree
        renderElectives(canvas, layoutData.width + 50); 

        // 5. Center the View Initially
        centerView(wrapper, layoutData.width);

        // 6. Init Zoom/Pan Logic
        initZoomPanLogic(wrapper, canvas);

    } catch (err) {
        console.error("Plan Error:", err);
        canvas.innerHTML = '<div style="color:red; padding:20px;">Error loading plan.</div>';
    }
}

// --- NEW ZOOM & PAN LOGIC ---
function initZoomPanLogic(wrapper, canvas) {
    // 1. Wheel Zoom
    wrapper.onwheel = (e) => {
        e.preventDefault();

        const zoomIntensity = 0.001; // Sensitivity
        const delta = -e.deltaY * zoomIntensity;
        const oldScale = transformState.scale;
        
        // Calculate new scale with limits
        let newScale = oldScale + delta;
        newScale = Math.min(Math.max(0.2, newScale), 3); // Min 0.2x, Max 3x

        // Calculate mouse position relative to the canvas
        const rect = wrapper.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Math to zoom towards the mouse cursor
        // (mouseX - x) / oldScale = (mouseX - newX) / newScale
        transformState.x = mouseX - (mouseX - transformState.x) * (newScale / oldScale);
        transformState.y = mouseY - (mouseY - transformState.y) * (newScale / oldScale);
        transformState.scale = newScale;

        updateTransform();
    };

    // 2. Drag Panning
    wrapper.onmousedown = (e) => {
        if(e.target.closest('.node-card') || e.target.closest('.elective-stack')) return;
        isDragging = true;
        startX = e.clientX - transformState.x;
        startY = e.clientY - transformState.y;
        wrapper.style.cursor = 'grabbing';
    };

    window.onmouseup = () => {
        isDragging = false;
        wrapper.style.cursor = 'grab';
    };

    window.onmousemove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        transformState.x = e.clientX - startX;
        transformState.y = e.clientY - startY;
        updateTransform();
    };
}

function updateTransform() {
    const canvas = document.getElementById('plan-tree-canvas');
    if(canvas) {
        canvas.style.transform = `translate(${transformState.x}px, ${transformState.y}px) scale(${transformState.scale})`;
    }
}

function centerView(wrapper, contentWidth) {
    // Centers the tree horizontally, with some padding from top
    const wrapperWidth = wrapper.clientWidth;
    
    // x = (ContainerWidth - (ContentWidth * Scale)) / 2
    transformState.x = (wrapperWidth - (contentWidth * transformState.scale)) / 2;
    transformState.y = 50; // Slight top padding
    
    updateTransform();
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
        el.id = `node-${n.id}`; 

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
            
            const midY = sy + (ty - sy) / 2;
            
            const d = `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
            
            const path = document.createElementNS(svgNs, "path");
            path.setAttribute("d", d);
            path.setAttribute("class", "connector-path");
            path.setAttribute("id", `path-${String(edge.s)}-${String(edge.t)}`);
            
            svg.appendChild(path);
        }
    });
    container.appendChild(svg);
}

function renderElectives(canvas, startX) {
    const zone = document.createElement('div');
    zone.className = 'elective-zone';
    
    // Position it relative to the tree width (startX)
    zone.style.left = `${startX + 40}px`; 
    zone.style.top = '100px'; 
    
    const label = document.createElement('div');
    label.className = 'zone-label';
    label.innerText = 'Elective Bank';
    zone.appendChild(label);

    ELECTIVE_GROUPS.forEach(group => {
        const stack = document.createElement('div');
        stack.className = `elective-stack ${group.cssClass}`;
        
        stack.innerHTML = `
            <div class="es-icon-box">${group.icon}</div>
            <div class="es-content">
                <h4>${group.name}</h4>
                <span>${group.count} Required</span>
            </div>
            <div class="es-arrow">➔</div>
        `;
        
        // Stop drag propagation so we can click cleanly
        stack.onmousedown = (e) => e.stopPropagation();
        stack.onclick = () => openElectiveDrawer(group);
        
        zone.appendChild(stack);
    });

    canvas.appendChild(zone);
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
    const content = document.getElementById('drawer-content');
    const title = document.getElementById('drawer-title');
    
    if(!drawer) return;

    // Set Header
    title.innerHTML = `
        <span style="font-size:0.9rem; color:#888; display:block; margin-bottom:5px;">Module Group</span>
        ${group.name}
    `;
    title.className = 'drawer-title-large'; // Apply new class
    
    content.innerHTML = ''; // Clear previous

    // Filter Courses
    const relevantCourses = state.allCoursesData.filter(c => 
        c.category && c.category.toLowerCase().includes(group.category.toLowerCase())
    );

    if(relevantCourses.length === 0) {
        content.innerHTML = '<div style="color:#666; text-align:center; padding:20px;">No courses found in this category.</div>';
    }

    relevantCourses.forEach(course => {
        // Check if user has passed (simple check based on state.userHistory)
        const isPassed = state.userHistory?.some(h => 
            h.sections?.course_code === course.course_code && h.status === 'COMPLETED'
        );
        
        const item = document.createElement('div');
        item.className = 'drawer-item';
        // Add specific border color based on group
        if(isPassed) item.style.borderColor = 'rgba(46, 204, 113, 0.5)';
        
        item.innerHTML = `
            <div class="di-check" style="background:${isPassed ? '#2ecc71' : 'transparent'}; border-color:${isPassed ? '#2ecc71' : '#444'}"></div>
            <div class="di-content">
                <div class="di-top">
                    <span class="di-code">${course.course_code}</span>
                    <span class="di-cr">${course.credit_hours} Cr</span>
                </div>
                <div class="di-name">${state.currentLang === 'ar' ? (course.course_name_ar || course.course_name_en) : course.course_name_en}</div>
            </div>
        `;
        content.appendChild(item);
    });

    drawer.classList.add('open');
    overlay.classList.add('open');
}

window.closeDrawer = function() {
    document.getElementById('elective-drawer')?.classList.remove('open');
    document.getElementById('elective-drawer-overlay')?.classList.remove('open');
}