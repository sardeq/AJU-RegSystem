import { supabase } from './config.js';
import { state } from './state.js';
import { getCreditLimits } from './utils.js';

// --- MAIN SETUP FUNCTION ---
export function setupAIListeners() {
    const aiBtnReg = document.getElementById('ai-enhance-btn-reg');
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
    
    // 1. Get User Input
    let userTargetTotal = parseInt(document.getElementById('credits-pref').value) || 15;

    if (daysPref.length === 0) { alert("Please select days."); return; }

    aiPrefModal.classList.add('hidden');
    aiModal.classList.remove('hidden');
    aiLoading.classList.remove('hidden');
    aiResults.innerHTML = ''; 

    try {
        const context = await fetchStudentContext(state.currentUser.id);
        
        // --- NEW LIMIT LOGIC ---
        const TOTAL_REQ_HOURS = 132;
        const passedHours = context.totalPassedCredits || 0;
        const currentRegistered = context.totalRegisteredCredits || 0;
        
        const remainingHours = TOTAL_REQ_HOURS - passedHours;
        const isGraduate = remainingHours <= 21;
        
        // Determine Hard Limit
        const hardLimit = isGraduate ? 21 : 18;

        // Clamp user target to the hard limit
        if (userTargetTotal > hardLimit) {
            userTargetTotal = hardLimit;
            // Optional: Notify user
            console.warn(`Target adjusted to ${hardLimit} based on academic status.`);
        }

        // Calculate how many NEW credits we can add
        // If user wants 15 total, and has 6 registered, we generate 9.
        const creditsNeeded = userTargetTotal - currentRegistered;

        if (creditsNeeded <= 0) {
            throw new Error(`You have ${currentRegistered} credits registered. Your limit is ${hardLimit}. Cannot add more courses.`);
        }
        
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

        // Generate plans using the calculated creditsNeeded
        // We pass 'creditsNeeded' as the target for the generator
        const plans = generateLocalPlans(filteredOptions, creditsNeeded, baseBusyRanges);            
        
        aiLoading.classList.add('hidden');
        
        // Pass info to render so user sees why they got these courses
        renderPlans(plans, userTargetTotal, currentRegistered);

    } catch (err) {
        aiLoading.classList.add('hidden');
        aiResults.innerHTML = `<div style="text-align:center; padding:20px;">
            <p style="color:#e53935; font-weight:bold; margin-bottom:10px;">⚠️ Limit Reached</p>
            <p>${err.message}</p>
        </div>`;
    }
}

function generateLocalPlans(options, targetToAdd, baseBusyRanges = []) {
    const plans = [];
    const titles = ["Balanced Choice", "Quick Progress", "Major Focused"];
    
    // We try to fill 'targetToAdd' credits
    
    for (let i = 0; i < 3; i++) {
        let addedCredits = 0;
        let selectedSections = [];
        let currentPlanRanges = [...baseBusyRanges]; 
        let usedCourseCodes = new Set();

        const shuffled = [...options].sort(() => 0.5 - Math.random());

        for (const sec of shuffled) {
            const courseHours = sec.courses?.credit_hours || 0;
            
            // Check if adding this course exceeds the target amount to add
            if (addedCredits + courseHours > targetToAdd) continue;

            // Check if course code is already used in this plan
            if (usedCourseCodes.has(sec.course_code)) continue;

            // USE ADVANCED OVERLAP CHECK
            const hasConflict = checkOverlap(sec.timeRanges, currentPlanRanges);

            if (!hasConflict) { 
                selectedSections.push({
                    section_id: sec.section_id,
                    code: sec.course_code,
                    name: sec.courses.course_name_en,
                    time: sec.schedule_text,
                    credits: courseHours
                });

                currentPlanRanges.push(...sec.timeRanges);
                usedCourseCodes.add(sec.course_code);
                addedCredits += courseHours;
            }
        }

        if (selectedSections.length > 0) {
            plans.push({
                title: titles[i],
                reasoning: `Added ${addedCredits} credits to your schedule.`,
                courses: selectedSections,
                totalAdded: addedCredits
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

    const targetSemId = activeSem ? parseInt(activeSem.semester_id) : 20252;
    console.log("AI Advisor searching semester:", targetSemId);

    // 2. Fetch completed courses WITH CREDITS
    const { data: history } = await supabase.from('enrollments')
        .select(`
            status, 
            sections (
                course_code,
                courses (credit_hours)
            )
        `)
        .eq('user_id', userId)
        .eq('status', 'COMPLETED');
    
    const passedCourses = history ? history.map(h => h.sections?.course_code).filter(Boolean) : [];
    
    // Sum Passed Credits
    const totalPassedCredits = history ? history.reduce((sum, h) => {
        return sum + (h.sections?.courses?.credit_hours || 0);
    }, 0) : 0;

    // 3. Fetch current registration (to avoid time conflicts and count load)
    const { data: current } = await supabase.from('enrollments')
        .select(`
            sections (
                course_code, 
                schedule_text,
                courses (credit_hours)
            )
        `)
        .eq('user_id', userId)
        .eq('status', 'REGISTERED');
        
    const registeredCourses = current ? current.map(c => c.sections?.course_code).filter(Boolean) : [];
    const busyTimes = current ? current.map(c => c.sections?.schedule_text).filter(Boolean) : [];
    
    // Sum Registered Credits
    const totalRegisteredCredits = current ? current.reduce((sum, c) => {
        return sum + (c.sections?.courses?.credit_hours || 0);
    }, 0) : 0;

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
        
        // Skip if there is a time conflict with CURRENT schedule
        if (busyTimes.includes(section.schedule_text)) return false;

        // Check prerequisites
        const coursePrereqs = section.courses?.prerequisites || [];
        const unmet = coursePrereqs.filter(p => !passedCourses.includes(p.prereq_code));
        return unmet.length === 0;
    });

    return { 
        history: allTakenOrRegistered, 
        totalPassedCredits, // Return passed credits
        totalRegisteredCredits, // Return currently registered credits
        busyTimes: busyTimes, 
        options: eligibleSections 
    };
}

function renderPlans(plans, targetTotal, currentRegistered) {
    const aiResults = document.getElementById('ai-results');
    if (!plans || plans.length === 0) {
        aiResults.innerHTML = '<p>No valid plans generated. You might be out of available options for these times.</p>';
        return;
    }

    plans.forEach(plan => {
        const card = document.createElement('div');
        card.className = 'schedule-card';
        
        let coursesHtml = plan.courses.map(c => 
            `<li><span>${c.code} - ${c.name}</span><small>${c.time} (${c.credits} Cr)</small></li>`
        ).join('');

        const safeData = encodeURIComponent(JSON.stringify(plan.courses));
        const newTotal = currentRegistered + plan.totalAdded;

        card.innerHTML = `
            <span class="card-tag">${plan.title}</span>
            <p class="card-reasoning">${plan.reasoning} <br> <span style="font-size:0.85em; color:#666;">Total Load: ${newTotal} / ${targetTotal} Cr</span></p>
            <ul class="card-courses">${coursesHtml}</ul>
            <button class="accept-btn" onclick="applySchedule('${safeData}')">Register These Courses</button>
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