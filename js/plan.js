import { supabase } from './config.js';
import { state } from './state.js';
import { translations } from './utils.js';

let currentScale = 1;

export async function loadStudentPlan (userId) {
    const canvas = document.getElementById('plan-tree-canvas');
    if(!canvas) return;
    canvas.innerHTML = '<div class="spinner"></div>';

    updatePlanLegend();

    try {
        // 1. Fetch Student History
        const { data: history } = await supabase
            .from('enrollments')
            .select('status, sections(course_code)')
            .eq('user_id', userId)
            .in('status', ['COMPLETED', 'REGISTERED', 'ENROLLED']);

        const passedCodes = new Set();
        const registeredCodes = new Set();
        
        history?.forEach(h => {
            const code = h.sections?.course_code;
            if (h.status === 'COMPLETED') passedCodes.add(code);
            else registeredCodes.add(code);
        });

        // 2. Fetch All Courses
        const { data: courses } = await supabase
            .from('courses')
            .select('course_code, course_name_en, course_name_ar, credit_hours, category, course_description');            
        
        if (courses) {
            state.allCoursesData = courses; 
        }

        const courseMap = {};
        courses?.forEach(c => courseMap[c.course_code] = c);

        // --- NEW: CALCULATE DYNAMIC STATS ---
        let totalCompletedHours = 0;
        
        // Sum up credits for every passed course
        passedCodes.forEach(code => {
            const course = courseMap[code];
            if (course && course.credit_hours) {
                totalCompletedHours += course.credit_hours;
            }
        });

        // Calculate Percentage (Goal: 132 Hours)
        const planTotal = 132;
        const percentage = Math.min(100, Math.round((totalCompletedHours / planTotal) * 100));

        const hoursNode = state.planStructure.find(n => n.id === "lbl_95");
        if (hoursNode) hoursNode.label = `${totalCompletedHours}\nHours`;

        const percentNode = state.planStructure.find(n => n.id === "lbl_75");
        if (percentNode) percentNode.label = `${percentage}\n%`;
        // -------------------------------------

        // 3. Render Tree (Now with updated labels)
        renderPlanTree(passedCodes, registeredCodes, courseMap);
        
        enableDragScroll(); 
        
        canvas.style.width = "2200px";
        canvas.style.height = "1200px";

        setTimeout(() => fitToScreen(), 100);

    } catch (err) {
        console.error("Plan Error:", err);
        canvas.innerHTML = '<p style="color:red; text-align:center;">Failed to load plan map.</p>';
    }
}

function enableDragScroll() {
    const wrapper = document.getElementById('tree-wrapper');
    if(!wrapper) return;
    
    let isDown = false;
    let startX, startY, scrollLeft, scrollTop;

    wrapper.addEventListener('mousedown', (e) => {
        isDown = true;
        wrapper.style.cursor = 'grabbing';
        startX = e.pageX - wrapper.offsetLeft;
        startY = e.pageY - wrapper.offsetTop;
        scrollLeft = wrapper.scrollLeft;
        scrollTop = wrapper.scrollTop;
    });

    wrapper.addEventListener('mouseleave', () => {
        isDown = false;
        wrapper.style.cursor = 'grab';
    });

    wrapper.addEventListener('mouseup', () => {
        isDown = false;
        wrapper.style.cursor = 'grab';
    });

    wrapper.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - wrapper.offsetLeft;
        const y = e.pageY - wrapper.offsetTop;
        const walkX = (x - startX) * 1.5; 
        const walkY = (y - startY) * 1.5;
        wrapper.scrollLeft = scrollLeft - walkX;
        wrapper.scrollTop = scrollTop - walkY;
    });
}

window.renderPlanTree = function(passed, registered, rawCourseData) {
    const container = document.getElementById('plan-tree-canvas');
    if (!container) return;

    // Reset container
    container.innerHTML = '';
    
    // --- CONFIG: Colors & Styles ---
    const colors = {
        major: "#1565c0",     // Blue
        college: "#2E7D32",   // Green
        univ: "#f57c00",      // Orange
        elective: "#0097a7",  // Teal
        support: "#7b1fa2",   // Purple
        default: "#546e7a"    // Grey Blue
    };

    // Helper to get color from category text
    const getBorderColor = (cat) => {
        if(!cat) return colors.default;
        const c = cat.toLowerCase();
        if(c.includes('major')) return c.includes('elective') ? colors.elective : colors.major;
        if(c.includes('college')) return colors.college;
        if(c.includes('university')) return colors.univ;
        if(c.includes('supportive')) return colors.support;
        return colors.default;
    };

    // Create SVG Layer for Lines
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNs, "svg");
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.overflow = "visible"; 
    container.appendChild(svg);

    // 1. Draw Links
    state.planLinks.forEach(link => {
        const sourceNode = state.planStructure.find(n => n.id === link.s);
        const targetNode = state.planStructure.find(n => n.id === link.t);

        if (sourceNode && targetNode) {
            // Updated Offset for wider nodes (Width 140, Height 70)
            const sx = sourceNode.x + 70; 
            const sy = sourceNode.y + 35;
            const tx = targetNode.x + 70;
            const ty = targetNode.y + 35;

            const midY = sy + (ty - sy) / 2;
            const d = `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
            
            const path = document.createElementNS(svgNs, "path");
            path.setAttribute("d", d);
            path.setAttribute("stroke", "#cfd8dc"); // Lighter Gray lines
            path.setAttribute("stroke-width", "2");
            path.setAttribute("fill", "none");
            path.classList.add("tree-link"); // hover effect in CSS
            svg.appendChild(path);
        }
    });

    // 2. Draw Nodes
    state.planStructure.forEach(node => {
        const el = document.createElement('div');
        el.style.position = "absolute";
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
        
        // --- A. Course Node ---
        if (node.type === 'course') {
            const course = rawCourseData[node.id] || { course_name_en: "Loading...", credit_hours: 3, category: "" };
            const name = (window.currentLang === 'ar' && course.course_name_ar) ? course.course_name_ar : course.course_name_en;
            
            // Determine Status
            let status = "locked";
            if (passed.has(node.id)) status = "passed";
            else if (registered.has(node.id)) status = "registered";
            else if (isPrereqMet(node.id, passed)) status = "open"; // Helper logic below

            // Style Variables
            const borderColor = getBorderColor(course.category);
            let bgColor = "white";
            let opacity = "1";
            let icon = "";

            // Apply Status Styling
            if(status === 'passed') {
                bgColor = "#e8f5e9"; // Light Green Tint
                icon = "<span style='color:#2E7D32; font-size:14px; position:absolute; top:-8px; right:-8px; background:white; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>✅</span>";
            } else if (status === 'registered') {
                bgColor = "#e3f2fd"; // Light Blue Tint
                icon = "<span style='color:#1565c0; font-size:14px; position:absolute; top:-8px; right:-8px; background:white; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>🕒</span>";
            } else if (status === 'locked') {
                bgColor = "#f5f5f5"; // Gray
                opacity = "0.8";
                icon = "<span style='color:#999; font-size:12px; position:absolute; top:4px; right:4px;'>🔒</span>";
            }

            // Main Node Style
            el.className = `node-box ${status}`;
            el.style.width = "140px";
            el.style.height = "70px";
            el.style.background = bgColor;
            el.style.border = `2px solid ${borderColor}`;
            // Add a thicker left border for category emphasis
            el.style.borderLeft = `6px solid ${borderColor}`;
            el.style.borderRadius = "8px";
            el.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)";
            el.style.display = "flex";
            el.style.flexDirection = "column";
            el.style.justifyContent = "center";
            el.style.alignItems = "center";
            el.style.textAlign = "center";
            el.style.cursor = "pointer";
            el.style.zIndex = "10";
            el.style.opacity = opacity;
            el.style.transition = "transform 0.2s, box-shadow 0.2s";

            // Hover Effect (Inline)
            el.onmouseenter = () => { el.style.transform = "translateY(-3px)"; el.style.boxShadow = "0 6px 12px rgba(0,0,0,0.1)"; };
            el.onmouseleave = () => { el.style.transform = "translateY(0)"; el.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)"; };

            // HTML Content
            el.innerHTML = `
                ${icon}
                <div style="font-weight:800; font-size:13px; color:#333; margin-bottom:2px;">${node.id}</div>
                <div style="font-size:10px; color:#555; line-height:1.2; padding:0 4px;">${name.substring(0,30)}</div>
            `;
            
            // Click Action
            el.onclick = () => showCoursePopup(node.id, course, status, 'status_'+status, el);
        }

        // --- B. Summary Blocks (Right Side) ---
        else if (node.type === 'summary-block') {
            const borderColor = getBorderColor(node.group); // Use group to color match
            
            el.className = "node-box summary";
            el.style.width = "160px";
            el.style.height = "80px";
            el.style.background = "white";
            el.style.border = `2px solid ${borderColor}`;
            el.style.borderLeft = `6px solid ${borderColor}`; // Matching Left Border
            el.style.borderRadius = "8px";
            el.style.display = "flex";
            el.style.flexDirection = "column";
            el.style.alignItems = "center";
            el.style.justifyContent = "center";
            el.style.textAlign = "center";
            el.style.cursor = "pointer";
            el.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
            
            el.innerHTML = `
                <div style="font-weight:bold; font-size:11px; color:#333; margin-bottom:4px;">${node.label.replace(/\n/g, '<br>')}</div>
                <div style="font-size:10px; color:#888;">${node.subtext}</div>
            `;

            el.onclick = () => openPdfDrawer(node.group, node.label.replace(/\n/g, ' '));
        }

        // --- C. Labels ---
        else if (node.type === 'label-circle') {
             el.style.background = "#fff";
             el.style.border = "2px solid #2E7D32";
             el.style.color = "#2E7D32";
             el.style.borderRadius = "50%";
             el.style.width = "60px";
             el.style.height = "60px";
             el.style.display = "flex";
             el.style.alignItems = "center";
             el.style.justifyContent = "center";
             el.style.textAlign = "center";
             el.style.fontWeight = "bold";
             el.style.fontSize = "12px";
             el.innerText = node.label;
        }
        else if (node.type.includes('label-box')) {
             el.style.background = "#2E7D32";
             el.style.color = "white";
             el.style.padding = "10px";
             el.style.borderRadius = "6px";
             el.style.width = "150px";
             el.style.textAlign = "center";
             el.style.fontSize = "12px";
             el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
             el.innerText = node.label;
        }

        container.appendChild(el);
    });
    
    // Resize container
    container.style.width = "2700px";
    container.style.height = "1300px";
};

function updatePlanLegend(passed, registered) {
    const legendContainer = document.getElementById('plan-legend');
    if (legendContainer) {
        legendContainer.innerHTML = `
            <div><span style="background:#e8f5e9; width:10px; height:10px; display:inline-block;"></span> Passed (${passed.size})</div>
            <div><span style="background:#e3f2fd; width:10px; height:10px; display:inline-block;"></span> Registered (${registered.size})</div>
        `;
    }
}

window.changeZoom = function(delta) {
    const canvas = document.getElementById('plan-tree-canvas');
    if(!canvas) return;

    currentScale += delta;
    if (currentScale < 0.3) currentScale = 0.3;
    if (currentScale > 1.5) currentScale = 1.5;
    
    canvas.style.transform = `scale(${currentScale})`;
    // Reset origin to top-left to avoid jumping
    canvas.style.transformOrigin = "top left"; 
}

window.fitToScreen = function() {
    const wrapper = document.getElementById('tree-wrapper');
    const canvas = document.getElementById('plan-tree-canvas');
    if (!wrapper || !canvas) return;
    
    const canvasWidth = 2200; // Match your canvas width
    const availableWidth = wrapper.clientWidth;
    
    // Calculate scale
    const scale = (availableWidth / canvasWidth) - 0.05; 
    
    currentScale = scale > 0 ? scale : 0.5;
    canvas.style.transform = `scale(${currentScale})`;
    canvas.style.transformOrigin = "top left";
    
    wrapper.scrollTop = 0;
    wrapper.scrollLeft = 0;
}

function isPrereqMet(courseCode, passedSet) {
    // 1. Find the course in the global state
    const course = state.allCoursesData.find(c => c.course_code == courseCode);
    
    // 2. If no course found or no prereqs, it's met (true)
    if(!course || !course.prerequisites || course.prerequisites.length === 0) return true;
    
    // 3. Check if all prereqs are in the 'passedSet'
    return course.prerequisites.every(p => passedSet.has(p.prereq_code));
}

window.showCoursePopup = function(code, details, statusClass, statusKey, targetElement) {
    const popup = document.getElementById('course-popup');
    const overlay = document.getElementById('plan-overlay');
    const highlightContainer = document.getElementById('node-highlight-container'); 
    
    if(!targetElement) return;

    // 1. Get exact position
    const rect = targetElement.getBoundingClientRect(); 
    
    // 2. Clone Node for "Pop" effect
    if(highlightContainer) {
        highlightContainer.innerHTML = ''; 
        highlightContainer.classList.remove('hidden'); 
        highlightContainer.classList.add('active');

        const div = document.createElement('div');
        div.className = targetElement.className + " node-html-clone";
        div.style.cssText = targetElement.style.cssText;
        div.style.position = "fixed";
        div.style.width = `${rect.width}px`;
        div.style.height = `${rect.height}px`;
        div.style.top = `${rect.top}px`;
        div.style.left = `${rect.left}px`;
        div.style.zIndex = "1001";
        div.style.cursor = "default";
        div.innerHTML = targetElement.innerHTML;
        highlightContainer.appendChild(div);
    }

    // 3. Populate Popup
    const title = document.getElementById('popup-title');
    const desc = document.getElementById('popup-desc');
    const longDesc = document.getElementById('popup-long-desc');
    const credits = document.getElementById('popup-credits');
    const statusBadge = document.getElementById('popup-status');

    if (details) {
        const fullName = state.currentLang === 'ar' ? details.course_name_ar : details.course_name_en;
        title.textContent = `${code}`;
        desc.textContent = fullName || "Unknown Course";
        
        if (details.course_description) {
            longDesc.textContent = details.course_description;
            longDesc.classList.remove('hidden');
        } else {
            longDesc.textContent = "";
            longDesc.classList.add('hidden');
        }

        credits.textContent = `${details.credit_hours} Cr`;
    }

    // Badge Logic
    let badgeText = statusClass;
    // Map statusKey to translation if available
    // (Assuming translations object is available via import or global)
    // badgeText = translations[state.currentLang][statusKey] || statusClass; 
    
    statusBadge.textContent = badgeText;
    
    let badgeClass = "badge-gray";
    if (statusClass === 'passed') badgeClass = "badge-green";
    else if (statusClass === 'registered') badgeClass = "badge-blue";
    else if (statusClass === 'open') badgeClass = "badge-yellow";
    
    statusBadge.className = `badge ${badgeClass}`;

    // Position Popup
    let left = rect.right + 20; 
    let top = rect.top;
    
    if (left + 300 > window.innerWidth) left = rect.left - 320; 
    if (top + 200 > window.innerHeight) top = window.innerHeight - 220;

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;

    popup.classList.remove('hidden');
    if (overlay) overlay.classList.remove('hidden');
};

window.closePlanPopup = function() {
    document.getElementById('course-popup').classList.add('hidden');
    const overlay = document.getElementById('plan-overlay');
    if (overlay) overlay.classList.add('hidden');

    const highlightContainer = document.getElementById('node-highlight-container');
    if (highlightContainer) {
        highlightContainer.classList.remove('active');
        highlightContainer.classList.add('hidden');
        highlightContainer.innerHTML = ''; 
    }
};

window.openPdfDrawer = function(groupKey, title) {
    const drawer = document.getElementById('elective-drawer');
    const overlay = document.getElementById('elective-drawer-overlay');
    const list = document.getElementById('drawer-content');
    const titleEl = document.getElementById('drawer-title');
    
    if(!drawer || !list) return;

    titleEl.textContent = title;
    list.innerHTML = ''; 
    
    // Logic to find courses based on groupKey (e.g., 'University Elective')
    // This logic relies on 'allCoursesData' which is now in 'state.allCoursesData'
    const courses = state.allCoursesData.filter(c => 
        c.category && c.category.includes(groupKey)
    );

    if (courses.length === 0) {
        list.innerHTML = '<p style="padding:20px; text-align:center;">No courses found.</p>';
    } else {
        courses.forEach(c => {
            const item = document.createElement('div');
            item.className = 'drawer-node';
            const name = state.currentLang === 'ar' ? c.course_name_ar : c.course_name_en;
            
            item.innerHTML = `
                <div style="font-weight:bold;">${c.course_code}</div>
                <div>${name}</div>
                <div style="font-size:0.8em; color:#666;">${c.credit_hours} Cr</div>
            `;
            item.onclick = () => {
                 window.closeDrawer();
                 window.showCoursePopup(c.course_code, c, 'open', 'status_open', item); // simplified
            };
            list.appendChild(item);
        });
    }

    drawer.classList.add('open');
    if(overlay) overlay.classList.add('open');
};

window.closeDrawer = function() {
    document.getElementById('elective-drawer').classList.remove('open');
    document.getElementById('elective-drawer-overlay').classList.remove('open');
};


// plan.js

// Global object to hold utility functions for the degree plan
window.PlanUtils = {
    // --- Data Processing ---

    // Enriches course data with status (completed, prerequisites met, etc.) based on student data.
    enrichCourseData: (courses, studentData) => {
        const completedSet = new Set(studentData.completedCourses);

        return courses.map(course => {
            const isCompleted = completedSet.has(course.courseCode);
            // Check if all prerequisites are in the completed set.
            // Handles cases with 'or' (e.g., "A or B") by splitting and checking if at least one option is met.
            const prereqsMet = course.prerequisites.length === 0 || course.prerequisites.every(prereqGroup => {
                const options = prereqGroup.split(' or ').map(s => s.trim());
                return options.some(option => completedSet.has(option));
            });

            let status = 'locked';
            if (isCompleted) {
                status = 'completed';
            } else if (prereqsMet) {
                status = 'available';
            }

            return { ...course, status, isCompleted, prereqsMet };
        });
    },


    // --- Layout Calculation (The core logic for the tree structure) ---

    // Calculates the "level" of each course.
    // The level is the length of the longest chain of prerequisites leading to the course.
    // Level 0 = no prerequisites. Level 1 = requires a Level 0 course, etc.
    calculateLevels: (courses) => {
        const levels = {};
        const courseMap = new Map(courses.map(c => [c.courseCode, c]));

        function getLevel(courseCode, visited = new Set()) {
            // Avoid infinite loops in circular dependencies (shouldn't happen in a valid plan, but good practice)
            if (visited.has(courseCode)) return -1; 
            if (levels[courseCode] !== undefined) return levels[courseCode];

            const course = courseMap.get(courseCode);
            if (!course || course.prerequisites.length === 0) {
                levels[courseCode] = 0;
                return 0;
            }

            visited.add(courseCode);
            
            // Find the maximum level among all direct prerequisites.
            let maxPrereqLevel = -1;
            course.prerequisites.forEach(prereqGroup => {
                // Handle 'or' conditions: find the *minimum* level among the options required to satisfy this group.
                // We assume the student takes the shortest path.
                const options = prereqGroup.split(' or ').map(s => s.trim());
                let minOptionLevel = Infinity;
                
                options.forEach(option => {
                    // Recursive call to get the level of the prerequisite
                    const lvl = getLevel(option, new Set(visited));
                    if (lvl !== -1) {
                         minOptionLevel = Math.min(minOptionLevel, lvl);
                    }
                });

                if (minOptionLevel !== Infinity) {
                     maxPrereqLevel = Math.max(maxPrereqLevel, minOptionLevel);
                }
            });
            visited.delete(courseCode);

             // The course's level is one higher than the deepest prerequisite chain.
            levels[courseCode] = maxPrereqLevel + 1;
            return levels[courseCode];
        }

        courses.forEach(c => getLevel(c.courseCode));
        return levels;
    },

    // Identifies "critical paths" in the degree plan.
    // A critical path is a sequence of courses where each is a prerequisite for the next,
    // and delay in any course delays graduation. This usually corresponds to the longest chains.
    identifyCriticalPaths: (courses, levels) => {
        let maxLevel = -1;
        // Find the highest level defined in the plan.
        Object.values(levels).forEach(l => maxLevel = Math.max(maxLevel, l));
        
        // Start backtracking from courses at the highest level.
        const finalCourses = courses.filter(c => levels[c.courseCode] === maxLevel);
        const criticalPaths = [];

        function backtrack(courseCode, currentPath) {
            const course = courses.find(c => c.courseCode === courseCode);
            if (!course || course.prerequisites.length === 0) {
                // End of a chain reached.
                criticalPaths.push([courseCode, ...currentPath]);
                return;
            }

            // Find which prerequisites are on the critical path (i.e., have a level exactly one less than current).
            const criticalPrereqs = [];
             course.prerequisites.forEach(prereqGroup => {
                 // Simplification for critical path visual: take the first option in an 'or' group that fits the level criteria.
                const options = prereqGroup.split(' or ').map(s => s.trim());
                const targetPrereq = options.find(op => levels[op] === levels[courseCode] - 1);
                if(targetPrereq) criticalPrereqs.push(targetPrereq);
            });

            if (criticalPrereqs.length === 0) {
                 // Path ends here if no direct critical predecessor is found.
                criticalPaths.push([courseCode, ...currentPath]);
            } else {
                 // Continue backtracking for each critical prerequisite.
                criticalPrereqs.forEach(prereq => backtrack(prereq, [courseCode, ...currentPath]));
            }
        }

        finalCourses.forEach(c => backtrack(c.courseCode, []));
        // Flatten the paths into a set of unique connection strings (e.g., "CS101->CS102") for easy lookup.
        const criticalEdges = new Set();
        criticalPaths.forEach(path => {
            for(let i=0; i < path.length - 1; i++) {
                criticalEdges.add(`${path[i]}->${path[i+1]}`);
            }
        });
        return criticalEdges;
    },


    // --- Rendering (Drawing the visual elements) ---

    // Renders the entire flowchart (tree) into the DOM container.
    renderTree: (containerId, courses, studentData, handleCourseClick) => {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; // Clear previous render

        // 1. Enrich data with status and calculate layout levels.
        const enrichedCourses = PlanUtils.enrichCourseData(courses, studentData);
        const levels = PlanUtils.calculateLevels(enrichedCourses);
        const criticalEdges = PlanUtils.identifyCriticalPaths(enrichedCourses, levels);

        // 2. Group courses by their calculated level for layout.
        const coursesByLevel = {};
        enrichedCourses.forEach(course => {
            const lvl = levels[course.courseCode] || 0;
            if (!coursesByLevel[lvl]) coursesByLevel[lvl] = [];
            coursesByLevel[lvl].push(course);
        });

        // Define layout constants for spacing.
        const nodeWidth = 140;
        const nodeHeight = 60;
        const xGap = 100; // Horizontal space between levels
        const yGap = 40;  // Vertical space between nodes in the same level
        const startX = 50;
        const startY = 50;

        const nodePositions = {};
        const maxLevel = Math.max(...Object.keys(coursesByLevel).map(Number));

        // 3. Create HTML nodes and place them absolutely.
        // Iterate through levels (left to right).
        for (let lvl = 0; lvl <= maxLevel; lvl++) {
            const levelCourses = coursesByLevel[lvl] || [];
            // Calculate X coordinate for this level.
            const currentX = startX + lvl * (nodeWidth + xGap);
            
            // Center the group vertically relative to the tallest group for better aesthetics.
            // Find max number of courses in any level to determine center point.
            const maxCoursesInAnyLevel = Math.max(...Object.values(coursesByLevel).map(c => c.length));
            const totalMaxHeight = maxCoursesInAnyLevel * (nodeHeight + yGap) - yGap;
            const currentLevelHeight = levelCourses.length * (nodeHeight + yGap) - yGap;
            const yOffset = (totalMaxHeight - currentLevelHeight) / 2;


            levelCourses.forEach((course, index) => {
                // Calculate Y coordinate for this course within its level.
                const currentY = startY + yOffset + index * (nodeHeight + yGap);

                // Create the DOM element for the course node.
                const node = document.createElement('div');
                node.classList.add('course-node', course.status);
                node.id = `node-${course.courseCode}`;
                // Apply calculated positions.
                node.style.left = `${currentX}px`;
                node.style.top = `${currentY}px`;
                
                // Apply style for completed courses (adds green status bar).
                if (course.isCompleted) {
                    node.classList.add('completed');
                }

                // Basic HTML structure for the node content.
                node.innerHTML = `
                    <div class="course-code">${course.courseCode}</div>
                    <div class="course-name">${course.title}</div> 
                `;

                // Add click handler for opening the course details modal.
                node.addEventListener('click', () => handleCourseClick(course));
                container.appendChild(node);

                // Store position for arrow drawing later.
                // Adjust coordinates to be the center points of the node sides.
                nodePositions[course.courseCode] = {
                    id: node.id,
                    inputPoint: { x: currentX, y: currentY + nodeHeight / 2 },     // Left side center
                    outputPoint: { x: currentX + nodeWidth, y: currentY + nodeHeight / 2 } // Right side center
                };
            });
        }

        // 4. Draw connections (arrows) between nodes.
        // Create an SVG element to hold all the arrows.
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "arrows-svg";
        // Set SVG size to match the container's scrollable area.
        svg.setAttribute('width', container.scrollWidth);
        svg.setAttribute('height', container.scrollHeight);
        container.appendChild(svg);

        enrichedCourses.forEach(course => {
            if (!nodePositions[course.courseCode]) return;
            const toPos = nodePositions[course.courseCode].inputPoint;

             course.prerequisites.forEach(prereqGroup => {
                 // For visualization, draw lines from all individual options in an 'or' group.
                prereqGroup.split(' or ').forEach(prereqCode => {
                     prereqCode = prereqCode.trim();
                     if (nodePositions[prereqCode]) {
                         const fromPos = nodePositions[prereqCode].outputPoint;
                         const isCritical = criticalEdges.has(`${prereqCode}->${course.courseCode}`);
                         // Draw the actual arrow using SVG.
                         PlanUtils.drawArrow(svg, fromPos, toPos, isCritical);
                     }
                });
            });
        });
    },

    // Draws a single Bezier curve arrow between two points on the SVG canvas.
    drawArrow: (svg, start, end, isCritical) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        
        // Calculate control points for a smooth Bezier curve.
        // The curve goes horizontally out from 'start' and horizontally into 'end'.
        const deltaX = end.x - start.x;
        // Determine how far out the control points should be based on distance.
        // Ensure a minimum curve even for close nodes.
        const controlPointOffset = Math.max(deltaX * 0.4, 50); 

        const cp1x = start.x + controlPointOffset;
        const cp1y = start.y;
        const cp2x = end.x - controlPointOffset;
        const cp2y = end.y;

        // Define the SVG path data using Cubic Bezier curve command (C).
        const d = `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
        path.setAttribute("d", d);
        // Add classes for styling (thickness, color, etc.).
        path.classList.add("arrow-line");
        if (isCritical) path.classList.add("critical");

        // Add rounding to the start and end of the lines.
        path.setAttribute("stroke-linecap", "round");
        
        svg.appendChild(path);
    }
};