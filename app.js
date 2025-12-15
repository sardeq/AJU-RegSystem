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
        msg_err_exists: "Already registered/waitlisted for this course.",

        nav_plan: "Student Plan",
        
        // Plan Legend & UI
        plan_legend_passed: "Passed",
        plan_legend_registered: "Registered",
        plan_legend_open: "Available",
        plan_legend_locked: "Locked",
        
        // Popup
        lbl_credits: "Credits",
        status_passed: "Passed ✅",
        status_registered: "Registered 🕒",
        status_open: "Available 🔓",
        status_locked: "Locked 🔒",

        lbl_history: "Academic History",
        tbl_grade: "Grade",
        msg_no_history: "No completed courses found for this semester.",
        opt_all_semesters: "All Semesters",

        exc_title: "Exception Requests",
        exc_new_req: "New Request",
        exc_type_label: "Request Type",
        opt_prereq: "Prerequisite Override",
        opt_alt: "Alternative Course",
        exc_target_label: "Target Course",
        ph_search_target: "Start typing course name or code...",
        exc_alt_label: "Replacing Course (Optional)",
        ph_search_alt: "Search replacement course...",
        exc_reason_label: "Reason / Justification",
        ph_reason: "Explain why you need this exception...",
        btn_submit_req: "Submit Request",
        exc_history_title: "Request History",
        exc_desc_prereq: "Request to enroll in a course without meeting the prerequisite.",
        exc_desc_alt: "Request to take a different course in place of a required one.",
        
        // Tooltip for the new button
        btn_req_override: "Request Prerequisite Override"
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
        msg_err_exists: "أنت مسجّل/على قائمة الانتظار لهذا المساق مسبقًا.",

        nav_plan: "الخطة الدراسية",
        
        // Plan Legend & UI
        plan_legend_passed: "ناجح",
        plan_legend_registered: "مسجل",
        plan_legend_open: "متاح للتسجيل",
        plan_legend_locked: "مغلق (متطلب سابق)",
        
        // Popup
        lbl_credits: "ساعات معتمدة",
        status_passed: "ناجح ✅",
        status_registered: "مسجل 🕒",
        status_open: "متاح 🔓",
        status_locked: "مغلق 🔒",

        lbl_history: "السجل الأكاديمي",
        tbl_grade: "العلامة",
        msg_no_history: "لا يوجد مواد مكتملة في هذا الفصل.",
        opt_all_semesters: "جميع الفصول",

        exc_title: "طلبات الاستثناء",
        exc_new_req: "طلب جديد",
        exc_type_label: "نوع الطلب",
        opt_prereq: "تجاوز المتطلب السابق",
        opt_alt: "مادة بديلة",
        exc_target_label: "المادة المطلوبة",
        ph_search_target: "ابدأ بكتابة اسم أو رمز المادة...",
        exc_alt_label: "المادة المستبدلة (اختياري)",
        ph_search_alt: "ابحث عن المادة التي تريد استبدالها...",
        exc_reason_label: "السبب / التبرير",
        ph_reason: "اشرح سبب حاجتك لهذا الاستثناء...",
        btn_submit_req: "إرسال الطلب",
        exc_history_title: "سجل الطلبات",
        exc_desc_prereq: "طلب التسجيل في مادة دون إنهاء المتطلب السابق.",
        exc_desc_alt: "طلب دراسة مادة مختلفة بدلاً من مادة إجبارية في الخطة.",

        // Tooltip for the new button
        btn_req_override: "طلب تجاوز المتطلب السابق"

    }
};

const pdfElectiveData = {
    "University Elective": [
        { code: "201101", name: "القانون في حياتنا", cr: 3 },
        { code: "202132", name: "حقوق الانسان", cr: 3 },
        { code: "401100", name: "مبادىء الإدارة", cr: 3 },
        { code: "704102", name: "مبادئ علم المكتبات", cr: 3 },
        { code: "704103", name: "قضايا دولية وعربية", cr: 3 },
        { code: "704104", name: "الثقافة الإسلامية", cr: 3 },
        { code: "704105", name: "جغرافية الأردن", cr: 3 },
        { code: "704108", name: "النزاهة والشفافية", cr: 3 },
        { code: "704110", name: "الثقافة الرقمية", cr: 3 },
        { code: "704112", name: "مهارات اللغة العربية 2", cr: 3 },
        { code: "704113", name: "فن الخطابة والحوار", cr: 3 },
        { code: "704114", name: "التنمية والبيئة", cr: 3 },
        { code: "704115", name: "التنمية وتنظيم الأسرة", cr: 3 },
        { code: "704141", name: "تاريخ القدس", cr: 3 },
        { code: "704151", name: "مهارات الحاسوب 1", cr: 3 },
        { code: "704152", name: "مهارات الحاسوب 2", cr: 3 },
        { code: "704163", name: "لغة أجنبية", cr: 3 },
        { code: "704171", name: "التغذية وصحة المجتمع", cr: 3 },
        { code: "704172", name: "الرياضة والصحة", cr: 3 }
    ],
    "Supportive Compulsory": [
        // Extracted from image_13b202.png
        { code: "601131", name: "مبادىء الإحصاء", cr: 3 },
        { code: "601372", name: "التحليل العددي (1)", cr: 3 }
    ],
    "University Compulsory": [
        // Extracted from image_13b1de.png
        { code: "704116", name: "المهارات الحياتية", cr: 1 },
        { code: "704117", name: "مهارات اللغة الانجليزية (1)", cr: 3 },
        { code: "704118", name: "مهارات اللغة العربية (1)", cr: 3 },
        { code: "704119", name: "التربية الوطنية", cr: 1 },
        { code: "704200", name: "العلوم العسكرية", cr: 3 }
    ]
};


const planStructure = [
    // --- TOP STATS ---
    { id: "lbl_95", x: 50, y: 50, type: 'label-circle', label: "95\nHours" },
    { id: "lbl_75", x: 2600, y: 50, type: 'label-circle', label: "75\n%" },

    // --- LEVEL 1: ROOT ---
    { id: "311100", x: 1300, y: 100, type: 'course' }, 

    // --- LEVEL 2: DIRECT CHILDREN ---
    // 1. SE Intro (Left)
    { id: "313160", x: 350, y: 250, type: 'course' },
    
    // 2. Proj Mgmt
    { id: "313269", x: 750, y: 250, type: 'course' },
    
    // 3. Prog 1 (Center-Left) - ANCHOR for Multimedia
    { id: "311101", x: 1150, y: 250, type: 'course' },
    
    // 4. Logic (Center-Right)
    { id: "311220", x: 1600, y: 250, type: 'course' }, 
    
    // 5. Ethics (Floating)
    { id: "311160", x: 1800, y: 250, type: 'course' },
    
    // 6. Calculus
    { id: "601101", x: 2000, y: 250, type: 'course' },
    
    // 7. Databases
    { id: "311240", x: 2350, y: 250, type: 'course' },

    // --- LEVEL 3 ---
    // SE Branch
    { id: "313466", x: 150, y: 450, type: 'course' },  // Doc
    { id: "313261", x: 350, y: 450, type: 'course' },  // Req Eng
    
    // Proj Mgmt Branch
    { id: "313262", x: 750, y: 450, type: 'course' },  // Components

    // Prog Branch (Children of 311101)
    { id: "313204", x: 950, y: 350, type: 'course' },  // Adv Prog (Left Offset)
    { id: "311202", x: 1150, y: 450, type: 'course' }, // OOP (Directly Below)
    { id: "313263", x: 1350, y: 450, type: 'course' }, // Multimedia (Right of OOP)

    // Logic Branch
    { id: "311321", x: 1550, y: 450, type: 'course' }, // Arch
    { id: "311330", x: 1750, y: 450, type: 'course' }, // Networks

    // Calc Branch
    { id: "311210", x: 2000, y: 450, type: 'course' }, // Discrete

    // DB Branch
    { id: "311340", x: 2250, y: 450, type: 'course' }, // DB Admin
    { id: "311241", x: 2450, y: 450, type: 'course' }, // Sys Analysis

    // --- LEVEL 4 ---
    // Req Eng Children
    { id: "313367", x: 150, y: 650, type: 'course' },  // Specs
    { id: "313364", x: 350, y: 650, type: 'course' },  // OO SE

    // Components Child
    { id: "313363", x: 750, y: 650, type: 'course' },  // Design

    // OOP Children (Clustered under 311202)
    { id: "311305", x: 1000, y: 650, type: 'course' }, // Visual
    { id: "311304", x: 1150, y: 650, type: 'course' }, // Web
    { id: "311213", x: 1350, y: 650, type: 'course' }, // Data Struct (Moved under OOP)

    // Networks Child
    { id: "311468", x: 1750, y: 650, type: 'course' }, // Security

    // --- LEVEL 5 ---
    // OO SE Children
    { id: "313469", x: 150, y: 850, type: 'course' },  // Topics
    { id: "313464", x: 350, y: 850, type: 'course' },  // Re-eng
    { id: "313462", x: 550, y: 850, type: 'course' },  // Soft Arch

    // Design Children
    { id: "313365", x: 750, y: 850, type: 'course' },  // Testing
    { id: "313366", x: 950, y: 850, type: 'course' },  // Quality

    // Data Struct Child (Algorithms)
    { id: "311314", x: 1350, y: 850, type: 'course' }, // Algo (Aligned with Data Struct)

    // --- LEVEL 6 ---
    // Testing Child
    { id: "313468", x: 750, y: 1050, type: 'course' }, // Maintenance

    // Algo Children
    { id: "311350", x: 1250, y: 1050, type: 'course' }, // AI
    { id: "311422", x: 1450, y: 1050, type: 'course' }, // OS

    // --- FOOTER ---
    { id: "proj_grad", x: 2150, y: 1200, type: 'label-box-green', label: "Graduation Project\nReq: 110 Hours" },
    { id: "proj_train", x: 2350, y: 1200, type: 'label-box-green', label: "Field Training\nReq: 90 Hours" },

    // --- SUMMARY BLOCKS ---
    { id: "summ_uni_comp", x: 2650, y: 250, type: 'summary-block', label: "University Compulsory\n(12 Cr)", group: "University Compulsory", subtext: "View Courses" },
    { id: "summ_free", x: 2650, y: 450, type: 'summary-block', label: "Free Requirements\n(3 Cr)", group: "Free Elective", subtext: "Any Course" },
    { id: "summ_support", x: 2650, y: 650, type: 'summary-block', label: "Supportive Compulsory\n(6 Cr)", group: "Supportive Compulsory", subtext: "Stats & Numerical" },
    { id: "summ_uni_elec", x: 2650, y: 850, type: 'summary-block', label: "University Elective\n(15 Cr)", group: "University Elective", subtext: "View Options" },
];

const planLinks = [
    // Level 1
    { s: "311100", t: "313160" },
    { s: "311100", t: "313269" },
    { s: "311100", t: "311101" },
    { s: "311100", t: "311220" },
    { s: "311100", t: "311160" },
    { s: "311100", t: "601101" },
    { s: "311100", t: "311240" },

    // SE Branch
    { s: "313160", t: "313466" },
    { s: "313160", t: "313261" },
    { s: "313261", t: "313367" },
    { s: "313261", t: "313364" },

    // OO SE Split
    { s: "313364", t: "313469" },
    { s: "313364", t: "313464" },
    { s: "313364", t: "313462" },

    // Proj Mgmt Branch
    { s: "313160", t: "313269" },
    { s: "313269", t: "313262" },
    { s: "313262", t: "313363" },
    { s: "313363", t: "313365" },
    { s: "313363", t: "313366" },
    { s: "313365", t: "313468" },

    // Prog Branch (311101 Children)
    { s: "311101", t: "313204" }, // -> Adv Prog
    { s: "311101", t: "311202" }, // -> OOP
    { s: "311101", t: "313263" }, // -> Multimedia (UPDATED)

    // OOP Children
    { s: "311202", t: "311305" }, // -> Visual
    { s: "311202", t: "311304" }, // -> Web
    { s: "311202", t: "311213" }, // -> Data Struct (UPDATED)

    // Hardware Branch
    { s: "311220", t: "311321" }, // Logic -> Arch
    { s: "311220", t: "311330" }, // Logic -> Net
    { s: "311330", t: "311468" }, // Net -> Sec

    // Math Branch
    { s: "601101", t: "311210" }, // Calc -> Discrete
    
    // Algorithms Branch (From Data Struct)
    { s: "311213", t: "311314" }, // Data Struct -> Algo
    { s: "311314", t: "311350" }, // Algo -> AI
    { s: "311314", t: "311422" }, // Algo -> OS

    // DB Branch
    { s: "311240", t: "311340" },
    { s: "311240", t: "311241" },
    
    // Footer
    { s: "proj_train", t: "proj_grad" }
];

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

function getCategoryClass(category) {
    if (!category) return 'cat-support';
    const cat = category.toLowerCase();
    
    if (cat.includes('major compulsory')) return 'cat-major-comp';
    if (cat.includes('college compulsory')) return 'cat-college-comp';
    if (cat.includes('university compulsory')) return 'cat-uni-comp';
    if (cat.includes('university elective')) return 'cat-uni-elective';
    if (cat.includes('major elective') || cat.includes('department elective')) return 'cat-major-elective';
    
    return 'cat-support';
}

async function updateStudentStats(userId, planStructure) {
    try {
        // 1. Fetch completed enrollments with course credit hours
        const { data: enrollments, error } = await supabase
            .from('enrollments')
            .select(`
                status,
                sections (
                    courses (
                        credit_hours
                    )
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'COMPLETED');

        if (error) throw error;

        // 2. Calculate Total Completed Hours
        // We use reduce to sum up the credit_hours from the nested object structure
        const totalHours = enrollments.reduce((sum, item) => {
            // Safety check to ensure data exists down the chain
            const credits = item.sections?.courses?.credit_hours || 0;
            return sum + credits;
        }, 0);

        // 3. Calculate Percentage (Based on 132 hours total)
        // We use Math.min to cap it at 100% just in case
        const percentage = Math.min(100, Math.round((totalHours / 132) * 100));

        console.log(`User Stats: ${totalHours} Hours, ${percentage}%`);

        // 4. Update the planStructure Array
        // We find the specific nodes by ID and update their labels
        const hoursNode = planStructure.find(n => n.id === "lbl_95");
        const percentNode = planStructure.find(n => n.id === "lbl_75");

        if (hoursNode) {
            hoursNode.label = `${totalHours}\nHours`;
        }
        
        if (percentNode) {
            percentNode.label = `${percentage}\n%`;
        }

        return planStructure;

    } catch (err) {
        console.error('Error fetching student stats:', err);
        return planStructure; // Return original structure on error
    }
}

// 2. Helper to get Status Icon
function getStatusIcon(status) {
    if (status === 'passed') return '✅';
    if (status === 'registered') return '🕒';
    if (status === 'locked') return '🔒';
    if (status === 'open') return '🔓';
    return '';
}

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
    // 1. Hide all containers first
    homeContainer.classList.add('hidden');
    regContainer.classList.add('hidden');
    const sheetContainer = document.getElementById('courses-sheet-container');
    const scheduleContainer = document.getElementById('schedule-container');
    const planContainer = document.getElementById('plan-container'); 

    const excContainer = document.getElementById('exceptions-container');
    if(excContainer) excContainer.classList.add('hidden');
    
    if(sheetContainer) sheetContainer.classList.add('hidden');
    if(scheduleContainer) scheduleContainer.classList.add('hidden');
    if(planContainer) planContainer.classList.add('hidden');

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // 2. Show selected container
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
        if(currentUser) {
            loadFullSchedule(currentUser.id); // Existing weekly schedule
            initHistory(currentUser.id);      // NEW: Load history filters
        }
    } else if (sectionName === 'plan') {
        // --- FIX: Unhide the container ---
        if(planContainer) planContainer.classList.remove('hidden'); 
        if(currentUser) loadStudentPlan(currentUser.id);
    } else if (sectionName === 'exceptions') {
        if(excContainer) excContainer.classList.remove('hidden');
        if(currentUser) loadExceptionHistory(currentUser.id);

        if(allCoursesData.length === 0) fetchAllCoursesForSearch();
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
    try {
        // Attempt to notify the server (it might fail if session is already gone)
        await supabase.auth.signOut();
    } catch (error) {
        console.warn("Server logout failed (likely session expired), forcing local logout.");
    } finally {
        // CRITICAL: Force the UI to update regardless of server error
        currentUser = null;
        
        // Clear any specific local storage items if Supabase client missed them
        // (Optional but good practice if issues persist)
        localStorage.clear(); 

        // Update UI to show Login screen
        updateUI(null);
        
        // Optional: Reload page to ensure a completely clean slate
        // window.location.reload(); 
    }
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

async function loadRegistrationData(userId) {
    const container = document.getElementById('registration-courses-container');
    container.innerHTML = '<div class="spinner"></div>';

    try {
        // 1. Fetch Active Semester
        const { data: activeSem, error: semError } = await supabase
            .from('semesters')
            .select('semester_id')
            .eq('is_active', true)
            .single();

        if (semError || !activeSem) {
            container.innerHTML = '<p style="text-align:center; color:red;">System Error: No Active Semester.</p>';
            return;
        }
        const currentSemesterId = activeSem.semester_id;

        // 2. Fetch User Profile
        const { data: profile } = await supabase.from('users').select('*').eq('id', userId).single();
        if (profile) window.userProfile = profile;

        // 3. Fetch CURRENT Enrollments (for conflicts/blocking)
        const { data: enrolls } = await supabase
            .from('enrollments')
            .select(`
                section_id, 
                status,
                sections (course_code, schedule_text, courses (credit_hours))
            `)
            .eq('user_id', userId)
            .in('status', ['REGISTERED', 'ENROLLED']);
            
        currentEnrollments = enrolls ? enrolls.map(e => e.section_id) : [];
        window.enrolledCourseCodes = enrolls ? enrolls.map(e => e.sections?.course_code) : [];
        window.busyTimes = enrolls ? enrolls.map(e => (e.sections?.schedule_text || "").toLowerCase().trim()) : [];
        const totalCredits = enrolls ? enrolls.reduce((sum, e) => sum + (e.sections?.courses?.credit_hours || 0), 0) : 0;
        window.currentTotalCredits = totalCredits;
        updateCreditUI(totalCredits);

        // 4. NEW: Fetch COMPLETED History (for Prerequisite Check)
        const { data: history } = await supabase
            .from('enrollments')
            .select('sections(course_code)')
            .eq('user_id', userId)
            .eq('status', 'COMPLETED');
        
        // Create a simple list of passed course codes
        window.passedCourses = history ? history.map(h => h.sections?.course_code) : [];

        // 5. Fetch Waitlist
        const { data: waits } = await supabase
            .from('waiting_list')
            .select('section_id')
            .eq('user_id', userId)
            .eq('status', 'WAITING');
        currentWaitlist = waits ? waits.map(w => w.section_id) : [];

        // 6. Fetch Sections with Prerequisites
        const { data: sections, error } = await supabase
            .from('sections')
            .select(`
                *,
                courses (
                    course_code,
                    course_name_en,
                    course_name_ar,
                    credit_hours,
                    category,
                    prerequisites!prerequisites_course_code_fkey (
                        prereq_code
                    )
                )
            `)
            .eq('semester_id', currentSemesterId)
            .order('course_code', { ascending: true });

        if (error) throw error;

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
    const showClosed = document.getElementById('reg-check-closed').checked;
    const hideConflicts = document.getElementById('reg-check-conflicts').checked;
    
    // NEW: Get the Hide Completed Checkbox state
    const hideCompleted = document.getElementById('reg-check-completed').checked;
    
    const grouped = {};
    
    sections.forEach(sec => {
        const course = sec.courses;
        const code = (course.course_code || sec.course_code).toString();

        // --- FILTERING ---
        const nameEn = course.course_name_en.toLowerCase();
        const nameAr = course.course_name_ar ? course.course_name_ar.toLowerCase() : "";
        
        // 1. Completed Check
        // We use window.passedCourses which was populated in loadRegistrationData
        const isPassed = window.passedCourses && window.passedCourses.includes(code);

        // If "Hide Completed" is ON and the user has passed this course, skip it entirely
        if (hideCompleted && isPassed) return;

        if (!code.toLowerCase().includes(searchText) && !nameEn.includes(searchText) && !nameAr.includes(searchText)) return;
        if (filterYear !== 'all' && code.length >= 3 && code[2] !== filterYear) return;
        if (filterCat !== 'all' && course.category !== filterCat) return;
        if (filterCred !== 'all' && course.credit_hours != filterCred) return;

        // Closed/Full Logic
        const capacity = sec.capacity || 30;
        const enrolled = sec.enrolled_count || 0;
        const statusStr = (sec.status || "").toUpperCase(); 
        const isClosed = statusStr === 'CLOSED';
        const isFull = (enrolled >= capacity) || isClosed;
        
        if (isFull && !showClosed) return;

        if (!grouped[code]) {
            grouped[code] = {
                course: sec.courses,
                sections: [],
                isPassed: isPassed // Store passed status for the group
            };
        }
        grouped[code].sections.push(sec);
    });

    if (Object.keys(grouped).length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666; margin-top:20px;">No courses match your filters.</p>';
        return;
    }

    // --- RENDERING ---
    Object.values(grouped).forEach(group => {
        const course = group.course;
        const courseName = currentLang === 'ar' ? course.course_name_ar : course.course_name_en;
        
        const alreadyHasCourse = window.enrolledCourseCodes && window.enrolledCourseCodes.includes(course.course_code);
        
        const reqs = course.prerequisites || [];
        const missingPrereqs = reqs.filter(req => !window.passedCourses.includes(req.prereq_code));
        const hasPrereqs = missingPrereqs.length === 0;

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'flex-start'; 
        wrapper.style.gap = '10px';
        wrapper.style.marginBottom = '15px';

        const accordion = document.createElement('div');
        accordion.className = 'course-accordion collapsed';
        accordion.style.flex = '1'; 
        accordion.style.marginBottom = '0'; 
        
        // Internal Badges
        let badgeHtml = '';
        if (group.isPassed) {
             // NEW: Badge for Passed Courses (if shown)
             badgeHtml = `<span class="badge badge-green" style="font-size:0.7em; margin-left:10px;">Passed ✅</span>`;
        } else if (!hasPrereqs) {
            badgeHtml = `<span class="badge badge-red" style="font-size:0.7em; margin-left:10px;">Missing Prereq</span>`;
        } else if (alreadyHasCourse) {
            badgeHtml = '<span class="status-text success" style="margin-left:10px; font-size:0.7em;">Enrolled</span>';
        }

        accordion.innerHTML = `
            <div class="accordion-header" onclick="toggleAccordion(this)">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="chevron">›</span>
                    <span class="cat-title"><strong>${course.course_code}</strong> - ${courseName}</span>
                    ${badgeHtml}
                </div>
                <div class="accordion-meta">
                    <span class="badge badge-gray">${course.credit_hours} Cr</span>
                    <span style="font-size:0.8em; color:#666; margin-left:10px;">${group.sections.length} Sec</span>
                </div>
            </div>
            <div class="accordion-content hidden"></div>
        `;

        // Only show override button if NOT passed and Prereqs Missing
        let externalButton = null;
        if (!group.isPassed && !hasPrereqs) {
             const safeName = courseName.replace(/'/g, "\\'"); 
             const tooltip = translations[currentLang].btn_req_override;
             
             externalButton = document.createElement('button');
             externalButton.className = 'circle-btn time-btn';
             externalButton.style.cssText = `
                background-color: #f57c00; 
                width: 45px; 
                height: 45px; 
                flex-shrink: 0; 
                margin-top: 5px; 
                box-shadow: 0 2px 5px rgba(0,0,0,0.15);
                display: flex; 
                align-items: center; 
                justify-content: center;
                font-size: 1.2em;
             `;
             externalButton.title = tooltip;
             externalButton.innerHTML = '⚠️';
             externalButton.onclick = () => requestPrereqOverride(course.course_code, safeName);
        }

        const contentDiv = accordion.querySelector('.accordion-content');
        let visibleSectionsCount = 0;

        group.sections.forEach(sec => {
            const capacity = sec.capacity || 30;
            const enrolled = sec.enrolled_count || 0;
            const statusStr = (sec.status || "").toUpperCase();
            const isClosed = statusStr === 'CLOSED';
            const isFull = (enrolled >= capacity) || isClosed;
            const fillPercent = Math.min(100, (enrolled / capacity) * 100);
            
            const secTime = (sec.schedule_text || "").toLowerCase().trim();
            const hasConflict = window.busyTimes && window.busyTimes.includes(secTime);
            
            if (hideConflicts && hasConflict && !currentEnrollments.includes(sec.section_id)) return;
            visibleSectionsCount++;

            let barColor = 'green';
            if (isFull) barColor = 'red';
            else if (fillPercent > 80) barColor = 'yellow';

            const isRegisteredThisSection = currentEnrollments.includes(sec.section_id);
            const isWaitlisted = currentWaitlist.includes(sec.section_id);

            let actionButtons = '';
            let rowOpacity = '1';

            // --- BUTTON LOGIC UPDATE ---
            if (group.isPassed) {
                // If passed, show Disabled text
                actionButtons = `<span class="status-text success">Completed ✅</span>`;
                rowOpacity = '0.5';
            } else if (isRegisteredThisSection) {
                actionButtons = `<span class="status-text success">Registered ✅</span>`;
            } else if (alreadyHasCourse) {
                actionButtons = `<span class="status-text" style="color:#666; background:#eee; font-size:0.75em;">Course Enrolled</span>`;
                rowOpacity = '0.6';
            } else if (!hasPrereqs) {
                const missingText = missingPrereqs.map(p => p.prereq_code).join(', ');
                actionButtons = `<span class="status-text" style="color:#c62828; background:#ffebee; border:1px solid #c62828; font-size:0.75em;" title="Missing: ${missingText}">Prereq Missing 🔒</span>`;
                rowOpacity = '0.5';
            } else if (isWaitlisted) {
                actionButtons = `<span class="status-text warning">Waitlisted 🕒</span>`;
            } else if (hasConflict) {
                actionButtons = `<span class="status-text" style="color:#c62828; background:#ffebee; border:1px solid #c62828; font-size:0.75em;">Time Conflict ⚠️</span>`;
                rowOpacity = '0.7'; 
            } else if (isFull) {
                actionButtons = `
                    <button class="circle-btn time-btn" onclick="handleWaitlist(${sec.section_id})" title="Join Waitlist">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="16" height="16">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </button>
                `;
            } else {
                actionButtons = `
                    <button class="circle-btn add-btn" onclick="handleRegister(${sec.section_id})" title="Register">
                        +
                    </button>
                `;
            }

            const row = document.createElement('div');
            row.className = 'course-row';
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

        if (visibleSectionsCount > 0) {
            wrapper.appendChild(accordion);
            if (externalButton) {
                wrapper.appendChild(externalButton);
            }
            container.appendChild(wrapper);
        }
    });
}

window.updateAcademicProgress = function() {
    // 1. Calculate Total (from DB courses)
    // Assuming typical total is 132 if not calculating dynamically, but let's sum DB
    const totalCredits = 132; // Fixed standard, or use: allCoursesData.reduce((sum, c) => sum + c.credit_hours, 0);

    // 2. Calculate Earned (from passedCourses array)
    let earnedCredits = 0;
    
    if (window.passedCourses && window.allCoursesData) {
        // Create unique set to avoid duplicates
        const uniquePassed = [...new Set(window.passedCourses)];
        
        uniquePassed.forEach(code => {
            // Find the course object to get its credit hours
            // Ensure we compare strings
            const course = allCoursesData.find(c => c.course_code.toString() === code.toString());
            if (course) {
                earnedCredits += course.credit_hours;
            }
        });
    }

    // 3. Update UI Elements
    // Update Hours Number
    const hoursElement = document.getElementById('stat-hours-val'); // Make sure your HTML has this ID
    // OR if you don't have IDs, use selector (adjust based on your actual HTML structure)
    const cardHeaders = document.querySelectorAll('.stat-card h3');
    if(cardHeaders.length >= 2) {
        cardHeaders[1].textContent = earnedCredits; // Assuming 2nd card is hours
    }

    // Update Percentage
    const percentage = Math.min(100, Math.round((earnedCredits / totalCredits) * 100));
    const percentText = document.querySelector('.progress-text'); // Text inside circle
    if (percentText) percentText.textContent = `${percentage}%`;
    
    // Update Circle Stroke (SVG)
    const circle = document.querySelector('.progress-ring__circle');
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }
};

window.openDrawer = function(categoryFilter, title) {
    const drawer = document.getElementById('elective-drawer');
    const overlay = document.getElementById('elective-drawer-overlay');
    const list = document.getElementById('drawer-content');
    const titleEl = document.getElementById('drawer-title');
    
    titleEl.textContent = title;
    list.innerHTML = ''; 

    // Find courses matching the category
    const courses = allCoursesData.filter(c => 
        c.category && c.category.toLowerCase().includes(categoryFilter.toLowerCase())
    );

    if (courses.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">No courses found.</p>';
    } else {
        courses.forEach(c => {
            const name = currentLang === 'ar' ? c.course_name_ar : c.course_name_en;
            const item = document.createElement('div');
            item.className = `drawer-node ${getCategoryClass(c.category)}`;
            
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <span style="font-weight:bold; color:#2E7D32;">${c.course_code}</span>
                    <span style="font-size:0.8em; background:#eee; padding:2px 6px; borderRadius:4px;">${c.credit_hours} Cr</span>
                </div>
                <div style="font-size:0.9em; color:#333; margin-top:4px;">${name}</div>
            `;
            
            // Clicking item in drawer opens full details
            item.onclick = () => {
                closeDrawer(); // Close drawer first
                showCourseDetails(c.course_code); // Open existing details overlay
            };
            
            list.appendChild(item);
        });
    }

    drawer.classList.add('open');
    overlay.classList.add('open');
};

window.closeDrawer = function() {
    document.getElementById('elective-drawer').classList.remove('open');
    document.getElementById('elective-drawer-overlay').classList.remove('open');
};


// Call this after rendering the main tree
function renderElectiveBlocks() {
    const container = document.getElementById('plan-tree-container'); // Or specific container for these
    
    // Define the 4 blocks manually since they might not be in the standard node list
    const electiveTypes = [
        { name: "University Elective", count: 2, filterKey: "University Elective" },
        { name: "Major Elective", count: 2, filterKey: "Major Compulsory" } // Or whatever category maps to this
    ];

    // Create a container for them if not exists
    let electivesRow = document.createElement('div');
    electivesRow.style.display = 'flex';
    electivesRow.style.gap = '20px';
    electivesRow.style.justifyContent = 'center';
    electivesRow.style.marginTop = '40px';
    
    electiveTypes.forEach(type => {
        // Create 2 blocks for each type (example)
        for(let i=1; i<=type.count; i++) {
            const block = document.createElement('div');
            block.className = `tree-node ${getCategoryClass(type.filterKey)}`;
            block.style.borderStyle = "dashed"; // Dashed to indicate "Select one"
            block.style.cursor = "pointer";
            block.innerHTML = `<strong>${type.name} ${i}</strong><br>Click to Select`;
            
            // OPEN DRAWER ON CLICK
            block.onclick = () => openDrawer(type.filterKey, `${type.name} Options`);
            
            electivesRow.appendChild(block);
        }
    });

    container.appendChild(electivesRow);
}

// --- DRAWER FUNCTIONS ---

window.openDrawer = function(categoryFilter, title) {
    const drawer = document.getElementById('elective-drawer');
    const overlay = document.getElementById('elective-drawer-overlay');
    const list = document.getElementById('drawer-content');
    const titleEl = document.getElementById('drawer-title');
    
    titleEl.textContent = title;
    list.innerHTML = ''; // Clear previous

    // Filter courses from global data
    const courses = allCoursesData.filter(c => 
        c.category && c.category.toLowerCase().includes(categoryFilter.toLowerCase())
    );

    if (courses.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#666;">No courses found for this category.</p>';
    } else {
        courses.forEach(c => {
            const item = document.createElement('div');
            item.className = `drawer-node ${getCategoryClass(c.category)}`;
            item.innerHTML = `
                <div style="font-weight:bold; color:#333;">${c.course_code}</div>
                <div style="font-size:0.9em; color:#555;">${c.course_name_en}</div>
                <div style="font-size:0.8em; color:#999; margin-top:4px;">${c.credit_hours} Credits</div>
            `;
            // Clicking item shows the main overlay
            item.onclick = () => {
                closeDrawer();
                showCourseDetails(c.course_code); // Use your existing overlay function
            };
            list.appendChild(item);
        });
    }

    drawer.classList.add('open');
    overlay.classList.add('open');
};

window.closeDrawer = function() {
    document.getElementById('elective-drawer').classList.remove('open');
    document.getElementById('elective-drawer-overlay').classList.remove('open');
};

window.requestPrereqOverride = function(courseCode, courseName) {
    // 1. Navigate to Exception Section
    showSection('exceptions');

    // 2. Set Type to Prerequisite
    const typeSelect = document.getElementById('exc-type');
    typeSelect.value = 'PREREQ';
    toggleExcFields(); // Update description text

    // 3. Pre-fill Course Data
    // We set the hidden ID (used for submission) and the visual Input
    document.getElementById('exc-target-code-hidden').value = courseCode;
    document.getElementById('exc-target-search').value = `${courseCode} - ${courseName}`;

    // 4. Clear other fields
    document.getElementById('exc-reason').value = '';
    document.getElementById('exc-alt-code-hidden').value = '';
    document.getElementById('exc-alt-search').value = '';

    // 5. Scroll to top/focus to ensure user sees it
    document.getElementById('exceptions-container').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('exc-reason').focus();
};

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

    const code = section.courses.course_code.toString();
    if (window.passedCourses && window.passedCourses.includes(code)) {
        alert("⛔ Error: You have already successfully completed this course.");
        return;
    }

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
    // 1. Get User Preferences
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

    // 2. Prepare UI
    aiPrefModal.classList.add('hidden');
    aiModal.classList.remove('hidden');
    aiLoading.classList.remove('hidden');
    aiResults.innerHTML = ''; 

    try {
        const userId = currentUser.id;
        
        // 3. Fetch Context (History + Current Schedule)
        const context = await fetchStudentContext(userId);
        
        if (context.options.length === 0) throw new Error("No eligible courses found.");

        // --- FIX STARTS HERE ---
        
        // A. Calculate Current Load
        // We sum up the credits of currently REGISTERED courses from the context we just fetched
        // (We need to ensure fetchStudentContext returns this, or we calculate it here)
        // Since fetchStudentContext returns 'busyTimes' but not credits explicitly, 
        // let's grab the global variable we set in loadRegistrationData, 
        // OR better: calculate it safe from context if possible. 
        // For now, we rely on the window global or default to 0.
        const currentLoad = window.currentTotalCredits || 0;

        // B. Get Semester Limits
        const { min: uniMin, max: uniMax } = getCreditLimits();
        
        // C. Get User's Total Target (e.g., "I want 15 hours total")
        const desiredTotal = parseInt(document.getElementById('credits-pref').value) || 15;

        // D. Validation
        if (currentLoad >= uniMax) {
            throw new Error(`You already have ${currentLoad} credit hours (Max: ${uniMax}). You cannot add more.`);
        }

        // E. Calculate "Delta" (What to send to AI)
        const maxAddable = uniMax - currentLoad; // Space left (e.g., 18 - 9 = 9)
        
        // How much does user WANT to add? (e.g., 15 - 9 = 6)
        let targetToAdd = desiredTotal - currentLoad;
        
        // Logic: If target is already met or exceeded, suggest minimal addition (3 cr) or just fill remaining space
        if (targetToAdd <= 0) targetToAdd = 3; 
        if (targetToAdd > maxAddable) targetToAdd = maxAddable;

        // Min Requirement: If current < Uni Min (12), they MUST add enough to reach 12.
        // e.g. Current 9, Min 12 => Must add 3.
        // e.g. Current 13, Min 12 => Must add 0 (but AI needs >0 to work, so we say 3 for 1 course).
        let minToAdd = Math.max(0, uniMin - currentLoad);
        if (minToAdd === 0) minToAdd = 3; // Ensure we ask for at least 1 course
        if (minToAdd > maxAddable) minToAdd = maxAddable; // Cap at max

        console.log(`AI Math: Current=${currentLoad}, TargetTotal=${desiredTotal}, Asking AI for: ${targetToAdd} credits (Min: ${minToAdd}, Max: ${maxAddable})`);

        const preferences = { 
            intensity, 
            time, 
            focus, 
            days, 
            targetCredits: targetToAdd, // Send DELTA
            minCredits: minToAdd,       // Send DELTA
            maxCredits: maxAddable      // Send DELTA
        };


        const plans = await getOpenRouterRecommendations(context, preferences);
        
        aiLoading.classList.add('hidden');
        renderPlans(plans);

    } catch (err) {
        console.error(err);
        aiLoading.innerHTML = `<div style="padding:20px; text-align:center;">
            <p style="color:#d32f2f; font-weight:bold;">Unable to generate schedule.</p>
            <p style="color:#666;">${err.message}</p>
            <button onclick="aiModal.classList.add('hidden')" style="margin-top:10px; padding:5px 10px;">Close</button>
        </div>`;
    }
});

const filterIds = ['reg-search-input', 'reg-filter-year', 'reg-filter-category', 'reg-filter-credits', 'reg-check-closed', 'reg-check-completed'];
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

function updatePlanLegend() {
    // Updates the static HTML legend items
    const legendItems = document.querySelectorAll('.plan-legend .legend-item');
    if(legendItems.length >= 4) {
        legendItems[0].lastChild.textContent = " " + translations[currentLang].plan_legend_passed;
        legendItems[1].lastChild.textContent = " " + translations[currentLang].plan_legend_registered;
        legendItems[2].lastChild.textContent = " " + translations[currentLang].plan_legend_open;
        legendItems[3].lastChild.textContent = " " + translations[currentLang].plan_legend_locked;
    }
}

window.loadStudentPlan = async function(userId) {
    const canvas = document.getElementById('plan-tree-canvas');
    if(!canvas) return;
    canvas.innerHTML = '<div class="spinner"></div>';

    updatePlanLegend();

    try {
        // 1. Fetch Student History
        const { data: history } = await supabase
            .from('enrollments')
            .select('status, sections(course_code)')
            .eq('user_id', userId)
            .in('status', ['COMPLETED', 'REGISTERED', 'ENROLLED']);

        const passedCodes = new Set();
        const registeredCodes = new Set();
        
        history?.forEach(h => {
            const code = h.sections?.course_code;
            if (h.status === 'COMPLETED') passedCodes.add(code);
            else registeredCodes.add(code);
        });

        // 2. Fetch All Courses
        const { data: courses } = await supabase
            .from('courses')
            .select('course_code, course_name_en, course_name_ar, credit_hours, category, course_description');            
        
        if (courses) {
            allCoursesData = courses; 
        }

        const courseMap = {};
        courses?.forEach(c => courseMap[c.course_code] = c);

        // --- NEW: CALCULATE DYNAMIC STATS ---
        let totalCompletedHours = 0;
        
        // Sum up credits for every passed course
        passedCodes.forEach(code => {
            const course = courseMap[code];
            if (course && course.credit_hours) {
                totalCompletedHours += course.credit_hours;
            }
        });

        // Calculate Percentage (Goal: 132 Hours)
        const planTotal = 132;
        const percentage = Math.min(100, Math.round((totalCompletedHours / planTotal) * 100));

        // Update the Tree Nodes (lbl_95 and lbl_75)
        const hoursNode = planStructure.find(n => n.id === "lbl_95");
        if (hoursNode) {
            hoursNode.label = `${totalCompletedHours}\nHours`;
        }

        const percentNode = planStructure.find(n => n.id === "lbl_75");
        if (percentNode) {
            percentNode.label = `${percentage}\n%`;
        }
        // -------------------------------------

        // 3. Render Tree (Now with updated labels)
        renderPlanTree(passedCodes, registeredCodes, courseMap);
        
        enableDragScroll(); 
        
        canvas.style.width = "2200px";
        canvas.style.height = "1200px";

        setTimeout(() => fitToScreen(), 100);

    } catch (err) {
        console.error("Plan Error:", err);
        canvas.innerHTML = '<p style="color:red; text-align:center;">Failed to load plan map.</p>';
    }
}
// Helper function for Dragging
function enableDragScroll() {
    const wrapper = document.getElementById('tree-wrapper');
    let isDown = false;
    let startX, startY, scrollLeft, scrollTop;

    wrapper.addEventListener('mousedown', (e) => {
        isDown = true;
        wrapper.style.cursor = 'grabbing';
        startX = e.pageX - wrapper.offsetLeft;
        startY = e.pageY - wrapper.offsetTop;
        scrollLeft = wrapper.scrollLeft;
        scrollTop = wrapper.scrollTop;
    });

    wrapper.addEventListener('mouseleave', () => {
        isDown = false;
        wrapper.style.cursor = 'grab';
    });

    wrapper.addEventListener('mouseup', () => {
        isDown = false;
        wrapper.style.cursor = 'grab';
    });

    wrapper.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - wrapper.offsetLeft;
        const y = e.pageY - wrapper.offsetTop;
        const walkX = (x - startX) * 1.5; // 1.5x speed
        const walkY = (y - startY) * 1.5;
        wrapper.scrollLeft = scrollLeft - walkX;
        wrapper.scrollTop = scrollTop - walkY;
    });
}

let currentScale = 1;

window.changeZoom = function(delta) {
    const canvas = document.getElementById('plan-tree-canvas');
    currentScale += delta;
    // Limit zoom levels
    if (currentScale < 0.3) currentScale = 0.3;
    if (currentScale > 1.5) currentScale = 1.5;
    
    canvas.style.transform = `scale(${currentScale})`;
    
    // Adjust popup scale inversely so text stays readable? 
    // Or just hide it on zoom change to prevent misplacement
    closePlanPopup();
}

window.fitToScreen = function() {
    const wrapper = document.getElementById('tree-wrapper');
    const canvasWidth = 2600; // Matches your tree width
    
    if (!wrapper) return;
    
    const availableWidth = wrapper.clientWidth;
    // Calculate scale needed to fit 2600px into available width
    const scale = (availableWidth / canvasWidth) - 0.05; // -0.05 for padding
    
    currentScale = scale;
    // Apply scale
    const canvas = document.getElementById('plan-tree-canvas');
    canvas.style.transform = `scale(${currentScale})`;
    
    // Scroll to top left
    wrapper.scrollTop = 0;
    wrapper.scrollLeft = 0;
}

window.renderPlanTree = function(passed, registered, rawCourseData) {
    const container = document.getElementById('plan-tree-canvas');
    if (!container) return;

    // Reset container
    container.innerHTML = '';
    
    // --- CONFIG: Colors & Styles ---
    const colors = {
        major: "#1565c0",     // Blue
        college: "#2E7D32",   // Green
        univ: "#f57c00",      // Orange
        elective: "#0097a7",  // Teal
        support: "#7b1fa2",   // Purple
        default: "#546e7a"    // Grey Blue
    };

    // Helper to get color from category text
    const getBorderColor = (cat) => {
        if(!cat) return colors.default;
        const c = cat.toLowerCase();
        if(c.includes('major')) return c.includes('elective') ? colors.elective : colors.major;
        if(c.includes('college')) return colors.college;
        if(c.includes('university')) return colors.univ;
        if(c.includes('supportive')) return colors.support;
        return colors.default;
    };

    // Create SVG Layer for Lines
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNs, "svg");
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.overflow = "visible"; 
    container.appendChild(svg);

    // 1. Draw Links
    planLinks.forEach(link => {
        const sourceNode = planStructure.find(n => n.id === link.s);
        const targetNode = planStructure.find(n => n.id === link.t);

        if (sourceNode && targetNode) {
            // Updated Offset for wider nodes (Width 140, Height 70)
            const sx = sourceNode.x + 70; 
            const sy = sourceNode.y + 35;
            const tx = targetNode.x + 70;
            const ty = targetNode.y + 35;

            const midY = sy + (ty - sy) / 2;
            const d = `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
            
            const path = document.createElementNS(svgNs, "path");
            path.setAttribute("d", d);
            path.setAttribute("stroke", "#cfd8dc"); // Lighter Gray lines
            path.setAttribute("stroke-width", "2");
            path.setAttribute("fill", "none");
            path.classList.add("tree-link"); // hover effect in CSS
            svg.appendChild(path);
        }
    });

    // 2. Draw Nodes
    planStructure.forEach(node => {
        const el = document.createElement('div');
        el.style.position = "absolute";
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
        
        // --- A. Course Node ---
        if (node.type === 'course') {
            const course = rawCourseData[node.id] || { course_name_en: "Loading...", credit_hours: 3, category: "" };
            const name = (window.currentLang === 'ar' && course.course_name_ar) ? course.course_name_ar : course.course_name_en;
            
            // Determine Status
            let status = "locked";
            if (passed.has(node.id)) status = "passed";
            else if (registered.has(node.id)) status = "registered";
            else if (isPrereqMet(node.id, passed)) status = "open"; // Helper logic below

            // Style Variables
            const borderColor = getBorderColor(course.category);
            let bgColor = "white";
            let opacity = "1";
            let icon = "";

            // Apply Status Styling
            if(status === 'passed') {
                bgColor = "#e8f5e9"; // Light Green Tint
                icon = "<span style='color:#2E7D32; font-size:14px; position:absolute; top:-8px; right:-8px; background:white; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>✅</span>";
            } else if (status === 'registered') {
                bgColor = "#e3f2fd"; // Light Blue Tint
                icon = "<span style='color:#1565c0; font-size:14px; position:absolute; top:-8px; right:-8px; background:white; border-radius:50%; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>🕒</span>";
            } else if (status === 'locked') {
                bgColor = "#f5f5f5"; // Gray
                opacity = "0.8";
                icon = "<span style='color:#999; font-size:12px; position:absolute; top:4px; right:4px;'>🔒</span>";
            }

            // Main Node Style
            el.className = `node-box ${status}`;
            el.style.width = "140px";
            el.style.height = "70px";
            el.style.background = bgColor;
            el.style.border = `2px solid ${borderColor}`;
            // Add a thicker left border for category emphasis
            el.style.borderLeft = `6px solid ${borderColor}`;
            el.style.borderRadius = "8px";
            el.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)";
            el.style.display = "flex";
            el.style.flexDirection = "column";
            el.style.justifyContent = "center";
            el.style.alignItems = "center";
            el.style.textAlign = "center";
            el.style.cursor = "pointer";
            el.style.zIndex = "10";
            el.style.opacity = opacity;
            el.style.transition = "transform 0.2s, box-shadow 0.2s";

            // Hover Effect (Inline)
            el.onmouseenter = () => { el.style.transform = "translateY(-3px)"; el.style.boxShadow = "0 6px 12px rgba(0,0,0,0.1)"; };
            el.onmouseleave = () => { el.style.transform = "translateY(0)"; el.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)"; };

            // HTML Content
            el.innerHTML = `
                ${icon}
                <div style="font-weight:800; font-size:13px; color:#333; margin-bottom:2px;">${node.id}</div>
                <div style="font-size:10px; color:#555; line-height:1.2; padding:0 4px;">${name.substring(0,30)}</div>
            `;
            
            // Click Action
            el.onclick = () => showCoursePopup(node.id, course, status, 'status_'+status, el);
        }

        // --- B. Summary Blocks (Right Side) ---
        else if (node.type === 'summary-block') {
            const borderColor = getBorderColor(node.group); // Use group to color match
            
            el.className = "node-box summary";
            el.style.width = "160px";
            el.style.height = "80px";
            el.style.background = "white";
            el.style.border = `2px solid ${borderColor}`;
            el.style.borderLeft = `6px solid ${borderColor}`; // Matching Left Border
            el.style.borderRadius = "8px";
            el.style.display = "flex";
            el.style.flexDirection = "column";
            el.style.alignItems = "center";
            el.style.justifyContent = "center";
            el.style.textAlign = "center";
            el.style.cursor = "pointer";
            el.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
            
            el.innerHTML = `
                <div style="font-weight:bold; font-size:11px; color:#333; margin-bottom:4px;">${node.label.replace(/\n/g, '<br>')}</div>
                <div style="font-size:10px; color:#888;">${node.subtext}</div>
            `;

            el.onclick = () => openPdfDrawer(node.group, node.label.replace(/\n/g, ' '));
        }

        // --- C. Labels ---
        else if (node.type === 'label-circle') {
             el.style.background = "#fff";
             el.style.border = "2px solid #2E7D32";
             el.style.color = "#2E7D32";
             el.style.borderRadius = "50%";
             el.style.width = "60px";
             el.style.height = "60px";
             el.style.display = "flex";
             el.style.alignItems = "center";
             el.style.justifyContent = "center";
             el.style.textAlign = "center";
             el.style.fontWeight = "bold";
             el.style.fontSize = "12px";
             el.innerText = node.label;
        }
        else if (node.type.includes('label-box')) {
             el.style.background = "#2E7D32";
             el.style.color = "white";
             el.style.padding = "10px";
             el.style.borderRadius = "6px";
             el.style.width = "150px";
             el.style.textAlign = "center";
             el.style.fontSize = "12px";
             el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
             el.innerText = node.label;
        }

        container.appendChild(el);
    });
    
    // Resize container
    container.style.width = "2700px";
    container.style.height = "1300px";
};

// Simple Prereq Check Helper (assumes basic structure)
function isPrereqMet(courseCode, passedSet) {
    // In a real app, you'd check specific prereqs from DB.
    // For visual purposes, we can assume if it's not passed/reg, it might be open
    // unless it's deep in the tree. 
    // You can refine this using 'allCoursesData'
    const course = allCoursesData.find(c => c.course_code == courseCode);
    if(!course || !course.prerequisites || course.prerequisites.length === 0) return true;
    
    // Check if all prereqs are in 'passedSet'
    return course.prerequisites.every(p => passedSet.has(p.prereq_code));
}

window.openPdfDrawer = function(groupKey, title) {
    const drawer = document.getElementById('elective-drawer');
    const overlay = document.getElementById('elective-drawer-overlay');
    const list = document.getElementById('drawer-content');
    const titleEl = document.getElementById('drawer-title');
    
    titleEl.textContent = title;
    list.innerHTML = ''; 

    let courses = [];

    // --- DYNAMIC FETCH FOR FREE ELECTIVES ---
    if (groupKey === 'Free Elective') {
        // Filter from the globally loaded database courses
        if (allCoursesData && allCoursesData.length > 0) {
            courses = allCoursesData
                .filter(c => c.category === 'Free Elective')
                .map(c => ({
                    code: c.course_code,
                    name: currentLang === 'ar' ? c.course_name_ar : c.course_name_en,
                    cr: c.credit_hours
                }));
        }
        
        // If no specific "Free Elective" category exists in DB, show a generic message
        if (courses.length === 0) {
            list.innerHTML = `
                <div style="padding:20px; text-align:center; color:#555;">
                    <p><strong>Any University Course</strong></p>
                    <p style="font-size:0.9em;">You can choose any course offered by the university that is not in your study plan.</p>
                </div>`;
            drawer.classList.add('open');
            overlay.classList.add('open');
            return;
        }
    } else {
        // --- USE STATIC PDF DATA FOR OTHERS ---
        courses = pdfElectiveData[groupKey] || [];
    }

    // Render the list
    if (courses.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">No courses found.</p>';
    } else {
        courses.forEach(c => {
            const item = document.createElement('div');
            item.className = `drawer-node`;
            // Color code based on type
            if (groupKey.includes("Compulsory")) item.style.borderLeft = "4px solid #2E7D32"; // Green
            else item.style.borderLeft = "4px solid #F57C00"; // Orange
            
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <span style="font-weight:bold; color:#333;">${c.code}</span>
                    <span style="font-size:0.8em; background:#eee; padding:2px 6px; borderRadius:4px;">${c.cr} Cr</span>
                </div>
                <div style="font-size:0.9em; color:#555; margin-top:4px;">${c.name}</div>
            `;
            
            // Allow clicking to see details (if available in DB)
            item.onclick = () => {
                closeDrawer();
                // Try to find full details in DB to show popup
                const dbCourse = allCoursesData.find(db => db.course_code == c.code);
                if(dbCourse) showCourseDetails(dbCourse.course_code);
            };

            list.appendChild(item);
        });
    }

    drawer.classList.add('open');
    overlay.classList.add('open');
};

window.showCoursePopup = function(code, details, statusClass, statusKey, targetElement) {
    const popup = document.getElementById('course-popup');
    const overlay = document.getElementById('plan-overlay');
    const highlightContainer = document.getElementById('node-highlight-container'); 
    
    // 1. Get exact position
    const rect = targetElement.getBoundingClientRect(); 
    
    // 2. Create Clone
    highlightContainer.innerHTML = ''; 
    highlightContainer.classList.remove('hidden'); 
    highlightContainer.classList.add('active');

    const div = document.createElement('div');
    // Copy the exact classes from the source element
    div.className = targetElement.className + " node-html-clone";
    
    // Copy Styles (Background, Border, etc)
    div.style.cssText = targetElement.style.cssText;
    
    // Force absolute positioning for the clone on top of the screen
    div.style.position = "fixed";
    div.style.width = `${rect.width}px`;
    div.style.height = `${rect.height}px`;
    div.style.top = `${rect.top}px`;
    div.style.left = `${rect.left}px`;
    div.style.margin = "0";
    div.style.transform = "scale(1.1)"; // Slight pop
    div.style.zIndex = "1001";
    div.style.cursor = "default";
    div.style.boxShadow = "0 15px 30px rgba(0,0,0,0.2)"; // Stronger shadow

    // Copy Content
    div.innerHTML = targetElement.innerHTML;

    highlightContainer.appendChild(div);

    // 3. Populate & Show Detail Popup
    const title = document.getElementById('popup-title');
    const desc = document.getElementById('popup-desc');
    const longDesc = document.getElementById('popup-long-desc');
    const credits = document.getElementById('popup-credits');
    const statusBadge = document.getElementById('popup-status');

    if (details) {
        const fullName = currentLang === 'ar' ? details.course_name_ar : details.course_name_en;
        title.textContent = `${code}`;
        desc.textContent = fullName;
        
        // Populate Description
        if (details.course_description) {
            longDesc.textContent = details.course_description;
            longDesc.classList.remove('hidden');
        } else {
            longDesc.textContent = "";
            longDesc.classList.add('hidden');
        }

        credits.textContent = `${details.credit_hours} ${translations[currentLang].lbl_credits || 'Cr'}`;
    }

    // Set Badge Text
    statusBadge.textContent = translations[currentLang][statusKey] || statusClass;
    
    // Determine badge color
    let badgeClass = "badge-gray";
    if (statusClass === 'passed') badgeClass = "badge-green";
    else if (statusClass === 'registered') badgeClass = "badge-blue";
    else if (statusClass === 'open') badgeClass = "badge-yellow";
    
    statusBadge.className = `badge ${badgeClass}`;

    // Position the details card near the node
    let left = rect.right + 20; 
    let top = rect.top;
    
    // Boundary checks
    if (left + 300 > window.innerWidth) left = rect.left - 320; 
    if (top + 200 > window.innerHeight) top = window.innerHeight - 220;

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;

    popup.classList.remove('hidden');
    if (overlay) overlay.classList.remove('hidden');
}

window.closePlanPopup = function() {
    document.getElementById('course-popup').classList.add('hidden');
    const overlay = document.getElementById('plan-overlay');
    if (overlay) overlay.classList.add('hidden');

    const highlightContainer = document.getElementById('node-highlight-container');
    if (highlightContainer) {
        highlightContainer.classList.remove('active');
        highlightContainer.classList.add('hidden'); // <--- CRITICAL FIX
        highlightContainer.innerHTML = ''; 
    }
}


async function initHistory(userId) {
    const select = document.getElementById('history-sem-filter');
    const tbody = document.getElementById('history-table-body');
    
    if (!select || !tbody) return;

    // FIX: Force clear the dropdown every time to remove previous user's data
    select.innerHTML = `<option value="" data-i18n="lbl_loading">${translations[currentLang].lbl_loading || 'Loading...'}</option>`;
    
    // Clear the table view too so old data doesn't linger
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #666;">Select a semester</td></tr>';

    try {
        // 1. Fetch all distinct semesters from THIS user's enrollment history
        const { data, error } = await supabase
            .from('enrollments')
            .select(`
                sections (
                    semester_id,
                    semesters (name)
                )
            `)
            .eq('user_id', userId) // Explicitly filter by CURRENT userId
            .in('status', ['COMPLETED', 'FAILED']); 

        if (error) throw error;

        // 2. Process unique semesters
        const semMap = new Map();
        data.forEach(item => {
            if (item.sections && item.sections.semesters) {
                const id = item.sections.semester_id;
                const name = item.sections.semesters.name;
                if (!semMap.has(id)) semMap.set(id, name);
            }
        });

        // 3. Sort Descending (Newest First)
        const sortedIds = Array.from(semMap.keys()).sort((a, b) => b - a);

        // 4. Populate Dropdown
        const allText = translations[currentLang].opt_all_semesters || "All Semesters";
        select.innerHTML = `<option value="all">${allText}</option>`;
        
        if (sortedIds.length === 0) {
            select.innerHTML = `<option value="">No history found</option>`;
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No academic history found.</td></tr>';
            return;
        }

        sortedIds.forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = semMap.get(id);
            select.appendChild(option);
        });

        // 5. Add Event Listener (Re-binds with the NEW userId)
        select.onchange = () => loadHistoryTable(userId, select.value);

        // 6. Auto-load the most recent semester
        select.value = sortedIds[0];
        loadHistoryTable(userId, sortedIds[0]);

    } catch (err) {
        console.error("History Init Error:", err);
        select.innerHTML = `<option value="">Error loading semesters</option>`;
    }
}

async function loadHistoryTable(userId, semesterId) {
    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';

    try {
        // 1. Fetch History Data
        const { data, error } = await supabase
            .from('enrollments')
            .select(`
                status, 
                grade_value,
                sections (
                    semester_id,
                    courses (
                        course_code, 
                        course_name_en, 
                        course_name_ar, 
                        credit_hours
                    )
                )
            `)
            .eq('user_id', userId)
            .in('status', ['COMPLETED', 'FAILED']); // Only past courses

        if (error) throw error;

        // 2. Filter in JS (Client-side) for simplicity
        // (Supabase deep filtering syntax can be verbose)
        let filtered = data;
        if (semesterId && semesterId !== 'all') {
            filtered = data.filter(d => d.sections.semester_id == semesterId);
        }

        // 3. Render
        if (filtered.length === 0) {
            const msg = translations[currentLang].msg_no_history || "No courses found.";
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">${msg}</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        filtered.forEach(row => {
            const tr = document.createElement('tr');
            const course = row.sections.courses;
            const name = currentLang === 'ar' ? course.course_name_ar : course.course_name_en;
            
            // Status Badge Logic
            let badgeClass = 'badge-gray';
            let statusText = row.status;
            if (row.status === 'COMPLETED') {
                badgeClass = 'badge-green';
                statusText = translations[currentLang].status_passed || 'Passed';
            } else if (row.status === 'FAILED') {
                badgeClass = 'badge-red';
                statusText = translations[currentLang].status_failed || 'Failed';
            }

            tr.innerHTML = `
                <td><strong>${course.course_code}</strong></td>
                <td>${name}</td>
                <td>${course.credit_hours}</td>
                <td style="font-weight:bold; color: #333;">${row.grade_value !== null ? row.grade_value : '-'}</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("History Load Error:", err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Failed to load history data.</td></tr>';
    }
}

// --- EXCEPTION REQUESTS LOGIC ---

window.toggleExcFields = function() {
    const type = document.getElementById('exc-type').value;
    const desc = document.getElementById('exc-type-desc');
    const altGroup = document.getElementById('alt-course-group');

    // Use translation keys based on currentLang
    if (type === 'PREREQ') {
        desc.textContent = translations[currentLang].exc_desc_prereq;
        altGroup.classList.add('hidden');
    } else {
        desc.textContent = translations[currentLang].exc_desc_alt;
        altGroup.classList.remove('hidden');
    }
};

window.submitException = async function() {
    if (!currentUser) return;

    const type = document.getElementById('exc-type').value;
    
    // CHANGED: Read from hidden inputs
    const courseCode = document.getElementById('exc-target-code-hidden').value; 
    const altCode = document.getElementById('exc-alt-code-hidden').value;
    
    let reason = document.getElementById('exc-reason').value.trim();

    // Validation
    if (!courseCode) {
        alert("Please search for and select a Target Course from the list.");
        return;
    }
    if (!reason) {
        alert("Please provide a reason.");
        return;
    }

    // Append alternative info to reason text
    if (type === 'ALTERNATIVE') {
        if (!altCode) {
             // Optional warning if they selected "Alternative" but didn't pick a course
             if(!confirm("You selected 'Alternative Course' but didn't search for one. Continue?")) return;
        } else {
            reason = `[Replacing: ${altCode}] ${reason}`;
        }
    }

    try {
        const { error } = await supabase
            .from('exception_requests')
            .insert([{
                user_id: currentUser.id,
                course_code: courseCode,
                type: type,
                reason: reason,
                status: 'PENDING',
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;

        alert("Request submitted successfully!");
        
        // Clear Form (Inputs and Hidden values)
        document.getElementById('exc-target-search').value = '';
        document.getElementById('exc-target-code-hidden').value = '';
        document.getElementById('exc-alt-search').value = '';
        document.getElementById('exc-alt-code-hidden').value = '';
        document.getElementById('exc-reason').value = '';
        
        // Refresh List
        loadExceptionHistory(currentUser.id);

    } catch (err) {
        console.error("Submission Error:", err);
        alert("Failed to submit: " + err.message);
    }
};

async function loadExceptionHistory(userId) {
    const list = document.getElementById('exception-history-list');
    list.innerHTML = '<div class="spinner"></div>';

    try {
        const { data, error } = await supabase
            .from('exception_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        list.innerHTML = '';
        if (!data || data.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:#666; padding:20px;">No requests found.</p>';
            return;
        }

        data.forEach(req => {
            const date = new Date(req.created_at).toLocaleDateString();
            
            let badgeClass = 'badge-gray';
            if (req.status === 'APPROVED') badgeClass = 'badge-green';
            if (req.status === 'REJECTED') badgeClass = 'badge-red';
            if (req.status === 'PENDING') badgeClass = 'badge-yellow';

            const item = document.createElement('div');
            item.className = 'course-item'; // Reuse existing card style
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:5px;">
                    <div class="course-name" style="margin:0;">${req.course_code}</div>
                    <span class="badge ${badgeClass}" style="font-size:0.7em;">${req.status}</span>
                </div>
                <div style="font-size:0.85em; color:#555; margin-bottom:5px;">
                    <strong>Type:</strong> ${req.type === 'PREREQ' ? 'Prerequisite' : 'Alternative'}
                </div>
                <div style="font-size:0.85em; color:#666; font-style:italic; background:#f9f9f9; padding:5px; border-radius:4px;">
                    "${req.reason}"
                </div>
                ${req.admin_response ? `
                    <div style="font-size:0.85em; color:#2E7D32; margin-top:5px; border-top:1px dashed #ddd; padding-top:4px;">
                        <strong>Admin:</strong> ${req.admin_response}
                    </div>
                ` : ''}
                <div style="font-size:0.75em; color:#999; text-align:right; margin-top:5px;">
                    ${date}
                </div>
            `;
            list.appendChild(item);
        });

    } catch (err) {
        console.error("History Error:", err);
        list.innerHTML = '<p style="color:red; text-align:center;">Failed to load history.</p>';
    }
}

// --- NEW: FETCH COURSES FOR SEARCH ---
async function fetchAllCoursesForSearch() {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('course_code, course_name_en, course_name_ar');
        
        if (error) throw error;
        allCoursesData = data; // Store globally
        console.log("Courses loaded for search:", data.length);
    } catch (err) {
        console.error("Failed to load courses for search:", err);
    }
}

// --- SEARCH LOGIC GENERIC FUNCTION ---
function setupCourseSearch(inputId, hiddenId, listId) {
    const input = document.getElementById(inputId);
    const hidden = document.getElementById(hiddenId);
    const list = document.getElementById(listId);

    if(!input) return;

    input.addEventListener('input', () => {
        const val = input.value.toLowerCase();
        list.innerHTML = '';
        
        if (val.length < 2) {
            list.classList.add('hidden');
            return;
        }

        // Filter Data
        const matches = allCoursesData.filter(c => {
            const code = c.course_code.toString();
            const en = c.course_name_en.toLowerCase();
            const ar = c.course_name_ar ? c.course_name_ar.toLowerCase() : "";
            return code.includes(val) || en.includes(val) || ar.includes(val);
        }).slice(0, 10); // Limit to 10 results

        if (matches.length === 0) {
            list.classList.add('hidden');
            return;
        }

        matches.forEach(c => {
            const name = currentLang === 'ar' ? c.course_name_ar : c.course_name_en;
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <span class="suggestion-code">${c.course_code}</span>
                <span class="suggestion-name">${name}</span>
            `;
            
            div.onclick = () => {
                input.value = `${c.course_code} - ${name}`; // Show nicely in text box
                hidden.value = c.course_code; // Store actual code
                list.classList.add('hidden');
            };
            
            list.appendChild(div);
        });
        
        list.classList.remove('hidden');
    });

    // Hide list when clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !list.contains(e.target)) {
            list.classList.add('hidden');
        }
    });
}


// Initialize listeners immediately
document.addEventListener('DOMContentLoaded', () => {
    setupCourseSearch('exc-target-search', 'exc-target-code-hidden', 'exc-target-suggestions');
    setupCourseSearch('exc-alt-search', 'exc-alt-code-hidden', 'exc-alt-suggestions');
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

