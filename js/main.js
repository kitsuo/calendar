// js/main.js // <- Assuming this is the intended filename based on imports
import { CONFIG, CSS_CLASSES, DOM_ELEMENTS } from './config.js';
import { state, updateState, loadState, getHolidaysFromCache, getCurrentLocale } from './state.js';
import { t } from './i18n.js';
import { fetchHolidays, fetchUpcomingLocalHolidays, fetchAvailableCountries } from './api.js';
// Original imports from user upload:
import {
    populateStaticSelectors, populateCountrySelector, translateUI, applyTheme, updateNavigationLabels,
    displayApiError, clearApiError, displayUpcomingError, clearUpcomingError,
    displayDateJumpError, clearDateJumpError, bindEventListeners, displaySearchResults,
    updatePrintHeader, clearCountryError
} from './ui.js'; // Assuming these are all correctly exported from ui.js
import { renderCalendarView, attachGridListeners } from './calendarGrid.js';
import { updateDayInfoSidebar, displayUpcomingHolidays } from './sidebar.js';
import { formatDateYYYYMMDD } from './utils.js';
// Use specific imports from date-fns (as per user upload)
import { parseISO, isValid, setDate, setMonth, getDate, endOfMonth, getYear, setYear, subWeeks, addWeeks, subMonths, addMonths, startOfWeek, isSameMonth, getMonth as getMonthFn } from 'date-fns';

// --- Core Application Logic ---

/** Fetches holiday data for the current view and renders the main calendar grid */
// (Keep function definition as in user upload)
async function fetchAndRenderGrid() {
    clearApiError();
    await renderCalendarView();
    updatePrintHeader();
}

/** Fetches and updates the upcoming holidays sidebar */
// (Keep function definition as in user upload)
async function updateUpcomingHolidaysDisplay() {
    clearUpcomingError();
    const holidays = await fetchUpcomingLocalHolidays(state.selectedCountry);
    if (holidays !== null) {
        displayUpcomingHolidays(holidays, state.selectedCountry);
    }
}

/** Fetches and populates the list of available countries */
// (Keep function definition as in user upload)
async function loadAndPopulateCountries() {
    clearCountryError();
    populateCountrySelector(null);
    const countries = await fetchAvailableCountries();
    populateCountrySelector(countries);
}

// --- Event Handlers ---

// (Keep function definition as in user upload)
export function handleMonthChange() {
    const newMonth = parseInt(DOM_ELEMENTS.monthSelect.value, 10);
    if (newMonth === state.currentMonth) return;
    const currentFirstOfMonth = new Date(state.currentYear, state.currentMonth, 1);
    const newDateBasis = setMonth(currentFirstOfMonth, newMonth);
    const dayToKeep = state.selectedDate ? getDate(state.selectedDate) : 1;
    const lastDayOfNewMonth = getDate(endOfMonth(newDateBasis));
    const newDay = Math.min(dayToKeep, lastDayOfNewMonth);
    const newSelectedDate = setDate(newDateBasis, newDay);
    updateState({
        currentMonth: newMonth,
        selectedDate: newSelectedDate
    });
    fetchAndRenderGrid();
    updateDayInfoSidebar(state.selectedDate);
}

// (Keep function definition as in user upload - including missing event param if that was original)
// Note: Logic using event.type will fail if event isn't passed by listener binding
export async function handleYearInputChange(event) { // Assuming event *is* intended based on logic
    const inputYear = DOM_ELEMENTS.yearInput.value.trim();
    if (!inputYear) return;
    const year = parseInt(inputYear, 10);
    if (!isNaN(year) && year >= CONFIG.MIN_YEAR && year <= CONFIG.MAX_YEAR) {
        if (year !== state.currentYear) {
            const currentSelectedDate = state.selectedDate || state.today;
            const newDateBasis = setYear(currentSelectedDate, year);
            const lastDayOfNewMonth = getDate(endOfMonth(newDateBasis));
            const newDay = Math.min(getDate(currentSelectedDate), lastDayOfNewMonth);
            const newSelectedDate = setDate(newDateBasis, newDay);
            updateState({
                currentYear: year,
                selectedDate: newSelectedDate
            });
            await fetchAndRenderGrid();
            updateDayInfoSidebar(state.selectedDate);
        }
    } else {
        if (event && event.type === 'change') { // Check event exists before accessing type
            console.warn(`Invalid year input: ${inputYear}. Resetting to ${state.currentYear}`);
            DOM_ELEMENTS.yearInput.value = state.currentYear;
        }
    }
}

// (Keep function definition as in user upload)
export async function handleCountryChange() {
    const newCountry = DOM_ELEMENTS.countrySelect.value;
    if (newCountry === state.selectedCountry) return;
    updateState({ selectedCountry: newCountry });
    clearApiError();
    clearUpcomingError();
    await Promise.all([
        fetchAndRenderGrid(),
        updateUpcomingHolidaysDisplay()
    ]);
    updateDayInfoSidebar(state.selectedDate);
    updatePrintHeader();
}

// (Keep function definition as in user upload)
export async function handleLanguageSwitch() {
    const newLang = DOM_ELEMENTS.langSelect.value;
    if (newLang === state.currentLang) return;
    updateState({ currentLang: newLang });
    translateUI();
    await fetchAndRenderGrid();
    updateDayInfoSidebar(state.selectedDate);
    await updateUpcomingHolidaysDisplay();
}

// (Keep function definition as in user upload)
export function handleThemeChange() {
    const newTheme = DOM_ELEMENTS.themeSelect.value;
    if (newTheme === state.currentTheme) return;
    updateState({ currentTheme: newTheme });
    applyTheme();
}

// (Keep function definition as in user upload)
export function handleWeekStartChange() {
    const newWeekStart = parseInt(DOM_ELEMENTS.weekStartSelect.value, 10);
    if (newWeekStart === state.weekStartsOn) return;
    updateState({ weekStartsOn: newWeekStart });
    const newCurrentWeekStart = startOfWeek(state.selectedDate || state.today, { weekStartsOn: newWeekStart });
    updateState({ currentWeekStart: newCurrentWeekStart });
    translateUI();
    fetchAndRenderGrid();
}

// (Keep function definition as in user upload)
export function handleViewChange() {
    const newView = DOM_ELEMENTS.viewSelect.value;
    if (newView !== state.currentView) {
        updateState({ currentView: newView });
        if (newView === 'week' && !state.currentWeekStart) {
            updateState({ currentWeekStart: startOfWeek(state.selectedDate || state.today, { weekStartsOn: state.weekStartsOn }) });
        }
        populateStaticSelectors();
        updateNavigationLabels();
        fetchAndRenderGrid();
    }
}

// (Keep function definition as in user upload)
export function handleToday() {
    const today = state.today;
    const needsFullRender =
        state.currentView !== 'month' ||
        state.currentYear !== getYear(today) ||
        !isSameMonth(new Date(state.currentYear, state.currentMonth, 1), today);
    updateState({
        selectedDate: today,
        currentYear: getYear(today),
        currentMonth: getMonthFn(today),
        currentWeekStart: startOfWeek(today, { weekStartsOn: state.weekStartsOn }),
        currentView: 'month'
    });
    populateStaticSelectors();
    updateNavigationLabels();
    if (needsFullRender) {
        fetchAndRenderGrid();
    } else {
        const previousSelected = DOM_ELEMENTS.calendarGrid.querySelector(`.${CSS_CLASSES.cellSelected}`);
        if (previousSelected) previousSelected.classList.remove(CSS_CLASSES.cellSelected);
        const todayCell = DOM_ELEMENTS.calendarGrid.querySelector(`[data-date="${formatDateYYYYMMDD(today)}"]`);
        if (todayCell) {
            todayCell.classList.add(CSS_CLASSES.cellSelected);
            todayCell.focus();
        }
    }
    updateDayInfoSidebar(today);
    handleCloseSearchResults(); // Call the function
}

// (Keep function definition as in user upload)
export function handlePrev() {
    let needsRender = true;
    switch (state.currentView) {
        case 'week':
            const prevWeekStart = subWeeks(state.currentWeekStart, 1);
            updateState({ currentWeekStart: prevWeekStart, currentYear: getYear(prevWeekStart) });
            break;
        case 'year':
            const prevYear = state.currentYear - 1;
            if (prevYear >= CONFIG.MIN_YEAR) {
                updateState({ currentYear: prevYear });
            } else needsRender = false;
            break;
        case 'month':
        default:
            const currentFirstOfMonth = new Date(state.currentYear, state.currentMonth, 1);
            const prevMonthDate = subMonths(currentFirstOfMonth, 1);
            updateState({
                currentMonth: getMonthFn(prevMonthDate),
                currentYear: getYear(prevMonthDate)
            });
            break;
    }
    if (needsRender) {
        populateStaticSelectors();
        fetchAndRenderGrid();
    }
    handleCloseSearchResults(); // Call the function
}

// (Keep function definition as in user upload)
export function handleNext() {
    let needsRender = true;
    switch (state.currentView) {
        case 'week':
            const nextWeekStart = addWeeks(state.currentWeekStart, 1);
            updateState({ currentWeekStart: nextWeekStart, currentYear: getYear(nextWeekStart) });
            break;
        case 'year':
            const nextYear = state.currentYear + 1;
            if (nextYear <= CONFIG.MAX_YEAR) {
                updateState({ currentYear: nextYear });
            } else needsRender = false;
            break;
        case 'month':
        default:
            const currentFirstOfMonth = new Date(state.currentYear, state.currentMonth, 1);
            const nextMonthDate = addMonths(currentFirstOfMonth, 1);
            updateState({
                currentMonth: getMonthFn(nextMonthDate),
                currentYear: getYear(nextMonthDate)
            });
            break;
    }
    if (needsRender) {
        populateStaticSelectors();
        fetchAndRenderGrid();
    }
    handleCloseSearchResults(); // Call the function
}

// (Keep function definition as in user upload)
// Note: Logic using event.type will fail if event isn't passed by listener binding
export function handleDateJumpChange(event) { // Assuming event is intended
    const dateValue = event.target.value;
    clearDateJumpError();
    if (!dateValue) return;
    try {
        const jumpedDate = parseISO(dateValue);
        if (!isValid(jumpedDate)) {
            console.warn('Invalid date parsed during jump:', dateValue);
            displayDateJumpError(t('invalidInput'));
            return;
        }
        const jumpYear = getYear(jumpedDate);
        if (jumpYear < CONFIG.MIN_YEAR || jumpYear > CONFIG.MAX_YEAR) {
            displayDateJumpError(t('invalidDateJump', { minYear: CONFIG.MIN_YEAR, maxYear: CONFIG.MAX_YEAR }));
            event.target.value = '';
            return;
        }
        const needsRender =
            state.currentView !== 'month' ||
            state.currentYear !== jumpYear ||
            state.currentMonth !== getMonthFn(jumpedDate);
        updateState({
            selectedDate: jumpedDate,
            currentYear: jumpYear,
            currentMonth: getMonthFn(jumpedDate),
            currentWeekStart: startOfWeek(jumpedDate, { weekStartsOn: state.weekStartsOn }),
            currentView: 'month'
        });
        populateStaticSelectors();
        updateNavigationLabels();
        if (needsRender) {
            fetchAndRenderGrid();
        } else {
            const previousSelected = DOM_ELEMENTS.calendarGrid.querySelector(`.${CSS_CLASSES.cellSelected}`);
            if (previousSelected) previousSelected.classList.remove(CSS_CLASSES.cellSelected);
            const targetCell = DOM_ELEMENTS.calendarGrid.querySelector(`[data-date="${dateValue}"]`);
            if (targetCell) {
                targetCell.classList.add(CSS_CLASSES.cellSelected);
                targetCell.focus();
            }
        }
        updateDayInfoSidebar(jumpedDate);
        handleCloseSearchResults(); // Call the function
    } catch (error) {
        console.error("Error processing jump date:", error);
        displayDateJumpError('Error processing date.');
        if(event && event.target) event.target.value = ''; // Check event/target exist
    }
}

// (Keep function definition as in user upload)
export async function handleSearch() {
    const query = DOM_ELEMENTS.holidaySearchInput.value.trim().toLowerCase();
    updateState({ searchQuery: query });
    if (!query) {
        updateState({ searchResults: [] });
        DOM_ELEMENTS.searchResultsContainer.classList.add(CSS_CLASSES.searchResultsHidden);
        clearSearchHighlights(); // This function needs to be defined/imported
        return;
    }
    const currentSearchYear = state.currentYear;
    const yearsToSearch = [currentSearchYear];
    for (let i = 1; i <= CONFIG.SEARCH_YEAR_RANGE; i++) {
        if (currentSearchYear - i >= CONFIG.MIN_YEAR) yearsToSearch.push(currentSearchYear - i);
        if (currentSearchYear + i <= CONFIG.MAX_YEAR) yearsToSearch.push(currentSearchYear + i);
    }
    const uniqueYears = [...new Set(yearsToSearch)];
    await Promise.all(uniqueYears.map(year => fetchHolidays(year, state.selectedCountry)))
        .catch(fetchError => console.warn("Error fetching some years during search:", fetchError));
    let allResults = [];
    uniqueYears.forEach(year => {
        const holidays = getHolidaysFromCache(state.selectedCountry, year);
        if (!holidays) return;
        for (const dateString in holidays) {
            const holidayInfo = holidays[dateString];
            const date = parseISO(dateString);
            if (!isValid(date)) continue;
            const name = holidayInfo.name || '';
            if (name.toLowerCase().includes(query)) {
                allResults.push({
                    date: date,
                    holidayInfo: holidayInfo,
                    year: year
                });
            }
        }
    });
    allResults.sort((a, b) => a.date - b.date);
    updateState({ searchResults: allResults });
    displaySearchResults(allResults, query);
    applySearchHighlights(allResults); // This function needs to be defined/imported
}

/** Explicitly closes the search results panel */
// *** CORRECTION: Added 'export' keyword ***
export function handleCloseSearchResults() {
    DOM_ELEMENTS.searchResultsContainer.classList.add(CSS_CLASSES.searchResultsHidden);
    clearSearchHighlights(); // This function needs to be defined/imported
    DOM_ELEMENTS.holidaySearchInput.value = '';
    updateState({ searchQuery: '', searchResults: [] });
}

/**
 * Handles click on Year View month header, switching view.
 * @param {number} year
 * @param {number} month
 */
// (Keep function definition as in user upload)
export function handleMonthYearChange(year, month) {
    updateState({
        currentView: 'month',
        currentYear: year,
        currentMonth: month,
        selectedDate: new Date(year, month, 1)
    });
    updateState({ currentWeekStart: startOfWeek(state.selectedDate, { weekStartsOn: state.weekStartsOn }) });
    populateStaticSelectors();
    updateNavigationLabels();
    fetchAndRenderGrid();
    updateDayInfoSidebar(state.selectedDate);
}

// --- Retry Handlers ---

// (Keep function definitions as in user upload)
export function handleRetryHolidays() {
    fetchAndRenderGrid();
}

export function handleRetryUpcoming() {
    updateUpcomingHolidaysDisplay();
}

export function handleRetryCountries() {
    loadAndPopulateCountries();
}

// --- Initialization ---
// (Keep function definition as in user upload)
async function initializeCalendar() {
    loadState();
    applyTheme();
    translateUI();
    bindEventListeners(); // Must be imported from ui.js
    attachGridListeners(); // Must be imported from calendarGrid.js
    await loadAndPopulateCountries();
    await Promise.all([
        fetchAndRenderGrid(),
        updateUpcomingHolidaysDisplay()
    ]);
    updateDayInfoSidebar(state.selectedDate);
    updatePrintHeader();
    console.log("Calendar Initialized. State:", state);
}

// --- Start Application ---
initializeCalendar();

// --- Helper Functions Specific to Main (Consider moving) ---
// (Keep placeholder definitions as in user upload if they existed, or omit if not)
// These likely belong in calendarGrid.js or utils.js and need importing
function clearSearchHighlights() {
    console.warn("clearSearchHighlights called in main.js but should be defined/imported");
    const highlighted = DOM_ELEMENTS.calendarGrid.querySelectorAll(`.${CSS_CLASSES.cellSearchHighlight}`);
    highlighted.forEach(cell => cell.classList.remove(CSS_CLASSES.cellSearchHighlight));
}
function applySearchHighlights(searchResults) {
    console.warn("applySearchHighlights called in main.js but should be defined/imported");
    clearSearchHighlights();
    if (!searchResults || searchResults.length === 0) return;
    const resultsMap = searchResults.reduce((map, item) => {
       if (item && item.date && isValid(item.date)) {
           map[formatDateYYYYMMDD(item.date)] = true;
       }
       return map;
    }, {});
    const cells = DOM_ELEMENTS.calendarGrid.querySelectorAll('[data-date]');
    cells.forEach(cell => {
       if (resultsMap[cell.dataset.date]) {
           cell.classList.add(CSS_CLASSES.cellSearchHighlight);
       }
    });
}