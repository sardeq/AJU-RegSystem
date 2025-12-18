// courses-sheet.js
import { supabase } from './config.js';
import { state } from './state.js';

export async function loadCoursesSheetData(userId) {
    const grid = document.getElementById('courses-sheet-grid');
    if(grid) grid.innerHTML = '<div class="spinner"></div>';

    try {
        // 1. Fetch History Map
        const { data: history } = await supabase.from('enrollments')
            .select('status, grade_value, sections(course_code)')
            .eq('user_id', userId);
        
        state.userHistoryMap = {};
        history?.forEach(h => {
            if(h.sections) state.userHistoryMap[h.sections.course_code] = { status: h.status, grade: h.grade_value };
        });

        // 2. Fetch All Courses if missing
        if(!state.allCoursesData || state.allCoursesData.length === 0) {
            const { data } = await supabase.from('courses').select('*');
            state.allCoursesData = data || [];
        }

        renderCoursesTable();
    } catch (err) {
        console.error("Sheet Error:", err);
        if(grid) grid.innerHTML = '<div style="color:red; text-align:center; padding:20px;">Failed to load courses.</div>';
    }
}

function renderCoursesTable() {
    const grid = document.getElementById('courses-sheet-grid');
    if(!grid) return;
    grid.innerHTML = '';

    // Get Filter Values
    const searchText = document.getElementById('sheet-search')?.value.toLowerCase() || '';
    const filterYear = document.getElementById('filter-year')?.value || 'all';
    const filterCat = document.getElementById('filter-category')?.value || 'all';
    
    // Checkboxes (default to true if element not found)
    const checkCompleted = document.getElementById('check-completed');
    const checkFailed = document.getElementById('check-failed');
    const showPassed = checkCompleted ? checkCompleted.checked : true;
    const showRemaining = checkFailed ? checkFailed.checked : true;

    let totalCreditsEarned = 0;
    let gradeSum = 0;
    let gradeCount = 0;

    // Filter Logic
    const filtered = state.allCoursesData.filter(c => {
        const code = c.course_code.toString();
        const h = state.userHistoryMap[code] || { status: 'NONE' };
        const isCompleted = h.status === 'COMPLETED';

        // --- View Filters ---
        if (isCompleted && !showPassed) return false;
        if (!isCompleted && !showRemaining) return false;

        const nameEn = c.course_name_en.toLowerCase();
        const nameAr = c.course_name_ar ? c.course_name_ar.toLowerCase() : '';

        if (!code.includes(searchText) && !nameEn.includes(searchText) && !nameAr.includes(searchText)) return false;
        
        if (filterYear !== 'all' && code.length >= 3 && code[2] !== filterYear) return false;
        if (filterCat !== 'all' && c.category !== filterCat) return false;

        return true;
    });
    
    // Stats Loop (Calculate on ALL courses, independent of filters)
    state.allCoursesData.forEach(c => {
        const h = state.userHistoryMap[c.course_code] || { status: 'NONE' };
        if(h.status === 'COMPLETED') {
            totalCreditsEarned += c.credit_hours || 0;
            if(h.grade && !isNaN(h.grade)) {
                gradeSum += parseFloat(h.grade);
                gradeCount++;
            }
        }
    });

    // Render Cards
    if (filtered.length === 0) {
        grid.innerHTML = `<div style="text-align:center; padding:30px; color:#666; width:100%;">No courses found matching filters.</div>`;
    } else {
        filtered.forEach(c => {
            const h = state.userHistoryMap[c.course_code] || { status: 'NONE' };
            const div = document.createElement('div');
            
            let rowClass = '';
            let gradeDisplay = '-';
            
            if(h.status === 'COMPLETED') {
                rowClass = 'passed';
                gradeDisplay = `<span class="grade-pill gp-green">${h.grade || 'P'}</span>`;
            } else if(h.status === 'FAILED') {
                rowClass = 'failed';
                gradeDisplay = `<span class="grade-pill gp-red">F</span>`;
            } else if(h.status === 'REGISTERED') {
                rowClass = 'registered';
                gradeDisplay = `<span class="grade-pill gp-gray">IP</span>`;
            }

            div.className = `sheet-row-card ${rowClass}`;
            div.innerHTML = `
                <div class="src-code">${c.course_code}</div>
                <div class="src-main">
                    <div class="src-title">${state.currentLang==='ar'?c.course_name_ar:c.course_name_en}</div>
                    <div class="src-cat">${c.category || ''}</div>
                </div>
                <div class="src-credits">${c.credit_hours} Cr</div>
                <div class="src-prereq"></div>
                <div class="src-grade-box">${gradeDisplay}</div>
            `;
            grid.appendChild(div);
        });
    }

    // Update UI Stats
    const totalRequired = 132;
    const progressPercent = Math.round((totalCreditsEarned / totalRequired) * 100);
    const avgGrade = gradeCount > 0 ? (gradeSum / gradeCount).toFixed(2) : "--";

    const progVal = document.getElementById('sheet-progress-val');
    const progBar = document.getElementById('sheet-progress-bar');
    const compVal = document.getElementById('sheet-completed-val');
    const gpaVal = document.getElementById('sheet-gpa-val');

    if(progVal) progVal.textContent = `${progressPercent}%`;
    if(progBar) progBar.style.width = `${progressPercent}%`;
    if(compVal) compVal.textContent = totalCreditsEarned;
    if(gpaVal) gpaVal.textContent = avgGrade;
}

export function setupSheetListeners() {
    const filterIds = ['sheet-search', 'filter-year', 'filter-category', 'check-completed', 'check-failed'];
    
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            // Remove old listener just in case
            el.removeEventListener(el.type === 'checkbox' ? 'change' : 'input', renderCoursesTable);
            // Add new listener
            el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', renderCoursesTable);
        }
    });
}