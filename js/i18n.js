// js/i18n.js
import { state } from './state.js';

// --- Internationalization (i18n) ---
export const i18n = {
    en: {
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        weekdaysMini: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'], // For year view
        noDaySelected: 'Select a day',
        today: 'Today',
        publicHoliday: 'Public Holiday',
        bankHoliday: 'Bank Holiday',
        optionalHoliday: 'Optional Holiday', // Generic term
        holidayType: 'Holiday ({type})',
        scope: 'Scope',
        national: 'National',
        regional: 'Regional',
        observedSince: 'Observed since',
        noInfo: 'No details available',
        searchLink: 'Search online',
        errorLoadingHolidays: 'Error loading holidays for {countryName}. Please check connection or try again.',
        errorLoadingUpcoming: 'Error loading upcoming holidays for {countryName}. Please check connection or try again.',
        upcomingTitle: 'Upcoming Holidays ({countryName})',
        noUpcomingHolidaysCountry: 'No upcoming public holidays found for {countryName}.',
        retry: 'Retry',
        jumpTo: 'Jump to:',
        selectCountry: 'Country:',
        selectLang: 'Lang:',
        selectYear: 'Select Year',
        selectMonth: 'Select Month',
        selectView: 'Select View',
        selectTheme: 'Select Theme',
        prevPeriod: 'Previous Period', // Generic label
        nextPeriod: 'Next Period',   // Generic label
        prevMonth: 'Previous Month', // Specific for ARIA if needed
        nextMonth: 'Next Month',
        prevWeek: 'Previous Week',
        nextWeek: 'Next Week',
        prevYear: 'Previous Year',
        nextYear: 'Next Year',
        gridLabelMonth: 'Calendar for {month} {year}',
        gridLabelWeek: 'Calendar for week starting {date}',
        gridLabelYear: 'Calendar for {year}',
        weekLabel: 'Week {weekNum}',
        selected: 'Selected',
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
    },
    fr: {
        monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
        monthNamesShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        weekdaysShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
        weekdaysMini: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
        noDaySelected: 'Sélectionnez un jour',
        today: 'Aujourd\'hui',
        publicHoliday: 'Jour Férié Public',
        bankHoliday: 'Férié Bancaire',
        optionalHoliday: 'Férié Optionnel',
        holidayType: 'Férié ({type})',
        scope: 'Portée',
        national: 'Nationale',
        regional: 'Régionale',
        observedSince: 'Observé depuis',
        noInfo: 'Aucun détail disponible',
        searchLink: 'Rechercher en ligne',
        errorLoadingHolidays: 'Erreur lors du chargement des jours fériés pour {countryName}. Vérifiez la connexion ou réessayez.',
        errorLoadingUpcoming: 'Erreur lors du chargement des prochains jours fériés pour {countryName}. Vérifiez la connexion ou réessayez.',
        upcomingTitle: 'Prochains Jours Fériés ({countryName})',
        noUpcomingHolidaysCountry: 'Aucun jour férié public à venir trouvé pour {countryName}.',
        retry: 'Réessayer',
        jumpTo: 'Aller à :',
        selectCountry: 'Pays :',
        selectLang: 'Langue :',
        selectYear: 'Année',
        selectMonth: 'Mois',
        selectView: 'Vue',
        selectTheme: 'Thème',
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
        weekLabel: 'Semaine {weekNum}',
        selected: 'Sélectionné',
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
    },
    de: { // German translations (partial update)
        monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
        monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
        weekdaysShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        weekdaysMini: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        noDaySelected: 'Wähle einen Tag',
        today: 'Heute',
        publicHoliday: 'Gesetzlicher Feiertag',
        bankHoliday: 'Bankfeiertag',
        optionalHoliday: 'Optionaler Feiertag',
        holidayType: 'Feiertag ({type})',
        scope: 'Geltungsbereich',
        national: 'National',
        regional: 'Regional',
        observedSince: 'Beobachtet seit',
        noInfo: 'Keine Details verfügbar',
        searchLink: 'Online suchen',
        errorLoadingHolidays: 'Fehler beim Laden der Feiertage für {countryName}. Bitte Verbindung prüfen oder erneut versuchen.',
        errorLoadingUpcoming: 'Fehler beim Laden der nächsten Feiertage für {countryName}. Bitte Verbindung prüfen oder erneut versuchen.',
        upcomingTitle: 'Nächste Feiertage ({countryName})',
        noUpcomingHolidaysCountry: 'Keine bevorstehenden Feiertage für {countryName} gefunden.',
        retry: 'Wiederholen',
        jumpTo: 'Springe zu:',
        selectCountry: 'Land:',
        selectLang: 'Sprache:',
        selectYear: 'Jahr wählen',
        selectMonth: 'Monat wählen',
        selectView: 'Ansicht',
        selectTheme: 'Thema',
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
        weekLabel: 'Woche {weekNum}',
        selected: 'Ausgewählt',
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
    }
};

// --- Holiday Name Translations ---
// Add more known fixed-date and variable holiday keys/names as needed
// Structure: 'KEY': { en: 'English Name', fr: 'French Name', de: 'German Name' }
const holidayNameTranslations = {
    '01-01': { en: 'New Year\'s Day', fr: 'Jour de l\'an', de: 'Neujahrstag' },
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
    '10-03': { en: 'German Unity Day', fr: 'Jour de l\'Unité Allemande', de: 'Tag der Deutschen Einheit' }, // DE
    '10-26': { en: 'National Day', fr: 'Fête Nationale', de: 'Nationalfeiertag' }, // AT
    '11-01': { en: 'All Saints\' Day', fr: 'Toussaint', de: 'Allerheiligen' },
    '11-11': { en: 'Armistice Day', fr: 'Armistice 1918', de: 'Waffenstillstandstag' }, // Primarily FR/BE
    '12-25': { en: 'Christmas Day', fr: 'Noël', de: 'Erster Weihnachtstag' },
    '12-26': { en: 'St Stephen\'s Day / Boxing Day', fr: 'Lendemain de Noël (St Étienne)', de: 'Zweiter Weihnachtstag' }
    // Add more fixed dates: 01-06 (Epiphany), 12-08 (Immaculate Conception), etc.
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
    let translation = i18n[state.currentLang]?.[key] || i18n['en']?.[key] || key;
    for (const placeholder in replacements) {
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
