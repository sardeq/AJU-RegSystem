export const state = {
currentUser: null,
    currentLang: localStorage.getItem('app_lang') || 'en',
    
    // Data Caches
    allCoursesData: [],       
    availableSectionsData: [], // Replaces the global variable
    userHistoryMap: {},       
    passedCourses: [],        
    
    // New additions to fix ReferenceErrors
    currentEnrollments: [],   
    currentWaitlist: [],      
    myBusyTimes: [],
    
    // Credit limits
    currentTotalCredits: 0,
    
    // Plan Data (Moved from massive variable)
    planStructure: [
        { id: "lbl_95", x: 50, y: 50, type: 'label-circle', label: "95\nHours" },
        { id: "lbl_75", x: 2600, y: 50, type: 'label-circle', label: "75\n%" },
        { id: "311100", x: 1300, y: 100, type: 'course' }, 
        { id: "313160", x: 350, y: 250, type: 'course' },
        { id: "313269", x: 750, y: 250, type: 'course' },
        { id: "311101", x: 1150, y: 250, type: 'course' },
        { id: "311220", x: 1600, y: 250, type: 'course' }, 
        { id: "311160", x: 1800, y: 250, type: 'course' },
        { id: "601101", x: 2000, y: 250, type: 'course' },
        { id: "311240", x: 2350, y: 250, type: 'course' },
        { id: "313466", x: 150, y: 450, type: 'course' }, 
        { id: "313261", x: 350, y: 450, type: 'course' }, 
        { id: "313262", x: 750, y: 450, type: 'course' }, 
        { id: "313204", x: 950, y: 350, type: 'course' }, 
        { id: "311202", x: 1150, y: 450, type: 'course' },
        { id: "313263", x: 1350, y: 450, type: 'course' },
        { id: "311321", x: 1550, y: 450, type: 'course' },
        { id: "311330", x: 1750, y: 450, type: 'course' },
        { id: "311210", x: 2000, y: 450, type: 'course' },
        { id: "311340", x: 2250, y: 450, type: 'course' },
        { id: "311241", x: 2450, y: 450, type: 'course' },
        { id: "313367", x: 150, y: 650, type: 'course' }, 
        { id: "313364", x: 350, y: 650, type: 'course' }, 
        { id: "313363", x: 750, y: 650, type: 'course' }, 
        { id: "311305", x: 950, y: 650, type: 'course' }, 
        { id: "311304", x: 1150, y: 650, type: 'course' },
        { id: "311213", x: 1350, y: 650, type: 'course' },
        { id: "311468", x: 1750, y: 650, type: 'course' },
        { id: "313469", x: 150, y: 850, type: 'course' }, 
        { id: "313464", x: 350, y: 850, type: 'course' }, 
        { id: "313462", x: 550, y: 850, type: 'course' }, 
        { id: "313365", x: 750, y: 850, type: 'course' }, 
        { id: "313366", x: 950, y: 850, type: 'course' }, 
        { id: "311314", x: 1350, y: 850, type: 'course' },
        { id: "313468", x: 750, y: 1050, type: 'course' },
        { id: "311350", x: 1250, y: 1050, type: 'course' },
        { id: "311422", x: 1450, y: 1050, type: 'course' },
        { id: "proj_grad", x: 2150, y: 1200, type: 'label-box-green', label: "Graduation Project\nReq: 110 Hours" },
        { id: "proj_train", x: 2350, y: 1200, type: 'label-box-green', label: "Field Training\nReq: 90 Hours" },
        { id: "summ_uni_comp", x: 2650, y: 250, type: 'summary-block', label: "University Compulsory\n(12 Cr)", group: "University Compulsory", subtext: "View Courses" },
        { id: "summ_free", x: 2650, y: 450, type: 'summary-block', label: "Free Requirements\n(3 Cr)", group: "Free Elective", subtext: "Any Course" },
        { id: "summ_support", x: 2650, y: 650, type: 'summary-block', label: "Supportive Compulsory\n(6 Cr)", group: "Supportive Compulsory", subtext: "Stats & Numerical" },
        { id: "summ_uni_elec", x: 2650, y: 850, type: 'summary-block', label: "University Elective\n(15 Cr)", group: "University Elective", subtext: "View Options" }
    ],
    planRoots: ["313160", "311101", "311220", "311160", "601101", "311240"],


    planLinks: [
        // Children of 313160 (Algo & Data Structures path)
        { s: "313160", t: "313466" }, { s: "313160", t: "313261" }, 
        { s: "313160", t: "313269" }, { s: "313160", t: "313262" },
        
        // Children of 311101 (Calculus/Math path)
        { s: "311101", t: "313204" }, { s: "311101", t: "311202" }, 
        { s: "311101", t: "313263" },

        // Children of 311220 (Digital Logic path)
        { s: "311220", t: "311321" }, { s: "311220", t: "311330" },

        // Children of 601101 (English path)
        { s: "601101", t: "311210" },

        // Children of 311240 (Web path)
        { s: "311240", t: "311340" }, { s: "311240", t: "311241" },

        // Deep branches (Level 3+)
        { s: "313261", t: "313367" }, { s: "313261", t: "313364" },
        { s: "313364", t: "313469" }, { s: "313364", t: "313464" },
        { s: "313364", t: "313462" },
        { s: "313262", t: "313363" },
        { s: "313363", t: "313365" }, { s: "313363", t: "313366" },
        { s: "313365", t: "313468" },
        
        { s: "311202", t: "311305" }, { s: "311202", t: "311304" },
        { s: "311202", t: "311213" },
        { s: "311213", t: "311314" },
        { s: "311314", t: "311350" }, { s: "311314", t: "311422" },

        { s: "311330", t: "311468" }
    ]
};