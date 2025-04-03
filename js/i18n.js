// js/i18n.js
import { state, getCurrentLocale } from './state.js';
import { format } from 'date-fns'; // Use specific imports
// Import locales needed by getCurrentLocale fallback if separate files
import { enUS } from 'date-fns/locale';

// --- Internationalization (i18n) ---

export const i18n = {
  en: {
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    weekdaysMini: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    week: 'Wk',
    noDaySelected: 'Select a day',
    today: 'Today',
    publicHoliday: 'Public Holiday',
    bankHoliday: 'Bank Holiday',
    optionalHoliday: 'Optional Holiday',
    holidayType: 'Holiday ({type})',
    scope: 'Scope',
    national: 'National',
    regional: 'Regional',
    regions: 'Regions',
    regionsMore: '+ {count} more',
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
    selectWeekStart: 'Week Starts:',
    weekStartSunday: 'Sunday',
    weekStartMonday: 'Monday',
    prevPeriod: 'Previous Period',
    nextPeriod: 'Next Period',
    prevMonth: 'Previous Month',
    nextMonth: 'Next Month',
    prevWeek: 'Previous Week',
    nextWeek: 'Next Week',
    prevYear: 'Previous Year',
    nextYear: 'Next Year',
    gridLabelMonth: 'Calendar for {month} {year}',
    gridLabelWeek: 'Calendar for week starting {date}',
    gridLabelYear: 'Calendar for {year}',
    gridLabelYearMonth: '{month} {year}',
    weekLabel: 'Week {weekNum}',
    selected: 'Selected',
    weekend: 'Weekend',
    invalidInput: 'Invalid input', // Added for generic date jump error
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
    printTitle: 'Calendar: {context}',
  },
  fr: {
    monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    monthNamesShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    weekdays: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    weekdaysShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    weekdaysMini: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
    week: 'Sem',
    noDaySelected: 'Sélectionnez un jour',
    today: 'Aujourd\'hui',
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
    invalidInput: 'Saisie invalide', // Added
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
    week: 'KW',
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
    invalidInput: 'Ungültige Eingabe', // Added
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
const holidayNameTranslations = {
  '01-01': { en: 'New Year\'s Day', fr: 'Jour de l\'an', de: 'Neujahrstag' },
  'EASTER': { en: 'Easter Sunday', fr: 'Pâques', de: 'Ostersonntag' },
  'GOOD_FRIDAY': { en: 'Good Friday', fr: 'Vendredi Saint', de: 'Karfreitag' },
  'EASTER_MONDAY': { en: 'Easter Monday', fr: 'Lundi de Pâques', de: 'Ostermontag' },
  '05-01': { en: 'Labour Day', fr: 'Fête du Travail', de: 'Tag der Arbeit' },
  '05-08': { en: 'Victory in Europe Day', fr: 'Victoire 1945', de: 'Tag des Sieges' },
  'ASCENSION': { en: 'Ascension Day', fr: 'Ascension', de: 'Christi Himmelfahrt' },
  'PENTECOST': { en: 'Pentecost Sunday', fr: 'Pentecôte', de: 'Pfingstsonntag' },
  'PENTECOST_MONDAY': { en: 'Whit Monday', fr: 'Lundi de Pentecôte', de: 'Pfingstmontag' },
  'CORPUS_CHRISTI': { en: 'Corpus Christi', fr: 'Fête-Dieu', de: 'Fronleichnam' },
  '07-14': { en: 'Bastille Day', fr: 'Fête Nationale', de: 'Französischer Nationalfeiertag' },
  '08-01': { en: 'Swiss National Day', fr: 'Fête Nationale Suisse', de: 'Schweizer Nationalfeiertag' },
  '08-15': { en: 'Assumption Day', fr: 'Assomption', de: 'Mariä Himmelfahrt' },
  '10-03': { en: 'German Unity Day', fr: 'Jour de l\'Unité Allemande', de: 'Tag der Deutschen Einheit' },
  '10-26': { en: 'National Day', fr: 'Fête Nationale', de: 'Nationalfeiertag' }, // AT
  '11-01': { en: 'All Saints\' Day', fr: 'Toussaint', de: 'Allerheiligen' },
  '11-11': { en: 'Armistice Day', fr: 'Armistice 1918', de: 'Waffenstillstandstag' },
  '12-25': { en: 'Christmas Day', fr: 'Noël', de: 'Erster Weihnachtstag' },
  '12-26': { en: 'St Stephen\'s Day / Boxing Day', fr: 'Lendemain de Noël (St Étienne)', de: 'Zweiter Weihnachtstag' }
};

const knownVariableHolidayNames = {
  'easter sunday': 'EASTER',
  'good friday': 'GOOD_FRIDAY',
  'easter monday': 'EASTER_MONDAY',
  'ascension day': 'ASCENSION',
  'whit sunday': 'PENTECOST',
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
  if (!apiName) return '';
  const lowerApiName = apiName.toLowerCase();
  let key = null;

  for (const name in knownVariableHolidayNames) {
    // Use includes for partial matches if API names vary slightly
    if (lowerApiName.includes(name)) {
      key = knownVariableHolidayNames[name];
      break;
    }
  }

  if (!key && holidayDateString && holidayDateString.length === 10) {
    const monthDay = holidayDateString.substring(5);
    if (holidayNameTranslations.hasOwnProperty(monthDay)) {
      key = monthDay;
    }
  }

  if (key) {
    const translations = holidayNameTranslations[key];
    // Use optional chaining for safer access
    return translations?.[state.currentLang] ?? apiName; // Fallback to apiName if key or lang not found
  }

  return apiName;
}

/**
 * Get a translated string from the i18n object.
 * @param {string} key - The key for the string (e.g., 'today', 'errorLoadingHolidays').
 * @param {object} [replacements={}] - Optional object with placeholders to replace (e.g., {countryName: 'France'}).
 * @returns {string} The translated string or the key if not found.
 */
export function t(key, replacements = {}) {
  let translation = i18n[state.currentLang]?.[key] ?? i18n['en']?.[key] ?? key; // Use nullish coalescing

  // Basic replacement, consider more robust library for complex cases
  for (const placeholder in replacements) {
    // Use RegExp for global replacement, escaping placeholder for safety
    const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
    translation = translation.replace(regex, replacements[placeholder]);
  }
  return translation;
}

/**
 * Translates known holiday types.
 * @param {string} apiType - The type string from the API (e.g., "Public", "Bank").
 * @returns {string} The translated type or the original type.
 */
export function translateHolidayType(apiType) {
  if (!apiType) return '';
  const lowerType = apiType.toLowerCase();
  switch (lowerType) {
    case 'public': return t('publicHoliday');
    case 'bank': return t('bankHoliday');
    case 'optional': return t('optionalHoliday');
    // Add cases for other known types like 'school', 'authorities' if needed
    default: return apiType;
  }
}

/**
 * Formats a date using Intl.DateTimeFormat based on current language and options.
 * ADDED EXPORT as it's used in other modules.
 * @param {Date} date The date to format.
 * @param {Intl.DateTimeFormatOptions} options Formatting options.
 * @returns {string} Formatted date string.
 */
export function formatDateIntl(date, options) {
  // TODO: Add unit tests for date formatting.
  try {
    const validLocale = state.currentLang || 'en';
    // Ensure the locale exists in Intl before using it
    const supported = Intl.DateTimeFormat.supportedLocalesOf([validLocale]);
    const localeToUse = supported.length > 0 ? supported[0] : 'en'; // Fallback to 'en'
    return new Intl.DateTimeFormat(localeToUse, options).format(date);
  } catch (e) {
    console.warn("Intl.DateTimeFormat error, falling back to date-fns format:", e);
    const locale = getCurrentLocale() || enUS; // Ensure locale is imported/available
    let formatString = 'PPP';
    if (options.dateStyle === 'medium') formatString = 'PP';
    if (options.dateStyle === 'short') formatString = 'P';
    try { // Add try-catch for date-fns format as well
        return format(date, formatString, { locale });
    } catch (formatError) {
        console.error("date-fns format error after Intl fallback:", formatError);
        return date.toDateString(); // Absolute fallback
    }
  }
}