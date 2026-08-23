/**
 * ClassTrack Engineering - Supabase Cloud Synchronization Engine
 * Direct real-time PostgreSQL database persistence (Zero local storage dependency)
 */

class SupabaseSyncManager {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.listeners = [];
  }

  getSupabase() {
    if (window.ClassTrackSupabase && window.ClassTrackSupabase.getClient()) {
      return window.ClassTrackSupabase.getClient();
    }
    return null;
  }

  getCurrentUserId() {
    const authUser = window.ClassTrackAuth ? window.ClassTrackAuth.getCurrentUser() : null;
    if (authUser && authUser.id) {
      return authUser.id; // Supabase UUID
    }
    return null;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => {
      try {
        fn({
          isSyncing: this.isSyncing,
          lastSyncTime: this.lastSyncTime
        });
      } catch (err) {
        console.error('Sync notification error:', err);
      }
    });
  }

  /* ----------------------------------------------------
     1. Hydrate In-Memory State from Supabase Database
  ----------------------------------------------------- */

  async fetchUserData(userId) {
    const supabase = this.getSupabase();
    if (!supabase || !userId) return false;

    this.isSyncing = true;
    this.notify();

    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) console.warn('Supabase profile fetch error:', profileErr.message);

      // 2. Fetch Subjects
      const { data: subjectsData, error: subjectsErr } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (subjectsErr) console.warn('Supabase subjects fetch error:', subjectsErr.message);

      // 3. Fetch Schedule
      const { data: scheduleData, error: scheduleErr } = await supabase
        .from('schedule')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (scheduleErr) console.warn('Supabase schedule fetch error:', scheduleErr.message);

      // 4. Fetch Attendance Logs
      const { data: logsData, error: logsErr } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (logsErr) console.warn('Supabase logs fetch error:', logsErr.message);

      // Populate in-memory state
      const state = window.EduTrackState.getState();
      const authUser = window.ClassTrackAuth ? window.ClassTrackAuth.getCurrentUser() : null;

      if (profileData) {
        state.profile = {
          name: profileData.full_name || authUser?.fullName || state.profile.name || 'Student',
          rollNo: profileData.roll_no || authUser?.universityId || state.profile.rollNo || '',
          program: profileData.program || authUser?.branch || state.profile.program || 'General Studies',
          semester: profileData.semester || authUser?.semester || state.profile.semester || '',
          email: profileData.email || authUser?.email || state.profile.email || '',
          phone: profileData.phone || authUser?.phone || state.profile.phone || '',
          gpa: profileData.gpa !== null && profileData.gpa !== undefined ? parseFloat(profileData.gpa) : state.profile.gpa,
          targetThreshold: profileData.target_threshold || 75,
          strictThreshold: profileData.strict_threshold || 80,
          avatarUrl: state.profile.avatarUrl || ''
        };

        if (profileData.dark_mode !== undefined) {
          state.settings.darkMode = Boolean(profileData.dark_mode);
          if (state.settings.darkMode) {
            document.body.classList.add('dark');
          } else {
            document.body.classList.remove('dark');
          }
        }

        if (profileData.timetable_mode) {
          state.settings.timetableMode = profileData.timetable_mode;
        }
      } else if (authUser) {
        // Create initial profile record if not found
        state.profile = {
          name: authUser.fullName || 'Student',
          rollNo: authUser.universityId || '',
          program: authUser.branch || 'General Studies',
          semester: authUser.semester || '',
          email: authUser.email || '',
          phone: authUser.phone || '',
          gpa: null,
          targetThreshold: 75,
          strictThreshold: 80,
          avatarUrl: ''
        };

        await this.syncProfile(state.profile, state.settings);
      }

      if (subjectsData && Array.isArray(subjectsData)) {
        state.subjects = subjectsData.map(s => ({
          id: s.id,
          code: s.code || '',
          aliasCode: s.alias_code || s.code || '',
          name: s.name || '',
          category: s.category || 'Core',
          type: s.type || 'theory',
          credits: s.credits !== null && s.credits !== undefined ? s.credits : 3,
          instructor: s.instructor || 'Faculty Member',
          room: s.room || 'TBA',
          total: s.total || 0,
          attended: s.attended || 0,
          missed: s.missed || 0,
          color: s.color || '#3B82F6',
          forecast: s.forecast || 'Active course.'
        }));
      } else {
        state.subjects = [];
      }

      if (scheduleData && Array.isArray(scheduleData)) {
        state.schedule = scheduleData.map(sch => ({
          id: sch.id,
          subjectId: sch.subject_id,
          day: sch.day,
          time: sch.time,
          duration: parseFloat(sch.duration) || 1,
          timeStr: sch.time_str || sch.time,
          room: sch.room || 'TBA'
        }));
      } else {
        state.schedule = [];
      }

      if (logsData && Array.isArray(logsData)) {
        state.logs = logsData.map(l => ({
          id: l.id,
          subjectId: l.subject_id,
          date: l.date,
          timeStr: l.time_str || 'Class Session',
          type: l.type || 'Lecture',
          status: l.status,
          remarks: l.remarks || ''
        }));
      } else {
        state.logs = [];
      }

      this.lastSyncTime = new Date().toISOString();
      window.EduTrackState.notify();
      return true;

    } catch (err) {
      console.error('Failed to sync data from Supabase:', err);
      return false;
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  /* ----------------------------------------------------
     2. Subject Database Operations
  ----------------------------------------------------- */

  async syncSubject(subject, action = 'upsert') {
    const supabase = this.getSupabase();
    const userId = this.getCurrentUserId();
    if (!supabase || !userId) return;

    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('subjects')
          .delete()
          .match({ id: subject.id, user_id: userId });

        if (error) throw error;
      } else {
        const payload = {
          id: subject.id,
          user_id: userId,
          code: subject.code || '',
          alias_code: subject.aliasCode || subject.code || '',
          name: subject.name || '',
          category: subject.category || 'Core',
          type: subject.type || 'theory',
          credits: parseInt(subject.credits, 10) || 3,
          instructor: subject.instructor || 'Faculty Member',
          room: subject.room || 'TBA',
          total: parseInt(subject.total, 10) || 0,
          attended: parseInt(subject.attended, 10) || 0,
          missed: parseInt(subject.missed, 10) || 0,
          color: subject.color || '#3B82F6',
          forecast: subject.forecast || 'Active course.'
        };

        const { error } = await supabase
          .from('subjects')
          .upsert(payload);

        if (error) throw error;
      }
      this.lastSyncTime = new Date().toISOString();
    } catch (err) {
      console.error(`Supabase subject DB error (${action}):`, err.message);
    }
  }

  /* ----------------------------------------------------
     3. Schedule Database Operations
  ----------------------------------------------------- */

  async syncScheduleSlot(slot, action = 'upsert') {
    const supabase = this.getSupabase();
    const userId = this.getCurrentUserId();
    if (!supabase || !userId) return;

    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('schedule')
          .delete()
          .match({ id: slot.id, user_id: userId });

        if (error) throw error;
      } else {
        const payload = {
          id: slot.id,
          user_id: userId,
          subject_id: slot.subjectId,
          day: slot.day,
          time: slot.time,
          duration: parseFloat(slot.duration) || 1,
          time_str: slot.timeStr || slot.time,
          room: slot.room || 'TBA'
        };

        const { error } = await supabase
          .from('schedule')
          .upsert(payload);

        if (error) throw error;
      }
      this.lastSyncTime = new Date().toISOString();
    } catch (err) {
      console.error(`Supabase schedule DB error (${action}):`, err.message);
    }
  }

  /* ----------------------------------------------------
     4. Attendance Logs Database Operations
  ----------------------------------------------------- */

  async syncAttendanceLog(log, action = 'insert') {
    const supabase = this.getSupabase();
    const userId = this.getCurrentUserId();
    if (!supabase || !userId) return;

    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('attendance_logs')
          .delete()
          .match({ id: log.id, user_id: userId });

        if (error) throw error;
      } else if (action === 'update') {
        const { error } = await supabase
          .from('attendance_logs')
          .update({
            status: log.status,
            remarks: log.remarks || '',
            type: log.type || 'Lecture',
            time_str: log.timeStr || 'Class Session',
            date: log.date
          })
          .match({ id: log.id, user_id: userId });

        if (error) throw error;
      } else {
        const payload = {
          id: log.id,
          user_id: userId,
          subject_id: log.subjectId,
          date: log.date,
          time_str: log.timeStr || 'Class Session',
          type: log.type || 'Lecture',
          status: log.status,
          remarks: log.remarks || ''
        };

        const { error } = await supabase
          .from('attendance_logs')
          .upsert(payload);

        if (error) throw error;
      }

      // Update the subject's counters on the database
      const state = window.EduTrackState.getState();
      const subject = (state.subjects || []).find(s => s.id === log.subjectId);
      if (subject) {
        await this.syncSubject(subject, 'upsert');
      }

      this.lastSyncTime = new Date().toISOString();
    } catch (err) {
      console.error(`Supabase log DB error (${action}):`, err.message);
    }
  }

  /* ----------------------------------------------------
     5. Profile Database Operations
  ----------------------------------------------------- */

  async syncProfile(profileData, settingsData = {}) {
    const supabase = this.getSupabase();
    const userId = this.getCurrentUserId();
    if (!supabase || !userId) return;

    try {
      const payload = {
        id: userId,
        full_name: profileData.name || profileData.full_name || 'Student',
        roll_no: profileData.rollNo !== undefined ? profileData.rollNo : (profileData.roll_no || ''),
        program: profileData.program || 'General Studies',
        semester: profileData.semester || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        gpa: profileData.gpa !== null && profileData.gpa !== undefined ? parseFloat(profileData.gpa) : null,
        target_threshold: parseInt(profileData.targetThreshold || profileData.target_threshold, 10) || 75,
        strict_threshold: parseInt(profileData.strictThreshold || profileData.strict_threshold, 10) || 80,
        dark_mode: settingsData.darkMode !== undefined ? Boolean(settingsData.darkMode) : false,
        timetable_mode: settingsData.timetableMode || 'personal',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(payload);

      if (error) throw error;
      this.lastSyncTime = new Date().toISOString();
    } catch (err) {
      console.error('Supabase profile DB error:', err.message);
    }
  }

  /* ----------------------------------------------------
     6. Wipe User Data from Cloud
  ----------------------------------------------------- */

  async clearUserData() {
    const supabase = this.getSupabase();
    const userId = this.getCurrentUserId();
    if (!supabase || !userId) return;

    try {
      await supabase.from('attendance_logs').delete().eq('user_id', userId);
      await supabase.from('schedule').delete().eq('user_id', userId);
      await supabase.from('subjects').delete().eq('user_id', userId);
      this.lastSyncTime = new Date().toISOString();
    } catch (err) {
      console.error('Supabase clear data error:', err.message);
    }
  }

  async syncNow() {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return { success: false, message: 'Please sign in to sync.' };
    }

    try {
      await this.fetchUserData(userId);
      return { success: true, message: 'Data updated from Supabase.' };
    } catch (err) {
      return { success: false, message: err.message || 'Sync failed.' };
    }
  }
}

// Global Singleton Instance
window.ClassTrackSync = new SupabaseSyncManager();
