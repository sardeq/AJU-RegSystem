import { supabase } from './config.js';
import { state } from './state.js';
import { applyLanguage } from './utils.js';
import { updateAuthUI, handleAuth, logout } from './auth.js';
import { loadRegistrationData, setupRegistrationListeners } from './registration.js';
import { loadFullSchedule, loadHistoryTimeline } from './schedule.js';
import { loadStudentPlan } from './plan.js';
import { loadCoursesSheetData, setupSheetListeners } from './courses-sheet.js';
import { loadExceptionHistory, setupExceptionListeners } from './exceptions.js'; 
import { setupAIListeners } from './ai.js'; 
import { loadAdminDashboard } from './admin-admissions.js';
import { loadAdminExceptions, loadAdminUsers , loadAdminHome} from './admin-management.js';

// --- Navigation Handler ---
window.showSection = function(sectionName) {
    document.querySelectorAll('.dashboard-view').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    if (sectionName === 'admin-home') loadAdminHome();
    if (sectionName === 'admin-courses') import('./admin-management.js').then(m => m.loadAdminCourses());
    if (sectionName === 'admin-admissions') loadAdminDashboard();
    if (sectionName === 'admin-exceptions') loadAdminExceptions();
    if (sectionName === 'admin-users') loadAdminUsers();

    const containerId = (sectionName === 'sheet' ? 'courses-sheet-container' : 
                         sectionName === 'registration' ? 'registration-container' : 
                         sectionName + '-container');

    const container = document.getElementById(containerId);
    if(container) container.classList.remove('hidden');
    
    const navId = sectionName === 'admin-home' ? 'nav-home' : 'nav-' + sectionName;
    const navItem = document.getElementById(navId);
    if(navItem) navItem.classList.add('active');

    // MOBILE FIX: Close sidebar automatically when a link is clicked on mobile
    if (window.innerWidth <= 900) {
        closeMobileSidebar();
    }

    if(!state.currentUser) return;
    const userId = state.currentUser.id;

    if (sectionName === 'registration') loadRegistrationData(userId);
    else if (sectionName === 'schedule') {
        loadFullSchedule(userId);
        loadHistoryTimeline(userId);
    }
    else if (sectionName === 'plan') loadStudentPlan(userId);
    else if (sectionName === 'sheet') loadCoursesSheetData(userId);
    else if (sectionName === 'exceptions') loadExceptionHistory(userId);
};

// --- Mobile Sidebar Helpers ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if(sidebar) sidebar.classList.toggle('mobile-open'); // Matches new CSS
    if(overlay) overlay.classList.toggle('active');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if(sidebar) sidebar.classList.remove('mobile-open');
    if(overlay) overlay.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(state.currentLang);
    
    setupRegistrationListeners();
    setupSheetListeners();
    setupAIListeners();
    setupExceptionListeners(); 

    // --- SIDEBAR TOGGLE LOGIC (FIXED) ---
    const menuBtn = document.querySelector('.menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop click from hitting document
            
            // Check screen size to decide behavior
            if (window.innerWidth <= 900) {
                // Mobile: Slide in/out
                toggleSidebar();
            } else {
                // Desktop: Collapse/Expand
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    // Close when clicking the overlay (Black background)
    if (overlay) {
        overlay.addEventListener('click', closeMobileSidebar);
    }

    // --- Language Toggle ---
    const langBtn = document.querySelector('.lang-btn');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            const newLang = state.currentLang === 'en' ? 'ar' : 'en';
            applyLanguage(newLang);
             if (state.currentUser && !document.getElementById('home-container').classList.contains('hidden')) {
                import('./dashboard.js').then(m => m.loadDashboardData(state.currentUser.id));
            }
        });
    }

supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth Event:", event);
        state.currentUser = session?.user || null;
        updateAuthUI(session);

        const adminNav = document.getElementById('nav-admin-admissions');
        const studentNavs = document.querySelectorAll('.student-only');

        if (session?.user) {
            // 1. OPTIMISTIC UI: Default to Student View IMMEDIATELY
            // This ensures the screen is never blank/stuck while loading
            if(adminNav) adminNav.classList.add('hidden');
            studentNavs.forEach(el => el.classList.remove('hidden'));

            // Force 'home' if no specific view is active (handles Refresh)
            if (!document.querySelector('.dashboard-view:not(.hidden)')) {
                showSection('home');
            }

            // 2. CHECK ROLE IN BACKGROUND
            // We do not 'await' this, so the UI stays responsive
            checkUserRole(session.user.id);
        } else {
            // LOGGED OUT
            if(adminNav) adminNav.classList.add('hidden');
            document.querySelectorAll('.dashboard-view').forEach(el => el.classList.add('hidden'));
            if(document.getElementById('auth-container')) {
                document.getElementById('auth-container').classList.remove('hidden');
            }
        }
    });
    
async function checkUserRole(userId) {
    try {
        const { data: profile, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (error) throw error;

        // 1. Reset: Hide ALL navigation items first
        const allNavIds = [
            'nav-home', 'nav-registration', 'nav-sheet', 'nav-schedule', 'nav-plan', 'nav-exceptions', // Student
            'nav-admin-home', 'nav-admin-users', 'nav-admin-courses', 'nav-admin-exceptions', 'nav-admin-admissions' // Admin
        ];
        allNavIds.forEach(id => document.getElementById(id)?.classList.add('hidden'));

        // 2. Role-Based Visibility Logic
        if (profile.role === 'admission-admin') {
            // --- ADMISSION ADMIN ---
            // Requirement: "Only see admissions"
            document.getElementById('nav-admin-admissions').classList.remove('hidden');
            
            // Default view for this role
            showSection('admin-admissions');

        } else if (profile.role === 'admin') {
            // --- NORMAL ADMIN ---
            // Requirement: See Admin Home, Users, Courses, Exceptions. NOT Admissions.
            document.getElementById('nav-admin-home').classList.remove('hidden');
            document.getElementById('nav-admin-users').classList.remove('hidden');
            document.getElementById('nav-admin-courses').classList.remove('hidden');
            document.getElementById('nav-admin-exceptions').classList.remove('hidden');

            // Default view for this role
            showSection('admin-home');

        } else {
            // --- STUDENT ---
            document.getElementById('nav-home').classList.remove('hidden');
            document.getElementById('nav-registration').classList.remove('hidden');
            document.getElementById('nav-sheet').classList.remove('hidden');
            document.getElementById('nav-schedule').classList.remove('hidden');
            document.getElementById('nav-plan').classList.remove('hidden');
            document.getElementById('nav-exceptions').classList.remove('hidden');

            // Ensure the Home link acts normally for students
            const homeLink = document.querySelector('#nav-home .nav-link');
            if(homeLink) {
                homeLink.setAttribute('onclick', "showSection('home')");
                homeLink.querySelector('span[data-i18n="nav_home"]').textContent = "Home"; // Reset text if it was changed
            }

            showSection('home');
        }

    } catch (err) {
        console.error("Role check failed:", err);
    }
}

    document.body.addEventListener('click', (e) => {
        if (e.target.closest('#sidebar-logout-btn')) {
            e.preventDefault();
            import('./auth.js').then(m => m.logout());
        }
    });

    document.getElementById('auth-action-btn')?.addEventListener('click', () => {
        const nameField = document.getElementById('full-name');
        const isLoginMode = nameField.classList.contains('hidden');
        handleAuth(isLoginMode);
    });

    const toggleBtn = document.getElementById('toggle-auth-mode');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const formTitle = document.getElementById('form-title');
            const authBtn = document.getElementById('auth-action-btn');
            const toggleText = document.getElementById('toggle-text');
            const nameInput = document.getElementById('full-name');
            const confirmPass = document.getElementById('confirm-password');

            const isCurrentlyLogin = nameInput.classList.contains('hidden');

            if (isCurrentlyLogin) {
                nameInput.classList.remove('hidden');
                confirmPass.classList.remove('hidden');
                formTitle.setAttribute('data-i18n', 'auth_signup_title');
                authBtn.setAttribute('data-i18n', 'btn_signup');
                toggleText.setAttribute('data-i18n', 'auth_have_account');
                toggleBtn.setAttribute('data-i18n', 'btn_login');
            } else {
                nameInput.classList.add('hidden');
                confirmPass.classList.add('hidden');
                formTitle.setAttribute('data-i18n', 'auth_login_title');
                authBtn.setAttribute('data-i18n', 'btn_login');
                toggleText.setAttribute('data-i18n', 'auth_no_account');
                toggleBtn.setAttribute('data-i18n', 'btn_signup');
            }
            applyLanguage(state.currentLang);
        });
    }

    document.getElementById('sidebar-logout-btn')?.addEventListener('click', logout);
});