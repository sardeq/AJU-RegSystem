// state.js

// Define the ID for the new main root
export const ROOT_SE_ID = 'ROOT_SE';

export const state = {
    currentUser: null,
    currentLang: localStorage.getItem('app_lang') || 'en',

    pendingAction: null,
    
    // Data Caches
    allCoursesData: [],       
    
    // The NEW single main root
    planRoots: [ROOT_SE_ID],

    // The connections (Source -> Target)
    planLinks: [
        { s: ROOT_SE_ID, t: "313160" },
        { s: ROOT_SE_ID, t: "311101" },
        { s: ROOT_SE_ID, t: "311220" },
        { s: ROOT_SE_ID, t: "311160" },
        { s: ROOT_SE_ID, t: "601101" },
        { s: ROOT_SE_ID, t: "311240" },

        // --- Existing Connections (Unchanged structure) ---
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