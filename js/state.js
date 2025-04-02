// js/state.js
import { CONFIG } from './config.js';

// Use the real current date, set to midnight
const getTodayAtMidnight = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

export const state = {
    today: getTodayAtMidnight(),
    selectedDate: getTodayAtMidnight(), // Default selected to today
    currentYear: getTodayAtMidnight().getFullYear(),
    currentMonth: getTodayAtMidnight().getMonth(), // 0-indexed
    currentWeekStart: null, // Used for week view
    selectedCountry: CONFIG.DEFAULT_COUNTRY,
    currentLang: CONFIG.DEFAULT_LANG,
    currentTheme: CONFIG.DEFAULT_THEME,
    currentView: CONFIG.DEFAULT_VIEW, // 'month', 'week', 'year'
    holidaysCache: {}, // { countryCode: { year: { dateString: holidayInfo } } }
    upcomingCache: {}, // { countryCode: { data: [holidays], timestamp: ms } }
    apiError: null, // Store API error state
    upcomingError: null,
    isLoadingGrid: false,
    isLoadingUpcoming: false,
    searchQuery: '',
    searchResults: [],
};

// Function to update state and optionally save to localStorage
export function updateState(newState) {
    Object.assign(state, newState);

    // Persist relevant parts to localStorage
    if (newState.selectedDate !== undefined) {
        try {
            // Use date-fns for reliable formatting
            localStorage.setItem('calendarSelectedDate', dateFns.formatISO(state.selectedDate, { representation: 'date' }));
        } catch (e) { console.error("LocalStorage Error (Date):", e); }
    }
    if (newState.selectedCountry !== undefined) {
        try { localStorage.setItem('calendarSelectedCountry', state.selectedCountry); } catch (e) { console.error("LocalStorage Error (Country):", e); }
    }
    if (newState.currentLang !== undefined) {
        try { localStorage.setItem('calendarSelectedLang', state.currentLang); } catch (e) { console.error("LocalStorage Error (Lang):", e); }
    }
    if (newState.currentTheme !== undefined) {
        try { localStorage.setItem('calendarSelectedTheme', state.currentTheme); } catch (e) { console.error("LocalStorage Error (Theme):", e); }
    }
     if (newState.currentView !== undefined) {
        try { localStorage.setItem('calendarSelectedView', state.currentView); } catch (e) { console.error("LocalStorage Error (View):", e); }
    }
}

// Function to load state from localStorage on initialization
export function loadState() {
    let loadedState = {};
    try {
        const savedCountry = localStorage.getItem('calendarSelectedCountry');
        const savedLang = localStorage.getItem('calendarSelectedLang');
        const savedTheme = localStorage.getItem('calendarSelectedTheme');
        const savedView = localStorage.getItem('calendarSelectedView');
        const savedDateStr = localStorage.getItem('calendarSelectedDate');

        if (savedCountry) loadedState.selectedCountry = savedCountry;
        if (savedLang) loadedState.currentLang = savedLang;
        if (savedTheme) loadedState.currentTheme = savedTheme;
        if (savedView) loadedState.currentView = savedView;

        if (savedDateStr) {
            // Use date-fns for reliable parsing
            const parsedDate = dateFns.parseISO(savedDateStr);
            if (dateFns.isValid(parsedDate)) {
                const year = parsedDate.getFullYear();
                if (year >= CONFIG.MIN_YEAR && year <= CONFIG.MAX_YEAR) {
                    parsedDate.setHours(0, 0, 0, 0);
                    loadedState.selectedDate = parsedDate;
                    loadedState.currentYear = parsedDate.getFullYear();
                    loadedState.currentMonth = parsedDate.getMonth();
                    // Initialize week start if week view is loaded
                    if(loadedState.currentView === 'week') {
                       loadedState.currentWeekStart = dateFns.startOfWeek(parsedDate, { weekStartsOn: 0 }); // Assuming Sunday start
                    }
                } else {
                    localStorage.removeItem('calendarSelectedDate'); // Clean invalid date
                }
            } else {
                 localStorage.removeItem('calendarSelectedDate'); // Clean invalid date string
            }
        }
    } catch (e) {
        console.error("Error loading state from localStorage:", e);
        // Clear potentially corrupted keys
        localStorage.removeItem('calendarSelectedDate');
        localStorage.removeItem('calendarSelectedCountry');
        localStorage.removeItem('calendarSelectedLang');
        localStorage.removeItem('calendarSelectedTheme');
        localStorage.removeItem('calendarSelectedView');
    }
     // Merge loaded state into initial state
    updateState(loadedState);
}

// Helper to get holidays for the current year/country from cache
export function getCurrentYearHolidays() {
    return state.holidaysCache[state.selectedCountry]?.[state.currentYear] || {};
}
