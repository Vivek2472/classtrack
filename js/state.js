/**
 * ClassTrack Engineering - Application State & Calculations Engine
 * Precision Academic Tracker with Supabase Cloud Sync Support
 */

const STORAGE_KEY = 'classtrack_student_state_v4';

const INITIAL_STATE = {
  profile: {
    name: 'Student',
    rollNo: '',
    program: '',
    semester: '',
    email: '',
    phone: '',
    gpa: null,
    targetThreshold: 75, // 75% minimum
    strictThreshold: 80, // strict 80% goal
    avatarUrl: ''
  },
  settings: {
    darkMode: false,
    timetableMode: 'personal',
    enableNotifications: true,
    autoBackup: true
  },
  subjects: [],
  schedule: [],
  upcomingLabs: [],
  logs: [],
  monthlyTrends: []
};

const SAMPLE_DEMO_DATA = INITIAL_STATE;

class StateManager {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage, using initial state:', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Error saving state:', e);
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
        fn(this.state);
      } catch (err) {
        console.error('Listener notification error:', err);
      }
    });
  }

  getState() {
    return this.state;
  }

  /* ----------------------------------------------------
     Calculations Engine for Engineering Students
  ----------------------------------------------------- */

  getOverallStats() {
    let totalClasses = 0;
    let attendedClasses = 0;
    let missedClasses = 0;

    (this.state.subjects || []).forEach(sub => {
      totalClasses += (sub.total || 0);
      attendedClasses += (sub.attended || 0);
      missedClasses += (sub.missed || 0);
    });

    const target = this.state.profile?.targetThreshold || 75;
    const percentage = totalClasses > 0 ? parseFloat(((attendedClasses / totalClasses) * 100).toFixed(1)) : 0;

    let safeAbsenceMargin = 0;
    let catchUpNeeded = 0;
    const targetFraction = target / 100;

    if (totalClasses === 0) {
      return {
        totalClasses: 0,
        attendedClasses: 0,
        missedClasses: 0,
        percentage: 0,
        hasData: false,
        safeAbsenceMargin: 0,
        catchUpNeeded: 0,
        status: 'neutral',
        targetThreshold: target
      };
    }

    if (percentage >= target) {
      safeAbsenceMargin = Math.floor((attendedClasses - (targetFraction * totalClasses)) / targetFraction);
      if (safeAbsenceMargin < 0) safeAbsenceMargin = 0;
    } else {
      catchUpNeeded = Math.ceil(((targetFraction * totalClasses) - attendedClasses) / (1 - targetFraction));
      if (catchUpNeeded < 0) catchUpNeeded = 0;
    }

    let status = 'safe';
    if (percentage < 65) {
      status = 'critical';
    } else if (percentage < target) {
      status = 'warning';
    }

    return {
      totalClasses,
      attendedClasses,
      missedClasses,
      percentage,
      hasData: true,
      safeAbsenceMargin,
      catchUpNeeded,
      status,
      targetThreshold: target
    };
  }

  getSubjectStats(subjectId) {
    const subject = (this.state.subjects || []).find(s => s.id === subjectId);
    if (!subject) return null;

    const target = this.state.profile?.targetThreshold || 75;
    const total = subject.total || 0;
    const attended = subject.attended || 0;
    const missed = subject.missed || 0;
    const percentage = total > 0 ? parseFloat(((attended / total) * 100).toFixed(1)) : 0;

    let safeAbsenceMargin = 0;
    let catchUpNeeded = 0;
    const targetFraction = target / 100;

    if (total === 0) {
      return {
        ...subject,
        percentage: 0,
        hasData: false,
        safeAbsenceMargin: 0,
        catchUpNeeded: 0,
        status: 'neutral',
        targetThreshold: target
      };
    }

    if (percentage >= target) {
      safeAbsenceMargin = Math.floor((attended - (targetFraction * total)) / targetFraction);
      if (safeAbsenceMargin < 0) safeAbsenceMargin = 0;
    } else {
      catchUpNeeded = Math.ceil(((targetFraction * total) - attended) / (1 - targetFraction));
      if (catchUpNeeded < 0) catchUpNeeded = 0;
    }

    let status = 'safe';
    if (percentage < 65) {
      status = 'critical';
    } else if (percentage < target) {
      status = 'warning';
    }

    return {
      ...subject,
      percentage,
      hasData: true,
      safeAbsenceMargin,
      catchUpNeeded,
      status,
      targetThreshold: target
    };
  }

  getTypeStats() {
    const types = {
      theory: { total: 0, attended: 0, percentage: 0 },
      lab: { total: 0, attended: 0, percentage: 0 },
      tutorial: { total: 0, attended: 0, percentage: 0 }
    };

    (this.state.subjects || []).forEach(sub => {
      const type = sub.type || 'theory';
      if (types[type]) {
        types[type].total += (sub.total || 0);
        types[type].attended += (sub.attended || 0);
      }
    });

    for (const key in types) {
      const item = types[key];
      item.percentage = item.total > 0 ? parseFloat(((item.attended / item.total) * 100).toFixed(1)) : 0;
    }

    return types;
  }

  /* ----------------------------------------------------
     Dynamic Schedule & Upcoming Labs Resolver
  ----------------------------------------------------- */

  getUpcomingSchedule(filter = 'all', limit = 4) {
    const schedule = this.state.schedule || [];
    const subjects = this.state.subjects || [];
    if (schedule.length === 0 || subjects.length === 0) return [];

    const dayIndices = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const now = new Date();
    const currentDayIdx = now.getDay();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const parseTimeToMins = (t) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const slotsWithMeta = [];

    schedule.forEach(slot => {
      const subject = subjects.find(s => s.id === slot.subjectId);
      if (!subject) return;

      const isLab = subject.type === 'lab' || (subject.name && subject.name.toLowerCase().includes('lab')) || (slot.room && slot.room.toLowerCase().includes('lab'));

      if (filter === 'lab' && !isLab) return;
      if (filter === 'theory' && isLab) return;

      const slotDayIdx = dayIndices[slot.day] !== undefined ? dayIndices[slot.day] : 1;
      const slotMins = parseTimeToMins(slot.time);

      let dayDiff = (slotDayIdx - currentDayIdx + 7) % 7;
      if (dayDiff === 0 && slotMins < currentMins) {
        dayDiff = 7; // Occurs next week
      }

      let dayLabel = slot.day;
      if (dayDiff === 0) {
        dayLabel = 'Today';
      } else if (dayDiff === 1) {
        dayLabel = 'Tomorrow';
      } else {
        dayLabel = slot.day.slice(0, 3);
      }

      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayDiff);
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const mm = monthNames[targetDate.getMonth()];
      const yy = String(targetDate.getFullYear()).slice(-2);

      slotsWithMeta.push({
        ...slot,
        subject,
        isLab,
        dayDiff,
        sortScore: dayDiff * 1440 + slotMins,
        dayLabel,
        formattedDate: `${dd}:${mm}:${yy}`,
        fullDateStr: `${slot.day.toUpperCase()} ${dd}:${mm}:${yy}`,
        shortDateStr: `${slot.day.slice(0, 3).toUpperCase()} ${dd}:${mm}:${yy}`,
        timingLabel: `${dayLabel}, ${slot.timeStr ? slot.timeStr.split(' - ')[0] : slot.time}`
      });
    });

    slotsWithMeta.sort((a, b) => a.sortScore - b.sortScore);
    return slotsWithMeta.slice(0, limit);
  }

  /* ----------------------------------------------------
     Attendance Actions
  ----------------------------------------------------- */

  logAttendance(subjectId, status, { date = new Date().toISOString().split('T')[0], timeStr = '', type = 'Lecture', remarks = '' } = {}) {
    const subject = this.state.subjects.find(s => s.id === subjectId);
    if (!subject) return false;

    if (status === 'present' || status === 'od' || status === 'other_faculty') {
      subject.total = (subject.total || 0) + 1;
      subject.attended = (subject.attended || 0) + 1;
    } else if (status === 'absent') {
      subject.total = (subject.total || 0) + 1;
      subject.missed = (subject.missed || 0) + 1;
    }

    const newLog = {
      id: 'log_' + Date.now(),
      date,
      timeStr: timeStr || 'Class Session',
      subjectId,
      type,
      status,
      remarks
    };

    this.state.logs.unshift(newLog);
    this.saveState();

    // Trigger Cloud Sync
    if (window.ClassTrackSync) {
      window.ClassTrackSync.syncAttendanceLog(newLog, 'insert');
    }

    return newLog;
  }

  updateLogStatus(logId, newStatus) {
    const log = this.state.logs.find(l => l.id === logId);
    if (!log) return false;

    const prevStatus = log.status;
    if (prevStatus === newStatus) return true;

    const subject = this.state.subjects.find(s => s.id === log.subjectId);
    if (subject) {
      // Revert previous status effects
      if (prevStatus === 'present' || prevStatus === 'od' || prevStatus === 'other_faculty') {
        subject.attended = Math.max(0, (subject.attended || 1) - 1);
        subject.total = Math.max(0, (subject.total || 1) - 1);
      } else if (prevStatus === 'absent') {
        subject.missed = Math.max(0, (subject.missed || 1) - 1);
        subject.total = Math.max(0, (subject.total || 1) - 1);
      }

      // Apply new status effects
      if (newStatus === 'present' || newStatus === 'od' || newStatus === 'other_faculty') {
        subject.attended = (subject.attended || 0) + 1;
        subject.total = (subject.total || 0) + 1;
      } else if (newStatus === 'absent') {
        subject.missed = (subject.missed || 0) + 1;
        subject.total = (subject.total || 0) + 1;
      }
    }

    log.status = newStatus;
    this.saveState();

    // Trigger Cloud Sync
    if (window.ClassTrackSync) {
      window.ClassTrackSync.syncAttendanceLog(log, 'update');
    }

    return true;
  }

  deleteLog(logId) {
    const logIndex = this.state.logs.findIndex(l => l.id === logId);
    if (logIndex === -1) return false;

    const log = this.state.logs[logIndex];
    const subject = this.state.subjects.find(s => s.id === log.subjectId);
    if (subject) {
      if (log.status === 'present' || log.status === 'od' || log.status === 'other_faculty') {
        subject.attended = Math.max(0, (subject.attended || 1) - 1);
        subject.total = Math.max(0, (subject.total || 1) - 1);
      } else if (log.status === 'absent') {
        subject.missed = Math.max(0, (subject.missed || 1) - 1);
        subject.total = Math.max(0, (subject.total || 1) - 1);
      }
    }

    this.state.logs.splice(logIndex, 1);
    this.saveState();

    // Trigger Cloud Sync
    if (window.ClassTrackSync) {
      window.ClassTrackSync.syncAttendanceLog({ id: logId }, 'delete');
      if (subject) {
        window.ClassTrackSync.syncSubject(subject, 'upsert');
      }
    }

    return true;
  }

  /* ----------------------------------------------------
     Subject Management (Add, Update, Delete)
  ----------------------------------------------------- */

  addSubject(data) {
    const id = 'sub_' + Date.now();
    const roomVal = (data.room && data.room.trim()) ? data.room.trim() : 'TBA';
    
    // Auto-generate or format optional code
    let codeVal = (data.code && data.code.trim()) ? data.code.trim().toUpperCase() : '';
    if (!codeVal) {
      if (data.name && data.name.trim()) {
        const words = data.name.trim().split(/\s+/);
        codeVal = words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
        if (codeVal.length < 2) codeVal = 'CRS';
      } else {
        codeVal = 'ENG';
      }
    }

    const newSubject = {
      id,
      code: codeVal,
      aliasCode: data.aliasCode || codeVal,
      name: data.name || 'Course Subject',
      category: data.category || 'Core',
      type: data.type || 'theory',
      credits: data.credits !== '' && data.credits !== undefined ? (parseInt(data.credits, 10) || 0) : 3,
      instructor: data.instructor || 'Faculty Member',
      room: roomVal,
      total: parseInt(data.total, 10) || 0,
      attended: parseInt(data.attended, 10) || 0,
      missed: parseInt(data.missed, 10) || 0,
      color: data.color || '#3B82F6',
      forecast: 'Active course.'
    };

    this.state.subjects.push(newSubject);
    this.saveState();

    // Trigger Cloud Sync
    if (window.ClassTrackSync) {
      window.ClassTrackSync.syncSubject(newSubject, 'upsert');
    }

    return newSubject;
  }

  updateSubject(subjectId, data) {
    const index = this.state.subjects.findIndex(s => s.id === subjectId);
    if (index === -1) return false;

    const existing = this.state.subjects[index];
    let codeVal = (data.code !== undefined && data.code.trim()) ? data.code.trim().toUpperCase() : existing.code;
    const roomVal = (data.room !== undefined && data.room.trim()) ? data.room.trim() : (existing.room || 'TBA');

    this.state.subjects[index] = {
      ...existing,
      name: data.name !== undefined ? data.name : existing.name,
      code: codeVal,
      category: data.category !== undefined ? data.category : existing.category,
      type: data.type !== undefined ? data.type : existing.type,
      credits: data.credits !== undefined && data.credits !== '' ? (parseInt(data.credits, 10) || 0) : existing.credits,
      instructor: data.instructor !== undefined ? data.instructor : existing.instructor,
      room: roomVal,
      attended: data.attended !== undefined ? parseInt(data.attended, 10) : existing.attended,
      total: data.total !== undefined ? parseInt(data.total, 10) : existing.total,
      missed: data.missed !== undefined ? parseInt(data.missed, 10) : existing.missed
    };

    this.saveState();

    // Trigger Cloud Sync
    if (window.ClassTrackSync) {
      window.ClassTrackSync.syncSubject(this.state.subjects[index], 'upsert');
    }

    return this.state.subjects[index];
  }

  deleteSubject(subjectId) {
    this.state.subjects = this.state.subjects.filter(s => s.id !== subjectId);
    this.state.schedule = this.state.schedule.filter(s => s.subjectId !== subjectId);
    this.state.logs = this.state.logs.filter(l => l.subjectId !== subjectId);
    this.saveState();

    // Trigger Cloud Sync
    if (window.ClassTrackSync) {
      window.ClassTrackSync.syncSubject({ id: subjectId }, 'delete');
    }

    return true;
  }

  /* ----------------------------------------------------
     Schedule Management (Add, Update, Delete)
  ----------------------------------------------------- */

  addScheduleSlot(data) {
    const roomVal = (data.room && data.room.trim()) ? data.room.trim() : 'TBA';
    const newSlot = {
      id: 'sch_' + Date.now(),
      day: data.day || 'Monday',
      time: data.time || '09:00',
      duration: parseFloat(data.duration) || 1,
      timeStr: data.timeStr || `${data.time || '09:00'}`,
      subjectId: data.subjectId,
      room: roomVal
    };

    this.state.schedule.push(newSlot);
    this.saveState();

    // Trigger Cloud Sync
    if (window.ClassTrackSync) {
      window.ClassTrackSync.syncScheduleSlot(newSlot, 'upsert');
    }

    return newSlot;
  }

  updateScheduleSlot(slotId, data) {
    const index = this.state.schedule.findIndex(s => s.id === slotId);
    if (index === -1) return false;

    const existing = this.state.schedule[index];
    const roomVal = (data.room !== undefined && data.room.trim()) ? data.room.trim() : (existing.room || 'TBA');

    this.state.schedule[index] = {
      ...existing,
      subjectId: data.subjectId !== undefined ? data.subjectId : existing.subjectId,
      day: data.day !== undefined ? data.day : existing.day,
      time: data.time !== undefined ? data.time : existing.time,
      duration: data.duration !== undefined ? parseFloat(data.duration) : existing.duration,
      timeStr: data.timeStr !== undefined ? data.timeStr : existing.timeStr,
      room: roomVal
    };

    this.saveState();

    // Trigger Cloud Sync
    if (window.ClassTrackSync) {
      window.ClassTrackSync.syncScheduleSlot(this.state.schedule[index], 'upsert');
    }

    return this.state.schedule[index];
  }

  deleteScheduleSlot(slotId) {
    this.state.schedule = this.state.schedule.filter(s => s.id !== slotId);
    this.saveState();

    // Trigger Cloud Sync
    if (window.ClassTrackSync) {
      window.ClassTrackSync.syncScheduleSlot({ id: slotId }, 'delete');
    }

    return true;
  }

  /* ----------------------------------------------------
     Profile & Settings
  ----------------------------------------------------- */

  updateProfile(profileData) {
    this.state.profile = {
      ...this.state.profile,
      ...profileData
    };
    this.saveState();

    // Trigger Cloud Sync
    if (window.ClassTrackSync) {
      window.ClassTrackSync.syncProfile(this.state.profile, this.state.settings);
    }
  }

  toggleDarkMode(force) {
    const isDark = typeof force === 'boolean' ? force : !this.state.settings.darkMode;
    this.state.settings.darkMode = isDark;
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    this.saveState();

    // Trigger Cloud Sync
    if (window.ClassTrackSync) {
      window.ClassTrackSync.syncProfile(this.state.profile, this.state.settings);
    }

    return isDark;
  }

  resetToDefault() {
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.saveState();
  }

  loadDemoData() {
    this.state = JSON.parse(JSON.stringify(SAMPLE_DEMO_DATA));
    this.saveState();
  }
}

// Global Singleton Instance & Aliases
window.ClassTrackState = window.EduTrackState = new StateManager();
