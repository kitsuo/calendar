// js/utils.js
import { isValid, format, getISOWeek } from 'date-fns'; // Use specific imports

/**
 * Formats a Date object into YYYY-MM-DD string using date-fns.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
export function formatDateYYYYMMDD(date) {
  // TODO: Add unit tests for this date formatting function.
  if (!date || !isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
}

/**
 * Gets the ISO week number for a date using date-fns.
 * @param {Date} date - The date.
 * @returns {number} The ISO week number.
 */
export function getWeekNumber(date) {
  // TODO: Add unit tests for week number calculation.
  if (!date || !isValid(date)) return 0;
  return getISOWeek(date);
}

/**
 * Gets the display name of a country from the select dropdown.
 * @param {HTMLSelectElement | null} countrySelectElement - The country select dropdown.
 * @param {string} countryCode - The country code (e.g., 'FR').
 * @returns {string} The country name or the code if not found or element is missing.
 */
export function getCountryName(countrySelectElement, countryCode) {
  // Added check for null element
  if (!countrySelectElement || !countryCode) return countryCode || '';
  const option = countrySelectElement.querySelector(`option[value="${countryCode}"]`);
  return option ? option.textContent || countryCode : countryCode; // Added fallback for empty textContent
}

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The debounce delay in milliseconds.
 * @returns {Function} The debounced function.
 */
export function debounce(func, wait) {
  // TODO: Add unit tests for debouncing.
  let timeout;
  return function executedFunction(...args) {
    const context = this; // Capture context
    const later = () => {
      timeout = null; // Clear timeout ID before calling func
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a DocumentFragment from an array of items.
 * Efficiently builds DOM structure before appending.
 * @template T
 * @param {Array<T>} items - The array of items to process.
 * @param {function(item: T, index: number): Node | null} createNodeFn - Function to create a DOM Node for each item.
 * @returns {DocumentFragment}
 */
export function createDocumentFragment(items, createNodeFn) {
  const fragment = document.createDocumentFragment();
  if (!items) return fragment; // Handle null/undefined items array

  items.forEach((item, index) => {
    try { // Add try-catch around node creation
        const node = createNodeFn(item, index);
        if (node instanceof Node) { // Check if it's a valid node
          fragment.appendChild(node);
        } else if (node !== null) {
            console.warn("createNodeFn did not return a DOM Node or null for item:", item);
        }
    } catch(e) {
        console.error("Error in createNodeFn for item:", item, e);
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
  // TODO: Add unit tests for localStorage interactions.
  try {
    // Check if localStorage is actually available (e.g., not in private Browse in some older browsers)
    if (typeof localStorage === 'undefined') return null;
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
  // TODO: Add unit tests for localStorage interactions.
  try {
    if (typeof localStorage === 'undefined') return;
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
  // TODO: Add unit tests for localStorage interactions.
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch (e) {
    console.error(`LocalStorage Remove Error (${key}):`, e);
  }
}