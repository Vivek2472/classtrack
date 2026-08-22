# 🔒 ClassTrack — Private Supabase Configuration & Vercel Deployment Guide

This guide explains how to configure your Supabase integration **strictly inside your editor** using a private `.env` file, and how to deploy to **GitHub** and **Vercel** with zero sensitive details or URLs visible on the webpage.

---

## 🛡️ How Your Privacy & Security Are Guaranteed

1. **Kept in the Editor Only (`.env`)**:
   - Your Supabase Project URL and Anon Public Key are placed in a `.env` file located in the root of your project.
2. **Never Uploaded to GitHub (`.gitignore`)**:
   - The `.gitignore` file explicitly blocks `.env` and `js/config.js` from being committed. When you push your code to GitHub, your credentials **will NOT be in the repository**.
3. **Zero URLs on the Webpage**:
   - The website UI contains **no input boxes, settings modals, or visible URLs**.
   - Your website loads and synchronizes with Supabase automatically in the background.
4. **Vercel Environment Variables**:
   - When deploying to Vercel, you enter your Supabase details once in Vercel's private dashboard. Vercel securely injects them at runtime.

---

## 🛠️ Step 1: Configure `.env` in Your Editor

1. Open the [`.env`](file:///c:/Users/SWATHI%20VISHAL/OneDrive/Desktop/vivek/antigravity/.env) file in your editor.
2. Paste your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-public-key-here
   ```
3. Run the build command in terminal to sync the environment:
   ```bash
   npm run build
   ```
*(That's it! Your app in the editor is now connected to Supabase).*

---

## 🗄️ Step 2: Run Database Schema in Supabase

1. In your [Supabase Dashboard](https://supabase.com/dashboard), click **SQL Editor** (`>_`).
2. Copy the entire contents of [`supabase/schema.sql`](file:///c:/Users/SWATHI%20VISHAL/OneDrive/Desktop/vivek/antigravity/supabase/schema.sql).
3. Paste into the SQL Editor and click **Run**.
   - This creates all tables (`profiles`, `subjects`, `schedule`, `attendance_logs`) with Row Level Security (RLS) policies.

---

## 🚀 Step 3: Deploy to Vercel with Private Environment Variables

1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Deploy ClassTrack with Supabase"
   git push origin main
   ```
   *(Notice: `.env` and `js/config.js` will NOT be committed because they are in `.gitignore`)*.

2. Go to [https://vercel.com](https://vercel.com) and click **Add New...** &rarr; **Project**.
3. Import your GitHub repository.
4. Expand the **Environment Variables** section before clicking deploy.
5. Add the two variables:
   - **Key**: `SUPABASE_URL` &rarr; **Value**: `https://your-project-id.supabase.co`
   - **Key**: `SUPABASE_ANON_KEY` &rarr; **Value**: `your-anon-public-key-here`
6. Click **Deploy**.

Vercel will build and host your website, injecting the environment variables automatically. No one visiting your site can ever see or modify your configuration!
