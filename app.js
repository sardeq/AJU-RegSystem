// Import Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm'
import config from './config.js';

// --- CONFIGURATION ---
const supabaseUrl = config.SUPABASE_URL
const supabaseKey = config.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// --- DOM ELEMENTS ---
const authContainer = document.getElementById('auth-container');
const homeContainer = document.getElementById('home-container');
const regContainer = document.getElementById('registration-container');
const sidebar = document.getElementById('sidebar');
const menuBtn = document.querySelector('.menu-btn');

// Auth Form Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const fullNameInput = document.getElementById('full-name'); 
const confirmPassInput = document.getElementById('confirm-password'); 
const authActionBtn = document.getElementById('auth-action-btn'); 
const toggleAuthLink = document.getElementById('toggle-auth-mode'); 
const formTitle = document.getElementById('form-title');
const errorMsg = document.getElementById('error-msg');
const userEmailDisplay = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// AI Elements
const aiBtn = document.querySelector('.enhance-ai-btn');
const aiModal = document.getElementById('ai-modal');
const closeModal = document.querySelector('.close-modal');
const aiLoading = document.getElementById('ai-loading');
const aiResults = document.getElementById('ai-results');
const aiPrefModal = document.getElementById('ai-pref-modal');
const closePrefBtn = document.getElementById('close-pref-btn');
const generateBtn = document.getElementById('generate-schedule-btn');

// --- STATE MANAGEMENT ---
let currentUser = null;
let isLoginMode = true; // Default to Login mode



const translations = {
    en: {
        nav_home: "Home",
        nav_reg: "Registration",
        nav_sheet: "Courses Sheet",
        nav_plan: "Student Plan",
        nav_exceptions: "Exceptions",
        auth_login_title: "Login",
        auth_signup_title: "Create Account",
        ph_fullname: "Full Name",
        ph_email: "Email",
        ph_password: "Password",
        ph_confirm_pass: "Confirm Password",
        btn_login: "Log In",
        btn_signup: "Sign Up",
        auth_no_account: "Don't have an account? ",
        auth_have_account: "Already have an account? ",
        btn_schedule: "Schedule",
        btn_logout: "Log Out",
        btn_ai_enhance: "Enhance with AI",
        ai_pref_title: "🎛️ Customize Your Schedule",
        btn_generate: "Generate Recommendations ✨",
        welcome_title: "Welcome, "
    },
    ar: {
        nav_home: "الرئيسية",
        nav_reg: "التسجيل",
        nav_sheet: "صحيفة المواد",
        nav_plan: "الخطة الدراسية",
        nav_exceptions: "الاستثناءات",
        auth_login_title: "تسجيل الدخول",
        auth_signup_title: "إنشاء حساب",
        ph_fullname: "الاسم الكامل",
        ph_email: "البريد الإلكتروني",
        ph_password: "كلمة المرور",
        ph_confirm_pass: "تأكيد كلمة المرور",
        btn_login: "دخول",
        btn_signup: "تسجيل",
        auth_no_account: "ليس لديك حساب؟ ",
        auth_have_account: "لديك حساب بالفعل؟ ",
        btn_schedule: "الجدول الدراسي",
        btn_logout: "تسجيل خروج",
        btn_ai_enhance: "تحسين بالذكاء الاصطناعي",
        ai_pref_title: "🎛️ تخصيص جدولك",
        btn_generate: "إنشاء التوصيات ✨",
        welcome_title: "أهلاً بك، "
    }
};


const langBtn = document.querySelector('.lang-btn');
let currentLang = localStorage.getItem('app_lang') || 'en';

function applyLanguage(lang) {
    // 1. Update Direction and Lang attribute
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // 2. Update Text Content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // 3. Update Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    // 4. Save Preference
    localStorage.setItem('app_lang', lang);
    currentLang = lang;
}

if (langBtn) {
    langBtn.addEventListener('click', () => {
        const newLang = currentLang === 'en' ? 'ar' : 'en';
        applyLanguage(newLang);
    });
}

// Apply language on load
applyLanguage(currentLang);

// --- AUTH FUNCTIONS ---

// 1. Toggle between Login and Signup UI
if (toggleAuthLink) {
    toggleAuthLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        errorMsg.textContent = ''; // Clear errors

        // Find the extra fields (Name, Confirm Password)
        const extraFields = document.querySelectorAll('.auth-extra');
        
        if (isLoginMode) {
            // Switch to Login View
            formTitle.textContent = 'Login';
            authActionBtn.textContent = 'Log In';
            document.getElementById('toggle-text').textContent = "Don't have an account? ";
            toggleAuthLink.textContent = 'Sign Up';
            extraFields.forEach(el => el.classList.add('hidden'));
        } else {
            // Switch to Signup View
            formTitle.textContent = 'Create Account';
            authActionBtn.textContent = 'Sign Up';
            document.getElementById('toggle-text').textContent = "Already have an account? ";
            toggleAuthLink.textContent = 'Log In';
            extraFields.forEach(el => el.classList.remove('hidden'));
        }
    });
}

// 2. Handle Auth Action (Login OR Signup)
async function handleAuth() {
    errorMsg.textContent = '';
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        errorMsg.textContent = 'Please fill in all required fields.';
        return;
    }

    authActionBtn.disabled = true;
    authActionBtn.textContent = 'Processing...';

    try {
        if (isLoginMode) {
            // --- LOGIN LOGIC ---
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
        
        } else {
            // --- SIGNUP LOGIC ---
            const fullName = fullNameInput.value;
            const confirmPass = confirmPassInput.value;

            // Validation
            if (!fullName) throw new Error("Full Name is required.");
            if (password !== confirmPass) throw new Error("Passwords do not match.");
            if (password.length < 6) throw new Error("Password must be at least 6 characters.");

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName } // Metadata
                }
            });

            if (error) throw error;
            alert("Registration successful! You are now logged in.");
        }
    } catch (error) {
        console.error(error);
        errorMsg.textContent = error.message;
    } finally {
        authActionBtn.disabled = false;
        authActionBtn.textContent = isLoginMode ? 'Log In' : 'Sign Up';
    }
}

// 3. UI Helpers
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}

window.showSection = function(sectionName) {
    homeContainer.classList.add('hidden');
    regContainer.classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    if (sectionName === 'home') {
        homeContainer.classList.remove('hidden');
        if(document.getElementById('nav-home')) document.getElementById('nav-home').classList.add('active');
    } else if (sectionName === 'registration') {
        regContainer.classList.remove('hidden');
        if(document.getElementById('nav-reg')) document.getElementById('nav-reg').classList.add('active');
    }
}

function updateUI(session) {
    if (session) {
        currentUser = session.user;
        authContainer.classList.add('hidden');
        sidebar.classList.remove('hidden');
        showSection('home');
        
        // Update user name in Sidebar
        const userNameDisplay = document.querySelector('.user-name');
        if(userNameDisplay && session.user.user_metadata.full_name) {
            userNameDisplay.textContent = session.user.user_metadata.full_name;
        }

        if(userEmailDisplay) userEmailDisplay.textContent = session.user.email;
    } else {
        currentUser = null;
        authContainer.classList.remove('hidden');
        sidebar.classList.add('hidden');
        homeContainer.classList.add('hidden');
        regContainer.classList.add('hidden');
        
        // Reset inputs
        emailInput.value = '';
        passwordInput.value = '';
    }
}

async function logout() {
    await supabase.auth.signOut();
}

// --- AI LOGIC START ---

// 1. Fetch Data for AI
async function fetchStudentContext(userId) {
    console.log("Fetching context for user:", userId);

    const { data: history, error: historyError } = await supabase
        .from('enrollments')
        .select(`
            status, grade_value,
            sections (
                course_code,
                courses (course_name_en, credit_hours)
            )
        `)
        .eq('user_id', userId)
        .eq('status', 'COMPLETED');

    if (historyError) throw new Error("Could not fetch student history.");
    const passedCourses = history ? history.map(h => h.sections?.course_code).filter(Boolean) : [];

    const { data: current } = await supabase
        .from('enrollments')
        .select(`sections (course_code)`)
        .eq('user_id', userId)
        .eq('status', 'ENROLLED');
    
    const inProgressCourses = current ? current.map(c => c.sections?.course_code).filter(Boolean) : [];
    const allKnowledge = [...passedCourses, ...inProgressCourses];

    const { data: availableSections, error: sectionsError } = await supabase
        .from('sections')
        .select(`
            section_id, course_code, schedule_text, instructor_name,
            courses (
                course_name_en, credit_hours, category,
                prerequisites!prerequisites_course_code_fkey (prereq_code)
            )
        `)
        .eq('semester_id', 20252)
        .eq('status', 'OPEN');

    if (sectionsError) throw new Error("Database Error: " + sectionsError.message); 
    if (!availableSections) return { history: passedCourses, options: [] };

    const eligibleSections = availableSections.filter(section => {
        const coursePrereqs = section.courses?.prerequisites || [];
        if (coursePrereqs.length === 0) return true;
        const unmet = coursePrereqs.filter(p => !allKnowledge.includes(p.prereq_code));
        return unmet.length === 0;
    });

    return { history: passedCourses, options: eligibleSections };
}

// 2. Call Supabase Edge Function
async function getOpenRouterRecommendations(context, preferences) {
    try {
        console.log("Asking AI for help...");
        const { data, error } = await supabase.functions.invoke('generate-schedule', {
            body: { context, preferences }
        });
        if (error) throw new Error(error.message);
        return data; 
    } catch (error) {
        console.error("AI Error:", error);
        alert(`AI Failed: ${error.message}`);
        return [];
    }
}

// 3. Render Results
function renderPlans(plans) {
    if (!plans || plans.length === 0) {
        aiResults.innerHTML = '<p>No valid plans generated.</p>';
        return;
    }

    plans.forEach(plan => {
        const card = document.createElement('div');
        card.className = 'schedule-card';
        
        let coursesHtml = plan.courses.map(c => 
            `<li><span>${c.code} - ${c.name}</span><small>${c.time}</small></li>`
        ).join('');

        const safeData = encodeURIComponent(JSON.stringify(plan.courses));

        card.innerHTML = `
            <span class="card-tag">${plan.title}</span>
            <p class="card-reasoning">${plan.reasoning}</p>
            <ul class="card-courses">${coursesHtml}</ul>
            <button class="accept-btn" data-courses="${safeData}">Accept Schedule</button>
        `;
        aiResults.appendChild(card);
    });

    document.querySelectorAll('.accept-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const coursesData = JSON.parse(decodeURIComponent(e.target.dataset.courses));
            applySchedule(coursesData);
        });
    });
}

async function applySchedule(courses) {
    if (!currentUser || !currentUser.id) {
        alert("Session expired. Please log in again.");
        return;
    }

    if(!confirm(`Register for these ${courses.length} courses?`)) return;
    const userId = currentUser.id;
    
    const enrollments = courses.map(c => ({
        user_id: userId,
        section_id: c.section_id,
        status: 'REGISTERED',
        grade_value: null
    }));

    const { error } = await supabase
        .from('enrollments')
        .upsert(enrollments, { onConflict: 'user_id, section_id', ignoreDuplicates: true });

    if (error) {
        alert('Error registering: ' + error.message);
    } else {
        alert('Successfully Registered!');
        aiModal.classList.add('hidden');
    }
};

// --- EVENT LISTENERS (Consolidated) ---

if (authActionBtn) authActionBtn.addEventListener('click', handleAuth);
if (logoutBtn) logoutBtn.addEventListener('click', logout);

// AI Listeners
if (aiBtn) aiBtn.addEventListener('click', () => {
    if (!currentUser) { alert("Please log in."); return; }
    aiPrefModal.classList.remove('hidden');
});

if (generateBtn) generateBtn.addEventListener('click', async () => {
    // A. Gather Form Data
    const intensityEl = document.querySelector('input[name="intensity"]:checked');
    const intensity = intensityEl ? intensityEl.value : 'Balanced';
    const time = document.getElementById('time-pref').value;
    const focus = document.getElementById('focus-pref').value;
    
    const days = [];
    document.querySelectorAll('input[name="days"]:checked').forEach(cb => days.push(cb.value));

    if (days.length === 0) {
        alert("Please select at least one day preference.");
        return;
    }
    const preferences = { intensity, time, focus, days };

    // B. Switch Modals
    aiPrefModal.classList.add('hidden');
    aiModal.classList.remove('hidden');
    aiLoading.classList.remove('hidden');
    aiResults.innerHTML = ''; 

    try {
        const userId = currentUser.id;
        const context = await fetchStudentContext(userId);
        
        if (context.options.length === 0) throw new Error("No eligible courses found.");

        const plans = await getOpenRouterRecommendations(context, preferences);
        
        aiLoading.classList.add('hidden');
        renderPlans(plans);

    } catch (err) {
        console.error(err);
        aiLoading.innerHTML = `<p style="color:red; text-align:center;">${err.message}</p>`;
    }
});

if(closePrefBtn) closePrefBtn.addEventListener('click', () => aiPrefModal.classList.add('hidden'));
if(closeModal) closeModal.addEventListener('click', () => aiModal.classList.add('hidden'));

window.onclick = function(event) {
    if (event.target == aiModal) aiModal.classList.add('hidden');
    if (event.target == aiPrefModal) aiPrefModal.classList.add('hidden');
}

// Init Supabase Listener
supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session);
});