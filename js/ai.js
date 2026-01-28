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
    const intensity = document.querySelector('input[name="intensity"]:checked')?.value || "Balanced";
    const timePref = document.getElementById('time-pref')?.value || "Any";
    
    let userTargetTotal = parseInt(document.getElementById('credits-pref').value) || 15;

    if (daysPref.length === 0) { alert("Please select preferred days."); return; }

    aiPrefModal.classList.add('hidden');
    aiModal.classList.remove('hidden');
    aiLoading.classList.remove('hidden');
    aiResults.innerHTML = ''; 

    try {
        const context = await fetchStudentContext(state.currentUser.id);
        
        const TOTAL_PLAN_HOURS = 132;
        const passedHours = context.totalPassedCredits || 0;
        const currentRegistered = context.totalRegisteredCredits || 0;
        
        const remainingToGraduate = TOTAL_PLAN_HOURS - passedHours;
        const isGraduate = remainingToGraduate <= 21;
        
        const hardLimit = isGraduate ? 21 : 18;

        if (userTargetTotal > hardLimit) {
            console.warn(`User target ${userTargetTotal} exceeds limit ${hardLimit}. Capping.`);
            userTargetTotal = hardLimit;
        }

        const creditsNeeded = userTargetTotal - currentRegistered;

        if (creditsNeeded <= 0) {
            if (currentRegistered >= hardLimit) {
                throw new Error(`You have reached your maximum limit of ${hardLimit} credit hours.`);
            } else {
                throw new Error(`You already have ${currentRegistered} credits. Please increase your target to add more.`);
            }
        }
        
        console.log(`🤖 AI Request: Registered=${currentRegistered}, Target=${userTargetTotal}, ToAdd=${creditsNeeded}, Limit=${hardLimit}`);
        
        const { data: plans, error } = await supabase.functions.invoke('generate-schedule', {
            body: { 
                context: context, 
                preferences: {
                    days: daysPref,
                    targetCredits: userTargetTotal, 
                    creditsToAdd: creditsNeeded,    
                    intensity: intensity,
                    timePref: timePref
                }
            }
        });

        if (error) throw error;

        // --- 4. STRICT CLIENT-SIDE FILTERING ---
        // Iterate through AI plans and remove courses that exceed the hardLimit
        const safePlans = (plans || []).map(plan => {
            let runningTotal = currentRegistered;
            const validCourses = [];

            for (const course of plan.courses) {
                const nextTotal = runningTotal + (course.credits || 0);
                
                // Only keep course if it fits within the limit
                if (nextTotal <= hardLimit) {
                    validCourses.push(course);
                    runningTotal = nextTotal;
                } else {
                    console.warn(`Dropped course ${course.code} from AI plan to enforce limit of ${hardLimit}.`);
                }
            }

            return {
                ...plan,
                courses: validCourses,
                totalAdded: runningTotal - currentRegistered,
                reasoning: plan.reasoning // We preserve original text for now, or could append a note
            };
        }).filter(p => p.courses.length > 0); // Remove empty plans

        if (safePlans.length === 0) {
            throw new Error(`Could not generate a plan that fits within your ${hardLimit} credit limit.`);
        }

        aiLoading.classList.add('hidden');
        renderPlans(safePlans, userTargetTotal, currentRegistered);

    } catch (err) {
        console.error("AI Error:", err);
        aiLoading.classList.add('hidden');
        
        aiResults.innerHTML = `<div style="text-align:center; padding:20px;">
            <p style="color:#e53935; font-weight:bold; margin-bottom:10px;">⚠️ Unable to Generate</p>
            <p>${err.message || "Connection to AI advisor failed."}</p>
            <button class="enhance-ai-btn" onclick="document.getElementById('ai-modal').classList.add('hidden')">Close</button>
        </div>`;
    }
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