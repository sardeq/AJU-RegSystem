// ai.js
import { supabase } from './config.js';
import { state } from './state.js';
import { getCreditLimits } from './utils.js';

// --- MAIN SETUP FUNCTION ---
export function setupAIListeners() {
    const aiBtnReg = document.getElementById('ai-enhance-btn-reg');
    const aiBtnHome = document.querySelector('.enhance-ai-btn'); // Or specific ID if present
    const closePrefBtn = document.getElementById('close-pref-btn');
    const closeModal = document.querySelector('.close-modal');
    const aiModal = document.getElementById('ai-modal');
    const aiPrefModal = document.getElementById('ai-pref-modal');
    const generateBtn = document.getElementById('generate-schedule-btn');

    const closeResultsBtn = aiModal.querySelector('.close-modal');

    // 1. Open AI Preferences Modal
    function openAIModal() {
        if (!state.currentUser) { alert("Please log in."); return; }
        if (aiPrefModal) aiPrefModal.classList.remove('hidden');
    }

if (aiBtnReg) aiBtnReg.addEventListener('click', openAIModal);
    document.querySelectorAll('.enhance-ai-btn').forEach(btn => {
        if(btn.id !== 'generate-schedule-btn') btn.addEventListener('click', openAIModal);
    });

    // 2. Close Buttons
    if (closePrefBtn) {
        closePrefBtn.addEventListener('click', () => aiPrefModal.classList.add('hidden'));
    }
    
    if (closeResultsBtn) {
        closeResultsBtn.addEventListener('click', () => aiModal.classList.add('hidden'));
    }
    if (closeModal) closeModal.addEventListener('click', () => aiModal.classList.add('hidden'));

    // 3. Click Outside to Close
    window.addEventListener('click', (event) => {
        if (event.target == aiModal) aiModal.classList.add('hidden');
        if (event.target == aiPrefModal) aiPrefModal.classList.add('hidden');
    });

    // 4. Generate Button Logic
    if (generateBtn) {
        generateBtn.addEventListener('click', handleAIGeneration);
    }
}

async function handleAIGeneration() {
    const aiModal = document.getElementById('ai-modal');
    const aiPrefModal = document.getElementById('ai-pref-modal');
    const aiLoading = document.getElementById('ai-loading');
    const aiResults = document.getElementById('ai-results');

    const daysPref = Array.from(document.querySelectorAll('input[name="days"]:checked')).map(cb => cb.value);
    const targetCredits = parseInt(document.getElementById('credits-pref').value) || 15;

    if (daysPref.length === 0) { alert("Please select days."); return; }

    aiPrefModal.classList.add('hidden');
    aiModal.classList.remove('hidden');
    aiLoading.classList.remove('hidden');
    aiResults.innerHTML = ''; 

    try {
        const context = await fetchStudentContext(state.currentUser.id);
        
        // Advanced Filtering: Attach time ranges to the options
        let filteredOptions = context.options.map(sec => ({
            ...sec,
            timeRanges: parseScheduleToRanges(sec.schedule_text)
        })).filter(sec => {
            const sched = sec.schedule_text || "";
            return daysPref.some(d => sched.includes(d));
        });

        // Parse existing busy times into ranges once
        const baseBusyRanges = context.busyTimes.flatMap(t => parseScheduleToRanges(t));

        // Generate plans using the new overlap logic
        const plans = generateLocalPlans(filteredOptions, targetCredits, baseBusyRanges);            
        
        aiLoading.classList.add('hidden');
        renderPlans(plans);

    } catch (err) {
        aiLoading.classList.add('hidden');
        aiResults.innerHTML = `<p style="color:red; text-align:center;">${err.message}</p>`;
    }
}

function generateLocalPlans(options, target, baseBusyRanges = []) {
    const plans = [];
    const titles = ["Balanced Choice", "Quick Progress", "Major Focused"];
    
    for (let i = 0; i < 3; i++) {
        let currentCredits = 0;
        let selectedSections = [];
        let currentPlanRanges = [...baseBusyRanges]; 
        let usedCourseCodes = new Set();

        const shuffled = [...options].sort(() => 0.5 - Math.random());

        for (const sec of shuffled) {
            const courseHours = sec.courses?.credit_hours || 0;
            
            // USE ADVANCED OVERLAP CHECK
            const hasConflict = checkOverlap(sec.timeRanges, currentPlanRanges);

            if (currentCredits + courseHours <= target && 
                !usedCourseCodes.has(sec.course_code) && 
                !hasConflict) { 
                
                selectedSections.push({
                    section_id: sec.section_id,
                    code: sec.course_code,
                    name: sec.courses.course_name_en,
                    time: sec.schedule_text
                });

                currentPlanRanges.push(...sec.timeRanges);
                usedCourseCodes.add(sec.course_code);
                currentCredits += courseHours;
            }
        }

        if (selectedSections.length > 0) {
            plans.push({
                title: titles[i],
                reasoning: `Recommended based on your preferences (${currentCredits} credits).`,
                courses: selectedSections
            });
        }
    }
    return plans;
}

function parseScheduleToRanges(scheduleText) {
    if (!scheduleText || typeof scheduleText !== 'string' || scheduleText.includes("TBA")) return [];
    
    const dayMap = { "sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6 };
    const lower = scheduleText.toLowerCase();
    const timeMatch = lower.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    
    if (!timeMatch) return [];

    const [_, startStr, endStr] = timeMatch;
    const getMinutes = (time) => {
        const parts = time.split(":").map(Number);
        return parts[0] * 60 + parts[1];
    };

    const startMins = getMinutes(startStr);
    const endMins = getMinutes(endStr);
    const activeDays = [];

    for (const day in dayMap) {
        if (lower.includes(day)) activeDays.push(dayMap[day]);
    }

    return activeDays.map(dayIdx => ({
        start: dayIdx * 1440 + startMins,
        end: dayIdx * 1440 + endMins
    }));
}


function checkOverlap(rangesA, rangesB) {
    if(!rangesA || !rangesB || rangesA.length === 0 || rangesB.length === 0) return false;
    for (const a of rangesA) {
        for (const b of rangesB) {
            if (a.start < b.end && a.end > b.start) return true;
        }
    }
    return false;
}


export async function fetchStudentContext(userId) {
    // 1. Get the dynamic active semester first
    const { data: activeSem } = await supabase
        .from('semesters')
        .select('semester_id')
        .eq('is_active', true)
        .single();

    //const targetSemId = activeSem ? activeSem.semester_id : 20252;
    const targetSemId = activeSem ? parseInt(activeSem.semester_id) : 20252;
    console.log("AI Advisor searching semester:", targetSemId);

    // 2. Fetch completed courses
    const { data: history } = await supabase.from('enrollments')
        .select(`status, sections (course_code)`)
        .eq('user_id', userId)
        .eq('status', 'COMPLETED');
    const passedCourses = history ? history.map(h => h.sections?.course_code).filter(Boolean) : [];

    // 3. Fetch current registration (to avoid time conflicts)
    const { data: current } = await supabase.from('enrollments')
        .select(`sections (course_code, schedule_text)`)
        .eq('user_id', userId)
        .eq('status', 'REGISTERED');
    const registeredCourses = current ? current.map(c => c.sections?.course_code).filter(Boolean) : [];
    const busyTimes = current ? current.map(c => c.sections?.schedule_text).filter(Boolean) : [];

    const allTakenOrRegistered = [...passedCourses, ...registeredCourses];

    const { data: availableSections, error: sectionsError } = await supabase.from('sections')
        .select(`
            section_id, 
            course_code, 
            schedule_text, 
            instructor_name,
            courses (
                course_name_en, 
                credit_hours, 
                category, 
                prerequisites!prerequisites_course_code_fkey (
                    prereq_code
                )
            )
        `)
        .eq('semester_id', targetSemId)
        .eq('status', 'OPEN');

    if (sectionsError) {
        console.error("Supabase Query Error:", sectionsError);
        throw new Error(`Database error: ${sectionsError.message}`);
    }

    // 5. Filter Eligible Sections
    const eligibleSections = availableSections.filter(section => {
        // Skip if already taken or registered
        if (allTakenOrRegistered.includes(section.course_code)) return false;
        
        // Skip if there is a time conflict
        if (busyTimes.includes(section.schedule_text)) return false;

        // Check prerequisites
        const coursePrereqs = section.courses?.prerequisites || [];
        const unmet = coursePrereqs.filter(p => !passedCourses.includes(p.prereq_code));
        return unmet.length === 0;
    });

    return { 
        history: allTakenOrRegistered, 
        busyTimes: busyTimes, 
        options: eligibleSections 
    };
}

async function getOpenRouterRecommendations(context, preferences) {
    const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: { context, preferences }
    });

    if (error) {
        let customMessage = "AI Advisor Failed";
        
        if (error.context && typeof error.context.json === 'function') {
            try {
                const body = await error.context.json();
                if (body && body.error) customMessage = body.error;
            } catch (e) {
                console.error("Could not parse error body", e);
            }
        } else if (error.message) {
            customMessage = error.message;
        }

        console.error("Full AI Error Object:", error);
        throw new Error(customMessage);
    }
    
    return data;
}

function renderPlans(plans) {
    const aiResults = document.getElementById('ai-results');
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
            <button class="accept-btn" onclick="applySchedule('${safeData}')">Accept Schedule</button>
        `;
        aiResults.appendChild(card);
    });
}

// Expose applySchedule for the onclick string in renderPlans
window.applySchedule = async function(encodedCourses) {
    if (!state.currentUser) return;
    const courses = JSON.parse(decodeURIComponent(encodedCourses));

    if(!confirm(`Register for these ${courses.length} courses?`)) return;
    
    // Simple loop to register (or batch if API supports it)
    try {
        const enrollments = courses.map(c => ({
            user_id: state.currentUser.id,
            section_id: c.section_id,
            status: 'REGISTERED'
        }));

        const { error } = await supabase.from('enrollments').upsert(enrollments, { onConflict: 'user_id, section_id' });
        if(error) throw error;
        
        alert("Successfully Registered!");
        document.getElementById('ai-modal').classList.add('hidden');
        // Refresh Registration Data
        import('./registration.js').then(mod => mod.loadRegistrationData(state.currentUser.id));
        
    } catch(err) {
        alert("Error registering: " + err.message);
    }
};