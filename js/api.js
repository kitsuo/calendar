// js/api.js
import { CONFIG, DOM_ELEMENTS } from './config.js';
import { state, updateState } from './state.js';
import { t } from './i18n.js';
// Corrected import for getCountryName
import { getCountryName, safeLocalStorageGetItem, safeLocalStorageSetItem, safeLocalStorageRemoveItem } from './utils.js';
import { hideLoadingOverlay, showLoadingOverlay, displayApiError, clearApiError, showUpcomingLoading, hideUpcomingLoading, displayUpcomingError, clearUpcomingError, displayCountryError, clearCountryError } from './ui.js';

/**
 * Fetches public holidays for a given year and country code from API or cache.
 * Uses both in-memory cache and localStorage.
 * @param {number} year
 * @param {string} countryCode
 * @returns {Promise<object>} A map of dateString -> holidayInfo. Returns empty object on failure.
 */
export async function fetchHolidays(year, countryCode) {
  const cacheKey = `holidays-${year}-${countryCode}`;
  const countryName = getCountryName(DOM_ELEMENTS.countrySelect, countryCode);

  // 1. Check in-memory cache first
  if (state.holidaysCache[countryCode]?.[year]) {
    console.debug(`Cache hit (Memory): ${cacheKey}`);
    return state.holidaysCache[countryCode][year];
  }

  // 2. Check localStorage cache
  try {
    const cachedData = safeLocalStorageGetItem(cacheKey);
    if (cachedData) {
      const { timestamp, data } = JSON.parse(cachedData);
      if (timestamp && typeof timestamp === 'number' && Date.now() - timestamp < CONFIG.CACHE_EXPIRY_MS) {
        console.debug(`Cache hit (Storage): ${cacheKey}`);
        if (!state.holidaysCache[countryCode]) state.holidaysCache[countryCode] = {};
        state.holidaysCache[countryCode][year] = data;
        return data;
      } else {
        console.debug(`Cache expired/invalid (Storage): ${cacheKey}`);
        safeLocalStorageRemoveItem(cacheKey);
      }
    }
  } catch (e) {
    console.error(`Error reading/parsing localStorage cache (${cacheKey}):`, e);
    safeLocalStorageRemoveItem(cacheKey);
  }

  // 3. Fetch from API if not cached or expired
  console.debug(`Workspaceing API: ${cacheKey}`);
  showLoadingOverlay();
  updateState({ isLoadingGrid: true, apiError: null });
  clearApiError();

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/PublicHolidays/${year}/${countryCode}`);
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`API returned 404 for ${cacheKey}. Assuming no holidays.`);
        const emptyHolidayMap = {};
        if (!state.holidaysCache[countryCode]) state.holidaysCache[countryCode] = {};
        state.holidaysCache[countryCode][year] = emptyHolidayMap;
        const dataToStore = { timestamp: Date.now(), data: emptyHolidayMap };
        safeLocalStorageSetItem(cacheKey, JSON.stringify(dataToStore));
        return emptyHolidayMap;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const holidays = await response.json();

    const holidayMap = holidays.reduce((acc, holiday) => {
      acc[holiday.date] = {
        name: holiday.name,
        type: holiday.type,
        global: holiday.global,
        counties: holiday.counties || null,
        launchYear: holiday.launchYear,
      };
      return acc;
    }, {});

    if (!state.holidaysCache[countryCode]) state.holidaysCache[countryCode] = {};
    state.holidaysCache[countryCode][year] = holidayMap;

    const dataToStore = {
      timestamp: Date.now(),
      data: holidayMap,
    };
    safeLocalStorageSetItem(cacheKey, JSON.stringify(dataToStore));

    return holidayMap;
  } catch (error) {
    console.error('Error fetching holidays:', error);
    const errorMsg = t('errorLoadingHolidays', { countryName });
    updateState({ apiError: errorMsg });
    displayApiError(errorMsg);
    return {};
  } finally {
    hideLoadingOverlay();
    updateState({ isLoadingGrid: false });
  }
}

/**
 * Fetches upcoming public holidays for a country code from API or cache.
 * Uses both in-memory cache and localStorage.
 * @param {string} countryCode
 * @returns {Promise<Array|null>} Array of holiday objects or null on error.
 */
export async function fetchUpcomingLocalHolidays(countryCode) {
  const cacheKey = `upcoming-${countryCode}`;
  const countryName = getCountryName(DOM_ELEMENTS.countrySelect, countryCode);

  // 1. Check in-memory cache first (including timestamp)
  if (state.upcomingCache[countryCode]) {
    const { timestamp, data } = state.upcomingCache[countryCode];
    if (timestamp && typeof timestamp === 'number' && Date.now() - timestamp < CONFIG.CACHE_EXPIRY_MS) {
      console.debug(`Cache hit (Memory): ${cacheKey}`);
      return data;
    } else {
      console.debug(`Cache expired/invalid (Memory): ${cacheKey}`);
      delete state.upcomingCache[countryCode];
    }
  }

  // 2. Check localStorage cache
  try {
    const cachedData = safeLocalStorageGetItem(cacheKey);
    if (cachedData) {
      const { timestamp, data } = JSON.parse(cachedData);
      if (timestamp && typeof timestamp === 'number' && Date.now() - timestamp < CONFIG.CACHE_EXPIRY_MS) {
        console.debug(`Cache hit (Storage): ${cacheKey}`);
        state.upcomingCache[countryCode] = { timestamp, data };
        return data;
      } else {
        console.debug(`Cache expired/invalid (Storage): ${cacheKey}`);
        safeLocalStorageRemoveItem(cacheKey);
      }
    }
  } catch (e) {
    console.error(`Error reading/parsing localStorage cache (${cacheKey}):`, e);
    safeLocalStorageRemoveItem(cacheKey);
  }

  // 3. Fetch from API
  console.debug(`Workspaceing API: ${cacheKey}`);
  showUpcomingLoading();
  updateState({ isLoadingUpcoming: true, upcomingError: null });
  clearUpcomingError();

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/NextPublicHolidays/${countryCode}`);
    if (!response.ok) {
      if (response.status === 204) {
        console.debug(`No upcoming holidays found for ${countryCode}`);
        const noHolidaysData = { timestamp: Date.now(), data: [] };
        state.upcomingCache[countryCode] = noHolidaysData;
        safeLocalStorageSetItem(cacheKey, JSON.stringify(noHolidaysData));
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const holidays = await response.json();

    const dataToStore = {
      timestamp: Date.now(),
      data: holidays,
    };
    state.upcomingCache[countryCode] = dataToStore;
    safeLocalStorageSetItem(cacheKey, JSON.stringify(dataToStore));

    return holidays;
  } catch (error) {
    console.error(`Error fetching upcoming holidays for ${countryCode}:`, error);
    const errorMsg = t('errorLoadingUpcoming', { countryName });
    updateState({ upcomingError: errorMsg });
    displayUpcomingError(errorMsg);
    return null;
  } finally {
    hideUpcomingLoading();
    updateState({ isLoadingUpcoming: false });
  }
}

/**
 * Fetches the list of available countries from the API or cache.
 * Uses localStorage cache.
 * @returns {Promise<Array|null>} Array of country objects { countryCode, name } or null on error.
 */
export async function fetchAvailableCountries() {
  const cacheKey = 'availableCountries';

  // 1. Check localStorage cache first
  try {
    const cachedData = safeLocalStorageGetItem(cacheKey);
    if (cachedData) {
      const { timestamp, data } = JSON.parse(cachedData);
      if (timestamp && typeof timestamp === 'number' && Date.now() - timestamp < CONFIG.COUNTRY_CACHE_EXPIRY_MS) {
        console.debug(`Cache hit (Storage): ${cacheKey}`);
        updateState({ availableCountriesCache: data });
        return data;
      } else {
        console.debug(`Cache expired/invalid (Storage): ${cacheKey}`);
        safeLocalStorageRemoveItem(cacheKey);
      }
    }
  } catch (e) {
    console.error(`Error reading/parsing localStorage cache (${cacheKey}):`, e);
    safeLocalStorageRemoveItem(cacheKey);
  }

  // 2. Fetch from API
  console.debug(`Workspaceing API: ${cacheKey}`);
  updateState({ isLoadingCountries: true, countriesError: null });
  clearCountryError();

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/AvailableCountries`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const countries = await response.json();

    countries.sort((a, b) => a.name.localeCompare(b.name));

    updateState({ availableCountriesCache: countries });
    const dataToStore = {
      timestamp: Date.now(),
      data: countries,
    };
    safeLocalStorageSetItem(cacheKey, JSON.stringify(dataToStore));

    return countries;
  } catch (error) {
    console.error('Error fetching available countries:', error);
    const errorMsg = t('errorLoadingCountries');
    updateState({ countriesError: errorMsg });
    displayCountryError(errorMsg);
    return null;
  } finally {
    updateState({ isLoadingCountries: false });
  }
}