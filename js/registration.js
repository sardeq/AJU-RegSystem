// registration.js
import { supabase } from './config.js';
import { state } from './state.js';
import { getCreditLimits, updateCreditUI } from './utils.js';
import { updateExcType } from './exceptions.js';

let currentPillFilter = 'all';

// --- Global Exports for HTML Buttons ---
window.renderRegistrationList = (sections) => renderRegistrationList(sections || state.availableSectionsData);
window.filterGrid = filterGrid;
window.toggleFilters = toggleFilters;
window.handleRegister = handleRegister;
window.handleWaitlist = handleWaitlist;
window.dropWaitlist = dropWaitlist;
window.confirmWaitlistJoin = confirmWaitlistJoin; // Missing export added
window.closeWaitlistModal = closeWaitlistModal;   // Missing export added
window.closeWaitlistSuccessModal = closeWaitlistSuccessModal; // Missing export added
window.handleExceptionRequest = handleExceptionRequest; 

// Allow HTML to access availableSectionsData length for "onclick" checks if needed
Object.defineProperty(window, 'availableSectionsData', {
    get: () => state.availableSectionsData
});

function filterGrid(filterType) {
    currentPillFilter = filterType;
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(filterType)) {
            btn.classList.add('active');
        }
    });
    renderRegistrationList(state.availableSectionsData);
};

// --- MAIN REGISTRATION ACTION ---
async function handleRegister(sectionId) {
    if (!state.currentUser) {
        alert("Please log in to register.");
        return;
    }

    // 1. Find the section
    const section = state.availableSectionsData.find(s => s.section_id === sectionId);
    if (!section) return;

    const code = section.courses.course_code.toString();
    const courseName = state.currentLang === 'ar' ? section.courses.course_name_ar : section.courses.course_name_en;

    // 2. Check: Already Passed?
    if (state.passedCourses && state.passedCourses.includes(code)) {
        alert("⛔ Error: You have already successfully completed this course.");
        return;
    }

    // 3. Check: Already Registered?
    if (state.currentEnrollments.includes(sectionId)) {
        alert("⚠️ You are already registered for this section.");
        return;
    }

    // 4. Check: Time Conflict
    if (section.schedule_text && state.myBusyTimes.includes(section.schedule_text)) {
        if(!confirm(`⚠️ Time Conflict Detected: ${section.schedule_text}\nDo you really want to force register?`)) return;
    }

    // 5. Check: Credit Limits
    const newCredits = section.courses.credit_hours || 3;
    const currentTotal = state.currentTotalCredits || 0;    
    const { max, isGrad } = getCreditLimits();

    if (currentTotal + newCredits > max) {
        const title = isGrad ? "Graduate Limit Reached" : "Credit Limit Reached";
        alert(`⛔ Cannot Register!\n\n${title}: You are limited to ${max} credit hours.\nCurrent: ${currentTotal}\nTrying to add: ${newCredits}\nTotal would be: ${currentTotal + newCredits}`);
        return; 
    }

    // 6. Confirm Action
    if (!confirm(`Register for ${courseName} (${newCredits} Cr)?`)) return;

    // 7. Execute Database Insert
    try {
        const { error } = await supabase
            .from('enrollments')
            .insert([{
                user_id: state.currentUser.id, 
                section_id: sectionId,
                status: 'REGISTERED'
            }]);
        
        if (error) throw error;

        alert("✅ Registered Successfully!");
        
        // Reload data to update UI and State
        loadRegistrationData(state.currentUser.id); 

    } catch (err) {
        // Handle specific DB errors (like unique constraint violation)
        if (err.message.includes("duplicate key")) {
             alert("You are already registered for a section of this course.");
        } else {
             alert("Registration Failed: " + err.message);
        }
    }
};

// --- DATA LOADING ---
export async function loadRegistrationData(userId) {
    const grid = document.getElementById('registration-courses-grid');
    if (grid) grid.innerHTML = '<div class="spinner"></div>';

    try {
        const { data: activeSem } = await supabase.from('semesters').select('semester_id').eq('is_active', true).single();
        if (!activeSem) { if(grid) grid.innerHTML = '<p style="color:red;text-align:center">No Active Semester</p>'; return; }

        const [profileRes, enrollRes, waitRes, historyRes] = await Promise.all([
            supabase.from('users').select('*').eq('id', userId).single(),
            supabase.from('enrollments').select('section_id, status, sections(course_code, schedule_text, courses(credit_hours))').eq('user_id', userId).in('status', ['REGISTERED', 'ENROLLED']),
            supabase.from('waiting_list').select('section_id').eq('user_id', userId).eq('status', 'WAITING'),
            supabase.from('enrollments').select('sections(course_code)').eq('user_id', userId).eq('status', 'COMPLETED')
        ]);

        if (profileRes.data) window.userProfile = profileRes.data;

        // --- UPDATE STATE ---
        state.currentEnrollments = enrollRes.data ? enrollRes.data.map(e => e.section_id) : [];
        state.myBusyTimes = enrollRes.data ? enrollRes.data.map(e => e.sections?.schedule_text).filter(Boolean) : [];
        state.currentWaitlist = waitRes.data ? waitRes.data.map(w => w.section_id) : [];
        state.passedCourses = historyRes.data ? historyRes.data.map(h => h.sections?.course_code.toString()) : [];
        state.currentTotalCredits = enrollRes.data ? enrollRes.data.reduce((sum, e) => sum + (e.sections?.courses?.credit_hours || 0), 0) : 0;
        
        updateCreditUI(state.currentTotalCredits);

        const { data: sections, error } = await supabase
            .from('sections')
            .select(`
                *, 
                courses (
                    course_code, course_name_en, course_name_ar, credit_hours, category,
                    prerequisites!prerequisites_course_code_fkey (prereq_code)
                )
            `)
            .eq('semester_id', activeSem.semester_id)
            .order('course_code', { ascending: true });

        if (error) throw error;
        state.availableSectionsData = sections || [];

        renderRegistrationList(state.availableSectionsData);

    } catch (err) {
        console.error("Reg Load Error:", err);
        if (grid) grid.innerHTML = '<p style="text-align:center; color:red;">Failed to load courses.</p>';
    }
}

export function renderRegistrationList(sections) {
    const grid = document.getElementById('registration-courses-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!sections) sections = state.availableSectionsData;

    // Get Inputs
    const searchText = document.getElementById('reg-search-input')?.value.toLowerCase() || '';
    const filterYear = document.getElementById('reg-filter-year')?.value || 'all';
    const filterCat = document.getElementById('reg-filter-category')?.value || 'all';
    
    // Toggles
    const hideCompleted = document.getElementById('reg-check-completed')?.checked || false;
    const hideFull = document.getElementById('reg-check-full')?.checked || false;
    const hideConflict = document.getElementById('reg-check-conflict')?.checked || false;
    const hideMissingPrereq = document.getElementById('reg-check-prereq')?.checked || false; // NEW

    const filtered = sections.filter(sec => {
        const course = sec.courses;
        const code = (course.course_code || sec.course_code).toString();
        const nameEn = course.course_name_en.toLowerCase();
        
        // Basic Filters
        if (!code.toLowerCase().includes(searchText) && !nameEn.includes(searchText)) return false;
        if (filterYear !== 'all' && code.length >= 3 && code[2] !== filterYear) return false;
        if (filterCat !== 'all' && course.category !== filterCat) return false;

        // State Checks
        const isRegistered = state.currentEnrollments.includes(sec.section_id);
        const isWaitlisted = state.currentWaitlist.includes(sec.section_id);
        const isPassed = state.passedCourses.includes(code);
        const isFull = (sec.enrolled_count || 0) >= (sec.capacity || 40);
        
        // --- PREREQUISITE CHECK ---
        // course.prerequisites is likely an array of objects: [{prereq_code: "101"}, ...]
        const prereqs = course.prerequisites || [];
        const missingPrereqs = prereqs.filter(p => !state.passedCourses.includes(p.prereq_code.toString()));
        const hasMissingPrereq = missingPrereqs.length > 0;

        // Toggle Logic
        if (hideCompleted && isPassed) return false;
        if (hideFull && isFull && !isRegistered) return false;
        if (hideConflict && !isRegistered) {
            if (sec.schedule_text && state.myBusyTimes.includes(sec.schedule_text)) return false;
        }
        
        // NEW: Filter out missing prereqs if toggle is on
        if (hideMissingPrereq && hasMissingPrereq && !isRegistered && !isPassed) return false;

        // Pill Logic (Waitlist vs Available)
        if (currentPillFilter === 'available') {
            if (isRegistered || isWaitlisted || isFull || isPassed) return false;
            // Note: We do NOT filter out missing prereqs here by default, 
            // so they show up unless the specific "Hide Missing Prereq" toggle is checked.
        } 
        else if (currentPillFilter === 'waitlist') {
            if (!isWaitlisted) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:50px;color:#666;"><p>No courses found.</p></div>`;
        return;
    }

    filtered.forEach(sec => {
        const course = sec.courses;
        const courseName = state.currentLang === 'ar' ? course.course_name_ar : course.course_name_en;
        const isRegistered = state.currentEnrollments.includes(sec.section_id);
        const isWaitlisted = state.currentWaitlist.includes(sec.section_id);
        const isPassed = state.passedCourses.includes(course.course_code.toString());
        const isFull = (sec.enrolled_count || 0) >= (sec.capacity || 40);

        // Prereq Check again for button logic
        const prereqs = course.prerequisites || [];
        const missingPrereqs = prereqs.filter(p => !state.passedCourses.includes(p.prereq_code.toString()));
        const hasMissingPrereq = missingPrereqs.length > 0;

        let statusBadge = `<span class="rc-status">Open Seat</span>`;
        let actionBtn = `<button class="rc-action-btn" onclick="handleRegister(${sec.section_id})">Register</button>`;
        let borderClass = '';

        if (isPassed) {
            statusBadge = `<span class="rc-status" style="background:rgba(255,255,255,0.1); color:#999;">Completed</span>`;
            actionBtn = `<button class="rc-action-btn registered" disabled>Passed</button>`;
        } else if (isRegistered) {
            statusBadge = `<span class="rc-status" style="background:rgba(0, 230, 118, 0.15); color:#00e676;">Registered</span>`;
            borderClass = 'border-color: rgba(0,230,118,0.3);';
            actionBtn = `<button class="rc-action-btn registered" disabled>Enrolled</button>`;
        } else if (isWaitlisted) {
            statusBadge = `<span class="rc-status waitlist">On Waitlist</span>`;
            actionBtn = `<button class="rc-action-btn outline" onclick="dropWaitlist(${sec.section_id})">Leave Queue</button>`;
        } else if (hasMissingPrereq) {
            // --- NEW: Missing Prerequisite Logic ---
            const missingCodes = missingPrereqs.map(p => p.prereq_code).join(', ');
            statusBadge = `<span class="rc-status" style="background:rgba(255, 145, 0, 0.15); color:#ff9100;">Missing Prereq: ${missingCodes}</span>`;
            // Button redirects to exceptions
            actionBtn = `<button class="rc-action-btn" style="background:transparent; border:1px solid #ff9100; color:#ff9100;" onclick="handleExceptionRequest('${course.course_code}', '${courseName.replace(/'/g, "\\'")}')">Apply Exception</button>`;
        } else if (isFull) {
            statusBadge = `<span class="rc-status full">Class Full</span>`;
            actionBtn = `<button class="rc-action-btn outline" onclick="handleWaitlist(${sec.section_id})">Join Waitlist</button>`;
        }

        const card = document.createElement('div');
        card.className = 'reg-card-new';
        if(borderClass) card.style.cssText = borderClass;
        
        card.innerHTML = `
            <div class="rc-header">
                <span class="rc-code-pill">${course.course_code}</span>
                <button class="rc-fav-btn">♡</button>
            </div>
            <div class="rc-body">
                ${statusBadge}
                <h3 class="rc-title">${courseName}</h3>
                <p class="rc-desc">Section ${sec.section_number} • ${course.credit_hours} Cr</p>
                <div class="rc-meta-row">
                    <div class="rc-meta-pill">${sec.schedule_text || 'TBA'}</div>
                    <div class="rc-meta-pill">${sec.instructor_name || 'Staff'}</div>
                </div>
            </div>
            <div class="rc-footer">
                <span class="rc-credits">${sec.enrolled_count || 0}/${sec.capacity || 40} Students</span>
                ${actionBtn}
            </div>
        `;
        grid.appendChild(card);
    });
}

// 2. ADD New Handler Function
function handleExceptionRequest(code, name) {
    // 1. Navigate to Exception Page
    window.showSection('exceptions');

    // 2. Pre-fill the form
    // We use a short timeout to ensure the view is visible/loaded
    setTimeout(() => {
        const searchInput = document.getElementById('exc-target-search');
        const hiddenInput = document.getElementById('exc-target-code-hidden');
        const typeRadio = document.querySelector('input[name="exc-type-radio"][value="PREREQ"]');
        
        if (searchInput && hiddenInput) {
            searchInput.value = `${code} - ${name}`;
            hiddenInput.value = code;
        }

        // 3. Set Request Type to "Prereq"
        if (typeRadio) {
            typeRadio.checked = true;
            // Manually trigger the update function to handle UI toggles (hide alt course input)
            if (window.updateExcType) window.updateExcType('PREREQ');
        }

        // 4. Focus the reason box for better UX
        const reasonBox = document.getElementById('exc-reason');
        if (reasonBox) {
            reasonBox.placeholder = `I am requesting an exception for ${code} because...`;
            reasonBox.focus();
        }
    }, 100);
}

// --- LISTENERS SETUP ---
export function setupRegistrationListeners() {
    ['reg-search-input', 'reg-filter-year', 'reg-filter-category', 'reg-check-completed', 'reg-check-full', 'reg-check-conflict'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.removeEventListener(el.type === 'checkbox' ? 'change' : 'input', handleFilterEvent);
            el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', handleFilterEvent);
        }
    });
}

function handleFilterEvent() {
    renderRegistrationList(state.availableSectionsData);
}

// --- WAITLIST HELPERS ---
function toggleFilters() {
    const panel = document.getElementById('reg-filter-panel');
    if (panel) panel.classList.toggle('hidden');
}

function handleWaitlist(sectionId) {
    if (!state.currentUser) return;
    const section = state.availableSectionsData.find(s => s.section_id === sectionId);
    if (!section) return;

    const courseName = state.currentLang === 'ar' ? section.courses.course_name_ar : section.courses.course_name_en;
    document.getElementById('wl-modal-course-name').textContent = `${section.courses.course_code} - ${courseName}`;
    document.getElementById('wl-modal-sec-info').textContent = `Section ${section.section_number} | ${section.schedule_text}`;
    document.getElementById('wl-target-section-id').value = sectionId;

    const modal = document.getElementById('waitlist-modal');
    if(modal) modal.classList.remove('hidden');
}

async function confirmWaitlistJoin() {
    const sectionId = document.getElementById('wl-target-section-id').value;
    const btn = document.querySelector('#waitlist-modal button:last-child');
    
    const originalText = btn.textContent;
    btn.textContent = "Joining...";
    btn.disabled = true;

    try {
        const timestamp = new Date().toISOString();
        const { error } = await supabase.from('waiting_list').insert([{
            user_id: state.currentUser.id,
            section_id: sectionId,
            status: 'WAITING',
            requested_at: timestamp
        }]);
        if (error) throw error;

        const { count, error: countError } = await supabase.from('waiting_list')
            .select('*', { count: 'exact', head: true })
            .eq('section_id', sectionId).eq('status', 'WAITING').lte('requested_at', timestamp);
        if (countError) throw countError;

        closeWaitlistModal();
        document.getElementById('wl-success-pos').textContent = `#${count}`;
        document.getElementById('waitlist-success-modal').classList.remove('hidden');
        loadRegistrationData(state.currentUser.id);

    } catch (err) {
        alert("Failed to join waitlist: " + err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function closeWaitlistModal() {
    document.getElementById('waitlist-modal').classList.add('hidden');
}
function closeWaitlistSuccessModal() {
    document.getElementById('waitlist-success-modal').classList.add('hidden');
}
async function dropWaitlist(sectionId) {
    if(!confirm("Leave the waiting list?")) return;
    try {
        const { error } = await supabase.from('waiting_list').delete()
            .eq('user_id', state.currentUser.id).eq('section_id', sectionId);
        if (error) throw error;
        loadRegistrationData(state.currentUser.id);
        alert("Removed from waitlist.");
    } catch(err) {
        alert("Error: " + err.message);
    }
}