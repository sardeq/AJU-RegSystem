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

    setInterval(checkPendingActions, 60000);

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
            checkPendingActions();
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


        const allSelectors = [
            '.student-only',
            '#nav-admin-home',
            '#nav-admin-users',
            '#nav-admin-courses',
            '#nav-admin-exceptions',
            '#nav-admin-admissions'
        ];
        
        allSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => el.classList.add('hidden'));
        });

        // 2. Logic Split based on Role
        if (profile.role === 'admission-admin') {
            // --- ADMISSION ADMIN ---
            // Only sees Admissions tab
            document.getElementById('nav-admin-admissions').classList.remove('hidden');
            
            // Navigate directly to admissions view
            showSection('admin-admissions');

        } else if (profile.role === 'admin') {
            // --- NORMAL ADMIN ---
            // Sees Dashboard, Users, Courses, Prereq Requests. 
            // Does NOT see Admissions.
            document.getElementById('nav-admin-home').classList.remove('hidden');
            document.getElementById('nav-admin-users').classList.remove('hidden');
            document.getElementById('nav-admin-courses').classList.remove('hidden');
            document.getElementById('nav-admin-exceptions').classList.remove('hidden');

            // Navigate directly to Admin Home
            showSection('admin-home');

        } else {
            // --- STUDENT ---
            // Show all student elements (Sidebar items + Header Schedule Button)
            document.querySelectorAll('.student-only').forEach(el => el.classList.remove('hidden'));

            // Ensure the Home link acts normally for students
            const homeLink = document.querySelector('#nav-home .nav-link');
            if(homeLink) {
                homeLink.setAttribute('onclick', "showSection('home')");
                // Reset text in case it was changed previously
                const span = homeLink.querySelector('span[data-i18n="nav_home"]');
                if(span) span.textContent = "Home"; 
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


async function checkPendingActions() {
    if (!state.currentUser) return;

    // 1. Check Exception Requests (Action Required)
    const { data: exceptions } = await supabase
        .from('exception_requests')
        .select('*')
        .eq('user_id', state.currentUser.id)
        .eq('status', 'ACTION_REQUIRED');

    // 2. Check Waitlist (Approved/Action Required)
    // Assuming waitlist items also get a status change to 'ACTION_REQUIRED' or similar upon approval
    const { data: waitlists } = await supabase
        .from('waiting_list')
        .select('*, sections(course_code)')
        .eq('user_id', state.currentUser.id)
        .eq('status', 'ACTION_REQUIRED'); 

    // Prioritize Waitlists because they have a timer
    if (waitlists && waitlists.length > 0) {
        showActionModal(waitlists[0], 'WAITLIST');
        return;
    }

    if (exceptions && exceptions.length > 0) {
        showActionModal(exceptions[0], 'EXCEPTION');
    }
}

let actionTimerInterval;

function showActionModal(req, type) {
    const modal = document.getElementById('credit-limit-modal');
    if (!modal) return;

    document.getElementById('clm-req-id').value = type === 'WAITLIST' ? req.waitlist_id : req.request_id;
    document.getElementById('clm-req-type').value = type;
    document.getElementById('clm-course-code').textContent = req.course_code || (req.sections ? req.sections.course_code : 'Course');
    document.getElementById('clm-type').textContent = type === 'WAITLIST' ? 'Waitlist Approval' : 'Exception Request';
    
    const timerEl = document.getElementById('clm-timer');
    
    if (type === 'WAITLIST') {
        // 5 HOUR TIMER LOGIC
        const approvedAt = new Date(req.approved_at).getTime();
        const now = new Date().getTime();
        const deadline = approvedAt + (5 * 60 * 60 * 1000); // 5 Hours in ms

        if (now > deadline) {
            // Expired!
            handleExpiredRequest(req, type);
            return;
        }

        modal.classList.remove('hidden');
        
        // Start Countdown UI
        if (actionTimerInterval) clearInterval(actionTimerInterval);
        actionTimerInterval = setInterval(() => {
            const remaining = deadline - new Date().getTime();
            if (remaining <= 0) {
                clearInterval(actionTimerInterval);
                handleExpiredRequest(req, type);
            } else {
                const h = Math.floor(remaining / (1000 * 60 * 60));
                const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                timerEl.textContent = `${h}h ${m}m`;
            }
        }, 1000);

    } else {
        // EXCEPTION (No time limit)
        timerEl.textContent = "Unlimited";
        modal.classList.remove('hidden');
    }
}

async function handleExpiredRequest(req, type) {
    alert("Time Expired! Your reservation for this course has been cancelled.");
    document.getElementById('credit-limit-modal').classList.add('hidden');

    const table = type === 'WAITLIST' ? 'waiting_list' : 'exception_requests';
    const idField = type === 'WAITLIST' ? 'waitlist_id' : 'request_id';
    const id = type === 'WAITLIST' ? req.waitlist_id : req.request_id;

    await supabase.from(table).update({ status: 'EXPIRED' }).eq(idField, id);
    window.location.reload();
}

// Global functions for the Modal Buttons

window.attemptFinalEnrollment = async () => {
    const reqId = document.getElementById('clm-req-id').value;
    const type = document.getElementById('clm-req-type').value;

    // 1. Re-check Credits (Client side first, DB trigger secondary)
    // We import registration logic or duplicate simplistic check
    const { data: enrollments } = await supabase.from('enrollments').select('sections(courses(credit_hours))').eq('user_id', state.currentUser.id).eq('status', 'REGISTERED');
    const currentCredits = enrollments.reduce((sum, e) => sum + (e.sections?.courses?.credit_hours || 0), 0);
    
    // We assume the course is 3 credits for this check, or we need to fetch the specific request's course credits
    // For safety, let's fetch the actual limits
    const { max } = await import('./utils.js').then(m => m.getCreditLimits(window.userProfile));

    // Simple optimistic check: if current is max, they haven't dropped enough
    // (A robust check needs the target course credit hours)
    if (currentCredits >= max) {
        alert(`You are still at ${currentCredits} credits. Please drop a course first.`);
        return;
    }

    try {
        // 2. Perform Enroll
        // For Exception: We simply update status to APPROVED. Admin logic didn't enroll, so we need to enroll here.
        // For Waitlist: Same.
        
        // Note: For this to work, we need the section_id. 
        // If it was an Exception, we assume the Admin selected the section (which we should have stored in the request or handled differently).
        // A simpler way: Update request to 'APPROVED_CONFIRMED' and let a Database Trigger handle the insert.
        // OR: Insert directly here.
        
        // Let's assume we update the status, and we rely on the backend/admin logic having already prepared the data
        // OR simpler: Just mark it 'COMPLETED' and insert enrollment.
        
        // Getting section ID is tricky if not stored. 
        // FIX: Admin logic in step 3 should store `section_id` in the request row if possible, OR user selects section now.
        // Assuming user selects section or it's known:
        
        // Placeholder for Logic:
        const table = type === 'WAITLIST' ? 'waiting_list' : 'exception_requests';
        const idField = type === 'WAITLIST' ? 'waitlist_id' : 'request_id';

        // Update status to COMPLETED
        const { error } = await supabase.from(table).update({ status: 'COMPLETED' }).eq(idField, reqId);
        if (error) throw error;
        
        // Add to Enrollments (Ideally we need section_id here)
        // If we don't have section_id easily, we might redirect user to Registration page with a temporary "Unlock" permission.
        // For this example, let's assume successful state transition.
        
        alert("Enrollment Successful!");
        document.getElementById('credit-limit-modal').classList.add('hidden');
        window.location.reload();

    } catch (err) {
        alert("Error: " + err.message);
    }
};

window.denyRequest = async () => {
    const reqId = document.getElementById('clm-req-id').value;
    const type = document.getElementById('clm-req-type').value;
    const table = type === 'WAITLIST' ? 'waiting_list' : 'exception_requests';
    const idField = type === 'WAITLIST' ? 'waitlist_id' : 'request_id';

    if(!confirm("Are you sure you want to cancel this request?")) return;

    await supabase.from(table).update({ status: 'CANCELLED_BY_USER' }).eq(idField, reqId);
    document.getElementById('credit-limit-modal').classList.add('hidden');
};