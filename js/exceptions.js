// exceptions.js
import { supabase } from './config.js';
import { state } from './state.js';

export async function loadExceptionHistory(userId) {
    const list = document.getElementById('exception-history-list');
    const countEl = document.getElementById('exc-total-count');
    
    if(!list) return;
    list.innerHTML = '<div class="spinner"></div>';

    try {
        const { data, error } = await supabase
            .from('exception_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        list.innerHTML = '';
        if(countEl) countEl.textContent = data ? data.length : 0;

        if(!data || data.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding:20px; color:#666; border:1px dashed #444; border-radius:10px;">No history found.</div>';
            return;
        }
        
        data.forEach(req => {
            const date = new Date(req.created_at).toLocaleDateString();
            const typeLabel = req.type === 'PREREQ' ? 'Prerequisite Override' : 'Alternative Course';
            const icon = req.type === 'PREREQ' ? '🔓' : '🔀';

            const div = document.createElement('div');
            div.className = `exc-item-card status-${req.status || 'PENDING'}`;
            div.innerHTML = `
                <div class="exc-card-header">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="exc-code-badge">${req.course_code}</span>
                        <span style="color:#666; font-size:0.85rem;">${date}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="exc-status-badge">${req.status}</span>
                        <button class="exc-delete-btn" onclick="deleteException('${req.request_id}')" title="Delete Request">×</button>
                    </div>
                </div>
                <div class="exc-details-row">
                    <span style="display:flex; align-items:center; gap:6px;">${icon} ${typeLabel}</span>
                </div>
                <div class="exc-reason-box">${req.reason}</div>
            `;
            list.appendChild(div);
        });
    } catch (err) {
        console.error("Exception History Error:", err);
        list.innerHTML = '<p style="color:red; text-align:center;">Failed to load history.</p>';
    }
}

// New Delete Function
window.deleteException = async function(requestId) {
    if (!confirm("Are you sure you want to delete this request? This action cannot be undone.")) return;

    try {
        const { error } = await supabase
            .from('exception_requests')
            .delete()
            .eq('request_id', requestId);

        if (error) throw error;

        if (state.currentUser) {
            loadExceptionHistory(state.currentUser.id);
        }
    } catch (err) {
        alert("Error deleting request: " + err.message);
    }
};

// 1. Fetch data if missing
async function fetchAllCoursesForSearch() {
    if (state.allCoursesData.length > 0) return; // Use cache if available

    try {
        const { data, error } = await supabase
            .from('courses')
            .select('course_code, course_name_en, course_name_ar');
        
        if (error) throw error;
        state.allCoursesData = data; 
        console.log("Loaded courses for search");
    } catch (err) {
        console.error("Failed to load courses:", err);
    }
}

// 2. Setup Listeners
export function setupExceptionListeners() {
    setupCourseSearch('exc-target-search', 'exc-target-code-hidden', 'exc-target-suggestions');
    setupCourseSearch('exc-alt-search', 'exc-alt-code-hidden', 'exc-alt-suggestions');
    
    // Lazy load courses when user clicks inputs
    ['exc-target-search', 'exc-alt-search'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('focus', fetchAllCoursesForSearch);
    });
}

// 3. Generic Search Function
function setupCourseSearch(inputId, hiddenId, listId) {
    const input = document.getElementById(inputId);
    const hidden = document.getElementById(hiddenId);
    const list = document.getElementById(listId);

    if(!input) return;

    input.addEventListener('input', () => {
        const val = input.value.toLowerCase();
        list.innerHTML = '';
        
        if (val.length < 2) {
            list.classList.add('hidden');
            return;
        }

        const matches = state.allCoursesData.filter(c => {
            const code = c.course_code.toString();
            const en = c.course_name_en.toLowerCase();
            const ar = c.course_name_ar ? c.course_name_ar.toLowerCase() : "";
            return code.includes(val) || en.includes(val) || ar.includes(val);
        }).slice(0, 10);

        if (matches.length === 0) {
            list.classList.add('hidden');
            return;
        }

        matches.forEach(c => {
            const name = state.currentLang === 'ar' ? c.course_name_ar : c.course_name_en;
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <span class="suggestion-code">${c.course_code}</span>
                <span class="suggestion-name">${name}</span>
            `;
            
            div.onclick = () => {
                input.value = `${c.course_code} - ${name}`;
                if(hidden) hidden.value = c.course_code;
                list.classList.add('hidden');
            };
            list.appendChild(div);
        });
        
        list.classList.remove('hidden');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (input && list && !input.contains(e.target) && !list.contains(e.target)) {
            list.classList.add('hidden');
        }
    });
}

// Expose submit function to global window for onclick
window.submitException = async function() {
    if(!state.currentUser) {
        alert("Please log in.");
        return;
    }

    const type = document.getElementById('exc-type').value;
    const courseCode = document.getElementById('exc-target-code-hidden').value; 
    const reason = document.getElementById('exc-reason').value;

    if(!courseCode) { alert("Please search and select a course."); return; }
    if(!reason) { alert("Please provide a reason."); return; }

    try {
        const { error } = await supabase.from('exception_requests').insert([{
            user_id: state.currentUser.id,
            course_code: courseCode,
            type: type,
            reason: reason,
            status: 'PENDING'
        }]);

        if(error) throw error;

        alert("Submitted Successfully");
        document.getElementById('exc-reason').value = '';
        document.getElementById('exc-target-search').value = '';
        document.getElementById('exc-target-code-hidden').value = '';
        loadExceptionHistory(state.currentUser.id);
    } catch(err) {
        alert("Error: " + err.message);
    }
};

// Exported Function + Window Assignment
export function updateExcType(val) {
    const select = document.getElementById('exc-type');
    if(select) select.value = val;
    
    const altGroup = document.getElementById('alt-course-group');
    if(altGroup) {
        if(val === 'PREREQ') altGroup.classList.add('hidden');
        else altGroup.classList.remove('hidden');
    }
}
window.updateExcType = updateExcType;