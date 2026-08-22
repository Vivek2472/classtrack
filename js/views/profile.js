/**
 * ClassTrack Engineering - Student Profile View (Mobile & Desktop)
 * Replicating Stitch screens:
 * - Mobile: cb8ff70224c1456ab3ace4bed81ffcba (Student Profile - Mobile)
 * - Desktop: c699fe2a253344e29816fe390ddfac44 (Student Profile - EduTrack Engineering)
 */

window.ClassTrackProfile = {
  render(container) {
    const state = window.EduTrackState.getState();
    const stats = window.EduTrackState.getOverallStats();
    const authUser = window.ClassTrackAuth.getCurrentUser();
    const isGuest = window.ClassTrackAuth.isGuest();

    const name = authUser?.fullName || state.profile.name || 'Student';
    const rollNo = authUser?.universityId || state.profile.rollNo || 'STD-2024';
    const email = authUser?.email || state.profile.email || 'student@example.com';
    const program = authUser?.branch || state.profile.program || 'General Studies';
    const semester = (state.profile.semester && state.profile.semester !== 'None') ? state.profile.semester : '';
    const gpa = state.profile.gpa || (stats.hasData ? (3.0 + (stats.percentage / 100) * 1.0).toFixed(2) : 3.8);
    const attendancePct = stats.hasData ? `${stats.percentage}%` : '0%';
    const totalCourses = (state.subjects || []).length;
    const totalCredits = (state.subjects || []).reduce((acc, s) => acc + (s.credits || 3), 0);

    container.innerHTML = `
      <div class="profile-view-wrapper flex flex-col gap-6 max-w-4xl mx-auto pb-12 animate-fade-in">
        
        <!-- Top App Bar / Title Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-headline-lg font-bold text-primary" style="color: var(--color-on-background);">Student Profile</h1>
            <p class="font-body-md" style="color: var(--color-on-surface-variant);">Manage your academic identity, thresholds, and account settings.</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-secondary btn-sm" onclick="window.ClassTrackApp.openProfileModal()">
              <span class="material-symbols-outlined" style="font-size: 16px;">edit</span> Edit Profile
            </button>
            <button class="btn btn-danger btn-sm" onclick="window.ClassTrackProfile.handleLogout()">
              <span class="material-symbols-outlined" style="font-size: 16px;">logout</span> Log Out
            </button>
          </div>
        </div>

        <!-- Guest Notice Banner (If in Guest Mode) -->
        ${isGuest ? `
          <div class="p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm" style="background-color: var(--color-surface-container-low); border: 1.5px dashed var(--color-outline-variant);">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background-color: var(--color-secondary-container); color: var(--color-on-secondary-container);">
                <span class="material-symbols-outlined">explore</span>
              </div>
              <div>
                <h4 class="font-headline-sm font-bold" style="color: var(--color-on-background);">Guest Mode (Offline Local Session)</h4>
                <p class="font-body-sm" style="color: var(--color-on-surface-variant);">All your timetable entries and attendance logs are saved locally in your browser.</p>
              </div>
            </div>
            <button class="btn btn-primary btn-sm shrink-0" onclick="window.ClassTrackApp.navigate('signup')">
              <span class="material-symbols-outlined" style="font-size: 16px;">person_add</span> Create Permanent Account
            </button>
          </div>
        ` : ''}

        <!-- Profile Hero Card -->
        <section class="edu-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex-1 flex flex-col gap-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="font-headline-lg font-bold" style="color: var(--color-on-background);">${name}</h2>
              <span class="status-chip ${isGuest ? 'status-neutral' : 'status-safe'}">
                <span class="material-symbols-outlined" style="font-size: 14px;">${isGuest ? 'explore' : 'verified'}</span>
                ${isGuest ? 'Guest Session' : (window.ClassTrackAuth.isSupabase() ? 'Supabase Cloud Account' : 'Local Account')}
              </span>
            </div>
            <p class="font-label-md font-semibold" style="color: var(--color-on-surface-variant);">${semester ? `${program} • ${semester}` : program}</p>
            <div class="flex flex-wrap items-center gap-2 mt-1">
              ${rollNo ? `
                <span class="font-label-sm px-3 py-1 rounded-full font-mono font-bold" style="background-color: var(--color-surface-container-high); color: var(--color-on-surface);">
                  ID: ${rollNo}
                </span>
              ` : ''}
              <span class="font-label-sm px-3 py-1 rounded-full" style="background-color: var(--color-secondary-container); color: var(--color-on-secondary-container);">
                Threshold: ${state.profile.targetThreshold || 75}%
              </span>
            </div>
          </div>
        </section>

        <!-- Sync Status Card (Only shown when user is logged in with Cloud Account) -->
        ${window.ClassTrackAuth.isSupabase() ? `
          <section class="edu-card p-4 border shadow-sm flex items-center justify-between gap-3" style="background-color: var(--color-surface-container-low); border-color: var(--color-outline-variant);">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style="background-color: var(--color-primary); color: #ffffff;">
                <span class="material-symbols-outlined" style="font-size: 20px;">cloud_done</span>
              </div>
              <div>
                <h4 class="font-headline-sm font-bold text-sm" style="color: var(--color-on-background);">Cloud Sync Active</h4>
                <p class="font-body-sm text-xs" style="color: var(--color-on-surface-variant);">
                  Last synced: <span class="font-semibold">${window.ClassTrackSync?.lastSyncTime ? new Date(window.ClassTrackSync.lastSyncTime).toLocaleTimeString() : 'Just now'}</span>
                </p>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm flex items-center gap-1.5" onclick="window.ClassTrackProfile.handleSyncNow(this)">
              <span class="material-symbols-outlined" style="font-size: 16px;">sync</span>
              <span>Sync Now</span>
            </button>
          </section>
        ` : ''}

        <!-- Academic Summary Cards (Stitch Spec) -->
        <section class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <!-- Attendance Metric -->
          <div class="edu-card flex flex-col items-center text-center p-4">
            <span class="material-symbols-outlined mb-2 text-3xl" style="color: var(--color-safe); font-variation-settings: 'FILL' 1;">fact_check</span>
            <span class="font-label-sm uppercase tracking-wider mb-1" style="color: var(--color-on-surface-variant);">Attendance</span>
            <span class="font-headline-md font-bold" style="color: var(--color-on-background);">${attendancePct}</span>
          </div>

          <!-- Current GPA Metric -->
          <div class="edu-card flex flex-col items-center text-center p-4">
            <span class="material-symbols-outlined mb-2 text-3xl" style="color: var(--color-primary); font-variation-settings: 'FILL' 1;">school</span>
            <span class="font-label-sm uppercase tracking-wider mb-1" style="color: var(--color-on-surface-variant);">Academic Score</span>
            <span class="font-headline-md font-bold" style="color: var(--color-on-background);">${gpa}</span>
          </div>

          <!-- Courses Enrolled -->
          <div class="edu-card flex flex-col items-center text-center p-4">
            <span class="material-symbols-outlined mb-2 text-3xl" style="color: var(--color-secondary); font-variation-settings: 'FILL' 1;">menu_book</span>
            <span class="font-label-sm uppercase tracking-wider mb-1" style="color: var(--color-on-surface-variant);">Enrolled Courses</span>
            <span class="font-headline-md font-bold" style="color: var(--color-on-background);">${totalCourses} (${totalCredits} cr)</span>
          </div>

          <!-- Attendance Safe Margin -->
          <div class="edu-card flex flex-col items-center text-center p-4">
            <span class="material-symbols-outlined mb-2 text-3xl" style="color: ${stats.safeAbsenceMargin > 0 ? 'var(--color-safe)' : 'var(--color-error)'}; font-variation-settings: 'FILL' 1;">
              ${stats.safeAbsenceMargin > 0 ? 'flight_takeoff' : 'warning'}
            </span>
            <span class="font-label-sm uppercase tracking-wider mb-1" style="color: var(--color-on-surface-variant);">Attendance Margin</span>
            <span class="font-headline-md font-bold" style="color: ${stats.safeAbsenceMargin > 0 ? 'var(--color-safe)' : 'var(--color-error)'};">
              ${stats.safeAbsenceMargin} Classes
            </span>
          </div>

        </section>

        <!-- Personal & Academic Details (Stitch Screen cb8ff70224c1456ab3ace4bed81ffcba) -->
        <section class="edu-card p-0 overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between" style="background-color: var(--color-surface-container-low); border-color: var(--color-outline-variant);">
            <h3 class="font-label-md uppercase tracking-wider font-bold" style="color: var(--color-on-surface-variant);">Personal & Academic Details</h3>
            <button class="btn btn-secondary btn-sm" onclick="window.ClassTrackApp.openProfileModal()">
              <span class="material-symbols-outlined" style="font-size: 14px;">edit</span> Edit
            </button>
          </div>

          <div class="flex flex-col divide-y" style="border-color: var(--color-outline-variant);">
            
            <div class="flex items-center justify-between px-6 py-4">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-outline">mail</span>
                <span class="font-body-md font-semibold" style="color: var(--color-on-surface);">Email Address</span>
              </div>
              <span class="font-label-md font-mono" style="color: var(--color-on-surface-variant);">${email}</span>
            </div>

            <div class="flex items-center justify-between px-6 py-4">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-outline">apartment</span>
                <span class="font-body-md font-semibold" style="color: var(--color-on-surface);">Degree / Major</span>
              </div>
              <span class="font-label-md" style="color: var(--color-on-surface-variant);">${program}</span>
            </div>

            <div class="flex items-center justify-between px-6 py-4">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-outline">history_edu</span>
                <span class="font-body-md font-semibold" style="color: var(--color-on-surface);">Current Semester</span>
              </div>
              <span class="font-label-md" style="color: var(--color-on-surface-variant);">${semester || 'None (Annual/Flexible)'}</span>
            </div>

            <div class="flex items-center justify-between px-6 py-4">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-outline">tune</span>
                <span class="font-body-md font-semibold" style="color: var(--color-on-surface);">Attendance Policy Goal</span>
              </div>
              <span class="font-label-md font-bold font-mono" style="color: var(--color-safe);">${state.profile.targetThreshold || 75}% Minimum</span>
            </div>

          </div>
        </section>

        <!-- Actions Section (Edit, Switch Account, Backup, Presets, Reset) -->
        <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button class="btn btn-secondary flex items-center justify-center gap-2 py-3.5" onclick="window.ClassTrackApp.openDataModal()">
            <span class="material-symbols-outlined">database</span>
            <span>Data & Backup JSON</span>
          </button>
          
          <button class="btn btn-secondary flex items-center justify-center gap-2 py-3.5" onclick="window.ClassTrackApp.toggleTheme()">
            <span class="material-symbols-outlined">dark_mode</span>
            <span>Toggle Theme</span>
          </button>

          <button class="btn btn-danger flex items-center justify-center gap-2 py-3.5" onclick="window.ClassTrackProfile.handleLogout()">
            <span class="material-symbols-outlined">logout</span>
            <span>Log Out / Switch User</span>
          </button>
        </section>

      </div>
    `;
  },

  async handleSyncNow(btn) {
    if (!window.ClassTrackSync) return;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
      <span class="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      <span>Syncing...</span>
    `;

    const res = await window.ClassTrackSync.syncNow();
    btn.disabled = false;
    btn.innerHTML = originalText;

    if (res.success) {
      window.ClassTrackApp.showToast('Cloud database synchronized successfully!', 'success');
      window.ClassTrackApp.refreshCurrentView();
    } else {
      window.ClassTrackApp.showToast(res.message || 'Sync failed.', 'error');
    }
  },

  handleLogout() {
    window.ClassTrackApp.confirmDialog({
      title: 'Log Out of ClassTrack?',
      message: 'You can log back in anytime as a Guest or with your registered credentials. Your local records remain saved.',
      icon: 'logout',
      confirmText: 'Log Out',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        await window.ClassTrackAuth.logout();
        window.ClassTrackApp.showToast('Logged out successfully.', 'info');
        window.ClassTrackApp.navigate('login');
      }
    });
  }
};

window.EduTrackProfile = window.ClassTrackProfile;
