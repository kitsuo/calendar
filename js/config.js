// js/config.js
export const CONFIG = {
    API_BASE_URL: 'https://date.nager.at/api/v3',
    DEFAULT_COUNTRY: 'FR',
    DEFAULT_LANG: 'en',
    DEFAULT_THEME: 'light',
    DEFAULT_VIEW: 'month', // 'month', 'week', 'year'
    MIN_YEAR_OFFSET: -100,
    MAX_YEAR_OFFSET: 100,
    CACHE_EXPIRY_MS: 24 * 60 * 60 * 1000, // 1 day for API cache
};

// Calculate dynamic year range based on the actual current year
const currentYear = new Date().getFullYear();
CONFIG.MIN_YEAR = currentYear + CONFIG.MIN_YEAR_OFFSET;
CONFIG.MAX_YEAR = currentYear + CONFIG.MAX_YEAR_OFFSET;


export const CSS_CLASSES = {
    dayCell: 'day-cell',
    monthCell: 'month-cell', // For year view
    otherMonth: 'other-month',
    today: 'today',
    selectedDay: 'selected-day',
    holiday: 'holiday',
    weekNumber: 'week-number',
    dayNumber: 'day-number',
    gridHolidayName: 'holiday-name-grid',
    selectedDateDisplay: 'selected-date-display',
    upcomingHolidayName: 'upcoming-holiday-name',
    inputError: 'input-error-message',
    skeleton: 'skeleton-item',
    loadingOverlay: 'loading-overlay',
    spinner: 'spinner',
    searchHighlight: 'search-highlight',
    // Holiday Type Classes (match the API types as needed)
    holidayTypePrefix: 'holiday-type-',
    holidayTypePublic: 'holiday-type-Public',
    holidayTypeBank: 'holiday-type-Bank',
    holidayTypeOptional: 'holiday-type-Optional',
    // Add other types if returned by API (e.g., School, Authorities)

    // View classes
    monthView: 'month-view',
    weekView: 'week-view',
    yearView: 'year-view',
};

export const DOM_ELEMENTS = {
    calendarContainer: document.querySelector('.calendar-container'),
    // Header
    monthSelect: document.getElementById('month-select'),
    yearInput: document.getElementById('year-input'),
    countrySelect: document.getElementById('country-select'),
    langSelect: document.getElementById('lang-select'),
    themeSelect: document.getElementById('theme-select'),
    viewSelect: document.getElementById('view-select'),
    todayBtn: document.getElementById('today-btn'),
    prevBtn: document.getElementById('prev-btn'), // Renamed from prev-month/year
    nextBtn: document.getElementById('next-btn'), // Renamed from next-month/year
    dateJumpInput: document.getElementById('date-jump'),
    dateJumpError: document.getElementById('date-jump-error'),
    holidaySearchInput: document.getElementById('holiday-search'),
    searchBtn: document.getElementById('search-btn'),
    searchResultsContainer: document.getElementById('search-results-container'),
    searchResultsList: document.getElementById('search-results-list'),
    searchResultsTitle: document.getElementById('search-results-title'),
    closeSearchResultsBtn: document.getElementById('close-search-results-btn'),

    // Main Grid
    calendarGrid: document.getElementById('calendar-grid'),
    calendarWeekdays: document.querySelector('.calendar-weekdays'),
    loadingOverlay: document.querySelector('.loading-overlay'),

    // Sidebar
    dayInfoDiv: document.getElementById('day-info'),
    upcomingTitle: document.getElementById('upcoming-title'),
    upcomingHolidaysList: document.getElementById('upcoming-holidays-list'),

    // Error/Retry Buttons
    apiErrorMessage: document.getElementById('api-error-message'),
    upcomingErrorMessage: document.getElementById('upcoming-error-message'),
    retryHolidaysBtn: document.getElementById('retry-holidays-btn'),
    retryUpcomingBtn: document.getElementById('retry-upcoming-btn'),

    // Weekday Labels (for translation)
    weekdayLabelsContainer: document.querySelector('.calendar-weekdays'), // Assuming they are direct children
};
