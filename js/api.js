// js/api.js
import { CONFIG, DOM_ELEMENTS } from './config.js';
import { state, updateState } from './state.js';
import { t } from './i18n.js';
import { formatDateYYYYMMDD, getCountryName, safeLocalStorageGetItem, safeLocalStorageSetItem } from './utils.js';
import { hideLoadingOverlay, showLoadingOverlay, displayApiError, clearApiError, showUpcomingLoading, hideUpcomingLoading, displayUpcomingError, clearUpcomingError } from './ui.js';

/**
 * Fetches public holidays for a given year and country code from API or cache.
 * Uses both in-memory cache and localStorage.
 * @param {number} year
 * @param {string} countryCode
 * @returns {Promise<object>} A map of dateString -> holidayInfo.
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
            if (timestamp && Date.now() - timestamp < CONFIG.CACHE_EXPIRY_MS) {
                console.debug(`Cache hit (Storage): ${cacheKey}`);
                // Store in memory cache as well
                if (!state.holidaysCache[countryCode]) state.holidaysCache[countryCode] = {};
                state.holidaysCache[countryCode][year] = data;
                return data;
            } else {
                console.debug(`Cache expired (Storage): ${cacheKey}`);
                localStorage.removeItem(cacheKey); // Remove expired data
            }
        }
    } catch (e) {
        console.error(`Error reading localStorage cache (${cacheKey}):`, e);
        localStorage.removeItem(cacheKey); // Remove potentially corrupted data
    }

    // 3. Fetch from API if not cached or expired
    console.debug(`Workspaceing API: ${cacheKey}`);
    showLoadingOverlay(); // Show loading indicator for grid
    updateState({ isLoadingGrid: true, apiError: null });
    clearApiError();

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/PublicHolidays/${year}/${countryCode}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const holidays = await response.json();
        // Process and map the holidays
        const holidayMap = holidays.reduce((acc, holiday) => {
            // Store all available info: name, type, global, counties, launchYear etc.
            acc[holiday.date] = {
                name: holiday.name,
                type: holiday.type, // Added type
                global: holiday.global,
                counties: holiday.counties, // Added counties
                launchYear: holiday.launchYear, // Added launchYear
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
        safeLocalStorageSetItem(cacheKey, JSON.stringify(dataToStore));

        return holidayMap;

    } catch (error) {
        console.error('Error fetching holidays:', error);
        const errorMsg = t('errorLoadingHolidays', { countryName });
        updateState({ apiError: errorMsg });
        displayApiError(errorMsg); // Display error in UI
        // Return empty object on error but cache the fact that it failed (optional, prevents hammering)
        // Or just return empty without caching failure
        if (!state.holidaysCache[countryCode]) state.holidaysCache[countryCode] = {};
        state.holidaysCache[countryCode][year] = {}; // Store empty to avoid refetching immediately on retry? Decide policy.
        return {};
    } finally {
        hideLoadingOverlay(); // Hide loading indicator
        updateState({ isLoadingGrid: false });
    }
}


/**
 * Fetches upcoming public holidays for a country code from API or cache.
 * Uses both in-memory cache and localStorage.
 * @param {string} countryCode
 * @returns {Promise<Array|null>} Array of holiday objects or null on error/no holidays.
 */
export async function fetchUpcomingLocalHolidays(countryCode) {
    const cacheKey = `upcoming-${countryCode}`;
    const countryName = getCountryName(DOM_ELEMENTS.countrySelect, countryCode);

    // 1. Check in-memory cache first (including timestamp)
    if (state.upcomingCache[countryCode]) {
        const { timestamp, data } = state.upcomingCache[countryCode];
        if (timestamp && Date.now() - timestamp < CONFIG.CACHE_EXPIRY_MS) {
             console.debug(`Cache hit (Memory): ${cacheKey}`);
             return data;
        } else {
            console.debug(`Cache expired (Memory): ${cacheKey}`);
            delete state.upcomingCache[countryCode]; // Remove expired
        }
    }

     // 2. Check localStorage cache
    try {
        const cachedData = safeLocalStorageGetItem(cacheKey);
        if (cachedData) {
            const { timestamp, data } = JSON.parse(cachedData);
            if (timestamp && Date.now() - timestamp < CONFIG.CACHE_EXPIRY_MS) {
                console.debug(`Cache hit (Storage): ${cacheKey}`);
                // Store in memory cache
                state.upcomingCache[countryCode] = { timestamp, data };
                return data;
            } else {
                console.debug(`Cache expired (Storage): ${cacheKey}`);
                localStorage.removeItem(cacheKey);
            }
        }
    } catch (e) {
        console.error(`Error reading localStorage cache (${cacheKey}):`, e);
        localStorage.removeItem(cacheKey);
    }


    // 3. Fetch from API
    console.debug(`Workspaceing API: ${cacheKey}`);
    showUpcomingLoading(); // Show loading indicator for upcoming list
    updateState({ isLoadingUpcoming: true, upcomingError: null });
    clearUpcomingError();

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/NextPublicHolidays/${countryCode}`);
        if (!response.ok) {
             // Handle 204 No Content specifically - means no upcoming holidays found
             if (response.status === 204) {
                 console.debug(`No upcoming holidays found for ${countryCode}`);
                 const noHolidaysData = { timestamp: Date.now(), data: [] }; // Cache empty array
                 state.upcomingCache[countryCode] = noHolidaysData;
                 safeLocalStorageSetItem(cacheKey, JSON.stringify(noHolidaysData));
                 return [];
             }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const holidays = await response.json();

        // Store in memory and localStorage cache with timestamp
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
        displayUpcomingError(errorMsg); // Display error in UI

        // Cache the error state (null data) with timestamp to prevent immediate refetch
        const errorData = { timestamp: Date.now(), data: null };
        state.upcomingCache[countryCode] = errorData;
        // Optionally cache error state in localStorage too? Decide policy.
        // safeLocalStorageSetItem(cacheKey, JSON.stringify(errorData));

        return null; // Return null on error
    } finally {
        hideUpcomingLoading(); // Hide loading indicator
        updateState({ isLoadingUpcoming: false });
    }
}
