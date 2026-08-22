/**
 * ClassTrack Engineering - Supabase Cloud Synchronization Engine
 * 
 * Handles bidirectional synchronization between EduTrackState and Supabase PostgreSQL:
 * 1. Hydrate state on login (fetch profiles, subjects, schedule, attendance_logs)
 * 2. Asynchronous optimistic cloud sync on mutations (create, update, delete)
 * 3. Guest data migration into cloud upon sign-up
 */

const SYNC_TIMESTAMP_KEY = 'classtrack_last_cloud_sync_v1';

class SupabaseSyncManager {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = localStorage.getItem(SYNC_TIMESTAMP_KEY) || null;
    this.listeners = [];
  }

  getSupabase() {
    if (window.ClassTrackSupabase && window.ClassTrackSupabase.isConfigured()) {
      return window.ClassTrackSupabase.getClient();
    }
    return null;
  }

  getCurrentUserId() {
    const authUser = window.ClassTrackAuth ? window.ClassTrackAuth.getCurrentUser() : null;
    if (authUser && !authUser.isGuest && authUser.id && !authUser.id.startsWith('guest_') && !authUser.id.startsWith('usr_')) {
      return authUser.id; // Supabase UUID
    }
    return null;
  }

  setLastSyncTime(isoString) {
    this.lastSyncTime = isoString;
    if (isoString) {
      localStorage.setItem(SYNC_TIMESTAMP_KEY, isoString);
    } else {
      localStorage.removeItem(SYNC_TIMESTAMP_KEY);
    }
    this.notify();
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
        console.error('Sync listener notification error:', err);
      }
    });
  }

  /* ----------------------------------------------------
     1. Hydrate Local State from Supabase Cloud
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

      if (profileErr) console.warn('Error fetching profile from Supabase:', profileErr.message);

      // 2. Fetch Subjects
      const { data: subjectsData, error: subjectsErr } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (subjectsErr) console.warn('Error fetching subjects from Supabase:', subjectsErr.message);

      // 3. Fetch Schedule
      const { data: scheduleData, error: scheduleErr } = await supabase
        .from('schedule')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (scheduleErr) console.warn('Error fetching schedule from Supabase:', scheduleErr.message);

      // 4. Fetch Attendance Logs
      const { data: logsData, error: logsErr } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (logsErr) console.warn('Error fetching logs from Supabase:', logsErr.message);

      // Construct Local State Object
      const state = window.EduTrackState.getState();

      if (profileData) {
        state.profile = {
          name: profileData.full_name || state.profile.name || 'Student',
          rollNo: profileData.roll_no || state.profile.rollNo || '',
          program: profileData.program || state.profile.program || 'General Studies',
          semester: profileData.semester || state.profile.semester || '',
          email: profileData.email || state.profile.email || '',
          phone: profileData.phone || state.profile.phone || '',
          gpa: profileData.gpa !== null ? profileData.gpa : state.profile.gpa,
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
      }

      if (subjectsData && Array.isArray(subjectsData)) {
        state.subjects = subjectsData.map(s => ({
          id: s.id,
          code: s.code || '',
          aliasCode: s.alias_code || s.code || '',
          name: s.name || '',
          category: s.category || 'Core',
          type: s.type || 'theory',
          credits: s.credits || 3,
          instructor: s.instructor || 'Faculty Member',
          room: s.room || 'TBA',
          total: s.total || 0,
          attended: s.attended || 0,
          missed: s.missed || 0,
          color: s.color || '#3B82F6',
          forecast: s.forecast || 'Active course.'
        }));
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
      }

      // Save locally and refresh UI
      window.EduTrackState.saveState();
      this.setLastSyncTime(new Date().toISOString());
      console.info('State successfully hydrated from Supabase cloud!');
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
     2. Subject Cloud Sync (Insert / Update / Delete)
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
          code: subject.code,
          alias_code: subject.aliasCode || subject.code,
          name: subject.name,
          category: subject.category || 'Core',
          type: subject.type || 'theory',
          credits: subject.credits || 3,
          instructor: subject.instructor || 'Faculty Member',
          room: subject.room || 'TBA',
          total: subject.total || 0,
          attended: subject.attended || 0,
          missed: subject.missed || 0,
          color: subject.color || '#3B82F6',
          forecast: subject.forecast || 'Active course.'
        };

        const { error } = await supabase
          .from('subjects')
          .upsert(payload);

        if (error) throw error;
      }
      this.setLastSyncTime(new Date().toISOString());
    } catch (err) {
      console.error(`Supabase subject sync error (${action}):`, err.message);
    }
  }

  /* ----------------------------------------------------
     3. Schedule Cloud Sync (Insert / Update / Delete)
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
          duration: slot.duration || 1,
          time_str: slot.timeStr || slot.time,
          room: slot.room || 'TBA'
        };

        const { error } = await supabase
          .from('schedule')
          .upsert(payload);

        if (error) throw error;
      }
      this.setLastSyncTime(new Date().toISOString());
    } catch (err) {
      console.error(`Supabase schedule sync error (${action}):`, err.message);
    }
  }

  /* ----------------------------------------------------
     4. Attendance Logs Cloud Sync (Insert / Update / Delete)
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
            type: log.type || 'Lecture'
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
          .insert(payload);

        if (error) throw error;
      }

      // Also update the subject's total/attended/missed counters on the cloud
      const state = window.EduTrackState.getState();
      const subject = (state.subjects || []).find(s => s.id === log.subjectId);
      if (subject) {
        this.syncSubject(subject, 'upsert');
      }

      this.setLastSyncTime(new Date().toISOString());
    } catch (err) {
      console.error(`Supabase log sync error (${action}):`, err.message);
    }
  }

  /* ----------------------------------------------------
     5. Profile & Settings Cloud Sync
  ----------------------------------------------------- */

  async syncProfile(profileData, settingsData = {}) {
    const supabase = this.getSupabase();
    const userId = this.getCurrentUserId();
    if (!supabase || !userId) return;

    try {
      const payload = {
        id: userId,
        full_name: profileData.name || 'Student',
        roll_no: profileData.rollNo || '',
        program: profileData.program || 'General Studies',
        semester: profileData.semester || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        gpa: profileData.gpa || null,
        target_threshold: profileData.targetThreshold || 75,
        strict_threshold: profileData.strictThreshold || 80,
        dark_mode: settingsData.darkMode !== undefined ? settingsData.darkMode : false,
        timetable_mode: settingsData.timetableMode || 'personal'
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(payload);

      if (error) throw error;
      this.setLastSyncTime(new Date().toISOString());
    } catch (err) {
      console.error('Supabase profile sync error:', err.message);
    }
  }

  /* ----------------------------------------------------
     6. Migrate Local Guest Records to Supabase Cloud
  ----------------------------------------------------- */

  async migrateLocalDataToSupabase(userId) {
    const supabase = this.getSupabase();
    if (!supabase || !userId) return;

    const state = window.EduTrackState.getState();
    const hasSubjects = state.subjects && state.subjects.length > 0;
    const hasSchedule = state.schedule && state.schedule.length > 0;
    const hasLogs = state.logs && state.logs.length > 0;

    if (!hasSubjects && !hasSchedule && !hasLogs) return;

    this.isSyncing = true;
    this.notify();

    try {
      // 1. Sync Profile
      await this.syncProfile(state.profile, state.settings);

      // 2. Sync Subjects
      for (const sub of (state.subjects || [])) {
        await this.syncSubject(sub, 'upsert');
      }

      // 3. Sync Schedule Slots
      for (const slot of (state.schedule || [])) {
        await this.syncScheduleSlot(slot, 'upsert');
      }

      // 4. Sync Logs
      for (const log of (state.logs || [])) {
        await this.syncAttendanceLog(log, 'insert');
      }

      this.setLastSyncTime(new Date().toISOString());
      console.info('Local data successfully migrated to Supabase cloud!');
    } catch (err) {
      console.error('Error migrating local data to Supabase:', err);
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  /* ----------------------------------------------------
     7. Manual Cloud Push / Pull
  ----------------------------------------------------- */

  async syncNow() {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return { success: false, message: 'Please sign in to a Supabase account to sync.' };
    }

    try {
      await this.fetchUserData(userId);
      return { success: true, message: 'Cloud sync completed successfully.' };
    } catch (err) {
      return { success: false, message: err.message || 'Sync failed.' };
    }
  }
}

// Global Singleton Instance
window.ClassTrackSync = new SupabaseSyncManager();
