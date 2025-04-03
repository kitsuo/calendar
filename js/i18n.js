// js/i18n.js
import { state, getCurrentLocale } from './state.js';
import { format } from 'date-fns'; // Use specific imports

// --- Internationalization (i18n) ---

export const i18n = {
  en: {
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    weekdaysMini: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'], // For year view
    week: 'Wk', // Abbreviation for Week
    noDaySelected: 'Select a day',
    today: 'Today',
    publicHoliday: 'Public Holiday',
    bankHoliday: 'Bank Holiday',
    optionalHoliday: 'Optional Holiday', // Generic term
    holidayType: 'Holiday ({type})',
    scope: 'Scope',
    national: 'National',
    regional: 'Regional',
    regions: 'Regions', // Label for list of regions
    regionsMore: '+ {count} more', // Truncation indicator
    observedSince: 'Observed since',
    noInfo: 'No details available',
    searchLink: 'Search online',
    errorLoadingHolidays: 'Error loading holidays for {countryName}. Please check connection or try again.',
    errorLoadingUpcoming: 'Error loading upcoming holidays for {countryName}. Please check connection or try again.',
    errorLoadingCountries: 'Error loading country list. Please check connection or try again.',
    upcomingTitle: 'Upcoming Holidays ({countryName})',
    noUpcomingHolidaysCountry: 'No upcoming public holidays found for {countryName}.',
    retry: 'Retry',
    jumpTo: 'Jump to:',
    selectCountry: 'Country:',
    selectCountryLoading: 'Loading countries...',
    selectLang: 'Lang:',
    selectYear: 'Select Year',
    selectMonth: 'Select Month',
    selectView: 'Select View',
    selectTheme: 'Select Theme',
    selectWeekStart: 'Week Starts:', // Label for week start dropdown
    weekStartSunday: 'Sunday',
    weekStartMonday: 'Monday',
    prevPeriod: 'Previous Period', // Generic label
    nextPeriod: 'Next Period', // Generic label
    prevMonth: 'Previous Month', // Specific for ARIA if needed
    nextMonth: 'Next Month',
    prevWeek: 'Previous Week',
    nextWeek: 'Next Week',
    prevYear: 'Previous Year',
    nextYear: 'Next Year',
    gridLabelMonth: 'Calendar for {month} {year}',
    gridLabelWeek: 'Calendar for week starting {date}',
    gridLabelYear: 'Calendar for {year}',
    gridLabelYearMonth: '{month} {year}', // ARIA label for month in year view
    weekLabel: 'Week {weekNum}',
    selected: 'Selected',
    weekend: 'Weekend', // Added for weekend ARIA label
    invalidDateJump: 'Invalid date selected. Please choose a date between {minYear} and {maxYear}.',
    searchHolidays: 'Search Holidays',
    searchPlaceholder: 'Search holidays...',
    searchResultsTitle: 'Search Results for "{query}"',
    noSearchResults: 'No holidays found for "{query}".',
    closeSearchResults: 'Close Search Results',
    viewMonth: 'Month',
    viewWeek: 'Week',
    viewYear: 'Year',
    themeLight: 'Light',
    themeDark: 'Dark',
    printTitle: 'Calendar: {context}', // Context: e.g., France - August 2024, France - Week of Aug 18, 2024, France - 2024
  },
  fr: {
    monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    monthNamesShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    weekdays: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    weekdaysShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    weekdaysMini: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
    week: 'Sem', // Abbreviation for Week
    noDaySelected: 'Sélectionnez un jour',
    today: 'Aujourd\'hui', // Corrected apostrophe
    publicHoliday: 'Jour Férié Public',
    bankHoliday: 'Férié Bancaire',
    optionalHoliday: 'Férié Optionnel',
    holidayType: 'Férié ({type})',
    scope: 'Portée',
    national: 'Nationale',
    regional: 'Régionale',
    regions: 'Régions',
    regionsMore: '+ {count} autres',
    observedSince: 'Observé depuis',
    noInfo: 'Aucun détail disponible',
    searchLink: 'Rechercher en ligne',
    errorLoadingHolidays: 'Erreur lors du chargement des jours fériés pour {countryName}. Vérifiez la connexion ou réessayez.',
    errorLoadingUpcoming: 'Erreur lors du chargement des prochains jours fériés pour {countryName}. Vérifiez la connexion ou réessayez.',
    errorLoadingCountries: 'Erreur lors du chargement de la liste des pays. Vérifiez la connexion ou réessayez.',
    upcomingTitle: 'Prochains Jours Fériés ({countryName})',
    noUpcomingHolidaysCountry: 'Aucun jour férié public à venir trouvé pour {countryName}.',
    retry: 'Réessayer',
    jumpTo: 'Aller à :',
    selectCountry: 'Pays :',
    selectCountryLoading: 'Chargement pays...',
    selectLang: 'Langue :',
    selectYear: 'Année',
    selectMonth: 'Mois',
    selectView: 'Vue',
    selectTheme: 'Thème',
    selectWeekStart: 'Sem. débute:',
    weekStartSunday: 'Dimanche',
    weekStartMonday: 'Lundi',
    prevPeriod: 'Période Précédente',
    nextPeriod: 'Période Suivante',
    prevMonth: 'Mois Précédent',
    nextMonth: 'Mois Suivant',
    prevWeek: 'Semaine Précédente',
    nextWeek: 'Semaine Suivante',
    prevYear: 'Année Précédente',
    nextYear: 'Année Suivante',
    gridLabelMonth: 'Calendrier pour {month} {year}',
    gridLabelWeek: 'Calendrier pour la semaine du {date}',
    gridLabelYear: 'Calendrier pour {year}',
    gridLabelYearMonth: '{month} {year}',
    weekLabel: 'Semaine {weekNum}',
    selected: 'Sélectionné',
    weekend: 'Weekend',
    invalidDateJump: 'Date sélectionnée invalide. Veuillez choisir une date entre {minYear} et {maxYear}.',
    searchHolidays: 'Rechercher Fériés',
    searchPlaceholder: 'Rechercher fériés...',
    searchResultsTitle: 'Résultats pour "{query}"',
    noSearchResults: 'Aucun férié trouvé pour "{query}".',
    closeSearchResults: 'Fermer Résultats Recherche',
    viewMonth: 'Mois',
    viewWeek: 'Semaine',
    viewYear: 'Année',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    printTitle: 'Calendrier : {context}',
  },
  de: {
    monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    weekdays: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    weekdaysShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    weekdaysMini: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    week: 'KW', // Kalenderwoche
    noDaySelected: 'Wähle einen Tag',
    today: 'Heute',
    publicHoliday: 'Gesetzlicher Feiertag',
    bankHoliday: 'Bankfeiertag',
    optionalHoliday: 'Optionaler Feiertag',
    holidayType: 'Feiertag ({type})',
    scope: 'Geltungsbereich',
    national: 'National',
    regional: 'Regional',
    regions: 'Regionen',
    regionsMore: '+ {count} weitere',
    observedSince: 'Beobachtet seit',
    noInfo: 'Keine Details verfügbar',
    searchLink: 'Online suchen',
    errorLoadingHolidays: 'Fehler beim Laden der Feiertage für {countryName}. Bitte Verbindung prüfen oder erneut versuchen.',
    errorLoadingUpcoming: 'Fehler beim Laden der nächsten Feiertage für {countryName}. Bitte Verbindung prüfen oder erneut versuchen.',
    errorLoadingCountries: 'Fehler beim Laden der Länderliste. Bitte Verbindung prüfen oder erneut versuchen.',
    upcomingTitle: 'Nächste Feiertage ({countryName})',
    noUpcomingHolidaysCountry: 'Keine bevorstehenden Feiertage für {countryName} gefunden.',
    retry: 'Wiederholen',
    jumpTo: 'Springe zu:',
    selectCountry: 'Land:',
    selectCountryLoading: 'Lade Länder...',
    selectLang: 'Sprache:',
    selectYear: 'Jahr wählen',
    selectMonth: 'Monat wählen',
    selectView: 'Ansicht',
    selectTheme: 'Thema',
    selectWeekStart: 'Woche beginnt:',
    weekStartSunday: 'Sonntag',
    weekStartMonday: 'Montag',
    prevPeriod: 'Vorherige Periode',
    nextPeriod: 'Nächste Periode',
    prevMonth: 'Vorheriger Monat',
    nextMonth: 'Nächster Monat',
    prevWeek: 'Vorherige Woche',
    nextWeek: 'Nächste Woche',
    prevYear: 'Vorheriges Jahr',
    nextYear: 'Nächstes Jahr',
    gridLabelMonth: 'Kalender für {month} {year}',
    gridLabelWeek: 'Kalender für Woche ab {date}',
    gridLabelYear: 'Kalender für {year}',
    gridLabelYearMonth: '{month} {year}',
    weekLabel: 'Woche {weekNum}',
    selected: 'Ausgewählt',
    weekend: 'Wochenende',
    invalidDateJump: 'Ungültiges Datum ausgewählt. Bitte wählen Sie ein Datum zwischen {minYear} und {maxYear}.',
    searchHolidays: 'Feiertage suchen',
    searchPlaceholder: 'Feiertage suchen...',
    searchResultsTitle: 'Suchergebnisse für "{query}"',
    noSearchResults: 'Keine Feiertage für "{query}" gefunden.',
    closeSearchResults: 'Suchergebnisse schließen',
    viewMonth: 'Monat',
    viewWeek: 'Woche',
    viewYear: 'Jahr',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    printTitle: 'Kalender: {context}',
  }
};

// --- Holiday Name Translations ---
// Structure: 'KEY': { en: 'English Name', fr: 'French Name', de: 'German Name' }
const holidayNameTranslations = {
  '01-01': { en: 'New Year\'s Day', fr: 'Jour de l\'an', de: 'Neujahrstag' }, // Corrected apostrophes
  'EASTER': { en: 'Easter Sunday', fr: 'Pâques', de: 'Ostersonntag' },
  'GOOD_FRIDAY': { en: 'Good Friday', fr: 'Vendredi Saint', de: 'Karfreitag' },
  'EASTER_MONDAY': { en: 'Easter Monday', fr: 'Lundi de Pâques', de: 'Ostermontag' },
  '05-01': { en: 'Labour Day', fr: 'Fête du Travail', de: 'Tag der Arbeit' },
  '05-08': { en: 'Victory in Europe Day', fr: 'Victoire 1945', de: 'Tag des Sieges' }, // Primarily FR/DE relevant
  'ASCENSION': { en: 'Ascension Day', fr: 'Ascension', de: 'Christi Himmelfahrt' },
  'PENTECOST': { en: 'Pentecost Sunday', fr: 'Pentecôte', de: 'Pfingstsonntag' },
  'PENTECOST_MONDAY': { en: 'Whit Monday', fr: 'Lundi de Pentecôte', de: 'Pfingstmontag' },
  'CORPUS_CHRISTI': { en: 'Corpus Christi', fr: 'Fête-Dieu', de: 'Fronleichnam' }, // Common in DE/AT/CH/PL etc.
  '07-14': { en: 'Bastille Day', fr: 'Fête Nationale', de: 'Französischer Nationalfeiertag' }, // Primarily FR
  '08-01': { en: 'Swiss National Day', fr: 'Fête Nationale Suisse', de: 'Schweizer Nationalfeiertag' }, // CH
  '08-15': { en: 'Assumption Day', fr: 'Assomption', de: 'Mariä Himmelfahrt' },
  '10-03': { en: 'German Unity Day', fr: 'Jour de l\'Unité Allemande', de: 'Tag der Deutschen Einheit' }, // DE - Corrected apostrophe
  '10-26': { en: 'National Day', fr: 'Fête Nationale', de: 'Nationalfeiertag' }, // AT
  '11-01': { en: 'All Saints\' Day', fr: 'Toussaint', de: 'Allerheiligen' }, // Corrected apostrophe
  '11-11': { en: 'Armistice Day', fr: 'Armistice 1918', de: 'Waffenstillstandstag' }, // Primarily FR/BE
  '12-25': { en: 'Christmas Day', fr: 'Noël', de: 'Erster Weihnachtstag' },
  '12-26': { en: 'St Stephen\'s Day / Boxing Day', fr: 'Lendemain de Noël (St Étienne)', de: 'Zweiter Weihnachtstag' } // Corrected apostrophe
};

// Map common English names (lowercase) from API to translation keys
const knownVariableHolidayNames = {
  'easter sunday': 'EASTER',
  'good friday': 'GOOD_FRIDAY',
  'easter monday': 'EASTER_MONDAY',
  'ascension day': 'ASCENSION',
  'whit sunday': 'PENTECOST', // Alias
  'pentecost': 'PENTECOST',
  'whit monday': 'PENTECOST_MONDAY',
  'pentecost monday': 'PENTECOST_MONDAY',
  'corpus christi': 'CORPUS_CHRISTI',
};

/**
 * Gets a potentially translated name for a holiday.
 * @param {string | null} holidayDateString - Date in 'YYYY-MM-DD' or null.
 * @param {string} apiName - The name returned by the Nager API.
 * @returns {string} Translated name or the original API name.
 */
export function getTranslatedHolidayName(holidayDateString, apiName) {
  // TODO: Add unit tests for holiday name translation logic.
  if (!apiName) return '';

  const lowerApiName = apiName.toLowerCase();
  let key = null;

  // 1. Check known variable names
  for (const name in knownVariableHolidayNames) {
    if (lowerApiName.includes(name)) {
      key = knownVariableHolidayNames[name];
      break;
    }
  }

  // 2. Check fixed date MM-DD if no variable match
  if (!key && holidayDateString && holidayDateString.length === 10) {
    const monthDay = holidayDateString.substring(5); // 'MM-DD'
    if (holidayNameTranslations.hasOwnProperty(monthDay)) {
      key = monthDay;
    }
  }

  // 3. Use the key to get translation
  if (key) {
    const translations = holidayNameTranslations[key];
    if (translations && translations[state.currentLang]) {
      return translations[state.currentLang];
    }
  }

  // 4. Fallback to original API name
  return apiName;
}

/**
 * Get a translated string from the i18n object.
 * @param {string} key - The key for the string (e.g., 'today', 'errorLoadingHolidays').
 * @param {object} [replacements={}] - Optional object with placeholders to replace (e.g., {countryName: 'France'}).
 * @returns {string} The translated string or the key if not found.
 */
export function t(key, replacements = {}) {
  // TODO: Add unit tests for translation fallback and replacement logic.
  let translation = i18n[state.currentLang]?.[key] || i18n['en']?.[key] || key;

  for (const placeholder in replacements) {
    // SYNTAX FIX: Corrected arguments for replace. Using template literal for the search string.
    // This replaces the first occurrence. For global replace, use RegExp: new RegExp(`\\{${placeholder}\\}`, 'g')
    translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
  }
  return translation;
}

/**
 * Translates known holiday types.
 * @param {string} apiType - The type string from the API (e.g., "Public", "Bank").
 * @returns {string} The translated type or the original type.
 */
export function translateHolidayType(apiType) {
  // TODO: Add unit tests for holiday type translation.
  if (!apiType) return '';

  const lowerType = apiType.toLowerCase();
  switch (lowerType) {
    case 'public': return t('publicHoliday');
    case 'bank': return t('bankHoliday');
    case 'optional': return t('optionalHoliday');
    // Add cases for other known types like 'school', 'authorities' if needed
    default: return apiType; // Fallback to original if not specifically translated
  }
}

/**
 * Formats a date using Intl.DateTimeFormat based on current language and options.
 * @param {Date} date The date to format.
 * @param {Intl.DateTimeFormatOptions} options Formatting options.
 * @returns {string} Formatted date string.
 */
export function formatDateIntl(date, options) {
  // TODO: Add unit tests for date formatting.
  try {
    // Ensure state.currentLang is a valid locale string for Intl
    const validLocale = state.currentLang || 'en'; // Fallback to 'en'
    return new Intl.DateTimeFormat(validLocale, options).format(date);
  } catch (e) {
    console.warn("Intl.DateTimeFormat error, falling back to date-fns format:", e);
    // Fallback using date-fns default formatting for the locale
    const locale = getCurrentLocale(); // Assumes getCurrentLocale returns a date-fns locale object
    let formatString = 'PPP'; // Default long date format
    if (options.dateStyle === 'medium') formatString = 'PP';
    if (options.dateStyle === 'short') formatString = 'P';
    return format(date, formatString, { locale });
  }
}