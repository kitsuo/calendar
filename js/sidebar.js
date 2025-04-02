// js/sidebar.js
import { CSS_CLASSES, DOM_ELEMENTS } from './config.js';
import { state, getCurrentYearHolidays } from './state.js';
import { t, getTranslatedHolidayName, translateHolidayType } from './i18n.js';
import { getCountryName, createDocumentFragment } from './utils.js';

/**
 * Updates the selected day information panel in the sidebar.
 * Includes holiday details, type, scope, launch year, and search link.
 * @param {Date | null} date - The selected date or null.
 */
export function updateDayInfoSidebar(date) {
    DOM_ELEMENTS.dayInfoDiv.innerHTML = ''; // Clear previous info

    if (!date) {
        DOM_ELEMENTS.dayInfoDiv.innerHTML = `<p>${t('noDaySelected')}</p>`;
        return;
    }

    const year = date.getFullYear();
    const dateString = dateFns.format(date, 'yyyy-MM-dd'); // Use date-fns
    // Use helper to get holidays, ensures we check the correct cache structure
    const holidaysForYear = state.holidaysCache[state.selectedCountry]?.[year] || {};
    const holidayInfo = holidaysForYear[dateString];

    const fragment = document.createDocumentFragment();

    // --- Date Display ---
    const dateP = document.createElement('p');
    const dateStrong = document.createElement('strong');
    dateStrong.classList.add(CSS_CLASSES.selectedDateDisplay);
    try {
        const formatter = new Intl.DateTimeFormat(state.currentLang, { dateStyle: 'full' });
        dateStrong.textContent = formatter.format(date);
    } catch(e) {
         dateStrong.textContent = dateFns.format(date, 'PPPP', { locale: getDateFnsLocale() });
    }
    dateP.appendChild(dateStrong);
    fragment.appendChild(dateP);


    // --- Today Indicator ---
    if (dateFns.isSameDay(date, state.today)) {
        const todayP = document.createElement('p');
        const todayEm = document.createElement('em');
        todayEm.textContent = `(${t('today')})`;
        todayP.appendChild(todayEm);
        fragment.appendChild(todayP);
    }

    // --- Holiday Info ---
    if (holidayInfo) {
        const holidayDiv = document.createElement('div');
        holidayDiv.classList.add('holiday-info');

        const translatedName = getTranslatedHolidayName(dateString, holidayInfo.name);
        const translatedType = translateHolidayType(holidayInfo.type);

        // Name and Type
        const nameP = document.createElement('p');
        const nameSpan = document.createElement('span');
        nameSpan.classList.add('holiday-name');
        nameSpan.textContent = translatedName;
        nameP.appendChild(nameSpan);

        if (holidayInfo.type) {
            const typeSpan = document.createElement('span');
            typeSpan.classList.add('holiday-type');
            typeSpan.textContent = ` (${translatedType})`;
            nameP.appendChild(typeSpan);
        }
        holidayDiv.appendChild(nameP);

        // Details (Scope, Launch Year)
        const detailsP = document.createElement('p');
        detailsP.classList.add('holiday-details');
        let detailsText = '';
        if (holidayInfo.counties && holidayInfo.counties.length > 0) {
            detailsText += `${t('scope')}: ${t('regional')}. `; // Simplified, could list counties if needed
        } else if (holidayInfo.global === true) {
            detailsText += `${t('scope')}: ${t('national')}. `;
        } else if (holidayInfo.global === false) {
             detailsText += `${t('scope')}: ${t('regional')}. `; // Assume regional if not global
        }

        if (holidayInfo.launchYear) {
            detailsText += `${t('observedSince')}: ${holidayInfo.launchYear}.`;
        }
        detailsP.textContent = detailsText.trim() || t('noInfo');
        holidayDiv.appendChild(detailsP);

        // Optional: Search Link
        const linkP = document.createElement('p');
        const searchLink = document.createElement('a');
        searchLink.classList.add('holiday-link');
        const countryName = getCountryName(DOM_ELEMENTS.countrySelect, state.selectedCountry);
        const query = encodeURIComponent(`${translatedName} ${countryName}`);
        searchLink.href = `https://www.google.com/search?q=${query}`;
        searchLink.target = '_blank'; // Open in new tab
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

    // Handle null (error) or empty array
    if (holidays === null) {
        // Error message is handled by displayUpcomingError in api.js/ui.js
        // Optionally display a placeholder here?
        list.innerHTML = ''; // Clear skeleton/previous
        return;
    }
     if (!holidays || holidays.length === 0) {
        list.innerHTML = `<li>${t('noUpcomingHolidaysCountry', { countryName })}</li>`;
        return;
    }

    // --- Create List Items ---
    const formatter = new Intl.DateTimeFormat(state.currentLang, { dateStyle: 'medium' });

    const createHolidayNode = (holiday) => {
        const li = document.createElement('li');
        const date = dateFns.parseISO(holiday.date); // Parse date string
        if (!dateFns.isValid(date)) return null; // Skip invalid dates

        const translatedName = getTranslatedHolidayName(holiday.date, holiday.name);
        const formattedDate = formatter.format(date);

        li.innerHTML = `
          <span class="upcoming-holiday-date">${formattedDate}</span>
          <strong class="${CSS_CLASSES.upcomingHolidayName}">${translatedName}</strong>
        `;
        return li;
    };

    const fragment = createDocumentFragment(holidays, createHolidayNode);
    list.innerHTML = ''; // Clear previous content/skeleton
    list.appendChild(fragment);
}

// Helper to get date-fns locale dynamically
function getDateFnsLocale() {
    switch (state.currentLang) {
        case 'fr': return dateFns.locale.fr;
        case 'de': return dateFns.locale.de;
        default: return dateFns.locale.enUS;
    }
}
