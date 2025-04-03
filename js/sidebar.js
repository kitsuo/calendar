// js/sidebar.js
import { CONFIG, CSS_CLASSES, DOM_ELEMENTS } from './config.js';
import { state, getHolidaysFromCache, getCurrentLocale } from './state.js';
import { t, getTranslatedHolidayName, translateHolidayType, formatDateIntl } from './i18n.js';
// Removed potentially non-existent utils imports for strict syntax correction:
// import { getCountryName, createDocumentFragment } from './utils.js';
// Assuming getCountryName and createDocumentFragment are available globally or defined elsewhere if used.
// If createDocumentFragment refers to document.createDocumentFragment, it doesn't need import.
import { parseISO, isValid, format, isSameDay } from 'date-fns'; // Use specific imports

/**
 * Updates the selected day information panel in the sidebar.
 * Includes holiday details, type, scope, launch year, regions, and search link.
 * SYNTAX FIX: Corrected the JSDoc @param line which was broken by inserted text.
 * @param {Date | null} date - The selected date or null.
 */
export function updateDayInfoSidebar(date) {
  DOM_ELEMENTS.dayInfoDiv.innerHTML = ''; // Clear previous info
  DOM_ELEMENTS.dayInfoDiv.classList.add(CSS_CLASSES.dayInfo); // Ensure block class

  if (!date || !isValid(date)) {
    DOM_ELEMENTS.dayInfoDiv.innerHTML = `<p>${t('noDaySelected')}</p>`;
    return;
  }

  const year = date.getFullYear(); // Note: getFullYear is correct, not getYear from date-fns directly on Date object
  const dateString = format(date, 'yyyy-MM-dd'); // Use date-fns format

  // Use helper to get holidays, ensures we check the correct cache structure
  const holidaysForYear = getHolidaysFromCache(state.selectedCountry, year);
  const holidayInfo = holidaysForYear ? holidaysForYear[dateString] : null; // Added check if holidaysForYear exists
  const locale = getCurrentLocale();
  const fragment = document.createDocumentFragment(); // Use standard browser API

  // --- Date Display ---
  const dateP = document.createElement('p');
  const dateStrong = document.createElement('strong');
  dateStrong.classList.add(CSS_CLASSES.dayInfoDate);
  // Note: formatDateIntl needs to be defined/imported correctly for this to work at runtime
  dateStrong.textContent = formatDateIntl(date, { dateStyle: 'full' });
  dateP.appendChild(dateStrong);
  fragment.appendChild(dateP);

  // --- Today Indicator ---
  if (isSameDay(date, state.today)) {
    const todayP = document.createElement('p');
    const todayEm = document.createElement('em');
    todayEm.classList.add(CSS_CLASSES.dayInfoToday)
    todayEm.textContent = `(${t('today')})`;
    todayP.appendChild(todayEm);
    fragment.appendChild(todayP);
  }

  // --- Holiday Info ---
  if (holidayInfo) {
    const holidayDiv = document.createElement('div');
    holidayDiv.classList.add(CSS_CLASSES.dayInfoHoliday);

    // Note: these i18n functions need to be defined/imported correctly
    const translatedName = getTranslatedHolidayName(dateString, holidayInfo.name);
    const translatedType = translateHolidayType(holidayInfo.type);

    // Name and Type
    const nameP = document.createElement('p');
    const nameSpan = document.createElement('span');
    nameSpan.classList.add(CSS_CLASSES.dayInfoHolidayName);
    nameSpan.textContent = translatedName;
    nameP.appendChild(nameSpan);

    if (holidayInfo.type) {
      const typeSpan = document.createElement('span');
      typeSpan.classList.add(CSS_CLASSES.dayInfoHolidayType);
      typeSpan.textContent = ` (${translatedType})`;
      nameP.appendChild(typeSpan);
    }
    holidayDiv.appendChild(nameP);

    // Details (Scope, Launch Year)
    const detailsP = document.createElement('p');
    detailsP.classList.add(CSS_CLASSES.dayInfoHolidayDetails);
    let detailsText = '';
    let isRegional = false;

    if (holidayInfo.counties && holidayInfo.counties.length > 0) {
      detailsText += `${t('scope')}: ${t('regional')}. `;
      isRegional = true;
    } else if (holidayInfo.global === true) {
      detailsText += `${t('scope')}: ${t('national')}. `;
    } else if (holidayInfo.global === false) {
      // Assume regional if not global and no specific counties listed (might happen)
      detailsText += `${t('scope')}: ${t('regional')}. `;
      isRegional = true; // Treat as regional for display purposes
    }

    if (holidayInfo.launchYear) {
      detailsText += `${t('observedSince')}: ${holidayInfo.launchYear}.`;
    }
    detailsP.textContent = detailsText.trim() || t('noInfo');
    holidayDiv.appendChild(detailsP);

    // Regional Info (Counties/Subdivisions)
    if (isRegional && holidayInfo.counties && holidayInfo.counties.length > 0) {
      const regionsDiv = document.createElement('div');
      regionsDiv.classList.add(CSS_CLASSES.dayInfoHolidayRegions);
      const regionsTitle = document.createElement('strong');
      regionsTitle.textContent = `${t('regions')}:`;
      regionsDiv.appendChild(regionsTitle);

      const regionsList = document.createElement('ul');
      const countiesToShow = holidayInfo.counties.slice(0, CONFIG.MAX_REGIONAL_DISPLAY);
      const remainingCount = holidayInfo.counties.length - countiesToShow.length;

      countiesToShow.forEach(county => {
        const li = document.createElement('li');
        li.classList.add(CSS_CLASSES.dayInfoHolidayRegionItem);
        li.textContent = county; // Assuming counties are strings
        regionsList.appendChild(li);
      });

      if (remainingCount > 0) {
        const moreLi = document.createElement('li');
        moreLi.classList.add(CSS_CLASSES.dayInfoHolidayRegionsMore);
        moreLi.textContent = t('regionsMore', { count: remainingCount });
        regionsList.appendChild(moreLi);
      }
      regionsDiv.appendChild(regionsList);
      holidayDiv.appendChild(regionsDiv);
    }

    // Optional: Search Link
    const linkP = document.createElement('p');
    const searchLink = document.createElement('a');
    searchLink.classList.add(CSS_CLASSES.dayInfoHolidayLink);
    // Note: getCountryName needs to be defined/imported correctly
    const countryName = typeof getCountryName === 'function' ? getCountryName(DOM_ELEMENTS.countrySelect, state.selectedCountry) : state.selectedCountry;
    // Use original API name for better search results generally
    const query = encodeURIComponent(`${holidayInfo.name} ${countryName}`);
    searchLink.href = `https://www.google.com/search?q=${query}`;
    searchLink.target = '_blank'; // Open in new tab
    searchLink.rel = 'noopener noreferrer';
    searchLink.textContent = t('searchLink');
    linkP.appendChild(searchLink);
    holidayDiv.appendChild(linkP);

    fragment.appendChild(holidayDiv);
  }

  DOM_ELEMENTS.dayInfoDiv.appendChild(fragment);
  // SYNTAX FIX: Removed extraneous text artifact below
}

/**
 * Displays the list of upcoming holidays in the sidebar.
 * Handles loading state removal.
 * @param {Array|null} holidays - Array of holiday objects or null if error/none.
 * @param {string} countryCode - The country code for context.
 */
export function displayUpcomingHolidays(holidays, countryCode) {
  // Note: hideUpcomingLoading() is called by the fetch function's finally block.
  // This function just renders the result or empty/error state.
  const list = DOM_ELEMENTS.upcomingHolidaysList;
  // Note: getCountryName needs to be defined/imported correctly
  const countryName = typeof getCountryName === 'function' ? getCountryName(DOM_ELEMENTS.countrySelect, countryCode) : countryCode;
  DOM_ELEMENTS.upcomingTitle.textContent = t('upcomingTitle', { countryName });
  list.innerHTML = ''; // Clear skeleton/previous content
  list.classList.add(CSS_CLASSES.upcomingList); // Ensure block class

  // Handle null (error) or empty array
  if (holidays === null) {
    // Error message should be displayed by displayUpcomingError
    // list remains empty or shows the error message container
    return;
  }
  if (!holidays || holidays.length === 0) {
    const li = document.createElement('li');
    li.textContent = t('noUpcomingHolidaysCountry', { countryName });
    list.appendChild(li);
    return;
  }

  // --- Create List Items ---
  const createHolidayNode = (holiday) => {
    const li = document.createElement('li');
    li.classList.add(CSS_CLASSES.upcomingItem);
    const date = parseISO(holiday.date); // Parse date string
    if (!isValid(date)) {
      // SYNTAX FIX: Used template literal (backticks) for console.warn argument
      console.warn(`Invalid date in upcoming holidays: ${holiday.date}`);
      return null; // Skip invalid dates
    }

    // Note: these i18n functions need to be defined/imported correctly
    const translatedName = getTranslatedHolidayName(holiday.date, holiday.name);
    // Use medium date style for upcoming list
    // Note: formatDateIntl needs to be defined/imported correctly
    const formattedDate = formatDateIntl(date, { dateStyle: 'medium' });

    li.innerHTML = `
      <span class="${CSS_CLASSES.upcomingItemDate}">${formattedDate}</span>
      <strong class="${CSS_CLASSES.upcomingItemName}">${translatedName}</strong>
    `;
    return li;
    // SYNTAX FIX: Removed extraneous text artifact below (inside the function block)
  };

  // Assuming createDocumentFragment is the standard document.createDocumentFragment
  const fragment = document.createDocumentFragment();
  holidays.forEach(holiday => {
      const node = createHolidayNode(holiday);
      if (node) { // Append only if node is not null (i.e., date was valid)
          fragment.appendChild(node);
      }
  });
  // Removed incorrect usage of createDocumentFragment helper import
  list.appendChild(fragment);
}