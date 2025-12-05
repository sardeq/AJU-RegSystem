// Import Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import config from './config.js';

// --- CONFIGURATION ---
const supabaseUrl = config.SUPABASE_URL
const supabaseKey = config.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// REPLACE THIS WITH YOUR OPENROUTER KEY
const OPENROUTER_API_KEY = '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'; 

// --- DOM ELEMENTS ---
const authContainer = document.getElementById('auth-container')
const homeContainer = document.getElementById('home-container')
const regContainer = document.getElementById('registration-container');
const sidebar = document.getElementById('sidebar')
const menuBtn = document.querySelector('.menu-btn');

const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const loginBtn = document.getElementById('login-btn')
const signupBtn = document.getElementById('signup-btn')
const logoutBtn = document.getElementById('logout-btn')
const userEmailDisplay = document.getElementById('user-email')
const errorMsg = document.getElementById('error-msg')

// AI Elements
const aiBtn = document.querySelector('.enhance-ai-btn');
const aiModal = document.getElementById('ai-modal');
const closeModal = document.querySelector('.close-modal');
const aiLoading = document.getElementById('ai-loading');
const aiResults = document.getElementById('ai-results');

const aiPrefModal = document.getElementById('ai-pref-modal');
const closePrefBtn = document.getElementById('close-pref-btn');
const generateBtn = document.getElementById('generate-schedule-btn')

// --- STATE MANAGEMENT ---
let currentUser = null;

// --- AUTH FUNCTIONS ---
menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

window.showSection = function(sectionName) {
    homeContainer.classList.add('hidden');
    regContainer.classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    if (sectionName === 'home') {
        homeContainer.classList.remove('hidden');
        document.getElementById('nav-home').classList.add('active');
    } else if (sectionName === 'registration') {
        regContainer.classList.remove('hidden');
        document.getElementById('nav-reg').classList.add('active');
    }
}

function updateUI(session) {
    if (session) {
        currentUser = session.user;
        authContainer.classList.add('hidden');
        sidebar.classList.remove('hidden');
        showSection('home');
        if(userEmailDisplay) userEmailDisplay.textContent = session.user.email;
    } else {
        currentUser = null;
        authContainer.classList.remove('hidden');
        sidebar.classList.add('hidden');
        homeContainer.classList.add('hidden');
        regContainer.classList.add('hidden');
    }
}

async function login() {
    errorMsg.textContent = ''
    const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value
    })
    if (error) errorMsg.textContent = error.message
}

async function logout() {
    await supabase.auth.signOut()
}

// --- AI RECOMMENDATION LOGIC ---

// 1. Fetch Data for AI (With fixed relationships)
async function fetchStudentContext(userId) {
    console.log("Fetching context for user:", userId);

    // A. Get History
    const { data: history, error: historyError } = await supabase
        .from('enrollments')
        .select(`
            status, grade_value,
            sections (
                course_code,
                courses (course_name_en, credit_hours)
            )
        `)
        .eq('user_id', userId)
        .eq('status', 'COMPLETED');

    if (historyError) {
        console.error("Error fetching history:", historyError);
        throw new Error("Could not fetch student history.");
    }

    const passedCourses = history ? history.map(h => h.sections?.course_code).filter(Boolean) : [];

    // B. Get Active
    const { data: current, error: currentError } = await supabase
        .from('enrollments')
        .select(`
            sections (course_code)
        `)
        .eq('user_id', userId)
        .eq('status', 'ENROLLED');
    
    const inProgressCourses = current ? current.map(c => c.sections?.course_code).filter(Boolean) : [];
    const allKnowledge = [...passedCourses, ...inProgressCourses];

    // C. Get Future Options
    // Using the corrected query from our previous step
    const { data: availableSections, error: sectionsError } = await supabase
        .from('sections')
        .select(`
            section_id, course_code, schedule_text, instructor_name,
            courses (
                course_name_en, 
                credit_hours, 
                category,
                prerequisites!prerequisites_course_code_fkey (
                    prereq_code
                )
            )
        `)
        .eq('semester_id', 20252)
        .eq('status', 'OPEN');

    if (sectionsError) {
        console.error("Error fetching sections:", sectionsError);
        throw new Error("Database Error: " + sectionsError.message); 
    }

    if (!availableSections) {
        return { history: passedCourses, options: [] };
    }

    // D. Filter Logic
    const eligibleSections = availableSections.filter(section => {
        const coursePrereqs = section.courses?.prerequisites || [];
        if (coursePrereqs.length === 0) return true;
        const unmet = coursePrereqs.filter(p => !allKnowledge.includes(p.prereq_code));
        return unmet.length === 0;
    });

    return { history: passedCourses, options: eligibleSections };
}

// 2. Call OpenRouter (With Preferences)
async function getOpenRouterRecommendations(context, preferences) {
    const coursesList = context.options.map(o => ({
        id: o.section_id,
        code: o.course_code,
        name: o.courses.course_name_en,
        time: o.schedule_text,
        prof: o.instructor_name
    }));

    const TRACKS_CONTEXT = `
    CURRICULUM TRACKS:
    1. "Data & AI": Data Structures -> Algorithms -> Intelligent Systems.
    2. "Web": OOP -> Web Apps -> Adv Web.
    3. "Security": Networks -> Software Security -> Secure SE.
    `;

    // Inject User Preferences into the Prompt
    const USER_CONSTRAINTS = `
    USER CUSTOM PREFERENCES (STRICTLY FOLLOW THESE):
    - Intensity Level: ${preferences.intensity} (If 'Relaxed', avoid too many hard labs. If 'Intense', maximize credits).
    - Preferred Days: ${preferences.days.join(" OR ")} (Try to fit classes here).
    - Time Preference: ${preferences.time}
    - Specific Focus Goal: ${preferences.focus || "None"}
    `;

    const prompt = `
    SYSTEM INSTRUCTION: You are a JSON generator. You output only raw JSON arrays. Do not output markdown.
    
    INPUT DATA:
    - Student History: ${JSON.stringify(context.history)}
    - Available Courses: ${JSON.stringify(coursesList)}
    ${TRACKS_CONTEXT}
    ${USER_CONSTRAINTS}

    TASK:
    Generate 3 distinct schedule options based on the user's constraints.
    
    EXPECTED JSON OUTPUT:
    [
      {
        "title": "Strategy Name",
        "reasoning": "Explain why this fits the user's specific preferences (e.g., 'Matches your request for Mon/Wed classes...')",
        "courses": [
          {"code": "311314", "name": "Algorithms", "time": "Sun 10:00", "section_id": 101}
        ]
      }
    ]
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.href, 
                "X-Title": "Student Reg System"
            },
            body: JSON.stringify({
                "model": "google/gemma-3-4b-it:free",
                "messages": [{ "role": "user", "content": prompt }]
            })
        });

        const data = await response.json();
        
        if (!response.ok || data.error) throw new Error(data.error?.message || "AI Error");
        if (!data.choices) throw new Error("Empty AI Response");

        let rawText = data.choices[0].message.content;
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(rawText);

    } catch (error) {
        console.error("AI Error:", error);
        alert(`AI Failed: ${error.message}`);
        return [];
    }
}

aiBtn.addEventListener('click', () => {
    if (!currentUser) { alert("Please log in."); return; }
    aiPrefModal.classList.remove('hidden'); // Show Form
});

generateBtn.addEventListener('click', async () => {
    // A. Gather Form Data
    const intensity = document.querySelector('input[name="intensity"]:checked').value;
    const time = document.getElementById('time-pref').value;
    const focus = document.getElementById('focus-pref').value;
    
    // Get Checked Days
    const days = [];
    document.querySelectorAll('input[name="days"]:checked').forEach(cb => days.push(cb.value));

    if (days.length === 0) {
        alert("Please select at least one day preference.");
        return;
    }

    const preferences = { intensity, time, focus, days };

    // B. Switch Modals (Hide Form -> Show Loading)
    aiPrefModal.classList.add('hidden');
    aiModal.classList.remove('hidden');
    aiLoading.classList.remove('hidden');
    aiResults.innerHTML = ''; 

    try {
        const userId = currentUser.id;
        
        // C. Fetch Data
        const context = await fetchStudentContext(userId);
        
        if (context.options.length === 0) {
            throw new Error("No eligible courses found for next semester.");
        }

        // D. Call AI with Preferences
        const plans = await getOpenRouterRecommendations(context, preferences);

        // E. Render
        aiLoading.classList.add('hidden');
        renderPlans(plans);

    } catch (err) {
        console.error(err);
        aiLoading.innerHTML = `<p style="color:red; text-align:center;">${err.message}</p>`;
    }
});

// Close Handlers
closePrefBtn.addEventListener('click', () => aiPrefModal.classList.add('hidden'));

// Update window click to close BOTH modals
window.onclick = function(event) {
    if (event.target == aiModal) aiModal.classList.add('hidden');
    if (event.target == aiPrefModal) aiPrefModal.classList.add('hidden');
}

// 3. UI Handlers
function renderPlans(plans) {
    if (!plans || plans.length === 0) {
        aiResults.innerHTML = '<p>No valid plans generated.</p>';
        return;
    }

    plans.forEach(plan => {
        const card = document.createElement('div');
        card.className = 'schedule-card';
        
        let coursesHtml = plan.courses.map(c => 
            `<li>
                <span>${c.code} - ${c.name}</span>
                <small>${c.time}</small>
             </li>`
        ).join('');

        // We use encodeURIComponent to safely pass the object to the button
        const safeData = encodeURIComponent(JSON.stringify(plan.courses));

        card.innerHTML = `
            <span class="card-tag">${plan.title}</span>
            <p class="card-reasoning">${plan.reasoning}</p>
            <ul class="card-courses">${coursesHtml}</ul>
            <button class="accept-btn" data-courses="${safeData}">
                Accept Schedule
            </button>
        `;
        aiResults.appendChild(card);
    });

    // Add event listeners to the new buttons
    document.querySelectorAll('.accept-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const coursesData = JSON.parse(decodeURIComponent(e.target.dataset.courses));
            applySchedule(coursesData);
        });
    });
}

async function applySchedule(courses) {
    // 1. Dynamic User Check
    if (!currentUser || !currentUser.id) {
        alert("Session expired. Please log in again.");
        return;
    }

    if(!confirm(`Register for these ${courses.length} courses?`)) return;

    // 2. Use the real ID
    const userId = currentUser.id;
    
    const enrollments = courses.map(c => ({
        user_id: userId,
        section_id: c.section_id,
        status: 'REGISTERED',
        grade_value: null
    }));

    // 3. Upsert to handle duplicates safely
    const { error } = await supabase
        .from('enrollments')
        .upsert(enrollments, { 
            onConflict: 'user_id, section_id', 
            ignoreDuplicates: true 
        });

    if (error) {
        console.error("Registration Error:", error);
        alert('Error registering: ' + error.message);
    } else {
        alert('Successfully Registered!');
        aiModal.classList.add('hidden');
    }
};

// Modal Close Logic
closeModal.addEventListener('click', () => aiModal.classList.add('hidden'));
window.onclick = function(event) {
    if (event.target == aiModal) {
        aiModal.classList.add('hidden');
    }
}

// --- EVENT LISTENERS ---
loginBtn.addEventListener('click', login)
signupBtn.addEventListener('click', () => alert("Sign up disabled for demo"))
logoutBtn.addEventListener('click', logout)

supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session)
})