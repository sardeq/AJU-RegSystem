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

window.showSection = function(sectionName) {
    document.querySelectorAll('.dashboard-view').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const container = document.getElementById(sectionName === 'sheet' ? 'courses-sheet-container' : 
                                            sectionName === 'registration' ? 'registration-container' : 
                                            sectionName + '-container');
    if(container) container.classList.remove('hidden');
    
    const navItem = document.getElementById('nav-' + sectionName);
    if(navItem) navItem.classList.add('active');

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

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(state.currentLang);
    
    setupRegistrationListeners();
    setupSheetListeners();
    setupAIListeners();
    setupExceptionListeners(); 

    const menuBtn = document.querySelector('.menu-btn');
    const sidebar = document.getElementById('sidebar');
    
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-visible');
            sidebar.classList.toggle('collapsed');
        });
    }

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
        state.currentUser = session?.user || null;
        updateAuthUI(session);
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