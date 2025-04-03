// js/calendarGrid.js
import { CONFIG, CSS_CLASSES, DOM_ELEMENTS } from './config.js';
import { state, updateState, getCurrentLocale, getHolidaysFromCache } from './state.js';
import { t, getTranslatedHolidayName, translateHolidayType, i18n, formatDateIntl } from './i18n.js';
// Note: Assuming these utils are defined/imported elsewhere if used correctly
// import { formatDateYYYYMMDD, getWeekNumber, createDocumentFragment } from './utils.js';
// Using standard document.createDocumentFragment and assuming formatDateYYYYMMDD/getWeekNumber are available
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
 * Sets the time of a date object to midnight (00:00:00.000).
 * @param {Date} date
 * @returns {Date} The modified date object.
 */
function setTimeToMidnight(date) {
  if (date && isValid(date)) {
    return set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  }
  return date;
}

// --- Rendering Functions ---

/**
 * Renders the calendar grid based on the current view.
 */
export async function renderCalendarView() {
  DOM_ELEMENTS.calendarGrid.innerHTML = ''; // Clear previous grid
  // SYNTAX FIX: Used template literal (backticks) for className assignment
  DOM_ELEMENTS.calendarGrid.className = `cal-grid ${CSS_CLASSES.gridMonthView}`; // Reset class, specific view class added below
  DOM_ELEMENTS.calendarGrid.removeAttribute('aria-label'); // Clear old label

  if (yearViewObserver) { // Disconnect previous observer if exists
    yearViewObserver.disconnect();
    yearViewObserver = null;
  }
  // Clear previous search highlights
  clearSearchHighlights(); // Assuming clearSearchHighlights is defined below

  // Update weekday headers based on view
  updateWeekdayHeaders();

  try {
    // Fetch holidays for the current year being viewed
    // For week view, it might span across year boundaries
    await fetchHolidays(state.currentYear, state.selectedCountry);
    if ((state.currentView === 'week' || state.currentView === 'month') && state.currentWeekStart) {
      const endOfWeekDate = addDays(state.currentWeekStart, 6);
      const endOfWeekYear = getYear(endOfWeekDate);
      if (endOfWeekYear !== state.currentYear) {
        await fetchHolidays(endOfWeekYear, state.selectedCountry); // Fetch adjacent year if week/month spans boundary
      }
      // For month view, check if previous/next month days belong to different year
      const firstDayOfMonth = startOfMonth(new Date(state.currentYear, state.currentMonth, 1));
      const startOfGrid = startOfWeek(firstDayOfMonth, { weekStartsOn: state.weekStartsOn });
      if (getYear(startOfGrid) !== state.currentYear) {
        await fetchHolidays(getYear(startOfGrid), state.selectedCountry);
      }
      const lastDayOfMonth = endOfMonth(firstDayOfMonth);
      const endOfGrid = endOfWeek(lastDayOfMonth, { weekStartsOn: state.weekStartsOn });
      if (getYear(endOfGrid) !== state.currentYear) {
        await fetchHolidays(getYear(endOfGrid), state.selectedCountry);
      }
    }
    // Multi-year search requires fetching adjacent years too, handled in handleSearch
  } catch (error) {
    console.error("Error pre-fetching holidays for grid render:", error);
    // Render grid without holiday info if fetch fails (error displayed by fetchHolidays)
  }
  // SYNTAX FIX: Removed extraneous text artifact below

  switch (state.currentView) {
    case 'week':
      DOM_ELEMENTS.calendarGrid.classList.add(CSS_CLASSES.gridWeekView);
      renderWeekView(state.currentWeekStart);
      break;
    case 'year':
      DOM_ELEMENTS.calendarGrid.classList.add(CSS_CLASSES.gridYearView);
      renderYearView(state.currentYear); // Holidays fetched inside via IntersectionObserver or directly
      break;
    case 'month':
    default:
      DOM_ELEMENTS.calendarGrid.classList.add(CSS_CLASSES.gridMonthView);
      // Holidays for the year (and adjacent if needed) are expected to be in cache now
      renderMonthView(state.currentYear, state.currentMonth);
      break;
  }

  // Re-apply search highlights if needed
  if (state.searchResults && state.searchResults.length > 0) {
    applySearchHighlights(state.searchResults); // Assuming applySearchHighlights is defined below
  }

  // Attach event listeners after rendering
  attachGridListeners(); // Assuming attachGridListeners is defined below
}

/**
 * Renders the Month View grid.
 * @param {number} year
 * @param {number} month - 0-indexed month.
 */
function renderMonthView(year, month) {
  const firstDayOfMonth = startOfMonth(new Date(year, month, 1));
  const lastDayOfMonth = endOfMonth(firstDayOfMonth);
  const monthStartDate = startOfWeek(firstDayOfMonth, { weekStartsOn: state.weekStartsOn });
  const monthEndDate = endOfWeek(lastDayOfMonth, { weekStartsOn: state.weekStartsOn });

  const gridLabel = t('gridLabelMonth', { month: i18n[state.currentLang].monthNames[month], year });
  DOM_ELEMENTS.calendarGrid.setAttribute('aria-label', gridLabel);
  DOM_ELEMENTS.calendarGrid.innerHTML = ''; // Clear previous grid content

  const fragment = document.createDocumentFragment();
  let currentDate = setTimeToMidnight(monthStartDate);

  while (currentDate <= monthEndDate) {
    // --- Add Week Number Cell ---
    const weekNum = getWeekNumber(currentDate); // Assumes getWeekNumber is available
    const weekNumberCell = document.createElement('div');
    weekNumberCell.classList.add(CSS_CLASSES.gridWeekNumber);
    weekNumberCell.textContent = weekNum;
    weekNumberCell.setAttribute('role', 'rowheader');
    weekNumberCell.setAttribute('aria-label', t('weekLabel', { weekNum }));
    fragment.appendChild(weekNumberCell);

    // --- Add Day Cells for the week ---
    for (let i = 0; i < 7; i++) {
      const cellDate = setTimeToMidnight(currentDate); // Ensure midnight for comparisons
      const dayCell = document.createElement('div');
      dayCell.classList.add(CSS_CLASSES.gridDayCell);
      dayCell.setAttribute('role', 'gridcell');

      const dayNumberSpan = document.createElement('span');
      dayNumberSpan.classList.add(CSS_CLASSES.gridDayNumber);
      dayNumberSpan.textContent = getDate(cellDate);

      const dateString = formatDateYYYYMMDD(cellDate); // Assumes formatDateYYYYMMDD is available
      const cellYear = getYear(cellDate);
      const cellMonth = getMonth(cellDate);
      const holidaysForCellYear = getHolidaysFromCache(state.selectedCountry, cellYear);
      const holidayInfo = holidaysForCellYear ? holidaysForCellYear[dateString] : null; // Added null check

      const isCurrentMonth = cellMonth === month;
      const isToday = isSameDay(cellDate, state.today);
      const isSelected = state.selectedDate && isSameDay(cellDate, state.selectedDate);
      const dayOfWeek = getDay(cellDate); // 0=Sun, 6=Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let ariaLabel = formatDateIntl(cellDate, { dateStyle: 'full' }); // Assumes formatDateIntl is available

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
        dayCell.setAttribute('tabindex', '-1'); // Not focusable
      } else {
        dayCell.setAttribute('tabindex', '0'); // Focusable
        dayCell.dataset.date = dateString; // Only add data-date for current month days
      }

      if (holidayInfo && isCurrentMonth) { // Only show holiday details for current month days visually? Or all? Showing all for clarity.
        dayCell.classList.add(CSS_CLASSES.cellHoliday);
        const typeClass = `${CSS_CLASSES.cellHolidayTypePrefix}${(holidayInfo.type || 'Unknown').replace(/\s+/g, '-')}`;
        dayCell.classList.add(typeClass.toLowerCase()); // Use lowercase class names
        const holidayNameSpan = document.createElement('span');
        holidayNameSpan.classList.add(CSS_CLASSES.gridHolidayName);
        const translatedName = getTranslatedHolidayName(dateString, holidayInfo.name); // Assumes getTranslatedHolidayName is available
        holidayNameSpan.textContent = translatedName;
        holidayNameSpan.title = translatedName;
        dayCell.appendChild(holidayNameSpan);
        const translatedType = translateHolidayType(holidayInfo.type); // Assumes translateHolidayType is available
        const typeText = holidayInfo.type ? t('holidayType', { type: translatedType }) : t('publicHoliday');
        ariaLabel += `, ${typeText}, ${translatedName}`;
      } else if (holidayInfo) { // Still add base holiday class for other month days if they are holidays
        dayCell.classList.add(CSS_CLASSES.cellHoliday);
        const typeClass = `${CSS_CLASSES.cellHolidayTypePrefix}${(holidayInfo.type || 'Unknown').replace(/\s+/g, '-')}`;
        dayCell.classList.add(typeClass.toLowerCase());
      }


      dayCell.setAttribute('aria-label', ariaLabel);
      dayCell.prepend(dayNumberSpan);
      fragment.appendChild(dayCell);

      currentDate = addDays(currentDate, 1); // Move to the next day
    }
    // SYNTAX FIX: Removed extraneous text artifact below
  }
  DOM_ELEMENTS.calendarGrid.appendChild(fragment);
}

/**
 * Renders the Week View grid.
 * @param {Date} weekStartDate - The starting date of the week (passed from state, respecting weekStartsOn).
 */
function renderWeekView(weekStartDate) {
  if (!weekStartDate || !isValid(weekStartDate)) {
    console.error("Invalid weekStartDate for renderWeekView");
    // Recalculate based on current state if invalid
    weekStartDate = startOfWeek(state.selectedDate || state.today, { weekStartsOn: state.weekStartsOn });
    updateState({ currentWeekStart: weekStartDate }); // Update state if corrected
  }
  weekStartDate = setTimeToMidnight(weekStartDate); // Ensure midnight

  const locale = getCurrentLocale();
  const gridLabel = t('gridLabelWeek', { date: format(weekStartDate, 'PPP', { locale }) });
  DOM_ELEMENTS.calendarGrid.setAttribute('aria-label', gridLabel);
  DOM_ELEMENTS.calendarGrid.innerHTML = ''; // Clear grid

  const fragment = document.createDocumentFragment();

  // --- Add Week Number Cell ---
  const weekNum = getWeekNumber(weekStartDate); // Assumes getWeekNumber is available
  const weekNumberCell = document.createElement('div');
  weekNumberCell.classList.add(CSS_CLASSES.gridWeekNumber);
  weekNumberCell.textContent = weekNum;
  weekNumberCell.setAttribute('role', 'rowheader');
  weekNumberCell.setAttribute('aria-label', t('weekLabel', { weekNum }));
  fragment.appendChild(weekNumberCell);

  // --- Add Day Cells ---
  for (let i = 0; i < 7; i++) {
    const cellDate = setTimeToMidnight(addDays(weekStartDate, i)); // Ensure midnight
    const dayCell = document.createElement('div');
    dayCell.classList.add(CSS_CLASSES.gridDayCell);
    dayCell.setAttribute('role', 'gridcell');

    const dayNumberSpan = document.createElement('span');
    dayNumberSpan.classList.add(CSS_CLASSES.gridDayNumber);
    dayNumberSpan.textContent = getDate(cellDate);

    const dateString = formatDateYYYYMMDD(cellDate); // Assumes formatDateYYYYMMDD is available
    const cellYear = getYear(cellDate);
    const holidaysForCellYear = getHolidaysFromCache(state.selectedCountry, cellYear);
    const holidayInfo = holidaysForCellYear ? holidaysForCellYear[dateString] : null; // Added null check

    const isToday = isSameDay(cellDate, state.today);
    const isSelected = state.selectedDate && isSameDay(cellDate, state.selectedDate);
    const dayOfWeek = getDay(cellDate);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let ariaLabel = formatDateIntl(cellDate, { dateStyle: 'full' }); // Assumes formatDateIntl is available

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
      const translatedName = getTranslatedHolidayName(dateString, holidayInfo.name); // Assumes getTranslatedHolidayName is available
      holidayNameSpan.textContent = translatedName;
      holidayNameSpan.title = translatedName;
      dayCell.appendChild(holidayNameSpan); // Append name

      const translatedType = translateHolidayType(holidayInfo.type); // Assumes translateHolidayType is available
      const typeText = holidayInfo.type ? t('holidayType', { type: translatedType }) : t('publicHoliday');
      ariaLabel += `, ${typeText}, ${translatedName}`;
    }

    dayCell.dataset.date = dateString;
    dayCell.setAttribute('tabindex', '0');
    dayCell.setAttribute('aria-label', ariaLabel);

    dayCell.prepend(dayNumberSpan); // Prepend number
    fragment.appendChild(dayCell); // Append cell
    // SYNTAX FIX: Removed extraneous text artifact below
  }
  DOM_ELEMENTS.calendarGrid.appendChild(fragment);
}

/**
 * Renders the container and headers for the Year View.
 * Delegates rendering of mini-calendars to an IntersectionObserver.
 * @param {number} year
 */
function renderYearView(year) {
  const gridLabel = t('gridLabelYear', { year });
  DOM_ELEMENTS.calendarGrid.setAttribute('aria-label', gridLabel);
  DOM_ELEMENTS.calendarGrid.innerHTML = ''; // Clear grid

  const fragment = document.createDocumentFragment();
  const miniWeekdays = i18n[state.currentLang].weekdaysMini;
  const weekdaysStart = state.weekStartsOn; // 0 or 1

  // Ensure holidays for the year are fetched before setting up observer
  fetchHolidays(year, state.selectedCountry).then(holidaysForYear => {
    // If fetchHolidays resolved with null/undefined (e.g., due to error), provide empty object
    const validHolidaysForYear = holidaysForYear || {};

    for (let month = 0; month < 12; month++) {
      const monthContainer = document.createElement('div');
      monthContainer.classList.add(CSS_CLASSES.gridMonthContainer);
      monthContainer.dataset.monthIndex = month; // Store month index

      // --- Month Header (Clickable) ---
      const monthHeader = document.createElement('div');
      monthHeader.classList.add(CSS_CLASSES.gridMonthHeader);
      const monthName = i18n[state.currentLang].monthNames[month];
      monthHeader.textContent = monthName;
      monthHeader.setAttribute('role', 'button'); // Make it act like a button
      monthHeader.setAttribute('tabindex', '0');
      monthHeader.dataset.year = year;
      monthHeader.dataset.month = month;
      monthHeader.setAttribute('aria-label', t('gridLabelYearMonth', { month: monthName, year }));
      monthContainer.appendChild(monthHeader);

      // --- Mini Weekday Headers ---
      const miniWeekdaysDiv = document.createElement('div');
      miniWeekdaysDiv.classList.add(CSS_CLASSES.gridMiniWeekdays);
      miniWeekdaysDiv.setAttribute('aria-hidden', 'true'); // Decorative
      for (let i = 0; i < 7; i++) {
        const dayIndex = (weekdaysStart + i) % 7;
        const wdDiv = document.createElement('div');
        wdDiv.textContent = miniWeekdays[dayIndex];
        miniWeekdaysDiv.appendChild(wdDiv);
      }
      monthContainer.appendChild(miniWeekdaysDiv);

      // --- Mini Calendar Placeholder ---
      const miniGridPlaceholder = document.createElement('div');
      miniGridPlaceholder.classList.add(CSS_CLASSES.gridMiniCalendarPlaceholder);
      // Add minimum height to avoid layout shifts and ensure it can be observed
      miniGridPlaceholder.style.minHeight = '150px'; // Adjust as needed
      monthContainer.appendChild(miniGridPlaceholder);

      fragment.appendChild(monthContainer);
    }
    DOM_ELEMENTS.calendarGrid.appendChild(fragment);

    // Setup Intersection Observer (pass potentially empty holidays object)
    setupYearViewObserver(year, validHolidaysForYear);
    // SYNTAX FIX: Removed extraneous text artifact below
  }).catch(error => {
    console.error("Failed to fetch holidays for year view:", error);
    // Error is already displayed by fetchHolidays
  });
}

/**
 * Sets up the IntersectionObserver to render mini-calendars when they become visible.
 * @param {number} year
 * @param {object} holidaysForYear - Holiday data map for the year.
 */
function setupYearViewObserver(year, holidaysForYear) {
  const options = {
    root: DOM_ELEMENTS.calendarGrid, // Observe within the grid container
    rootMargin: '0px 0px 100px 0px', // Load slightly before fully visible
    threshold: 0.01 // Trigger even if only a tiny bit is visible
  };

  yearViewObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const placeholder = entry.target;
        // SYNTAX FIX: Used template literal for closest() argument
        const monthContainer = placeholder.closest(`.${CSS_CLASSES.gridMonthContainer}`);
        if (monthContainer && monthContainer.dataset.monthIndex) {
          const monthIndex = parseInt(monthContainer.dataset.monthIndex, 10);
          // Render the actual mini-calendar content
          renderMiniCalendar(monthContainer, year, monthIndex, holidaysForYear);
          // Stop observing this placeholder once rendered
          observer.unobserve(placeholder);
          // Remove placeholder after rendering
          placeholder.remove();
        }
      }
    });
  }, options);

  // Start observing all placeholders
  // SYNTAX FIX: Used template literal for querySelectorAll() argument
  const placeholders = DOM_ELEMENTS.calendarGrid.querySelectorAll(`.${CSS_CLASSES.gridMiniCalendarPlaceholder}`);
  placeholders.forEach(placeholder => yearViewObserver.observe(placeholder));
}

/**
 * Renders the actual mini-calendar grid for a specific month in the year view.
 * @param {HTMLElement} monthContainer - The container element for the month.
 * @param {number} year
 * @param {number} month - 0-indexed month.
 * @param {object} holidaysForYear - Holiday data map for the entire year.
 */
function renderMiniCalendar(monthContainer, year, month, holidaysForYear) {
  const miniGrid = document.createElement('div');
  miniGrid.classList.add(CSS_CLASSES.gridMiniCalendar);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = endOfMonth(firstDayOfMonth);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: state.weekStartsOn });
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: state.weekStartsOn });

  const locale = getCurrentLocale();
  let currentDate = setTimeToMidnight(startDate);

  while (currentDate <= endDate) {
    const cellDate = setTimeToMidnight(currentDate); // Use a new date object for modifications
    const monthCell = document.createElement('div');
    monthCell.classList.add(CSS_CLASSES.gridMonthCell);
    monthCell.setAttribute('role', 'gridcell');
    monthCell.textContent = getDate(cellDate);

    const dateString = formatDateYYYYMMDD(cellDate); // Assumes formatDateYYYYMMDD is available
    const cellMonth = getMonth(cellDate);
    const holidayInfo = holidaysForYear ? holidaysForYear[dateString] : null; // Added null check
    const isCurrentMonth = cellMonth === month;
    const isToday = isSameDay(cellDate, state.today);
    const isSelected = state.selectedDate && isSameDay(cellDate, state.selectedDate);
    const dayOfWeek = getDay(cellDate);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Add classes for styling
    if (isToday) monthCell.classList.add(CSS_CLASSES.cellToday);
    if (isSelected && isCurrentMonth) monthCell.classList.add(CSS_CLASSES.cellSelected); // Select only current month days
    if (isWeekend) monthCell.classList.add(CSS_CLASSES.cellWeekend);

    if (!isCurrentMonth) {
      monthCell.classList.add(CSS_CLASSES.cellOtherMonth);
      monthCell.setAttribute('aria-disabled', 'true');
      monthCell.setAttribute('tabindex', '-1');
    } else {
      monthCell.dataset.date = dateString;
      monthCell.setAttribute('tabindex', '0'); // Focusable
      // Basic label, could be enhanced if needed
      monthCell.setAttribute('aria-label', format(cellDate, 'PPP', { locale }));
      if (isSelected) monthCell.setAttribute('aria-label', monthCell.getAttribute('aria-label') + `, ${t('selected')}`);
      if (isWeekend) monthCell.setAttribute('aria-label', monthCell.getAttribute('aria-label') + `, ${t('weekend')}`);
    }

    if (holidayInfo && isCurrentMonth) { // Indicate holidays visually
      monthCell.classList.add(CSS_CLASSES.cellHoliday);
      const typeClass = `${CSS_CLASSES.cellHolidayTypePrefix}${(holidayInfo.type || 'Unknown').replace(/\s+/g, '-')}`;
      monthCell.classList.add(typeClass.toLowerCase());
      const translatedName = getTranslatedHolidayName(dateString, holidayInfo.name); // Assumes getTranslatedHolidayName is available
      monthCell.setAttribute('title', translatedName); // Tooltip for holiday name
      if (isCurrentMonth) { // Add holiday info to ARIA label only for current month
        const translatedType = translateHolidayType(holidayInfo.type); // Assumes translateHolidayType is available
        const typeText = holidayInfo.type ? t('holidayType', { type: translatedType }) : t('publicHoliday');
        monthCell.setAttribute('aria-label', monthCell.getAttribute('aria-label') + `, ${typeText}, ${translatedName}`);
      }
    } else if (holidayInfo) { // Still add base class for styling other month holidays
      monthCell.classList.add(CSS_CLASSES.cellHoliday);
      const typeClass = `${CSS_CLASSES.cellHolidayTypePrefix}${(holidayInfo.type || 'Unknown').replace(/\s+/g, '-')}`;
      monthCell.classList.add(typeClass.toLowerCase());
    }


    miniGrid.appendChild(monthCell);
    currentDate = addDays(currentDate, 1);
    // SYNTAX FIX: Removed extraneous text artifact below
  }
  // Append the rendered grid, replacing the placeholder content implicitly
  monthContainer.appendChild(miniGrid);
}

// --- Event Handling ---

/**
 * Handles clicks within the calendar grid (delegated).
 * Includes handling clicks on year view month headers.
 * @param {Event} event
 */
function handleCalendarClick(event) {
  // SYNTAX FIX: Used template literals for closest() arguments
  const dayCellTarget = event.target.closest(`.${CSS_CLASSES.gridDayCell}:not(.${CSS_CLASSES.cellOtherMonth}), .${CSS_CLASSES.gridMonthCell}:not(.${CSS_CLASSES.cellOtherMonth})`);
  const monthHeaderTarget = event.target.closest(`.${CSS_CLASSES.gridMonthHeader}`);

  if (dayCellTarget && dayCellTarget.dataset.date) {
    // --- Day Cell Clicked ---
    const newSelectedDate = parseISO(dayCellTarget.dataset.date);
    if (!isValid(newSelectedDate)) {
      console.error("Invalid date clicked:", dayCellTarget.dataset.date);
      return;
    }
    // setTimeToMidnight(newSelectedDate); // setTimeToMidnight returns a new date, doesn't modify in place

    const finalSelectedDate = setTimeToMidnight(newSelectedDate); // Use the returned date

    // Check if selection actually changed
    const selectionChanged = !state.selectedDate || !isSameDay(finalSelectedDate, state.selectedDate);

    if (selectionChanged) {
      // 1. Remove previous selection class
      const previousSelected = DOM_ELEMENTS.calendarGrid.querySelector(`.${CSS_CLASSES.cellSelected}`);
      if (previousSelected) {
        previousSelected.classList.remove(CSS_CLASSES.cellSelected);
        updateCellAriaLabel(previousSelected, false); // Update ARIA
      }

      // 2. Add new selection class
      dayCellTarget.classList.add(CSS_CLASSES.cellSelected);
      updateCellAriaLabel(dayCellTarget, true); // Update ARIA

      // 3. Update state
      updateState({ selectedDate: finalSelectedDate }); // Use the date set to midnight

      // 4. Update sidebar info
      updateDayInfoSidebar(finalSelectedDate); // Use the date set to midnight
    }

    // If year view was clicked, switch to month view for that date
    if (state.currentView === 'year' && selectionChanged) {
      handleMonthYearChange(getYear(finalSelectedDate), getMonth(finalSelectedDate));
      // handleMonthYearChange will update state and trigger render/UI updates
    } else if (state.currentView === 'year') {
      // If clicking the same date again in year view, still switch
      handleMonthYearChange(getYear(finalSelectedDate), getMonth(finalSelectedDate));
    }
    // SYNTAX FIX: Removed extraneous text artifact below
  } else if (monthHeaderTarget && monthHeaderTarget.dataset.year && monthHeaderTarget.dataset.month) {
    // --- Year View Month Header Clicked ---
    const year = parseInt(monthHeaderTarget.dataset.year, 10);
    const month = parseInt(monthHeaderTarget.dataset.month, 10);
    console.debug(`Year view month header clicked: ${month}/${year}`);
    handleMonthYearChange(year, month); // Use dedicated handler
  }
}

/**
 * Handles keyboard navigation and activation within the calendar grid.
 * @param {KeyboardEvent} event
 */
function handleGridKeyDown(event) {
  const { key, target } = event;
  // SYNTAX FIX: Used template literals for matches() arguments
  const isDayCell = target.matches(`.${CSS_CLASSES.gridDayCell}:not(.${CSS_CLASSES.cellOtherMonth}), .${CSS_CLASSES.gridMonthCell}:not(.${CSS_CLASSES.cellOtherMonth})`);
  const isMonthHeader = target.matches(`.${CSS_CLASSES.gridMonthHeader}`);

  // --- Activation (Enter/Space) ---
  if (key === 'Enter' || key === ' ') {
    if (isDayCell || isMonthHeader) {
      event.preventDefault();
      handleCalendarClick({ target: target }); // Simulate a click event
      return;
    }
  }

  // --- Arrow Key Navigation ---
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    return;
  }

  if (isDayCell) {
    event.preventDefault(); // Prevent page scroll
    navigateDayCellFocus(key, target);
  } else if (isMonthHeader && state.currentView === 'year') {
    event.preventDefault();
    navigateMonthHeaderFocus(key, target);
  }
}

/**
 * Handles arrow key navigation between focusable day cells.
 * @param {string} key - The arrow key pressed.
 * @param {HTMLElement} currentCell - The currently focused cell.
 */
function navigateDayCellFocus(key, currentCell) {
  let focusableCells = [];
  let currentIndex = -1;
  let numColumns = 7; // Default for mini-grid and month/week without week number column

  if (state.currentView === 'month' || state.currentView === 'week') {
    // Month/Week View (includes week number column, but cells are siblings)
    // SYNTAX FIX: Used template literal for querySelectorAll argument
    focusableCells = Array.from(
      DOM_ELEMENTS.calendarGrid.querySelectorAll(`.${CSS_CLASSES.gridDayCell}:not(.${CSS_CLASSES.cellOtherMonth})[tabindex="0"]`)
    );
    currentIndex = focusableCells.indexOf(currentCell);
    numColumns = 7; // Effective columns for day cells

    if (currentIndex === -1) return;
    let nextIndex = -1;

    switch (key) {
      case 'ArrowLeft':
        nextIndex = (currentIndex % numColumns !== 0) ? currentIndex - 1 : -1; break;
      case 'ArrowRight':
        nextIndex = (currentIndex % numColumns !== numColumns - 1) ? currentIndex + 1 : -1; break;
      case 'ArrowUp':
        nextIndex = currentIndex - numColumns; break;
      case 'ArrowDown':
        nextIndex = currentIndex + numColumns; break;
    }

    if (nextIndex >= 0 && nextIndex < focusableCells.length) {
      focusableCells[nextIndex].focus();
    }
    // TODO: Handle jumping between weeks/months if ArrowUp/Down goes out of bounds?
    // SYNTAX FIX: Removed extraneous text artifact below
  } else if (state.currentView === 'year') {
    // Year View (Mini-grids)
    // SYNTAX FIX: Used template literal for closest() argument
    const parentMiniGrid = currentCell.closest(`.${CSS_CLASSES.gridMiniCalendar}`);
    if (!parentMiniGrid) return;
    // SYNTAX FIX: Used template literal for querySelectorAll argument
    focusableCells = Array.from(parentMiniGrid.querySelectorAll(`.${CSS_CLASSES.gridMonthCell}:not(.${CSS_CLASSES.cellOtherMonth})[tabindex="0"]`));
    const miniIndex = focusableCells.indexOf(currentCell);
    if (miniIndex === -1) return;

    numColumns = 7; // Mini-grid always 7 wide
    let nextIndex = -1;

    switch (key) {
      case 'ArrowLeft':
        nextIndex = (miniIndex % numColumns !== 0) ? miniIndex - 1 : -1; break;
      case 'ArrowRight':
        nextIndex = (miniIndex % numColumns !== numColumns - 1) ? miniIndex + 1 : -1; break;
      case 'ArrowUp':
        if (miniIndex >= numColumns) { // Can move up within the same grid
          nextIndex = miniIndex - numColumns;
        } else { // At the top row, try moving to month header or prev month
          // SYNTAX FIX: Used template literal for closest() argument
          const monthContainer = parentMiniGrid.closest(`.${CSS_CLASSES.gridMonthContainer}`);
          // SYNTAX FIX: Used template literal for querySelector() argument
          focusElement(monthContainer?.querySelector(`.${CSS_CLASSES.gridMonthHeader}`)); // Focus header first
          return; // Stop further processing
        }
        break;
      case 'ArrowDown':
        if (miniIndex < focusableCells.length - numColumns) { // Can move down within the same grid
          nextIndex = miniIndex + numColumns;
        } else { // At the bottom row, try moving to next month's header or cell
          // SYNTAX FIX: Used template literal for closest() argument
          const monthContainer = parentMiniGrid.closest(`.${CSS_CLASSES.gridMonthContainer}`);
          const nextMonthContainer = monthContainer?.nextElementSibling;
          // SYNTAX FIX: Used template literal for querySelector() argument
          focusElement(nextMonthContainer?.querySelector(`.${CSS_CLASSES.gridMonthHeader}`)); // Focus next header
          return; // Stop further processing
        }
        break;
    }

    if (nextIndex !== -1 && nextIndex < focusableCells.length) {
      focusElement(focusableCells[nextIndex]);
    }
    // SYNTAX FIX: Removed extraneous text artifact below
  }
}

/**
 * Handles arrow key navigation between focusable month headers in Year View.
 * @param {string} key - The arrow key pressed.
 * @param {HTMLElement} currentHeader - The currently focused header.
 */
function navigateMonthHeaderFocus(key, currentHeader) {
  // SYNTAX FIX: Used template literal for querySelectorAll argument
  const allHeaders = Array.from(DOM_ELEMENTS.calendarGrid.querySelectorAll(`.${CSS_CLASSES.gridMonthHeader}[tabindex="0"]`));
  const currentIndex = allHeaders.indexOf(currentHeader);
  if (currentIndex === -1) return;

  let nextIndex = -1;
  const numColumns = window.getComputedStyle(DOM_ELEMENTS.calendarGrid).gridTemplateColumns.split(' ').length; // Estimate columns

  switch (key) {
    case 'ArrowLeft':
      nextIndex = currentIndex > 0 ? currentIndex - 1 : -1; break;
    case 'ArrowRight':
      nextIndex = currentIndex < allHeaders.length - 1 ? currentIndex + 1 : -1; break;
    case 'ArrowUp':
      nextIndex = currentIndex >= numColumns ? currentIndex - numColumns : -1; break;
    case 'ArrowDown':
      // If moving down from header, focus the first focusable day in that month's grid
      // SYNTAX FIX: Used template literal for closest() argument
      const monthContainer = currentHeader.closest(`.${CSS_CLASSES.gridMonthContainer}`);
      // SYNTAX FIX: Used template literal for querySelector() argument
      const firstDayCell = monthContainer?.querySelector(`.${CSS_CLASSES.gridMonthCell}:not(.${CSS_CLASSES.cellOtherMonth})[tabindex="0"]`);
      if (firstDayCell) {
        focusElement(firstDayCell);
        return; // Stop default header navigation
      }
      // Fallback: try moving to header below if no day cell found
      nextIndex = currentIndex + numColumns;
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

/**
 * Updates the ARIA label of a cell to include/exclude the "Selected" state.
 * @param {HTMLElement} cellElement - The cell element.
 * @param {boolean} isSelected - Whether the cell is now selected.
 */
function updateCellAriaLabel(cellElement, isSelected) {
  if (!cellElement || !cellElement.hasAttribute('aria-label')) return;

  let currentLabel = cellElement.getAttribute('aria-label') || '';
  // SYNTAX FIX: Used template literal (backticks) for string assignment with interpolation
  const selectedText = `, ${t('selected')}`; // Use translation helper

  // Remove existing selected state text (simple replace)
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
  // Remove previous listeners first to avoid duplicates
  if (gridKeydownHandler) {
    DOM_ELEMENTS.calendarGrid.removeEventListener('keydown', gridKeydownHandler);
  }
  // Remove potential old click listener (might be added multiple times otherwise)
  // Consider making handleCalendarClick a stored reference if needed, but usually safe to remove/add
  // DOM_ELEMENTS.calendarGrid.removeEventListener('click', handleCalendarClick);

  if (DOM_ELEMENTS.calendarGrid) {
    // Use capturing phase for click to potentially handle header clicks before day clicks if nested? Or keep bubbling. Bubbling is fine here.
    DOM_ELEMENTS.calendarGrid.addEventListener('click', handleCalendarClick);
    gridKeydownHandler = handleGridKeyDown; // Store reference
    DOM_ELEMENTS.calendarGrid.addEventListener('keydown', gridKeydownHandler);
    // SYNTAX FIX: Removed extraneous text artifact below
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
    map[formatDateYYYYMMDD(item.date)] = true; // Assumes formatDateYYYYMMDD is available
    return map;
  }, {});

  // Highlight across potentially multiple rendered views/mini-grids
  const cells = DOM_ELEMENTS.calendarGrid.querySelectorAll('[data-date]');
  cells.forEach(cell => {
    if (resultsMap[cell.dataset.date]) {
      cell.classList.add(CSS_CLASSES.cellSearchHighlight);
    }
  });
}

/**
 * Removes highlight class from all cells.
 */
function clearSearchHighlights() {
  // SYNTAX FIX: Used template literal for querySelectorAll argument
  const highlighted = DOM_ELEMENTS.calendarGrid.querySelectorAll(`.${CSS_CLASSES.cellSearchHighlight}`);
  highlighted.forEach(cell => cell.classList.remove(CSS_CLASSES.cellSearchHighlight));
}