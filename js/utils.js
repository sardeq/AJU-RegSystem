import { state } from './state.js';

export const translations = {
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
        btn_req_override: "Request Prerequisite Override",

        lbl_my_waitlist: "My Waitlist",
        msg_no_waitlist: "No active waitlists.",
        
        // Confirmation Modal
        wl_modal_title: "Join Waiting List?",
        wl_modal_desc: "This section is full. You will be placed in a queue and notified if a seat becomes available.",
        btn_cancel: "Cancel",
        btn_confirm_join: "Confirm & Join",
        btn_joining: "Joining...", // Button state while loading

        // Success Modal
        wl_success_title: "Successfully Joined!",
        wl_success_desc: "You have been added to the waiting list for this section.",
        lbl_current_pos: "Current Position",
        btn_done: "Done",
        nav_admin_home: "Dashboard", // New Key
        nav_admin_admissions: "Admissions",

        // Sidebar Badge
        lbl_in_line: "in Line"
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
        btn_req_override: "طلب تجاوز المتطلب السابق",

        lbl_my_waitlist: "قائمة الانتظار",
        msg_no_waitlist: "لا يوجد قوائم انتظار نشطة.",

        // Confirmation Modal
        wl_modal_title: "الانضمام لقائمة الانتظار؟",
        wl_modal_desc: "هذه الشعبة ممتلئة. سيتم وضعك في طابور الانتظار وسيتم إشعارك فور توفر مقعد.",
        btn_cancel: "إلغاء",
        btn_confirm_join: "تأكيد وانضمام",
        btn_joining: "جاري الانضمام...",

        // Success Modal
        wl_success_title: "تم الانضمام بنجاح!",
        wl_success_desc: "تمت إضافتك إلى قائمة الانتظار لهذه الشعبة.",
        lbl_current_pos: "الترتيب الحالي",
        btn_done: "تم",

        // Sidebar Badge
        lbl_in_line: "في الانتظار",

        nav_admin_home: "لوحة التحكم", // New Key
        nav_admin_admissions: "القبول والتسجيل",

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
    // FIX: Use state.currentUser instead of global currentUser
    if (!state.currentUser) return { min: 12, max: 18, isGrad: false };

    // You can also store profile in state if needed
    const currentSemester = window.userProfile?.current_semester || 1; 
    
    const isGrad = currentSemester >= 7;
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