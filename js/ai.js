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

    // 1. Open AI Preferences Modal
    function openAIModal() {
        if (!state.currentUser) { alert("Please log in."); return; }
        if (aiPrefModal) aiPrefModal.classList.remove('hidden');
    }

    if (aiBtnReg) aiBtnReg.addEventListener('click', openAIModal);
    // Note: If you have multiple buttons with class 'enhance-ai-btn', loop them
    document.querySelectorAll('.enhance-ai-btn').forEach(btn => {
        if(btn.id !== 'generate-schedule-btn') btn.addEventListener('click', openAIModal);
    });

    // 2. Close Buttons
    if (closePrefBtn) closePrefBtn.addEventListener('click', () => aiPrefModal.classList.add('hidden'));
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

// --- AI GENERATION LOGIC ---
async function handleAIGeneration() {
    const aiModal = document.getElementById('ai-modal');
    const aiPrefModal = document.getElementById('ai-pref-modal');
    const aiLoading = document.getElementById('ai-loading');
    const aiResults = document.getElementById('ai-results');

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
        if (!state.currentUser) throw new Error("Please log in first.");
        const userId = state.currentUser.id;
        
        // 3. Fetch Context (History + Current Schedule)
        const context = await fetchStudentContext(userId);
        
        if (context.options.length === 0) throw new Error("No eligible courses found to recommend.");

        // 4. Calculate Limits
        const currentLoad = state.currentTotalCredits || 0;
        const { min: uniMin, max: uniMax } = getCreditLimits();
        const desiredTotal = parseInt(document.getElementById('credits-pref').value) || 15;

        if (currentLoad >= uniMax) {
            throw new Error(`You already have ${currentLoad} credit hours (Max: ${uniMax}). You cannot add more.`);
        }

        const maxAddable = uniMax - currentLoad; 
        let targetToAdd = desiredTotal - currentLoad;
        if (targetToAdd <= 0) targetToAdd = 3; 
        if (targetToAdd > maxAddable) targetToAdd = maxAddable;

        let minToAdd = Math.max(0, uniMin - currentLoad);
        if (minToAdd === 0) minToAdd = 3;
        if (minToAdd > maxAddable) minToAdd = maxAddable;

        const preferences = { 
            intensity, time, focus, days, 
            targetCredits: targetToAdd, 
            minCredits: minToAdd, 
            maxCredits: maxAddable 
        };

        // 5. Call API (Simulated or Real)
        // Ensure getOpenRouterRecommendations is available (imported or defined)
        // If it's defined in another file, import it. If it was inline, define it here or imported.
        // Assuming it exists as a helper or Supabase Function:
        const plans = await getOpenRouterRecommendations(context, preferences);
        
        aiLoading.classList.add('hidden');
        renderPlans(plans);

    } catch (err) {
        console.error(err);
        aiLoading.innerHTML = `<div style="padding:20px; text-align:center;">
            <p style="color:#d32f2f; font-weight:bold;">Unable to generate schedule.</p>
            <p style="color:#666;">${err.message}</p>
            <button onclick="document.getElementById('ai-modal').classList.add('hidden')" style="margin-top:10px; padding:5px 10px;">Close</button>
        </div>`;
    }
}

export async function fetchStudentContext(userId) {
    // 1. Fetch COMPLETED courses
    const { data: history } = await supabase.from('enrollments')
        .select(`status, sections (course_code)`).eq('user_id', userId).eq('status', 'COMPLETED');
    const passedCourses = history ? history.map(h => h.sections?.course_code).filter(Boolean) : [];

    // 2. Fetch REGISTERED courses
    const { data: current } = await supabase.from('enrollments')
        .select(`sections (course_code, schedule_text)`).eq('user_id', userId).eq('status', 'REGISTERED');
    const registeredCourses = current ? current.map(c => c.sections?.course_code).filter(Boolean) : [];
    const busyTimes = current ? current.map(c => (c.sections?.schedule_text || "").toLowerCase().trim()).filter(Boolean) : [];

    const allTakenOrRegistered = [...passedCourses, ...registeredCourses];

    // 3. Fetch Available Sections
    const { data: availableSections } = await supabase.from('sections')
        .select(`section_id, course_code, schedule_text, instructor_name,
            courses (course_name_en, credit_hours, category, prerequisites!prerequisites_course_code_fkey (prereq_code))`)
        .eq('semester_id', 20252).eq('status', 'OPEN');

    if (!availableSections) return { history: allTakenOrRegistered, busyTimes: busyTimes, options: [] };

    // 4. Filter Eligible Sections
    const eligibleSections = availableSections.filter(section => {
        if (allTakenOrRegistered.includes(section.course_code)) return false;
        const sectionTime = (section.schedule_text || "").toLowerCase().trim();
        if (busyTimes.includes(sectionTime)) return false;

        const coursePrereqs = section.courses?.prerequisites || [];
        if (coursePrereqs.length === 0) return true;
        const unmet = coursePrereqs.filter(p => !passedCourses.includes(p.prereq_code));
        return unmet.length === 0;
    });

    return { history: allTakenOrRegistered, busyTimes: busyTimes, options: eligibleSections };
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