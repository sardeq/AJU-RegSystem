// Import Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm'
import config from './config.js';

// --- CONFIGURATION ---
const supabaseUrl = config.SUPABASE_URL
const supabaseKey = config.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)


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
const fullNameInput = document.getElementById('full-name'); // New
const confirmPassInput = document.getElementById('confirm-password'); // New
const authActionBtn = document.getElementById('auth-action-btn'); // Renamed button
const toggleAuthLink = document.getElementById('toggle-auth-mode'); // New Toggle

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
let isLoginMode = true;

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

toggleAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    errorMsg.textContent = ''; // Clear errors

    const extraFields = document.querySelectorAll('.auth-extra');
    
    if (isLoginMode) {
        // Switch to Login UI
        formTitle.textContent = 'Login';
        authActionBtn.textContent = 'Log In';
        document.getElementById('toggle-text').textContent = "Don't have an account? ";
        toggleAuthLink.textContent = 'Sign Up';
        extraFields.forEach(el => el.classList.add('hidden'));
    } else {
        // Switch to Signup UI
        formTitle.textContent = 'Create Account';
        authActionBtn.textContent = 'Sign Up';
        document.getElementById('toggle-text').textContent = "Already have an account? ";
        toggleAuthLink.textContent = 'Log In';
        extraFields.forEach(el => el.classList.remove('hidden'));
    }
});

function updateUI(session) {
    if (session) {
        currentUser = session.user;
        authContainer.classList.add('hidden');
        sidebar.classList.remove('hidden');
        showSection('home');
        
        // Update user name in Sidebar if metadata exists
        const userNameDisplay = document.querySelector('.user-name');
        if(userNameDisplay && session.user.user_metadata.full_name) {
            userNameDisplay.textContent = session.user.user_metadata.full_name;
        }

        if(userEmailDisplay) userEmailDisplay.textContent = session.user.email;
    } else {
        currentUser = null;
        authContainer.classList.remove('hidden');
        sidebar.classList.add('hidden');
        homeContainer.classList.add('hidden');
        regContainer.classList.add('hidden');
        
        // Reset inputs on logout
        emailInput.value = '';
        passwordInput.value = '';
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

authActionBtn.addEventListener('click', handleAuth); // Changed from loginBtn
logoutBtn.addEventListener('click', logout);

supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session);
});

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
            // --- LOGIN LOGIC ---
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
        
        } else {
            // --- SIGNUP LOGIC ---
            const fullName = fullNameInput.value;
            const confirmPass = confirmPassInput.value;

            // Validation
            if (!fullName) throw new Error("Full Name is required.");
            if (password !== confirmPass) throw new Error("Passwords do not match.");
            if (password.length < 6) throw new Error("Password must be at least 6 characters.");

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // This saves full_name to raw_user_meta_data
                    data: {
                        full_name: fullName 
                    }
                }
            });

            if (error) throw error;

            alert("Registration successful! You are now logged in.");
        }
    } catch (error) {
        errorMsg.textContent = error.message;
    } finally {
        // Reset button text
        authActionBtn.disabled = false;
        authActionBtn.textContent = isLoginMode ? 'Log In' : 'Sign Up';
    }
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


// 2. Call Supabase Edge Function (Secure)
async function getOpenRouterRecommendations(context, preferences) {
    try {
        console.log("Asking AI for help...");

        // Invoke the function we created in Step 3
        const { data, error } = await supabase.functions.invoke('generate-schedule', {
            body: { context, preferences }
        });

        if (error) throw new Error(error.message);
        
        // The function now returns the parsed JSON directly
        return data; 

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