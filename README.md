# Interactive Calendar Application

## Description

This is a feature-rich interactive calendar web application built with vanilla JavaScript, HTML, and CSS. It allows users to view dates, navigate between months, weeks, and years, display public holidays for various countries, search for holidays, and customize the view with different themes and languages.

## Features

* **Multiple Calendar Views:** Switch between Month, Week, and Year views.
* **Holiday Data:** Fetches and displays public holidays using the Nager.Date API.
    * Shows holiday names, types (Public, Bank, Optional etc.), scope (National/Regional), and launch year (if available).
    * Provides an "Upcoming Holidays" list for the selected country.
    * Includes links to search for holiday details online.
* **Navigation:**
    * Navigate by month, week (depending on view), and year.
    * Directly jump to a specific date.
    * Quick "Today" button.
* **Customization:**
    * Select the country for holiday display from over 100 options.
    * Choose the interface language (English, French, German supported).
    * Switch between Light and Dark themes.
* **Search:** Find holidays within the currently displayed year by name.
* **Accessibility:**
    * Keyboard navigation support for the calendar grid.
    * ARIA attributes for improved screen reader compatibility.
    * Focus indicators for interactive elements.
    * Consideration for color contrast (WCAG AA target).
* **Performance:**
    * API Caching: Utilizes both in-memory and `localStorage` caching (with expiry) to minimize API calls.
    * Optimized Rendering: Updates date selection without full grid re-renders. Uses `DocumentFragment` for efficient list/grid generation.
* **Responsive Design:** Adapts layout for different screen sizes (desktop, tablet, mobile).
* **Print Functionality:** Basic print styles included to print the Month view reasonably.
* **Modular Code:** JavaScript code is organized into ES modules for better maintainability.
* **Modern Date Handling:** Uses the `date-fns` library for reliable date operations.

## Technologies Used

* **HTML5:** Structure of the application.
* **CSS3:** Styling, layout (Grid), themes, responsiveness, print styles.
    * CSS Variables for theming and consistency.
* **JavaScript (ES6+ Modules):** Application logic, DOM manipulation, API interaction, event handling.
* **date-fns:** JavaScript date utility library (loaded via CDN).
* **Nager.Date API:** External API for fetching public holiday data ([https://date.nager.at/Api](https://date.nager.at/Api)).

## Setup & Installation

1.  **Download Files:** Place all the generated files (`index.html`, `style.css`, and the `js/` folder containing all `.js` modules) in a single project directory.
2.  **Run a Local Server:** Because the project uses JavaScript ES Modules, you cannot simply open `index.html` directly in the browser using the `file:///` protocol. You need to serve the files using a local web server.
    * **Using Node.js/npm:** If you have Node.js installed, you can use simple packages like `http-server`:
        ```bash
        # Install globally (if you haven't already)
        npm install -g http-server

        # Navigate to your project directory in the terminal
        cd /path/to/your/calendar-project

        # Start the server
        http-server
        ```
        Then open your browser and go to the URL provided (usually `http://localhost:8080`).
    * **Using Python:** If you have Python installed:
        ```bash
        # Navigate to your project directory in the terminal
        cd /path/to/your/calendar-project

        # For Python 3
        python -m http.server

        # For Python 2
        python -m SimpleHTTPServer
        ```
        Then open your browser and go to `http://localhost:8000`.
    * **Using VS Code Live Server:** If using Visual Studio Code, you can install the "Live Server" extension and click "Go Live" from the status bar.

## Usage

* **Navigate:** Use the arrow buttons (<<, <, >, >>) or the Month/Year selectors to change the displayed period. The behavior of arrows changes based on the selected View (Month, Week, Year).
* **Select Date:** Click on a day in the calendar grid to select it and view details in the left sidebar.
* **Jump to Date:** Use the "Jump to:" date input to go directly to a specific date.
* **Change Country/Language/Theme/View:** Use the respective dropdown selectors in the header. Settings (except date jump) are saved locally.
* **Search Holidays:** Type a holiday name in the search box and press Enter or click the search icon. Results for the current year will appear below the header. Click a result to jump to its date (in Month view).
* **Keyboard Navigation:** Use Tab to move between controls. Use Arrow keys to navigate within the calendar grid when a date cell has focus. Press Enter or Space to select the focused date.

## File Structure

* `.`
    * `index.html`        # Main HTML structure
    * `style.css`         # CSS styles
    * `js/`               # JavaScript modules folder
        * `api.js`        # API interaction logic (fetching holidays)
        * `calendarGrid.js` # Logic for rendering calendar grids (month, week, year)
        * `config.js`     # Configuration constants, CSS classes, DOM elements mapping
        * `i18n.js`       # Internationalization strings and translation functions
        * `main.js`       # Main application entry point, event handlers, initialization
        * `sidebar.js`    # Logic for updating the sidebars (day info, upcoming)
        * `state.js`      # Centralized application state management
        * `ui.js`         # UI update functions (selectors, text, theme, errors, loading)
        * `utils.js`      # Utility functions (date formatting, debounce, etc.)


## API Used

This project relies on the free **Nager.Date API** to fetch public holiday information for various countries.

* **Website:** [https://date.nager.at/Api](https://date.nager.at/Api)
* No API key is required for basic usage as implemented here.

## Potential Future Improvements

* Add event creation/display capabilities.
* Integrate different holiday types more distinctively (e.g., religious, local observances).
* More sophisticated year/week view layouts.
* Implement multi-year search.
* Add build process (e.g., using Vite, Webpack) for bundling and optimization.
* Refactor CSS potentially using SASS/SCSS.
* Add unit/integration tests.
* Use a more robust i18n library (like i18next) for complex translation needs.

## License

(Optional: Add license information here, e.g., MIT License)
