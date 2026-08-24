/**
 * ClassTrack Engineering - Application Controller & Router
 * Precision Academic Tracker
 */

window.ClassTrackApp = {
  currentView: 'dashboard',
  currentParams: null,
  historyStack: [],
  clockInterval: null,

  init() {
    // Sync dark mode setting
    const state = window.EduTrackState.getState();
    if (state.settings.darkMode) {
      document.body.classList.add('dark');
    }

    // Subscribe to state changes
    window.EduTrackState.subscribe(() => {
      this.updateProfileBadges();
      this.refreshCurrentView();
    });

    // Subscribe to auth changes
    window.ClassTrackAuth.subscribe(() => {
      this.updateProfileBadges();
    });

    // Setup global search listener
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleGlobalSearch(e.target.value));
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape to close modal is always supported
      if (e.key === 'Escape') {
        this.closeModal();
        return;
      }

      // Don't trigger if typing in an input, select, textarea, or contentEditable, or in auth mode
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName) || e.target?.isContentEditable) return;
      if (document.body.classList.contains('auth-mode')) return;

      // CRITICAL: Ignore standard browser shortcuts (Ctrl, Cmd, Meta)
      // E.g., Ctrl+D (Bookmark), Ctrl+S (Save), Ctrl+P (Print), Ctrl+A (Select all), Ctrl+T (New tab)
      if (e.ctrlKey || e.metaKey) return;

      const modalActive = document.getElementById('modal-overlay')?.classList.contains('active');
      if (modalActive) return;

      // Allow intentional navigation via Alt + Key
      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'd') { e.preventDefault(); this.navigate('dashboard'); }
        else if (key === 's') { e.preventDefault(); this.navigate('subjects'); }
        else if (key === 't') { e.preventDefault(); this.navigate('schedule'); }
        else if (key === 'a') { e.preventDefault(); this.navigate('analytics'); }
        else if (key === 'p') { e.preventDefault(); this.navigate('profile'); }
        else if (key === 'm') { e.preventDefault(); this.openLogModal(); }
        else if (key === 'l') { e.preventDefault(); this.openLogModal(); }
      }
    });

    // Handle browser back / forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.view) {
        this.navigate(e.state.view, e.state.params, true);
      }
    });

    // Start Live Real-time Clock & update profile badges immediately
    this.startRealtimeClock();
    this.updateProfileBadges();

    const hash = window.location.hash.replace('#', '');
    const authViews = ['login', 'signup', 'forgot-password', 'reset-password'];

    if (!window.ClassTrackAuth.isAuthenticated()) {
      if (hash === 'signup') {
        window.location.replace('signup.html');
        return;
      }
      if (['forgot-password', 'reset-password'].includes(hash)) {
        window.location.replace('login.html#' + hash);
        return;
      }
      window.location.replace('login.html');
      return;
    } else {
      this.updateProfileBadges();
      if (hash && !authViews.includes(hash)) {
        this.navigate(hash, null, true);
      } else {
        this.navigate('dashboard', null, true);
      }
    }
  },

  onAuthSuccess() {
    this.updateProfileBadges();
    this.navigate('dashboard', null, true);
  },

  /* ----------------------------------------------------
     Live Real-Time Clock & Calendar Sync
  ----------------------------------------------------- */

  startRealtimeClock() {
    const updateClock = () => {
      const clockEl = document.getElementById('clock-display');
      if (!clockEl) return;

      const now = new Date();
      const dayName = now.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      clockEl.textContent = `${dayName}, ${dateStr} • ${timeStr}`;
    };

    updateClock();
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.clockInterval = setInterval(updateClock, 1000);
  },

  /* ----------------------------------------------------
     Navigation & History Router
  ----------------------------------------------------- */

  navigate(viewName, params = null, isBack = false) {
    const authViews = ['login', 'signup', 'forgot-password', 'reset-password'];
    const isAuthView = authViews.includes(viewName);

    // If navigating to an auth view, direct to the dedicated HTML page
    if (isAuthView) {
      if (viewName === 'signup') {
        window.location.href = 'signup.html';
      } else {
        window.location.href = viewName === 'login' ? 'login.html' : `login.html#${viewName}`;
      }
      return;
    }

    // If attempting to access app views while not authenticated, redirect to login
    if (!window.ClassTrackAuth.isAuthenticated()) {
      window.location.replace('login.html');
      return;
    }

    if (!isBack && this.currentView && (this.currentView !== viewName || this.currentParams !== params)) {
      this.historyStack.push({ view: this.currentView, params: this.currentParams });
      if (this.historyStack.length > 50) this.historyStack.shift();
    }

    this.currentView = viewName;
    this.currentParams = params;
    const container = document.getElementById('view-content');
    if (!container) return;

    // Toggle auth-mode body and html classes for full-screen auth layout vs app layout
    if (isAuthView) {
      document.body.classList.add('auth-mode');
      document.documentElement.classList.add('auth-mode');
    } else {
      document.body.classList.remove('auth-mode');
      document.documentElement.classList.remove('auth-mode');
    }

    // Push browser state
    try {
      window.history.pushState({ view: viewName, params }, '', `#${viewName}`);
    } catch (e) {}

    // Update active nav links in Desktop sidebar
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.getAttribute('data-view') === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Update active nav links in Mobile bottom nav bar
    document.querySelectorAll('.mobile-nav-item').forEach(el => {
      if (el.getAttribute('data-view') === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Update top header title
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
      if (viewName === 'dashboard') headerTitle.textContent = 'Overview';
      else if (viewName === 'subjects') headerTitle.textContent = 'Subjects & Courses';
      else if (viewName === 'subjectDetail') headerTitle.textContent = 'Subject Detail';
      else if (viewName === 'schedule') headerTitle.textContent = 'Timetable Schedule';
      else if (viewName === 'analytics') headerTitle.textContent = 'Semester Analytics';
      else if (viewName === 'profile') headerTitle.textContent = 'Student Profile';
    }

    // Close mobile drawer if open
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render corresponding view
    switch (viewName) {
      case 'login':
        window.ClassTrackAuthView.renderLogin(container);
        break;
      case 'signup':
        window.ClassTrackAuthView.renderSignUp(container);
        break;
      case 'forgot-password':
        window.ClassTrackAuthView.renderForgotPassword(container);
        break;
      case 'reset-password':
        window.ClassTrackAuthView.renderResetPassword(container);
        break;
      case 'profile':
        window.ClassTrackProfile.render(container);
        break;
      case 'dashboard':
        window.EduTrackDashboard.render(container);
        break;
      case 'subjects':
        window.EduTrackSubjects.render(container);
        break;
      case 'subjectDetail':
        window.EduTrackSubjectDetail.render(container, params);
        break;
      case 'schedule':
        window.EduTrackSchedule.render(container);
        break;
      case 'analytics':
        window.EduTrackAnalytics.render(container);
        break;
      default:
        window.EduTrackDashboard.render(container);
    }
  },

  goBack(fallbackView = 'dashboard') {
    if (this.historyStack.length > 0) {
      const prev = this.historyStack.pop();
      this.navigate(prev.view, prev.params, true);
    } else {
      this.navigate(fallbackView, null, true);
    }
  },

  showSubjectDetail(subjectId) {
    this.navigate('subjectDetail', subjectId);
  },

  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  refreshCurrentView() {
    const container = document.getElementById('view-content');
    if (!container) return;

    if (this.currentView === 'dashboard') window.EduTrackDashboard.render(container);
    else if (this.currentView === 'subjects') window.EduTrackSubjects.render(container);
    else if (this.currentView === 'subjectDetail') window.EduTrackSubjectDetail.render(container, this.currentParams);
    else if (this.currentView === 'schedule') window.EduTrackSchedule.render(container);
    else if (this.currentView === 'analytics') window.EduTrackAnalytics.render(container);
    else if (this.currentView === 'profile') window.ClassTrackProfile.render(container);
  },

  updateProfileBadges() {
    const state = window.EduTrackState.getState();
    const authUser = window.ClassTrackAuth ? window.ClassTrackAuth.getCurrentUser() : null;

    const name = state.profile?.name || authUser?.fullName || 'Student';
    const program = state.profile?.program || authUser?.branch || 'Academic Profile';

    const studentNames = document.querySelectorAll('.student-name');
    const studentPrograms = document.querySelectorAll('.student-program');

    studentNames.forEach(el => el.textContent = name);
    studentPrograms.forEach(el => el.textContent = program);
  },

  /* ----------------------------------------------------
     Global Search
  ----------------------------------------------------- */

  handleGlobalSearch(query) {
    const resultsContainer = document.getElementById('search-dropdown-results');
    if (!resultsContainer) return;

    if (!query || query.trim().length === 0) {
      resultsContainer.classList.add('hidden');
      return;
    }

    const q = query.toLowerCase().trim();
    const state = window.EduTrackState.getState();
    const matchingSubjects = (state.subjects || []).filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.code && s.code.toLowerCase().includes(q)) || 
      (s.instructor && s.instructor.toLowerCase().includes(q)) ||
      (s.room && s.room.toLowerCase().includes(q))
    );

    if (matchingSubjects.length === 0) {
      resultsContainer.innerHTML = `
        <div class="p-3 text-center text-xs font-label-sm" style="color: var(--color-on-surface-variant);">
          No matching courses or instructors found.
        </div>
      `;
    } else {
      resultsContainer.innerHTML = matchingSubjects.map(sub => `
        <div class="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b last:border-b-0" style="border-color: var(--color-outline-variant);" onclick="window.ClassTrackApp.selectSearchResult('${sub.id}')">
          <div>
            <div class="font-body-md font-semibold" style="color: var(--color-on-background);">${sub.name}</div>
            <div class="font-label-sm" style="color: var(--color-on-surface-variant);">${sub.code || ''} • ${sub.instructor} • ${sub.room || 'TBA'}</div>
          </div>
          <span class="status-chip status-safe">${sub.attended}/${sub.total}</span>
        </div>
      `).join('');
    }

    resultsContainer.classList.remove('hidden');
  },

  selectSearchResult(subjectId) {
    const resultsContainer = document.getElementById('search-dropdown-results');
    const searchInput = document.getElementById('global-search');
    if (resultsContainer) resultsContainer.classList.add('hidden');
    if (searchInput) searchInput.value = '';
    this.showSubjectDetail(subjectId);
  },

  /* ----------------------------------------------------
     Time & Duration Sync Helpers for Timetable Slot Modal
  ----------------------------------------------------- */

  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  },

  minutesToTime(mins) {
    const norm = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(norm / 60);
    const m = norm % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  },

  formatTime12Hour(timeStr) {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${ampm}`;
  },

  formatDurationHuman(minsOrHours, unit = 'auto') {
    let totalMinutes = 0;
    if (typeof minsOrHours === 'number') {
      if (unit === 'hours') {
        totalMinutes = Math.round(minsOrHours * 60);
      } else if (unit === 'mins') {
        totalMinutes = Math.round(minsOrHours);
      } else {
        // Auto: if <= 8, interpret as hours, else minutes
        totalMinutes = minsOrHours <= 8 ? Math.round(minsOrHours * 60) : Math.round(minsOrHours);
      }
    } else if (typeof minsOrHours === 'string') {
      const num = parseFloat(minsOrHours);
      if (isNaN(num)) return minsOrHours || '1 hr';
      if (unit === 'hours') {
        totalMinutes = Math.round(num * 60);
      } else if (unit === 'mins') {
        totalMinutes = Math.round(num);
      } else {
        totalMinutes = num <= 8 ? Math.round(num * 60) : Math.round(num);
      }
    }

    if (totalMinutes <= 0) return '0 mins';
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hrs === 0) {
      return `${mins} mins`;
    } else if (mins === 0) {
      return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`;
    } else {
      return `${hrs} hr ${mins} mins`;
    }
  },

  getAcademicDateForDay(dayName) {
    const dayIndices = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 0 };
    const targetDayIdx = dayIndices[dayName] !== undefined ? dayIndices[dayName] : 1;
    const now = new Date();
    const currentDayIdx = now.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = currentDayIdx === 0 ? -6 : 1 - currentDayIdx;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + (targetDayIdx - 1));

    const dd = String(targetDate.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const mm = monthNames[targetDate.getMonth()];
    const yy = String(targetDate.getFullYear()).slice(-2);
    const dayUpper = (dayName || 'Monday').toUpperCase();

    return {
      dayUpper,
      formattedDate: `${dd}:${mm}:${yy}`,
      fullHeader: `${dayUpper} ${dd}:${mm}:${yy}`,
      shortHeader: `${dayUpper.slice(0, 3)} ${dd}:${mm}:${yy}`
    };
  },
  syncSlotTimes(source) {
    const startInput = document.getElementById('slot-start-time');
    const endInput = document.getElementById('slot-end-time');
    const daySelect = document.querySelector('select[name="day"]');
    const summarySpan = document.getElementById('slot-time-summary');
    if (!startInput || !endInput) return;

    if (source === 'start' && startInput.value) {
      const startM = this.timeToMinutes(startInput.value);
      if (!endInput.value || this.timeToMinutes(endInput.value) <= startM) {
        // Automatically default end time to 1 hour after start time
        endInput.value = this.minutesToTime(startM + 60);
      }
    }

    const currentDay = daySelect ? daySelect.value : 'Monday';
    const academicDate = this.getAcademicDateForDay(currentDay);

    if (summarySpan && startInput.value && endInput.value) {
      const startM = this.timeToMinutes(startInput.value);
      const endM = this.timeToMinutes(endInput.value);
      const diffMins = endM > startM ? (endM - startM) : 60;
      const durationHuman = this.formatDurationHuman(diffMins, 'mins');
      summarySpan.textContent = `${academicDate.shortHeader} ${this.formatTime12Hour(startInput.value)} - ${this.formatTime12Hour(endInput.value)} (${durationHuman})`;
    }
  },

  /* ----------------------------------------------------
     Styled CSS Confirmation Modal (Default JS Confirm Replaced)
  ----------------------------------------------------- */

  confirmDialog({ title, message, icon = 'help', confirmText = 'Confirm', confirmClass = 'btn-primary', onConfirm }) {
    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalContent || !modalOverlay) return;

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${confirmClass.includes('danger') ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'}">
            <span class="material-symbols-outlined">${icon}</span>
          </div>
          <div>
            <h3 class="font-headline-md font-bold" style="color: var(--color-on-background);">${title}</h3>
            <p class="font-body-sm mt-1" style="color: var(--color-on-surface-variant);">${message}</p>
          </div>
        </div>

        <div class="flex justify-end gap-2.5 mt-6 pt-4 border-t" style="border-color: var(--color-outline-variant);">
          <button type="button" class="btn btn-secondary" onclick="window.ClassTrackApp.closeModal()">Cancel</button>
          <button type="button" class="btn ${confirmClass}" id="dialog-confirm-action">${confirmText}</button>
        </div>
      </div>
    `;

    modalOverlay.classList.add('active');

    const confirmBtn = document.getElementById('dialog-confirm-action');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        this.closeModal();
        if (typeof onConfirm === 'function') onConfirm();
      };
    }
  },

  /* ----------------------------------------------------
     Modals: Subject Management
  ----------------------------------------------------- */

  openAddSubjectModal() {
    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalContent || !modalOverlay) return;

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b mb-6" style="border-color: var(--color-outline-variant);">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">add_box</span>
            <h3 class="font-headline-md font-bold" style="color: var(--color-on-background);">Add New Course / Subject</h3>
          </div>
          <button class="btn-icon" onclick="window.ClassTrackApp.closeModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="form-add-subject" onsubmit="window.ClassTrackApp.submitAddSubject(event)">
          <div class="form-group">
            <label class="form-label">Subject / Course Name <span class="text-primary">*</span></label>
            <input type="text" name="name" class="form-input font-semibold" placeholder="e.g. Data Structures, Economics, Biology" required>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Course Code <span style="text-transform: none; font-weight: normal; opacity: 0.7;">(Optional)</span></label>
              <input type="text" name="code" class="form-input" placeholder="e.g. CS101, ECO201 (Auto-generated if empty)">
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select name="category" class="form-select">
                <option value="Core">Core / Major Subject</option>
                <option value="Practical">Practical / Lab</option>
                <option value="Elective">Elective Subject</option>
                <option value="Humanities">Humanities / Gen-Ed</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="form-group">
              <label class="form-label">Course Type</label>
              <select name="type" class="form-select">
                <option value="theory">Theory / Lecture</option>
                <option value="lab">Lab / Practical</option>
                <option value="tutorial">Tutorial / Discussion</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Credits <span style="text-transform: none; font-weight: normal; opacity: 0.7;">(Optional)</span></label>
              <input type="number" name="credits" class="form-input" value="3" min="0" max="10">
            </div>
            <div class="form-group">
              <label class="form-label">Room / Hall <span style="text-transform: none; font-weight: normal; opacity: 0.7;">(Optional)</span></label>
              <input type="text" name="room" class="form-input" placeholder="e.g. Room 302, Hall B">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Instructor Name <span style="text-transform: none; font-weight: normal; opacity: 0.7;">(Optional)</span></label>
            <input type="text" name="instructor" class="form-input" placeholder="e.g. Prof. Alan Turing">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Initial Attended Classes</label>
              <input type="number" name="attended" class="form-input" value="0" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Initial Total Classes</label>
              <input type="number" name="total" class="form-input" value="0" min="0">
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t" style="border-color: var(--color-outline-variant);">
            <button type="button" class="btn btn-secondary" onclick="window.ClassTrackApp.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Course</button>
          </div>
        </form>
      </div>
    `;

    modalOverlay.classList.add('active');
  },

  submitAddSubject(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const subjectData = {
      name: formData.get('name'),
      code: formData.get('code'),
      category: formData.get('category'),
      type: formData.get('type'),
      credits: formData.get('credits'),
      room: formData.get('room'),
      instructor: formData.get('instructor'),
      attended: formData.get('attended'),
      total: formData.get('total')
    };

    window.EduTrackState.addSubject(subjectData);
    this.closeModal();
    this.showToast(`Added "${subjectData.name}" successfully!`, 'success');
  },

  openEditSubjectModal(subjectId) {
    const state = window.EduTrackState.getState();
    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalContent || !modalOverlay) return;

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b mb-6" style="border-color: var(--color-outline-variant);">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">edit_note</span>
            <h3 class="font-headline-md font-bold" style="color: var(--color-on-background);">Edit Course</h3>
          </div>
          <button class="btn-icon" onclick="window.ClassTrackApp.closeModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="form-edit-subject" onsubmit="window.ClassTrackApp.submitEditSubject(event, '${subject.id}')">
          <div class="form-group">
            <label class="form-label">Subject / Course Name <span class="text-primary">*</span></label>
            <input type="text" name="name" class="form-input font-semibold" value="${subject.name}" required>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Course Code <span style="text-transform: none; font-weight: normal; opacity: 0.7;">(Optional)</span></label>
              <input type="text" name="code" class="form-input" value="${subject.code || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select name="category" class="form-select">
                <option value="Core" ${subject.category === 'Core' ? 'selected' : ''}>Core / Major Subject</option>
                <option value="Practical" ${subject.category === 'Practical' ? 'selected' : ''}>Practical / Lab</option>
                <option value="Elective" ${subject.category === 'Elective' ? 'selected' : ''}>Elective Subject</option>
                <option value="Humanities" ${subject.category === 'Humanities' ? 'selected' : ''}>Humanities / Gen-Ed</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="form-group">
              <label class="form-label">Course Type</label>
              <select name="type" class="form-select">
                <option value="theory" ${subject.type === 'theory' ? 'selected' : ''}>Theory / Lecture</option>
                <option value="lab" ${subject.type === 'lab' ? 'selected' : ''}>Lab / Practical</option>
                <option value="tutorial" ${subject.type === 'tutorial' ? 'selected' : ''}>Tutorial / Discussion</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Credits <span style="text-transform: none; font-weight: normal; opacity: 0.7;">(Optional)</span></label>
              <input type="number" name="credits" class="form-input" value="${subject.credits || 3}" min="0" max="10">
            </div>
            <div class="form-group">
              <label class="form-label">Room / Hall <span style="text-transform: none; font-weight: normal; opacity: 0.7;">(Optional)</span></label>
              <input type="text" name="room" class="form-input" value="${subject.room && subject.room !== 'TBA' ? subject.room : ''}" placeholder="e.g. Room 302, Hall B">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Instructor Name <span style="text-transform: none; font-weight: normal; opacity: 0.7;">(Optional)</span></label>
            <input type="text" name="instructor" class="form-input" value="${subject.instructor || ''}" placeholder="e.g. Prof. Alan Turing">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Attended Classes</label>
              <input type="number" name="attended" class="form-input" value="${subject.attended || 0}" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Total Classes</label>
              <input type="number" name="total" class="form-input" value="${subject.total || 0}" min="0">
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t" style="border-color: var(--color-outline-variant);">
            <button type="button" class="btn btn-secondary" onclick="window.ClassTrackApp.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    modalOverlay.classList.add('active');
  },

  submitEditSubject(e, subjectId) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedData = {
      name: formData.get('name'),
      code: formData.get('code'),
      category: formData.get('category'),
      type: formData.get('type'),
      credits: formData.get('credits'),
      room: formData.get('room'),
      instructor: formData.get('instructor'),
      attended: formData.get('attended'),
      total: formData.get('total')
    };

    window.EduTrackState.updateSubject(subjectId, updatedData);
    this.closeModal();
    this.showToast(`Updated "${updatedData.name}" successfully!`, 'success');
  },

  /* ----------------------------------------------------
     Modals: Schedule Slot Management (Add & Edit)
  ----------------------------------------------------- */

  openAddSlotModal() {
    const state = window.EduTrackState.getState();
    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalContent || !modalOverlay) return;

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b mb-6" style="border-color: var(--color-outline-variant);">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">schedule</span>
            <h3 class="font-headline-md font-bold" style="color: var(--color-on-background);">Add Timetable Slot</h3>
          </div>
          <button class="btn-icon" onclick="window.ClassTrackApp.closeModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="form-add-slot" onsubmit="window.ClassTrackApp.submitAddSlot(event)">
          <div class="form-group">
            <label class="form-label">Subject</label>
            <select name="subjectId" class="form-select" required>
              ${state.subjects.length === 0 ? '<option value="">(Please add a course first)</option>' : state.subjects.map(s => `<option value="${s.id}">${s.name} (${s.code || 'CRS'})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Day of the Week</label>
            <select name="day" class="form-select" required>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>

          <!-- Synchronized Start Time & End Time -->
          <div class="p-3.5 sm:p-4 rounded-xl mb-4" style="background-color: var(--color-surface-container-low); border: 1px solid var(--color-outline-variant);">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 mb-3">
              <span class="font-label-sm uppercase font-bold text-xs" style="color: var(--color-on-surface-variant);">Time & Schedule</span>
              <span id="slot-time-summary" class="font-label-sm px-2.5 py-1 rounded font-mono font-bold text-xs" style="background-color: var(--color-surface-container-high); color: var(--color-on-surface); word-break: break-word;">
                09:00 AM - 10:00 AM (1 hr)
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-semibold">Start Time</label>
                <input type="time" name="startTime" id="slot-start-time" value="09:00" class="form-input font-mono font-bold" required oninput="window.ClassTrackApp.syncSlotTimes('start')">
              </div>

              <div class="form-group mb-0">
                <label class="form-label text-xs font-semibold">End Time</label>
                <input type="time" name="endTime" id="slot-end-time" value="10:00" class="form-input font-mono font-bold" required oninput="window.ClassTrackApp.syncSlotTimes('end')">
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Room / Lab <span style="text-transform: none; font-weight: normal; opacity: 0.7;">(Optional)</span></label>
            <input type="text" name="room" class="form-input" placeholder="e.g. Hall B / CAD Lab (Leave blank for TBA)">
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t" style="border-color: var(--color-outline-variant);">
            <button type="button" class="btn btn-secondary" onclick="window.ClassTrackApp.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Slot</button>
          </div>
        </form>
      </div>
    `;

    modalOverlay.classList.add('active');
    this.syncSlotTimes('start');
  },

  submitAddSlot(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const subjectId = formData.get('subjectId');
    if (!subjectId) {
      this.showToast('Please add a course first before creating a timetable slot.', 'warning');
      return;
    }

    const startTime = formData.get('startTime') || '09:00';
    const endTime = formData.get('endTime') || '10:00';
    const startM = this.timeToMinutes(startTime);
    const endM = this.timeToMinutes(endTime);
    const diffMins = endM > startM ? (endM - startM) : 60;
    const duration = parseFloat((diffMins / 60).toFixed(2));
    const room = (formData.get('room') && formData.get('room').trim()) ? formData.get('room').trim() : 'TBA';
    const timeStr = `${this.formatTime12Hour(startTime)} - ${this.formatTime12Hour(endTime)}`;
    const durationLabel = this.formatDurationHuman(diffMins, 'mins');

    const slotData = {
      subjectId: subjectId,
      day: formData.get('day'),
      time: startTime,
      duration: duration,
      room: room,
      timeStr: timeStr
    };

    window.EduTrackState.addScheduleSlot(slotData);
    this.closeModal();
    this.showToast(`Timetable slot added: ${timeStr} (${durationLabel})`, 'success');
  },

  openEditSlotModal(slotId) {
    const state = window.EduTrackState.getState();
    const slot = (state.schedule || []).find(s => s.id === slotId);
    if (!slot) return;

    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalContent || !modalOverlay) return;

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b mb-6" style="border-color: var(--color-outline-variant);">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">edit_calendar</span>
            <h3 class="font-headline-md font-bold" style="color: var(--color-on-background);">Edit Timetable Slot</h3>
          </div>
          <button class="btn-icon" onclick="window.ClassTrackApp.closeModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="form-edit-slot" onsubmit="window.ClassTrackApp.submitEditSlot(event, '${slot.id}')">
          <div class="form-group">
            <label class="form-label">Subject</label>
            <select name="subjectId" class="form-select" required>
              ${state.subjects.map(s => `<option value="${s.id}" ${s.id === slot.subjectId ? 'selected' : ''}>${s.name} (${s.code || 'CRS'})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Day of the Week</label>
            <select name="day" class="form-select" required>
              <option value="Monday" ${slot.day === 'Monday' ? 'selected' : ''}>Monday</option>
              <option value="Tuesday" ${slot.day === 'Tuesday' ? 'selected' : ''}>Tuesday</option>
              <option value="Wednesday" ${slot.day === 'Wednesday' ? 'selected' : ''}>Wednesday</option>
              <option value="Thursday" ${slot.day === 'Thursday' ? 'selected' : ''}>Thursday</option>
              <option value="Friday" ${slot.day === 'Friday' ? 'selected' : ''}>Friday</option>
              <option value="Saturday" ${slot.day === 'Saturday' ? 'selected' : ''}>Saturday</option>
            </select>
          </div>

          <!-- Synchronized Start Time & End Time -->
          <div class="p-3.5 sm:p-4 rounded-xl mb-4" style="background-color: var(--color-surface-container-low); border: 1px solid var(--color-outline-variant);">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 mb-3">
              <span class="font-label-sm uppercase font-bold text-xs" style="color: var(--color-on-surface-variant);">Time & Schedule</span>
              <span id="slot-time-summary" class="font-label-sm px-2.5 py-1 rounded font-mono font-bold text-xs" style="background-color: var(--color-surface-container-high); color: var(--color-on-surface); word-break: break-word;">
                ${slot.timeStr || 'Slot Time'}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-semibold">Start Time</label>
                <input type="time" name="startTime" id="slot-start-time" value="${slot.time || '09:00'}" class="form-input font-mono font-bold" required oninput="window.ClassTrackApp.syncSlotTimes('start')">
              </div>

              <div class="form-group mb-0">
                <label class="form-label text-xs font-semibold">End Time</label>
                <input type="time" name="endTime" id="slot-end-time" value="${this.minutesToTime(this.timeToMinutes(slot.time || '09:00') + Math.round((slot.duration || 1) * 60))}" class="form-input font-mono font-bold" required oninput="window.ClassTrackApp.syncSlotTimes('end')">
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Room / Lab <span style="text-transform: none; font-weight: normal; opacity: 0.7;">(Optional)</span></label>
            <input type="text" name="room" class="form-input" value="${slot.room && slot.room !== 'TBA' ? slot.room : ''}" placeholder="e.g. Hall B / CAD Lab">
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t" style="border-color: var(--color-outline-variant);">
            <button type="button" class="btn btn-secondary" onclick="window.ClassTrackApp.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    modalOverlay.classList.add('active');
    this.syncSlotTimes('start');
  },

  submitEditSlot(e, slotId) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const startTime = formData.get('startTime') || '09:00';
    const endTime = formData.get('endTime') || '10:00';
    const startM = this.timeToMinutes(startTime);
    const endM = this.timeToMinutes(endTime);
    const diffMins = endM > startM ? (endM - startM) : 60;
    const duration = parseFloat((diffMins / 60).toFixed(2));
    const room = (formData.get('room') && formData.get('room').trim()) ? formData.get('room').trim() : 'TBA';
    const timeStr = `${this.formatTime12Hour(startTime)} - ${this.formatTime12Hour(endTime)}`;
    const durationLabel = this.formatDurationHuman(diffMins, 'mins');

    const slotData = {
      subjectId: formData.get('subjectId'),
      day: formData.get('day'),
      time: startTime,
      duration: duration,
      room: room,
      timeStr: timeStr
    };

    window.EduTrackState.updateScheduleSlot(slotId, slotData);
    this.closeModal();
    this.showToast(`Updated timetable slot: ${timeStr} (${durationLabel})`, 'success');
  },

  /* ----------------------------------------------------
     Modals: Attendance Marking & Proxy / Substitute
  ----------------------------------------------------- */

  openLogModal(preselectedSubjectId = null, defaultStatus = 'present') {
    const state = window.EduTrackState.getState();
    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalContent || !modalOverlay) return;

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b mb-6" style="border-color: var(--color-outline-variant);">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">how_to_reg</span>
            <h3 class="font-headline-md font-bold" style="color: var(--color-on-background);">Mark Class Attendance</h3>
          </div>
          <button class="btn-icon" onclick="window.ClassTrackApp.closeModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="form-log-attendance" onsubmit="window.ClassTrackApp.submitLogAttendance(event)">
          <div class="form-group">
            <label class="form-label">Course / Subject</label>
            <select name="subjectId" class="form-select" required>
              ${state.subjects.length === 0 ? '<option value="">(Please add a course first)</option>' : state.subjects.map(s => `
                <option value="${s.id}" ${preselectedSubjectId === s.id ? 'selected' : ''}>${s.name} (${s.code || 'CRS'})</option>
              `).join('')}
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Attendance Status</label>
              <select name="status" class="form-select" required>
                <option value="present" ${defaultStatus === 'present' ? 'selected' : ''}>Present (Attended)</option>
                <option value="absent" ${defaultStatus === 'absent' ? 'selected' : ''}>Absent (Missed)</option>
                <option value="faculty_absent" ${defaultStatus === 'faculty_absent' ? 'selected' : ''}>Faculty Absent / Free Period (Exempted)</option>
                <option value="other_faculty" ${defaultStatus === 'other_faculty' ? 'selected' : ''}>Other Faculty / Substitute Class</option>
                <option value="od" ${defaultStatus === 'od' ? 'selected' : ''}>On-Duty / Medical Leave (Exempted)</option>
                <option value="holiday" ${defaultStatus === 'holiday' ? 'selected' : ''}>Class Cancelled / Holiday</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" name="date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Class Type</label>
              <select name="type" class="form-select">
                <option value="Lecture">Lecture / Theory</option>
                <option value="Lab">Practical Lab</option>
                <option value="Tutorial">Tutorial Session</option>
                <option value="Extra Class">Extra Makeup Class</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Time Slot</label>
              <input type="text" name="timeStr" class="form-input" placeholder="e.g. 09:00 AM - 10:30 AM" value="Current Session">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Remarks / Topic (Optional)</label>
            <input type="text" name="remarks" class="form-input" placeholder="e.g. Chapter 4 Quiz, Assignment submission, Medical note">
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t" style="border-color: var(--color-outline-variant);">
            <button type="button" class="btn btn-secondary" onclick="window.ClassTrackApp.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Mark Attendance</button>
          </div>
        </form>
      </div>
    `;

    modalOverlay.classList.add('active');
  },

  openSubstituteModal(subjectId, timeStr = '') {
    const state = window.EduTrackState.getState();
    const currentSubject = state.subjects.find(s => s.id === subjectId);
    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalContent || !modalOverlay) return;

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b mb-6" style="border-color: var(--color-outline-variant);">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined" style="color: #8B5CF6; font-size: 26px;">swap_horiz</span>
            <div>
              <h3 class="font-headline-md font-bold" style="color: var(--color-on-background);">Other Faculty / Proxy Class</h3>
              <p class="font-label-sm" style="color: var(--color-on-surface-variant);">Record a class taken by a substitute teacher or alternate subject</p>
            </div>
          </div>
          <button class="btn-icon" onclick="window.ClassTrackApp.closeModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="form-substitute-attendance" onsubmit="window.ClassTrackApp.submitSubstituteAttendance(event, '${subjectId}', '${timeStr}')">
          <div class="p-3 rounded-xl mb-4" style="background-color: var(--color-surface-container-low); border: 1px solid var(--color-outline-variant);">
            <span class="font-label-sm uppercase font-bold" style="color: var(--color-on-surface-variant);">Scheduled Slot:</span>
            <div class="font-body-md font-semibold mt-1" style="color: var(--color-on-background);">${currentSubject?.name || 'Class'} (${currentSubject?.code || 'CRS'})</div>
            <div class="font-label-sm mt-0.5" style="color: var(--color-on-surface-variant);">${timeStr || 'Today'} • Regular Faculty: ${currentSubject?.instructor || 'Faculty'}</div>
          </div>

          <div class="form-group">
            <label class="form-label">Substitute Faculty / Guest Teacher Name</label>
            <input type="text" name="substituteFaculty" class="form-input" placeholder="e.g. Prof. Johnson / Guest Faculty" required>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Your Attendance Status</label>
              <select name="status" class="form-select" required>
                <option value="other_faculty">Attended (Counted for ${currentSubject?.code || 'Course'})</option>
                <option value="absent">Missed / Absent</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Assign Attendance To</label>
              <select name="targetSubjectId" class="form-select">
                <option value="${subjectId}">Keep as ${currentSubject?.name || 'This Course'}</option>
                ${state.subjects.filter(s => s.id !== subjectId).map(s => `<option value="${s.id}">Transfer to ${s.name} (${s.code})</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Remarks / Topic Covered (Optional)</label>
            <input type="text" name="remarks" class="form-input" placeholder="e.g. Proxy lecture, Covered Unit 3 revision">
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t" style="border-color: var(--color-outline-variant);">
            <button type="button" class="btn btn-secondary" onclick="window.ClassTrackApp.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #7C3AED, #4F46E5); border: none;">Save Proxy Record</button>
          </div>
        </form>
      </div>
    `;

    modalOverlay.classList.add('active');
  },

  submitSubstituteAttendance(e, originalSubjectId, timeStr) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const targetSubjectId = formData.get('targetSubjectId') || originalSubjectId;
    const substituteFaculty = formData.get('substituteFaculty') || 'Substitute Faculty';
    const status = formData.get('status') || 'other_faculty';
    const userRemarks = formData.get('remarks') || '';
    const remarks = `Proxy Class by ${substituteFaculty}${userRemarks ? ': ' + userRemarks : ''}`;
    const date = new Date().toISOString().split('T')[0];

    window.EduTrackState.logAttendance(targetSubjectId, status, {
      date,
      type: 'Lecture',
      timeStr: timeStr || 'Proxy Session',
      remarks
    });

    this.closeModal();
    this.showToast(`Logged substitute class by ${substituteFaculty}!`, 'success');
    if (window.location.hash.includes('dashboard') || !window.location.hash) {
      window.ClassTrackDashboard?.render(document.getElementById('view-content'));
    }
  },

  submitLogAttendance(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const subjectId = formData.get('subjectId');
    if (!subjectId) {
      this.showToast('Please add a course first before marking attendance.', 'warning');
      return;
    }

    const status = formData.get('status');
    const date = formData.get('date');
    const type = formData.get('type');
    const timeStr = formData.get('timeStr');
    const remarks = formData.get('remarks');

    window.EduTrackState.logAttendance(subjectId, status, { date, type, timeStr, remarks });
    this.closeModal();
    
    let statusLabel = 'PRESENT';
    if (status === 'absent') statusLabel = 'ABSENT';
    if (status === 'faculty_absent') statusLabel = 'FACULTY ABSENT';
    if (status === 'other_faculty') statusLabel = 'SUBSTITUTE CLASS';
    if (status === 'od') statusLabel = 'ON-DUTY LEAVE';
    if (status === 'holiday') statusLabel = 'HOLIDAY';
    this.showToast(`Attendance marked as ${statusLabel}!`, 'success');
  },

  /* ----------------------------------------------------
     Modals: Profile & Data Management
  ----------------------------------------------------- */

  openProfileModal() {
    const state = window.EduTrackState.getState();
    const authUser = window.ClassTrackAuth ? window.ClassTrackAuth.getCurrentUser() : null;
    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalContent || !modalOverlay) return;

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b mb-6" style="border-color: var(--color-outline-variant);">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">person</span>
            <h3 class="font-headline-md font-bold" style="color: var(--color-on-background);">Student Profile & Target</h3>
          </div>
          <button class="btn-icon" onclick="window.ClassTrackApp.closeModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="form-profile" onsubmit="window.ClassTrackApp.submitProfile(event)">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Student Name <span class="text-primary">*</span></label>
              <input type="text" name="name" class="form-input font-semibold" value="${state.profile?.name || authUser?.fullName || ''}" placeholder="e.g. Alex Morgan" required>
            </div>
            <div class="form-group">
              <label class="form-label">Student ID / Roll No <span style="text-transform: none; font-weight: normal; opacity: 0.7;">(Optional)</span></label>
              <input type="text" name="rollNo" class="form-input font-mono uppercase" value="${state.profile?.rollNo || authUser?.universityId || ''}" placeholder="e.g. 21CS045, STD-2024">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Degree / Course / Major</label>
              <input type="text" name="program" class="form-input" value="${state.profile?.program || authUser?.branch || ''}" placeholder="e.g. Computer Science, Business, Arts">
            </div>
            <div class="form-group">
              <label class="form-label">Current Semester / Term</label>
              <select name="semester" class="form-select">
                <option value="None" ${!state.profile?.semester || state.profile?.semester === 'None' ? 'selected' : ''}>No Semester / Annual Curriculum</option>
                <option value="Semester 1" ${state.profile?.semester === 'Semester 1' ? 'selected' : ''}>Semester 1</option>
                <option value="Semester 2" ${state.profile?.semester === 'Semester 2' ? 'selected' : ''}>Semester 2</option>
                <option value="Semester 3" ${state.profile?.semester === 'Semester 3' ? 'selected' : ''}>Semester 3</option>
                <option value="Semester 4" ${state.profile?.semester === 'Semester 4' ? 'selected' : ''}>Semester 4</option>
                <option value="Semester 5" ${state.profile?.semester === 'Semester 5' ? 'selected' : ''}>Semester 5</option>
                <option value="Semester 6" ${state.profile?.semester === 'Semester 6' ? 'selected' : ''}>Semester 6</option>
                <option value="Semester 7" ${state.profile?.semester === 'Semester 7' ? 'selected' : ''}>Semester 7</option>
                <option value="Semester 8" ${state.profile?.semester === 'Semester 8' ? 'selected' : ''}>Semester 8</option>
                <option value="Term 1" ${state.profile?.semester === 'Term 1' ? 'selected' : ''}>Term 1</option>
                <option value="Term 2" ${state.profile?.semester === 'Term 2' ? 'selected' : ''}>Term 2</option>
                <option value="Term 3" ${state.profile?.semester === 'Term 3' ? 'selected' : ''}>Term 3</option>
                <option value="Year 1" ${state.profile?.semester === 'Year 1' ? 'selected' : ''}>Year 1</option>
                <option value="Year 2" ${state.profile?.semester === 'Year 2' ? 'selected' : ''}>Year 2</option>
                <option value="Year 3" ${state.profile?.semester === 'Year 3' ? 'selected' : ''}>Year 3</option>
                <option value="Year 4" ${state.profile?.semester === 'Year 4' ? 'selected' : ''}>Year 4</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email Address <span style="text-transform: none; font-weight: normal; opacity: 0.7;">(Updating requires confirmation link from Supabase)</span></label>
            <input type="email" name="email" class="form-input" value="${state.profile?.email || authUser?.email || ''}" placeholder="student@example.com">
          </div>

          <div class="form-group">
            <label class="form-label">Target Minimum Attendance (%):</label>
            <div class="flex items-center gap-4">
              <input type="number" name="targetThreshold" class="form-input" value="${state.profile?.targetThreshold || 75}" min="50" max="95" required>
              <span class="font-label-sm" style="color: var(--color-on-surface-variant);">(Standard: 75%)</span>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t" style="border-color: var(--color-outline-variant);">
            <button type="button" class="btn btn-secondary" onclick="window.ClassTrackApp.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Profile</button>
          </div>
        </form>
      </div>
    `;

    modalOverlay.classList.add('active');
  },

  async submitProfile(e) {
    e.preventDefault();
    const state = window.EduTrackState.getState();
    const authUser = window.ClassTrackAuth ? window.ClassTrackAuth.getCurrentUser() : null;
    const prevEmail = (state.profile?.email || authUser?.email || '').trim().toLowerCase();

    const formData = new FormData(e.target);
    const profile = {
      name: (formData.get('name') || '').trim() || 'Student',
      rollNo: (formData.get('rollNo') || '').trim(),
      program: (formData.get('program') || '').trim() || 'General Studies',
      semester: formData.get('semester') || 'None',
      email: (formData.get('email') || '').trim(),
      targetThreshold: parseInt(formData.get('targetThreshold'), 10) || 75
    };

    window.EduTrackState.updateProfile(profile);

    if (window.ClassTrackAuth) {
      await window.ClassTrackAuth.updateUserMetadata({
        fullName: profile.name,
        universityId: profile.rollNo,
        branch: profile.program,
        semester: profile.semester
      });

      const newEmail = (profile.email || '').trim().toLowerCase();
      if (newEmail && prevEmail && newEmail !== prevEmail) {
        const emailRes = await window.ClassTrackAuth.updateEmail(newEmail);
        if (emailRes.success) {
          this.showToast(emailRes.message, 'info');
        } else {
          this.showToast(emailRes.error || 'Failed to send email confirmation', 'warning');
        }
      }
    }

    this.updateProfileBadges();
    this.closeModal();
    this.showToast('Profile updated successfully!', 'success');
    if (this.currentView === 'profile') {
      this.refreshCurrentView();
    }
  },

  openDataModal() {
    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalContent || !modalOverlay) return;

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b mb-6" style="border-color: var(--color-outline-variant);">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">database</span>
            <h3 class="font-headline-md font-bold" style="color: var(--color-on-background);">Data Management</h3>
          </div>
          <button class="btn-icon" onclick="window.ClassTrackApp.closeModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="flex flex-col gap-4">
          <div class="p-4 rounded-xl" style="background-color: var(--color-surface-container-low); border: 1px solid var(--color-outline-variant);">
            <h4 class="font-headline-sm font-bold mb-1" style="color: var(--color-error);">Clear All Data (Fresh Start)</h4>
            <p class="font-body-sm mb-3" style="color: var(--color-on-surface-variant);">Wipe all courses, timetable slots, and attendance records to start clean.</p>
            <button class="btn btn-danger btn-sm" onclick="window.ClassTrackApp.clearAllData()">
              <span class="material-symbols-outlined">delete_sweep</span> Clear All Data
            </button>
          </div>
        </div>
      </div>
    `;

    modalOverlay.classList.add('active');
  },

  clearAllData() {
    this.confirmDialog({
      title: 'Clear All Data & Start Fresh?',
      message: 'This action will wipe all enrolled courses, weekly timetable schedules, and attendance history logs permanently from the cloud database.',
      icon: 'delete_sweep',
      confirmText: 'Clear All Data',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        window.EduTrackState.resetToDefault();
        if (window.ClassTrackSync) {
          await window.ClassTrackSync.clearUserData();
        }
        this.showToast('All data cleared from cloud database. Fresh start!', 'info');
      }
    });
  },

  closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) modalOverlay.classList.remove('active');
  },

  /* ----------------------------------------------------
     Theme & Toast Notifications
  ----------------------------------------------------- */

  toggleTheme() {
    const isDark = window.EduTrackState.toggleDarkMode();
    this.showToast(`Switched to ${isDark ? 'Dark' : 'Light'} Mode`, 'info');
  },

  toggleSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    else if (type === 'warning') icon = 'warning';
    else if (type === 'error') icon = 'error';

    toast.innerHTML = `
      <span class="material-symbols-outlined" style="font-size: 20px;">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

// Aliases for compatibility
window.EduTrackApp = window.ClassTrackApp;

// Bootstrap application on window load
window.addEventListener('DOMContentLoaded', () => {
  window.ClassTrackApp.init();
});
