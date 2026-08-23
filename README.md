# 🎓 ClassTrack — Student Attendance Tracker & Smart Schedule Suite

> **Precision Academic Attendance Tracking and Smart Schedule Management for Students.**  
> *Built by students, for students.*

---

## 📌 Overview

**ClassTrack** is a modern, high-precision attendance tracker and smart timetable manager designed specifically for college and university students. Unlike generic habit trackers, ClassTrack tracks each timetable slot as an independent session — allowing students with multiple lectures of the same subject on the same day (e.g. Physics Theory at 9:00 AM and Physics Lab at 2:00 PM) to log attendance accurately.

Backed by secure real-time cloud database synchronization and Row-Level Security (RLS), your schedule and attendance stay synchronized across all your devices.

---

## ✨ Key Features

- 🎯 **Per-Session Precision Tracking**: Log attendance per timetable slot, not just once per day. Two sessions of the same course count as two distinct attendance records.
- 📅 **Smart Weekly Timetable**: Interactive weekly schedule with color-coded session types (*Theory, Lab, Tutorial, Extra, Substitute*).
- 📊 **Real-Time Attendance Analytics**:
  - Live subject-wise and aggregate attendance percentages.
  - Safe margin calculation (*how many classes you can safely miss while staying above your target cutoff*).
  - Catch-up prediction (*how many consecutive classes you need to attend to recover from a shortage*).
  - Type-wise attendance breakdown (*Theory vs. Lab vs. Tutorial*).
- ⚡ **1-Tap Quick Mark Attendance**: Prominently accessible from the top header to log *Present*, *Absent*, or *Cancelled/OD* in seconds.
- 🔒 **Cloud Sync & Data Privacy**: Cloud database storage with PostgreSQL Row Level Security (RLS) ensuring strict user data isolation.
- 🌓 **Dark & Light Themes**: Seamless dark mode support tailored for comfortable day and night usage.
- 📱 **Responsive Design**: Optimized for desktops, tablets, and mobile devices with native-feeling navigation.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Tailwind CSS & Custom CSS Design System
- **Database & Auth**: PostgreSQL with Row Level Security (RLS) & Cloud Authentication
- **Icons & Typography**: Google Fonts (*Inter*, *JetBrains Mono*), Google Material Symbols
- **Deployment**: Vercel Serverless Architecture

---

## 📂 Project Structure

```
├── api/
│   └── config.js           # Serverless API endpoint for environment config injection
├── css/
│   └── style.css           # Custom design system tokens, components, and animations
├── js/
│   ├── views/
│   │   ├── analytics.js    # Semester analytics & chart visualizations
│   │   ├── auth.js         # Authentication UI view components
│   │   ├── dashboard.js    # Overview dashboard & quick metrics
│   │   ├── profile.js      # Student profile & settings view
│   │   ├── schedule.js     # Timetable view & weekly slot management
│   │   └── subjects.js     # Subject cards & course management
│   ├── app.js              # Application controller, router, modals & toasts
│   ├── auth.js             # Authentication & session manager
│   ├── config.js           # Local editor configuration (gitignored)
│   ├── state.js            # Reactive state store & caching
│   ├── supabase.js         # Cloud database client manager
│   └── sync.js             # Real-time two-way cloud sync engine
├── supabase/
│   └── schema.sql          # PostgreSQL database schema & RLS policies
├── build.js                # Local config builder script
├── index.html              # Public showcase landing page (Root homepage)
├── app.html                # Main student attendance dashboard (App)
├── login.html              # Dedicated sign-in page
├── signup.html             # Dedicated sign-up page
├── package.json            # Project manifest & scripts
├── vercel.json             # Vercel deployment & routing configuration
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/classtrack.git
cd classtrack
```

### 2. Configure Environment Variables (Local)
Create a `.env` file in the root directory:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here
```

Generate local configuration:
```bash
npm run build
```

### 3. Run Locally
Start a local web server (e.g., using Python or Node.js):
```bash
# Using Python
python -m http.server 8000

# Or using Node http-server / Live Server
npx serve .
```
Visit `http://localhost:8000` in your browser.

---

## 🗄️ Database Setup

1. Open your database dashboard SQL editor.
2. Copy and run the entire SQL script from [`supabase/schema.sql`](supabase/schema.sql).
3. This creates:
   - `profiles` table (linked to authenticated user)
   - `subjects` table (courses, credits, target thresholds)
   - `schedule` table (weekly timetable slots)
   - `attendance_logs` table (session attendance history)
   - Row Level Security (RLS) policies for complete data isolation

---

## 🌐 Deployment (Vercel)

1. Push your repository to **GitHub**.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"** &rarr; **"Import"** your repository.
3. In **Project Settings &rarr; Environment Variables**, add:
   - `SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `SUPABASE_ANON_KEY` = `your-anon-public-key-here`
4. Click **Deploy**. Vercel will automatically build and host your project with serverless `/api/config` routing.

---

## 📄 License

This project is open-source and available under the [ISC License](LICENSE).
