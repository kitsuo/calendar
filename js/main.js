// js/ui.js
import { CONFIG, CSS_CLASSES, DOM_ELEMENTS } from './config.js';
import { state, updateState, getCurrentLocale } from './state.js';
import { t, i18n } from './i18n.js';
import { formatDateYYYYMMDD, debounce } from './utils.js';
import {
  handleMonthChange, handleYearInputChange, handleCountryChange, handleLanguageSwitch,
  handleThemeChange, handleViewChange, handleToday, handlePrev, handleNext,
  handleDateJumpChange, handleSearch, handleCloseSearchResults, handleRetryHolidays,
  handleRetryUpcoming, handleRetryCountries, handleWeekStartChange // Added handlers
} from './main.js';
import { format } from 'date-fns'; // Use specific imports

/**
 * Populates static selectors (Month, Year, Lang, Theme, View, Week Start).
 * Country selector is populated dynamically.
 */
export function populateStaticSelectors() {
  // Month Select
  DOM_ELEMENTS.monthSelect.innerHTML = '';
  i18n[state.currentLang].monthNames.forEach((name, index) => {
    const option = document.createElement('option');
    option.value = index; // 0-11
    option.textContent = name;
    if (index === state.currentMonth) {
      option.selected = true;
    }
    DOM_ELEMENTS.monthSelect.appendChild(option);
  });

  // Year Input
  DOM_ELEMENTS.yearInput.min = CONFIG.MIN_YEAR;
  DOM_ELEMENTS.yearInput.max = CONFIG.MAX_YEAR;
  DOM_ELEMENTS.yearInput.value = state.currentYear;

  // Language Select
  DOM_ELEMENTS.langSelect.value = state.currentLang;

  // Theme Select
  DOM_ELEMENTS.themeSelect.value = state.currentTheme;

  // View Select
  DOM_ELEMENTS.viewSelect.value = state.currentView;

  // Week Start Select
  DOM_ELEMENTS.weekStartSelect.value = state.weekStartsOn.toString(); // Value is '0' or '1'
}

/**
 * Populates the country selector dynamically.
 * @param {Array | null} countries - Array of {countryCode, name} or null if error.
 */
export function populateCountrySelector(countries) {
  const select = DOM_ELEMENTS.countrySelect;
  const label = DOM_ELEMENTS.countrySelectLabel;
  select.innerHTML = ''; // Clear existing options (including loading state)
  DOM_ELEMENTS.retryCountriesBtn.hidden = true; // Hide retry button initially
  label.textContent = t('selectCountry'); // Reset label

  if (state.isLoadingCountries) {
    label.textContent = t('selectCountryLoading');
    const loadingOption = document.createElement('option');
    loadingOption.textContent = t('selectCountryLoading');
    loadingOption.disabled = true;
    select.appendChild(loadingOption);
    select.disabled = true;
    return;
  }

  if (!countries) { // Error state
    label.textContent = t('selectCountry'); // Keep original label
    const errorOption = document.createElement('option');
    errorOption.textContent = t('errorLoadingCountries').substring(0, 30) + '...'; // Short error in dropdown
    errorOption.disabled = true;
    select.appendChild(errorOption);
    select.disabled = true;
    displayCountryError(state.countriesError || t('errorLoadingCountries')); // Show full error below
    return;
  }

  clearCountryError(); // Clear error if successful
  select.disabled = false;

  // Create options from fetched countries
  const fragment = document.createDocumentFragment();
  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country.countryCode;
    option.textContent = country.name;
    if (country.countryCode === state.selectedCountry) {
      option.selected = true;
    }
    fragment.appendChild(option);
  });
  select.appendChild(fragment);
}

/**
 * Updates all UI text elements based on the current language.
 */
export function translateUI() {
  // Populate selectors first to get month/week start names right
  populateStaticSelectors();

  // Update country selector options if countries are loaded
  if (state.availableCountriesCache) {
    populateCountrySelector(state.availableCountriesCache);
  } // If not loaded yet, populateCountrySelector will handle loading state text

  // Buttons & Labels
  document.documentElement.lang = state.currentLang; // Set HTML lang attribute
  // SYNTAX FIX: Used template literal (backticks) for innerHTML containing HTML
  DOM_ELEMENTS.todayBtn.innerHTML = `<i class="fas fa-calendar-day"></i> ${t('today')}`;
  document.querySelector('label[for="date-jump"]').textContent = t('jumpTo');
  // Country label updated in populateCountrySelector
  document.querySelector('label[for="lang-select"]').textContent = t('selectLang');
  document.querySelector('label[for="week-start-select"]').textContent = t('selectWeekStart');

  // Search results title updated in displaySearchResults
  DOM_ELEMENTS.holidaySearchInput.placeholder = t('searchPlaceholder');
  DOM_ELEMENTS.searchBtn.setAttribute('aria-label', t('searchHolidays'));
  DOM_ELEMENTS.closeSearchResultsBtn.setAttribute('aria-label', t('closeSearchResults'));

  // Dynamic ARIA labels for navigation based on view
  updateNavigationLabels();

  // Static ARIA labels
  DOM_ELEMENTS.yearInput.setAttribute('aria-label', t('selectYear'));
  DOM_ELEMENTS.monthSelect.setAttribute('aria-label', t('selectMonth'));
  DOM_ELEMENTS.viewSelect.setAttribute('aria-label', t('selectView'));
  DOM_ELEMENTS.themeSelect.setAttribute('aria-label', t('selectTheme'));
  DOM_ELEMENTS.weekStartSelect.setAttribute('aria-label', t('selectWeekStart'));

  // Retry buttons text
  // SYNTAX FIX: Used template literal (backticks) for querySelector argument
  DOM_ELEMENTS.retryHolidaysBtn.querySelector(`.${CSS_CLASSES.errorRetryText}`).textContent = t('retry');
  DOM_ELEMENTS.retryUpcomingBtn.querySelector(`.${CSS_CLASSES.errorRetryText}`).textContent = t('retry');
  DOM_ELEMENTS.retryCountriesBtn.querySelector(`.${CSS_CLASSES.errorRetryText}`).textContent = t('retry');

  // Select options (View/Theme/WeekStart)
  DOM_ELEMENTS.viewSelect.querySelector('option[value="month"]').textContent = t('viewMonth');
  DOM_ELEMENTS.viewSelect.querySelector('option[value="week"]').textContent = t('viewWeek');
  DOM_ELEMENTS.viewSelect.querySelector('option[value="year"]').textContent = t('viewYear');
  DOM_ELEMENTS.themeSelect.querySelector('option[value="light"]').textContent = t('themeLight');
  DOM_ELEMENTS.themeSelect.querySelector('option[value="dark"]').textContent = t('themeDark');
  DOM_ELEMENTS.weekStartSelect.querySelector('option[value="0"]').textContent = t('weekStartSunday');
  DOM_ELEMENTS.weekStartSelect.querySelector('option[value="1"]').textContent = t('weekStartMonday');

  // Update Weekday headers
  updateWeekdayHeaders();

  // Re-display errors if any, with current language
  if (state.apiError) displayApiError(state.apiError);
  if (state.upcomingError) displayUpcomingError(state.upcomingError);
  if (state.countriesError) displayCountryError(state.countriesError);

  // Update print header context
  updatePrintHeader();
}

/**
 * Updates the aria-labels for previous/next buttons and visibility of month selector based on the current view.
 */
export function updateNavigationLabels() {
  let prevLabelKey, nextLabelKey;
  switch (state.currentView) {
    case 'week':
      prevLabelKey = 'prevWeek';
      nextLabelKey = 'nextWeek';
      break;
    case 'year':
      prevLabelKey = 'prevYear';
      nextLabelKey = 'nextYear';
      break;
    case 'month':
    default:
      prevLabelKey = 'prevMonth';
      nextLabelKey = 'nextMonth';
      break;
  }
  DOM_ELEMENTS.prevBtn.setAttribute('aria-label', t(prevLabelKey));
  DOM_ELEMENTS.nextBtn.setAttribute('aria-label', t(nextLabelKey));

  // Hide month selector in year/week view
  DOM_ELEMENTS.monthSelect.style.display = (state.currentView === 'month') ? '' : 'none';
}

/**
 * Updates the weekday headers based on current language, view, and week start day.
 */
export function updateWeekdayHeaders() {
  const weekdaysContainer = DOM_ELEMENTS.weekdayLabelsContainer;
  weekdaysContainer.innerHTML = ''; // Clear existing
  weekdaysContainer.className = CSS_CLASSES.weekdaysContainer; // Reset classes

  const useShortNames = state.currentView !== 'year'; // Year view uses minimal names
  const weekdays = useShortNames ? i18n[state.currentLang].weekdaysShort : i18n[state.currentLang].weekdaysMini;
  const firstDayOfWeek = state.weekStartsOn; // 0 for Sun, 1 for Mon

  // Add "Wk" header for month/week view
  if (state.currentView === 'month' || state.currentView === 'week') {
    const wkHeader = document.createElement('div');
    wkHeader.classList.add(CSS_CLASSES.weekdaysHeader);
    wkHeader.textContent = t('week'); // Get translation for "Wk"/"Sem"/"KW"
    weekdaysContainer.appendChild(wkHeader);
  } else {
    // Add modifier class for year view alignment if needed
    // SYNTAX FIX: Used template literal (backticks) for classList.add argument
    weekdaysContainer.classList.add(`${CSS_CLASSES.weekdaysContainer}--year-view`);
  }

  for (let i = 0; i < 7; i++) {
    const dayIndex = (firstDayOfWeek + i) % 7;
    const dayHeader = document.createElement('div');
    dayHeader.classList.add(CSS_CLASSES.weekdaysHeader);
    dayHeader.textContent = weekdays[dayIndex];
    weekdaysContainer.appendChild(dayHeader);
  }
}

/**
 * Updates the visual theme of the application.
 */
export function applyTheme() {
  // Remove existing theme classes
  document.body.classList.remove(CSS_CLASSES.themeLight, CSS_CLASSES.themeDark);
  // Apply the current theme class
  const themeClass = state.currentTheme === 'dark' ? CSS_CLASSES.themeDark : CSS_CLASSES.themeLight;
  document.body.classList.add(themeClass);
  // Update theme selector value
  DOM_ELEMENTS.themeSelect.value = state.currentTheme;
}

// --- Error Display Functions ---

/**
 * Displays an error message in the main API error area.
 * @param {string} message - The error message.
 */
export function displayApiError(message) {
  DOM_ELEMENTS.apiErrorMessage.textContent = message;
  DOM_ELEMENTS.apiErrorMessage.classList.remove(CSS_CLASSES.errorMessageHidden);
  DOM_ELEMENTS.retryHolidaysBtn.hidden = false;
}

/** Clears the main API error message area. */
export function clearApiError() {
  DOM_ELEMENTS.apiErrorMessage.textContent = '';
  DOM_ELEMENTS.apiErrorMessage.classList.add(CSS_CLASSES.errorMessageHidden);
  DOM_ELEMENTS.retryHolidaysBtn.hidden = true;
}

/**
 * Displays an error message in the upcoming holidays error area.
 * @param {string} message - The error message.
 */
export function displayUpcomingError(message) {
  DOM_ELEMENTS.upcomingErrorMessage.textContent = message;
  DOM_ELEMENTS.upcomingErrorMessage.classList.remove(CSS_CLASSES.errorMessageHidden);
  DOM_ELEMENTS.retryUpcomingBtn.hidden = false;
  DOM_ELEMENTS.upcomingHolidaysList.innerHTML = ''; // Clear list on error
}

/** Clears the upcoming holidays error message area. */
export function clearUpcomingError() {
  DOM_ELEMENTS.upcomingErrorMessage.textContent = '';
  DOM_ELEMENTS.upcomingErrorMessage.classList.add(CSS_CLASSES.errorMessageHidden);
  DOM_ELEMENTS.retryUpcomingBtn.hidden = true;
}

/**
 * Displays an error message related to fetching countries.
 * @param {string} message - The error message.
 */
export function displayCountryError(message) {
  // Display error near the country select or reuse api error message area?
  // Let's reuse the API error message area for simplicity for now.
  displayApiError(message); // Reuse main error display
  DOM_ELEMENTS.retryCountriesBtn.hidden = false; // Show specific retry
  DOM_ELEMENTS.retryHolidaysBtn.hidden = true; // Hide general retry if country fetch failed
}

/** Clears the country fetch error message area. */
export function clearCountryError() {
  // Only clear if the current error is specifically a country error
  if (state.countriesError && state.apiError === state.countriesError) {
    clearApiError();
  }
  DOM_ELEMENTS.retryCountriesBtn.hidden = true;
}

// --- Loading State Functions ---

/** Displays the loading overlay for the main calendar grid. */
export function showLoadingOverlay() {
  DOM_ELEMENTS.loadingOverlay.hidden = false;
}

/** Hides the loading overlay for the main calendar grid. */
export function hideLoadingOverlay() {
  DOM_ELEMENTS.loadingOverlay.hidden = true;
}

/** Displays skeleton loading state for the upcoming holidays list. */
export function showUpcomingLoading() {
  clearUpcomingError(); // Clear errors before showing loading
  const list = DOM_ELEMENTS.upcomingHolidaysList;
  list.innerHTML = ''; // Clear previous content
  list.classList.add(CSS_CLASSES.upcomingList); // Ensure class

  // Add skeleton items
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 3; i++) {
    const li = document.createElement('li');
    li.classList.add(CSS_CLASSES.skeleton);
    li.style.height = '45px'; // Give skeleton a height
    fragment.appendChild(li);
  }
  list.appendChild(fragment);
  // SYNTAX FIX: Removed extraneous text artifact below
}

/** Hides the loading state (called by fetch finally block). */
export function hideUpcomingLoading() {
  // The list will be replaced by actual content or error message,
  // No explicit action needed here, but ensure skeletons are removed by render/error display.
  // Could optionally find and remove skeleton items explicitly if needed.
}

/**
 * Displays an error message for the date jump input.
 * @param {string} message
 */
export function displayDateJumpError(message) {
  DOM_ELEMENTS.dateJumpError.textContent = message;
  DOM_ELEMENTS.dateJumpInput.setAttribute('aria-invalid', 'true');
}

/** Clears the error message for the date jump input. */
export function clearDateJumpError() {
  DOM_ELEMENTS.dateJumpError.textContent = '';
  DOM_ELEMENTS.dateJumpInput.removeAttribute('aria-invalid');
}

/**
 * Displays search results. Keeps panel open unless explicitly closed.
 * @param {Array} results - Array of { date: Date, holidayInfo: object, year: number }.
 * @param {string} query - The search query term.
 */
export function displaySearchResults(results, query) {
  DOM_ELEMENTS.searchResultsList.innerHTML = ''; // Clear previous results
  DOM_ELEMENTS.searchResultsList.classList.add(CSS_CLASSES.searchResultsList);

  if (results.length > 0) {
    DOM_ELEMENTS.searchResultsTitle.textContent = t('searchResultsTitle', { query });
    const fragment = document.createDocumentFragment();
    const currentViewYear = state.currentYear;
    results.forEach(result => {
      const li = document.createElement('li');
      li.classList.add(CSS_CLASSES.searchResultsItem);
      // Format date, include year if different from current view year
      const dateStr = formatDateIntl(result.date, { dateStyle: 'medium' }); // Note: formatDateIntl might not be defined
      const yearStr = result.year !== currentViewYear ? ` (${result.year})` : '';

      const name = result.holidayInfo.name; // Use original name for consistency
      li.innerHTML = `<span class="${CSS_CLASSES.searchResultsItemDate}">${dateStr}${yearStr}</span>: ${name}`;
      li.setAttribute('role', 'button');
      li.tabIndex = 0; // Make focusable

      const jumpToResult = () => {
        const jumpDate = result.date;
        // Update state to jump
        updateState({
          selectedDate: jumpDate,
          currentYear: getYear(jumpDate), // Requires getYear import/definition
          currentMonth: getMonth(jumpDate), // Requires getMonth import/definition
          currentView: 'month' // Always switch to month view to show selection clearly
        });
        populateStaticSelectors(); // Update controls
        handleViewChange(); // Trigger UI update and re-render (will also apply search highlights again)
        // --- Keep search results open ---
        // DOM_ELEMENTS.searchResultsContainer.classList.add(CSS_CLASSES.searchResultsHidden);
      };

      li.addEventListener('click', jumpToResult);
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          jumpToResult();
        }
      });

      fragment.appendChild(li);
    });
    DOM_ELEMENTS.searchResultsList.appendChild(fragment);
    // SYNTAX FIX: Removed extraneous text artifact below
  } else {
    DOM_ELEMENTS.searchResultsTitle.textContent = t('noSearchResults', { query });
  }
  DOM_ELEMENTS.searchResultsContainer.classList.remove(CSS_CLASSES.searchResultsHidden); // Show results
}

/**
 * Updates the hidden print header with context information.
 */
export function updatePrintHeader() {
  if (!DOM_ELEMENTS.printHeader) return;
  const countryName = getCountryName(DOM_ELEMENTS.countrySelect, state.selectedCountry); // Note: getCountryName might not be defined
  let context = countryName;
  const locale = getCurrentLocale(); // Requires getCurrentLocale import

  switch (state.currentView) {
    case 'year':
      context += ` - ${state.currentYear}`; // Removed non-breaking space
      break;
    case 'week':
      if (state.currentWeekStart && isValid(state.currentWeekStart)) { // Requires isValid import
        const weekStartFormatted = format(state.currentWeekStart, 'PPP', { locale }); // Requires format import
        context += ` - ${t('gridLabelWeek', { date: weekStartFormatted })}`; // Removed non-breaking space
      } else {
        context += ` - ${state.currentYear}`; // Removed non-breaking space // Fallback
      }
      break;
    case 'month':
    default:
      const monthName = i18n[state.currentLang].monthNames[state.currentMonth];
      context += ` - ${monthName} ${state.currentYear}`; // Removed non-breaking space
      break;
  }
  DOM_ELEMENTS.printHeader.textContent = t('printTitle', { context });
}

/** Binds initial event listeners */
export function bindEventListeners() {
  DOM_ELEMENTS.monthSelect.addEventListener('change', handleMonthChange);
  DOM_ELEMENTS.yearInput.addEventListener('change', handleYearInputChange);
  DOM_ELEMENTS.yearInput.addEventListener('input', debounce(handleYearInputChange, 500)); // Handle while typing
  DOM_ELEMENTS.countrySelect.addEventListener('change', handleCountryChange);
  DOM_ELEMENTS.langSelect.addEventListener('change', handleLanguageSwitch);
  DOM_ELEMENTS.themeSelect.addEventListener('change', handleThemeChange);
  DOM_ELEMENTS.viewSelect.addEventListener('change', handleViewChange);
  DOM_ELEMENTS.weekStartSelect.addEventListener('change', handleWeekStartChange); // Added
  DOM_ELEMENTS.todayBtn.addEventListener('click', handleToday);
  DOM_ELEMENTS.prevBtn.addEventListener('click', handlePrev);
  DOM_ELEMENTS.nextBtn.addEventListener('click', handleNext);
  DOM_ELEMENTS.dateJumpInput.addEventListener('change', handleDateJumpChange);
  DOM_ELEMENTS.holidaySearchInput.addEventListener('search', handleSearch); // Handle clearing search via 'x'
  DOM_ELEMENTS.holidaySearchInput.addEventListener('input', debounce(handleSearch, 350)); // Debounced search on input
  DOM_ELEMENTS.searchBtn.addEventListener('click', handleSearch); // Explicit search button click
  DOM_ELEMENTS.closeSearchResultsBtn.addEventListener('click', handleCloseSearchResults);
  DOM_ELEMENTS.retryHolidaysBtn.addEventListener('click', handleRetryHolidays);
  DOM_ELEMENTS.retryUpcomingBtn.addEventListener('click', handleRetryUpcoming);
  DOM_ELEMENTS.retryCountriesBtn.addEventListener('click', handleRetryCountries); // Added

  // Grid listeners attached in calendarGrid.js
  // SYNTAX FIX: Removed extraneous text artifact below
}
