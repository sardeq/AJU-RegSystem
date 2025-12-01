// Import Supabase from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

import config from './config.js';

// --- CONFIGURATION ---
const supabaseUrl = config.SUPABASE_URL
const supabaseKey = config.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// --- DOM ELEMENTS ---
const authContainer = document.getElementById('auth-container')
const welcomeContainer = document.getElementById('welcome-container')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const loginBtn = document.getElementById('login-btn')
const signupBtn = document.getElementById('signup-btn')
const logoutBtn = document.getElementById('logout-btn')
const userEmailDisplay = document.getElementById('user-email')
const errorMsg = document.getElementById('error-msg')

// --- FUNCTIONS ---

// Update UI based on session
function updateUI(session) {
    if (session) {
        authContainer.classList.add('hidden')
        welcomeContainer.classList.remove('hidden')
        userEmailDisplay.textContent = session.user.email
    } else {
        authContainer.classList.remove('hidden')
        welcomeContainer.classList.add('hidden')
        userEmailDisplay.textContent = ''
    }
}

// Sign Up
async function signUp() {
    errorMsg.textContent = ''
    const email = emailInput.value
    const password = passwordInput.value

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    })

    if (error) {
        errorMsg.textContent = error.message
    } else {
        alert('Success! Check your email to confirm account.')
    }
}

// Login
async function login() {
    errorMsg.textContent = ''
    const email = emailInput.value
    const password = passwordInput.value

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    })

    if (error) {
        errorMsg.textContent = error.message
    }
    // No need to alert success, onAuthStateChange will handle the UI switch
}

// Logout
async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error logging out:', error)
}

// --- EVENT LISTENERS ---

loginBtn.addEventListener('click', login)
signupBtn.addEventListener('click', signUp)
logoutBtn.addEventListener('click', logout)

// Check session on page load
supabase.auth.getSession().then(({ data: { session } }) => {
    updateUI(session)
})

// Listen for auth changes (login/logout triggers this automatically)
supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session)
})