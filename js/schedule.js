import { supabase } from './config.js';
import { state } from './state.js';
import { updateCreditUI, translations } from './utils.js';

window.dropCourse = async function(enrollmentId) {
    if(!confirm("Drop this course?")) return;
    await supabase.from('enrollments').delete().eq('enrollment_id', enrollmentId);
    loadFullSchedule(state.currentUser.id);
};

export async function loadFullSchedule(userId) {
    const grid = document.getElementById('schedule-modern-grid');
    if(grid) grid.innerHTML = '<div class="spinner"></div>';
    
    // Remove old table references
    // const tbody = document.getElementById('full-schedule-body'); 
    // const cardGrid = document.getElementById('schedule-card-grid');

    try {
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
                        credit_hours,
                        category
                    )
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'REGISTERED'); 

        if (error) throw error;

        // Calculate Total
        const totalCredits = schedule.reduce((sum, item) => sum + (item.sections?.courses?.credit_hours || 0), 0);
        updateCreditUI(totalCredits);

        renderScheduleTable(schedule); // Uses new renderer

    } catch (err) {
        console.error("Schedule Error:", err);
        if(grid) grid.innerHTML = `<p style="text-align:center; color:red;">Failed to load schedule.</p>`;
    }
}


function renderScheduleTable(scheduleData) {
    const grid = document.getElementById('schedule-modern-grid');
    if(!grid) return;
    grid.innerHTML = '';

    if (!scheduleData || scheduleData.length === 0) {
        const msg = translations[utils.currentLang]?.msg_no_schedule || "No active courses.";
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666; border: 1px dashed #333; border-radius: 20px;">
                <div style="font-size: 2rem; margin-bottom: 10px;">📅</div>
                <p>${msg}</p>
                <button class="enhance-ai-btn" style="width: auto; margin: 20px auto;" onclick="showSection('registration')">
                    Register Now
                </button>
            </div>`;
        return;
    }

    scheduleData.forEach(item => {
        const sec = item.sections;
        const course = sec.courses;
        const courseName = state.currentLang === 'ar' ? course.course_name_ar : course.course_name_en;

        const card = document.createElement('div');
        card.className = 'sch-card-modern';
        
        const timeMatch = (sec.schedule_text || "").match(/\d{1,2}:\d{2}/);
        const startTime = timeMatch ? timeMatch[0] : "TBA";
        
        let daysDisplay = "Online";
        if((sec.schedule_text || "").toLowerCase().includes("mon")) daysDisplay = "MW";
        if((sec.schedule_text || "").toLowerCase().includes("sun")) daysDisplay = "STT";

        card.innerHTML = `
            <div class="sch-time-box">
                <span class="stb-start">${startTime}</span>
                <span class="stb-days">${daysDisplay}</span>
            </div>
            
            <div class="sch-main-info">
                <div class="sch-tags">
                    <span class="sch-tag code">${course.course_code}</span>
                    <span class="sch-tag credits">${course.credit_hours} Cr</span>
                </div>
                <h3 class="sch-title">${courseName}</h3>
                <div class="sch-meta-grid">
                     <div class="sch-meta-item">
                        ${sec.schedule_text || 'TBA'}
                     </div>
                     <div class="sch-meta-item">
                        ${sec.room_number || 'Room TBA'}
                     </div>
                     <div class="sch-meta-item">
                        ${sec.instructor_name || 'Staff'}
                     </div>
                </div>
            </div>

            <div class="sch-actions">
                <button class="sch-drop-btn" onclick="dropCourse(${item.enrollment_id})" title="Drop Course">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

export async function loadHistoryTimeline(userId) {
    const container = document.getElementById('history-timeline-container');
    if (!container) return;
    
    container.innerHTML = '<div class="spinner"></div>';

    try {
        // 1. Fetch History AND Active Courses
        // We include 'REGISTERED' and 'ENROLLED' to show the current semester
        const { data, error } = await supabase
            .from('enrollments')
            .select(`
                status, 
                grade_value,
                sections (
                    semester_id,
                    semesters (name),
                    courses (
                        course_code, 
                        course_name_en, 
                        course_name_ar, 
                        credit_hours
                    )
                )
            `)
            .eq('user_id', userId)
            .in('status', ['COMPLETED', 'FAILED', 'REGISTERED', 'ENROLLED']) 
            .order('sections(semester_id)', { ascending: true }); // Oldest first

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:30px; color:#666;">No academic history found.</p>';
            return;
        }

        renderTimeline(data, container);

    } catch (err) {
        console.error("History Timeline Error:", err);
        container.innerHTML = '<p style="text-align:center; color:red;">Failed to load history.</p>';
    }
}

function renderTimeline(data) {
    const container = document.getElementById('history-timeline-container');
    if(!container) return;
    container.innerHTML = '';

    if(!data || data.length === 0) {
        container.innerHTML = '<p style="color:#666; padding:20px;">No academic history found.</p>';
        return;
    }

    // Group by Year/Semester
    const grouped = {}; 
    data.forEach(item => {
        const sem = item.sections?.semesters?.name || "Unknown";
        const year = sem.split(' ').pop(); 
        if(!grouped[year]) grouped[year] = {};
        if(!grouped[year][sem]) grouped[year][sem] = [];
        grouped[year][sem].push(item);
    });

    // Render Groups
    Object.keys(grouped).sort((a,b) => b-a).forEach(year => {
        const yearBlock = document.createElement('div');
        yearBlock.className = 'timeline-year-block';
        
        let semestersHTML = '';
        Object.keys(grouped[year]).forEach(sem => {
            let cardsHTML = '';
            grouped[year][sem].forEach(course => {
                const c = course.sections.courses;
                const statusClass = course.status === 'COMPLETED' ? 'pass' : (course.status === 'FAILED' ? 'fail' : 'active');
                cardsHTML += `
                    <div class="h-card ${statusClass}">
                        <div class="hc-top">
                            <span class="hc-code">${c.course_code}</span> 
                            <span class="hc-grade">${course.grade_value || course.status}</span>
                        </div>
                        <div class="hc-name">${c.course_name_en}</div>
                    </div>`;
            });

            semestersHTML += `
                <div class="timeline-semester-block">
                    <div class="t-sem-title">${sem}</div>
                    <div class="history-grid">${cardsHTML}</div>
                </div>`;
        });

        yearBlock.innerHTML = `
            <div class="timeline-year-header">
                <div class="t-year-dot"></div>
                <div class="t-year-title">${year}</div>
            </div>
            ${semestersHTML}
        `;
        container.appendChild(yearBlock);
    });
}