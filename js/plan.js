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

        const ELECTIVE_AREA_WIDTH = 250; 
        const totalWidth = Math.max(wrapper.clientWidth, layoutData.width + ELECTIVE_AREA_WIDTH);
        const totalHeight = Math.max(wrapper.clientHeight, layoutData.height + 200);

        // 4. Render
        canvas.innerHTML = '';
        canvas.style.width = `${totalWidth}px`; 
        canvas.style.height = `${totalHeight}px`;

        // Draw connections FIRST so they are behind nodes
        renderOrthogonalConnections(layoutData.edges, layoutData.nodes);
        
        // Draw Nodes
        renderNodes(layoutData.nodes, passed, registered);
        
        // Render Electives to the right of the tree
        renderElectives(canvas, layoutData.width + 50); 

        // 5. Init Dragging
        initDragLogic(wrapper, canvas);

        // Center the view initially
        const startX = (wrapper.clientWidth - totalWidth) / 2;
        // If content is wider than screen, scroll to center
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
 * Returns nodes with {x, y, id} and width/height of tree
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

    // BFS to assign levels
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

    // Grid Settings
    const NODE_W = 200;
    const NODE_H = 70;
    const GAP_X = 50;
    const GAP_Y = 100;
    const ROW_OFFSET = {}; // Track X position per level

    let minX = Infinity; let maxX = -Infinity; let maxY = 0;

    // Position Nodes
    visited.forEach(nodeId => {
        const lvl = levelMap[nodeId];
        const countInRow = levelCounts[lvl];
        
        if (typeof ROW_OFFSET[lvl] === 'undefined') ROW_OFFSET[lvl] = 0;
        
        // Center the row based on number of items
        const rowTotalWidth = countInRow * NODE_W + (countInRow - 1) * GAP_X;
        const rowStart = -(rowTotalWidth / 2);
        
        let x, y;
        
        // Level 0 (Super Root)
        if (lvl === 0) {
             x = 0; // Centered at 0
             y = 60;
        } else {
             x = rowStart + (ROW_OFFSET[lvl] * (NODE_W + GAP_X)) + (NODE_W / 2);
             y = 60 + (lvl * (NODE_H + GAP_Y));
        }

        // Adjust constraints
        if (x < minX) minX = x;
        if (x + NODE_W > maxX) maxX = x + NODE_W;
        if (y + NODE_H > maxY) maxY = y + NODE_H;

        // Store center points for lines
        nodes.push({ 
            id: nodeId, 
            left: x, // CSS left
            top: y,  // CSS top
            cx: x + (lvl === 0 ? 0 : 0), // Center X for lines (adjusted in render)
            cy: y + (lvl === 0 ? 50 : NODE_H/2),
            level: lvl
        });
        
        ROW_OFFSET[lvl]++;
    });

    // Shift everything so minX is positive (plus padding)
    const PADDING_LEFT = 100;
    const xShift = Math.abs(minX) + PADDING_LEFT;

    const finalNodes = nodes.map(n => ({
        ...n,
        left: n.left + xShift,
        cx: n.left + xShift + (n.id === ROOT_SE_ID ? 0 : NODE_W/2), // Center point
        cy: n.top + (n.id === ROOT_SE_ID ? 100 : NODE_H/2) // Connection point
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

        // Event Listeners for tracing
        el.onmouseenter = () => highlightTrace(n.id);
        el.onmouseleave = () => resetTrace();

        // 1. SUPER ROOT (The Title Bubble)
        if (n.id === ROOT_SE_ID) {
            el.className = 'super-root-node';
            el.innerHTML = `
                <div class="sr-title">Software Engineering</div>
                <div class="sr-subtitle">Plan 2021 • 132 Hours</div>
            `;
            // Center the super root visually
            el.style.transform = "translateX(-50%)"; 
        } 
        // 2. COURSE CARDS
        else {
            const course = state.allCoursesData.find(c => c.course_code == n.id) 
                           || { course_name_en: n.id, credit_hours: 3 };
            
            const name = state.currentLang === 'ar' ? (course.course_name_ar || course.course_name_en) : course.course_name_en;

            // Determine Status
            let status = 'locked';
            let icon = '🔒'; // Default Lock
            
            if (passed.has(n.id)) { 
                status = 'passed'; 
                icon = '✔'; 
            } else if (registered.has(n.id)) { 
                status = 'registered'; 
                icon = '⏳'; 
            } else if (isPrereqMet(n.id, passed)) { 
                status = 'open'; 
                icon = '🔓'; 
            }

            el.className = `node-card ${status}`;
            
            // New HTML Structure matching the image style
            el.innerHTML = `
                <div class="nc-status-bar"></div>
                <div class="nc-content">
                    <div class="nc-header">
                        <span class="nc-name">${name}</span>
                    </div>
                    <div class="nc-credits">${course.credit_hours} Credits</div>
                </div>
                <div class="nc-icon-wrapper">
                    <span class="nc-icon">${icon}</span>
                </div>
            `;
            
            el.onclick = () => window.showCoursePopup(n.id, course, status);
        }
        container.appendChild(el);
    });
}

function renderOrthogonalConnections(edges, nodes) {
    const container = document.getElementById('plan-tree-canvas');
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("class", "tree-svg-layer");
    
    // Ensure SVG covers full scrollable area
    svg.style.width = "100%"; 
    svg.style.height = "100%";

    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    edges.forEach(edge => {
        const s = nodeMap[edge.s];
        const t = nodeMap[edge.t];
        
        if (s && t) {
            // Calculate coordinates
            // Source is usually bottom center of parent
            const sx = s.cx; 
            const sy = s.top + (s.id === ROOT_SE_ID ? 80 : 70); // 80 is height of super node approx
            
            // Target is top center of child
            const tx = t.cx; 
            const ty = t.top;

            const path = document.createElementNS(svgNs, "path");
            
            // Orthogonal Logic: Down -> Across -> Down
            const midY = sy + (ty - sy) / 2;
            
            // Path Data
            const d = `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
            
            path.setAttribute("d", d);
            path.setAttribute("class", "connector-path");
            path.setAttribute("id", `path-${edge.s}-${edge.t}`);
            
            svg.appendChild(path);
        }
    });
    container.appendChild(svg);
}

function renderElectives(canvas, startX) {
    const groupContainer = document.createElement('div');
    groupContainer.className = 'elective-group-on-canvas';
    groupContainer.style.left = `${startX}px`;
    groupContainer.style.top = '150px'; 
    
    ELECTIVE_GROUPS.forEach(group => {
        const btn = document.createElement('div');
        btn.className = 'elective-card-btn';
        btn.innerHTML = `
            <div class="ecb-title">${group.name}</div>
            <div class="ecb-sub">${group.count} Required</div>
        `;
        btn.onclick = () => openElectiveDrawer(group);
        groupContainer.appendChild(btn);
    });

    canvas.appendChild(groupContainer);
}

// --- Drag & Trace Utilities ---

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

function highlightTrace(nodeId) {
    const canvas = document.getElementById('plan-tree-canvas');
    if(!canvas) return;
    canvas.classList.add('canvas-hovered');

    const self = document.getElementById(`node-${nodeId}`);
    if(self) self.classList.add('active-node');

    // Trace both up (parents) and down (children)
    // For simple trace, we just look at edges
    globalEdges.forEach(edge => {
        if(edge.s === nodeId) {
            // Child connection
            document.getElementById(`path-${edge.s}-${edge.t}`)?.classList.add('active-path');
            document.getElementById(`node-${edge.t}`)?.classList.add('active-node');
        }
        if(edge.t === nodeId) {
            // Parent connection
            document.getElementById(`path-${edge.s}-${edge.t}`)?.classList.add('active-path');
            document.getElementById(`node-${edge.s}`)?.classList.add('active-node');
        }
    });
}

function resetTrace() {
    const canvas = document.getElementById('plan-tree-canvas');
    if(!canvas) return;
    canvas.classList.remove('canvas-hovered');
    canvas.querySelectorAll('.active-node').forEach(el => el.classList.remove('active-node'));
    canvas.querySelectorAll('.active-path').forEach(el => el.classList.remove('active-path'));
}

function isPrereqMet(code, passed) {
    const c = state.allCoursesData.find(x => x.course_code == code);
    if (!c || !c.prerequisites || !c.prerequisites.length) return true;
    return c.prerequisites.every(p => passed.has(p.prereq_code));
}

// Drawer & Popup Logic (Keep existing logic, just export needed functions)
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
        item.style.padding = "15px";
        item.style.marginBottom = "10px";
        item.style.background = "rgba(255,255,255,0.05)";
        item.style.borderRadius = "8px";
        item.innerHTML = `
            <div style="font-weight:bold; color:#fff;">${course.course_name_en}</div>
            <div style="font-size:0.8em; color:#888;">${course.course_code} • ${course.credit_hours} Cr</div>
        `;
        listContainer.appendChild(item);
    });

    drawer.classList.add('open');
    overlay.classList.add('open');
}