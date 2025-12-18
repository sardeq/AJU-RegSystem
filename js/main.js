// main.js
import { supabase } from './config.js';
import { state } from './state.js';
import { applyLanguage } from './utils.js';
import { updateAuthUI, handleAuth, logout } from './auth.js';
import { loadRegistrationData, setupRegistrationListeners } from './registration.js';
import { loadFullSchedule, loadHistoryTimeline } from './schedule.js';
import { loadStudentPlan } from './plan.js';
import { loadCoursesSheetData, setupSheetListeners } from './courses-sheet.js';
import { loadExceptionHistory } from './exceptions.js';
import { setupAIListeners } from './ai.js'; // Import setup

// Global Router
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

// Init
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(state.currentLang);
    
    // --- SETUP LISTENERS ---
    setupRegistrationListeners();
    setupSheetListeners();
    setupAIListeners();

    supabase.auth.onAuthStateChange((event, session) => {
        state.currentUser = session?.user || null;
        updateAuthUI(session);
    });

    document.getElementById('auth-action-btn')?.addEventListener('click', () => {
        const isLogin = document.getElementById('form-title').textContent === 'Login';
        handleAuth(isLogin);
    });

    document.getElementById('sidebar-logout-btn')?.addEventListener('click', logout);
});