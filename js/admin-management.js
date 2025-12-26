import { supabase } from './config.js';

// --- Global State for Admin ---
let allUsers = [];
let allSections = [];
let currentUserFilter = 'all';
let currentSectionFilter = 'all';

// ================= USER MANAGEMENT =================

export async function loadAdminUsers() {
    const tbody = document.getElementById('admin-users-table');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner"></div></td></tr>';

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('full_name');
    
    if (error) {
        console.error("Error loading users:", error);
        tbody.innerHTML = `<tr><td colspan="5" style="color:red">Error: ${error.message}</td></tr>`;
        return;
    }

    allUsers = data;
    document.getElementById('total-users-count').textContent = allUsers.length;
    renderUsers();
}

window.renderUsers = () => {
    const tbody = document.getElementById('admin-users-table');
    const searchVal = document.getElementById('user-search-input').value.toLowerCase();
    
    // Filter locally
    const filtered = allUsers.filter(u => {
        const matchesRole = currentUserFilter === 'all' || u.role === currentUserFilter;
        const matchesSearch = (u.full_name || '').toLowerCase().includes(searchVal) || 
                              (u.id || '').toLowerCase().includes(searchVal);
        return matchesRole && matchesSearch;
    });

    tbody.innerHTML = filtered.map(u => `
        <tr>
            <td>
                <div style="font-weight:bold;">${u.full_name || 'No Name'}</div>
                <div style="font-size:0.8em; color:#888;">${u.id.substring(0,8)}...</div>
            </td>
            <td>${u.email || '-'}</td>
            <td><span class="badge ${getRoleBadge(u.role)}">${u.role}</span></td>
            <td>${u.gpa ? u.gpa.toFixed(2) : '-'}</td>
            <td>
                <button class="mini-logout-btn" onclick="openEditUserModal('${u.id}')">✏️ Edit</button>
            </td>
        </tr>
    `).join('');
};

window.filterUsers = (role) => {
    currentUserFilter = role;
    document.querySelectorAll('#admin-users-container .filter-pill').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(role === 'all' ? 'all' : role));
    });
    renderUsers();
};

window.searchUsers = () => { renderUsers(); };

// --- Edit User Logic ---

window.openEditUserModal = (id) => {
    const user = allUsers.find(u => u.id === id);
    if(!user) return;

    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-name').value = user.full_name;
    document.getElementById('edit-user-role').value = user.role;
    document.getElementById('edit-user-gpa').value = user.gpa || 0;
    
    document.getElementById('edit-user-modal').classList.remove('hidden');
};

window.closeEditUserModal = () => {
    document.getElementById('edit-user-modal').classList.add('hidden');
};

window.saveUserChanges = async () => {
    const id = document.getElementById('edit-user-id').value;
    const updates = {
        full_name: document.getElementById('edit-user-name').value,
        role: document.getElementById('edit-user-role').value,
        gpa: parseFloat(document.getElementById('edit-user-gpa').value)
    };

    const { error } = await supabase.from('users').update(updates).eq('id', id);

    if (error) {
        alert("Update failed: " + error.message);
    } else {
        alert("User updated successfully");
        closeEditUserModal();
        loadAdminUsers(); // Reload to refresh table
    }
};

function getRoleBadge(role) {
    if (role === 'admin') return 'badge-red'; // You might need to define this CSS
    if (role === 'instructor') return 'badge-yellow';
    return 'badge-gray';
}


// ================= COURSE/SECTION MANAGEMENT =================

export async function loadAdminCourses() {
    const grid = document.getElementById('admin-courses-grid');
    grid.innerHTML = '<div class="spinner"></div>';

    const { data, error } = await supabase
        .from('sections')
        .select(`*, courses(course_name_en, credit_hours)`)
        .order('course_code', { ascending: true });

    if (error) return console.error(error);

    allSections = data;
    renderSections();
}

window.renderSections = () => {
    const grid = document.getElementById('admin-courses-grid');
    const searchVal = document.getElementById('section-search-input').value.toLowerCase();

    const filtered = allSections.filter(sec => {
        const matchesStatus = currentSectionFilter === 'all' || sec.status === currentSectionFilter;
        const matchesSearch = (sec.course_code || '').toLowerCase().includes(searchVal) ||
                              (sec.courses?.course_name_en || '').toLowerCase().includes(searchVal);
        return matchesStatus && matchesSearch;
    });

    grid.innerHTML = '';
    filtered.forEach(sec => {
        const card = document.createElement('div');
        card.className = `adm-card ${sec.status === 'OPEN' ? 'status-accepted' : 'status-rejected'}`;
        card.innerHTML = `
            <div class="adm-header">
                <span class="rc-code-pill">${sec.course_code}</span>
                <span class="badge ${sec.status === 'OPEN' ? 'badge-green' : 'badge-gray'}">${sec.status}</span>
            </div>
            <h3 class="adm-name" style="font-size:1rem;">${sec.courses?.course_name_en || 'Unknown Course'}</h3>
            <div class="adm-meta">
                 <div class="adm-pill"><span>Sec</span><strong>${sec.section_number}</strong></div>
                 <div class="adm-pill"><span>Enrolled</span><strong>${sec.enrolled_count}/${sec.capacity}</strong></div>
            </div>
            <div class="box-grid-2" style="margin-top:10px;">
                <button class="mini-logout-btn" style="width:100%;" onclick="toggleSectionStatus(${sec.section_id}, '${sec.status}')">
                    ${sec.status === 'OPEN' ? 'Close' : 'Open'}
                </button>
                <button class="mini-logout-btn" style="width:100%;" onclick="openSectionModal(${sec.section_id})">Edit</button>
            </div>
        `;
        grid.appendChild(card);
    });
};

window.filterSections = (status) => {
    currentSectionFilter = status;
    document.querySelectorAll('#admin-courses-container .filter-pill').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toUpperCase() === (status === 'all' ? 'ALL' : status));
    });
    renderSections();
};

window.searchSections = () => { renderSections(); };

window.toggleSectionStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    const { error } = await supabase.from('sections').update({ status: newStatus }).eq('section_id', id);
    if (!error) loadAdminCourses();
};

// --- Edit/Create Section Logic ---

window.openSectionModal = (id = null) => {
    const modal = document.getElementById('edit-section-modal');
    const title = document.getElementById('sec-modal-title');
    
    // Clear fields
    document.getElementById('edit-sec-code').value = '';
    document.getElementById('edit-sec-num').value = '';
    document.getElementById('edit-sec-cap').value = '';
    document.getElementById('edit-sec-sch').value = '';
    document.getElementById('edit-sec-room').value = '';
    document.getElementById('edit-sec-instr').value = '';

    if (id) {
        // Edit Mode
        const sec = allSections.find(s => s.section_id === id);
        title.textContent = "Edit Section";
        document.getElementById('edit-sec-id').value = sec.section_id;
        document.getElementById('edit-sec-code').value = sec.course_code;
        document.getElementById('edit-sec-num').value = sec.section_number;
        document.getElementById('edit-sec-cap').value = sec.capacity;
        document.getElementById('edit-sec-sch').value = sec.schedule_text;
        document.getElementById('edit-sec-room').value = sec.room_number;
        document.getElementById('edit-sec-instr').value = sec.instructor_name;
    } else {
        // Create Mode
        title.textContent = "Create New Section";
        document.getElementById('edit-sec-id').value = ""; // Empty ID
    }

    modal.classList.remove('hidden');
};

window.closeSectionModal = () => {
    document.getElementById('edit-section-modal').classList.add('hidden');
};

window.saveSectionChanges = async () => {
    const id = document.getElementById('edit-sec-id').value;
    const sectionData = {
        course_code: document.getElementById('edit-sec-code').value,
        section_number: parseInt(document.getElementById('edit-sec-num').value),
        capacity: parseInt(document.getElementById('edit-sec-cap').value),
        schedule_text: document.getElementById('edit-sec-sch').value,
        room_number: document.getElementById('edit-sec-room').value,
        instructor_name: document.getElementById('edit-sec-instr').value
    };

    let error;
    if (id) {
        // Update
        ({ error } = await supabase.from('sections').update(sectionData).eq('section_id', id));
    } else {
        // Insert (Need semester_id, assuming 1 for now or you can fetch active one)
        sectionData.semester_id = 1; 
        sectionData.status = 'OPEN';
        sectionData.enrolled_count = 0;
        ({ error } = await supabase.from('sections').insert([sectionData]));
    }

    if (error) {
        alert("Operation failed: " + error.message);
    } else {
        alert("Saved successfully!");
        closeSectionModal();
        loadAdminCourses();
    }
};

export async function loadAdminHome() {
    // Set date
    document.getElementById('admin-date-display').textContent = new Date().toLocaleDateString();

    // Fetch stats in parallel for speed
    const [adm, exc, usrs, secs] = await Promise.all([
        supabase.from('admissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('exception_requests').select('request_id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('sections').select('section_id', { count: 'exact', head: true }).eq('status', 'OPEN')
    ]);

    document.getElementById('ah-stat-admissions').textContent = adm.count || 0;
    document.getElementById('ah-stat-exceptions').textContent = exc.count || 0;
    document.getElementById('ah-stat-users').textContent = usrs.count || 0;
    document.getElementById('ah-stat-sections').textContent = secs.count || 0;
}

export async function loadAdminExceptions() {
    const list = document.getElementById('admin-exceptions-list');
    list.innerHTML = '<div class="spinner"></div>';

    const { data, error } = await supabase
        .from('exception_requests')
        .select(`
            *,
            user:users!user_id (
                full_name,
                gpa
            )
        `)
        .eq('status', 'PENDING');

    if (error) {
        console.error("Exceptions Load Error:", error);
        list.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
        return;
    }
    
    list.innerHTML = data.length === 0 ? '<p style="text-align:center; padding:20px; color:#666;">No pending requests.</p>' : '';
    document.getElementById('pending-exc-count').textContent = data.length;

    data.forEach(req => {
        // Safe check for user object
        const userName = req.user ? req.user.full_name : 'Unknown User';
        const userGpa = req.user ? req.user.gpa : 'N/A';

        const card = document.createElement('div');
        card.className = 'adm-card status-pending'; 
        card.innerHTML = `
            <div class="adm-header">
                <span class="badge ${req.type === 'PREREQ' ? 'badge-blue' : 'badge-yellow'}">${req.type}</span>
                <span class="adm-date">${req.course_code}</span>
            </div>
            <div class="rc-body">
                <h3 class="adm-name">${userName}</h3>
                <p style="font-size:0.85rem; color:var(--primary);">GPA: ${userGpa}</p>
                <p class="rc-desc" style="margin: 10px 0; font-style: italic; color:#bbb;">"${req.reason}"</p>
                <textarea id="resp-${req.request_id}" placeholder="Reason for decision..." class="modern-textarea" style="margin-bottom:10px;"></textarea>
            </div>
            <div class="box-grid-2">
                <button onclick="handleDecision(${req.request_id}, 'REJECTED')" class="delete-btn">Reject</button>
                <button onclick="handleDecision(${req.request_id}, 'APPROVED')" class="accept-btn">Approve</button>
            </div>
        `;
        list.appendChild(card);
    });
}
window.handleDecision = async function(requestId, decision) {
    const response = document.getElementById(`resp-${requestId}`).value;
    
    const { error } = await supabase
        .from('exception_requests')
        .update({ 
            status: decision, 
            admin_response: response,
        })
        .eq('request_id', requestId);

    if (error) alert("Error: " + error.message);
    else {
        alert(`Request ${decision.toLowerCase()}!`);
        loadAdminExceptions();
    }
};