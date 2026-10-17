# EcoAI – AI-Powered Environmental Sustainability Assistant

> **A Pure Frontend-Only Academic Web Application aligned with United Nations Sustainable Development Goal 13: Climate Action**  
> Developed for Bachelor of Computer Applications (BCA) Final Year Project Demonstration & Evaluation.

---

## 1. Project Introduction

**EcoAI** is an intelligent, responsive, client-side environmental sustainability dashboard designed to help students, campus communities, and citizens adopt sustainable lifestyles. Built with modern web standards and powered by the **Google Gemini API (`gemini-3.8-flash`)**, EcoAI combines artificial intelligence with deterministic environmental models to educate users on climate science, waste segregation, energy conservation, and personal carbon footprint management.

The project is architected with strict frontend-only constraints: **zero Node.js backend servers, zero SQL/NoSQL databases, and zero external authentication services**. All habit tracking, chat logs, and preferences are securely managed using browser **LocalStorage**.

---

## 2. Project Objectives

1. **Promote UN SDG 13 (Climate Action):** Democratize access to verified climate science and actionable conservation habits for college students.
2. **Deterministic Carbon Auditing:** Provide transparent, reproducible carbon footprint calculations in client-side JavaScript using recognized emission coefficients (IPCC, CEA, IEA).
3. **AI-Driven Sustainability Guidance:** Leverage Google Gemini reasoning to create tailored 30-day green action plans and municipal waste segregation guides.
4. **Bilingual Accessibility:** Deliver environmental assistance in both **English and Hindi** to ensure accessibility across student demographics.
5. **Academic Excellence & Simplicity:** Offer a clean, modular, and easily explainable code structure suitable for BCA project evaluations and viva voce examinations.

---

## 3. UN SDG 13 Alignment (Climate Action)

The United Nations Sustainable Development Goal 13 calls for urgent action to combat climate change and its impacts. EcoAI directly maps to the following official SDG targets:

* **Target 13.3 (Improve education, awareness-raising, and human capacity on climate change mitigation, adaptation, and early warning):** Achieved through the SDG 13 Learning Center and bilingual AI Assistant.
* **Target 12.5 (Substantially reduce waste generation through prevention, reduction, recycling, and reuse):** Addressed by the AI Waste Management Assistant and the Dual-Bin Challenge.
* **Target 7.3 (Double the global rate of improvement in energy efficiency):** Supported by the Carbon Footprint Calculator's household kWh analysis and phantom power challenges.

---

## 4. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Markup** | HTML5 (Semantic) | Accessible document structure, forms, and dialog modals |
| **Styling** | CSS3 & Responsive Design | Custom environmental green theme (`#16A34A`, `#14532D`, `#DCFCE7`), Flexbox, CSS Grid |
| **Scripting** | JavaScript (ES6+ Modules) | Deterministic math, state management, DOM manipulation, async fetch |
| **Artificial Intelligence** | Google Gemini API (`gemini-3.8-flash`) | Natural language understanding, habit synthesis, waste analysis |
| **Data Visualization** | Chart.js 4.4 | Interactive doughnut charts for monthly emission breakdown |
| **Iconography** | Lucide Icons | Crisp vector iconography for UI cards, navigation, and badges |
| **Persistence** | Web Storage API (LocalStorage) | Client-side persistence for API key, challenges, and chat history |
| **Bundler / Server** | Vite 8.3 / Static HTTP Server | Fast local preview, zero-config static file serving |

---

## 5. Project Folder Structure

```text
EcoAI/
|
|-- index.html                 # Main single-page application entry point
|
|-- css/
|   |-- style.css              # Core typography, color system, buttons, cards, modals
|   |-- responsive.css         # Breakpoint rules for mobile, tablet, desktop, and print
|
|-- js/
|   |-- app.js                 # Main application controller, UI event orchestration
|   |-- gemini.js              # Official Google Gemini API client (v1beta REST)
|   |-- calculator.js          # Deterministic IPCC carbon math & Chart.js rendering
|   |-- challenges.js          # Gamified habit checklist & level progress logic
|   |-- storage.js             # LocalStorage abstraction layer for persistence
|
|-- assets/
|   |-- logo.svg               # Modern environmental tech SVG logo (leaf + circuit)
|
|-- metadata.json              # AI Studio project configuration and capabilities
|-- package.json               # Development server dependencies (Vite)
|-- vite.config.ts             # Vite configuration with GEMINI_API_KEY definition
|-- README.md                  # Comprehensive academic project documentation
```

---

## 6. Google Gemini API Setup Instructions

EcoAI uses the official Google Gemini API via the modern `v1beta` REST endpoint:
`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={API_KEY}`

### How to Obtain a Free API Key:
1. Visit **Google AI Studio**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account.
3. Click **"Create API Key"** and copy the generated key.

### Configuring the Key in EcoAI:
1. Open the EcoAI website in your browser.
2. Click the **"API Key"** button located in the top navigation bar.
3. Paste your Gemini API key into the input field.
4. Click **"Test Connection"** to verify communication with Google servers.
5. Click **"Save & Apply"**. The key is stored locally in your browser's `localStorage` under `ecoai_gemini_api_key`.

---

## 7. How to Run the Project Locally

You can run EcoAI locally using any static web server or the bundled Vite environment.

### Option A: Using Vite (Recommended for Development)
```bash
# 1. Install dependencies
npm install

# 2. Start the local development server (runs on port 3000)
npm run dev

# 3. Open in your browser:
# http://localhost:3000
```

### Option B: Using Python Simple HTTP Server
Because EcoAI is built purely with standard HTML5, CSS3, and ES6 JavaScript modules, you can serve it with Python:
```bash
# In the project root directory:
python3 -m http.server 8000

# Open in your browser:
# http://localhost:8000
```

### Option C: VS Code Live Server Extension
1. Open the project folder in Visual Studio Code.
2. Install the **Live Server** extension by Ritwick Dey.
3. Right-click `index.html` and select **"Open with Live Server"**.

---

## 8. Feature Descriptions

### Feature 1: Home Dashboard & Hero Section
* Welcoming hero landing page with SDG 13 Climate Action badge and Paris Agreement 1.5°C benchmark.
* Quick action buttons routing directly to AI Assistant, Carbon Calculator, and Green Challenges.
* Feature overview cards summarizing all six core modules.

### Feature 2: AI Environmental Assistant
* Interactive climate chatbot with bilingual toggle (**English / Hindi**).
* Quick-click suggested prompt chips for instant exploration.
* Chat history stored in `localStorage` with a "Clear Chat" option.
* Live typing indicator and robust error handling for missing keys, quota limits, or network timeouts.

### Feature 3: AI Sustainability Planner
* Comprehensive habit audit form: commute mode, daily distance, electricity habits, water habits, plastic usage, and dietary patterns.
* Gemini AI analyzes lifestyle patterns and outputs a structured 7-part sustainability blueprint:
  * Lifestyle Impact Summary
  * Top 3 Priority Improvements
  * Daily Sustainable Micro-Actions
  * Weekly Conservation Routines
  * Monthly Sustainability Milestones
  * Practical Campus & Student Tips
  * Estimated Environmental Benefit & Qualitative Difficulty
* "Print Plan" capability for offline study or project portfolio documentation.

### Feature 4: Carbon Footprint Calculator
* Deterministic numerical carbon calculations performed directly in JavaScript.
* **Documented Emission Factors:**
  * Grid Electricity: `0.71 kg CO₂e / kWh` (Central Electricity Authority Baseline Database)
  * Public Bus: `0.065 kg CO₂e / passenger-km` (IPCC Guidelines)
  * Metro Rail: `0.035 kg CO₂e / passenger-km`
  * Two-Wheeler (Petrol): `0.046 kg CO₂e / km`
  * Personal Car (Petrol): `0.165 kg CO₂e / km`
  * LPG Cooking Gas: `42.5 kg CO₂e / 14.2 kg cylinder`
* Outputs daily kg, monthly kg, and annual tonnes of CO₂ equivalent.
* Visual doughnut chart rendered with Chart.js showing category percentages.
* Benchmark comparison bars against the India national average (1.90 t) and the global average (4.70 t).

### Feature 5: Waste Management Assistant
* Quick category chips (Plastic, Paper, E-Waste, Batteries, Glass, Metal, Organic, Mixed).
* Free-text search for specific items (e.g., "blister packs", "pizza box", "lithium cell").
* Gemini AI provides the recycling code, bin color (Blue/Green/Red), preparation steps (rinsing, removing tape), and safety warnings.

### Feature 6: Green Challenges
* Gamified checklist of 9 environmental micro-habits.
* Dynamic Level progression: **🌱 Eco Novice → 🍃 Green Explorer → 🌿 Sustainability Advocate → 🏆 Climate Champion**.
* Daily Spotlight Challenge that updates deterministically.
* Progress bar and reset functionality backed by `localStorage`.

### Feature 7: SDG 13 Learning Center
* Educational cards explaining UN SDG 13 targets, global warming vs. climate change, greenhouse gas mechanics (CO₂, CH₄, N₂O), and student campus checklists.
* Direct resource links to official United Nations, IPCC, and UNEP portals.

### Feature 8: About Project (Academic Report)
* Structured academic BCA project report format.
* Contains Problem Statement, Proposed Solution, Objectives, Limitations, and Future Scope.
* Editable student name, roll number, college name, and faculty guide placeholders.

---

## 9. LocalStorage Implementation Details

EcoAI stores user data strictly within the user's browser:
* `ecoai_gemini_api_key`: Stores the user's Google AI Studio API key.
* `ecoai_chat_history`: Array of conversation messages (retains up to 50 turns).
* `ecoai_challenges_data`: Checklist state of completed habits and last update timestamp.
* `ecoai_carbon_history`: Saved carbon calculation snapshots.
* `ecoai_saved_plan`: Cached AI sustainability plan.
* `ecoai_language_pref`: User's preferred language (`'en'` or `'hi'`).

Users can clear all local storage at any time via the "Clear Local Data" footer link.

---

## 10. Known Limitations

1. **Frontend API Key Visibility:** In any client-only static website without a server proxy, API requests originate from the browser. Anyone opening DevTools (Network tab) can view the API key in the outgoing request URL/headers.
2. **Approximate Educational Models:** Carbon footprint numbers are educational approximations based on standard averages. They do not replace formal ISO 14064 corporate audits.
3. **No Cross-Device Sync:** Because no external database is used, progress made on one device or browser does not sync to another.

---

## 11. API Key Security Warning

> ⚠️ **CRITICAL SECURITY DISCLOSURE FOR ACADEMIC TESTING:**  
> - **NEVER** hardcode or commit a real Google Gemini API key to a public GitHub repository.  
> - Use the in-app API Key modal during your college viva or local evaluation.  
> - For production commercial deployment, an Express, Next.js, or Cloud Run backend proxy must be added to keep API credentials secure on the server.

---

## 12. Future Enhancements

* **Multimodal Vision:** Allow students to photograph waste items or electric meters using their smartphone camera and analyze them with Gemini multimodal models.
* **Campus Inter-College Leaderboard:** Introduce multi-college competitive green challenges.
* **IoT Telemetry:** Connect smart energy monitoring plugs (ESP32 / Zigbee) to log real-time power consumption.

---

## 13. Academic Demonstration & Viva Voce Guide

When demonstrating this project to internal or external examiners:
1. **Explain the Architecture:** State that the application follows a pure static frontend architecture (HTML5, CSS3, ES6 JavaScript) communicating directly with Google Gemini `gemini-3.8-flash` via the official `v1beta` REST API.
2. **Highlight SDG 13 Alignment:** Explain how the project supports UN Climate Action Target 13.3 (education & awareness) and Target 12.5 (waste reduction).
3. **Showcase Deterministic vs. Generative Features:** Clarify that numerical carbon calculations are performed deterministically in JavaScript formulas using IPCC emission factors, while qualitative planning and waste segregation advice are generated via Gemini AI.
4. **Demonstrate Bilingual Chat:** Switch between English and Hindi in the chat assistant to demonstrate natural language support.
5. **Demonstrate Habit Persistence:** Complete challenges in the Green Challenges tab, refresh the page, and show that completion state persists via browser `localStorage`.
