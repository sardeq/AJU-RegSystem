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
        welcome_title: "Welcome, ",

        lbl_overview: "Overview",
        lbl_rank: "Class Rank",
        lbl_gpa: "GPA",
        lbl_balance: "Balance",
        lbl_absences: "Absences",
        lbl_student_info: "Student Info",
        lbl_name: "Name:",
        lbl_dept: "Department:",
        lbl_id: "Student ID:",
        lbl_classes_attended: "Classes Attended:",
        lbl_sem: "Current Semester:",
        lbl_today_courses: "Courses for Today",
        lbl_view_full: "View Full Schedule",
        lbl_loading: "Loading schedule...",
        lbl_no_classes: "No classes today! 🎉",
        lbl_room: "Room",
        lbl_instructor: "Instr."
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
        welcome_title: "أهلاً بك، ",

        lbl_overview: "نظرة عامة",
        lbl_rank: "الترتيب",
        lbl_gpa: "المعدل التراكمي",
        lbl_balance: "الرصيد",
        lbl_absences: "الغيابات",
        lbl_student_info: "معلومات الطالب",
        lbl_name: "الاسم:",
        lbl_dept: "القسم:",
        lbl_id: "الرقم الجامعي:",
        lbl_classes_attended: "حصص تم حضورها:",
        lbl_sem: "الفصل الحالي:",
        lbl_today_courses: "محاضرات اليوم",
        lbl_view_full: "عرض الجدول الكامل",
        lbl_loading: "جاري تحميل الجدول...",
        lbl_no_classes: "لا يوجد محاضرات اليوم! 🎉",
        lbl_room: "القاعة",
        lbl_instructor: "د."
    }
};

const langBtn = document.querySelector('.lang-btn');
let currentLang = localStorage.getItem('app_lang') || 'en';

function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    localStorage.setItem('app_lang', lang);
    currentLang = lang;
}

if (langBtn) {
    langBtn.addEventListener('click', () => {
        const newLang = currentLang === 'en' ? 'ar' : 'en';
        applyLanguage(newLang);
        // Reload data to apply translation to dynamic content (Course Names)
        if(currentUser) loadDashboardData(currentUser.id);
    });
}

// --- DATA FETCHING ---

async function loadDashboardData(userId) {
    try {
        // 1. Fetch User Profile (GPA, Major, Balance, Rank)
        const { data: userProfile, error: userError } = await supabase
            .from('users')
            .select('*') 
            .eq('id', userId)
            .single();

        if (userError && userError.code !== 'PGRST116') {
            console.error("Error fetching user profile:", userError);
        }

        // 2. Fetch Active Enrollments (Status = REGISTERED)
        // Also fetching 'absences' from the enrollment table
        const { data: scheduleData, error: scheduleError } = await supabase
            .from('enrollments')
            .select(`
                status,
                absences, 
                sections (
                    schedule_text,
                    room_number,
                    instructor_name,
                    courses (
                        course_name_en,
                        course_name_ar
                    )
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'REGISTERED'); // STRICT FILTER: Only REGISTERED courses

        if (scheduleError) console.error("Error fetching schedule:", scheduleError);

        renderHome(userProfile, scheduleData);

    } catch (err) {
        console.error("Dashboard Load Failed:", err);
    }
}

function renderHome(profile, schedule) {
    // A. Render Student Stats
    if (profile) {
        document.getElementById('display-name').textContent = profile.full_name || "Student";
        document.getElementById('info-name').textContent = profile.full_name || "--";
        document.getElementById('info-major').textContent = profile.major || "General";
        document.getElementById('stat-gpa').textContent = profile.gpa ? profile.gpa.toFixed(2) : "N/A";
        document.getElementById('info-semester').textContent = profile.current_semester || "1";
        
        // Render Rank (from User table)
        document.getElementById('stat-rank').textContent = profile.rank ? `#${profile.rank}` : "--";

        // Render Balance (from User table)
        document.getElementById('stat-balance').textContent = profile.balance 
            ? `${Number(profile.balance).toFixed(2)}` 
            : "0.00";

        // Generate ID display
        document.getElementById('info-id').textContent = profile.id ? "2023" + profile.id.slice(0,4).toUpperCase() : "--";
    }

    // B. Calculate Absences Logic
    let totalAbsences = 0;
    let classesAttended = 0; // Mock calculation based on absences or just random if not in DB
    
    if (schedule && schedule.length > 0) {
        // Sum absences from all REGISTERED courses
        totalAbsences = schedule.reduce((sum, item) => sum + (item.absences || 0), 0);
        
        // Simple logic: If 0 absences, assume they attended some classes (Mocking 'Attended' as it's not in schema)
        classesAttended = (schedule.length * 5) - totalAbsences; 
    }

    document.getElementById('stat-absences').textContent = totalAbsences;
    document.getElementById('info-attended').textContent = classesAttended > 0 ? classesAttended : "--";

    // C. Render Today's Schedule
    renderTodaySchedule(schedule);
}

function renderTodaySchedule(enrollments) {
    const listContainer = document.getElementById('today-schedule-list');
    listContainer.innerHTML = ''; 

    // Filter out items where sections might be null (e.g. if REGISTERED but no section assigned yet)
    const validEnrollments = enrollments ? enrollments.filter(e => e.sections) : [];

    if (validEnrollments.length === 0) {
        listContainer.innerHTML = `<div class="empty-state" data-i18n="lbl_no_classes">${translations[currentLang].lbl_no_classes}</div>`;
        return;
    }

    // 1. Determine "Today"
    const dayIndex = new Date().getDay(); 
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayStr = daysMap[dayIndex];

    // 2. Filter Courses for Today based on Schedule Text
    const todayCourses = validEnrollments.filter(item => {
        const section = item.sections;
        if (!section || !section.schedule_text) return false;
        return section.schedule_text.includes(currentDayStr);
    });

    if (todayCourses.length === 0) {
        listContainer.innerHTML = `<div class="empty-state" data-i18n="lbl_no_classes" style="padding: 20px; text-align: center; color: #888;">${translations[currentLang].lbl_no_classes}</div>`;
        return;
    }

    // 3. Render Items
    todayCourses.forEach(item => {
        const sec = item.sections;
        const course = sec.courses;
        
        // Translation check
        const courseName = currentLang === 'ar' ? course.course_name_ar : course.course_name_en;
        const timeStr = sec.schedule_text.split(' ').slice(-1)[0] || sec.schedule_text; 

        const div = document.createElement('div');
        div.className = 'course-item';
        div.innerHTML = `
            <div class="course-name">${courseName}</div>
            <div class="course-meta">
                <span>🕒 ${timeStr}</span>
                <span class="room-code">${sec.room_number || 'TBA'}</span>
            </div>
            <div class="course-meta">
                <span>👨‍🏫 ${sec.instructor_name || 'Staff'}</span>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

// Apply language on load
applyLanguage(currentLang);

// --- AUTH FUNCTIONS ---

if (toggleAuthLink) {
    toggleAuthLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        errorMsg.textContent = ''; 
        const extraFields = document.querySelectorAll('.auth-extra');
        
        if (isLoginMode) {
            formTitle.textContent = 'Login';
            authActionBtn.textContent = 'Log In';
            document.getElementById('toggle-text').textContent = "Don't have an account? ";
            toggleAuthLink.textContent = 'Sign Up';
            extraFields.forEach(el => el.classList.add('hidden'));
        } else {
            formTitle.textContent = 'Create Account';
            authActionBtn.textContent = 'Sign Up';
            document.getElementById('toggle-text').textContent = "Already have an account? ";
            toggleAuthLink.textContent = 'Log In';
            extraFields.forEach(el => el.classList.remove('hidden'));
        }
    });
}

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
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
        
        } else {
            const fullName = fullNameInput.value;
            const confirmPass = confirmPassInput.value;

            if (!fullName) throw new Error("Full Name is required.");
            if (password !== confirmPass) throw new Error("Passwords do not match.");
            if (password.length < 6) throw new Error("Password must be at least 6 characters.");

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName } 
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
        
        const userNameDisplay = document.querySelector('.user-name');
        if(userNameDisplay && session.user.user_metadata.full_name) {
            userNameDisplay.textContent = session.user.user_metadata.full_name;
        }

        loadDashboardData(session.user.id);

    } else {
        currentUser = null;
        authContainer.classList.remove('hidden');
        sidebar.classList.add('hidden');
        homeContainer.classList.add('hidden');
        regContainer.classList.add('hidden');
        
        emailInput.value = '';
        passwordInput.value = '';
    }
}
async function logout() {
    await supabase.auth.signOut();
}

// --- AI LOGIC ---

async function fetchStudentContext(userId) {
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

async function getOpenRouterRecommendations(context, preferences) {
    try {
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
        loadDashboardData(userId); // Refresh Dashboard
    }
};

if (authActionBtn) authActionBtn.addEventListener('click', handleAuth);
if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (aiBtn) aiBtn.addEventListener('click', () => {
    if (!currentUser) { alert("Please log in."); return; }
    aiPrefModal.classList.remove('hidden');
});

if (generateBtn) generateBtn.addEventListener('click', async () => {
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

supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session);
});