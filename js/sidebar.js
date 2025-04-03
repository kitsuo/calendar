// js/sidebar.js
import { CONFIG, CSS_CLASSES, DOM_ELEMENTS } from './config.js';
import { state, getHolidaysFromCache, getCurrentLocale } from './state.js';
// Corrected import for formatDateIntl
import { t, getTranslatedHolidayName, translateHolidayType, formatDateIntl } from './i18n.js';
// Corrected import for getCountryName and createDocumentFragment
import { getCountryName, createDocumentFragment } from './utils.js';
import { parseISO, isValid, format, isSameDay } from 'date-fns';

/**
 * Updates the selected day information panel in the sidebar.
 * @param {Date | null} date - The selected date or null.
 */
export function updateDayInfoSidebar(date) {
  DOM_ELEMENTS.dayInfoDiv.innerHTML = '';
  DOM_ELEMENTS.dayInfoDiv.classList.add(CSS_CLASSES.dayInfo);

  if (!date || !isValid(date)) {
    DOM_ELEMENTS.dayInfoDiv.innerHTML = `<p>${t('noDaySelected')}</p>`;
    return;
  }

  const year = date.getFullYear();
  const dateString = format(date, 'yyyy-MM-dd');
  const holidaysForYear = getHolidaysFromCache(state.selectedCountry, year);
  const holidayInfo = holidaysForYear ? holidaysForYear[dateString] : null;
  const locale = getCurrentLocale();
  const fragment = document.createDocumentFragment();

  // Date Display
  const dateP = document.createElement('p');
  const dateStrong = document.createElement('strong');
  dateStrong.classList.add(CSS_CLASSES.dayInfoDate);
  dateStrong.textContent = formatDateIntl(date, { dateStyle: 'full' }); // Use imported function
  dateP.appendChild(dateStrong);
  fragment.appendChild(dateP);

  // Today Indicator
  if (isSameDay(date, state.today)) {
    const todayP = document.createElement('p');
    const todayEm = document.createElement('em');
    todayEm.classList.add(CSS_CLASSES.dayInfoToday);
    todayEm.textContent = `(${t('today')})`;
    todayP.appendChild(todayEm);
    fragment.appendChild(todayP);
  }

  // Holiday Info
  if (holidayInfo) {
    const holidayDiv = document.createElement('div');
    holidayDiv.classList.add(CSS_CLASSES.dayInfoHoliday);

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
      detailsText += `${t('scope')}: ${t('regional')}. `;
      isRegional = true;
    }

    if (holidayInfo.launchYear) {
      detailsText += `${t('observedSince')}: ${holidayInfo.launchYear}.`;
    }
    detailsP.textContent = detailsText.trim() || t('noInfo');
    holidayDiv.appendChild(detailsP);

    // Regional Info
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
        li.textContent = county;
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
    const countryName = getCountryName(DOM_ELEMENTS.countrySelect, state.selectedCountry);
    const query = encodeURIComponent(`${holidayInfo.name} ${countryName}`);
    searchLink.href = `https://www.google.com/search?q=${query}`;
    searchLink.target = '_blank';
    searchLink.rel = 'noopener noreferrer';
    searchLink.textContent = t('searchLink');
    linkP.appendChild(searchLink);
    holidayDiv.appendChild(linkP);

    fragment.appendChild(holidayDiv);
  }

  DOM_ELEMENTS.dayInfoDiv.appendChild(fragment);
}

/**
 * Displays the list of upcoming holidays in the sidebar.
 * @param {Array|null} holidays - Array of holiday objects or null if error/none.
 * @param {string} countryCode - The country code for context.
 */
export function displayUpcomingHolidays(holidays, countryCode) {
  const list = DOM_ELEMENTS.upcomingHolidaysList;
  const countryName = getCountryName(DOM_ELEMENTS.countrySelect, countryCode);
  DOM_ELEMENTS.upcomingTitle.textContent = t('upcomingTitle', { countryName });
  list.innerHTML = '';
  list.classList.add(CSS_CLASSES.upcomingList);

  if (holidays === null) {
    return; // Error handled elsewhere
  }
  if (!holidays || holidays.length === 0) {
    const li = document.createElement('li');
    li.textContent = t('noUpcomingHolidaysCountry', { countryName });
    list.appendChild(li);
    return;
  }

  // Create List Items
  const createHolidayNode = (holiday) => {
    if (!holiday || !holiday.date || !holiday.name) return null; // Basic validation

    const li = document.createElement('li');
    li.classList.add(CSS_CLASSES.upcomingItem);
    const date = parseISO(holiday.date);
    if (!isValid(date)) {
      console.warn(`Invalid date in upcoming holidays: ${holiday.date}`);
      return null;
    }

    const translatedName = getTranslatedHolidayName(holiday.date, holiday.name);
    const formattedDate = formatDateIntl(date, { dateStyle: 'medium' }); // Use imported function

    li.innerHTML = `
      <span class="${CSS_CLASSES.upcomingItemDate}">${formattedDate}</span>
      <strong class="${CSS_CLASSES.upcomingItemName}">${translatedName}</strong>
    `;
    return li;
  };

  // Use the imported createDocumentFragment util
  const fragment = createDocumentFragment(holidays, createHolidayNode);
  list.appendChild(fragment);
}