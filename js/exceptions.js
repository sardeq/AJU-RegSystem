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
                    <span class="exc-status-badge">${req.status}</span>
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