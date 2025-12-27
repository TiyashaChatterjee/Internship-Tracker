# Internship Application Tracker 📊

A web-based dashboard to track internship applications, monitor their status, visualize progress, and manage deadlines — powered by Google Sheets and Google Forms.

This project is designed to help students stay organized during internship season by providing a clean UI, analytics, and easy data entry.

---

## 🚀 Features

- Dashboard with application statistics
  - Total applications
  - Applied, Interview, Selected, Rejected counts
- Interactive charts
  - Status distribution (Doughnut chart)
  - Monthly application timeline (Bar chart)
- Application management
  - Search by company or role
  - Filter by status
  - Sort by date, company, or deadline
- Recent applications overview
- Detailed modal view for each application
- Google Forms integration for easy data entry
- Google Sheets as backend storage
- Responsive design (works on mobile & desktop)

---

## 🛠️ Tech Stack

- **HTML** – Structure
- **CSS** – Styling & responsive layout
- **JavaScript (Vanilla)** – Logic & interactivity
- **Chart.js** – Data visualization
- **Google Sheets** – Backend data storage
- **Google Forms** – Data input

---

## ⚙️ How It Works

1. Applications are added using a **Google Form**
2. Responses are stored in **Google Sheets**
3. The sheet is published as a **CSV**
4. JavaScript fetches the CSV and renders:
   - Dashboard stats
   - Charts
   - Application cards

Local entries (via UI form) are temporary and reset on refresh.

---

## ▶️ How to Run Locally

1. Clone the repository or download ZIP
2. Open `index.html` in any modern browser
3. Make sure:
   - Google Sheet is **published**
   - CSV URL is correctly set in `script.js`

```js
SHEET_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmuK5Rd_wTUWDBmic7pVlSTBZGsnk2CISYsAWyKIc35g6EwIn0tIiYO4BWQqB8vKgThojWI8avxwyO/pub?output=csv'
