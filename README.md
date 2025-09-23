
# Amatya - A Privacy-First Finance Manager

Amatya is a modern, 100% private, browser-based personal finance manager. It's designed for individuals who want to track their finances without compromising on data privacy. All of your financial data is stored exclusively in your browser's local storage, meaning it never leaves your computer.

This repository is public to allow for full transparency. You are encouraged to inspect the code to verify its privacy-first claims.

## Core Philosophy: Your Data is Your Own

In an age where personal data is a commodity, Amatya takes a firm stance on privacy.

- The app is a single-page application that runs entirely in your browser. There is no backend server, no database, and no user accounts.
- No Tracking or Analytics: The application does not include any third-party tracking or analytics scripts. Your financial habits remain completely private.
- Local Storage Only: All data is saved directly in your browser's localStorage. This means if you switch browsers or computers, your data will not be there unless you manually export and import it.
## Features

Amatya comes packed with features to give you a complete overview of your finances:

- Privacy-Focused: The core feature. Your data never leaves your device.

- Interactive Dashboard: Get an at-a-glance view of your total balance, monthly income/expenses, and recent transactions.

- Detailed Transaction Tracking: Manually add expenses, income, and self-transfers between your accounts.

- Powerful Import Engine:

   - Import transactions from CSV and Excel files.

   - An interactive, one-time setup allows you to map your bank's specific file format.

   - Save mapping "profiles" for each account to make future imports quick and easy.

- Advanced Analytics: A dedicated page with charts and dynamic filters to analyze your spending trends over time.

- Budget Projections: Plan future monthly budgets and track your progress.

- Account & Category Management: Create and manage your bank accounts, credit cards, and spending categories with custom colors and icons.

- Data Portability: Easily export your entire database to a JSON file for backup or migration, and import it back whenever needed.

- Responsive Design: Works seamlessly on both desktop and mobile devices.

- PWA Ready: Can be "installed" on your desktop or mobile home screen for an app-like experience.
## Tech Stack

This project is built with a focus on simplicity and transparency, using modern, client-side technologies.

**HTML5 & CSS3**

**Tailwind CSS** (via CDN for styling)

**Vanilla JavaScript** (ES6 Modules)

**Chart.js** for interactive charts

**PapaParse** for robust in-browser CSV parsing

**SheetJS** (xlsx.js) for in-browser Excel file reading
## Getting Started: How to Run Locally

Because this application uses modern JavaScript modules, you cannot run it by simply opening the index.html file in your browser. It must be served by a local web server to comply with browser security policies (CORS).

The easiest way to do this is with Python's built-in server.

**Step 1:** Clone the Repository

```bash
git clone https://github.com/shrikul1989/amatya.git
```

**Step 2:** Start a Local Server
Open your terminal or command prompt in the project's root directory (where index.html is located) and run one of the following commands:

Python 3 (most common):

```bash
python -m http.server
```

You will see a message like Serving HTTP on 0.0.0.0 port 8000...

**Step 3:** Open the App
Open your web browser and navigate to:
http://localhost:8000

The application should now be running locally on your machine!
## Contributing

Contributions are always welcome!

## Contributing

Contributions are welcome! If you have ideas for new features, find a bug, or want to improve the code, please feel free to open an issue or submit a pull request.


## License

This project is open source and available under the [MIT](https://choosealicense.com/licenses/mit/) License.
