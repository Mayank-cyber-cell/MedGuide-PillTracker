# 💊 MedGuide - Intelligent Medication Tracker 

<div align="center">

[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat&logo=express)](https://expressjs.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat)]()

**🚀 An intelligent, accessible medication tracking solution**

[🌐 Live Demo](https://med-guide-pill-track.vercel.app/) 

</div>

---

## 🎬 Animated Program Flow

### User Journey Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  📱 APPLICATION STARTUP                                                     │
│      ↓                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ App initializes Vite + React                                         │  │
│  │ Loads Tailwind CSS & Framer Motion                                   │  │
│  │ Initializes Supabase & JWT Authentication                           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│      ↓                                                                       │
│  ⚡ CHECK USER SESSION                                                      │
│  /  \                                                                        │
│ /    \                                                                       │
│No    Yes → Redirect to Dashboard                                           │
│↓                                                                             │
│┌──────────────────────────────────────────────────────────────────────────┐ │
││ 🔑 AUTHENTICATION FLOW                                                   │ │
│├──────────────────────────────────────────────────────────────────────────┤ │
││                                                                          │ │
││  USER LANDS ON LOGIN PAGE                                              │ │
││          ↓                                                             │ │
││  ┌──────────────────┐      ┌──────────────────┐                       │ │
││  │ Login Option     │      │ Register Option  │                       │ │
││  └────────┬─────────┘      └────────┬─────────┘                       │ │
││           ↓                         ↓                                  │ │
││  ┌────────────────────┐  ┌────────────────────┐                       │ │
││  │ Enter Credentials  │  │ Create New Account │                       │ │
││  │ • Email            │  │ • Email            │                       │ │
││  │ • Password         │  │ • Password         │                       │ │
││  │                    │  │ • Confirm Password │                       │ │
││  └────────┬───────────┘  └────────┬───────────┘                       │ │
││           ↓                         ↓                                  │ │
││  Send to Backend ──────────► JWT Authentication                       │ │
││           ↓                         ↓                                  │ │
││  ✅ Login Success ◄─────────── ✅ Account Created                      │ │
││           ↓                         ↓                                  │ │
│└────────┬──────────────────────────┬─────────────────────────────────────┘ │
│         └──────────────┬───────────┘                                        │
│                        ↓                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🏠 DASHBOARD - MAIN APPLICATION HUB                                 │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                      │  │
│  │  Store JWT Token (localStorage)                                    │  │
│  │  Load User Profile & Preferences                                  │  │
│  │                                                                      │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │ NAVIGATION MENU                                             │  │  │
│  │  ├─────────────────────────────────────────────────────────────┤  │  │
│  │  │ 📊 Dashboard Stats    │ 💊 Medications   │ 🔍 Drug Lookup │  │  │
│  │  │ 🤖 Chatbot          │ ⚙️  Settings     │ 🚪 Logout      │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │ CONTENT AREA (Dynamic Based on Selection)                │   │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ Choose Section ──────────┬──────────────┬─────────────────────┐       │
│  │                           │              │                     │       │
│  ↓                           ↓              ↓                     ↓       │
│  │                                                                       │
│  📊 DASHBOARD ANALYTICS    💊 MEDICATIONS MANAGER  🔍 DRUG LOOKUP       │
│  ├────────────────────────┐ ├──────────────────┐  ├─────────────────┐  │
│  │ View Statistics        │ │ View All Meds    │  │ Search Drugs    │  │
│  │ • Adherence Rate       │ │ • List View      │  │ • By Name       │  │
│  │ • Missed Doses         │ │ • Filter/Sort    │  │ • By Category   │  │
│  │ • Monthly Trends       │ │                  │  │ • AI Analysis   │  │
│  │ • Recharts Graphs      │ │ Add New Meds:    │  │                 │  │
│  │ • Accessibility Mode   │ │ • Name           │  │ Get Details:    │  │
│  │                        │ │ • Dosage         │  │ • Side Effects  │  │
│  └────────────────────────┘ │ • Frequency      │  │ • Interactions  │  │
│                             │ • Reminders      │  │ • Alternatives  │  │
│                             │ • Edit/Delete    │  │ • Gemini AI     │  │
│                             │                  │  │   Analysis      │  │
│                             └──────────────────┘  └─────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ 🤖 CHATBOT ASSISTANT                                          │    │
│  │ ├─────────────────────────────────────────────────────────┐   │    │
│  │ │ • Ask Questions about Medications                      │   │    │
│  │ │ • Get AI-powered Recommendations (Gemini API)          │   │    │
│  │ │ • Medication Interactions Check                        │   │    │
│  │ │ • Emergency Alerts & Notifications                     │   │    │
│  │ │ • Natural Language Processing                          │   │    │
│  │ └─────────────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ⚙️ SETTINGS PANEL                                                     │
│  ├───────────────────────────────────────────────────────────────┐    │
│  │ • Accessibility Settings (Large Text, High Contrast)         │    │
│  │ • Notification Preferences                                   │    │
│  │ • Medication Reminders Configuration                        │    │
│  │ • Profile Management                                        │    │
│  │ • Theme Selection (Light/Dark Mode)                         │    │
│  │ • Export Data                                               │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                             │
│                    (React + TypeScript)                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Components Layer:                                        │  │
│  │  • Login.tsx          • Medications.tsx                   │  │
│  │  • Register.tsx       • Dashboard.tsx                     │  │
│  │  • Chatbot.tsx        • DrugLookup.tsx                    │  │
│  │  • Settings.tsx       • App.tsx (Router)                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          ↓                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Services Layer:                                          │  │
│  │  • api.ts (HTTP Client)                                   │  │
│  │  • Handles Requests/Responses                             │  │
│  │  • JWT Token Management                                   │  │
│  │  • State Management                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          ↓                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Styling & Animation:                                     │  │
│  │  • Tailwind CSS (Utility Classes)                         │  │
│  │  • Framer Motion (Smooth Animations)                      │  │
│  │  • Accessibility Features (WCAG)                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS/REST API
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                               │
│              (Express.js + TypeScript)                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  API Routes (server.ts):                                  │  │
│  │  • POST /auth/register       → User Registration          │  │
│  │  • POST /auth/login          → User Authentication        │  │
│  │  • POST /medications         → Add Medication             │  │
│  │  • GET  /medications/:userId → Fetch User Meds            │  │
│  │  • PUT  /medications/:id     → Update Medication          │  │
│  │  • DELETE /medications/:id   → Delete Medication          │  │
│  │  • GET  /drugs/search        → Search Drugs               │  │
│  │  • POST /chat/analyze        → AI Analysis (Gemini)       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          ↓                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Middleware:                                              │  │
│  │  • JWT Verification & Authentication                      │  │
│  │  • CORS Handling                                          │  │
│  │  • Error Handling & Logging                               │  │
│  │  • Request Validation                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          ↓                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Business Logic:                                          │  │
│  │  • User Authentication (bcryptjs)                         │  │
│  │  • Medication Management                                  │  │
│  │  • AI Integration (Gemini API Calls)                      │  │
│  │  • Data Validation & Processing                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          ↓                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Database Layer:                                          │  │
│  │  • SQLite3 (better-sqlite3)                               │  │
│  │  • Connection Pooling                                     │  │
│  │  • Query Execution                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│                                                                 │
│  🗄️  DATABASE               🤖 AI API      🔐 AUTH              │
│  ├─ SQLite                 ├─ Gemini      ├─ Supabase          │
│  ├─ Tables:                ├─ Models      ├─ JWT               │
│  │  • users                ├─ Endpoints   ├─ Encryption        │
│  │  • medications          └─ Analysis    └─ Session Mgmt      │
│  │  • interactions                                             │
│  └─ Query Results                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Feature Interaction Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    MEDICATION LIFECYCLE                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User clicks "Add Medication"                                           │
│           ↓                                                             │
│  Opens Modal Form                                                       │
│  ├─ Name         ├─ Frequency      ├─ Dosage                           │
│  ├─ Start Date   ├─ Reminders      ├─ Instructions                     │
│           ↓                                                             │
│  Form Validation (Client-side with TypeScript)                         │
│           ↓                                                             │
│  Submit to Backend API                                                 │
│  POST /medications                                                     │
│           ↓                                                             │
│  Backend Processing:                                                   │
│  ├─ JWT Verification                                                  │
│  ├─ Data Validation                                                   │
│  ├─ Database Insert (SQLite)                                          │
│           ↓                                                             │
│  Response Sent to Client                                              │
│           ↓                                                             │
│  ✅ Success:                                                            │
│  ├─ Show Success Toast                                                │
│  ├─ Update Medications List (Framer Motion Animation)                 │
│  ├─ Refresh Dashboard Analytics                                       │
│  ├─ Trigger Notifications Setup                                       │
│           ↓                                                             │
│  Scheduled Reminders & Alerts:                                        │
│  ├─ Notification at Specified Time                                    │
│  ├─ Log Adherence Data                                                │
│  ├─ Track Missed Doses                                                │
│  ├─ Generate Analytics                                                │
│                                                                          │
│  ❌ Failure:                                                             │
│  ├─ Display Error Message                                              │
│  ├─ Suggest Corrections                                                │
│  └─ Preserve Form Data                                                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Authentication & Routing Flow

```
┌──────────────────────────────────────────────────────────┐
│           APPLICATION ROUTING SYSTEM                     │
│         (React Router Integration)                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Public Routes (No Authentication Required)             │
│  ├─ / → Login Page                                      │
│  ├─ /register → Registration Page                       │
│  └─ Redirect to Login if Invalid                        │
│                                                          │
│  Protected Routes (Authentication Required)             │
│  ├─ /dashboard → Main Dashboard                         │
│  ├─ /medications → Medications Manager                  │
│  ├─ /drug-lookup → Drug Search & Analysis               │
│  ├─ /chatbot → AI Chatbot Assistant                     │
│  ├─ /settings → User Settings                           │
│  └─ Redirect to Login if No JWT Token                   │
│                                                          │
│  Guard Logic:                                           │
│  On Route Change:                                       │
│  1️⃣  Check localStorage for JWT token                  │
│  2️⃣  Verify token validity (not expired)               │
│  3️⃣  If valid → Grant access                           │
│  4️⃣  If invalid/missing → Redirect to Login            │
│  5️⃣  Set Authorization header for API calls            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### API Request/Response Cycle

```
┌────────────────────────────────────────────────────────────────┐
│              API INTERACTION FLOW                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  User Action (Click Button, Submit Form)                      │
│           ↓                                                    │
│  Event Handler Triggered in Component                         │
│           ↓                                                    │
│  Call api.ts Function (services/api.ts)                       │
│  Example: getUserMedications(userId)                          │
│           ↓                                                    │
│  Prepare Request:                                             │
│  ├─ Method (GET, POST, PUT, DELETE)                          │
│  ├─ URL: http://localhost:3001/api/endpoint                  │
│  ├─ Headers:                                                  │
│  │  ├─ Content-Type: application/json                        │
│  │  └─ Authorization: Bearer ${JWT_TOKEN}                    │
│  ├─ Body (if needed)                                         │
│  └─ Timeout: 30s                                             │
│           ↓                                                    │
│  Send Request to Backend                                      │
│           ↓                                                    │
│  Backend Processing (Express.js):                            │
│  ├─ Middleware Chain                                         │
│  │  ├─ Auth Middleware: Verify JWT                          │
│  │  ├─ Validation: Check request data                       │
│  │  └─ CORS: Allow cross-origin                             │
│  ├─ Route Handler: Execute business logic                   │
│  ├─ Database Query: Interact with SQLite                    │
│  └─ Generate Response                                       │
│           ↓                                                    │
│  Response Data:                                              │
│  ├─ Status Code: 200, 400, 401, 404, 500, etc              │
│  ├─ Headers: Content-Type, Set-Cookie, etc                  │
│  ├─ Body: JSON data or error message                        │
│           ↓                                                    │
│  Client Receives Response                                    │
│           ↓                                                    │
│  ✅ Success (2xx):                                             │
│  ├─ Parse JSON response                                      │
│  ├─ Update React state/context                               │
│  ├─ Trigger UI re-render                                     │
│  ├─ Show success notification                                │
│  └─ Log action (optional)                                    │
│           ↓                                                    │
│  ❌ Error (4xx, 5xx):                                          │
│  ├─ Extract error message                                    │
│  ├─ 401 Unauthorized → Redirect to Login                     │
│  ├─ 404 Not Found → Show "Not Found" message                 │
│  ├─ 500 Server Error → Show error notification               │
│  └─ Log error for debugging                                  │
│           ↓                                                    │
│  UI Updates & User Feedback                                  │
│           ↓                                                    │
│  Animation & Transitions (Framer Motion)                     │
│  ├─ Fade in new content                                      │
│  ├─ Slide transitions between pages                          │
│  └─ Smooth state changes                                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### AI-Powered Features Flow

```
┌────────────────────────────────────────────────────────────────┐
│          GEMINI AI INTEGRATION FLOW                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  User Initiates AI Feature:                                   │
│  • Ask Chatbot Question                                       │
│  • Drug Lookup with AI Analysis                               │
│  • Medication Interactions Check                              │
│           ↓                                                    │
│  Frontend Prepares Request:                                   │
│  ├─ Collect User Input/Context                               │
│  ├─ Current medications list                                  │
│  ├─ User's health profile                                     │
│  └─ Specific question or drug name                            │
│           ↓                                                    │
│  Send to Backend API:                                         │
│  POST /chat/analyze                                           │
│  {                                                            │
│    "query": "Is ibuprofen safe with my medications?",        │
│    "userId": "user123",                                       │
│    "medications": [...],                                      │
│    "context": {...}                                           │
│  }                                                            │
│           ↓                                                    │
│  Backend Processing:                                          │
│  ├─ Verify user authentication                               │
│  ├─ Fetch user's medication list from SQLite                 │
│  ├─ Build AI prompt with context                             │
│  ├─ Sanitize & validate inputs                               │
│           ↓                                                    │
│  Call Gemini AI API:                                          │
│  ├─ API Key: ${GEMINI_API_KEY}                               │
│  ├─ Model: gemini-pro (or latest)                            │
│  ├─ Prompt: "Analyze interactions between..."                │
│  ├─ Temperature: 0.7 (balanced creativity)                   │
│  └─ Max tokens: 1024                                         │
│           ↓                                                    │
│  Gemini AI Response:                                          │
│  ├─ Generated content with analysis                          │
│  ├─ Risk assessment                                          │
│  ├─ Recommendations                                          │
│  └─ Warnings if applicable                                   │
│           ↓                                                    │
│  Backend Post-Processing:                                    │
│  ├─ Format response for readability                          │
│  ├─ Add citations/references                                 │
│  ├─ Cache result (optional)                                  │
│  ├─ Log AI interaction for analytics                         │
│           ↓                                                    │
│  Return to Frontend:                                          │
│  {                                                            │
│    "status": "success",                                       │
│    "analysis": "Ibuprofen interaction details...",           │
│    "riskLevel": "low",                                        │
│    "recommendations": [...],                                 │
│    "timestamp": 1234567890                                   │
│  }                                                            │
│           ↓                                                    │
│  Frontend Display:                                            │
│  ├─ Show loading indicator while waiting                     │
│  ├─ Format & render AI response                              │
│  ├─ Highlight important sections                             │
│  ├─ Add visual risk indicators                               │
│  ├─ Allow follow-up questions                                │
│           ↓                                                    │
│  Enhanced User Experience:                                   │
│  ├─ Markdown formatted text                                  │
│  ├─ Color-coded warnings (red/yellow/green)                  │
│  ├─ Expandable sections                                      │
│  ├─ Save analysis for future reference                       │
│  └─ Share with healthcare provider (optional)                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Accessibility & Elderly-Friendly Mode

```
┌────────────────────────────────────────────────────────────────┐
│       ACCESSIBILITY FEATURE FLOW                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  User Opens Settings → Accessibility Section                 │
│           ↓                                                    │
│  Available Adjustments:                                       │
│  ├─ 🔤 Font Size Control                                     │
│  │  ├─ Small (12px)                                          │
│  │  ├─ Medium (14px) - Default                               │
│  │  ├─ Large (18px) - Elderly Friendly                       │
│  │  └─ Extra Large (24px)                                    │
│  │                                                            │
│  ├─ 🎨 Theme Selection                                       │
│  │  ├─ Light Mode (default)                                  │
│  │  ├─ Dark Mode (reduced eye strain)                        │
│  │  └─ High Contrast Mode (WCAG AA compliant)               │
│  │                                                            │
│  ├─ 🔊 Audio Cues                                            │
│  │  ├─ Enable/Disable                                        │
│  │  ├─ Volume Control                                        │
│  │  └─ Notification Sounds                                   │
│  │                                                            │
│  ├─ ⏱️  Interaction Speed                                     │
│  │  ├─ Animations: Fast/Normal/Slow                          │
│  │  └─ Transition Delays: Adjustable                         │
│  │                                                            │
│  ├─ 🧠 Cognitive Aids                                        │
│  │  ├─ Simple Mode (Hide advanced features)                  │
│  │  ├─ Step-by-step Guidance                                 │
│  │  └─ Confirmation Dialogs for Important Actions            │
│  │                                                            │
│  └─ ♿ Keyboard Navigation                                    │
│     ├─ Tab through UI elements                              │
│     ├─ Enter to activate buttons                            │
│     ├─ Arrow keys for navigation                            │
│     └─ Screen reader compatible (ARIA labels)               │
│           ↓                                                    │
│  Settings Saved:                                              │
│  ├─ localStorage: User Preferences                            │
│  ├─ Supabase: Profile Sync (if logged in)                    │
│           ↓                                                    │
│  Apply Preferences on Every Page Load:                       │
│  ├─ CSS Variables Updated                                    │
│  ├─ Font Size Applied                                        │
│  ├─ Theme Colors Changed                                     │
│  ├─ Animation Speed Adjusted                                 │
│           ↓                                                    │
│  WCAG Compliance Maintained:                                 │
│  ├─ Semantic HTML Structure                                  │
│  ├─ Proper Heading Hierarchy                                 │
│  ├─ Alt Text for Images                                      │
│  ├─ Form Labels & ARIA Attributes                            │
│  ├─ Color Contrast Ratio: 4.5:1 (AA)                         │
│  └─ Keyboard-Only Navigation Possible                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based user authentication with encrypted passwords
- 💊 **Smart Medication Tracking** - Track multiple medications with AI-powered insights
- 🤖 **Gemini AI Integration** - Get intelligent medication recommendations and risk analysis
- 📱 **Elderly-Friendly Mode** - Large text, high contrast, simplified UI for accessibility
- 👴 **Accessibility First** - WCAG compliant with adjustable display settings
- 📊 **Dashboard Analytics** - Visual insights into medication adherence patterns
- 🚨 **Smart Alerts** - Emergency notifications for missed doses
- 🗄️ **Lightweight Database** - SQLite for fast, reliable data storage
- 🎨 **Modern UI** - Built with Tailwind CSS and Framer Motion animations
- ⚡ **Fast Development** - Hot Module Reloading (HMR) with Vite

---

## � Component & File Structure

```
MedGuide Project Structure:

src/
├── main.tsx              ← Application Entry Point
├── App.tsx              ← Root Router Component
│
├── components/
│   └── Chatbot.tsx      ← AI Chatbot Interface
│
├── pages/
│   ├── Login.tsx        ← Authentication: Login Form
│   ├── Register.tsx     ← Authentication: Registration Form
│   ├── Dashboard.tsx    ← Main Hub (Analytics, Overview)
│   ├── Medications.tsx  ← Medication Manager (CRUD)
│   ├── DrugLookup.tsx   ← Drug Search & Analysis
│   └── Settings.tsx     ← User Preferences & Accessibility
│
├── services/
│   └── api.ts           ← HTTP Client & API Calls
│
├── types.ts             ← TypeScript Interfaces
└── index.css            ← Global Styles (Tailwind)

server.ts                ← Express Backend (Runs on :3001)
api/[...path].ts         ← API Routes Handler
```

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                  App (Root)                             │
│          ├─ React Router Setup                          │
│          └─ JWT Token Provider                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PUBLIC ROUTES:                                         │
│  ├─ Login Page                                          │
│  │  ├─ Email Input Field                               │
│  │  ├─ Password Input Field                            │
│  │  ├─ Login Button                                    │
│  │  ├─ Register Link                                   │
│  │  └─ Error Message Display                           │
│  │                                                      │
│  └─ Register Page                                      │
│     ├─ Email Input Field                               │
│     ├─ Password Input Field                            │
│     ├─ Confirm Password Field                          │
│     ├─ Register Button                                 │
│     └─ Login Link                                      │
│                                                         │
│  PROTECTED ROUTES (Layout):                             │
│  ├─ Navigation Header                                  │
│  │  ├─ Logo                                            │
│  │  ├─ Navigation Links                                │
│  │  ├─ User Profile Dropdown                           │
│  │  └─ Logout Button                                   │
│  │                                                      │
│  ├─ Sidebar/Menu                                       │
│  │  ├─ Dashboard Link                                  │
│  │  ├─ Medications Link                                │
│  │  ├─ Drug Lookup Link                                │
│  │  ├─ Chatbot Link                                    │
│  │  └─ Settings Link                                   │
│  │                                                      │
│  └─ Content Area (Dynamic Page):                        │
│     │                                                   │
│     ├─ Dashboard Page                                  │
│     │  ├─ Statistics Cards                             │
│     │  ├─ Graphs & Charts (Recharts)                   │
│     │  ├─ Adherence Analytics                          │
│     │  └─ Quick Actions                                │
│     │                                                   │
│     ├─ Medications Page                                │
│     │  ├─ Medications List                             │
│     │  ├─ Search/Filter Bar                            │
│     │  ├─ Add Medication Button                        │
│     │  ├─ Medication Item Card                         │
│     │  │  ├─ Medication Name                           │
│     │  │  ├─ Dosage & Frequency                        │
│     │  │  ├─ Edit Button                               │
│     │  │  ├─ Delete Button                             │
│     │  │  └─ Mark as Taken                             │
│     │  └─ Add Medication Modal                         │
│     │                                                   │
│     ├─ Drug Lookup Page                                │
│     │  ├─ Search Input                                 │
│     │  ├─ Search Results List                          │
│     │  ├─ Drug Detail Card                             │
│     │  │  ├─ Drug Name & Type                          │
│     │  │  ├─ Side Effects                              │
│     │  │  ├─ Interactions                              │
│     │  │  └─ AI Analysis (Gemini)                      │
│     │  └─ Alternative Drugs                            │
│     │                                                   │
│     ├─ Chatbot Page                                    │
│     │  ├─ Conversation History                         │
│     │  ├─ Chat Messages                                │
│     │  ├─ Message Input                                │
│     │  ├─ Send Button                                  │
│     │  └─ AI Response Display                          │
│     │                                                   │
│     └─ Settings Page                                   │
│        ├─ Accessibility Settings                      │
│        │  ├─ Font Size Slider                         │
│        │  ├─ Theme Selection                          │
│        │  └─ Animation Speed                          │
│        ├─ Notification Settings                       │
│        ├─ Profile Management                          │
│        └─ Data Export                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌───────────────────────────────────────────────────────────┐
│                  USER'S BROWSER                           │
│                   (Client Side)                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Vite App (Production Build)                             │
│  ├─ dist/ folder (Static files)                          │
│  ├─ JavaScript bundles (chunked)                         │
│  ├─ CSS bundles (optimized)                              │
│  └─ Assets (images, fonts)                               │
│                                                           │
│  Local Storage:                                          │
│  ├─ JWT Token                                            │
│  ├─ User Preferences                                     │
│  └─ Accessibility Settings                              │
│                                                           │
└───────────────┬───────────────────────────────────────────┘
                │ HTTPS/REST API Calls
                ↓
┌───────────────────────────────────────────────────────────┐
│            NODEJS/EXPRESS SERVER                          │
│         (Vercel Deployment or Local)                      │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Entry: server.ts                                        │
│  Port: 3001 (Local) / Auto (Vercel)                      │
│                                                           │
│  Routes:                                                 │
│  ├─ POST /auth/register                                  │
│  ├─ POST /auth/login                                     │
│  ├─ GET/POST /medications                                │
│  ├─ PUT/DELETE /medications/:id                          │
│  ├─ GET /drugs/search                                    │
│  └─ POST /chat/analyze (Gemini)                          │
│                                                           │
│  Middleware:                                             │
│  ├─ Authentication (JWT Verify)                          │
│  ├─ CORS Setup                                           │
│  ├─ Error Handling                                       │
│  └─ Logging                                              │
│                                                           │
└───────────────┬───────────────────────────────────────────┘
                │ Database Queries
                ↓
┌───────────────────────────────────────────────────────────┐
│            DATABASE LAYER (SQLite)                        │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Tables:                                                 │
│  ├─ users                                                │
│  │  ├─ id (PK)                                          │
│  │  ├─ email (UNIQUE)                                   │
│  │  ├─ password (encrypted)                             │
│  │  ├─ created_at                                       │
│  │  └─ preferences (JSON)                               │
│  │                                                       │
│  ├─ medications                                          │
│  │  ├─ id (PK)                                          │
│  │  ├─ user_id (FK)                                     │
│  │  ├─ name                                             │
│  │  ├─ dosage                                           │
│  │  ├─ frequency                                        │
│  │  ├─ reminders                                        │
│  │  ├─ created_at                                       │
│  │  └─ updated_at                                       │
│  │                                                       │
│  └─ interactions                                         │
│     ├─ id (PK)                                          │
│     ├─ med1_id (FK)                                     │
│     ├─ med2_id (FK)                                     │
│     ├─ severity (high/medium/low)                       │
│     └─ description                                      │
│                                                           │
│  Queries:                                                │
│  ├─ User: SELECT * FROM users WHERE email = ?           │
│  ├─ Meds: SELECT * FROM medications WHERE user_id = ?   │
│  └─ Insert: INSERT INTO medications (...)               │
│                                                           │
└───────────────┬───────────────────────────────────────────┘
                │
                ├──────────────────┐
                │                  │
                ↓                  ↓
┌───────────────────────────┐  ┌──────────────────────────┐
│   EXTERNAL SERVICE: AI    │  │ EXTERNAL SERVICE: Auth   │
│   (Google Gemini API)     │  │ (Supabase/Custom JWT)    │
├───────────────────────────┤  ├──────────────────────────┤
│                           │  │                          │
│  POST /api/generateContent│  │ JWT Token Generation     │
│  ├─ Model: gemini-pro     │  │ ├─ Token Creation        │
│  ├─ Prompt: User Query    │  │ ├─ Expiration Setup      │
│  ├─ Context: Medications  │  │ └─ Refresh Logic         │
│  └─ Response: Analysis    │  │                          │
│                           │  │ Password Hashing:        │
│                           │  │ ├─ bcryptjs              │
│                           │  │ ├─ Salt Rounds: 10       │
│                           │  │ └─ Verification          │
│                           │  │                          │
└───────────────────────────┘  └──────────────────────────┘
```

---

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Router** - Navigation management
- **Recharts** - Data visualization

### Backend
- **Express.js** - Lightweight web server
- **SQLite (better-sqlite3)** - Embedded database
- **JWT** - Secure authentication
- **bcryptjs** - Password hashing
- **Gemini AI API** - AI-powered features

---

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Gemini API Key** (from [Google AI Studio](https://ai.google.dev))

---

## 🚀 Quick Start - Getting Up & Running

```
╔═══════════════════════════════════════════════════════════════════════════╗
║           🎯 MEDGUIDE SETUP FLOW - STEP BY STEP                          ║
╚═══════════════════════════════════════════════════════════════════════════╝

📌 PREPARATION PHASE
└─ ✓ Ensure Node.js v18+ is installed
   └─ ✓ Ensure npm v9+ is installed
   └─ ✓ Prepare Gemini API Key from Google AI Studio

              ⬇️  STEP 1: CLONE & INSTALL

   $ git clone https://github.com/yourusername/medguide.git
   $ cd medguide
   $ npm install                    ← Install all dependencies
   
   ✅ Progress: Packages installed (node_modules/ created)

              ⬇️  STEP 2: ENVIRONMENT SETUP

   Create .env file in root directory with:
   ┌─────────────────────────────────────────┐
   │ GEMINI_API_KEY=your_key_here            │
   │ VITE_SUPABASE_URL=your_url              │
   │ VITE_SUPABASE_ANON_KEY=your_key        │
   │ JWT_SECRET=your_secret_key              │
   └─────────────────────────────────────────┘
   
   ✅ Progress: Environment configured

              ⬇️  STEP 3: START DEVELOPMENT SERVER

   $ npm run dev
   
   Expected Output:
   ┌──────────────────────────────────────────┐
   │ > medguide@1.0.0 dev                     │
   │ > vite --port 3000                       │
   │                                          │
   │ Local:    http://localhost:3000          │
   │ Press q to quit                          │
   └──────────────────────────────────────────┘
   
   ✅ Progress: Frontend server running

              ⬇️  STEP 4: START BACKEND SERVER (NEW TERMINAL)

   $ npm run server
   
   Expected Output:
   ┌──────────────────────────────────────────┐
   │ Server running on http://localhost:3001  │
   │ SQLite Database: ./medguide.db           │
   └──────────────────────────────────────────┘
   
   ✅ Progress: Backend server running

              ⬇️  STEP 5: OPEN IN BROWSER

   Navigate to: http://localhost:3000
   
   ✅ You should see:
      ├─ MedGuide Login Page
      ├─ Register Link
      └─ Accessible UI with smooth animations

              ⬇️  STEP 6: CREATE ACCOUNT

   1️⃣  Click "Don't have an account? Register"
   2️⃣  Enter Email & Password
   3️⃣  Click Register
   4️⃣  Automatically logged in → Dashboard appears
   
   ✅ You're now in the application!

              ⬇️  STEP 7: EXPLORE FEATURES

   Now Available:
   ├─ 📊 Dashboard (Analytics overview)
   ├─ 💊 Medications (Add/manage medications)
   ├─ 🔍 Drug Lookup (Search drugs, AI analysis)
   ├─ 🤖 Chatbot (AI assistant)
   └─ ⚙️  Settings (Accessibility options)

╔═══════════════════════════════════════════════════════════════════════════╗
║ ✨ Application is now running! Start adding medications & using features  ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Quick Start via Docker (Optional)

```bash
# Build and run with Docker
docker build -t medguide .
docker run -p 3000:3000 -p 3001:3001 medguide
```

---

## 📦 Available Scripts

| Command | Purpose | Output |
|---------|---------|--------|
| `npm run dev` | Start Vite dev server (Frontend) | http://localhost:3000 |
| `npm run server` | Start Express backend | http://localhost:3001 |
| `npm run build` | Production build | dist/ folder |
| `npm run preview` | Preview production build | http://localhost:4173 |
| `npm run lint` | TypeScript type checking | Report errors/warnings |
| `npm run clean` | Clean artifacts | Removes dist/, node_modules/ |

---

## 📁 Project Structure

```
medguide/
├── src/
│   ├── components/          # React components
│   ├── pages/
│   │   ├── Dashboard.tsx     # User dashboard
│   │   ├── Login.tsx         # Authentication page
│   │   ├── Medications.tsx   # Medication management
│   │   ├── Register.tsx      # Sign-up page
│   │   └── Settings.tsx      # User preferences
│   ├── services/
│   │   └── api.ts            # API client
│   ├── types.ts              # TypeScript types
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── server.ts                 # Express backend
├── .env                      # Environment variables
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite config
└── README.md                 # This file
```

---

## 🔑 Key Features Explained

### 🔐 Authentication
- Secure user registration and login
- JWT token-based sessions
- Password encryption with bcryptjs

### 💊 Medication Management
- Add, edit, and delete medications
- Track dosage and frequency
- Set medication reminders
- Monitor medication adherence

### 🤖 AI-Powered Insights
- Gemini AI analyzes medication risks
- Get personalized recommendations
- Detect potential drug interactions
- Emergency alert system

### ♿ Accessibility
- **Elderly Mode** - Enlarged fonts, simplified navigation
- **High Contrast** - Enhanced readability
- **Keyboard Navigation** - Full keyboard support
- **Responsive Design** - Works on all devices

---

## 🔒 Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT authentication tokens
- ✅ Environment variable protection
- ✅ SQL injection prevention
- ✅ Secure API endpoints

---

## 📊 Database Schema

### Users Table
- User authentication and profile information
- Emergency contact details
- Account management

### Medications Table
- Medication details and dosage
- Frequency and reminder times
- Risk levels and side effects
- AI-generated health data

### Adherence Table
- Track medication compliance
- Missed dose notifications
- Historical adherence patterns

---

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
# Windows - Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Dependencies Not Installing
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install
```

### Gemini API Issues
- Ensure `GEMINI_API_KEY` is set in `.env`
- Check API key is valid at [Google AI Studio](https://ai.google.dev)
- Verify network connectivity

---

## 🚀 Deployment

### Important: Full-Stack Architecture

This application requires **both frontend and backend** deployment:

- **Frontend**: Static React app (HTML/JS/CSS)
- **Backend**: Express.js API server (`server.ts`)

### Quick Deployment Guide

#### Option 1: Deploy Backend + Frontend Separately (Recommended)

**Backend (Express API):**
1. Deploy to Heroku, Railway, Render, or DigitalOcean
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `JWT_SECRET`
   - `NODE_ENV=production`
3. Note your backend URL (e.g., `https://api.medguide.com`)

**Frontend (React):**
1. Deploy to Vercel, Netlify, or any static host
2. Set environment variable: `VITE_API_URL=https://your-backend-url.com/api`
3. Build and deploy: `npm run build`

#### Option 2: Migrate to Supabase Edge Functions

Convert Express routes to serverless Edge Functions for a fully managed solution. See `DEPLOYMENT.md` for detailed migration guide.

#### Environment Variables

**Backend:**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
JWT_SECRET=your_secret_key
ALLOWED_ORIGINS=https://your-frontend.vercel.app
NODE_ENV=production
```

**Frontend:**
```env
VITE_API_URL=https://your-backend.herokuapp.com/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Troubleshooting Deployment

If you get `"Unexpected token 'T', 'The page c'... is not valid JSON"` error:
- Your backend is not deployed or `VITE_API_URL` is not configured
- See `DEPLOYMENT.md` for detailed troubleshooting steps

### Deploy to Cloud
- **Backend**: Heroku, Railway, Render, DigitalOcean App Platform
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Serverless**: Supabase Edge Functions, Vercel Functions, Netlify Functions

---

## 🎓 Understanding the Program Flow

### 📖 How to Use This README

This README contains comprehensive flow diagrams to help you understand how MedGuide works:

#### 1. **User Journey Flow** (Start here!)
   - Shows the complete path a user takes from app startup to using features
   - Visual representation of authentication, navigation, and feature access
   - Helps understand the "big picture" of the application

#### 2. **Data Flow Architecture**
   - Illustrates how data moves between frontend, backend, and database
   - Component layers and their responsibilities
   - External service integrations (Gemini AI, Authentication)

#### 3. **Feature Interaction Flow**
   - Details the medication lifecycle (adding, editing, deleting medications)
   - Shows form validation, API calls, and success/error handling
   - Understanding this helps debug medication-related features

#### 4. **Authentication & Routing Flow**
   - Explains public vs protected routes
   - JWT token validation logic
   - Route guards and redirects

#### 5. **API Request/Response Cycle**
   - Complete request flow from UI action to database and back
   - Error handling and response codes
   - UI updates and animations

#### 6. **AI-Powered Features Flow**
   - How Gemini AI integrates with the app
   - Request preparation, API calling, and response handling
   - Risk assessment and recommendation generation

#### 7. **Accessibility & Elderly-Friendly Mode Flow**
   - Settings available for accessibility
   - How preferences are saved and applied
   - WCAG compliance details

#### 8. **Component & File Structure**
   - Where different components are located in the codebase
   - Component hierarchy and relationships
   - Understanding file organization

#### 9. **Deployment Architecture**
   - Production deployment structure
   - Database schema and tables
   - External service connections

### 🗺️ Quick Navigation Guide

```
Looking for information about...?

┌─ GETTING STARTED
│  ├─ "How do I set up the project?"
│  │  └─ Go to: 📋 Prerequisites & 🚀 Quick Start Sections
│  │
│  ├─ "What's this app about?"
│  │  └─ Go to: ✨ Features & 🎬 Animated Program Flow
│  │
│  └─ "How does the entire app work?"
│     └─ Go to: 🎬 Animated Program Flow & 📊 User Journey

├─ UNDERSTANDING FEATURES
│  ├─ "How does authentication work?"
│  │  └─ Go to: Authentication & Routing Flow & 🔐 Secure Authentication
│  │
│  ├─ "How do I add medications?"
│  │  └─ Go to: Feature Interaction Flow & 💊 Medication Management
│  │
│  ├─ "How does the AI work?"
│  │  └─ Go to: AI-Powered Features Flow & 🤖 Gemini AI Integration
│  │
│  └─ "What accessibility features exist?"
│     └─ Go to: Accessibility & Elderly-Friendly Mode Flow

├─ TECHNICAL DETAILS
│  ├─ "What technologies are used?"
│  │  └─ Go to: 🛠️ Tech Stack Section
│  │
│  ├─ "Where are the components?"
│  │  └─ Go to: 📁 Component & File Structure
│  │
│  ├─ "How does data flow through the app?"
│  │  └─ Go to: Data Flow Architecture & API Request/Response Cycle
│  │
│  └─ "What's the database schema?"
│     └─ Go to: 🚀 Deployment Architecture

├─ DEVELOPMENT
│  ├─ "How do I run the project?"
│  │  └─ Go to: 🚀 Quick Start Section
│  │
│  ├─ "What scripts are available?"
│  │  └─ Go to: 📦 Available Scripts Table
│  │
│  └─ "How do I troubleshoot issues?"
│     └─ Go to: 🐛 Troubleshooting Section

└─ DEPLOYMENT
   ├─ "How do I deploy this?"
   │  └─ Go to: 🚀 Deployment Section
   │
   └─ "What environment variables do I need?"
      └─ Go to: Environment Variables in Deployment
```

### 🎯 Most Important Flows to Understand

**For Users:**
1. **User Journey Flow** → Understand the complete app experience
2. **Authentication & Routing Flow** → Know how to login and navigate
3. **Feature Interaction Flow** → Understand how to use features

**For Developers:**
1. **Data Flow Architecture** → Understand system design
2. **Component & File Structure** → Find where to make changes
3. **API Request/Response Cycle** → Debug API issues
4. **AI-Powered Features Flow** → Integrate or modify AI features

**For DevOps/Deployment:**
1. **Deployment Architecture** → Understand production setup
2. **Tech Stack** → Know dependencies and requirements
3. **Environment Variables** → Configure deployments correctly

### 💡 Tips for Using These Flows

✅ **DO:**
- Read flows from top to bottom
- Follow the arrows (↓) to trace the complete path
- Look for your specific feature/topic
- Use the flow diagrams to understand integration points
- Reference these when debugging or implementing features

❌ **DON'T:**
- Skip the User Journey Flow - it's the foundation
- Ignore error handling flows - they're crucial for robustness
- Forget to check all the visual indicators (✅❌⚡)
- Skip environment variable setup (causes common issues)

### 🔍 Debugging Using Flows

When something doesn't work:

1. **Identify which flow is affected** (Auth? API? UI?)
2. **Trace through the flow step by step**
3. **Check each layer** (Frontend → Backend → Database)
4. **Look for error indicators** (❌ symbols in diagrams)
5. **Verify environment variables** (usually the culprit!)
6. **Check logs** at each stage of the flow

---

## 📝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">

**Made with ❤️ by the Mayank Shah**

[⬆ Back to top](#-medguide---intelligent-medication-tracker)

</div>
