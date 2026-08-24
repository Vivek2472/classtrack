# ClassTrack — Precision Academic Attendance & Schedule Manager

> **Never miss the 75% cutoff again.**  
> ClassTrack is an intelligent, student-centric academic planner designed to track course attendance, timetable schedules, and real-time safe absence margins.

---

## 🌟 Overview

Maintaining the required attendance threshold (typically 75% or 85%) across lectures, labs, and tutorials is a major challenge for college and university students. ClassTrack solves this by providing:

1. **Live Attendance Safe Margin Calculations**: Real-time insights telling you exactly how many consecutive classes you can safely miss or how many you need to attend to get back above your target.
2. **Dynamic Timetable Matrix**: Visual weekly and monthly schedules with automatic period conflict detection and quick-logging shortcuts.
3. **Session-Specific Tracking**: Differentiate between **Present**, **Absent**, **Faculty Absent / Free Period** (exempted without penalty), and **Substitute Faculty**.
4. **Comprehensive Semester Analytics**: Visual attendance trajectories, day-by-day attendance heatmaps, and one-click PDF & CSV grade-book exports.
5. **Secure Single-Session Access**: Protects student data integrity by keeping an active session securely synchronized with your student profile.

---

## 🚀 Key Features

### 1. Dashboard & Quick Attendance Logging
- **Today's Class Schedule**: Shows upcoming periods for the day with start time, classroom/lab location, instructor name, and course code.
- **One-Tap Quick Log**: Mark attendance directly from the dashboard as **Present**, **Absent**, **Faculty Absent**, or assign a **Substitute Teacher**.
- **Undo & Re-mark**: Easily adjust or fix attendance records if plans change or corrections are required.
- **Academic Safe Margin Bar**: Instant high-level alert displaying whether your semester attendance is in the **Safe Zone**, **Warning Zone**, or **Critical Catch-Up Zone**.

### 2. Smart Weekly & Monthly Schedule
- **Weekly Grid Matrix**: Clean view from Monday to Sunday displaying all class slots with start and end times.
- **Automatic Duration Calculation**: Enter your class start and end times; ClassTrack automatically calculates period durations without manual effort.
- **Monthly Academic Calendar**: Visual calendar highlighting days with scheduled classes, attendance logs, holidays, and free periods.
- **Conflict Prevention**: Intelligent validation prevents scheduling overlapping classes on the same day and time.

### 3. Course Catalog & Attendance Ledger
- **Course Types**: Categorize courses into Theory, Lab, Tutorial, or Seminar with custom credit weights.
- **Individual Course Breakdown**: View class-by-class attendance history with timestamped logs, professor notes, and exemption statuses.
- **Target Policy Customization**: Set your institutional target threshold (e.g., 75%, 80%, or 85%) individually or globally.

### 4. Advanced Analytics & Export
- **Attendance Trajectory Graph**: Visual SVG trendline tracking your progressive semester attendance from Week 1 to present.
- **70-Day Activity Heatmap**: GitHub-style activity grid showing daily class attendance consistency.
- **CSV & PDF Reports**: Generate official downloadable attendance spreadsheets and formatted print-ready PDF summaries.

### 5. Profile & Session Management
- **Single Edit Hub**: Manage student name, roll number / university ID, degree program, and current semester in a unified modal.
- **Email Verification**: Safeguard student identity with verification-confirmed email updates.
- **Strict Password Standard**: Enforces 8–10 characters containing letters, numbers, and special characters across student accounts.
- **Dark & Light Mode**: Seamless theme switching tailored for study sessions in any lighting environment.

---

## 📐 Safe Margin Formula Guide

ClassTrack uses mathematically rigorous formulas to help you manage your attendance:

### Safe Absence Margin (When Current % $\ge$ Target %)
The number of consecutive upcoming classes you can miss while keeping your total percentage at or above your target ($T$):

$$\text{Safe Miss Margin} = \left\lfloor \frac{A - (T \times C)}{T} \right\rfloor$$

*Where:*
- $A$ = Total classes attended (including On-Duty and Substitute sessions)
- $C$ = Total classes conducted (excluding cancelled and faculty-absent periods)
- $T$ = Target attendance ratio (e.g., 0.75 for 75%)

### Catch-Up Needed (When Current % $<$ Target %)
The minimum number of consecutive upcoming classes you must attend to raise your attendance back to target ($T$):

$$\text{Classes to Recover} = \left\lceil \frac{(T \times C) - A}{1 - T} \right\rceil$$

---

## 💻 Tech Stack & Architecture

- **Frontend**: Vanilla ES6+ JavaScript, Semantic HTML5, CSS Variables, and Tailwind CSS Layout Utilities.
- **Typography & Icons**: Google Fonts (*Inter*, *JetBrains Mono*) and Google *Material Symbols*.
- **Motion & Interactions**: GSAP animations and smooth CSS transitions.
- **State Management**: Reactive state architecture with automatic local caching and seamless cloud synchronization.

---

## 📱 Getting Started

1. Open `index.html` or `landing.html` in any modern web browser.
2. Click **Get Started** to create your student account with your name, degree, and semester.
3. Add your enrolled subjects and set up your weekly timetable slots.
4. Mark attendance daily with one click and stay confident about your academic standing!

---

*ClassTrack — Built for students, engineered for academic excellence.*
