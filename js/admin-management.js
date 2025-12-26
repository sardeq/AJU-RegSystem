import { supabase } from './config.js';

export async function loadAdminExceptions() {
    const list = document.getElementById('admin-exceptions-list');
    list.innerHTML = '<div class="spinner"></div>';

    const { data, error } = await supabase
        .from('exception_requests')
        .select('*') 
        .eq('status', 'PENDING');

    if (error) {
        console.error("Supabase Error:", error);
        list.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
        return;
    }
    
    list.innerHTML = data.length === 0 ? '<p style="text-align:center; padding:20px; color:#666;">No pending requests.</p>' : '';
    document.getElementById('pending-exc-count').textContent = data.length;

    data.forEach(req => {
        const card = document.createElement('div');
        card.className = 'adm-card status-pending'; 
        card.innerHTML = `
            <div class="adm-header">
                <span class="badge ${req.type === 'PREREQ' ? 'badge-blue' : 'badge-yellow'}">${req.type}</span>
                <span class="adm-date">${req.course_code}</span>
            </div>
            <div class="rc-body">
                <h3 class="adm-name">${req.user?.full_name || 'Unknown Student'}</h3>
                <p style="font-size:0.85rem; color:var(--primary);">GPA: ${req.user?.gpa || 'N/A'}</p>
                <p class="rc-desc" style="margin: 10px 0; font-style: italic; color:#bbb;">"${req.reason}"</p>
                <textarea id="resp-${req.request_id}" placeholder="Provide a reason for the decision..." class="modern-textarea" style="margin-bottom:10px;"></textarea>
            </div>
            <div class="box-grid-2">
                <button onclick="handleDecision(${req.request_id}, 'REJECTED')" class="delete-btn">Reject</button>
                <button onclick="handleDecision(${req.request_id}, 'APPROVED')" class="accept-btn">Approve</button>
            </div>
        `;
        list.appendChild(card);
    });
}

// --- NEW: Course Management Logic ---
export async function loadAdminCourses() {
    const grid = document.getElementById('admin-courses-grid');
    grid.innerHTML = '<div class="spinner"></div>';

    const { data, error } = await supabase
        .from('sections')
        .select(`*, courses(course_name_en, credit_hours)`)
        .order('course_code', { ascending: true });

    if (error) return console.error(error);

    grid.innerHTML = '';
    data.forEach(sec => {
        const card = document.createElement('div');
        card.className = `adm-card ${sec.status === 'OPEN' ? 'status-accepted' : 'status-rejected'}`;
        card.innerHTML = `
            <div class="adm-header">
                <span class="rc-code-pill">${sec.course_code}</span>
                <span class="badge ${sec.status === 'OPEN' ? 'badge-green' : 'badge-gray'}">${sec.status}</span>
            </div>
            <h3 class="adm-name" style="font-size:1rem;">${sec.courses?.course_name_en}</h3>
            <div class="adm-meta">
                 <div class="adm-pill"><span>Sec</span><strong>${sec.section_number}</strong></div>
                 <div class="adm-pill"><span>Enrolled</span><strong>${sec.enrolled_count}/${sec.capacity}</strong></div>
            </div>
            <div class="box-grid-2" style="margin-top:10px;">
                <button class="mini-logout-btn" style="width:100%;" onclick="toggleSectionStatus(${sec.section_id}, '${sec.status}')">
                    ${sec.status === 'OPEN' ? 'Close' : 'Open'}
                </button>
                <button class="mini-logout-btn" style="width:100%;" onclick="editSection(${sec.section_id})">Edit</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.toggleSectionStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    const { error } = await supabase.from('sections').update({ status: newStatus }).eq('section_id', id);
    if (!error) loadAdminCourses();
};

window.handleDecision = async function(requestId, decision) {
    const response = document.getElementById(`resp-${requestId}`).value;
    
    const { error } = await supabase
        .from('exception_requests')
        .update({ 
            status: decision, 
            admin_response: response,
            // Assuming current time for response date
        })
        .eq('request_id', requestId);

    if (error) alert("Error: " + error.message);
    else {
        alert(`Request ${decision.toLowerCase()}!`);
        loadAdminExceptions();
    }
};

export async function loadAdminUsers() {
    const tbody = document.getElementById('admin-users-table');
    const { data } = await supabase.from('users').select('*').order('full_name');
    
    tbody.innerHTML = data.map(u => `
        <tr>
            <td>${u.full_name} <br> <small>${u.id.substring(0,8)}</small></td>
            <td><span class="badge">${u.role}</span></td>
            <td>${u.gpa || 'N/A'}</td>
            <td>
                <button class="mini-logout-btn" onclick="editUser('${u.id}')">Edit</button>
            </td>
        </tr>
    `).join('');
}