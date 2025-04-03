// js/ui.js
import { CONFIG, CSS_CLASSES, DOM_ELEMENTS } from './config.js';
import { state, updateState } from './state.js';
import { t, i18n } from './i18n.js'; // Import full i18n for month names etc.
import { formatDateYYYYMMDD, debounce } from './utils.js';
import { handleMonthChange, handleYearInputChange, handleCountryChange, handleLanguageSwitch, handleThemeChange, handleViewChange, handleToday, handlePrev, handleNext, handleDateJumpChange, handleSearch, handleCloseSearchResults, handleRetryHolidays, handleRetryUpcoming } from './main.js'; // Import handlers

/**
 * Populates the month and year selectors based on current state and config.
 */
export function populateSelectors() {
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

    // Country Select
    DOM_ELEMENTS.countrySelect.value = state.selectedCountry;

    // Language Select
    DOM_ELEMENTS.langSelect.value = state.currentLang;

    // Theme Select
    DOM_ELEMENTS.themeSelect.value = state.currentTheme;

     // View Select
    DOM_ELEMENTS.viewSelect.value = state.currentView;
}

/**
 * Updates all UI text elements based on the current language.
 */
export function translateUI() {
    // Populate selectors first to get month names right
    populateSelectors();

    // Buttons & Labels
    document.documentElement.lang = state.currentLang; // Set HTML lang attribute
    DOM_ELEMENTS.todayBtn.innerHTML = `<i class="fas fa-calendar-day"></i> ${t('today')}`;
    document.querySelector('label[for="date-jump"]').textContent = t('jumpTo');
    document.querySelector('label[for="country-select"]').textContent = t('selectCountry');
    document.querySelector('label[for="lang-select"]').textContent = t('selectLang');
    DOM_ELEMENTS.searchResultsTitle.textContent = t('searchResultsTitle'); // Base title
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

    // Retry buttons text
    DOM_ELEMENTS.retryHolidaysBtn.querySelector('.retry-text').textContent = t('retry');
    DOM_ELEMENTS.retryUpcomingBtn.querySelector('.retry-text').textContent = t('retry');

    // Select options (View/Theme)
    DOM_ELEMENTS.viewSelect.querySelector('option[value="month"]').textContent = t('viewMonth');
    DOM_ELEMENTS.viewSelect.querySelector('option[value="week"]').textContent = t('viewWeek');
    DOM_ELEMENTS.viewSelect.querySelector('option[value="year"]').textContent = t('viewYear');
    DOM_ELEMENTS.themeSelect.querySelector('option[value="light"]').textContent = t('themeLight');
    DOM_ELEMENTS.themeSelect.querySelector('option[value="dark"]').textContent = t('themeDark');

    // Update Weekday headers
    updateWeekdayHeaders();

    // Re-display errors if any, with current language
    if (state.apiError) displayApiError(state.apiError);
    if (state.upcomingError) displayUpcomingError(state.upcomingError);
}

/**
 * Updates the aria-labels for previous/next buttons based on the current view.
 */
export function updateNavigationLabels() {
    let prevLabelKey, nextLabelKey;
    switch(state.currentView) {
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
            prevLabelKey = 'prevMonth'; // Defaulting to month context for labels if needed
            nextLabelKey = 'nextMonth';
            // Or use the more generic ones:
            // prevLabelKey = 'prevPeriod';
            // nextLabelKey = 'nextPeriod';
            break;
    }
    DOM_ELEMENTS.prevBtn.setAttribute('aria-label', t(prevLabelKey));
    DOM_ELEMENTS.nextBtn.setAttribute('aria-label', t(nextLabelKey));

    // Hide month selector in year/week view
    DOM_ELEMENTS.monthSelect.style.display = (state.currentView === 'month') ? '' : 'none';
}


/**
 * Updates the weekday headers based on current language and view.
 */
export function updateWeekdayHeaders() {
    const weekdaysContainer = DOM_ELEMENTS.weekdayLabelsContainer;
    weekdaysContainer.innerHTML = ''; // Clear existing

    const useMiniNames = state.currentView === 'year'; // Year view uses minimal names
    const weekdays = useMiniNames ? i18n[state.currentLang].weekdaysMini : i18n[state.currentLang].weekdaysShort;
    const firstDayOfWeek = 0; // Sunday start

    // Add "Wk" header for month/week view
    if (state.currentView === 'month' || state.currentView === 'week') {
        const wkHeader = document.createElement('div');
        wkHeader.textContent = t('weekLabel').split(' ')[0]; // Get "Wk" or equivalent
        weekdaysContainer.appendChild(wkHeader);
    }

    for (let i = 0; i < 7; i++) {
        const dayIndex = (firstDayOfWeek + i) % 7;
        const dayHeader = document.createElement('div');
        dayHeader.textContent = weekdays[dayIndex];
        weekdaysContainer.appendChild(dayHeader);
    }
}


/**
 * Updates the visual theme of the application.
 */
export function applyTheme() {
    // Remove existing theme classes/attributes
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.removeAttribute('data-theme');

    // Apply the current theme
    if (state.currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        // Or use class: document.body.classList.add('dark-theme');
    } else {
         document.body.setAttribute('data-theme', 'light');
        // Or use class: document.body.classList.add('light-theme');
    }
     // Update theme selector value
    DOM_ELEMENTS.themeSelect.value = state.currentTheme;
}

/**
 * Displays an error message in the main API error area.
 * @param {string} message - The error message.
 */
export function displayApiError(message) {
    DOM_ELEMENTS.apiErrorMessage.textContent = message;
    DOM_ELEMENTS.retryHolidaysBtn.hidden = false;
}

/** Clears the main API error message area. */
export function clearApiError() {
    DOM_ELEMENTS.apiErrorMessage.textContent = '';
    DOM_ELEMENTS.retryHolidaysBtn.hidden = true;
}

/**
 * Displays an error message in the upcoming holidays error area.
 * @param {string} message - The error message.
 */
export function displayUpcomingError(message) {
    DOM_ELEMENTS.upcomingErrorMessage.textContent = message;
    DOM_ELEMENTS.retryUpcomingBtn.hidden = false;
}

/** Clears the upcoming holidays error message area. */
export function clearUpcomingError() {
    DOM_ELEMENTS.upcomingErrorMessage.textContent = '';
    DOM_ELEMENTS.retryUpcomingBtn.hidden = true;
}

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
    DOM_ELEMENTS.upcomingHolidaysList.innerHTML = `
        <li class="${CSS_CLASSES.skeleton}"></li>
        <li class="${CSS_CLASSES.skeleton}"></li>
        <li class="${CSS_CLASSES.skeleton}"></li>
    `;
}

/** Hides the loading state (clears the list for content). */
export function hideUpcomingLoading() {
    // The list will be replaced by actual content or error message
    // No explicit hiding action needed here, just ensure loading replaces content
}

/**
 * Displays an error message for the date jump input.
 * @param {string} message
 */
export function displayDateJumpError(message) {
    DOM_ELEMENTS.dateJumpError.textContent = message;
}

/** Clears the error message for the date jump input. */
export function clearDateJumpError() {
    DOM_ELEMENTS.dateJumpError.textContent = '';
}

/**
 * Displays search results.
 * @param {Array} results - Array of { date: Date, holidayInfo: object }
 * @param {string} query - The search query term.
 */
export function displaySearchResults(results, query) {
    DOM_ELEMENTS.searchResultsList.innerHTML = ''; // Clear previous results

    if (results.length > 0) {
        DOM_ELEMENTS.searchResultsTitle.textContent = t('searchResultsTitle', { query });
        const fragment = document.createDocumentFragment();
        const formatter = new Intl.DateTimeFormat(state.currentLang, { dateStyle: 'medium' });

        results.forEach(result => {
            const li = document.createElement('li');
            const dateStr = formatter.format(result.date);
            const name = result.holidayInfo.name; // Use original name for consistency in results
            li.innerHTML = `<span class="search-result-date">${dateStr}</span>: ${name}`;
            // Optional: Add click handler to jump to the date
            li.addEventListener('click', () => {
                 const jumpDate = result.date;
                 updateState({
                     selectedDate: jumpDate,
                     currentYear: jumpDate.getFullYear(),
                     currentMonth: jumpDate.getMonth(),
                     currentView: 'month' // Switch to month view to show selection
                 });
                 populateSelectors();
                 handleViewChange(); // Trigger view update logic which includes render
                 DOM_ELEMENTS.searchResultsContainer.hidden = true; // Close results
            });
            li.style.cursor = 'pointer';
            fragment.appendChild(li);
        });
        DOM_ELEMENTS.searchResultsList.appendChild(fragment);
    } else {
        DOM_ELEMENTS.searchResultsTitle.textContent = t('noSearchResults', { query });
    }

    DOM_ELEMENTS.searchResultsContainer.hidden = false;
}


/** Binds initial event listeners */
export function bindEventListeners() {
    DOM_ELEMENTS.monthSelect.addEventListener('change', handleMonthChange);
    DOM_ELEMENTS.yearInput.addEventListener('change', handleYearInputChange);
    DOM_ELEMENTS.countrySelect.addEventListener('change', handleCountryChange);
    DOM_ELEMENTS.langSelect.addEventListener('change', handleLanguageSwitch);
    DOM_ELEMENTS.themeSelect.addEventListener('change', handleThemeChange);
    DOM_ELEMENTS.viewSelect.addEventListener('change', handleViewChange);
    DOM_ELEMENTS.todayBtn.addEventListener('click', handleToday);
    DOM_ELEMENTS.prevBtn.addEventListener('click', handlePrev);
    DOM_ELEMENTS.nextBtn.addEventListener('click', handleNext);
    DOM_ELEMENTS.dateJumpInput.addEventListener('change', handleDateJumpChange);
    DOM_ELEMENTS.holidaySearchInput.addEventListener('search', handleSearch); // Handle clearing search
    DOM_ELEMENTS.holidaySearchInput.addEventListener('input', debounce(handleSearch, 300)); // Debounced search on input
    DOM_ELEMENTS.searchBtn.addEventListener('click', handleSearch);
    DOM_ELEMENTS.closeSearchResultsBtn.addEventListener('click', handleCloseSearchResults);
    DOM_ELEMENTS.retryHolidaysBtn.addEventListener('click', handleRetryHolidays);
    DOM_ELEMENTS.retryUpcomingBtn.addEventListener('click', handleRetryUpcoming);

    // Click/Keydown on grid handled in calendarGrid.js attachGridListeners
}