-- ==============================================================================
-- ClassTrack - Supabase PostgreSQL Database Schema & Row Level Security (RLS)
-- ==============================================================================
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- It creates all required tables, automatic triggers, and secure RLS policies.
-- ==============================================================================

-- 1. Create Profiles Table (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  roll_no TEXT,
  program TEXT,
  semester TEXT,
  phone TEXT,
  gpa NUMERIC(3,2),
  target_threshold INTEGER DEFAULT 75,
  strict_threshold INTEGER DEFAULT 80,
  dark_mode BOOLEAN DEFAULT FALSE,
  timetable_mode TEXT DEFAULT 'personal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY, -- Supports client-generated id (e.g. 'sub_1720000000000')
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT,
  alias_code TEXT,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Core',
  type TEXT DEFAULT 'theory',
  credits INTEGER DEFAULT 3,
  instructor TEXT DEFAULT 'Faculty Member',
  room TEXT DEFAULT 'TBA',
  total INTEGER DEFAULT 0,
  attended INTEGER DEFAULT 0,
  missed INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  forecast TEXT DEFAULT 'Active course.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Schedule Timetable Table
CREATE TABLE IF NOT EXISTS public.schedule (
  id TEXT PRIMARY KEY, -- e.g. 'sch_1720000000000'
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  duration NUMERIC DEFAULT 1,
  time_str TEXT,
  room TEXT DEFAULT 'TBA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Attendance Logs Table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id TEXT PRIMARY KEY, -- e.g. 'log_1720000000000'
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- Format: YYYY-MM-DD
  time_str TEXT DEFAULT 'Class Session',
  type TEXT DEFAULT 'Lecture',
  status TEXT NOT NULL, -- 'present', 'absent', 'od', 'faculty_absent', 'cancelled', 'holiday', 'other_faculty'
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. Enable Row Level Security (RLS) on all tables
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 6. Row Level Security Policies (Strict User Isolation)
-- ==============================================================================

-- Drop existing policies if re-running to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can insert own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can update own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can delete own subjects" ON public.subjects;

DROP POLICY IF EXISTS "Users can view own schedule" ON public.schedule;
DROP POLICY IF EXISTS "Users can insert own schedule" ON public.schedule;
DROP POLICY IF EXISTS "Users can update own schedule" ON public.schedule;
DROP POLICY IF EXISTS "Users can delete own schedule" ON public.schedule;

DROP POLICY IF EXISTS "Users can view own logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON public.attendance_logs;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Subjects Policies
CREATE POLICY "Users can view own subjects"
  ON public.subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON public.subjects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON public.subjects FOR DELETE
  USING (auth.uid() = user_id);

-- Schedule Policies
CREATE POLICY "Users can view own schedule"
  ON public.schedule FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedule"
  ON public.schedule FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedule"
  ON public.schedule FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedule"
  ON public.schedule FOR DELETE
  USING (auth.uid() = user_id);

-- Attendance Logs Policies
CREATE POLICY "Users can view own logs"
  ON public.attendance_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON public.attendance_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs"
  ON public.attendance_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON public.attendance_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 7. Automatic Triggers for New Users & Timestamps
-- ==============================================================================

-- Function to handle new user registration automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    roll_no,
    program,
    semester,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'full_name', 'Student'),
    COALESCE(NEW.raw_user_meta_data->>'universityId', NEW.raw_user_meta_data->>'rollNo', ''),
    COALESCE(NEW.raw_user_meta_data->>'branch', NEW.raw_user_meta_data->>'program', 'General Studies'),
    COALESCE(NEW.raw_user_meta_data->>'semester', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute after signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at timestamp helper
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_subjects_modtime ON public.subjects;
CREATE TRIGGER update_subjects_modtime
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_schedule_modtime ON public.schedule;
CREATE TRIGGER update_schedule_modtime
  BEFORE UPDATE ON public.schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
