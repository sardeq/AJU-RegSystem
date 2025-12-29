import { supabase } from './config.js';
import { state } from './state.js';

export async function loadDashboardData(userId) {
    try {
        // 1. Fetch User Profile
        const { data: profile } = await supabase
            .from('users').select('*').eq('id', userId).single();

        if (profile) {

            const hName = document.getElementById('header-student-name');
            const hId = document.getElementById('header-student-id');
            const hMajor = document.getElementById('header-student-major');
            const hDegree = document.getElementById('header-student-degree');
            const hImg = document.getElementById('header-avatar-img');

            if(hName) hName.textContent = profile.full_name || "Student";

            if(hId) hId.textContent = profile.id ? `ID: ${profile.id.substring(0, 8)}...` : "--";

            if(hMajor) hMajor.textContent = profile.major || "Major Not Set";
            if(hDegree) hDegree.textContent = profile.degree || "Degree Not Set";

            if(hImg && profile.full_name) {
                hImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=00E676&color=000&size=128`;
            }
            
            // FIX: Update Sidebar Name as well
            const sideName = document.getElementById('sidebar-user-name');
            if(sideName) sideName.textContent = profile.full_name || "Student";

            // Update Stats
            document.getElementById('stat-gpa').textContent = profile.gpa ? profile.gpa.toFixed(2) : "--";
            document.getElementById('stat-rank').textContent = profile.rank ? `#${profile.rank}` : "--";
        }

        // 2. Fetch Active Schedule
        const { data: schedule } = await supabase
            .from('enrollments')
            .select(`sections (schedule_text, room_number, section_number, courses (course_name_en, course_name_ar))`)
            .eq('user_id', userId)
            .eq('status', 'REGISTERED');

        const courseCount = schedule ? schedule.length : 0;
        document.getElementById('stat-registered-count').textContent = courseCount;
        
        // Render Bento Schedule
        renderBentoSchedule(schedule);

        // 3. Calc Completed Hours
        const { data: history } = await supabase
            .from('enrollments')
            .select('sections(courses(credit_hours))')
            .eq('user_id', userId)
            .eq('status', 'COMPLETED');
            
        let completed = 0;
        if(history) completed = history.reduce((sum, item) => sum + (item.sections?.courses?.credit_hours || 0), 0);
        document.getElementById('stat-hours-text').textContent = completed;

    } catch (err) {
        console.error("Dashboard Load Error:", err);
    }
}

function renderBentoSchedule(enrollments) {
    const list = document.getElementById('bento-schedule-list');
    if (!list) return;
    list.innerHTML = ''; 

    if (!enrollments || enrollments.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:30px; color:#666;">No registered courses.</div>`;
        return;
    }

    // FIX: Filter for "Today"
    const dayIndex = new Date().getDay(); // 0=Sun, 1=Mon, etc.
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayStr = daysMap[dayIndex];

    const todayCourses = enrollments.filter(item => {
        const scheduleText = item.sections?.schedule_text || "";
        // Check if today's day name (e.g. "Thu") is in the schedule string
        return scheduleText.toLowerCase().includes(currentDayStr.toLowerCase());
    });

    if (todayCourses.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:30px; color:#666;">
                <div style="font-size:2rem; margin-bottom:10px;">☕</div>
                No classes today (${currentDayStr})
            </div>`;
        return;
    }

    todayCourses.forEach(item => {
        const sec = item.sections;
        const name = state.currentLang === 'ar' ? sec.courses.course_name_ar : sec.courses.course_name_en;
        const timeMatch = (sec.schedule_text || "").match(/\d{1,2}:\d{2}/);
        const time = timeMatch ? timeMatch[0] : "TBA";

        const div = document.createElement('div');
        div.className = 'bento-class-card';
        div.innerHTML = `
            <span class="bcc-time-pill">${time}</span>
            <span class="bcc-title">${name}</span>
            <span class="bcc-prof">Sec ${sec.section_number} • ${sec.room_number || 'Room TBA'}</span>
        `;
        list.appendChild(div);
    });
}