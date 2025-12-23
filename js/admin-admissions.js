import { supabase } from './config.js';
import { state } from './state.js';

let allApplications = [];
let currentFilter = 'pending';
let selectedAppId = null;

export async function loadAdminDashboard() {
    // 1. Double check permission (Security)
    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', state.currentUser.id)
        .single();

    if (userProfile?.role !== 'admission-admin') {
        alert("⛔ Access Denied");
        window.location.reload(); // Force reload to reset state
        return;
    }
    
    const grid = document.getElementById('admin-apps-grid');
    grid.innerHTML = '<div class="spinner"></div>';

    try {
        console.log("Fetching admissions...");
        
        // 2. Select Data
        const { data, error } = await supabase
            .from('admissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase Error:", error);
            throw error;
        }

        console.log("Admissions loaded:", data);
        allApplications = data || [];
        
        updateStats();
        renderApplications();

    } catch (err) {
        console.error("Critical Error:", err);
        grid.innerHTML = `
            <div style="color:red; text-align:center; padding: 20px;">
                <h3>Failed to load data</h3>
                <p>${err.message || "Check database permissions (RLS)"}</p>
            </div>`;
    }
}

function updateStats() {
    document.getElementById('stat-total-apps').textContent = allApplications.length;
    document.getElementById('admin-pending-count').textContent = allApplications.filter(a => a.status === 'pending' || !a.status).length;
    
    // Calculate Avg GPA
    const totalGpa = allApplications.reduce((sum, app) => sum + (app.gpa || 0), 0);
    const avg = allApplications.length ? (totalGpa / allApplications.length).toFixed(1) : 0;
    document.getElementById('stat-avg-gpa').textContent = avg + "%";

    // Find popular major
    const majors = allApplications.map(a => a.major);
    if(majors.length > 0) {
        const mode = majors.sort((a,b) => majors.filter(v => v===a).length - majors.filter(v => v===b).length).pop();
        document.getElementById('stat-pop-major').textContent = mode;
    }
}

window.filterApplications = (status) => {
    currentFilter = status.toLowerCase();
    
    // UI toggle active class
    document.querySelectorAll('.filter-pill').forEach(btn => {
        if(btn.textContent.toLowerCase() === status) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    renderApplications();
};

function renderApplications() {
    const grid = document.getElementById('admin-apps-grid');
    grid.innerHTML = '';

    const filtered = allApplications.filter(app => {
        // Handle null status by defaulting to 'pending'
        const st = (app.status || 'pending').toLowerCase();
        return st === currentFilter;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; color:#666; padding:50px;">
                No applications found with status: <strong>${currentFilter}</strong>
            </div>`;
        return;
    }

    filtered.forEach(app => {
        const date = new Date(app.created_at).toLocaleDateString();
        
        // Handle names safely based on language
        const displayName = state.currentLang === 'ar' 
            ? (app.arabic_name || app.english_name) 
            : (app.english_name || app.arabic_name);

        const card = document.createElement('div');
        // Ensure status class matches CSS (lowercase)
        const statusClass = (app.status || 'pending').toLowerCase();
        card.className = `adm-card status-${statusClass}`;
        
        card.innerHTML = `
            <div class="adm-header">
                <span class="badge badge-gray">#${app.id}</span>
                <span class="adm-date">${date}</span>
            </div>
            <div>
                <h3 class="adm-name">${displayName}</h3>
                <span style="color:var(--primary); font-size:0.9rem;">${app.major || 'Unknown Major'}</span>
            </div>
            <div class="adm-meta">
                <div class="adm-pill">
                    <span>GPA</span>
                    <strong>${app.gpa}%</strong>
                </div>
                <div class="adm-pill">
                    <span>Branch</span>
                    <strong>${app.branch}</strong>
                </div>
            </div>
            <button class="btn-adm-view" onclick="openAdminModal(${app.id})">Review Application</button>
        `;
        grid.appendChild(card);
    });
}

// Make available globally
window.openAdminModal = (id) => {
    const app = allApplications.find(a => a.id == id);
    if(!app) return;
    selectedAppId = id;

    const modal = document.getElementById('admin-modal');
    document.getElementById('adm-modal-name').textContent = state.currentLang === 'ar' ? app.arabic_name : app.english_name;
    document.getElementById('adm-modal-gpa').textContent = app.gpa;
    document.getElementById('adm-modal-major').textContent = app.major;
    document.getElementById('adm-modal-nid').textContent = app.national_id;

    // Set file links (Assuming URL logic, adjust based on your storage)
    document.getElementById('btn-view-id').href = app.id_file_url || '#';
    document.getElementById('btn-view-grades').href = app.grades_file_url || '#';
    
    // Reset inputs
    document.getElementById('adm-notes').value = '';

    modal.classList.remove('hidden');
};

window.closeAdminModal = () => {
    document.getElementById('admin-modal').classList.add('hidden');
    selectedAppId = null;
};

window.processApplication = async (decision) => {
    if(!selectedAppId) return;
    
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = "Processing...";
    btn.disabled = true;

    try {
        const { error } = await supabase
            .from('admissions')
            .update({ status: decision.toLowerCase() })
            .eq('id', selectedAppId);

        if(error) throw error;

        // If accepted, logic to create User account would go here
        // e.g., await supabase.auth.signUp(...)

        // Update local state
        const app = allApplications.find(a => a.id == selectedAppId);
        if(app) app.status = decision.toLowerCase();

        alert(`Application ${decision}!`);
        closeAdminModal();
        updateStats();
        renderApplications();

    } catch (err) {
        console.error(err);
        alert("Error updating status.");
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
};