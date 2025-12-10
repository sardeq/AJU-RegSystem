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

let availableSectionsData = [];
let currentEnrollments = []; // List of section_ids
let currentWaitlist = [];    // List of section_ids

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
        lbl_instructor: "Instr.",

        h_search_courses: "Search by Code or Name...",
        filter_year_all: "All Years",
        filter_cat_all: "All Categories",
        filter_credits_all: "All Credits",
        filter_show_completed: "Show Completed",
        filter_show_failed: "Show Unfinished",
        tbl_code: "Code",
        tbl_name: "Course Name",
        tbl_credits: "Cr.",
        tbl_category: "Category",
        tbl_prereq: "Prerequisites",
        tbl_hours: "Lec/Lab",
        tbl_status: "Status",
        status_completed: "Completed",
        status_failed: "Failed",
        status_none: "Not Taken",

        bl_my_schedule: "My Weekly Schedule",
        tbl_course: "Course",
        tbl_day_time: "Day & Time",
        tbl_room: "Room",
        tbl_instructor: "Instructor",
        tbl_credits: "Credits",
        msg_no_schedule: "No registered courses found for this semester.",

        tbl_action: "Action",
        btn_drop: "Drop Course",
        msg_confirm_drop: "Are you sure you want to drop this course? This action cannot be undone.",
        msg_drop_success: "Course dropped successfully.",

        lbl_registered_courses: "Registered Courses",
        msg_registered: "Registered",
        msg_waitlisted: "On Waitlist",
        msg_success_reg: "Successfully Registered!",
        msg_success_wait: "Added to Waitlist! You will be notified if a seat opens.",
        msg_err_full: "Section is full.",
        msg_err_exists: "Already registered/waitlisted for this course."
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
        lbl_instructor: "د.",

        ph_search_courses: "بحث برمز أو اسم المادة...",
        filter_year_all: "كل السنوات",
        filter_cat_all: "كل التصنيفات",
        filter_credits_all: "كل الساعات",
        filter_show_completed: "إظهار المكتملة",
        filter_show_failed: "إظهار غير المكتملة",
        tbl_code: "الرمز",
        tbl_name: "اسم المادة",
        tbl_credits: "س.م",
        tbl_category: "التصنيف",
        tbl_prereq: "المتطلب السابق",
        tbl_hours: "محاضرة/مختبر",
        tbl_status: "الحالة",
        status_completed: "ناجح",
        status_failed: "راسب",
        status_none: "غير مسجل",

        lbl_my_schedule: "جدولي الدراسي",
        tbl_course: "المادة",
        tbl_day_time: "اليوم والوقت",
        tbl_room: "القاعة",
        tbl_instructor: "المدرس",
        tbl_credits: "الساعات",
        msg_no_schedule: "لا يوجد مواد مسجلة لهذا الفصل.",

        tbl_action: "إجراء",
        btn_drop: "سحب المادة",
        msg_confirm_drop: "هل أنت متأكد من سحب هذه المادة؟ لا يمكن التراجع عن هذا الإجراء.",
        msg_drop_success: "تم سحب المادة بنجاح.",

        lbl_registered_courses: "المساقات المسجّلة",
        msg_registered: "تم التسجيل",
        msg_waitlisted: "على قائمة الانتظار",
        msg_success_reg: "تم التسجيل بنجاح!",
        msg_success_wait: "تمت إضافتك إلى قائمة الانتظار! سيتم إشعارك إذا توفر مقعد.",
        msg_err_full: "الشعبة ممتلئة.",
        msg_err_exists: "أنت مسجّل/على قائمة الانتظار لهذا المساق مسبقًا."

    }
};

let allCoursesData = [];
let userHistoryMap = {}; // Maps course_code -> { status, grade }

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
        document.getElementById('info-id').textContent = profile.id ? "2025" + profile.id.slice(0,4).toUpperCase() : "--";
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

    // Filter out items where sections might be null
    const validEnrollments = enrollments ? enrollments.filter(e => e.sections) : [];

    if (validEnrollments.length === 0) {
        listContainer.innerHTML = `<div class="empty-state" data-i18n="lbl_no_classes">${translations[currentLang].lbl_no_classes}</div>`;
        return;
    }

    // 1. Determine "Today"
    const dayIndex = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayStr = daysMap[dayIndex];

    console.log("System Date Day:", currentDayStr); // For debugging

    // 2. Filter Courses for Today based on Schedule Text
    const todayCourses = validEnrollments.filter(item => {
        const section = item.sections;
        // Safety check: ensure schedule_text exists
        if (!section || !section.schedule_text) return false;

        // Normalize both strings to lowercase for accurate matching
        // This ensures 'Wed' matches 'Mon/Wed', 'WED', 'Wednesday', etc.
        const schedule = section.schedule_text.toLowerCase();
        const today = currentDayStr.toLowerCase();

        return schedule.includes(today);
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
    // Hide all containers first
    homeContainer.classList.add('hidden');
    regContainer.classList.add('hidden');
    const sheetContainer = document.getElementById('courses-sheet-container');
    const scheduleContainer = document.getElementById('schedule-container');
    
    if(sheetContainer) sheetContainer.classList.add('hidden');
    if(scheduleContainer) scheduleContainer.classList.add('hidden');

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // Show selected container
    if (sectionName === 'home') {
        homeContainer.classList.remove('hidden');
        if(document.getElementById('nav-home')) document.getElementById('nav-home').classList.add('active');
    } else if (sectionName === 'registration') {
        regContainer.classList.remove('hidden');
        if(document.getElementById('nav-reg')) document.getElementById('nav-reg').classList.add('active');
    } else if (sectionName === 'sheet') {
        if(sheetContainer) sheetContainer.classList.remove('hidden');
        if(document.getElementById('nav-sheet')) document.getElementById('nav-sheet').classList.add('active');
        if(allCoursesData.length === 0 && currentUser) loadCoursesSheetData(currentUser.id);
    } else if (sectionName === 'schedule') {
        if(scheduleContainer) scheduleContainer.classList.remove('hidden');
        // You might want to add a nav-item for schedule or highlight Home if accessed from there
        if(currentUser) loadFullSchedule(currentUser.id);
    }
}

// --- FULL SCHEDULE LOGIC ---

async function loadFullSchedule(userId) {
    const tbody = document.getElementById('full-schedule-body');
    const cardGrid = document.getElementById('schedule-card-grid');
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';
    cardGrid.innerHTML = '<p style="text-align:center;">Loading...</p>';

    try {
        // CHANGED: Added 'enrollment_id' to the select query
        const { data: schedule, error } = await supabase
            .from('enrollments')
            .select(`
                enrollment_id, 
                status,
                sections (
                    section_number,
                    schedule_text,
                    room_number,
                    instructor_name,
                    courses (
                        course_code,
                        course_name_en,
                        course_name_ar,
                        credit_hours
                    )
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'REGISTERED'); 

        if (error) throw error;

        if(!window.userProfile) {
         const { data: p } = await supabase.from('users').select('*').eq('id', userId).single();
         if(p) window.userProfile = p;
    }

    // Calculate Total
    const totalCredits = schedule.reduce((sum, item) => sum + (item.sections?.courses?.credit_hours || 0), 0);
    updateCreditUI(totalCredits);

        renderScheduleTable(schedule);

    } catch (err) {
        console.error("Schedule Error:", err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to load schedule.</td></tr>';
    }
}


// Find the "Schedule" button in Home and link it
// Ensure this runs after DOM load or existing event listeners
document.addEventListener('DOMContentLoaded', () => {
    // We look for buttons with specific text or add an ID in HTML
    // Best practice: Add onclick="showSection('schedule')" directly to the button in HTML
});

// --- COURSES SHEET LOGIC ---

async function loadCoursesSheetData(userId) {
    const tbody = document.getElementById('courses-table-body');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading data...</td></tr>';

    try {
        // 1. Fetch User History (To determine Status: Completed/Failed/None)
        const { data: history, error: historyError } = await supabase
            .from('enrollments')
            .select(`status, grade_value, sections(course_code)`)
            .eq('user_id', userId);
            
        if (!historyError && history) {
            history.forEach(h => {
                if(h.sections && h.sections.course_code) {
                    userHistoryMap[h.sections.course_code] = { 
                        status: h.status, 
                        grade: h.grade_value 
                    };
                }
            });
        }

        // 2. Fetch All Courses + Prerequisites
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select(`
                *,
                prerequisites!prerequisites_course_code_fkey (
                    prereq_code
                )
            `)
            .order('course_code', { ascending: true });

        if (coursesError) throw coursesError;

        allCoursesData = courses;
        renderCoursesTable(); // Initial Render

    } catch (err) {
        console.error("Sheet Error:", err);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Error loading data.</td></tr>';
    }
}

function renderCoursesTable() {
    const tbody = document.getElementById('courses-table-body');
    if (!tbody) return; // Safety check
    tbody.innerHTML = '';

    // 1. Get Filter Values from the HTML inputs
    const searchInput = document.getElementById('sheet-search');
    const yearSelect = document.getElementById('filter-year');
    const catSelect = document.getElementById('filter-category');
    const credSelect = document.getElementById('filter-credits');
    const checkCompleted = document.getElementById('check-completed');
    const checkFailed = document.getElementById('check-failed');

    // Safety check: if elements are missing, stop to prevent errors
    if (!searchInput || !yearSelect || !catSelect || !credSelect) return;

    const searchText = searchInput.value.toLowerCase();
    const filterYear = yearSelect.value;
    const filterCat = catSelect.value;
    const filterCred = credSelect.value;
    const showCompleted = checkCompleted.checked;
    const showFailed = checkFailed.checked; // Also includes "Not Taken"

    // 2. Filter the global 'allCoursesData' array
    const filtered = allCoursesData.filter(course => {
        const code = course.course_code.toString();
        // Get user status for this course (Completed, Failed, Registered, or None)
        const userState = userHistoryMap[code] || { status: 'NONE' };
        const isCompleted = userState.status === 'COMPLETED';
        
        // A. Check Toggles (Show Completed / Show Failed)
        if (isCompleted && !showCompleted) return false;
        if (!isCompleted && !showFailed) return false;

        // B. Check Text Search (Code, English Name, or Arabic Name)
        const nameEn = course.course_name_en.toLowerCase();
        const nameAr = course.course_name_ar ? course.course_name_ar.toLowerCase() : "";
        if (!code.includes(searchText) && !nameEn.includes(searchText) && !nameAr.includes(searchText)) {
            return false;
        }

        // C. Year Filter 
        // Logic: Checks the 3rd digit of the course code (e.g., 311100 -> Year 1)
        if (filterYear !== 'all') {
            if (code.length >= 3 && code[2] !== filterYear) return false;
        }

        // D. Category Filter
        if (filterCat !== 'all' && course.category !== filterCat) return false;

        // E. Credits Filter
        if (filterCred !== 'all' && course.credit_hours != filterCred) return false;

        return true;
    });

    // 3. Handle Empty Results
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">No courses match filters.</td></tr>`;
        return;
    }

    // 4. Render Rows
    filtered.forEach(course => {
        const tr = document.createElement('tr');
        
        // Select name based on current language
        const name = currentLang === 'ar' ? course.course_name_ar : course.course_name_en;
        
        // Format Prerequisites (join with comma if multiple)
        const prereqs = course.prerequisites 
            ? course.prerequisites.map(p => p.prereq_code).join(', ') 
            : '-';

        // Create Status Badge
        let statusBadge = `<span class="badge badge-gray">${translations[currentLang].status_none || 'Not Taken'}</span>`;
        const userState = userHistoryMap[course.course_code];
        
        if (userState) {
            if (userState.status === 'COMPLETED') {
                statusBadge = `<span class="badge badge-green">${translations[currentLang].status_completed || 'Completed'} (${userState.grade})</span>`;
            } else if (userState.status === 'FAILED') {
                statusBadge = `<span class="badge badge-red">${translations[currentLang].status_failed || 'Failed'}</span>`;
            } else if (userState.status === 'REGISTERED') {
                 statusBadge = `<span class="badge badge-blue">Registered</span>`;
            }
        }

        tr.innerHTML = `
            <td><strong>${course.course_code}</strong></td>
            <td>${name}</td>
            <td>${course.credit_hours}</td>
            <td>${course.category || '-'}</td>
            <td>${prereqs}</td>
            <td>${course.lecture_hours} / ${course.lab_hours}</td>
            <td>${statusBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderScheduleTable(scheduleData) {
    const tbody = document.getElementById('full-schedule-body');
    const cardGrid = document.getElementById('schedule-card-grid');
    const tableHeadRow = document.querySelector('.schedule-table thead tr');

    // Ensure Action Header exists (if not already there)
    if (tableHeadRow && !tableHeadRow.querySelector('.th-action')) {
        const th = document.createElement('th');
        th.className = 'th-action';
        th.setAttribute('data-i18n', 'tbl_action');
        th.textContent = translations[currentLang].tbl_action || "Action";
        tableHeadRow.appendChild(th);
    }
    
    tbody.innerHTML = '';
    cardGrid.innerHTML = '';

    if (!scheduleData || scheduleData.length === 0) {
        const msg = translations[currentLang].msg_no_schedule;
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">${msg}</td></tr>`;
        cardGrid.innerHTML = `<div class="empty-state">${msg}</div>`;
        return;
    }

    scheduleData.forEach(item => {
        const sec = item.sections;
        const course = sec.courses;
        const courseName = currentLang === 'ar' ? course.course_name_ar : course.course_name_en;

        // 1. Render Table Row (Desktop)
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${courseName}</strong><br>
                <small style="color:#666;">${course.course_code} - Sec ${sec.section_number}</small>
            </td>
            <td>${sec.schedule_text || 'TBA'}</td>
            <td>${sec.room_number || 'TBA'}</td>
            <td>${sec.instructor_name || 'Staff'}</td>
            <td>${course.credit_hours}</td>
            <td>
                <button class="delete-btn" onclick="dropCourse(${item.enrollment_id})">
                    ${translations[currentLang].btn_drop}
                </button>
            </td>
        `;
        tbody.appendChild(tr);

        // 2. Render Card (Mobile)
        const card = document.createElement('div');
        card.className = 'schedule-item-card';
        card.innerHTML = `
            <div class="sch-card-header">
                <span class="sch-course-name">${courseName}</span>
                <span class="sch-credits">${course.credit_hours} Cr.</span>
            </div>
            <div class="sch-card-body">
                <div class="sch-detail"><span>🕒</span> ${sec.schedule_text || 'TBA'}</div>
                <div class="sch-detail"><span>📍</span> ${sec.room_number || 'TBA'}</div>
                <div class="sch-detail"><span>👨‍🏫</span> ${sec.instructor_name || 'Staff'}</div>
            </div>
            <div class="sch-card-footer">
                <button class="delete-btn full-width" onclick="dropCourse(${item.enrollment_id})">
                     ${translations[currentLang].btn_drop}
                </button>
            </div>
        `;
        cardGrid.appendChild(card);
    });
}

// --- NEW FUNCTION: DROP COURSE ---
window.dropCourse = async function(enrollmentId) {
    const confirmMsg = translations[currentLang].msg_confirm_drop || "Are you sure?";
    if (!confirm(confirmMsg)) return;

    try {
        const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('enrollment_id', enrollmentId);

        if (error) throw error;

        alert(translations[currentLang].msg_drop_success || "Dropped successfully");
        
        // Refresh the UI
        if (currentUser) {
            loadFullSchedule(currentUser.id);   // Reload schedule list
            loadDashboardData(currentUser.id);  // Update dashboard stats (Absences, etc.)
        }

    } catch (err) {
        console.error("Drop Error:", err);
        alert("Error dropping course: " + err.message);
    }
};

// --- EVENT LISTENERS FOR FILTERS ---
['sheet-search', 'filter-year', 'filter-category', 'filter-credits', 'check-completed', 'check-failed'].forEach(id => {
    const el = document.getElementById(id);
    if(el) {
        el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', renderCoursesTable);
    }
});

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
    // 1. Fetch COMPLETED courses (for prerequisites)
    const { data: history, error: historyError } = await supabase
        .from('enrollments')
        .select(`status, sections (course_code)`)
        .eq('user_id', userId)
        .eq('status', 'COMPLETED');

    if (historyError) throw new Error("Could not fetch student history.");
    const passedCourses = history ? history.map(h => h.sections?.course_code).filter(Boolean) : [];

    // 2. Fetch REGISTERED courses (To get BUSY TIMES and Exclusions)
    const { data: current } = await supabase
        .from('enrollments')
        .select(`
            sections (
                course_code, 
                schedule_text
            )
        `)
        .eq('user_id', userId)
        .eq('status', 'REGISTERED');
    
    // Extract Codes (to prevent taking the same course twice)
    const registeredCourses = current ? current.map(c => c.sections?.course_code).filter(Boolean) : [];
    
    // Extract Times (to prevent EXACT overlapping schedules)
    // We normalize to lowercase to ensure "Mon Wed" matches "mon wed"
    const busyTimes = current ? current.map(c => (c.sections?.schedule_text || "").toLowerCase().trim()).filter(Boolean) : [];

    // Combined exclusion list (Courses we shouldn't suggest)
    const allTakenOrRegistered = [...passedCourses, ...registeredCourses];

    // 3. Fetch Available Sections
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
    if (!availableSections) return { history: allTakenOrRegistered, busyTimes: busyTimes, options: [] };

    // 4. Filter Eligible Sections
    const eligibleSections = availableSections.filter(section => {
        // Rule A: Exclude if already taken or registered
        if (allTakenOrRegistered.includes(section.course_code)) return false;

        // Rule B: HARD FILTER for Time Conflict (Exact Match)
        // If the section's time string matches a registered course exactly, remove it.
        const sectionTime = (section.schedule_text || "").toLowerCase().trim();
        if (busyTimes.includes(sectionTime)) return false;

        // Rule C: Check Prerequisites
        const coursePrereqs = section.courses?.prerequisites || [];
        if (coursePrereqs.length === 0) return true;
        
        const unmet = coursePrereqs.filter(p => !passedCourses.includes(p.prereq_code));
        return unmet.length === 0;
    });

    // Return the cleaner list to the AI
    return { 
        history: allTakenOrRegistered, 
        busyTimes: busyTimes, // We still send this for the AI to check partial overlaps
        options: eligibleSections 
    };
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

// --- UPDATED LOAD REGISTRATION DATA (DYNAMIC SEMESTER) ---
async function loadRegistrationData(userId) {
    const container = document.getElementById('registration-courses-container');
    container.innerHTML = '<div class="spinner"></div>';

    try {
        // 1. Fetch the Active Semester ID dynamically
        const { data: activeSem, error: semError } = await supabase
            .from('semesters')
            .select('semester_id')
            .eq('is_active', true)
            .single();

        if (semError || !activeSem) {
            console.error("No active semester found. Please set is_active=true in 'semesters' table.");
            container.innerHTML = '<p style="text-align:center; color:red;">System Error: No Active Semester.</p>';
            return;
        }

        const currentSemesterId = activeSem.semester_id;
        console.log("Loading sections for Semester:", currentSemesterId);

        // 2. Fetch User Profile
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        if (profile) window.userProfile = profile;

        // 3. Fetch Enrollments
        const { data: enrolls } = await supabase
            .from('enrollments')
            .select(`
                section_id, 
                status,
                sections (
                    course_code,
                    schedule_text,
                    courses (credit_hours)
                )
            `)
            .eq('user_id', userId)
            .in('status', ['REGISTERED', 'ENROLLED']);
            
        currentEnrollments = enrolls ? enrolls.map(e => e.section_id) : [];
        window.enrolledCourseCodes = enrolls ? enrolls.map(e => e.sections?.course_code) : [];
        window.busyTimes = enrolls ? enrolls.map(e => (e.sections?.schedule_text || "").toLowerCase().trim()) : [];

        // Calculate Total Credits
        const totalCredits = enrolls ? enrolls.reduce((sum, e) => sum + (e.sections?.courses?.credit_hours || 0), 0) : 0;
        window.currentTotalCredits = totalCredits;
        updateCreditUI(totalCredits);

        // 4. Fetch Waitlist
        const { data: waits } = await supabase
            .from('waiting_list')
            .select('section_id')
            .eq('user_id', userId)
            .eq('status', 'WAITING');
        currentWaitlist = waits ? waits.map(w => w.section_id) : [];

        // 5. Fetch Sections for the ACTIVE SEMESTER
        const { data: sections, error } = await supabase
            .from('sections')
            .select(`
                *,
                courses (
                    course_code,
                    course_name_en,
                    course_name_ar,
                    credit_hours,
                    category
                )
            `)
            .eq('semester_id', currentSemesterId) // <--- Now uses the dynamic ID
            .order('course_code', { ascending: true });

        if (error) throw error;

        // Verify we actually got data
        if (!sections || sections.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding:20px; color:#666;">No sections found for Semester ${currentSemesterId}.</p>`;
            return;
        }

        availableSectionsData = sections;
        renderRegistrationList(sections);
        renderMiniRegisteredList();

    } catch (err) {
        console.error("Reg Load Error:", err);
        container.innerHTML = '<p style="text-align:center; color:red;">Failed to load courses.</p>';
    }
}

function renderRegistrationList(sections) {
    const container = document.getElementById('registration-courses-container');
    container.innerHTML = '';
    
    // Get Filter Values
    const searchText = document.getElementById('reg-search-input').value.toLowerCase();
    const filterYear = document.getElementById('reg-filter-year').value;
    const filterCat = document.getElementById('reg-filter-category').value;
    const filterCred = document.getElementById('reg-filter-credits').value;
    
    // Checkboxes
    const showClosed = document.getElementById('reg-check-closed').checked;
    const hideConflicts = document.getElementById('reg-check-conflicts').checked;
    
    // Group sections by Course Code
    const grouped = {};
    
    sections.forEach(sec => {
        const course = sec.courses;
        const code = (course.course_code || sec.course_code).toString();

        // --- 1. FILTERING ---
        // Search
        const nameEn = course.course_name_en.toLowerCase();
        const nameAr = course.course_name_ar ? course.course_name_ar.toLowerCase() : "";
        if (!code.toLowerCase().includes(searchText) && !nameEn.includes(searchText) && !nameAr.includes(searchText)) return;

        // Year (Assuming 3rd digit logic, e.g., 311... -> Year 1)
        if (filterYear !== 'all' && code.length >= 3 && code[2] !== filterYear) return;

        // Category & Credits
        if (filterCat !== 'all' && course.category !== filterCat) return;
        if (filterCred !== 'all' && course.credit_hours != filterCred) return;

        // --- 2. CLOSED/FULL LOGIC ---
        const capacity = sec.capacity || 30;
        const enrolled = sec.enrolled_count || 0;
        
        // Robust check: Handle "CLOSED", "Closed", "closed"
        const statusStr = (sec.status || "").toUpperCase(); 
        const isClosed = statusStr === 'CLOSED';
        
        // A section is "Full" if enrolled >= capacity OR explicitly Closed
        const isFull = (enrolled >= capacity) || isClosed;
        
        // If it's full/closed AND the user unchecked "Show Closed", hide it.
        if (isFull && !showClosed) return;

        // --- 3. GROUPING ---
        if (!grouped[code]) {
            grouped[code] = {
                course: sec.courses,
                sections: []
            };
        }
        grouped[code].sections.push(sec);
    });

    if (Object.keys(grouped).length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666; margin-top:20px;">No courses match your filters.</p>';
        return;
    }

    // --- 4. RENDERING ---
    Object.values(grouped).forEach(group => {
        const course = group.course;
        const courseName = currentLang === 'ar' ? course.course_name_ar : course.course_name_en;
        
        // CHECK: Is the student already registered for this COURSE CODE?
        const alreadyHasCourse = window.enrolledCourseCodes && window.enrolledCourseCodes.includes(course.course_code);

        const accordion = document.createElement('div');
        accordion.className = 'course-accordion collapsed';
        
        accordion.innerHTML = `
            <div class="accordion-header" onclick="toggleAccordion(this)">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="chevron">›</span>
                    <span class="cat-title"><strong>${course.course_code}</strong> - ${courseName}</span>
                    ${alreadyHasCourse ? '<span class="status-text success" style="margin-left:10px; font-size:0.7em;">Enrolled</span>' : ''}
                </div>
                <div class="accordion-meta">
                    <span class="badge badge-gray">${course.credit_hours} Cr</span>
                    <span style="font-size:0.8em; color:#666;">${group.sections.length} Sec</span>
                </div>
            </div>
            <div class="accordion-content hidden"></div>
        `;

        const contentDiv = accordion.querySelector('.accordion-content');
        let visibleSectionsCount = 0;

        group.sections.forEach(sec => {
            // Status Calculations
            const capacity = sec.capacity || 30;
            const enrolled = sec.enrolled_count || 0;
            const statusStr = (sec.status || "").toUpperCase();
            const isClosed = statusStr === 'CLOSED';
            const isFull = (enrolled >= capacity) || isClosed;
            const fillPercent = Math.min(100, (enrolled / capacity) * 100);
            
            // Time Conflict Calculation
            const secTime = (sec.schedule_text || "").toLowerCase().trim();
            const hasConflict = window.busyTimes && window.busyTimes.includes(secTime);
            
            // Filter: Hide Conflicts if checkbox checked
            // (Unless we are already registered for this specific section)
            if (hideConflicts && hasConflict && !currentEnrollments.includes(sec.section_id)) return;
            
            visibleSectionsCount++;

            // Progress Bar Color
            let barColor = 'green';
            if (isFull) barColor = 'red';
            else if (fillPercent > 80) barColor = 'yellow';

            // User Status
            const isRegisteredThisSection = currentEnrollments.includes(sec.section_id);
            const isWaitlisted = currentWaitlist.includes(sec.section_id);

            // --- BUTTON LOGIC ---
            let actionButtons = '';
            let rowOpacity = '1';

            if (isRegisteredThisSection) {
                // Case 1: Already has THIS exact section
                actionButtons = `<span class="status-text success">Registered ✅</span>`;
            
            } else if (alreadyHasCourse) {
                // Case 2: Has a DIFFERENT section of this course -> Disable add
                actionButtons = `<span class="status-text" style="color:#666; background:#eee; font-size:0.75em;">Course Enrolled</span>`;
                rowOpacity = '0.6';

            } else if (isWaitlisted) {
                // Case 3: On waitlist
                actionButtons = `<span class="status-text warning">Waitlisted 🕒</span>`;
            
            } else if (hasConflict) {
                // Case 4: Time Conflict
                actionButtons = `<span class="status-text" style="color:#c62828; background:#ffebee; border:1px solid #c62828; font-size:0.75em;">Time Conflict ⚠️</span>`;
                rowOpacity = '0.7'; 
            
            } else if (isFull) {
                // Case 5: Full or Closed -> Waitlist Button
                actionButtons = `
                    <button class="circle-btn time-btn" onclick="handleWaitlist(${sec.section_id})" title="Join Waitlist">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="16" height="16">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </button>
                `;
            } else {
                // Case 6: Open -> Add Button
                actionButtons = `
                    <button class="circle-btn add-btn" onclick="handleRegister(${sec.section_id})" title="Register">
                        +
                    </button>
                `;
            }

            const row = document.createElement('div');
            row.className = 'course-row';
            // Visual cue for closed/full sections
            if (isFull) row.style.backgroundColor = "#fafafa";
            row.style.opacity = rowOpacity; 
            
            row.innerHTML = `
                <div class="c-info">
                    <div class="c-section">Sec ${sec.section_number}</div>
                    <div class="c-time">${sec.schedule_text || 'TBA'}</div>
                </div>
                <div class="c-instructor">${sec.instructor_name || 'Staff'}</div>
                
                <div class="c-capacity">
                    <div class="progress-bar-container ${isFull ? 'full-red' : ''}">
                        <div class="progress-fill ${barColor}" style="width: ${fillPercent}%;"></div>
                        <span class="progress-text">
                            ${isClosed ? 'CLOSED' : `${enrolled}/${capacity}`}
                        </span>
                    </div>
                </div>

                <div class="c-actions">
                    ${actionButtons}
                </div>
            `;
            contentDiv.appendChild(row);
        });

        // Only append course accordion if it has at least one visible section
        if (visibleSectionsCount > 0) {
            container.appendChild(accordion);
        }
    });
}

// 4. Accordion Toggle
window.toggleAccordion = function(header) {
    const acc = header.parentElement;
    const content = header.nextElementSibling;
    const chevron = header.querySelector('.chevron');

    if (acc.classList.contains('collapsed')) {
        acc.classList.remove('collapsed');
        acc.classList.add('expanded');
        content.classList.remove('hidden');
        chevron.style.transform = "rotate(90deg)"; // Animate chevron
    } else {
        acc.classList.add('collapsed');
        acc.classList.remove('expanded');
        content.classList.add('hidden');
        chevron.style.transform = "rotate(0deg)";
    }
};

// 5. Action: Register
window.handleRegister = async function(sectionId) {
    if (!currentUser) return;

    // 1. Find the section to get its credits
    const section = availableSectionsData.find(s => s.section_id === sectionId);
    if (!section) return;

    const newCredits = section.courses.credit_hours || 3;
    const currentTotal = window.currentTotalCredits || 0;
    const { max, isGrad } = getCreditLimits();

    // 2. CHECK LIMIT
    if (currentTotal + newCredits > max) {
        const title = isGrad ? "Graduate Limit Reached" : "Credit Limit Reached";
        alert(`⛔ Cannot Register!\n\n${title}: You are limited to ${max} credit hours.\nCurrent: ${currentTotal}\nTrying to add: ${newCredits}\nTotal would be: ${currentTotal + newCredits}`);
        return; // STOP execution
    }

    if (!confirm(`Register for ${section.courses.course_name_en} (${newCredits} Cr)?`)) return;

    try {
        const { error } = await supabase
            .from('enrollments')
            .insert([{
                user_id: currentUser.id,
                section_id: sectionId,
                status: 'REGISTERED'
            }]);

        if (error) throw error;

        alert("Registered Successfully!");
        loadRegistrationData(currentUser.id);

    } catch (err) {
        alert("Registration Failed: " + err.message);
    }
};

// 6. Action: Waitlist
window.handleWaitlist = async function(sectionId) {
    if (!currentUser) return;
    const reason = prompt("This section is full. Reason for waiting list request (optional):");

    try {
        const { error } = await supabase
            .from('waiting_list')
            .insert([{
                user_id: currentUser.id,
                section_id: sectionId,
                status: 'WAITING',
                requested_at: new Date().toISOString()
            }]);

        if (error) throw error;

        alert("Added to Waitlist! You are in the queue.");
        loadRegistrationData(currentUser.id);

    } catch (err) {
        alert("Waitlist Failed: " + err.message);
    }
};

// 7. Mini Registered List (Side Panel)
function renderMiniRegisteredList() {
    const list = document.getElementById('mini-registered-list');
    list.innerHTML = '';

    // We can reuse 'currentEnrollments' IDs and find them in 'availableSectionsData'
    // But data structure is flat in enrollments, so let's do a quick lookup
    // Ideally, we fetch details separately or join efficiently. 
    // Let's rely on 'availableSectionsData' if populated, otherwise fetch.
    
    // Quick fetch for display
    supabase.from('enrollments')
        .select('sections(course_code, section_number, courses(course_name_en))')
        .eq('user_id', currentUser.id)
        .eq('status', 'REGISTERED')
        .then(({ data }) => {
            if (!data || data.length === 0) {
                list.innerHTML = '<p style="color:#666; font-size:0.9em;">No courses registered.</p>';
                return;
            }
            data.forEach(item => {
                const sec = item.sections;
                const div = document.createElement('div');
                div.style.cssText = "padding: 8px; border-bottom: 1px solid #ddd; font-size:0.9em;";
                div.innerHTML = `<b>${sec.course_code}</b> <br> <span style="font-size:0.85em; color:#555;">${sec.courses.course_name_en}</span>`;
                list.appendChild(div);
            });
        });
}

// 8. Event Listener for Search
document.getElementById('reg-search-input').addEventListener('input', () => {
    if (availableSectionsData.length > 0) {
        renderRegistrationList(availableSectionsData);
    }
});

window.toggleFilters = function() {
    const panel = document.getElementById('reg-filter-panel');
    if (panel) {
        panel.classList.toggle('hidden');
    }
};

// --- HOOK INTO NAVIGATION ---
// Update the showSection logic to load data when Registration is clicked
const originalShowSection = window.showSection;
window.showSection = function(sectionName) {
    originalShowSection(sectionName); // Call existing logic
    if (sectionName === 'registration' && currentUser) {
        loadRegistrationData(currentUser.id);
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
    
    // NEW: Capture Credit Hours
    const targetCredits = document.getElementById('credits-pref').value || "15";

    const days = [];
    document.querySelectorAll('input[name="days"]:checked').forEach(cb => days.push(cb.value));

    if (days.length === 0) {
        alert("Please select at least one day preference.");
        return;
    }

    const { min, max } = getCreditLimits();
    
    const preferences = { 
        intensity, 
        time, 
        focus, 
        days, 
        targetCredits: document.getElementById('credits-pref').value || "15",
        minCredits: min,
        maxCredits: max
    };

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

const filterIds = ['reg-search-input', 'reg-filter-year', 'reg-filter-category', 'reg-filter-credits', 'reg-check-closed'];
filterIds.forEach(id => {
    const el = document.getElementById(id);
    if(el) {
        el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
             // Only re-render if we have data
             if(availableSectionsData.length > 0) renderRegistrationList(availableSectionsData);
        });
    }
});

// --- HELPER: GET CREDIT LIMITS ---
function getCreditLimits() {
    // Default to standard if user not loaded
    if (!currentUser) return { min: 12, max: 18, isGrad: false };

    // Logic: If semester >= 7, consider them 4th year/Graduate
    // You can also check 'plan_year' vs current year if preferred.
    // user_metadata or the 'users' table profile data should be used.
    // We used 'userProfile' in loadDashboardData, let's assume we store it globally or fetch it.
    
    // For this implementation, let's fetch strictly from the loaded profile logic
    // We'll trust 'currentUser.user_metadata' if you sync it, or fetch freshly.
    // Simple approach: Use the 'current_semester' from the profile we loaded in dashboard.
    
    // Let's assume we attach profile to currentUser for easy access, or just fetch:
    const currentSemester = window.userProfile?.current_semester || 1; 
    
    const isGrad = currentSemester >= 7;
    return {
        min: 12,
        max: isGrad ? 21 : 18,
        isGrad: isGrad
    };
}

// --- HELPER: UPDATE CREDIT UI ---
function updateCreditUI(totalCredits) {
    const { min, max, isGrad } = getCreditLimits();
    const statusText = isGrad ? "(Graduate/4th Year)" : "(Standard)";
    
    // Logic for Color & Message
    let color = "#2E7D32"; // Green
    let msg = `Total Hours: ${totalCredits} / ${max}`;
    
    if (totalCredits < min) {
        color = "#c62828"; // Red
        msg = `⚠️ Warning: Registered ${totalCredits} hrs. Minimum required is ${min}.`;
    } else if (totalCredits > max) {
        color = "#c62828"; // Red
        msg = `⛔ Error: Exceeds limit of ${max} hrs.`;
    } else {
        msg = `✅ Good: ${totalCredits} hrs registered. (Max: ${max})`;
    }

    // Update Registration Page UI
    const regBox = document.getElementById('reg-credit-status');
    if (regBox) {
        regBox.style.color = color;
        regBox.style.fontWeight = "bold";
        regBox.style.padding = "0 15px";
        regBox.style.display = "flex";
        regBox.style.alignItems = "center";
        regBox.textContent = msg;
    }

    // Update Schedule Page UI
    const schBox = document.getElementById('sch-credit-status');
    if (schBox) {
        schBox.style.color = color;
        schBox.style.fontSize = "0.9em";
        schBox.style.marginTop = "5px";
        schBox.textContent = msg;
    }
    
    return totalCredits; // Return for use in logic
}

if(closePrefBtn) closePrefBtn.addEventListener('click', () => aiPrefModal.classList.add('hidden'));
if(closeModal) closeModal.addEventListener('click', () => aiModal.classList.add('hidden'));

window.onclick = function(event) {
    if (event.target == aiModal) aiModal.classList.add('hidden');
    if (event.target == aiPrefModal) aiPrefModal.classList.add('hidden');
}

supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session);
});

