// js/ui.js
import { CONFIG, CSS_CLASSES, DOM_ELEMENTS } from './config.js';
import { state, updateState, getCurrentLocale } from './state.js';
// Corrected import for formatDateIntl
import { t, i18n, formatDateIntl } from './i18n.js';
// Corrected import for getCountryName and createDocumentFragment
import { formatDateYYYYMMDD, debounce, getCountryName, createDocumentFragment } from './utils.js';
import {
  handleMonthChange, handleYearInputChange, handleCountryChange, handleLanguageSwitch,
  handleThemeChange, handleViewChange, handleToday, handlePrev, handleNext,
  handleDateJumpChange, handleSearch, handleCloseSearchResults, handleRetryHolidays,
  handleRetryUpcoming, handleRetryCountries, handleWeekStartChange
} from './main.js';
// Corrected import: added getMonth, getYear, isValid needed by displaySearchResults logic
import { format, getMonth, getYear, isValid } from 'date-fns';

// --- UI Population Functions ---

/**
 * Populates static selectors (Month, Year, Lang, Theme, View, Week Start).
 */
export function populateStaticSelectors() {
  DOM_ELEMENTS.monthSelect.innerHTML = '';
  const currentLangMonths = i18n[state.currentLang]?.monthNames || i18n['en'].monthNames;
  currentLangMonths.forEach((name, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = name;
    if (index === state.currentMonth) {
      option.selected = true;
    }
    DOM_ELEMENTS.monthSelect.appendChild(option);
  });

  DOM_ELEMENTS.yearInput.min = CONFIG.MIN_YEAR;
  DOM_ELEMENTS.yearInput.max = CONFIG.MAX_YEAR;
  DOM_ELEMENTS.yearInput.value = state.currentYear;
  DOM_ELEMENTS.langSelect.value = state.currentLang;
  DOM_ELEMENTS.themeSelect.value = state.currentTheme;
  DOM_ELEMENTS.viewSelect.value = state.currentView;
  DOM_ELEMENTS.weekStartSelect.value = state.weekStartsOn.toString();
}

/**
 * Populates the country selector dynamically.
 * @param {Array | null} countries - Array of {countryCode, name} or null if error/loading.
 */
export function populateCountrySelector(countries) {
  const select = DOM_ELEMENTS.countrySelect;
  select.innerHTML = '';
  DOM_ELEMENTS.retryCountriesBtn.hidden = true;

  if (state.isLoadingCountries) {
    const loadingOption = document.createElement('option');
    loadingOption.textContent = t('selectCountryLoading');
    loadingOption.disabled = true;
    select.appendChild(loadingOption);
    select.disabled = true;
    return;
  }

  if (!countries) {
    const errorOption = document.createElement('option');
    errorOption.textContent = t('errorLoadingCountries').substring(0, 30) + '...';
    errorOption.disabled = true;
    select.appendChild(errorOption);
    select.disabled = true;
    displayCountryError(state.countriesError || t('errorLoadingCountries'));
    return;
  }

  clearCountryError();
  select.disabled = false;

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
  populateStaticSelectors();

  if (state.availableCountriesCache) {
    populateCountrySelector(state.availableCountriesCache);
  }

  document.documentElement.lang = state.currentLang;
  DOM_ELEMENTS.todayBtn.innerHTML = `<i class="fas fa-calendar-day"></i> ${t('today')}`;
  const dateJumpLabel = document.querySelector('label[for="date-jump"]');
  if (dateJumpLabel) dateJumpLabel.textContent = t('jumpTo');
  // Update country label text (might be separate or part of populate selector)
  if(DOM_ELEMENTS.countrySelectLabel) DOM_ELEMENTS.countrySelectLabel.textContent = t('selectCountry');
  const langSelectLabel = document.querySelector('label[for="lang-select"]');
  if (langSelectLabel) langSelectLabel.textContent = t('selectLang');
  const weekStartLabel = document.querySelector('label[for="week-start-select"]');
  if (weekStartLabel) weekStartLabel.textContent = t('selectWeekStart');

  DOM_ELEMENTS.holidaySearchInput.placeholder = t('searchPlaceholder');
  DOM_ELEMENTS.searchBtn.setAttribute('aria-label', t('searchHolidays'));
  DOM_ELEMENTS.closeSearchResultsBtn.setAttribute('aria-label', t('closeSearchResults'));

  updateNavigationLabels();

  DOM_ELEMENTS.yearInput.setAttribute('aria-label', t('selectYear'));
  DOM_ELEMENTS.monthSelect.setAttribute('aria-label', t('selectMonth'));
  DOM_ELEMENTS.viewSelect.setAttribute('aria-label', t('selectView'));
  DOM_ELEMENTS.themeSelect.setAttribute('aria-label', t('selectTheme'));
  DOM_ELEMENTS.weekStartSelect.setAttribute('aria-label', t('selectWeekStart'));

  const retryHolidaysText = DOM_ELEMENTS.retryHolidaysBtn.querySelector(`.${CSS_CLASSES.errorRetryText}`);
  if (retryHolidaysText) retryHolidaysText.textContent = t('retry');
  const retryUpcomingText = DOM_ELEMENTS.retryUpcomingBtn.querySelector(`.${CSS_CLASSES.errorRetryText}`);
  if (retryUpcomingText) retryUpcomingText.textContent = t('retry');
  const retryCountriesText = DOM_ELEMENTS.retryCountriesBtn.querySelector(`.${CSS_CLASSES.errorRetryText}`);
  if (retryCountriesText) retryCountriesText.textContent = t('retry');

  const viewMonthOption = DOM_ELEMENTS.viewSelect.querySelector('option[value="month"]');
  if(viewMonthOption) viewMonthOption.textContent = t('viewMonth');
  const viewWeekOption = DOM_ELEMENTS.viewSelect.querySelector('option[value="week"]');
  if(viewWeekOption) viewWeekOption.textContent = t('viewWeek');
  const viewYearOption = DOM_ELEMENTS.viewSelect.querySelector('option[value="year"]');
  if(viewYearOption) viewYearOption.textContent = t('viewYear');

  const themeLightOption = DOM_ELEMENTS.themeSelect.querySelector('option[value="light"]');
  if(themeLightOption) themeLightOption.textContent = t('themeLight');
  const themeDarkOption = DOM_ELEMENTS.themeSelect.querySelector('option[value="dark"]');
  if(themeDarkOption) themeDarkOption.textContent = t('themeDark');

  const weekStartSunOption = DOM_ELEMENTS.weekStartSelect.querySelector('option[value="0"]');
  if(weekStartSunOption) weekStartSunOption.textContent = t('weekStartSunday');
  const weekStartMonOption = DOM_ELEMENTS.weekStartSelect.querySelector('option[value="1"]');
  if(weekStartMonOption) weekStartMonOption.textContent = t('weekStartMonday');

  updateWeekdayHeaders();

  if (state.apiError) displayApiError(state.apiError);
  if (state.upcomingError) displayUpcomingError(state.upcomingError);
  if (state.countriesError) displayCountryError(state.countriesError);

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
  DOM_ELEMENTS.monthSelect.style.display = (state.currentView === 'month') ? '' : 'none';
}

/**
 * Updates the weekday headers based on current language, view, and week start day.
 */
export function updateWeekdayHeaders() {
  const weekdaysContainer = DOM_ELEMENTS.weekdayLabelsContainer;
  if (!weekdaysContainer) return;

  weekdaysContainer.innerHTML = '';
  weekdaysContainer.className = CSS_CLASSES.weekdaysContainer;

  const currentLangData = i18n[state.currentLang] || i18n['en'];
  const useShortNames = state.currentView !== 'year';
  const weekdays = useShortNames ? currentLangData.weekdaysShort : currentLangData.weekdaysMini;
  const firstDayOfWeek = state.weekStartsOn;

  if (state.currentView === 'month' || state.currentView === 'week') {
    const wkHeader = document.createElement('div');
    wkHeader.classList.add(CSS_CLASSES.weekdaysHeader);
    wkHeader.textContent = t('week');
    weekdaysContainer.appendChild(wkHeader);
  } else {
    weekdaysContainer.classList.add(`${CSS_CLASSES.weekdaysContainer}--year-view`);
  }

  if (weekdays && weekdays.length === 7) {
    for (let i = 0; i < 7; i++) {
      const dayIndex = (firstDayOfWeek + i) % 7;
      const dayHeader = document.createElement('div');
      dayHeader.classList.add(CSS_CLASSES.weekdaysHeader);
      dayHeader.textContent = weekdays[dayIndex];
      weekdaysContainer.appendChild(dayHeader);
    }
  } else {
      console.error("Weekday names not available for language:", state.currentLang);
  }
}

/**
 * Updates the visual theme of the application.
 */
export function applyTheme() {
  document.body.classList.remove(CSS_CLASSES.themeLight, CSS_CLASSES.themeDark);
  const themeClass = state.currentTheme === 'dark' ? CSS_CLASSES.themeDark : CSS_CLASSES.themeLight;
  document.body.classList.add(themeClass);
  DOM_ELEMENTS.themeSelect.value = state.currentTheme;
}

// --- Error Display Functions ---

export function displayApiError(message) {
  DOM_ELEMENTS.apiErrorMessage.textContent = message;
  DOM_ELEMENTS.apiErrorMessage.classList.remove(CSS_CLASSES.errorMessageHidden);
  DOM_ELEMENTS.retryHolidaysBtn.hidden = false;
}

export function clearApiError() {
  DOM_ELEMENTS.apiErrorMessage.textContent = '';
  DOM_ELEMENTS.apiErrorMessage.classList.add(CSS_CLASSES.errorMessageHidden);
  DOM_ELEMENTS.retryHolidaysBtn.hidden = true;
}

export function displayUpcomingError(message) {
  DOM_ELEMENTS.upcomingErrorMessage.textContent = message;
  DOM_ELEMENTS.upcomingErrorMessage.classList.remove(CSS_CLASSES.errorMessageHidden);
  DOM_ELEMENTS.retryUpcomingBtn.hidden = false;
  DOM_ELEMENTS.upcomingHolidaysList.innerHTML = '';
}

export function clearUpcomingError() {
  DOM_ELEMENTS.upcomingErrorMessage.textContent = '';
  DOM_ELEMENTS.upcomingErrorMessage.classList.add(CSS_CLASSES.errorMessageHidden);
  DOM_ELEMENTS.retryUpcomingBtn.hidden = true;
}

export function displayCountryError(message) {
  displayApiError(message);
  DOM_ELEMENTS.retryCountriesBtn.hidden = false;
  DOM_ELEMENTS.retryHolidaysBtn.hidden = true;
}

export function clearCountryError() {
  if (state.countriesError && state.apiError === state.countriesError) {
    clearApiError();
  }
  DOM_ELEMENTS.retryCountriesBtn.hidden = true;
}

// --- Loading State Functions ---

export function showLoadingOverlay() {
  DOM_ELEMENTS.loadingOverlay.hidden = false;
}

export function hideLoadingOverlay() {
  DOM_ELEMENTS.loadingOverlay.hidden = true;
}

export function showUpcomingLoading() {
  clearUpcomingError();
  const list = DOM_ELEMENTS.upcomingHolidaysList;
  list.innerHTML = '';
  list.classList.add(CSS_CLASSES.upcomingList);

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 3; i++) {
    const li = document.createElement('li');
    li.classList.add(CSS_CLASSES.skeleton);
    li.style.height = '45px';
    fragment.appendChild(li);
  }
  list.appendChild(fragment);
}

export function hideUpcomingLoading() {
  // No explicit action needed here.
}

export function displayDateJumpError(message) {
  DOM_ELEMENTS.dateJumpError.textContent = message;
  DOM_ELEMENTS.dateJumpInput.setAttribute('aria-invalid', 'true');
}

export function clearDateJumpError() {
  DOM_ELEMENTS.dateJumpError.textContent = '';
  DOM_ELEMENTS.dateJumpInput.removeAttribute('aria-invalid');
}

/**
 * Displays search results.
 * @param {Array} results - Array of { date: Date, holidayInfo: object, year: number }.
 * @param {string} query - The search query term.
 */
export function displaySearchResults(results, query) {
  DOM_ELEMENTS.searchResultsList.innerHTML = '';
  DOM_ELEMENTS.searchResultsList.classList.add(CSS_CLASSES.searchResultsList);

  if (results && results.length > 0) { // Added check for results array
    DOM_ELEMENTS.searchResultsTitle.textContent = t('searchResultsTitle', { query });
    const fragment = document.createDocumentFragment();
    const currentViewYear = state.currentYear;
    const locale = getCurrentLocale();

    // Use the imported createDocumentFragment util
    createDocumentFragment(results, (result) => {
        if (!result || !result.date || !isValid(result.date)) return null; // Basic validation

        const li = document.createElement('li');
        li.classList.add(CSS_CLASSES.searchResultsItem);

        const dateStr = format(result.date, 'PPP', { locale: locale });
        const yearStr = result.year !== currentViewYear ? ` (${result.year})` : '';
        const name = result.holidayInfo?.name || ''; // Use optional chaining

        li.innerHTML = `<span class="${CSS_CLASSES.searchResultsItemDate}">${dateStr}${yearStr}</span>: ${name}`;
        li.setAttribute('role', 'button');
        li.tabIndex = 0;

        const jumpToResult = () => {
            const jumpDate = result.date;
            if (!jumpDate || !isValid(jumpDate)) return; // Guard clause

            updateState({
                selectedDate: jumpDate,
                currentYear: getYear(jumpDate),
                currentMonth: getMonth(jumpDate),
                currentView: 'month'
            });
            populateStaticSelectors();
            updateNavigationLabels();
            // Directly call main.js functions or specific UI updates needed
            // Using handleViewChange might be too broad, let's assume main exports fetch/render
            // Import fetchAndRenderGrid from main.js if needed, or call simpler update functions
            import('../main.js').then(main => { // Dynamic import example if needed
                 main.fetchAndRenderGrid(); // Assuming fetchAndRenderGrid handles the rendering after state update
                 main.updateDayInfoSidebar(jumpDate);
            });
            // If fetchAndRenderGrid is not directly callable, you might need another approach
        };

        li.addEventListener('click', jumpToResult);
        li.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                jumpToResult();
            }
        });
        return li; // Return the created node
    });

    DOM_ELEMENTS.searchResultsList.appendChild(fragment);

  } else {
    DOM_ELEMENTS.searchResultsTitle.textContent = t('noSearchResults', { query });
  }
  DOM_ELEMENTS.searchResultsContainer.classList.remove(CSS_CLASSES.searchResultsHidden);
}


/**
 * Updates the hidden print header with context information.
 */
export function updatePrintHeader() {
  if (!DOM_ELEMENTS.printHeader) return;

  const countryName = getCountryName(DOM_ELEMENTS.countrySelect, state.selectedCountry);
  let context = countryName;
  const locale = getCurrentLocale();
  const currentLangData = i18n[state.currentLang] || i18n['en'];

  switch (state.currentView) {
    case 'year':
      context += ` - ${state.currentYear}`;
      break;
    case 'week':
      if (state.currentWeekStart && isValid(state.currentWeekStart)) {
        const weekStartFormatted = format(state.currentWeekStart, 'PPP', { locale });
        context += ` - ${t('gridLabelWeek', { date: weekStartFormatted })}`;
      } else {
        context += ` - ${state.currentYear}`;
      }
      break;
    case 'month':
    default:
      const monthName = currentLangData.monthNames[state.currentMonth];
      context += ` - ${monthName} ${state.currentYear}`;
      break;
  }
  DOM_ELEMENTS.printHeader.textContent = t('printTitle', { context });
}

/** Binds initial event listeners */
export function bindEventListeners() {
  DOM_ELEMENTS.monthSelect.addEventListener('change', handleMonthChange);
  // Pass event object to handlers that need it
  DOM_ELEMENTS.yearInput.addEventListener('change', (event) => handleYearInputChange(event));
  DOM_ELEMENTS.yearInput.addEventListener('input', debounce((event) => handleYearInputChange(event), 500));
  DOM_ELEMENTS.countrySelect.addEventListener('change', handleCountryChange);
  DOM_ELEMENTS.langSelect.addEventListener('change', handleLanguageSwitch);
  DOM_ELEMENTS.themeSelect.addEventListener('change', handleThemeChange);
  DOM_ELEMENTS.viewSelect.addEventListener('change', handleViewChange);
  DOM_ELEMENTS.weekStartSelect.addEventListener('change', handleWeekStartChange);
  DOM_ELEMENTS.todayBtn.addEventListener('click', handleToday);
  DOM_ELEMENTS.prevBtn.addEventListener('click', handlePrev);
  DOM_ELEMENTS.nextBtn.addEventListener('click', handleNext);
  DOM_ELEMENTS.dateJumpInput.addEventListener('change', (event) => handleDateJumpChange(event));
  DOM_ELEMENTS.holidaySearchInput.addEventListener('search', handleSearch);
  DOM_ELEMENTS.holidaySearchInput.addEventListener('input', debounce(handleSearch, 350));
  DOM_ELEMENTS.searchBtn.addEventListener('click', handleSearch);
  DOM_ELEMENTS.closeSearchResultsBtn.addEventListener('click', handleCloseSearchResults);
  DOM_ELEMENTS.retryHolidaysBtn.addEventListener('click', handleRetryHolidays);
  DOM_ELEMENTS.retryUpcomingBtn.addEventListener('click', handleRetryUpcoming);
  DOM_ELEMENTS.retryCountriesBtn.addEventListener('click', handleRetryCountries);
}