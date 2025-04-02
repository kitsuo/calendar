// js/calendarGrid.js
import { CONFIG, CSS_CLASSES, DOM_ELEMENTS } from './config.js';
import { state, updateState } from './state.js'; // Removed: getCurrentYearHolidays (use state directly or fetch)
import { t, getTranslatedHolidayName, translateHolidayType, i18n } from './i18n.js';
import { formatDateYYYYMMDD, getWeekNumber, createDocumentFragment } from './utils.js';
import { updateDayInfoSidebar } from './sidebar.js';
import { fetchHolidays } from './api.js'; // Needed for fetching holidays
import { handleViewChange } from './main.js'; // Needed for year view click -> month view
import { updateWeekdayHeaders } from './ui.js'; // Needed for updating headers on render

// Assume dateFns is globally available from CDN script in index.html
// If using modules for date-fns, import necessary functions here.
const { parseISO, isValid: isValidDate, startOfMonth, endOfMonth, startOfWeek, endOfWeek, getDate, getDay, addDays, subDays, getISOWeek, isSameDay, setHours: setDateHours, parse: parseDate, format: formatDate } = dateFns;

let gridKeydownHandler = null; // To store the keydown listener reference

// --- Rendering Functions ---

/**
 * Renders the calendar grid based on the current view.
 */
export async function renderCalendarView() {
    DOM_ELEMENTS.calendarGrid.innerHTML = ''; // Clear previous grid
    DOM_ELEMENTS.calendarGrid.className = `calendar-grid ${state.currentView}-view`; // Set view class
    DOM_ELEMENTS.calendarGrid.removeAttribute('aria-label'); // Clear old label

    // Clear previous search highlights
    clearSearchHighlights();

    // Update weekday headers based on view
    updateWeekdayHeaders();

    let holidays = {};
    try {
        // Fetch holidays for the *current* year being viewed
        // For week view, it might span across year boundaries, but fetchHolidays fetches yearly anyway
        holidays = await fetchHolidays(state.currentYear, state.selectedCountry);
        // If week view spans years, fetch the other year too if needed (simplified for now)
        if (state.currentView === 'week' && state.currentWeekStart) {
             const endOfWeekDate = addDays(state.currentWeekStart, 6);
             if (endOfWeekDate.getFullYear() !== state.currentYear) {
                 const otherYearHolidays = await fetchHolidays(endOfWeekDate.getFullYear(), state.selectedCountry);
                 // Note: holidays variable here only holds currentYear's data. Logic below needs to check correct year.
             }
        }

    } catch (error) {
        console.error("Error fetching holidays for grid render:", error);
        // Render grid without holiday info if fetch fails
    }


    switch (state.currentView) {
        case 'week':
            renderWeekView(state.currentWeekStart); // Pass start date, holidays checked inside from state cache
            break;
        case 'year':
            renderYearView(state.currentYear, holidays); // Pass year and fetched holidays for that year
            break;
        case 'month':
        default:
            renderMonthView(state.currentYear, state.currentMonth, holidays); // Pass year, month, and fetched holidays
            break;
    }

    // Re-apply search highlights if needed
    if (state.searchResults && state.searchResults.length > 0) {
        applySearchHighlights(state.searchResults);
    }

     // Attach event listeners after rendering
    attachGridListeners();
}

/**
 * Renders the Month View grid CORRECTLY.
 * @param {number} year
 * @param {number} month - 0-indexed month.
 * @param {object} holidays - Holiday data map { dateString: holidayInfo } for the specified year.
 */
function renderMonthView(year, month, holidays = {}) {
    const firstDayOfMonth = startOfMonth(new Date(year, month, 1));
    const lastDayOfMonth = endOfMonth(firstDayOfMonth);
    const firstDayWeekday = getDay(firstDayOfMonth); // 0 (Sun) - 6 (Sat)
    const lastDayDate = getDate(lastDayOfMonth);

    // Calculate the number of weeks needed to display the month
    const numWeeks = Math.ceil((firstDayWeekday + lastDayDate) / 7);
    // Calculate total grid items needed (Week Number + 7 Days) * Number of Weeks
    const totalItemsInGrid = numWeeks * 8;

    const daysInPrevMonth = getDate(subDays(firstDayOfMonth, 1));

    const gridLabel = t('gridLabelMonth', { month: i18n[state.currentLang].monthNames[month], year });
    DOM_ELEMENTS.calendarGrid.setAttribute('aria-label', gridLabel);
    DOM_ELEMENTS.calendarGrid.innerHTML = ''; // Clear previous grid content

    const fragment = document.createDocumentFragment();
    let currentDayInMonth = 1; // Tracks the actual day number of the current month

    for (let i = 0; i < totalItemsInGrid; i++) {

        // --- Add Week Number Cell (first item in every set of 8) ---
        if (i % 8 === 0) {
            const weekIndex = Math.floor(i / 8);
            const startDayIndexOfWeek = weekIndex * 7;
            let representativeDay;

            if (startDayIndexOfWeek < firstDayWeekday) {
                 representativeDay = addDays(firstDayOfMonth, -(firstDayWeekday - startDayIndexOfWeek));
            } else {
                 const dayInCurrentMonth = startDayIndexOfWeek - firstDayWeekday + 1;
                 representativeDay = new Date(year, month, dayInCurrentMonth);
                 // Ensure representative day doesn't go beyond last day for week calc
                 if(dayInCurrentMonth > lastDayDate) representativeDay = lastDayOfMonth;
            }

            // Use date-fns getISOWeek for ISO 8601 week number
            const weekNum = getISOWeek(representativeDay);
            const weekNumberCell = document.createElement('div');
            weekNumberCell.classList.add(CSS_CLASSES.weekNumber);
            weekNumberCell.textContent = weekNum;
            weekNumberCell.setAttribute('role', 'rowheader');
            weekNumberCell.setAttribute('aria-label', t('weekLabel', { weekNum }));
            fragment.appendChild(weekNumberCell); // Append DIRECTLY to fragment
            continue; // Move to the next grid item index
        }

        // --- Add Day Cell ---
        const dayCell = document.createElement('div');
        dayCell.classList.add(CSS_CLASSES.dayCell);
        dayCell.setAttribute('role', 'gridcell');

        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.classList.add(CSS_CLASSES.dayNumber);

        let cellDate;
        let isCurrentMonth = false;

        // Calculate the effective index within the 7-day portion of the grid
        // Subtract week numbers already placed: Math.floor((i + 7) / 8) is number of week cells before or at index i
        const dayGridIndex = i - Math.floor((i + 7) / 8);

        // Previous month's days
        if (dayGridIndex < firstDayWeekday) {
            const prevMonthDay = daysInPrevMonth - firstDayWeekday + dayGridIndex + 1;
            dayNumberSpan.textContent = prevMonthDay;
            dayCell.classList.add(CSS_CLASSES.otherMonth);
            dayCell.setAttribute('aria-disabled', 'true');
            cellDate = subDays(firstDayOfMonth, firstDayWeekday - dayGridIndex);
        }
        // Current month's days
        else if (currentDayInMonth <= lastDayDate) {
            isCurrentMonth = true;
            dayNumberSpan.textContent = currentDayInMonth;
            cellDate = new Date(year, month, currentDayInMonth);

            const dateString = formatDateYYYYMMDD(cellDate);
            const isToday = isSameDay(cellDate, state.today);
            const isSelected = state.selectedDate && isSameDay(cellDate, state.selectedDate);
            // Use the passed holidays object for the current year
            const holidayInfo = holidays[dateString];

            let ariaLabel = '';
            try {
                const formatter = new Intl.DateTimeFormat(state.currentLang, { dateStyle: 'full' });
                ariaLabel = formatter.format(cellDate);
            } catch (e) {
                ariaLabel = `${i18n[state.currentLang].monthNames[month]} ${currentDayInMonth}, ${year}`;
            }

            if (isToday) { dayCell.classList.add(CSS_CLASSES.today); ariaLabel += `, ${t('today')}`; }
            if (isSelected) { dayCell.classList.add(CSS_CLASSES.selectedDay); ariaLabel += `, ${t('selected')}`; }
            if (holidayInfo) {
                dayCell.classList.add(CSS_CLASSES.holiday);
                const typeClass = `${CSS_CLASSES.holidayTypePrefix}${holidayInfo.type || 'Unknown'}`.replace(/\s+/g, '-');
                dayCell.classList.add(typeClass);
                const holidayNameSpan = document.createElement('span');
                holidayNameSpan.classList.add(CSS_CLASSES.gridHolidayName);
                const translatedName = getTranslatedHolidayName(dateString, holidayInfo.name);
                holidayNameSpan.textContent = translatedName;
                holidayNameSpan.title = translatedName;
                dayCell.appendChild(holidayNameSpan);
                const translatedType = translateHolidayType(holidayInfo.type);
                const typeText = holidayInfo.type ? t('holidayType', { type: translatedType }) : t('publicHoliday');
                ariaLabel += `, ${typeText}, ${translatedName}`;
            }

            dayCell.dataset.date = dateString;
            dayCell.setAttribute('tabindex', '0');
            dayCell.setAttribute('aria-label', ariaLabel);

            currentDayInMonth++; // Increment the counter ONLY for current month days
        }
        // Next month's days
        else {
            const nextMonthDay = currentDayInMonth - lastDayDate;
            dayNumberSpan.textContent = nextMonthDay;
            dayCell.classList.add(CSS_CLASSES.otherMonth);
            dayCell.setAttribute('aria-disabled', 'true');
            cellDate = addDays(lastDayOfMonth, nextMonthDay);
            currentDayInMonth++; // Still need to increment counter to fill grid
        }

         // Set hours to 0 to avoid timezone issues in comparisons
        if (cellDate) setDateHours(cellDate, 0,0,0,0);

        dayCell.prepend(dayNumberSpan);
        fragment.appendChild(dayCell); // Append day cell DIRECTLY to fragment
    } // End for loop

    DOM_ELEMENTS.calendarGrid.appendChild(fragment);
}


/**
 * Renders the Week View grid CORRECTLY.
 * @param {Date} weekStartDate - The starting date of the week (passed from state).
 */
function renderWeekView(weekStartDate) {
     if (!weekStartDate || !isValidDate(weekStartDate)) {
        console.error("Invalid weekStartDate for renderWeekView");
        weekStartDate = startOfWeek(state.selectedDate || state.today, { weekStartsOn: 0 }); // Default/Fallback
        updateState({ currentWeekStart: weekStartDate });
    }

    const gridLabel = t('gridLabelWeek', { date: formatDate(weekStartDate, 'PPP', { locale: getDateFnsLocale() }) });
    DOM_ELEMENTS.calendarGrid.setAttribute('aria-label', gridLabel);
    DOM_ELEMENTS.calendarGrid.innerHTML = ''; // Clear grid

    const fragment = document.createDocumentFragment();

    // --- Add Week Number Cell ---
    const weekNum = getISOWeek(weekStartDate); // Use ISO week number
    const weekNumberCell = document.createElement('div');
    weekNumberCell.classList.add(CSS_CLASSES.weekNumber);
    weekNumberCell.textContent = weekNum;
    weekNumberCell.setAttribute('role', 'rowheader');
    weekNumberCell.setAttribute('aria-label', t('weekLabel', { weekNum }));
    fragment.appendChild(weekNumberCell); // Append DIRECTLY

    // --- Add Day Cells ---
    for (let i = 0; i < 7; i++) {
        const cellDate = addDays(weekStartDate, i);
        setDateHours(cellDate, 0,0,0,0); // Ensure midnight
        const dayCell = document.createElement('div');
        dayCell.classList.add(CSS_CLASSES.dayCell);
        dayCell.setAttribute('role', 'gridcell');

        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.classList.add(CSS_CLASSES.dayNumber);
        dayNumberSpan.textContent = getDate(cellDate);

        const dateString = formatDateYYYYMMDD(cellDate);
        const isToday = isSameDay(cellDate, state.today);
        const isSelected = state.selectedDate && isSameDay(cellDate, state.selectedDate);

        // Get holidays for the specific year of the cell being rendered
        const yearOfCell = cellDate.getFullYear();
        const holidaysForCellYear = state.holidaysCache[state.selectedCountry]?.[yearOfCell] || {};
        const holidayInfo = holidaysForCellYear[dateString];

        let ariaLabel = '';
         try {
             const formatter = new Intl.DateTimeFormat(state.currentLang, { dateStyle: 'full' });
             ariaLabel = formatter.format(cellDate);
         } catch (e) {
             ariaLabel = formatDate(cellDate, 'PPPP', { locale: getDateFnsLocale() }); // Fallback format
         }


        if (isToday) {
            dayCell.classList.add(CSS_CLASSES.today);
            ariaLabel += `, ${t('today')}`;
        }
        if (isSelected) {
            dayCell.classList.add(CSS_CLASSES.selectedDay);
            ariaLabel += `, ${t('selected')}`;
        }
        if (holidayInfo) {
            dayCell.classList.add(CSS_CLASSES.holiday);
            const typeClass = `${CSS_CLASSES.holidayTypePrefix}${holidayInfo.type || 'Unknown'}`.replace(/\s+/g, '-');
            dayCell.classList.add(typeClass);

            const holidayNameSpan = document.createElement('span');
            holidayNameSpan.classList.add(CSS_CLASSES.gridHolidayName);
            const translatedName = getTranslatedHolidayName(dateString, holidayInfo.name);
            holidayNameSpan.textContent = translatedName;
            holidayNameSpan.title = translatedName;
            dayCell.appendChild(holidayNameSpan); // Append name

            const translatedType = translateHolidayType(holidayInfo.type);
            const typeText = holidayInfo.type ? t('holidayType', { type: translatedType }) : t('publicHoliday');
             ariaLabel += `, ${typeText}, ${translatedName}`;
        }

        dayCell.dataset.date = dateString;
        dayCell.setAttribute('tabindex', '0');
        dayCell.setAttribute('aria-label', ariaLabel);

        dayCell.prepend(dayNumberSpan); // Prepend number
        fragment.appendChild(dayCell); // Append DIRECTLY
    }

     DOM_ELEMENTS.calendarGrid.appendChild(fragment);
}

/**
 * Renders the Year View grid.
 * @param {number} year
 * @param {object} holidays - Holiday data map { dateString: holidayInfo } for the entire year.
 */
function renderYearView(year, holidays = {}) {
    const gridLabel = t('gridLabelYear', { year });
    DOM_ELEMENTS.calendarGrid.setAttribute('aria-label', gridLabel);
    DOM_ELEMENTS.calendarGrid.innerHTML = ''; // Clear grid

    const fragment = document.createDocumentFragment();
    const miniWeekdays = i18n[state.currentLang].weekdaysMini;

    for (let month = 0; month < 12; month++) {
        const monthContainer = document.createElement('div');
        monthContainer.classList.add('month-container');

        // --- Month Header ---
        const monthHeader = document.createElement('div');
        monthHeader.classList.add('month-header-year-view');
        monthHeader.textContent = i18n[state.currentLang].monthNames[month];
        monthContainer.appendChild(monthHeader);

        // --- Mini Weekday Headers ---
        const miniWeekdaysDiv = document.createElement('div');
        miniWeekdaysDiv.classList.add('mini-calendar-weekdays');
        miniWeekdays.forEach(wd => {
            const wdDiv = document.createElement('div');
            wdDiv.textContent = wd;
            miniWeekdaysDiv.appendChild(wdDiv);
        });
        monthContainer.appendChild(miniWeekdaysDiv);

        // --- Mini Calendar Grid ---
        const miniGrid = document.createElement('div');
        miniGrid.classList.add('mini-calendar-grid');

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = endOfMonth(firstDayOfMonth);
        const firstDayWeekday = getDay(firstDayOfMonth);
        const lastDayDate = getDate(lastDayOfMonth);
        const numWeeks = Math.ceil((firstDayWeekday + lastDayDate) / 7);
        const daysInGrid = numWeeks * 7; // Total cells for days in this mini-month

        let dayCounter = 1;
        const daysInPrevMonth = getDate(subDays(firstDayOfMonth, 1));

        for (let i = 0; i < daysInGrid; i++) {
            const monthCell = document.createElement('div');
            monthCell.classList.add(CSS_CLASSES.monthCell); // Use specific class
            monthCell.setAttribute('role', 'gridcell');

            let cellDate;
            let isCurrentMonth = false;

            // Previous month
            if (i < firstDayWeekday) {
                 const prevMonthDay = daysInPrevMonth - firstDayWeekday + i + 1;
                 monthCell.textContent = prevMonthDay;
                 monthCell.classList.add(CSS_CLASSES.otherMonth);
                 monthCell.setAttribute('aria-disabled', 'true');
                 cellDate = subDays(firstDayOfMonth, firstDayWeekday - i);
            }
            // Current month
            else if (dayCounter <= lastDayDate) {
                isCurrentMonth = true;
                monthCell.textContent = dayCounter;
                cellDate = new Date(year, month, dayCounter);

                const dateString = formatDateYYYYMMDD(cellDate);
                const isToday = isSameDay(cellDate, state.today);
                const isSelected = state.selectedDate && isSameDay(cellDate, state.selectedDate);
                const holidayInfo = holidays[dateString];

                // Add classes for styling
                if (isToday) monthCell.classList.add(CSS_CLASSES.today);
                if (isSelected) monthCell.classList.add(CSS_CLASSES.selectedDay);
                if (holidayInfo) {
                     monthCell.classList.add(CSS_CLASSES.holiday);
                     const typeClass = `${CSS_CLASSES.holidayTypePrefix}${holidayInfo.type || 'Unknown'}`.replace(/\s+/g, '-');
                     monthCell.classList.add(typeClass);
                     monthCell.setAttribute('title', getTranslatedHolidayName(dateString, holidayInfo.name)); // Tooltip for holiday name
                 }

                monthCell.dataset.date = dateString;
                monthCell.setAttribute('tabindex', '0'); // Focusable
                monthCell.setAttribute('aria-label', formatDate(cellDate, 'PPP', { locale: getDateFnsLocale() })); // Simple date label

                dayCounter++;
            }
             // Next month
             else {
                 const nextMonthDay = dayCounter - lastDayDate;
                 monthCell.textContent = nextMonthDay;
                 monthCell.classList.add(CSS_CLASSES.otherMonth);
                 monthCell.setAttribute('aria-disabled', 'true');
                 cellDate = addDays(lastDayOfMonth, nextMonthDay);
                 dayCounter++;
             }
             if (cellDate) setDateHours(cellDate, 0,0,0,0);

             miniGrid.appendChild(monthCell);
        }

        monthContainer.appendChild(miniGrid);
        fragment.appendChild(monthContainer);
    }
    DOM_ELEMENTS.calendarGrid.appendChild(fragment);
}


// --- Event Handling ---

/**
 * Handles clicks within the calendar grid (delegated).
 * Optimizes selection updates by directly manipulating classes.
 * @param {Event} event
 */
function handleCalendarClick(event) {
    const target = event.target.closest(`.${CSS_CLASSES.dayCell}:not(.${CSS_CLASSES.otherMonth}), .${CSS_CLASSES.monthCell}:not(.${CSS_CLASSES.otherMonth})`);

    if (target && target.dataset.date) {
        // Use date-fns parseISO which expects yyyy-MM-dd correctly
        const newSelectedDate = parseISO(target.dataset.date);
        // Ensure date is valid after parsing
        if (!isValidDate(newSelectedDate)){
             console.error("Invalid date clicked:", target.dataset.date);
             return;
         }
        setDateHours(newSelectedDate, 0, 0, 0, 0); // Ensure time is at midnight


        if (!state.selectedDate || !isSameDay(newSelectedDate, state.selectedDate)) {
            // 1. Remove previous selection class
            const previousSelected = DOM_ELEMENTS.calendarGrid.querySelector(`.${CSS_CLASSES.selectedDay}`);
            if (previousSelected) {
                previousSelected.classList.remove(CSS_CLASSES.selectedDay);
                // Update ARIA label of previously selected cell
                 updateCellAriaLabel(previousSelected, false);
            }

            // 2. Add new selection class
            target.classList.add(CSS_CLASSES.selectedDay);
            // Update ARIA label of newly selected cell
            updateCellAriaLabel(target, true);

            // 3. Update state
            updateState({ selectedDate: newSelectedDate });

            // 4. Update sidebar info
            updateDayInfoSidebar(newSelectedDate);
        }
         // If year view was clicked, switch to month view for that date
         if(state.currentView === 'year') {
            updateState({
                currentView: 'month',
                currentYear: newSelectedDate.getFullYear(),
                currentMonth: newSelectedDate.getMonth()
            });
            handleViewChange(); // Trigger UI update and re-render
            // Note: handleViewChange needs to be imported or passed correctly
            DOM_ELEMENTS.searchResultsContainer.hidden = true; // Close results if open
        }
    }
}

/**
 * Handles keyboard navigation within the calendar grid.
 * @param {KeyboardEvent} event
 */
function handleGridKeyDown(event) {
    const { key, target } = event;
    const isCell = target.matches(`.${CSS_CLASSES.dayCell}:not(.${CSS_CLASSES.otherMonth}), .${CSS_CLASSES.monthCell}:not(.${CSS_CLASSES.otherMonth})`);

    if (!isCell) return;

    // Handle Enter/Space for selection
    if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        handleCalendarClick({ target: target }); // Simulate a click event for selection
        return;
    }

    // Handle Arrow keys for focus movement
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        return;
    }
    event.preventDefault();

    const focusableCells = Array.from(
        DOM_ELEMENTS.calendarGrid.querySelectorAll(`.${CSS_CLASSES.dayCell}:not(.${CSS_CLASSES.otherMonth})[tabindex="0"], .${CSS_CLASSES.monthCell}:not(.${CSS_CLASSES.otherMonth})[tabindex="0"]`)
    );

    const currentIndex = focusableCells.indexOf(target);
    if (currentIndex === -1) return;

    let nextIndex = -1;
    let numColumns = (state.currentView === 'month' || state.currentView === 'week') ? 8 : 7; // 8 for month/week (inc Wk), 7 for year mini-grid

    if (state.currentView === 'year') {
        // Navigation within the year view (mini-grids)
        numColumns = 7; // Mini-grid always 7 wide
        const parentMiniGrid = target.closest('.mini-calendar-grid');
        if (!parentMiniGrid) return; // Should not happen if target is month-cell

        const cellsInMiniGrid = Array.from(parentMiniGrid.querySelectorAll(`.${CSS_CLASSES.monthCell}`));
        const miniIndex = cellsInMiniGrid.indexOf(target);
        if(miniIndex === -1) return;

        switch (key) {
            case 'ArrowLeft':
                nextIndex = (miniIndex % numColumns !== 0) ? currentIndex - 1 : -1; break;
            case 'ArrowRight':
                nextIndex = (miniIndex % numColumns !== numColumns - 1) ? currentIndex + 1 : -1; break;
            case 'ArrowUp':
                // Try moving up within the same mini-grid
                nextIndex = currentIndex - numColumns;
                 // If moving up goes outside current mini-grid, try finding cell in month above
                 if (nextIndex < 0 || !parentMiniGrid.contains(focusableCells[nextIndex])) {
                     // Complex: find corresponding cell in month above - simplified for now
                     nextIndex = -1; // Or focus month header?
                 }
                break;
            case 'ArrowDown':
                 // Try moving down within the same mini-grid
                 nextIndex = currentIndex + numColumns;
                  // If moving down goes outside current mini-grid, try finding cell in month below
                 if (nextIndex >= focusableCells.length || !parentMiniGrid.contains(focusableCells[nextIndex])) {
                     // Complex: find corresponding cell in month below - simplified for now
                     nextIndex = -1;
                 }
                break;
        }
        // Basic boundary check needed if complex jumps implemented
        // if (nextIndex < 0 || nextIndex >= focusableCells.length) nextIndex = -1;

    } else {
         // Month/Week View (8 columns including Week number)
         numColumns = 8;
         switch (key) {
             case 'ArrowLeft': nextIndex = currentIndex - 1; break;
             case 'ArrowRight': nextIndex = currentIndex + 1; break;
             case 'ArrowUp': nextIndex = currentIndex - numColumns; break;
             case 'ArrowDown': nextIndex = currentIndex + numColumns; break;
         }
         // Boundary checks for month/week view
         if (nextIndex < 0 || nextIndex >= focusableCells.length) {
             nextIndex = -1;
         } else if (key === 'ArrowLeft' && currentIndex % numColumns === 0) {
             nextIndex = -1; // Don't wrap left
         } else if (key === 'ArrowRight' && currentIndex % numColumns === numColumns - 1) {
             nextIndex = -1; // Don't wrap right
         }
    }


    if (nextIndex !== -1 && nextIndex < focusableCells.length && focusableCells[nextIndex]) {
        focusableCells[nextIndex].focus();
    }
}


/**
 * Updates the ARIA label of a cell to include/exclude the "Selected" state.
 * @param {HTMLElement} cellElement - The cell element.
 * @param {boolean} isSelected - Whether the cell is now selected.
 */
function updateCellAriaLabel(cellElement, isSelected) {
     if (!cellElement) return;
     let currentLabel = cellElement.getAttribute('aria-label') || '';
     const selectedText = `, ${t('selected')}`; // Use translation helper

     // Remove existing selected state text
     currentLabel = currentLabel.replace(selectedText, '');

     if (isSelected) {
         // Add selected state text
         currentLabel += selectedText;
     }

     cellElement.setAttribute('aria-label', currentLabel);
}

/**
 * Attaches or re-attaches event listeners to the grid.
 */
export function attachGridListeners() {
    // Remove previous listener first to avoid duplicates
     if(gridKeydownHandler) {
        DOM_ELEMENTS.calendarGrid.removeEventListener('keydown', gridKeydownHandler);
    }

    // Ensure grid element exists before adding listeners
    if (DOM_ELEMENTS.calendarGrid) {
        DOM_ELEMENTS.calendarGrid.addEventListener('click', handleCalendarClick);
        gridKeydownHandler = handleGridKeyDown; // Store reference
        DOM_ELEMENTS.calendarGrid.addEventListener('keydown', gridKeydownHandler);
    } else {
        console.error("Cannot attach grid listeners, calendar grid element not found.");
    }
}

/**
 * Applies highlight class to cells matching search results.
 * @param {Array} searchResults - Array of { date: Date, holidayInfo: object }.
 */
function applySearchHighlights(searchResults) {
    clearSearchHighlights(); // Clear previous ones first
    if (!searchResults || searchResults.length === 0) return;

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

/**
 * Removes highlight class from all cells.
 */
function clearSearchHighlights() {
    const highlighted = DOM_ELEMENTS.calendarGrid.querySelectorAll(`.${CSS_CLASSES.searchHighlight}`);
    highlighted.forEach(cell => cell.classList.remove(CSS_CLASSES.searchHighlight));
}

// Helper to get date-fns locale dynamically
// Assumes dateFns.locale contains loaded locales (e.g., dateFns.locale.fr)
// You might need to explicitly import locales: import { fr, de, enUS } from 'date-fns/locale';
function getDateFnsLocale() {
    switch (state.currentLang) {
        case 'fr': return dateFns.locale.fr || dateFns.locale.enUS; // Fallback if fr not loaded
        case 'de': return dateFns.locale.de || dateFns.locale.enUS; // Fallback if de not loaded
        default: return dateFns.locale.enUS;
    }
}
