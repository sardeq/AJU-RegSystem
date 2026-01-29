import { state } from './state.js';

export const translations = {
    en: {
        // --- Navigation ---
        nav_home: "Home",
        nav_reg: "Registration",
        nav_sheet: "Courses Sheet",
        nav_plan: "Student Plan",
        nav_exceptions: "Exceptions",
        nav_schedule: "My Schedule",
        nav_admin_home: "Dashboard",
        nav_admin_exceptions: "Prereq Requests",
        nav_admin_users: "Manage Users",
        nav_admin_courses: "Course Mgmt",
        nav_admin_admissions: "Admissions",
        
        // --- Auth ---
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

        // --- Header & Sidebar ---
        btn_logout: "Log Out",
        lbl_online: "Online",
        
        // --- Home / Dashboard ---
        welcome_title: "Welcome, ",
        alert_gpa_title: "GPA Notice",
        alert_gpa_desc: "Your current GPA is below the recommended threshold.",
        badge_reg_open: "Registration Open",
        hero_enroll_title: "Fall 2025 Enrollment",
        hero_enroll_desc: "Secure your seat in major compulsory courses before sections fill up.",
        btn_enroll_now: "Enroll Now ✨",
        lbl_todays_schedule: "Today's Schedule",
        lbl_view_full: "View Full",
        lbl_current_gpa: "Current GPA",
        lbl_hours_passed: "Hours Passed",
        lbl_class_rank: "Class Rank",
        lbl_reg_courses_count: "Registered Courses",
        lbl_credits: "Credits",
        msg_no_classes_today: "No classes today",
        msg_taking_now: "TAKING NOW",
        msg_room_tba: "Room TBA",

        // --- Registration ---
        ph_search_courses: "Search courses...",
        btn_ai_advisor: "✨ AI Advisor",
        filter_all_courses: "All Courses",
        filter_available: "Available",
        filter_waitlist_status: "Waitlist Status",
        filter_year: "Year",
        filter_year_all: "All Years",
        filter_cat_all: "All Categories",
        toggle_hide_completed: "Hide Completed",
        toggle_hide_conflict: "Hide Time Conflicts",
        toggle_hide_full: "Hide Full Sections",
        ai_rec_title: "AI Recommendation",
        ai_rec_desc: "It's recommended to enroll in this course to improve your GPA.",
        
        // --- Courses Sheet ---
        lbl_total_progress: "Progress",
        lbl_completed_hrs: "Completed Hours",
        lbl_avg_grade: "Avg Grade",
        ph_search_history: "Search history...",
        col_code: "Code",
        col_detail: "Course Detail",
        col_credits: "Credits",
        col_prereq: "Prereq",
        col_grade: "Grade",
        status_passed: "Passed",
        status_remaining: "Remaining",

        // --- Schedule ---
        lbl_my_schedule: "My Weekly Schedule",
        lbl_add_course: "+ Add Course",
        lbl_history: "Academic History",
        msg_checking_credits: "Checking credits...",

        // --- Exceptions (Student) ---
        exc_title: "Exception Requests",
        exc_desc: "Submit overrides for prerequisites or alternative courses.",
        exc_new_req: "New Exception Request",
        exc_new_req_desc: "Fill out the details below to request a curriculum override.",
        exc_type_label: "Request Type",
        opt_prereq: "Prereq Override",
        opt_alt: "Alternative Course",
        exc_target_label: "Target Course (The course you want to take)",
        ph_search_target: "Search course code or name...",
        exc_alt_label: "Replacing Course",
        ph_search_alt: "Search course to replace...",
        exc_reason_label: "Justification / Reason",
        ph_reason: "Please explain your academic situation in detail...",
        btn_submit_req: "Submit Request 🚀",
        exc_history_title: "History",

        // --- AI Preference Modal ---
        ai_pref_title: "AI Advisor",
        ai_pref_subtitle: "Customize your schedule preferences",
        lbl_intensity: "Study Intensity",
        opt_relaxed: "Relaxed",
        opt_balanced: "Balanced",
        opt_intense: "Intense",
        lbl_pref_days: "Preferred Days",
        lbl_time_pref: "Time Preference",
        opt_time_any: "Any Time",
        opt_time_morning: "Morning (8:00 - 12:00)",
        opt_time_late: "Late Start (10:00+)",
        opt_time_afternoon: "Afternoon (12:00+)",
        lbl_target_credits: "Target Credits",
        lbl_specific_goal: "Specific Goal",
        btn_generate: "Generate Recommendations ✨",

        // --- Waitlist Modals ---
        wl_modal_title: "Join Waiting List?",
        wl_modal_sec: "Section",
        wl_modal_desc: "This section is full. You will be placed in a queue.",
        btn_cancel: "Cancel",
        btn_confirm: "Confirm",
        wl_success_title: "Successfully Joined!",
        lbl_current_pos: "Current Position",
        btn_done: "Done",

        // --- Admin: Admissions ---
        admin_title: "Admissions Management",
        admin_subtitle: "Review and process incoming student applications.",
        stat_total_apps: "Total Received",
        stat_avg_gpa: "Avg GPA",
        stat_pop_major: "Most Popular",
        filter_pending: "Pending",
        filter_accepted: "Accepted",
        filter_rejected: "Rejected",
        ph_search_apps: "Search applicant name or ID...",
        lbl_hs_gpa: "High School GPA",
        lbl_desired_major: "Desired Major",
        lbl_nid: "National ID",
        btn_view_id: "View ID Card",
        btn_view_grades: "View Grades",
        lbl_admin_notes: "Admin Notes (Optional)",
        ph_admin_notes: "Reason for rejection or special notes...",
        btn_reject: "Reject Application",
        btn_accept: "Accept & Create User",

        // --- Admin: Users ---
        sect_user_mgmt: "User Management",
        filter_students: "Students",
        filter_admins: "Admins",
        filter_instructors: "Instructors",
        ph_search_users: "Search name or ID...",
        tbl_name_id: "Name / ID",
        tbl_email: "Email",
        tbl_role: "Role",
        tbl_gpa: "GPA",
        tbl_actions: "Actions",
        modal_edit_user: "Edit User",
        btn_save_changes: "Save Changes",

        // --- Admin: Courses ---
        sect_academic_sec: "Academic Sections",
        btn_create_sec: "+ Create New Section",
        filter_open: "Open",
        filter_closed: "Closed",
        ph_search_sec: "Search course code...",
        modal_edit_sec: "Edit Section",
        lbl_sec_code: "Course Code",
        lbl_sec_num: "Section No.",
        lbl_capacity: "Capacity",
        lbl_sch_text: "Schedule Text",
        lbl_room: "Room",
        lbl_instructor: "Instructor",
        btn_save_sec: "Save Section",

        // --- Admin: Enroll/Exceptions ---
        adm_enroll_title: "Select Section for Enrollment",
        adm_enroll_desc: "Approving this exception will automatically register the student into the selected section.",
        tbl_seats: "Seats",
        tbl_select: "Select",
        lbl_admin_response: "Admin Response (Optional)",
        ph_admin_response: "Approved via exception...",
        btn_confirm_enroll: "Confirm & Enroll",

        // --- Admin: Home ---
        adm_home_title: "Admin Dashboard 🛡️",
        adm_home_sub: "System Overview & Quick Actions",
        stat_pending_adm: "Pending Admissions",
        stat_pending_exc: "Pending Exceptions",
        stat_total_users: "Total Users",
        stat_open_sec: "Open Sections",
        card_rev_app: "Review Applications",
        card_rev_app_desc: "Process new student enrollments",
        card_man_courses: "Manage Courses",
        card_man_courses_desc: "Open/Close sections and edit details",
        card_user_dir: "User Directory",
        card_user_dir_desc: "Edit roles, GPA, and student data",

        modal_limit_title: "Action Required: Credit Limit Exceeded",
        modal_limit_desc: "Your request was approved, but you don't have enough credit space.",
        lbl_time_remaining: "Time Remaining to Enroll:",
        btn_drop_courses: "Go to Schedule to Drop",
        btn_accept_enroll: "I have space, Enroll Now",
        btn_deny_req: "Deny Request",
    },
    
    ar: {
        // --- Navigation ---
        nav_home: "الرئيسية",
        nav_reg: "التسجيل",
        nav_sheet: "صحيفة المواد",
        nav_plan: "الخطة الدراسية",
        nav_exceptions: "الاستثناءات",
        nav_schedule: "جدولي الدراسي",
        nav_admin_home: "لوحة التحكم",
        nav_admin_exceptions: "طلبات الاستثناء",
        nav_admin_users: "إدارة المستخدمين",
        nav_admin_courses: "إدارة المساقات",
        nav_admin_admissions: "القبول والتسجيل",

        // --- Auth ---
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

        // --- Header & Sidebar ---
        btn_logout: "خروج",
        lbl_online: "متصل",

        // --- Home / Dashboard ---
        welcome_title: "أهلاً بك، ",
        alert_gpa_title: "تنبيه المعدل",
        alert_gpa_desc: "معدلك التراكمي أقل من الحد الموصى به.",
        badge_reg_open: "التسجيل متاح",
        hero_enroll_title: "تسجيل خريف 2025",
        hero_enroll_desc: "احجز مقعدك في مواد التخصص الإجبارية قبل امتلاء الشعب.",
        btn_enroll_now: "سجّل الآن ✨",
        lbl_todays_schedule: "محاضرات اليوم",
        lbl_view_full: "عرض الجدول",
        lbl_current_gpa: "المعدل التراكمي",
        lbl_hours_passed: "ساعات مجتازة",
        lbl_class_rank: "الترتيب",
        lbl_reg_courses_count: "مواد مسجلة",
        lbl_credits: "ساعات",
        msg_no_classes_today: "لا يوجد محاضرات اليوم",
        msg_taking_now: "جاري الآن",
        msg_room_tba: "قاعة غير محددة",

        // --- Registration ---
        ph_search_courses: "بحث عن مادة...",
        btn_ai_advisor: "✨ مستشار الذكاء الاصطناعي",
        filter_all_courses: "كل المواد",
        filter_available: "المتاح",
        filter_waitlist_status: "الانتظار",
        filter_year: "السنة",
        filter_year_all: "كل السنوات",
        filter_cat_all: "كل التصنيفات",
        toggle_hide_completed: "إخفاء المكتملة",
        toggle_hide_conflict: "إخفاء التعارض",
        toggle_hide_full: "إخفاء المكتملة",
        ai_rec_title: "توصية ذكية",
        ai_rec_desc: "يُنصح بتسجيل هذه المادة لرفع معدلك التراكمي.",

        // --- Courses Sheet ---
        lbl_total_progress: "الإنجاز",
        lbl_completed_hrs: "الساعات المقطوعة",
        lbl_avg_grade: "معدل العلامات",
        ph_search_history: "بحث في السجل...",
        col_code: "الرمز",
        col_detail: "تفاصيل المادة",
        col_credits: "س.م",
        col_prereq: "المتطلب",
        col_grade: "العلامة",
        status_passed: "ناجح",
        status_remaining: "متبقي",

        // --- Schedule ---
        lbl_my_schedule: "جدولي الأسبوعي",
        lbl_add_course: "+ إضافة مادة",
        lbl_history: "السجل الأكاديمي",
        msg_checking_credits: "جاري حساب الساعات...",

        // --- Exceptions ---
        exc_title: "طلبات الاستثناء",
        exc_desc: "تقديم طلبات تجاوز المتطلب السابق أو المواد البديلة.",
        exc_new_req: "طلب استثناء جديد",
        exc_new_req_desc: "املأ التفاصيل أدناه لطلب تجاوز أكاديمي.",
        exc_type_label: "نوع الطلب",
        opt_prereq: "تجاوز متطلب سابق",
        opt_alt: "مادة بديلة",
        exc_target_label: "المادة المطلوبة (التي تريد تسجيلها)",
        ph_search_target: "ابحث برمز أو اسم المادة...",
        exc_alt_label: "المادة المستبدلة",
        ph_search_alt: "ابحث عن المادة المراد استبدالها...",
        exc_reason_label: "السبب / التبرير",
        ph_reason: "يرجى شرح الوضع الأكاديمي بالتفصيل...",
        btn_submit_req: "إرسال الطلب 🚀",
        exc_history_title: "سجل الطلبات",

        // --- AI Preference Modal ---
        ai_pref_title: "مستشار الذكاء الاصطناعي",
        ai_pref_subtitle: "تخصيص تفضيلات الجدول",
        lbl_intensity: "كثافة الدراسة",
        opt_relaxed: "مريح",
        opt_balanced: "متوازن",
        opt_intense: "مكثف",
        lbl_pref_days: "الأيام المفضلة",
        lbl_time_pref: "الوقت المفضل",
        opt_time_any: "أي وقت",
        opt_time_morning: "صباحي (8:00 - 12:00)",
        opt_time_late: "بداية متأخرة (10:00+)",
        opt_time_afternoon: "مسائي (12:00+)",
        lbl_target_credits: "عدد الساعات المستهدفة",
        lbl_specific_goal: "هدف محدد",
        btn_generate: "إنشاء التوصيات ✨",

        // --- Waitlist Modals ---
        wl_modal_title: "الانضمام للانتظار؟",
        wl_modal_sec: "شعبة",
        wl_modal_desc: "هذه الشعبة ممتلئة. سيتم وضعك في القائمة.",
        btn_cancel: "إلغاء",
        btn_confirm: "تأكيد",
        wl_success_title: "تم الانضمام!",
        lbl_current_pos: "الترتيب الحالي",
        btn_done: "تم",

        // --- Admin: Admissions ---
        admin_title: "إدارة القبول",
        admin_subtitle: "مراجعة ومعالجة طلبات التحاق الطلاب الجدد.",
        stat_total_apps: "إجمالي الطلبات",
        stat_avg_gpa: "معدل التوجيهي",
        stat_pop_major: "الأكثر طلباً",
        filter_pending: "قيد الانتظار",
        filter_accepted: "مقبول",
        filter_rejected: "مرفوض",
        ph_search_apps: "بحث باسم الطالب أو الرقم...",
        lbl_hs_gpa: "معدل الثانوية",
        lbl_desired_major: "التخصص المطلوب",
        lbl_nid: "الرقم الوطني",
        btn_view_id: "عرض الهوية",
        btn_view_grades: "عرض العلامات",
        lbl_admin_notes: "ملاحظات المسؤول (اختياري)",
        ph_admin_notes: "سبب الرفض أو ملاحظات خاصة...",
        btn_reject: "رفض الطلب",
        btn_accept: "قبول وإنشاء مستخدم",

        // --- Admin: Users ---
        sect_user_mgmt: "إدارة المستخدمين",
        filter_students: "طلاب",
        filter_admins: "مسؤولين",
        filter_instructors: "مدرسين",
        ph_search_users: "بحث بالاسم أو الرقم...",
        tbl_name_id: "الاسم / الرقم",
        tbl_email: "البريد",
        tbl_role: "الدور",
        tbl_gpa: "المعدل",
        tbl_actions: "إجراءات",
        modal_edit_user: "تعديل مستخدم",
        btn_save_changes: "حفظ التغييرات",

        // --- Admin: Courses ---
        sect_academic_sec: "الشعب الأكاديمية",
        btn_create_sec: "+ إنشاء شعبة جديدة",
        filter_open: "مفتوحة",
        filter_closed: "مغلقة",
        ph_search_sec: "بحث برمز المادة...",
        modal_edit_sec: "تعديل شعبة",
        lbl_sec_code: "رمز المادة",
        lbl_sec_num: "رقم الشعبة",
        lbl_capacity: "السعة",
        lbl_sch_text: "وقت المحاضرة",
        lbl_room: "القاعة",
        lbl_instructor: "المدرس",
        btn_save_sec: "حفظ الشعبة",

        // --- Admin: Enroll/Exceptions ---
        adm_enroll_title: "اختر شعبة للتسجيل",
        adm_enroll_desc: "الموافقة على هذا الاستثناء ستقوم بتسجيل الطالب تلقائياً في الشعبة المختارة.",
        tbl_seats: "مقاعد",
        tbl_select: "اختر",
        lbl_admin_response: "رد المسؤول (اختياري)",
        ph_admin_response: "تمت الموافقة بموجب استثناء...",
        btn_confirm_enroll: "تأكيد وتسجيل",

        // --- Admin: Home ---
        adm_home_title: "لوحة التحكم 🛡️",
        adm_home_sub: "نظرة عامة وإجراءات سريعة",
        stat_pending_adm: "قبول معلق",
        stat_pending_exc: "استثناء معلق",
        stat_total_users: "المستخدمين",
        stat_open_sec: "شعب مفتوحة",
        card_rev_app: "مراجعة الطلبات",
        card_rev_app_desc: "معالجة طلبات الطلاب الجدد",
        card_man_courses: "إدارة المساقات",
        card_man_courses_desc: "فتح/إغلاق وتعديل الشعب",
        card_user_dir: "دليل المستخدمين",
        card_user_dir_desc: "تعديل الأدوار والمعدلات",

        modal_limit_title: "إجراء مطلوب: تجاوز الحد الأقصى للساعات",
        modal_limit_desc: "تمت الموافقة على طلبك، ولكن ليس لديك مساحة ساعات كافية.",
        lbl_time_remaining: "الوقت المتبقي للتسجيل:",
        btn_drop_courses: "الذهاب للجدول للحذف",
        btn_accept_enroll: "لدي مساحة، سجل الآن",
        btn_deny_req: "رفض الطلب",
    }
};

export function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    state.currentLang = lang;
    localStorage.setItem('app_lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) el.placeholder = translations[lang][key];
    });
}

export function getCategoryClass(category) {
    if (!category) return 'cat-support';
    const cat = category.toLowerCase();
    if (cat.includes('major compulsory')) return 'cat-major-comp';
    if (cat.includes('college compulsory')) return 'cat-college-comp';
    if (cat.includes('university compulsory')) return 'cat-uni-comp';
    if (cat.includes('university elective')) return 'cat-uni-elective';
    return 'cat-support';
}

export function getCreditLimits() {
    // Default fallback
    if (!state.currentUser) return { min: 12, max: 18, isGrad: false };

    let passedHours = 0;
    
    if (state.passedCoursesData) {
        passedHours = state.passedCoursesData.reduce((sum, item) => sum + (item.credit_hours || 0), 0);
    } 
    
    passedHours = state.totalPassedCredits || 0; 

    const totalRequired = 132;
    const remaining = totalRequired - passedHours;
    
    const isGrad = remaining <= 21;

    return {
        min: 12,
        max: isGrad ? 21 : 18,
        isGrad: isGrad
    };
}

export function updateCreditUI(currentCredits) {
    const { max } = getCreditLimits();
    const progressFill = document.querySelector('.progress-fill');
    const creditText = document.querySelector('.credit-status-box');

    if (progressFill) {
        const pct = Math.min((currentCredits / max) * 100, 100);
        progressFill.style.width = `${pct}%`;
        
        progressFill.classList.remove('red', 'yellow');
        if (currentCredits < 12) progressFill.classList.add('yellow');
        else if (currentCredits > max) progressFill.classList.add('red');
    }

    if (creditText) {
        creditText.textContent = `${currentCredits} / ${max} Cr`;
    }
}