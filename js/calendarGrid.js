// js/calendarGrid.js
import { CONFIG, CSS_CLASSES, DOM_ELEMENTS } from './config.js';
import { state, updateState, getCurrentLocale, getHolidaysFromCache } from './state.js';
// Corrected import for formatDateIntl
import { t, getTranslatedHolidayName, translateHolidayType, i18n, formatDateIntl } from './i18n.js';
// Corrected import for getWeekNumber and added createDocumentFragment if needed (though standard is used)
import { formatDateYYYYMMDD, getWeekNumber } from './utils.js';
import { updateDayInfoSidebar } from './sidebar.js';
import { fetchHolidays } from './api.js'; // Needed for fetching holidays
import { handleViewChange, handleMonthYearChange } from './main.js'; // Needed for year view click -> month view
import { updateWeekdayHeaders } from './ui.js'; // Needed for updating headers on render
// Import specific date-fns functions
import { parseISO, isValid, startOfMonth, endOfMonth, startOfWeek, endOfWeek, getDate, getDay, addDays, subDays, getISOWeek, isSameDay, set, getYear, getMonth, format } from 'date-fns';

let gridKeydownHandler = null; // To store the keydown listener reference
let yearViewObserver = null; // For IntersectionObserver in year view

// --- Helper Functions ---

/**
 * Sets the time of a date object to midnight (00:00:00.000). Returns NEW date.
 * @param {Date} date
 * @returns {Date} The new date object set to midnight.
 */
function setTimeToMidnight(date) {
  if (date && isValid(date)) {
    // set returns a new Date instance
    return set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  }
  // Return the original invalid date or null/undefined as received
  // Or throw an error, depending on desired strictness
  return date;
}

// --- Rendering Functions ---

/** Renders the calendar grid based on the current view. */
export async function renderCalendarView() {
  DOM_ELEMENTS.calendarGrid.innerHTML = '';
  DOM_ELEMENTS.calendarGrid.className = `cal-grid`; // Base class, view specific added below
  DOM_ELEMENTS.calendarGrid.removeAttribute('aria-label');

  if (yearViewObserver) {
    yearViewObserver.disconnect();
    yearViewObserver = null;
  }
  clearSearchHighlights();
  updateWeekdayHeaders();

  try {
    // Simplified pre-fetching logic - fetch current year, let specific views fetch more if needed
    await fetchHolidays(state.currentYear, state.selectedCountry);

    // Additional fetches based on view boundaries might be needed
    // Let's assume view functions or fetchHolidays handle necessary adjacent data
    if (state.currentView === 'month') {
         const firstDayOfMonth = startOfMonth(new Date(state.currentYear, state.currentMonth, 1));
         const startOfGrid = startOfWeek(firstDayOfMonth, { weekStartsOn: state.weekStartsOn });
         if(getYear(startOfGrid) !== state.currentYear) {
            await fetchHolidays(getYear(startOfGrid), state.selectedCountry);
         }
         const lastDayOfMonth = endOfMonth(firstDayOfMonth);
         const endOfGrid = endOfWeek(lastDayOfMonth, { weekStartsOn: state.weekStartsOn });
          if(getYear(endOfGrid) !== state.currentYear) {
            await fetchHolidays(getYear(endOfGrid), state.selectedCountry);
         }
    } else if (state.currentView === 'week' && state.currentWeekStart) {
         const endOfWeekDate = addDays(state.currentWeekStart, 6);
         const endOfWeekYear = getYear(endOfWeekDate);
         if (endOfWeekYear !== state.currentYear) {
             await fetchHolidays(endOfWeekYear, state.selectedCountry);
         }
    }

  } catch (error) {
    console.error("Error pre-fetching holidays for grid render:", error);
  }

  // Apply view-specific class AFTER clearing
  const viewClass = state.currentView === 'month' ? CSS_CLASSES.gridMonthView :
                    state.currentView === 'week' ? CSS_CLASSES.gridWeekView :
                    state.currentView === 'year' ? CSS_CLASSES.gridYearView :
                    CSS_CLASSES.gridMonthView; // Default to month view
  DOM_ELEMENTS.calendarGrid.classList.add(viewClass);


  switch (state.currentView) {
    case 'week':
      renderWeekView(state.currentWeekStart);
      break;
    case 'year':
      renderYearView(state.currentYear);
      break;
    case 'month':
    default:
      renderMonthView(state.currentYear, state.currentMonth);
      break;
  }

  if (state.searchResults && state.searchResults.length > 0) {
    applySearchHighlights(state.searchResults);
  }
  attachGridListeners();
}

/** Renders the Month View grid. */
function renderMonthView(year, month) {
  const firstDayOfMonth = startOfMonth(new Date(year, month, 1));
  const lastDayOfMonth = endOfMonth(firstDayOfMonth);
  const monthStartDate = startOfWeek(firstDayOfMonth, { weekStartsOn: state.weekStartsOn });
  const monthEndDate = endOfWeek(lastDayOfMonth, { weekStartsOn: state.weekStartsOn });

  const currentLangData = i18n[state.currentLang] || i18n['en'];
  const gridLabel = t('gridLabelMonth', { month: currentLangData.monthNames[month], year });
  DOM_ELEMENTS.calendarGrid.setAttribute('aria-label', gridLabel);
  DOM_ELEMENTS.calendarGrid.innerHTML = '';

  const fragment = document.createDocumentFragment();
  let currentDate = monthStartDate; // No need for midnight conversion here, comparison works

  while (currentDate <= monthEndDate) {
    const weekNum = getWeekNumber(currentDate);
    const weekNumberCell = document.createElement('div');
    weekNumberCell.classList.add(CSS_CLASSES.gridWeekNumber);
    weekNumberCell.textContent = weekNum;
    weekNumberCell.setAttribute('role', 'rowheader');
    weekNumberCell.setAttribute('aria-label', t('weekLabel', { weekNum }));
    fragment.appendChild(weekNumberCell);

    for (let i = 0; i < 7; i++) {
      const cellDate = currentDate; // Use directly
      const dayCell = document.createElement('div');
      dayCell.classList.add(CSS_CLASSES.gridDayCell);
      dayCell.setAttribute('role', 'gridcell');

      const dayNumberSpan = document.createElement('span');
      dayNumberSpan.classList.add(CSS_CLASSES.gridDayNumber);
      dayNumberSpan.textContent = getDate(cellDate);

      const dateString = formatDateYYYYMMDD(cellDate);
      const cellYear = getYear(cellDate);
      const cellMonth = getMonth(cellDate);
      const holidaysForCellYear = getHolidaysFromCache(state.selectedCountry, cellYear);
      const holidayInfo = holidaysForCellYear ? holidaysForCellYear[dateString] : null;

      const isCurrentMonth = cellMonth === month;
      const isToday = isSameDay(cellDate, state.today);
      const isSelected = state.selectedDate && isSameDay(cellDate, state.selectedDate);
      const dayOfWeek = getDay(cellDate);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let ariaLabel = formatDateIntl(cellDate, { dateStyle: 'full' }); // Use imported function

      if (isToday) {
        dayCell.classList.add(CSS_CLASSES.cellToday);
        ariaLabel += `, ${t('today')}`;
      }
      if (isSelected) {
        dayCell.classList.add(CSS_CLASSES.cellSelected);
        ariaLabel += `, ${t('selected')}`;
      }
      if (isWeekend) {
        dayCell.classList.add(CSS_CLASSES.cellWeekend);
        ariaLabel += `, ${t('weekend')}`;
      }
      if (!isCurrentMonth) {
        dayCell.classList.add(CSS_CLASSES.cellOtherMonth);
        dayCell.setAttribute('aria-disabled', 'true');
        dayCell.setAttribute('tabindex', '-1');
      } else {
        dayCell.setAttribute('tabindex', '0');
        dayCell.dataset.date = dateString;
      }

      if (holidayInfo) { // Add holiday info regardless of month for consistency
        dayCell.classList.add(CSS_CLASSES.cellHoliday);
        const typeClass = `${CSS_CLASSES.cellHolidayTypePrefix}${(holidayInfo.type || 'Unknown').replace(/\s+/g, '-')}`;
        dayCell.classList.add(typeClass.toLowerCase());

        if (isCurrentMonth) { // Only add text/ARIA details for current month holidays
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
      }

      dayCell.setAttribute('aria-label', ariaLabel);
      dayCell.prepend(dayNumberSpan);
      fragment.appendChild(dayCell);

      currentDate = addDays(currentDate, 1);
    }
  }
  DOM_ELEMENTS.calendarGrid.appendChild(fragment);
}

/** Renders the Week View grid. */
function renderWeekView(weekStartDate) {
  let currentWeekStart = weekStartDate;
  if (!currentWeekStart || !isValid(currentWeekStart)) {
    console.warn("Invalid or missing weekStartDate for renderWeekView, recalculating.");
    currentWeekStart = startOfWeek(state.selectedDate || state.today, { weekStartsOn: state.weekStartsOn });
    updateState({ currentWeekStart: currentWeekStart });
  }
  // Ensure midnight only if needed for comparison logic (isSameDay handles it)
  // currentWeekStart = setTimeToMidnight(currentWeekStart);

  const locale = getCurrentLocale();
  const gridLabel = t('gridLabelWeek', { date: format(currentWeekStart, 'PPP', { locale }) });
  DOM_ELEMENTS.calendarGrid.setAttribute('aria-label', gridLabel);
  DOM_ELEMENTS.calendarGrid.innerHTML = '';

  const fragment = document.createDocumentFragment();
  const weekNum = getWeekNumber(currentWeekStart);
  const weekNumberCell = document.createElement('div');
  weekNumberCell.classList.add(CSS_CLASSES.gridWeekNumber);
  weekNumberCell.textContent = weekNum;
  weekNumberCell.setAttribute('role', 'rowheader');
  weekNumberCell.setAttribute('aria-label', t('weekLabel', { weekNum }));
  fragment.appendChild(weekNumberCell);

  for (let i = 0; i < 7; i++) {
    const cellDate = addDays(currentWeekStart, i);
    const dayCell = document.createElement('div');
    dayCell.classList.add(CSS_CLASSES.gridDayCell);
    dayCell.setAttribute('role', 'gridcell');

    const dayNumberSpan = document.createElement('span');
    dayNumberSpan.classList.add(CSS_CLASSES.gridDayNumber);
    dayNumberSpan.textContent = getDate(cellDate);

    const dateString = formatDateYYYYMMDD(cellDate);
    const cellYear = getYear(cellDate);
    const holidaysForCellYear = getHolidaysFromCache(state.selectedCountry, cellYear);
    const holidayInfo = holidaysForCellYear ? holidaysForCellYear[dateString] : null;

    const isToday = isSameDay(cellDate, state.today);
    const isSelected = state.selectedDate && isSameDay(cellDate, state.selectedDate);
    const dayOfWeek = getDay(cellDate);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let ariaLabel = formatDateIntl(cellDate, { dateStyle: 'full' }); // Use imported function

    if (isToday) {
      dayCell.classList.add(CSS_CLASSES.cellToday);
      ariaLabel += `, ${t('today')}`;
    }
    if (isSelected) {
      dayCell.classList.add(CSS_CLASSES.cellSelected);
      ariaLabel += `, ${t('selected')}`;
    }
    if (isWeekend) {
      dayCell.classList.add(CSS_CLASSES.cellWeekend);
      ariaLabel += `, ${t('weekend')}`;
    }

    if (holidayInfo) {
      dayCell.classList.add(CSS_CLASSES.cellHoliday);
      const typeClass = `${CSS_CLASSES.cellHolidayTypePrefix}${(holidayInfo.type || 'Unknown').replace(/\s+/g, '-')}`;
      dayCell.classList.add(typeClass.toLowerCase());

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

    dayCell.prepend(dayNumberSpan);
    fragment.appendChild(dayCell);
  }
  DOM_ELEMENTS.calendarGrid.appendChild(fragment);
}


/** Renders the Year View grid. */
function renderYearView(year) {
  const gridLabel = t('gridLabelYear', { year });
  DOM_ELEMENTS.calendarGrid.setAttribute('aria-label', gridLabel);
  DOM_ELEMENTS.calendarGrid.innerHTML = '';

  const fragment = document.createDocumentFragment();
  const currentLangData = i18n[state.currentLang] || i18n['en'];
  const miniWeekdays = currentLangData.weekdaysMini;
  const weekdaysStart = state.weekStartsOn;

  // Fetch holidays needed for the ENTIRE year view rendering
  fetchHolidays(year, state.selectedCountry).then(holidaysForYear => {
      const validHolidaysForYear = holidaysForYear || {}; // Ensure it's an object

      for (let month = 0; month < 12; month++) {
          const monthContainer = document.createElement('div');
          monthContainer.classList.add(CSS_CLASSES.gridMonthContainer);
          monthContainer.dataset.monthIndex = month;

          const monthHeader = document.createElement('div');
          monthHeader.classList.add(CSS_CLASSES.gridMonthHeader);
          const monthName = currentLangData.monthNames[month];
          monthHeader.textContent = monthName;
          monthHeader.setAttribute('role', 'button');
          monthHeader.setAttribute('tabindex', '0');
          monthHeader.dataset.year = year;
          monthHeader.dataset.month = month;
          monthHeader.setAttribute('aria-label', t('gridLabelYearMonth', { month: monthName, year }));
          monthContainer.appendChild(monthHeader);

          const miniWeekdaysDiv = document.createElement('div');
          miniWeekdaysDiv.classList.add(CSS_CLASSES.gridMiniWeekdays);
          miniWeekdaysDiv.setAttribute('aria-hidden', 'true');
          if (miniWeekdays && miniWeekdays.length === 7) {
              for (let i = 0; i < 7; i++) {
                  const dayIndex = (weekdaysStart + i) % 7;
                  const wdDiv = document.createElement('div');
                  wdDiv.textContent = miniWeekdays[dayIndex];
                  miniWeekdaysDiv.appendChild(wdDiv);
              }
          }
          monthContainer.appendChild(miniWeekdaysDiv);

          // Render mini calendar directly instead of using observer for simplicity here
          // Observer adds complexity; direct render might be acceptable if year view isn't too slow
          renderMiniCalendar(monthContainer, year, month, validHolidaysForYear);

          fragment.appendChild(monthContainer);
      }
      DOM_ELEMENTS.calendarGrid.appendChild(fragment);
      // No observer setup needed if rendering directly

  }).catch(error => {
      console.error("Failed to fetch holidays for year view:", error);
      // Error should be displayed by fetchHolidays via displayApiError
  });
}

// Removed setupYearViewObserver function as it's not used with direct render

/** Renders the mini-calendar grid for Year View. */
function renderMiniCalendar(monthContainer, year, month, holidaysForYear) {
  const miniGrid = document.createElement('div');
  miniGrid.classList.add(CSS_CLASSES.gridMiniCalendar);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = endOfMonth(firstDayOfMonth);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: state.weekStartsOn });
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: state.weekStartsOn });

  const locale = getCurrentLocale();
  let currentDate = startDate; // No need for midnight conversion

  while (currentDate <= endDate) {
    const cellDate = currentDate;
    const monthCell = document.createElement('div');
    monthCell.classList.add(CSS_CLASSES.gridMonthCell);
    monthCell.setAttribute('role', 'gridcell');
    monthCell.textContent = getDate(cellDate);

    const dateString = formatDateYYYYMMDD(cellDate);
    const cellMonth = getMonth(cellDate);
    const holidayInfo = holidaysForYear ? holidaysForYear[dateString] : null;
    const isCurrentMonth = cellMonth === month;
    const isToday = isSameDay(cellDate, state.today);
    const isSelected = state.selectedDate && isSameDay(cellDate, state.selectedDate);
    const dayOfWeek = getDay(cellDate);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isToday) monthCell.classList.add(CSS_CLASSES.cellToday);
    if (isSelected && isCurrentMonth) monthCell.classList.add(CSS_CLASSES.cellSelected);
    if (isWeekend) monthCell.classList.add(CSS_CLASSES.cellWeekend);

    if (!isCurrentMonth) {
      monthCell.classList.add(CSS_CLASSES.cellOtherMonth);
      monthCell.setAttribute('aria-disabled', 'true');
      monthCell.setAttribute('tabindex', '-1');
    } else {
      monthCell.dataset.date = dateString;
      monthCell.setAttribute('tabindex', '0');
      let ariaLabel = format(cellDate, 'PPP', { locale });
      if(isSelected) ariaLabel += `, ${t('selected')}`;
      if(isWeekend) ariaLabel += `, ${t('weekend')}`;
      monthCell.setAttribute('aria-label', ariaLabel);
    }

    if (holidayInfo) { // Add holiday class regardless of month
         monthCell.classList.add(CSS_CLASSES.cellHoliday);
         const typeClass = `${CSS_CLASSES.cellHolidayTypePrefix}${(holidayInfo.type || 'Unknown').replace(/\s+/g, '-')}`;
         monthCell.classList.add(typeClass.toLowerCase());

        if (isCurrentMonth) { // Only add tooltip and enhance ARIA for current month
            const translatedName = getTranslatedHolidayName(dateString, holidayInfo.name);
            monthCell.setAttribute('title', translatedName);
            const translatedType = translateHolidayType(holidayInfo.type);
            const typeText = holidayInfo.type ? t('holidayType', { type: translatedType }) : t('publicHoliday');
            let currentAriaLabel = monthCell.getAttribute('aria-label') || '';
            monthCell.setAttribute('aria-label', currentAriaLabel + `, ${typeText}, ${translatedName}`);
        }
    }

    miniGrid.appendChild(monthCell);
    currentDate = addDays(currentDate, 1);
  }
  monthContainer.appendChild(miniGrid);
}

// --- Event Handling ---

function handleCalendarClick(event) {
  const dayCellTarget = event.target.closest(`.${CSS_CLASSES.gridDayCell}:not(.${CSS_CLASSES.cellOtherMonth}), .${CSS_CLASSES.gridMonthCell}:not(.${CSS_CLASSES.cellOtherMonth})`);
  const monthHeaderTarget = event.target.closest(`.${CSS_CLASSES.gridMonthHeader}`);

  if (dayCellTarget && dayCellTarget.dataset.date) {
    const newSelectedDate = parseISO(dayCellTarget.dataset.date);
    if (!isValid(newSelectedDate)) {
      console.error("Invalid date clicked:", dayCellTarget.dataset.date);
      return;
    }
    const finalSelectedDate = setTimeToMidnight(newSelectedDate); // Use helper that returns new date

    const selectionChanged = !state.selectedDate || !isSameDay(finalSelectedDate, state.selectedDate);

    if (selectionChanged) {
      const previousSelected = DOM_ELEMENTS.calendarGrid.querySelector(`.${CSS_CLASSES.cellSelected}`);
      if (previousSelected) {
        previousSelected.classList.remove(CSS_CLASSES.cellSelected);
        updateCellAriaLabel(previousSelected, false);
      }
      dayCellTarget.classList.add(CSS_CLASSES.cellSelected);
      updateCellAriaLabel(dayCellTarget, true);
      updateState({ selectedDate: finalSelectedDate });
      updateDayInfoSidebar(finalSelectedDate);
    }

    if (state.currentView === 'year') { // Always switch from year view on click
      handleMonthYearChange(getYear(finalSelectedDate), getMonth(finalSelectedDate));
    }
  } else if (monthHeaderTarget && monthHeaderTarget.dataset.year && monthHeaderTarget.dataset.month) {
    const year = parseInt(monthHeaderTarget.dataset.year, 10);
    const month = parseInt(monthHeaderTarget.dataset.month, 10);
    console.debug(`Year view month header clicked: ${month}/${year}`);
    handleMonthYearChange(year, month);
  }
}

function handleGridKeyDown(event) {
  const { key, target } = event;
  const isDayCell = target.matches(`.${CSS_CLASSES.gridDayCell}:not(.${CSS_CLASSES.cellOtherMonth}), .${CSS_CLASSES.gridMonthCell}:not(.${CSS_CLASSES.cellOtherMonth})`);
  const isMonthHeader = target.matches(`.${CSS_CLASSES.gridMonthHeader}`);

  if (key === 'Enter' || key === ' ') {
    if (isDayCell || isMonthHeader) {
      event.preventDefault();
      handleCalendarClick({ target: target });
      return;
    }
  }

  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    return;
  }

  if (isDayCell) {
    event.preventDefault();
    navigateDayCellFocus(key, target);
  } else if (isMonthHeader && state.currentView === 'year') {
    event.preventDefault();
    navigateMonthHeaderFocus(key, target);
  }
}


function navigateDayCellFocus(key, currentCell) {
    let focusableCells = [];
    let currentIndex = -1;
    let numColumns = 7;
    let parentGrid = DOM_ELEMENTS.calendarGrid; // Default for month/week

    if (state.currentView === 'year') {
        parentGrid = currentCell.closest(`.${CSS_CLASSES.gridMiniCalendar}`);
        if (!parentGrid) return;
        focusableCells = Array.from(parentGrid.querySelectorAll(`.${CSS_CLASSES.gridMonthCell}:not(.${CSS_CLASSES.cellOtherMonth})[tabindex="0"]`));
    } else { // Month or Week view
        focusableCells = Array.from(parentGrid.querySelectorAll(`.${CSS_CLASSES.gridDayCell}:not(.${CSS_CLASSES.cellOtherMonth})[tabindex="0"]`));
    }

    currentIndex = focusableCells.indexOf(currentCell);
    if (currentIndex === -1) return;

    let nextIndex = -1;

    switch (key) {
        case 'ArrowLeft':
            nextIndex = (currentIndex % numColumns !== 0) ? currentIndex - 1 : -1;
            break;
        case 'ArrowRight':
            nextIndex = (currentIndex % numColumns !== numColumns - 1) ? currentIndex + 1 : -1;
            break;
        case 'ArrowUp':
            nextIndex = (currentIndex >= numColumns) ? currentIndex - numColumns : -1;
            // Special handling for year view top row
            if (state.currentView === 'year' && nextIndex === -1) {
                 const monthContainer = parentGrid.closest(`.${CSS_CLASSES.gridMonthContainer}`);
                 focusElement(monthContainer?.querySelector(`.${CSS_CLASSES.gridMonthHeader}`));
                 return;
            }
            break;
        case 'ArrowDown':
            nextIndex = (currentIndex < focusableCells.length - numColumns) ? currentIndex + numColumns : -1;
             // Special handling for year view bottom row
            if (state.currentView === 'year' && nextIndex === -1) {
                 const monthContainer = parentGrid.closest(`.${CSS_CLASSES.gridMonthContainer}`);
                 const nextMonthContainer = monthContainer?.nextElementSibling;
                 focusElement(nextMonthContainer?.querySelector(`.${CSS_CLASSES.gridMonthHeader}`));
                 return;
            }
            break;
    }

    if (nextIndex >= 0 && nextIndex < focusableCells.length) {
        focusElement(focusableCells[nextIndex]);
    }
     // TODO: Add logic to potentially switch month/week/year if navigation goes out of bounds
}


function navigateMonthHeaderFocus(key, currentHeader) {
  const allHeaders = Array.from(DOM_ELEMENTS.calendarGrid.querySelectorAll(`.${CSS_CLASSES.gridMonthHeader}[tabindex="0"]`));
  const currentIndex = allHeaders.indexOf(currentHeader);
  if (currentIndex === -1) return;

  let nextIndex = -1;
  let numColumns = 1; // Default assumption
  try { // Safely get column count
    numColumns = window.getComputedStyle(DOM_ELEMENTS.calendarGrid).gridTemplateColumns.split(' ').length;
  } catch (e) { console.warn("Could not determine grid columns for keyboard nav."); }


  switch (key) {
    case 'ArrowLeft':
      nextIndex = currentIndex > 0 ? currentIndex - 1 : -1; break;
    case 'ArrowRight':
      nextIndex = currentIndex < allHeaders.length - 1 ? currentIndex + 1 : -1; break;
    case 'ArrowUp':
      nextIndex = currentIndex >= numColumns ? currentIndex - numColumns : -1; break;
    case 'ArrowDown':
      const monthContainer = currentHeader.closest(`.${CSS_CLASSES.gridMonthContainer}`);
      const firstDayCell = monthContainer?.querySelector(`.${CSS_CLASSES.gridMonthCell}:not(.${CSS_CLASSES.cellOtherMonth})[tabindex="0"]`);
      if (firstDayCell) {
        focusElement(firstDayCell);
        return;
      }
      nextIndex = (currentIndex + numColumns < allHeaders.length) ? currentIndex + numColumns : -1;
      break;
  }

  if (nextIndex !== -1 && nextIndex < allHeaders.length) {
    focusElement(allHeaders[nextIndex]);
  }
}

/** Safely focuses an element */
function focusElement(element) {
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
}

function updateCellAriaLabel(cellElement, isSelected) {
  if (!cellElement || !cellElement.hasAttribute('aria-label')) return;
  let currentLabel = cellElement.getAttribute('aria-label') || '';
  const selectedText = `, ${t('selected')}`;
  currentLabel = currentLabel.replace(selectedText, '');
  if (isSelected) {
    currentLabel += selectedText;
  }
  cellElement.setAttribute('aria-label', currentLabel);
}

/** Attaches or re-attaches event listeners to the grid. */
export function attachGridListeners() {
  if (!DOM_ELEMENTS.calendarGrid) {
      console.error("Cannot attach grid listeners, calendar grid element not found.");
      return;
  }
  // Remove previous listener using the stored reference
  if (gridKeydownHandler) {
    DOM_ELEMENTS.calendarGrid.removeEventListener('keydown', gridKeydownHandler);
  }
  // Consider removing click listener if re-attaching, although less critical than keydown
  // DOM_ELEMENTS.calendarGrid.removeEventListener('click', handleCalendarClick);

  DOM_ELEMENTS.calendarGrid.addEventListener('click', handleCalendarClick);
  gridKeydownHandler = handleGridKeyDown; // Store new reference
  DOM_ELEMENTS.calendarGrid.addEventListener('keydown', gridKeydownHandler);
}

/** Applies highlight class to cells matching search results. */
function applySearchHighlights(searchResults) {
  clearSearchHighlights();
  if (!searchResults || searchResults.length === 0) return;
  const resultsMap = searchResults.reduce((map, item) => {
    if (item && item.date && isValid(item.date)) { // Add validation
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

/** Removes highlight class from all cells. */
function clearSearchHighlights() {
  const highlighted = DOM_ELEMENTS.calendarGrid.querySelectorAll(`.${CSS_CLASSES.cellSearchHighlight}`);
  highlighted.forEach(cell => cell.classList.remove(CSS_CLASSES.cellSearchHighlight));
}