// js/config.js
import { de, enUS, fr } from 'date-fns/locale'; // Import locales for date-fns

export const CONFIG = {
  API_BASE_URL: 'https://date.nager.at/api/v3',
  DEFAULT_COUNTRY: 'FR',
  DEFAULT_LANG: 'en',
  DEFAULT_THEME: 'light',
  DEFAULT_VIEW: 'month', // 'month', 'week', 'year'
  DEFAULT_WEEK_START: 0, // 0 for Sunday, 1 for Monday
  MIN_YEAR_OFFSET: -100,
  MAX_YEAR_OFFSET: 100,
  CACHE_EXPIRY_MS: 24 * 60 * 60 * 1000, // 1 day for API cache
  COUNTRY_CACHE_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days for available countries cache
  MAX_REGIONAL_DISPLAY: 4, // Max counties/regions to show in sidebar before truncating
  SEARCH_YEAR_RANGE: 1, // Years +/- current year to include in search
  // MIN_YEAR and MAX_YEAR are added dynamically below
};

// Calculate dynamic year range based on the actual current year
const currentYear = new Date().getFullYear();
CONFIG.MIN_YEAR = currentYear + CONFIG.MIN_YEAR_OFFSET;
CONFIG.MAX_YEAR = currentYear + CONFIG.MAX_YEAR_OFFSET;

// Map language codes to date-fns locale objects
export const DATE_FNS_LOCALES = {
  en: enUS,
  fr: fr,
  de: de,
};

// CSS Classes (moving towards BEM, prefix 'cal-' for clarity)
// Block: cal-calendar
// Block: cal-sidebar
// Block: cal-main
// Block: cal-header
// Block: cal-grid
// Block: cal-day-info
// Block: cal-upcoming
// Block: cal-search-results
// Block: cal-error
// Block: cal-loader
// Block: cal-weekdays
export const CSS_CLASSES = {
  // General & Layout
  calendarContainer: 'cal-container',
  sidebar: 'cal-sidebar',
  mainContent: 'cal-main',
  loadingOverlay: 'cal-loader__overlay',
  spinner: 'cal-loader__spinner',
  skeleton: 'cal-loader__skeleton',

  // Header
  header: 'cal-header',
  headerControlGroup: 'cal-header__group',
  headerLabel: 'cal-header__label',
  headerSelect: 'cal-header__select',
  headerInput: 'cal-header__input',
  headerButton: 'cal-header__button',
  headerInputError: 'cal-header__input-error', // For date jump error

  // Weekdays
  weekdaysContainer: 'cal-weekdays',
  weekdaysHeader: 'cal-weekdays__header',

  // Grid & Cells
  calendarGrid: 'cal-grid',
  gridMonthView: 'cal-grid--month-view',
  gridWeekView: 'cal-grid--week-view',
  gridYearView: 'cal-grid--year-view',
  gridDayCell: 'cal-grid__day-cell',
  gridMonthCell: 'cal-grid__month-cell', // Year view mini-calendar day
  gridWeekNumber: 'cal-grid__week-number',
  gridDayNumber: 'cal-grid__day-number',
  gridHolidayName: 'cal-grid__holiday-name',
  gridMonthContainer: 'cal-grid__month-container', // Year view month wrapper
  gridMonthHeader: 'cal-grid__month-header', // Year view clickable header
  gridMiniWeekdays: 'cal-grid__mini-weekdays', // Year view weekdays
  gridMiniCalendar: 'cal-grid__mini-calendar', // Year view day grid
  gridMiniCalendarPlaceholder: 'cal-grid__mini-calendar-placeholder', // For IntersectionObserver

  // Cell States & Modifiers
  cellOtherMonth: 'cal-grid__day-cell--other-month',
  cellToday: 'cal-grid__day-cell--today',
  cellSelected: 'cal-grid__day-cell--selected',
  cellHoliday: 'cal-grid__day-cell--holiday',
  cellWeekend: 'cal-grid__day-cell--weekend', // Added for weekend
  cellSearchHighlight: 'cal-grid__day-cell--search-highlight',
  cellHolidayTypePrefix: 'cal-grid__day-cell--holiday-', // Prefix for holiday type modifier

  // Sidebar Day Info
  dayInfo: 'cal-day-info',
  dayInfoDate: 'cal-day-info__date',
  dayInfoToday: 'cal-day-info__today',
  dayInfoHoliday: 'cal-day-info__holiday',
  dayInfoHolidayName: 'cal-day-info__holiday-name',
  dayInfoHolidayType: 'cal-day-info__holiday-type',
  dayInfoHolidayDetails: 'cal-day-info__holiday-details',
  dayInfoHolidayRegions: 'cal-day-info__holiday-regions', // For regional list
  dayInfoHolidayRegionItem: 'cal-day-info__region-item',
  dayInfoHolidayRegionsMore: 'cal-day-info__regions-more',
  dayInfoHolidayLink: 'cal-day-info__holiday-link',

  // Sidebar Upcoming
  upcoming: 'cal-upcoming',
  upcomingTitle: 'cal-upcoming__title',
  upcomingList: 'cal-upcoming__list',
  upcomingItem: 'cal-upcoming__item',
  upcomingItemDate: 'cal-upcoming__item-date',
  upcomingItemName: 'cal-upcoming__item-name',

  // Search Results
  searchResults: 'cal-search-results',
  searchResultsHidden: 'cal-search-results--hidden',
  searchResultsTitle: 'cal-search-results__title',
  searchResultsList: 'cal-search-results__list',
  searchResultsItem: 'cal-search-results__item',
  searchResultsItemDate: 'cal-search-results__item-date',
  searchResultsCloseBtn: 'cal-search-results__close-btn',

  // Error Messages
  errorMessage: 'cal-error',
  errorMessageHidden: 'cal-error--hidden',
  errorRetryButton: 'cal-error__retry-btn',
  errorRetryIcon: 'cal-error__retry-icon',
  errorRetryText: 'cal-error__retry-text',

  // Theme Modifiers (Applied to body or container)
  themeLight: 'theme--light',
  themeDark: 'theme--dark',
  // SYNTAX FIX: Removed extraneous text artifact below
};

// DOM Element references (remain mostly the same, but use new class constants if needed for selection robustness)
// Consider querying within specific blocks if IDs aren't unique enough (though they are here)
export const DOM_ELEMENTS = {
  // SYNTAX FIX: Used template literal (backticks) for querySelector argument
  calendarContainer: document.querySelector(`.${CSS_CLASSES.calendarContainer}`), // Use class

  // Header
  monthSelect: document.getElementById('month-select'),
  yearInput: document.getElementById('year-input'),
  countrySelect: document.getElementById('country-select'),
  langSelect: document.getElementById('lang-select'),
  themeSelect: document.getElementById('theme-select'),
  viewSelect: document.getElementById('view-select'),
  weekStartSelect: document.getElementById('week-start-select'), // Added
  todayBtn: document.getElementById('today-btn'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  dateJumpInput: document.getElementById('date-jump'),
  dateJumpError: document.getElementById('date-jump-error'),
  holidaySearchInput: document.getElementById('holiday-search'),
  searchBtn: document.getElementById('search-btn'),
  searchResultsContainer: document.getElementById('search-results-container'), // Use ID
  searchResultsList: document.getElementById('search-results-list'),
  searchResultsTitle: document.getElementById('search-results-title'),
  closeSearchResultsBtn: document.getElementById('close-search-results-btn'),
  countrySelectLabel: document.querySelector('label[for="country-select"]'), // Added for loading state

  // Main Grid
  calendarGrid: document.getElementById('calendar-grid'), // Use ID
  // SYNTAX FIX: Used template literal (backticks) for querySelector arguments
  calendarWeekdays: document.querySelector(`.${CSS_CLASSES.weekdaysContainer}`), // Use class
  loadingOverlay: document.querySelector(`.${CSS_CLASSES.loadingOverlay}`), // Use class

  // Sidebar
  dayInfoDiv: document.getElementById('day-info'), // Use ID
  upcomingTitle: document.getElementById('upcoming-title'), // Use ID
  upcomingHolidaysList: document.getElementById('upcoming-holidays-list'), // Use ID

  // Error/Retry Buttons
  apiErrorMessage: document.getElementById('api-error-message'), // Use ID
  upcomingErrorMessage: document.getElementById('upcoming-error-message'), // Use ID
  retryHolidaysBtn: document.getElementById('retry-holidays-btn'),
  retryUpcomingBtn: document.getElementById('retry-upcoming-btn'),
  retryCountriesBtn: document.getElementById('retry-countries-btn'), // Added

  // Weekday Labels Container (already referenced as calendarWeekdays)
  // SYNTAX FIX: Used template literal (backticks) for querySelector argument
  weekdayLabelsContainer: document.querySelector(`.${CSS_CLASSES.weekdaysContainer}`),

  // Print Header
  printHeader: document.getElementById('print-header'), // Added
  // SYNTAX FIX: Removed extraneous text artifact below
};