// js/api.js
import { CONFIG, DOM_ELEMENTS } from './config.js';
import { state, updateState } from './state.js';
import { t } from './i18n.js';
// Note: Assuming these utils are defined/imported correctly if used
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
  // SYNTAX FIX: Used template literal (backticks) for string assignment
  const cacheKey = `holidays-${year}-${countryCode}`;
  // Note: getCountryName needs to be defined/imported correctly for runtime
  const countryName = typeof getCountryName === 'function' ? getCountryName(DOM_ELEMENTS.countrySelect, countryCode) : countryCode;

  // 1. Check in-memory cache first
  if (state.holidaysCache[countryCode]?.[year]) {
    // SYNTAX FIX: Used template literal (backticks) for console argument
    console.debug(`Cache hit (Memory): ${cacheKey}`);
    return state.holidaysCache[countryCode][year];
  }

  // 2. Check localStorage cache
  try {
    const cachedData = safeLocalStorageGetItem(cacheKey); // Assumes safeLocalStorageGetItem is available
    if (cachedData) {
      const { timestamp, data } = JSON.parse(cachedData);
      // Check timestamp validity and expiry
      if (timestamp && typeof timestamp === 'number' && Date.now() - timestamp < CONFIG.CACHE_EXPIRY_MS) {
        // SYNTAX FIX: Used template literal (backticks) for console argument
        console.debug(`Cache hit (Storage): ${cacheKey}`);
        // Store in memory cache as well
        if (!state.holidaysCache[countryCode]) state.holidaysCache[countryCode] = {};
        state.holidaysCache[countryCode][year] = data;
        return data;
      } else {
        // SYNTAX FIX: Used template literal (backticks) for console argument
        console.debug(`Cache expired/invalid (Storage): ${cacheKey}`);
        safeLocalStorageRemoveItem(cacheKey); // Assumes safeLocalStorageRemoveItem is available // Remove expired/invalid data
      }
    }
  } catch (e) {
    // SYNTAX FIX: Used template literal (backticks) for console argument
    console.error(`Error reading/parsing localStorage cache (${cacheKey}):`, e);
    safeLocalStorageRemoveItem(cacheKey); // Remove potentially corrupted data
  }

  // 3. Fetch from API if not cached or expired
  // SYNTAX FIX: Used template literal (backticks) for console argument
  console.debug(`Workspaceing API: ${cacheKey}`);
  showLoadingOverlay(); // Show loading indicator for grid
  updateState({ isLoadingGrid: true, apiError: null });
  clearApiError();

  try {
    // SYNTAX FIX: Used template literal (backticks) for fetch URL argument
    const response = await fetch(`${CONFIG.API_BASE_URL}/PublicHolidays/${year}/${countryCode}`);
    if (!response.ok) {
      // Handle 404 specifically (e.g., year out of range for API or invalid country)
      if (response.status === 404) {
        // SYNTAX FIX: Used template literal (backticks) for console argument
        console.warn(`API returned 404 for ${cacheKey}. Assuming no holidays.`);
        // Store empty result in cache to avoid refetching invalid request
        const emptyHolidayMap = {};
        if (!state.holidaysCache[countryCode]) state.holidaysCache[countryCode] = {};
        state.holidaysCache[countryCode][year] = emptyHolidayMap;
        const dataToStore = { timestamp: Date.now(), data: emptyHolidayMap };
        safeLocalStorageSetItem(cacheKey, JSON.stringify(dataToStore)); // Assumes safeLocalStorageSetItem is available
        return emptyHolidayMap;
      }
      // SYNTAX FIX: Used template literal (backticks) for Error message argument
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const holidays = await response.json();

    // Process and map the holidays
    const holidayMap = holidays.reduce((acc, holiday) => {
      // Store all available info: name, type, global, counties, launchYear etc.
      acc[holiday.date] = {
        name: holiday.name,
        type: holiday.type,
        global: holiday.global,
        counties: holiday.counties || null, // Ensure counties is stored, default to null if missing
        launchYear: holiday.launchYear,
        // localName: holiday.localName, // Could also store if needed
      };
      return acc;
    }, {});

    // Store in memory cache
    if (!state.holidaysCache[countryCode]) state.holidaysCache[countryCode] = {};
    state.holidaysCache[countryCode][year] = holidayMap;

    // Store in localStorage cache with timestamp
    const dataToStore = {
      timestamp: Date.now(),
      data: holidayMap,
    };
    safeLocalStorageSetItem(cacheKey, JSON.stringify(dataToStore)); // Assumes safeLocalStorageSetItem is available

    return holidayMap;
    // SYNTAX FIX: Removed extraneous text artifact below
  } catch (error) {
    console.error('Error fetching holidays:', error);
    const errorMsg = t('errorLoadingHolidays', { countryName });
    updateState({ apiError: errorMsg });
    displayApiError(errorMsg); // Display error in UI
    // Return empty object on error but don't cache failure aggressively, allow retry
    return {};
    // SYNTAX FIX: Removed extraneous text artifact below
  } finally {
    hideLoadingOverlay(); // Hide loading indicator
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
  // SYNTAX FIX: Used template literal (backticks) for string assignment
  const cacheKey = `upcoming-${countryCode}`;
  // Note: getCountryName needs to be defined/imported correctly for runtime
  const countryName = typeof getCountryName === 'function' ? getCountryName(DOM_ELEMENTS.countrySelect, countryCode) : countryCode;

  // 1. Check in-memory cache first (including timestamp)
  if (state.upcomingCache[countryCode]) {
    const { timestamp, data } = state.upcomingCache[countryCode];
    if (timestamp && typeof timestamp === 'number' && Date.now() - timestamp < CONFIG.CACHE_EXPIRY_MS) {
      // SYNTAX FIX: Used template literal (backticks) for console argument
      console.debug(`Cache hit (Memory): ${cacheKey}`);
      return data;
    } else {
      // SYNTAX FIX: Used template literal (backticks) for console argument
      console.debug(`Cache expired/invalid (Memory): ${cacheKey}`);
      delete state.upcomingCache[countryCode]; // Remove expired/invalid
    }
  }

  // 2. Check localStorage cache
  try {
    const cachedData = safeLocalStorageGetItem(cacheKey); // Assumes safeLocalStorageGetItem is available
    if (cachedData) {
      const { timestamp, data } = JSON.parse(cachedData);
      if (timestamp && typeof timestamp === 'number' && Date.now() - timestamp < CONFIG.CACHE_EXPIRY_MS) {
        // SYNTAX FIX: Used template literal (backticks) for console argument
        console.debug(`Cache hit (Storage): ${cacheKey}`);
        // Store in memory cache
        state.upcomingCache[countryCode] = { timestamp, data };
        return data;
      } else {
        // SYNTAX FIX: Used template literal (backticks) for console argument
        console.debug(`Cache expired/invalid (Storage): ${cacheKey}`);
        safeLocalStorageRemoveItem(cacheKey); // Assumes safeLocalStorageRemoveItem is available
      }
    }
  } catch (e) {
    // SYNTAX FIX: Used template literal (backticks) for console argument
    console.error(`Error reading/parsing localStorage cache (${cacheKey}):`, e);
    safeLocalStorageRemoveItem(cacheKey);
  }

  // 3. Fetch from API
  // SYNTAX FIX: Used template literal (backticks) for console argument
  console.debug(`Workspaceing API: ${cacheKey}`);
  showUpcomingLoading(); // Show loading indicator for upcoming list
  updateState({ isLoadingUpcoming: true, upcomingError: null });
  clearUpcomingError();

  try {
    // SYNTAX FIX: Used template literal (backticks) for fetch URL argument
    const response = await fetch(`${CONFIG.API_BASE_URL}/NextPublicHolidays/${countryCode}`);
    if (!response.ok) {
      // Handle 204 No Content specifically - means no upcoming holidays found
      if (response.status === 204) {
        // SYNTAX FIX: Used template literal (backticks) for console argument
        console.debug(`No upcoming holidays found for ${countryCode}`);
        const noHolidaysData = { timestamp: Date.now(), data: [] }; // Cache empty array
        state.upcomingCache[countryCode] = noHolidaysData;
        safeLocalStorageSetItem(cacheKey, JSON.stringify(noHolidaysData)); // Assumes safeLocalStorageSetItem is available
        return []; // Return empty array, not null
      }
      // SYNTAX FIX: Used template literal (backticks) for Error message argument
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const holidays = await response.json();

    // Store in memory and localStorage cache with timestamp
    const dataToStore = {
      timestamp: Date.now(),
      data: holidays, // The array of upcoming holidays
    };
    state.upcomingCache[countryCode] = dataToStore;
    safeLocalStorageSetItem(cacheKey, JSON.stringify(dataToStore)); // Assumes safeLocalStorageSetItem is available

    return holidays;
    // SYNTAX FIX: Removed extraneous text artifact below
  } catch (error) {
    // SYNTAX FIX: Used template literal (backticks) for console argument
    console.error(`Error fetching upcoming holidays for ${countryCode}:`, error);
    const errorMsg = t('errorLoadingUpcoming', { countryName });
    updateState({ upcomingError: errorMsg });
    displayUpcomingError(errorMsg); // Display error in UI
    // Don't cache error state, allow retry
    // const errorData = { timestamp: Date.now(), data: null };
    // state.upcomingCache[countryCode] = errorData;
    // safeLocalStorageSetItem(cacheKey, JSON.stringify(errorData));

    return null; // Return null on error
    // SYNTAX FIX: Removed extraneous text artifact below
  } finally {
    hideUpcomingLoading(); // Hide loading indicator
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
    const cachedData = safeLocalStorageGetItem(cacheKey); // Assumes safeLocalStorageGetItem is available
    if (cachedData) {
      const { timestamp, data } = JSON.parse(cachedData);
      if (timestamp && typeof timestamp === 'number' && Date.now() - timestamp < CONFIG.COUNTRY_CACHE_EXPIRY_MS) {
        // SYNTAX FIX: Used template literal (backticks) for console argument
        console.debug(`Cache hit (Storage): ${cacheKey}`);
        updateState({ availableCountriesCache: data }); // Update state cache
        return data;
      } else {
        // SYNTAX FIX: Used template literal (backticks) for console argument
        console.debug(`Cache expired/invalid (Storage): ${cacheKey}`);
        safeLocalStorageRemoveItem(cacheKey); // Assumes safeLocalStorageRemoveItem is available
      }
    }
  } catch (e) {
    // SYNTAX FIX: Used template literal (backticks) for console argument
    console.error(`Error reading/parsing localStorage cache (${cacheKey}):`, e);
    safeLocalStorageRemoveItem(cacheKey);
  }

  // 2. Fetch from API
  // SYNTAX FIX: Used template literal (backticks) for console argument
  console.debug(`Workspaceing API: ${cacheKey}`);
  updateState({ isLoadingCountries: true, countriesError: null });
  clearCountryError();

  try {
    // SYNTAX FIX: Used template literal (backticks) for fetch URL argument
    const response = await fetch(`${CONFIG.API_BASE_URL}/AvailableCountries`);
    if (!response.ok) {
      // SYNTAX FIX: Used template literal (backticks) for Error message argument
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const countries = await response.json();

    // Sort countries by name for display
    countries.sort((a, b) => a.name.localeCompare(b.name));

    // Store in state and localStorage cache with timestamp
    updateState({ availableCountriesCache: countries });
    const dataToStore = {
      timestamp: Date.now(),
      data: countries,
    };
    safeLocalStorageSetItem(cacheKey, JSON.stringify(dataToStore)); // Assumes safeLocalStorageSetItem is available

    return countries;
    // SYNTAX FIX: Removed extraneous text artifact below
  } catch (error) {
    console.error('Error fetching available countries:', error);
    const errorMsg = t('errorLoadingCountries');
    updateState({ countriesError: errorMsg });
    displayCountryError(errorMsg); // Display error in UI near country select
    return null; // Return null on error
  } finally {
    updateState({ isLoadingCountries: false });
  }
}