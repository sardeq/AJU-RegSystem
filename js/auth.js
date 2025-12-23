import { supabase } from './config.js';
import { state } from './state.js';
import { loadDashboardData } from './dashboard.js';

const authContainer = document.getElementById('auth-container');
const sidebar = document.getElementById('sidebar');

export async function handleAuth(isLoginMode) {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('auth-action-btn');
    const errorMsg = document.getElementById('error-msg');

    if(errorMsg) errorMsg.textContent = '';
    
    try {
        btn.textContent = 'Processing...';
        btn.disabled = true;

        if (isLoginMode) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else {
            const fullName = document.getElementById('full-name').value;
            const { error } = await supabase.auth.signUp({
                email, password, options: { data: { full_name: fullName } }
            });
            if (error) throw error;
            alert("Account created! You are logged in.");
        }
    } catch (err) {
        if(errorMsg) errorMsg.textContent = err.message;
    } finally {
        btn.textContent = isLoginMode ? 'Log In' : 'Sign Up';
        btn.disabled = false;
    }
}

export async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
}

export function updateAuthUI(session) {
    const body = document.body;
    const authContainer = document.getElementById('auth-container');
    const sidebar = document.getElementById('sidebar');

    if (session) {
        state.currentUser = session.user;
        body.classList.remove('auth-mode');
        
        if(authContainer) authContainer.classList.add('hidden');
        if(sidebar) sidebar.classList.remove('hidden');
        
        // Update Sidebar Profile
        const sideName = document.getElementById('sidebar-user-name');
        if (sideName && session.user.user_metadata?.full_name) {
            sideName.textContent = session.user.user_metadata.full_name;
        }

        // FIX: Add error handling for data load
        if (session.user.id) {
            // We don't await this so the UI updates immediately
            loadDashboardData(session.user.id).catch(err => {
                console.error("Dashboard data load failed:", err);
            });
        }

    } else {
        state.currentUser = null;
        body.classList.add('auth-mode');
        if(authContainer) authContainer.classList.remove('hidden');
        if(sidebar) sidebar.classList.add('hidden');
        
        // Hide all dashboard views
        document.querySelectorAll('.dashboard-view').forEach(el => el.classList.add('hidden'));
    }
}