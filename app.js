// Import Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import config from './config.js';

// --- CONFIGURATION ---
const supabaseUrl = config.SUPABASE_URL
const supabaseKey = config.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// --- DOM ELEMENTS ---
const authContainer = document.getElementById('auth-container')
const homeContainer = document.getElementById('home-container') // Renamed from welcomeContainer
const regContainer = document.getElementById('registration-container');
const sidebar = document.getElementById('sidebar') // Reference to sidebar
const menuBtn = document.querySelector('.menu-btn');

const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const loginBtn = document.getElementById('login-btn')
const signupBtn = document.getElementById('signup-btn')
const logoutBtn = document.getElementById('logout-btn')
const userEmailDisplay = document.getElementById('user-email')
const errorMsg = document.getElementById('error-msg')

// --- FUNCTIONS ---

menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

window.showSection = function(sectionName) {
    // 1. Hide all content sections first
    homeContainer.classList.add('hidden');
    regContainer.classList.add('hidden');
    
    // 2. Remove 'active' class from all sidebar items
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // 3. Show the selected section and highlight sidebar
    if (sectionName === 'home') {
        homeContainer.classList.remove('hidden');
        document.getElementById('nav-home').classList.add('active');
    } 
    else if (sectionName === 'registration') {
        regContainer.classList.remove('hidden');
        document.getElementById('nav-reg').classList.add('active');
    }
}

// Update the updateUI function to reset to Home on login
function updateUI(session) {
    if (session) {
        authContainer.classList.add('hidden');
        sidebar.classList.remove('hidden');
        
        // Default to showing home when logging in
        showSection('home');
        
        userEmailDisplay.textContent = session.user.email;
    } else {
        authContainer.classList.remove('hidden');
        sidebar.classList.add('hidden');
        
        // Hide both content sections if logged out
        homeContainer.classList.add('hidden');
        regContainer.classList.add('hidden');
    }
}

// Sign Up
async function signUp() {
    errorMsg.textContent = ''
    const email = emailInput.value
    const password = passwordInput.value
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) errorMsg.textContent = error.message
    else alert('Success! Check your email to confirm account.')
}

// Login
async function login() {
    errorMsg.textContent = ''
    const email = emailInput.value
    const password = passwordInput.value
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) errorMsg.textContent = error.message
}

// Logout
async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error logging out:', error)
}

// --- ACCORDION LOGIC ---
document.addEventListener('click', (e) => {
    // Check if clicked element is an accordion header or inside one
    const header = e.target.closest('.accordion-header');
    
    if (header) {
        const accordion = header.parentElement;
        const content = accordion.querySelector('.accordion-content');
        const chevron = accordion.querySelector('.chevron');
        
        // Toggle the expanded class
        if (accordion.classList.contains('expanded')) {
            // Collapse
            accordion.classList.remove('expanded');
            accordion.classList.add('collapsed');
            chevron.textContent = '›';
            if (content) content.style.display = 'none'; 
        } else {
            // Expand
            accordion.classList.add('expanded');
            accordion.classList.remove('collapsed');
            chevron.textContent = '∨';
            // This line was missing before:
            if (content) content.style.display = 'block'; 
        }
    }
});

// --- EVENT LISTENERS ---
loginBtn.addEventListener('click', login)
signupBtn.addEventListener('click', signUp)
logoutBtn.addEventListener('click', logout)

// Check session on load
supabase.auth.getSession().then(({ data: { session } }) => {
    updateUI(session)
})

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session)
})