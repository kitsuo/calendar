# Interactive Holiday Calendar

An interactive web-based calendar application that displays public holidays for various countries, featuring multiple views, customization options, and holiday details.

## Description

This application allows users to browse public holidays across different countries and years. It provides month, week, and year views, along with detailed information about selected dates and upcoming holidays. The calendar supports multiple languages, themes, and configurable week start days. Holiday data is fetched from the Nager.Date API and cached for performance.

## Features

*   **Multiple Calendar Views:**
    *   **Month View:** Classic monthly grid layout with week numbers.
    *   **Week View:** Detailed 7-day layout with subtle time-slot hints.
    *   **Year View:** Overview of the entire year with mini-calendars for each month (lazy-loaded using IntersectionObserver).
*   **Holiday Data:**
    *   Displays public, bank, and optional holidays fetched from the Nager.Date API.
    *   Shows holiday name, type, scope (national/regional), and observed year (if available).
    *   Displays list of applicable regions/counties for regional holidays.
    *   Upcoming holidays list in the sidebar.
*   **Internationalization (i18n):**
    *   Supports multiple languages (English, French, German implemented).
    *   UI elements, dates, and known holiday names are translated.
*   **Customization:**
    *   **Country Selection:** Dynamically loaded list of available countries.
    *   **Theme:** Light and Dark themes available.
    *   **Week Start:** User can configure the week to start on Sunday or Monday.
*   **Interactivity:**
    *   Click or use keyboard navigation (arrows, Enter/Space) to select dates.
    *   Navigate between periods (month/week/year) using previous/next buttons.
    *   Jump directly to a specific date using the date picker.
    *   "Today" button jumps to the current date in Month view.
    *   Clicking a month header in Year view switches to Month view for that month.
*   **Search:**
    *   Search for holidays by name within the current year and +/- configurable range (default 1 year).
    *   Highlights search results on the calendar grid.
    *   Search results panel lists matching holidays.
*   **Sidebar:**
    *   Displays detailed information for the selected date, including holiday details and external search link.
    *   Shows a list of upcoming holidays for the selected country.
*   **Performance:**
    *   In-memory and localStorage caching for holiday data and country lists to minimize API calls.
    *   Lazy loading of mini-calendars in Year view using IntersectionObserver.
*   **Accessibility:**
    *   Semantic HTML structure.
    *   ARIA attributes for grid roles, labels, and states.
    *   Keyboard navigation support for grid cells and year view month headers.
    *   Focus management.
    *   (Conceptual) Color contrast audit points added.
*   **Print Styles:**
    *   Optimized print layout for Month view.
    *   Basic print layouts for Week and Year views.
    *   Includes context (Country, Period) in the print header.

## Demo / Screenshot

*(Placeholder: Add a link to a live demo or insert screenshots/GIFs here)*

## Technologies Used

*   **Frontend:** HTML5, CSS3, JavaScript (ES Modules)
*   **Libraries:**
    *   [date-fns](https://date-fns.org/): For robust date manipulation and formatting.
*   **API:** [Nager.Date API](https://date.nager.at/): Source for public holiday data.
*   **Icons:** Font Awesome

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```
2.  **Install Dependencies:** This project uses `date-fns`. It's assumed a build process (like Webpack, Rollup, Parcel, etc.) is used to bundle modules. If running without a build step, you would need to revert to using the CDN version of `date-fns` included in the HTML.
    ```bash
    # Example using npm (if you set up a package.json)
    npm install
    # Or yarn install
    ```
3.  **Build Step (Conceptual):** Run your build process if you have one configured.
    ```bash
    # Example using npm (if configured in package.json)
    npm run build
    ```
4.  **Run Locally:** Open the `index.html` file in your browser. A local web server is recommended for handling ES Modules correctly. You can use extensions like "Live Server" for VS Code or run a simple server:
    ```bash
    # Example using Python's built-in server (from the project root)
    python -m http.server
    # Or using Node.js 'serve' package
    # npm install -g serve
    # serve .
    ```
    Then navigate to `http://localhost:<port>` (e.g., `http://localhost:8000`).

## Configuration

Key configuration options can be found and modified in `js/config.js`:

*   `API_BASE_URL`: Base URL for the Nager.Date API.
*   `DEFAULT_COUNTRY`, `DEFAULT_LANG`, `DEFAULT_THEME`, `DEFAULT_VIEW`, `DEFAULT_WEEK_START`: Default settings on first load.
*   `CACHE_EXPIRY_MS`, `COUNTRY_CACHE_EXPIRY_MS`: Cache durations.
*   `MAX_REGIONAL_DISPLAY`: Max number of regions shown in the sidebar before truncating.
*   `SEARCH_YEAR_RANGE`: Number of years +/- the current year to include in holiday search.

## API Source

This project relies on the free [Nager.Date Public Holiday API](https://date.nager.at/) for retrieving holiday information. Please respect their terms of use.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
*(Optional: Add more specific contribution guidelines)*

## License

*(Optional: Specify the license for your project, e.g., MIT License)*