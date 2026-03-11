# 💊 MedGuide - Intelligent Medication  Tracker 

<div align="center">

[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat&logo=express)](https://expressjs.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat)]()

**🚀 An intelligent, accessible medication tracking solution**

[🌐 Live Demo](#) • [📖 Documentation](#features) • [🐛 Report Bug](#) • [✨ Request Feature](#)

</div>

---

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

## 🛠️ Tech Stack

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

## 🚀 Quick Start

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Configure Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_secret_key_here
```

### 3️⃣ Start Development Server
```bash
npm run dev
```

### 4️⃣ Open in Browser
Navigate to:
```
http://localhost:3000
```

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Check TypeScript types |
| `npm run clean` | Clean build artifacts |

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
