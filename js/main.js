// js/main.js
import { CONFIG, CSS_CLASSES, DOM_ELEMENTS } from './config.js';
import { state, updateState, loadState, getCurrentYearHolidays } from './state.js';
import { t } from './i18n.js';
import { fetchHolidays, fetchUpcomingLocalHolidays } from './api.js';
import { populateSelectors, translateUI, applyTheme, updateNavigationLabels, displayApiError, clearApiError, displayUpcomingError, clearUpcomingError, displayDateJumpError, clearDateJumpError, bindEventListeners, displaySearchResults } from './ui.js';
import { renderCalendarView, attachGridListeners } from './calendarGrid.js';
import { updateDayInfoSidebar, displayUpcomingHolidays } from './sidebar.js';
import { formatDateYYYYMMDD } from './utils.js';

// --- Core Application Logic ---

/** Fetches holiday data and renders the main calendar grid */
async function fetchAndRenderGrid() {
    clearApiError(); // Clear previous errors
    await renderCalendarView(); // Let render handle fetching via fetchHolidays
}

/** Fetches and updates the upcoming holidays sidebar */
async function updateUpcomingHolidaysDisplay() {
    clearUpcomingError(); // Clear previous errors
    // FetchUpcoming handles its own loading/error display
    const holidays = await fetchUpcomingLocalHolidays(state.selectedCountry);
    // displayUpcomingHolidays is called within fetchUpcoming on success/no content
    // or error displayed if holidays === null
     if (holidays !== null) { // Only display if fetch didn't error out
         displayUpcomingHolidays(holidays, state.selectedCountry);
     }
}

// --- Event Handlers ---

export function handleMonthChange() {
    const newMonth = parseInt(DOM_ELEMENTS.monthSelect.value, 10);
    const newDate = dateFns.setDate(state.selectedDate, 1); // Go to 1st to avoid month overflow issues
    const dateWithNewMonth = dateFns.setMonth(newDate, newMonth);

    // Keep day or clamp to last day of new month
    const day = state.selectedDate.getDate();
    const lastDay = dateFns.getDate(dateFns.endOfMonth(dateWithNewMonth));
    const finalDay = Math.min(day, lastDay);
    const finalSelectedDate = dateFns.setDate(dateWithNewMonth, finalDay);

    updateState({
        selectedMonth: newMonth,
        selectedDate: finalSelectedDate
    });
    fetchAndRenderGrid();
    updateDayInfoSidebar(state.selectedDate);
}

export async function handleYearInputChange() {
    const year = parseInt(DOM_ELEMENTS.yearInput.value, 10);
    if (!isNaN(year) && year >= CONFIG.MIN_YEAR && year <= CONFIG.MAX_YEAR) {
        if (year !== state.currentYear) {
            const newDate = dateFns.setYear(state.selectedDate, year);
             // Clamp day if needed (e.g., Feb 29)
            const lastDay = dateFns.getDate(dateFns.endOfMonth(newDate));
            const finalDay = Math.min(newDate.getDate(), lastDay);
            const finalSelectedDate = dateFns.setDate(newDate, finalDay);

            updateState({
                currentYear: year,
                selectedDate: finalSelectedDate // Update selected date's year too
            });
            await fetchAndRenderGrid(); // Fetch new year's holidays
             updateDayInfoSidebar(state.selectedDate);
        }
    } else {
        // Reset input to current valid year if invalid
        DOM_ELEMENTS.yearInput.value = state.currentYear;
        // Optionally show an error message
    }
}

export async function handleCountryChange() {
    const newCountry = DOM_ELEMENTS.countrySelect.value;
    updateState({ selectedCountry: newCountry });
    // No need to reset date/year/month when country changes
    await Promise.all([
        fetchAndRenderGrid(), // Refetch holidays for new country
        updateUpcomingHolidaysDisplay() // Refetch upcoming for new country
    ]);
     updateDayInfoSidebar(state.selectedDate); // Update sidebar with potentially different holidays
}

export async function handleLanguageSwitch() {
    const newLang = DOM_ELEMENTS.langSelect.value;
    updateState({ currentLang: newLang });
    translateUI(); // Update all text elements, selectors, weekday headers
    // Re-render grid for ARIA labels and translated holiday names (if any in grid)
    await fetchAndRenderGrid(); // Data should be cached, just re-renders
    // Re-render sidebar infos with new language
    updateDayInfoSidebar(state.selectedDate);
    await updateUpcomingHolidaysDisplay(); // Re-render upcoming with new lang
}

export function handleThemeChange() {
    const newTheme = DOM_ELEMENTS.themeSelect.value;
    updateState({ currentTheme: newTheme });
    applyTheme();
}

export function handleViewChange() {
    const newView = DOM_ELEMENTS.viewSelect.value;
    if (newView !== state.currentView) {
        updateState({ currentView: newView });

        if (newView === 'week' && !state.currentWeekStart) {
             // Initialize week start if switching to week view
             updateState({ currentWeekStart: dateFns.startOfWeek(state.selectedDate, { weekStartsOn: 0 }) });
        }

        populateSelectors(); // Update month/year input visibility
        updateNavigationLabels(); // Update prev/next button aria-labels
        fetchAndRenderGrid(); // Re-render the grid for the new view
    }
}

export function handleToday() {
    const today = state.today;
    const needsRender = !dateFns.isSameMonth(today, new Date(state.currentYear, state.currentMonth, 1)) ||
                        today.getFullYear() !== state.currentYear ||
                        state.currentView !== 'month'; // Always switch to month view on 'Today'

    updateState({
        selectedDate: today,
        currentYear: today.getFullYear(),
        currentMonth: today.getMonth(),
        currentWeekStart: dateFns.startOfWeek(today, { weekStartsOn: 0 }),
        currentView: 'month' // Go to month view
    });
    populateSelectors(); // Update selectors to reflect today's date/view
    updateNavigationLabels();
    if (needsRender) {
        fetchAndRenderGrid(); // Re-render if month/year changed
    } else {
        // Just update selection visually if already on the correct month view
        const previousSelected = DOM_ELEMENTS.calendarGrid.querySelector(`.${CSS_CLASSES.selectedDay}`);
         if (previousSelected) previousSelected.classList.remove(CSS_CLASSES.selectedDay);
         const todayCell = DOM_ELEMENTS.calendarGrid.querySelector(`[data-date="${formatDateYYYYMMDD(today)}"]`);
         if (todayCell) todayCell.classList.add(CSS_CLASSES.selectedDay);
    }
     updateDayInfoSidebar(today);
}

// --- Navigation Handler ---
export function handlePrev() {
    let newDate;
     let needsRender = true;
    switch (state.currentView) {
        case 'week':
            newDate = dateFns.subWeeks(state.currentWeekStart, 1);
            updateState({ currentWeekStart: newDate, currentYear: newDate.getFullYear() });
            break;
        case 'year':
            if (state.currentYear > CONFIG.MIN_YEAR) {
                updateState({ currentYear: state.currentYear - 1 });
            } else needsRender = false;
            break;
        case 'month':
        default:
            newDate = dateFns.subMonths(new Date(state.currentYear, state.currentMonth, 1), 1);
            updateState({
                currentMonth: newDate.getMonth(),
                currentYear: newDate.getFullYear()
            });
            break;
    }
    if(needsRender) {
        populateSelectors(); // Update year/month display
        fetchAndRenderGrid();
    }
}

export function handleNext() {
     let newDate;
     let needsRender = true;
    switch (state.currentView) {
        case 'week':
            newDate = dateFns.addWeeks(state.currentWeekStart, 1);
             updateState({ currentWeekStart: newDate, currentYear: newDate.getFullYear() });
            break;
        case 'year':
            if (state.currentYear < CONFIG.MAX_YEAR) {
                updateState({ currentYear: state.currentYear + 1 });
            } else needsRender = false;
            break;
        case 'month':
        default:
             newDate = dateFns.addMonths(new Date(state.currentYear, state.currentMonth, 1), 1);
            updateState({
                currentMonth: newDate.getMonth(),
                currentYear: newDate.getFullYear()
            });
            break;
    }
     if(needsRender) {
        populateSelectors(); // Update year/month display
        fetchAndRenderGrid();
    }
}


export function handleDateJumpChange(event) {
    const dateValue = event.target.value;
    clearDateJumpError();
    if (!dateValue) return;

    try {
        const jumpedDate = dateFns.parseISO(dateValue); // YYYY-MM-DD

        if (!dateFns.isValid(jumpedDate)) {
             console.warn('Invalid date parsed during jump:', dateValue);
             displayDateJumpError('Invalid date format.'); // Basic error
             return;
        }
        jumpedDate.setHours(0, 0, 0, 0); // Ensure midnight

        const jumpYear = jumpedDate.getFullYear();
        if (jumpYear < CONFIG.MIN_YEAR || jumpYear > CONFIG.MAX_YEAR) {
            displayDateJumpError(t('invalidDateJump', { minYear: CONFIG.MIN_YEAR, maxYear: CONFIG.MAX_YEAR }));
            // Don't clear input here, let user correct it
            return;
        }

        const needsRender = !dateFns.isSameMonth(jumpedDate, new Date(state.currentYear, state.currentMonth, 1)) ||
                            jumpYear !== state.currentYear ||
                            state.currentView !== 'month'; // Always switch to month view

        updateState({
            selectedDate: jumpedDate,
            currentYear: jumpYear,
            currentMonth: jumpedDate.getMonth(),
            currentWeekStart: dateFns.startOfWeek(jumpedDate, { weekStartsOn: 0 }),
            currentView: 'month' // Jump always goes to month view
        });
        populateSelectors();
         updateNavigationLabels();
        if(needsRender) {
            fetchAndRenderGrid(); // This also updates sidebar via selection
        } else {
            // Already on correct month view, just update selection
             const previousSelected = DOM_ELEMENTS.calendarGrid.querySelector(`.${CSS_CLASSES.selectedDay}`);
             if (previousSelected) previousSelected.classList.remove(CSS_CLASSES.selectedDay);
             const targetCell = DOM_ELEMENTS.calendarGrid.querySelector(`[data-date="${dateValue}"]`);
             if (targetCell) targetCell.classList.add(CSS_CLASSES.selectedDay);
        }
         updateDayInfoSidebar(jumpedDate);


    } catch (error) {
        console.error("Error processing jump date:", error);
        displayDateJumpError('Error processing date.'); // Generic error
        // Optionally clear input: DOM_ELEMENTS.dateJumpInput.value = '';
    }
}

export async function handleSearch() {
    const query = DOM_ELEMENTS.holidaySearchInput.value.trim().toLowerCase();
    updateState({ searchQuery: query, searchResults: [] }); // Clear previous results immediately

    if (!query) {
        DOM_ELEMENTS.searchResultsContainer.hidden = true;
         clearSearchHighlights(); // Clear highlights when search is cleared
        return;
    }

    // Search requires holiday data. Ensure current year is loaded.
    // For multi-year search, you'd need to fetch/check more years.
    const holidays = await fetchHolidays(state.currentYear, state.selectedCountry);
    let results = [];

    for (const dateString in holidays) {
        const holidayInfo = holidays[dateString];
        const date = dateFns.parseISO(dateString);
        const name = holidayInfo.name || '';
        const translatedName = getTranslatedHolidayName(dateString, name); // Search translated name too

        if (name.toLowerCase().includes(query) || translatedName.toLowerCase().includes(query)) {
             results.push({ date: date, holidayInfo: holidayInfo });
        }
    }

    // Sort results by date
    results.sort((a, b) => a.date - b.date);

    updateState({ searchResults: results });
    displaySearchResults(results, query);
    applySearchHighlights(results); // Highlight results on grid
}

export function handleCloseSearchResults() {
     DOM_ELEMENTS.searchResultsContainer.hidden = true;
     clearSearchHighlights();
     // Optionally clear the search input
     // DOM_ELEMENTS.holidaySearchInput.value = '';
     // updateState({ searchQuery: '', searchResults: [] });
}

// --- Retry Handlers ---
export function handleRetryHolidays() {
     fetchAndRenderGrid(); // Re-trigger the fetch and render process
}

export function handleRetryUpcoming() {
     updateUpcomingHolidaysDisplay(); // Re-trigger the upcoming fetch process
}


// --- Initialization ---
async function initializeCalendar() {
    // 1. Load persisted state (Theme, Lang, Country, Date, View)
    loadState();

    // 2. Apply initial theme (before rendering)
    applyTheme();

    // 3. Set initial UI states (Selectors, Text) based on loaded state
    translateUI(); // Includes populateSelectors and updateWeekdayHeaders

    // 4. Bind event listeners
    bindEventListeners();
    attachGridListeners(); // Attach grid listeners initially

    // 5. Initial data fetch and render
    // Use Promise.all to fetch grid/upcoming holidays concurrently
    await Promise.all([
        fetchAndRenderGrid(), // Fetches holidays needed for the current view and renders
        updateUpcomingHolidaysDisplay() // Fetches and displays upcoming holidays
    ]);

     // 6. Update sidebar for the initially selected date
    updateDayInfoSidebar(state.selectedDate);

    console.log("Calendar Initialized. State:", state);
}

// --- Start Application ---
initializeCalendar();

// Helpers (potentially move to ui.js or keep here if specific to main handlers)
function clearSearchHighlights() {
     const highlighted = DOM_ELEMENTS.calendarGrid.querySelectorAll(`.${CSS_CLASSES.searchHighlight}`);
    highlighted.forEach(cell => cell.classList.remove(CSS_CLASSES.searchHighlight));
}

function applySearchHighlights(searchResults) {
     clearSearchHighlights();
     const resultsMap = searchResults.reduce((map, item) => {
        map[formatDateYYYYMMDD(item.date)] = true;
        return map;
    }, {});

    const cells = DOM_ELEMENTS.calendarGrid.querySelectorAll('[data-date]');
    cells.forEach(cell => {
        if (resultsMap[cell.dataset.date]) {
            cell.classList.add(CSS_CLASSES.searchHighlight);
        }
    });
}
