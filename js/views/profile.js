/**
 * ClassTrack Engineering - Student Profile View (Mobile & Desktop)
 * Pure Supabase Cloud Integration
 */

window.ClassTrackProfile = {
  render(container) {
    const state = window.EduTrackState.getState();
    const stats = window.EduTrackState.getOverallStats();
    const authUser = window.ClassTrackAuth ? window.ClassTrackAuth.getCurrentUser() : null;

    const name = state.profile?.name || authUser?.fullName || 'Student';
    const rollNo = state.profile?.rollNo || authUser?.universityId || '';
    const email = state.profile?.email || authUser?.email || '';
    const program = state.profile?.program || authUser?.branch || 'General Studies';
    const semester = (state.profile?.semester && state.profile?.semester !== 'None') ? state.profile.semester : '';
    const attendancePct = stats.hasData ? `${stats.percentage}%` : '0%';
    const totalCourses = (state.subjects || []).length;
    const totalCredits = (state.subjects || []).reduce((acc, s) => acc + (s.credits || 3), 0);

    const esc = str => (window.ClassTrackApp ? window.ClassTrackApp.escapeHTML(str) : (str || ''));
    const safeName = esc(name);
    const safeRollNo = esc(rollNo);
    const safeEmail = esc(email);
    const safeProgram = esc(program);
    const safeSemester = esc(semester);

    container.innerHTML = `
      <div class="profile-view-wrapper flex flex-col gap-6 max-w-4xl mx-auto pb-12 animate-fade-in">
        
        <!-- Top App Bar / Title Header with Single Edit Profile Action -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-headline-lg font-bold text-primary" style="color: var(--color-on-background);">Student Profile</h1>
            <p class="font-body-md" style="color: var(--color-on-surface-variant);">Manage your academic identity and attendance goal.</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-primary btn-sm" onclick="window.ClassTrackApp.openProfileModal()">
              <span class="material-symbols-outlined" style="font-size: 16px;">edit</span> Edit Profile
            </button>
            <button class="btn btn-danger btn-sm" onclick="window.ClassTrackProfile.handleLogout()">
              <span class="material-symbols-outlined" style="font-size: 16px;">logout</span> Log Out
            </button>
          </div>
        </div>

        <!-- Profile Hero Card -->
        <section class="edu-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex-1 flex flex-col gap-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="font-headline-lg font-bold" style="color: var(--color-on-background);">${safeName}</h2>
              <span class="status-chip status-safe">
                <span class="material-symbols-outlined" style="font-size: 14px;">verified</span>
                Enrolled Student
              </span>
            </div>
            <p class="font-label-md font-semibold" style="color: var(--color-on-surface-variant);">${safeSemester ? `${safeProgram} • ${safeSemester}` : safeProgram}</p>
            <div class="flex flex-wrap items-center gap-2 mt-1">
              ${safeRollNo ? `
                <span class="font-label-sm px-3 py-1 rounded-full font-mono font-bold" style="background-color: var(--color-surface-container-high); color: var(--color-on-surface);">
                  ID: ${safeRollNo}
                </span>
              ` : ''}
              <span class="font-label-sm px-3 py-1 rounded-full" style="background-color: var(--color-secondary-container); color: var(--color-on-secondary-container);">
                Threshold: ${state.profile.targetThreshold || 75}%
              </span>
            </div>
          </div>
        </section>

        <!-- Academic Summary Cards -->
        <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <!-- Attendance Metric -->
          <div class="edu-card flex flex-col items-center text-center p-4">
            <span class="material-symbols-outlined mb-2 text-3xl" style="color: var(--color-safe); font-variation-settings: 'FILL' 1;">fact_check</span>
            <span class="font-label-sm uppercase tracking-wider mb-1" style="color: var(--color-on-surface-variant);">Overall Attendance</span>
            <span class="font-headline-md font-bold" style="color: var(--color-on-background);">${attendancePct}</span>
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
              ${stats.safeAbsenceMargin > 0 ? `${stats.safeAbsenceMargin} Classes` : stats.catchUpNeeded > 0 ? `Need ${stats.catchUpNeeded} Classes` : 'On Track'}
            </span>
          </div>

        </section>

        <!-- Personal & Academic Details -->
        <section class="edu-card p-0 overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between" style="background-color: var(--color-surface-container-low); border-color: var(--color-outline-variant);">
            <h3 class="font-label-md uppercase tracking-wider font-bold" style="color: var(--color-on-surface-variant);">Personal & Academic Details</h3>
          </div>

          <div class="flex flex-col divide-y" style="border-color: var(--color-outline-variant);">
            
            <div class="flex items-center justify-between px-6 py-4">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-outline">badge</span>
                <span class="font-body-md font-semibold" style="color: var(--color-on-surface);">Student ID / Roll No</span>
              </div>
              <span class="font-label-md font-mono font-bold" style="color: var(--color-on-surface);">${safeRollNo || 'Not set'}</span>
            </div>

            <div class="flex items-center justify-between px-6 py-4">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-outline">mail</span>
                <span class="font-body-md font-semibold" style="color: var(--color-on-surface);">Email Address</span>
              </div>
              <span class="font-label-md font-mono" style="color: var(--color-on-surface-variant);">${safeEmail || 'Not set'}</span>
            </div>

            <div class="flex items-center justify-between px-6 py-4">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-outline">apartment</span>
                <span class="font-body-md font-semibold" style="color: var(--color-on-surface);">Degree / Major</span>
              </div>
              <span class="font-label-md" style="color: var(--color-on-surface-variant);">${safeProgram}</span>
            </div>

            <div class="flex items-center justify-between px-6 py-4">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-outline">history_edu</span>
                <span class="font-body-md font-semibold" style="color: var(--color-on-surface);">Current Semester</span>
              </div>
              <span class="font-label-md" style="color: var(--color-on-surface-variant);">${safeSemester || 'None (Annual/Flexible)'}</span>
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

      </div>
    `;
  },

  handleLogout() {
    window.ClassTrackApp.confirmDialog({
      title: 'Log Out of ClassTrack?',
      message: 'You will be signed out of your account. All your academic records remain safely stored in the cloud.',
      icon: 'logout',
      confirmText: 'Log Out',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        await window.ClassTrackAuth.logout();
        window.location.replace('login.html');
      }
    });
  }
};

window.EduTrackProfile = window.ClassTrackProfile;
