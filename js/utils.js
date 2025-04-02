// js/utils.js

/**
 * Formats a Date object into YYYY-MM-DD string using date-fns.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
export function formatDateYYYYMMDD(date) {
    if (!date || !dateFns.isValid(date)) return '';
    return dateFns.format(date, 'yyyy-MM-dd');
}

/**
 * Gets the ISO week number for a date using date-fns.
 * @param {Date} date - The date.
 * @returns {number} The ISO week number.
 */
export function getWeekNumber(date) {
     if (!date || !dateFns.isValid(date)) return 0;
     // Use { weekStartsOn: 1 } for ISO week number (Monday start)
     return dateFns.getISOWeek(date);
}

/**
 * Gets the display name of a country from the select dropdown.
 * @param {HTMLSelectElement} countrySelectElement - The country select dropdown.
 * @param {string} countryCode - The country code (e.g., 'FR').
 * @returns {string} The country name or the code if not found.
 */
export function getCountryName(countrySelectElement, countryCode) {
    const option = countrySelectElement.querySelector(`option[value="${countryCode}"]`);
    return option ? option.textContent : countryCode;
}

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The debounce delay in milliseconds.
 * @returns {Function} The debounced function.
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Creates a DocumentFragment from an array of items.
 * @param {Array<T>} items - The array of items to process.
 * @param {function(item: T): HTMLElement} createNodeFn - Function to create an HTML element for each item.
 * @returns {DocumentFragment}
 */
export function createDocumentFragment(items, createNodeFn) {
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const node = createNodeFn(item);
        if (node) { // Ensure node creation was successful
            fragment.appendChild(node);
        }
    });
    return fragment;
}

/**
 * Safely reads from localStorage.
 * @param {string} key
 * @returns {string | null}
 */
export function safeLocalStorageGetItem(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.error(`LocalStorage Read Error (${key}):`, e);
        return null;
    }
}

/**
 * Safely writes to localStorage.
 * @param {string} key
 * @param {string} value
 */
export function safeLocalStorageSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.error(`LocalStorage Write Error (${key}):`, e);
    }
}

/**
 * Safely removes from localStorage.
 * @param {string} key
 */
export function safeLocalStorageRemoveItem(key) {
     try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error(`LocalStorage Remove Error (${key}):`, e);
    }
}
