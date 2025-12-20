// plan.js
import { supabase } from './config.js';
import { state, ROOT_SE_ID } from './state.js';
import { getCategoryClass } from './utils.js';

let currentScale = 1;
let globalEdges = []; 

const ELECTIVE_GROUPS = [
    { id: 'elec_major', name: 'Major Electives', category: 'Major Elective', count: '12 Cr' },
    { id: 'elec_uni', name: 'Uni Electives', category: 'University Elective', count: '6 Cr' },
    { id: 'elec_supp', name: 'Support Electives', category: 'Support Compulsory', count: '3 Cr' },
    { id: 'elec_free', name: 'Free Electives', category: 'Free Elective', count: '3 Cr' }
];

export async function loadStudentPlan(userId) {
    const container = document.getElementById('plan-tree-container');
    const canvas = document.getElementById('plan-tree-canvas');
    if (!container || !canvas) return;

    canvas.innerHTML = '<div style="color:#fff; padding:20px;">Generating Plan Map...</div>';
    currentScale = 1;
    updateZoom();

    try {
        const { data: history } = await supabase
            .from('enrollments')
            .select('status, sections(course_code, courses(*))')
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

        if (!state.allCoursesData || state.allCoursesData.length === 0) {
            const { data: courses } = await supabase.from('courses').select('*');
            state.allCoursesData = courses || [];
        }

        // 3. Calculate Layout
        const layoutData = calculateTreeLayout(state.planRoots, state.planLinks);
        globalEdges = layoutData.edges;

        // --- CHANGE: Increase width to fit electives on the right ---
        const ELECTIVE_AREA_WIDTH = 300; 
        const totalWidth = layoutData.width + ELECTIVE_AREA_WIDTH;

        // 4. Render Canvas
        canvas.innerHTML = '';
        canvas.style.width = `${totalWidth}px`; 
        canvas.style.height = `${Math.max(layoutData.height + 100, 600)}px`; // Ensure min height

        renderConnections(layoutData.edges, layoutData.nodes);
        renderNodes(layoutData.nodes, passed, registered);
        
        // --- CHANGE: Render Electives INSIDE canvas at specific X position ---
        renderElectives(canvas, layoutData.width + 50); // 50px gap from tree

        // 6. Setup
        setTimeout(fitToScreen, 100);
        enableDragScroll();

    } catch (err) {
        console.error("Plan Error:", err);
        canvas.innerHTML = '<div style="color:red; padding:20px;">Error loading plan map.</div>';
    }
}

// ... (calculateTreeLayout, renderNodes, renderConnections remain UNCHANGED) ...
// ... (Copy them from previous response if needed, they are identical) ...

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

function renderNodes(nodes, passed, registered) {
    const container = document.getElementById('plan-tree-canvas');
    nodes.forEach(n => {
        const el = document.createElement('div');
        el.style.left = `${n.x}px`;
        el.style.top = `${n.y}px`;
        el.id = `node-${n.id}`;

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
            el.onclick = () => window.showCoursePopup(n.id, course, status);
        }
        container.appendChild(el);
    });
}

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
            path.setAttribute("id", `path-${edge.s}-${edge.t}`);
            
            svg.appendChild(path);
        }
    });
    container.appendChild(svg);
}


// --- CHANGED: Render Electives INSIDE Canvas ---
function renderElectives(canvas, startX) {
    // Create a group container for electives positioned absolutely
    const groupContainer = document.createElement('div');
    groupContainer.className = 'elective-group-on-canvas';
    groupContainer.style.left = `${startX}px`;
    groupContainer.style.top = '100px'; // Align roughly with first row
    
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

// --- Drawer & Popup Logic (Same as before) ---
async function openElectiveDrawer(group) {
    const drawer = document.getElementById('elective-drawer');
    const overlay = document.getElementById('elective-drawer-overlay');
    const listContainer = document.getElementById('drawer-content');
    const titleEl = document.getElementById('drawer-title');
    
    if(!drawer || !listContainer) return;

    titleEl.textContent = group.name;
    listContainer.innerHTML = '<div class="spinner"></div>';
    drawer.classList.add('open');
    overlay.classList.add('open');

    const relevantCourses = state.allCoursesData.filter(c => 
        c.category && c.category.toLowerCase().includes(group.category.toLowerCase())
    );

    listContainer.innerHTML = '';
    
    if (relevantCourses.length === 0) {
        listContainer.innerHTML = `<div style="padding:20px; color:#666;">No courses found for this category.</div>`;
        return;
    }

    relevantCourses.forEach(course => {
        const historyItem = state.userHistory?.find(h => h.sections?.course_code === course.course_code);
        const isPassed = historyItem?.status === 'COMPLETED';

        const item = document.createElement('div');
        item.className = `drawer-item ${isPassed ? 'passed' : ''}`;
        item.innerHTML = `
            <div class="di-header">
                <span class="di-code">${course.course_code}</span>
                ${isPassed ? '<span>✅</span>' : ''}
            </div>
            <div class="di-name">${state.currentLang === 'ar' ? course.course_name_ar : course.course_name_en}</div>
            <div class="di-meta">${course.credit_hours} Credits • ${isPassed ? 'Completed' : 'Available'}</div>
        `;
        listContainer.appendChild(item);
    });
}

window.closeDrawer = function() {
    document.getElementById('elective-drawer')?.classList.remove('open');
    document.getElementById('elective-drawer-overlay')?.classList.remove('open');
};

window.showCoursePopup = function(code, courseData, status) {
    const popup = document.getElementById('course-popup');
    const overlay = document.getElementById('plan-overlay');
    if(!popup || !overlay) return;

    const name = state.currentLang === 'ar' ? (courseData.course_name_ar || courseData.course_name_en) : courseData.course_name_en;
    document.getElementById('popup-title').textContent = `${code} - ${name}`;
    document.getElementById('popup-desc').textContent = `Credits: ${courseData.credit_hours || 3}`;
    
    const statusBadge = document.getElementById('popup-status');
    statusBadge.className = 'badge'; 
    if (status === 'passed') {
        statusBadge.textContent = "Passed ✅";
        statusBadge.classList.add('badge-green');
    } else if (status === 'registered') {
        statusBadge.textContent = "Registered 🕒";
        statusBadge.classList.add('badge-blue');
    } else if (status === 'locked') {
        statusBadge.textContent = "Locked 🔒";
        statusBadge.classList.add('badge-gray');
    } else {
        statusBadge.textContent = "Available 🔓";
        statusBadge.classList.add('badge-yellow');
    }

    popup.classList.remove('hidden');
    overlay.classList.remove('hidden');
};

window.closePlanPopup = function() {
    document.getElementById('course-popup')?.classList.add('hidden');
    document.getElementById('plan-overlay')?.classList.add('hidden');
};

function highlightTrace(nodeId) {
    const canvas = document.getElementById('plan-tree-canvas');
    if(!canvas) return;
    canvas.classList.add('canvas-hovered');

    const self = document.getElementById(`node-${nodeId}`);
    if(self) self.classList.add('active-node');

    globalEdges.forEach(edge => {
        if(edge.s === nodeId) {
            document.getElementById(`path-${edge.s}-${edge.t}`)?.classList.add('active-path');
            document.getElementById(`node-${edge.t}`)?.classList.add('active-node');
        }
        if(edge.t === nodeId) {
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
    const scaleX = (wrapper.clientWidth - 50) / canvas.scrollWidth; 
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
        // Allow dragging even if clicking elective container background, but not buttons
        if(e.target.closest('.node-card') || e.target.closest('.super-root-node') || e.target.closest('.elective-card-btn')) return;
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