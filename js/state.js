// js/state.js
import { CONFIG, DATE_FNS_LOCALES } from './config.js';
import { safeLocalStorageGetItem, safeLocalStorageSetItem, safeLocalStorageRemoveItem } from './utils.js';
import { parseISO, isValid, getYear, getMonth, startOfWeek, formatISO } from 'date-fns'; // Use specific imports

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
  currentWeekStart: null, // Used for week view, calculated based on selectedDate and weekStartsOn
  weekStartsOn: CONFIG.DEFAULT_WEEK_START, // 0 for Sunday, 1 for Monday
  selectedCountry: CONFIG.DEFAULT_COUNTRY,
  currentLang: CONFIG.DEFAULT_LANG,
  currentTheme: CONFIG.DEFAULT_THEME,
  currentView: CONFIG.DEFAULT_VIEW, // 'month', 'week', 'year'
  holidaysCache: {}, // { countryCode: { year: { dateString: holidayInfo } } }
  upcomingCache: {}, // { countryCode: { data: [holidays], timestamp: ms } }
  availableCountriesCache: null, // { data: [countries], timestamp: ms } // Changed this structure slightly from api.js for simplicity, assuming data is just the array
  apiError: null, // Store API error state
  upcomingError: null,
  countriesError: null, // Error state for fetching countries
  isLoadingGrid: false,
  isLoadingUpcoming: false,
  isLoadingCountries: false, // Loading state for countries
  searchQuery: '',
  searchResults: [],
};

/**
 * Updates state and persists relevant parts to localStorage.
 * @param {object} newState - The partial state object to merge.
 */
export function updateState(newState) {
  // TODO: Add unit tests for state updates and localStorage interaction.
  Object.assign(state, newState);

  // Persist relevant parts to localStorage using safe wrappers
  if (newState.selectedDate !== undefined && state.selectedDate && isValid(state.selectedDate)) { // Added validity check
    safeLocalStorageSetItem('calendarSelectedDate', formatISO(state.selectedDate, { representation: 'date' }));
  }
  if (newState.selectedCountry !== undefined) {
    safeLocalStorageSetItem('calendarSelectedCountry', state.selectedCountry);
  }
  if (newState.currentLang !== undefined) {
    safeLocalStorageSetItem('calendarSelectedLang', state.currentLang);
  }
  if (newState.currentTheme !== undefined) {
    safeLocalStorageSetItem('calendarSelectedTheme', state.currentTheme);
  }
  if (newState.currentView !== undefined) {
    safeLocalStorageSetItem('calendarSelectedView', state.currentView);
  }
  if (newState.weekStartsOn !== undefined) {
    safeLocalStorageSetItem('calendarWeekStart', state.weekStartsOn.toString());
  }
}

/**
 * Loads state from localStorage on initialization.
 */
export function loadState() {
  // TODO: Add unit tests for loading state from localStorage.
  let loadedState = {};
  try {
    const savedCountry = safeLocalStorageGetItem('calendarSelectedCountry');
    const savedLang = safeLocalStorageGetItem('calendarSelectedLang');
    const savedTheme = safeLocalStorageGetItem('calendarSelectedTheme');
    const savedView = safeLocalStorageGetItem('calendarSelectedView');
    const savedDateStr = safeLocalStorageGetItem('calendarSelectedDate');
    const savedWeekStart = safeLocalStorageGetItem('calendarWeekStart');

    if (savedCountry) loadedState.selectedCountry = savedCountry;
    // Check if savedLang is a key in DATE_FNS_LOCALES before assigning
    if (savedLang && DATE_FNS_LOCALES && DATE_FNS_LOCALES.hasOwnProperty(savedLang)) {
         loadedState.currentLang = savedLang;
    }
    if (savedTheme) loadedState.currentTheme = savedTheme;
    if (savedView) loadedState.currentView = savedView;
    if (savedWeekStart) {
      const weekStartNum = parseInt(savedWeekStart, 10);
      if (weekStartNum === 0 || weekStartNum === 1) {
        loadedState.weekStartsOn = weekStartNum;
      }
    }

    if (savedDateStr) {
      const parsedDate = parseISO(savedDateStr);
      if (isValid(parsedDate)) {
        const year = getYear(parsedDate);
        if (year >= CONFIG.MIN_YEAR && year <= CONFIG.MAX_YEAR) {
          parsedDate.setHours(0, 0, 0, 0);
          loadedState.selectedDate = parsedDate;
          // Only update year/month if date was loaded, otherwise keep default
          loadedState.currentYear = getYear(parsedDate);
          loadedState.currentMonth = getMonth(parsedDate);
        } else {
          safeLocalStorageRemoveItem('calendarSelectedDate'); // Clean invalid date
        }
      } else {
        safeLocalStorageRemoveItem('calendarSelectedDate'); // Clean invalid date string
      }
    }

    // Calculate initial currentWeekStart based on loaded selectedDate and weekStartsOn
    // Use the potentially loaded values, falling back to the initial state values
    const initialSelectedDate = loadedState.selectedDate || state.selectedDate;
    const initialWeekStartsOn = loadedState.weekStartsOn !== undefined ? loadedState.weekStartsOn : state.weekStartsOn;
    loadedState.currentWeekStart = startOfWeek(initialSelectedDate, { weekStartsOn: initialWeekStartsOn });
    // SYNTAX FIX: Removed extraneous text artifact below

  } catch (e) {
    console.error("Error loading state from localStorage:", e);
    // Clear potentially corrupted keys
    safeLocalStorageRemoveItem('calendarSelectedDate');
    safeLocalStorageRemoveItem('calendarSelectedCountry');
    safeLocalStorageRemoveItem('calendarSelectedLang');
    safeLocalStorageRemoveItem('calendarSelectedTheme');
    safeLocalStorageRemoveItem('calendarSelectedView');
    safeLocalStorageRemoveItem('calendarWeekStart');
  }

  // Merge loaded state into initial state
  // updateState should only be called AFTER the initial state object is fully defined.
  // We merge here before returning or affecting the exported state directly if loadState modifies it.
  Object.assign(state, loadedState); // Apply loaded state over defaults
}

/**
 * Helper to get holidays for a specific year/country from cache.
 * @param {string} countryCode
 * @param {number} year
 * @returns {object} Holiday map { dateString: holidayInfo } or empty object.
 */
export function getHolidaysFromCache(countryCode, year) {
  // Use optional chaining and nullish coalescing for safer access
  return state.holidaysCache[countryCode]?.[year] ?? {};
}

/**
 * Helper to get the date-fns locale object based on current language.
 * @returns {Locale} The date-fns locale object.
 */
export function getCurrentLocale() {
  // Ensure DATE_FNS_LOCALES is defined and has the key, otherwise fallback
  return (DATE_FNS_LOCALES && DATE_FNS_LOCALES[state.currentLang]) || DATE_FNS_LOCALES['en'];
}