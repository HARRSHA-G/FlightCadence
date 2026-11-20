# ✈️ FlightCadence

> **A Modern Django-Based Flight Planning & Operations System for Private, Charter, and Small Fleet Operators.**

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0%2B-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active%20Development-orange)]()

---

## 📌 Overview

**FlightCadence** is a centralized flight dispatch and fleet operations platform designed specifically for private charter airlines, non-scheduled operators (NSOP), and corporate flight departments. It streamlines aerodrome database maintenance, aircraft capability profiles, crew qualifications, and ICAO-standard Flight Plan (FPL) generation.

---

## ✨ Key Features

### 🏢 1. Aerodrome & Airport Management
- Directory of domestic and international aerodromes.
- Tracks **ICAO codes, FIR jurisdictions, runway elevations, transition altitudes**, and **AFTN telecommunication addresses**.
- Searchable and filterable data tables with modal-based entry and updates.

### ✈️ 2. Aircraft & Fleet Registry
- Full fleet equipment tracking tailored to ICAO Annex 2 standards.
- Detailed specifications: **Registration marks (VT-xxx), Aircraft Type (e.g., A320, B738, C56X), Wake Turbulence Categories (L/M/H/J)**.
- Navigation & Avionics Capabilities: **RCN, Surveillance Transponder Capabilities (Mode S / ADS-B Out), PBN/RNP codes, NAV equipment, GPS**, and **SELCAL codes**.

### 👨‍✈️ 3. Pilot & Crew Management
- Centralized crew roster capturing **License credentials (ATPL / CPL)**, **Rank / Duty designation (Commander / PIC, First Officer)**, and **Base Station assignments**.
- Fully sanitized and privacy-compliant crew directory.

### 🛫 4. Call Signs Directory
- Operator call sign generation and registration mapping for flight dispatch communications.

### 📋 5. Online ICAO Flight Plan (FPL) Engine
- Interactive flight plan builder compliant with standard ICAO 2012 format.
- Real-time route compilation, flight rules selection, altitude/speed specifications, and endurance calculation.
- **Automated Client-Side PDF Generation**: One-click generation and instant download of official dispatch flight briefing sheets.

### 🔒 6. Phase 2 Locked Modules (Under Active Development)
- **NOTAMs Analysis**: Notice to Air Missions daily briefing parser and drive integration.
- **Route Planning**: Optimal airway routing and wind aloft calculations.
- **Aviation Weather**: METAR, TAF, and SIGMET weather charts.
- **Nav Log**: Automated waypoint computation and fuel burn burn-rate analysis.
- **PDF Operations**: Integrated PDF annotation and merge utilities for flight packets.

---

## 🛠️ Architecture & Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | Python 3, Django 5.x | High-performance MTV architecture with ORM models |
| **Database** | SQLite (Default) / PostgreSQL | Relational storage for fleet, aerodrome, and dispatch records |
| **Frontend** | Django Templates, HTML5, CSS3, ES6 JavaScript | Responsive aviation cockpit UI with light/dark theme |
| **Icons & Design** | Lucide Aviation Icons | Clear flight indicators, lock badges, and status pills |
| **PDF Processing** | HTML2PDF, PDF-Lib | Client-side briefing rendering and export |

---

## 📁 Project Structure

```text
FlightCadence-miniProject/
├── README.md
├── .gitignore
└── FLIGHT_CADENCE_DJANGO/
    ├── manage.py
    ├── db.sqlite3
    ├── flightcadence/         # Django project settings & URL routing
    │   ├── settings.py
    │   ├── urls.py
    │   └── wsgi.py
    ├── core/                  # Main application module
    │   ├── models.py          # Aircraft, Airport, Pilot, CallSign, OnlineFpl
    │   ├── views.py           # Application views & controllers
    │   ├── api_views.py       # REST API endpoints
    │   ├── admin.py           # Django admin dashboard setup
    │   └── urls.py            # Core routing
    ├── templates/             # HTML Templates
    │   ├── app_base.html      # Flight operations cockpit layout
    │   ├── public_base.html   # Public portal layout
    │   ├── app/               # Authenticated operational pages
    │   ├── auth/              # Login & registration forms
    │   └── public/            # Landing, About, Contact, Pricing
    └── static/                # Static assets (CSS, JS, Vendor packages)
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **pip** package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/HARRSHA-G/FlightCadence.git
   cd FlightCadence/FLIGHT_CADENCE_DJANGO
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate    # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install django
   ```

4. **Apply database migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

6. **Open in browser:**
   Navigate to `http://127.0.0.1:8000/`

---

## 🔑 Demo Access Credentials

| Role | Username | Password | Redirect Landing |
| :--- | :--- | :--- | :--- |
| **User (Flight Dispatch / Pilot)** | `user` | `user` | `/online-fpl` |
| **Administrator** | `admin` | `admin` | `/dashboard` |

---

## 🛡️ Privacy & Compliance
All contact information, personal addresses, and phone numbers in demonstration records have been sanitized (e.g. `+91 ##### #####` and local domain emails) in compliance with data safety standards.

---

## 👨‍💻 Author & Contributions
- **Author**: Harsha Vardhan ([@HARRSHA-G](https://github.com/HARRSHA-G))
- Developed as a Mini Project for Modern Aviation Flight Planning & Operations.
