/**
 * ClassTrack Engineering - Dashboard View (Screen 1)
 * Precision Academic Tracker
 */

window.ClassTrackDashboard = {
  render(container) {
    const stateManager = window.EduTrackState;
    const state = stateManager.getState();
    const stats = stateManager.getOverallStats();
    
    // Calculate circular stroke values (circumference = 100 in viewbox 0 0 36 36)
    const percentage = Math.min(100, Math.max(0, stats.percentage));
    const strokeDash = `${percentage}, 100`;
    
    // Status color class
    let circleColor = '#10B981'; // Emerald
    let statusText = 'You are currently above the minimum 75% threshold for the semester. Keep up the good work to maintain your standing.';
    let statusBadge = '<span class="status-chip status-safe"><span class="material-symbols-outlined" style="font-size: 14px;">verified</span> Safe Zone</span>';

    if (stats.totalClasses === 0) {
      circleColor = 'var(--color-outline-variant)';
      statusText = 'No attendance records marked yet for this semester. Use the 1-click action or "Mark Attendance" button at the top right to record your first class.';
      statusBadge = '<span class="status-chip status-neutral"><span class="material-symbols-outlined" style="font-size: 14px;">pending</span> No Data Yet</span>';
    } else if (stats.status === 'warning') {
      circleColor = '#F59E0B'; // Amber
      statusText = `Borderline warning! You are close to the ${stats.targetThreshold}% threshold. Attend your next classes to stay safe.`;
      statusBadge = '<span class="status-chip status-warning"><span class="material-symbols-outlined" style="font-size: 14px;">warning</span> Borderline</span>';
    } else if (stats.status === 'critical') {
      circleColor = '#BA1A1A'; // Red
      statusText = `Attention Required! Your attendance has dropped below 65%. You need to attend ${stats.catchUpNeeded} consecutive classes to recover.`;
      statusBadge = '<span class="status-chip status-critical"><span class="material-symbols-outlined" style="font-size: 14px;">error</span> Critical Standing</span>';
    }

    // Filter low attendance subjects (<75%)
    const lowAttendanceSubjects = (state.subjects || [])
      .map(s => stateManager.getSubjectStats(s.id))
      .filter(s => s && s.percentage < (stats.targetThreshold || 75))
      .sort((a, b) => a.percentage - b.percentage);

    const authUser = window.ClassTrackAuth ? window.ClassTrackAuth.getCurrentUser() : null;
    const studentName = state.profile?.name || authUser?.fullName || 'Student';

    // Get today's classes synced with real-time day
    const now = new Date();
    const todayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const todayDateFormatted = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const todayClasses = (state.schedule || []).filter(s => s.day === todayName);
    const isSunday = todayName === 'Sunday';

    // Calculate next available upcoming classes for Sunday / free days
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayIdx = dayOrder.indexOf(todayName);
    let nextScheduledDay = null;
    let nextDayClasses = [];
    if (isSunday || todayClasses.length === 0) {
      for (let offset = 1; offset <= 6; offset++) {
        const checkIdx = (currentDayIdx === -1 ? 0 : (currentDayIdx + offset)) % 6;
        const checkDay = dayOrder[checkIdx];
        const slots = (state.schedule || []).filter(s => s.day === checkDay);
        if (slots.length > 0) {
          nextScheduledDay = checkDay;
          nextDayClasses = slots.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
          break;
        }
      }
    }

    const hasSubjects = (state.subjects || []).length > 0;

    container.innerHTML = `
      <div class="flex flex-col gap-5 animate-fade-in">
        <!-- Top Row: Welcome & Quick Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="font-headline-lg font-bold text-primary" style="color: var(--color-on-background);">Student Dashboard</h1>
              <span class="live-badge text-xs">
                <span class="live-dot"></span>
                <span>${todayDateFormatted}</span>
              </span>
            </div>
            <p class="font-body-md" style="color: var(--color-on-surface-variant); font-size: 0.875rem;">
              Welcome back, <strong>${studentName}</strong>
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button class="btn btn-primary btn-sm flex-1 sm:flex-initial" onclick="window.ClassTrackApp.openLogModal()">
              <span class="material-symbols-outlined" style="font-size: 16px;">how_to_reg</span> Mark Attendance
            </button>
          </div>
        </div>

        ${!hasSubjects ? `
          <!-- Empty Onboarding Banner -->
          <div class="edu-card text-center py-10 px-4 flex flex-col items-center gap-3">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm" style="background-color: var(--color-primary-fixed); color: var(--color-on-primary-fixed);">
              <span class="material-symbols-outlined" style="font-size: 28px;">school</span>
            </div>
            <div>
              <h2 class="font-headline-md font-bold mb-1" style="color: var(--color-on-background);">Welcome to ClassTrack!</h2>
              <p class="font-body-sm max-w-md mx-auto" style="color: var(--color-on-surface-variant);">
                Your personal academic attendance tracker is ready. Add your courses and setup your schedule to start monitoring attendance.
              </p>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-2 mt-1">
              <button class="btn btn-primary btn-sm" onclick="window.ClassTrackApp.openAddSubjectModal()">
                <span class="material-symbols-outlined" style="font-size: 16px;">add_box</span> Add Course
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.ClassTrackApp.openAddSlotModal()">
                <span class="material-symbols-outlined" style="font-size: 16px;">schedule</span> Add Timetable Slot
              </button>
            </div>
          </div>
        ` : `
          <!-- Bento Grid Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <!-- Left Column (8 cols): Overall Card + Alerts + Upcoming Labs -->
            <div class="lg:col-span-8 flex flex-col gap-5">
              
              <!-- Overall Attendance Bento Card -->
              <div class="edu-card p-4 sm:p-6 flex flex-col-reverse md:flex-row items-center justify-between gap-5">
                <div class="flex-1 flex flex-col gap-2.5 text-center md:text-left w-full">
                  <div class="flex items-center justify-center md:justify-start gap-2.5">
                    <h2 class="font-headline-lg font-bold" style="color: var(--color-on-background); font-size: 1.4rem;">Overall Attendance</h2>
                    ${statusBadge}
                  </div>
                  <p class="font-body-sm" style="color: var(--color-on-surface-variant); max-width: 480px; font-size: 0.875rem;">
                    ${statusText}
                  </p>

                  <!-- Stat Counters (3 columns on mobile, clean flex on desktop) -->
                  <div class="mt-2 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                    <div class="p-2.5 sm:px-4 sm:py-3 rounded-xl text-center md:text-left flex-1" style="background-color: var(--color-surface-container-low); border: 1px solid var(--color-surface-variant);">
                      <span class="font-label-sm uppercase tracking-wider block text-[10px] sm:text-xs" style="color: var(--color-on-surface-variant);">Total</span>
                      <span class="font-headline-md block mt-0.5 font-bold font-mono text-base sm:text-xl" style="color: var(--color-on-background);">${stats.totalClasses}</span>
                    </div>
                    <div class="p-2.5 sm:px-4 sm:py-3 rounded-xl text-center md:text-left flex-1" style="background-color: var(--color-surface-container-low); border: 1px solid var(--color-surface-variant);">
                      <span class="font-label-sm uppercase tracking-wider block text-[10px] sm:text-xs" style="color: var(--color-safe-text);">Attended</span>
                      <span class="font-headline-md block mt-0.5 font-bold font-mono text-base sm:text-xl" style="color: var(--color-safe);">${stats.attendedClasses}</span>
                    </div>
                    <div class="p-2.5 sm:px-4 sm:py-3 rounded-xl text-center md:text-left flex-1" style="background-color: var(--color-surface-container-low); border: 1px solid var(--color-surface-variant);">
                      <span class="font-label-sm uppercase tracking-wider block text-[10px] sm:text-xs" style="color: var(--color-on-surface-variant);">Safe Margin</span>
                      <span class="font-headline-md block mt-0.5 font-bold font-mono text-base sm:text-xl" style="color: ${stats.safeAbsenceMargin > 0 ? 'var(--color-safe)' : 'var(--color-error)'};">
                        ${stats.safeAbsenceMargin > 0 ? stats.safeAbsenceMargin : '0'}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Circular Progress Gauge -->
                <div class="w-full md:w-48 flex flex-col items-center justify-center shrink-0">
                  <svg class="circular-chart" viewBox="0 0 36 36" style="width: 140px; height: 140px;">
                    <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                    <path class="circle" stroke="${circleColor}" stroke-dasharray="${strokeDash}" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                    <text class="percentage-text" x="18" y="20">${percentage}%</text>
                    <text class="percentage-label" x="18" y="25">Current</text>
                  </svg>
                </div>
              </div>

              <!-- Two Sub Cards: Low Attendance Alerts & Upcoming Labs -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <!-- Low Attendance Alerts Card -->
                <div class="edu-card" style="border-color: ${lowAttendanceSubjects.length > 0 ? 'var(--color-error-container)' : 'var(--color-outline-variant)'};">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2" style="color: var(--color-error);">
                      <span class="material-symbols-outlined">warning</span>
                      <h3 class="font-headline-md" style="color: var(--color-on-background);">Attention Required</h3>
                    </div>
                    <span class="status-chip status-critical">${lowAttendanceSubjects.length} Courses</span>
                  </div>

                  ${lowAttendanceSubjects.length === 0 ? `
                    <div class="py-6 text-center" style="color: var(--color-safe);">
                      <span class="material-symbols-outlined" style="font-size: 36px;">check_circle</span>
                      <p class="font-body-md mt-2 font-semibold">All subjects are above ${stats.targetThreshold}%!</p>
                      <p class="font-label-sm" style="color: var(--color-on-surface-variant);">Great job maintaining attendance.</p>
                    </div>
                  ` : `
                    <ul class="flex flex-col gap-4">
                      ${lowAttendanceSubjects.map(sub => `
                        <li class="flex flex-col gap-1.5 cursor-pointer" onclick="window.ClassTrackApp.showSubjectDetail('${sub.id}')">
                          <div class="flex justify-between items-end">
                            <span class="font-body-md font-semibold" style="color: var(--color-on-background);">${sub.name}</span>
                            <span class="font-label-sm font-bold" style="color: ${sub.percentage < 65 ? 'var(--color-error)' : 'var(--color-warning)'};">
                              ${sub.percentage}%
                            </span>
                          </div>
                          <div class="progress-track">
                            <div class="progress-fill ${sub.percentage < 65 ? 'critical' : 'warning'}" style="width: ${sub.percentage}%;"></div>
                          </div>
                          <span class="font-label-sm" style="color: var(--color-on-surface-variant);">
                            Must attend <strong>${sub.catchUpNeeded} more</strong> classes to reach ${stats.targetThreshold}%.
                          </span>
                        </li>
                      `).join('')}
                    </ul>
                    <button class="btn btn-secondary w-full mt-4 btn-sm" onclick="window.ClassTrackApp.navigate('subjects')">
                      View All Subjects
                    </button>
                  `}
                </div>

                <!-- Dynamic Upcoming Schedule & Labs Card -->
                <div class="edu-card">
                  <div class="flex items-center justify-between mb-4 pb-2 border-b" style="border-color: var(--color-outline-variant);">
                    <div class="flex items-center gap-2" style="color: var(--color-secondary);">
                      <span class="material-symbols-outlined">${(this.upcomingFilter || 'all') === 'lab' ? 'science' : 'calendar_clock'}</span>
                      <h3 class="font-headline-md" style="color: var(--color-on-background);">${(this.upcomingFilter || 'all') === 'lab' ? 'Upcoming Labs' : 'Upcoming Schedule'}</h3>
                    </div>
                    <div class="flex items-center gap-1">
                      <button class="btn btn-sm ${(this.upcomingFilter || 'all') === 'all' ? 'btn-primary' : 'btn-secondary'}" style="font-size: 0.72rem; padding: 2px 8px;" onclick="window.ClassTrackDashboard.setUpcomingFilter('all')">All</button>
                      <button class="btn btn-sm ${(this.upcomingFilter || 'all') === 'lab' ? 'btn-primary' : 'btn-secondary'}" style="font-size: 0.72rem; padding: 2px 8px;" onclick="window.ClassTrackDashboard.setUpcomingFilter('lab')">Labs Only</button>
                    </div>
                  </div>

                  <div class="flex flex-col gap-3">
                    ${(() => {
                      const upcomingFilter = this.upcomingFilter || 'all';
                      const upcomingSlots = stateManager.getUpcomingSchedule(upcomingFilter, 4);

                      if (upcomingSlots.length === 0) {
                        return `
                          <div class="py-6 text-center" style="color: var(--color-on-surface-variant);">
                            <span class="material-symbols-outlined" style="font-size: 32px;">event_note</span>
                            <p class="font-body-sm mt-1">No upcoming ${upcomingFilter === 'lab' ? 'lab sessions' : 'scheduled classes'} found.</p>
                            <button class="btn btn-secondary btn-sm mt-2" onclick="window.ClassTrackApp.openAddSlotModal()">
                              <span class="material-symbols-outlined" style="font-size: 14px;">add</span> Add Timetable Slot
                            </button>
                          </div>
                        `;
                      }

                      return upcomingSlots.map(slot => `
                        <div style="background-color: var(--color-surface-container-low); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--color-surface-variant); cursor: pointer;" class="flex items-center justify-between transition-all hover:border-slate-400" onclick="window.ClassTrackApp.showSubjectDetail('${slot.subject.id}')">
                          <div>
                            <div class="flex items-center gap-2">
                              <h4 class="font-body-md font-semibold" style="color: var(--color-on-background);">${slot.subject.name}</h4>
                              <span class="font-label-sm opacity-70">${slot.subject.code || ''}</span>
                            </div>
                            <p class="font-label-sm flex items-center gap-1 mt-1" style="color: var(--color-on-surface-variant);">
                              <span class="material-symbols-outlined" style="font-size: 14px; color: var(--color-primary);">schedule</span> <strong style="color: var(--color-primary);">${slot.timingLabel}</strong>
                              <span class="mx-1">•</span>
                              <span class="material-symbols-outlined" style="font-size: 14px;">location_on</span> ${slot.room || 'TBA'}
                            </p>
                          </div>
                          <div>
                            ${slot.isLab ? `<span class="status-chip status-warning" style="font-size: 0.7rem;">Lab</span>` : `<span class="status-chip status-neutral" style="font-size: 0.7rem;">${slot.subject.category || 'Theory'}</span>`}
                          </div>
                        </div>
                      `).join('');
                    })()}
                  </div>
                </div>

              </div>
            </div>

            <!-- Right Column (4 cols): Today's Classes Quick Logger (Stitch Screen 1) -->
            <div class="lg:col-span-4 flex flex-col gap-6">
              <div class="edu-card h-full flex flex-col">
                <div class="flex items-center justify-between mb-4 pb-2 border-b" style="border-color: var(--color-outline-variant);">
                  <div>
                    <h3 class="font-headline-md" style="color: var(--color-on-background);">${isSunday ? 'Sunday Holiday' : `${todayName}'s Classes`}</h3>
                    <p class="font-label-sm" style="color: var(--color-on-surface-variant);">${isSunday ? 'Public Holiday' : '1-Click Attendance Logger'}</p>
                  </div>
                  <span class="font-label-sm px-2.5 py-1 rounded-md" style="background-color: var(--color-surface-container-high); color: var(--color-on-surface-variant);">
                    ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div class="flex flex-col gap-3 flex-grow overflow-y-auto" style="max-height: 520px;">
                  ${isSunday ? `
                    <div class="text-center py-6 px-3" style="color: var(--color-on-surface-variant);">
                      <div class="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-2.5 shadow-sm" style="background-color: var(--color-secondary-container); color: var(--color-on-secondary-container);">
                        <span class="material-symbols-outlined" style="font-size: 26px;">beach_access</span>
                      </div>
                      <h4 class="font-headline-sm font-bold text-base" style="color: var(--color-on-background);">Sunday Holiday</h4>
                      <p class="font-body-sm text-xs mt-0.5" style="color: var(--color-on-surface-variant);">No classes scheduled for today. Enjoy your holiday!</p>
                    </div>

                    ${nextDayClasses.length > 0 ? `
                      <div class="pt-3 border-t flex flex-col gap-2.5" style="border-color: var(--color-outline-variant);">
                        <div class="flex items-center justify-between">
                          <span class="font-label-sm uppercase font-bold tracking-wider text-xs" style="color: var(--color-primary);">Upcoming • ${nextScheduledDay}</span>
                          <span class="font-label-sm text-xs" style="color: var(--color-on-surface-variant);">${nextDayClasses.length} session${nextDayClasses.length > 1 ? 's' : ''}</span>
                        </div>
                        <div class="flex flex-col gap-2">
                          ${nextDayClasses.map(slot => {
                            const subject = state.subjects.find(s => s.id === slot.subjectId) || { name: 'Subject', code: '', instructor: 'Faculty' };
                            return `
                              <div style="border: 1px solid var(--color-outline-variant); border-radius: 10px; padding: 10px; background-color: var(--color-surface);" class="flex items-center justify-between gap-2">
                                <div class="overflow-hidden">
                                  <span class="font-label-sm font-mono text-xs font-bold block" style="color: var(--color-primary);">${slot.timeStr}</span>
                                  <h5 class="font-body-md font-semibold text-sm truncate" style="color: var(--color-on-background);">${subject.name}</h5>
                                  <p class="font-label-sm text-xs" style="color: var(--color-on-surface-variant);">${slot.room || 'TBA'} • ${subject.instructor || 'Faculty'}</p>
                                </div>
                                <span class="status-chip status-neutral text-xs shrink-0">Upcoming</span>
                              </div>
                            `;
                          }).join('')}
                        </div>
                      </div>
                    ` : ''}
                  ` : todayClasses.length === 0 ? `
                    <div class="text-center py-6 px-3" style="color: var(--color-on-surface-variant);">
                      <span class="material-symbols-outlined" style="font-size: 36px; color: var(--color-outline);">event_available</span>
                      <h4 class="font-headline-sm font-bold text-sm mt-1" style="color: var(--color-on-background);">No Classes for ${todayName}</h4>
                      <p class="font-body-sm text-xs mt-0.5" style="color: var(--color-on-surface-variant);">No lectures or labs in your timetable today.</p>
                    </div>

                    ${nextDayClasses.length > 0 ? `
                      <div class="pt-3 border-t flex flex-col gap-2.5" style="border-color: var(--color-outline-variant);">
                        <div class="flex items-center justify-between">
                          <span class="font-label-sm uppercase font-bold tracking-wider text-xs" style="color: var(--color-primary);">Upcoming • ${nextScheduledDay}</span>
                          <span class="font-label-sm text-xs" style="color: var(--color-on-surface-variant);">${nextDayClasses.length} session${nextDayClasses.length > 1 ? 's' : ''}</span>
                        </div>
                        <div class="flex flex-col gap-2">
                          ${nextDayClasses.map(slot => {
                            const subject = state.subjects.find(s => s.id === slot.subjectId) || { name: 'Subject', code: '', instructor: 'Faculty' };
                            return `
                              <div style="border: 1px solid var(--color-outline-variant); border-radius: 10px; padding: 10px; background-color: var(--color-surface);" class="flex items-center justify-between gap-2">
                                <div class="overflow-hidden">
                                  <span class="font-label-sm font-mono text-xs font-bold block" style="color: var(--color-primary);">${slot.timeStr}</span>
                                  <h5 class="font-body-md font-semibold text-sm truncate" style="color: var(--color-on-background);">${subject.name}</h5>
                                  <p class="font-label-sm text-xs" style="color: var(--color-on-surface-variant);">${slot.room || 'TBA'} • ${subject.instructor || 'Faculty'}</p>
                                </div>
                                <span class="status-chip status-neutral text-xs shrink-0">Upcoming</span>
                              </div>
                            `;
                          }).join('')}
                        </div>
                      </div>
                    ` : `
                    <div class="text-center mt-2">
                        <button class="btn btn-secondary btn-sm" onclick="window.ClassTrackApp.openAddSlotModal()">
                          <span class="material-symbols-outlined" style="font-size: 16px;">add</span> Add ${todayName} Class
                        </button>
                      </div>
                    `}
                  ` : todayClasses.map(slot => {
                    const esc = str => (window.ClassTrackApp ? window.ClassTrackApp.escapeHTML(str) : (str || ''));
                    const subject = state.subjects.find(s => s.id === slot.subjectId) || { name: 'Engineering Subject', code: 'ENG', instructor: 'Faculty' };
                    const todayDateStr = window.EduTrackState.getLocalDateString();
                    const isLogged = (state.logs || []).find(l => 
                      l.subjectId === slot.subjectId && 
                      l.date === todayDateStr && 
                      ((l.slotId && l.slotId === slot.id) || (l.timeStr && l.timeStr === slot.timeStr) || (!l.slotId && !l.timeStr))
                    );

                    return `
                      <div style="border: 1px solid var(--color-surface-variant); border-radius: 12px; padding: 14px; background-color: var(--color-surface); ${isLogged ? 'opacity: 0.95;' : ''}" class="flex flex-col gap-2.5 transition-all hover:border-slate-400">
                        <div class="flex justify-between items-start">
                          <div>
                            <span class="font-label-sm block uppercase tracking-wider font-mono font-bold" style="color: var(--color-primary);">
                              ${esc(slot.timeStr)}
                            </span>
                            <h4 class="font-body-md font-semibold mt-0.5" style="color: var(--color-on-background); cursor: pointer;" onclick="window.ClassTrackApp.showSubjectDetail('${slot.subjectId}')">
                              ${esc(subject.name)}
                            </h4>
                            <p class="font-label-sm flex items-center gap-1 mt-1" style="color: var(--color-on-surface-variant);">
                              <span class="material-symbols-outlined" style="font-size: 14px;">location_on</span> ${esc(slot.room || 'TBA')}
                              ${subject.code ? `<span class="mx-1">•</span><span>${esc(subject.code)}</span>` : ''}
                              <span class="mx-1">•</span>
                              <span class="material-symbols-outlined" style="font-size: 14px;">person</span> <span>${esc(subject.instructor || 'Faculty')}</span>
                            </p>
                          </div>
                        </div>

                        ${isLogged ? `
                          <div class="mt-1 pt-2 border-t flex items-center justify-between" style="border-color: var(--color-outline-variant);">
                            <div class="flex items-center gap-1.5">
                              <span class="font-label-sm" style="color: var(--color-on-surface-variant);">Status:</span>
                              ${isLogged.status === 'present' ? `
                                <span class="status-chip status-safe"><span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> PRESENT</span>
                              ` : isLogged.status === 'absent' ? `
                                <span class="status-chip status-critical"><span class="material-symbols-outlined" style="font-size: 14px;">cancel</span> ABSENT</span>
                              ` : isLogged.status === 'faculty_absent' ? `
                                <span class="status-chip status-warning"><span class="material-symbols-outlined" style="font-size: 14px;">person_off</span> FACULTY ABSENT</span>
                              ` : isLogged.status === 'other_faculty' ? `
                                <span class="status-chip" style="background-color: rgba(124, 58, 237, 0.15); color: #7C3AED; border: 1px solid rgba(124, 58, 237, 0.3);"><span class="material-symbols-outlined" style="font-size: 14px;">swap_horiz</span> SUBSTITUTE</span>
                              ` : `
                                <span class="status-chip status-neutral">${isLogged.status.toUpperCase()}</span>
                              `}
                            </div>
                            <button class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 0.75rem;" title="Undo or re-mark attendance" onclick="window.ClassTrackDashboard.undoLog('${isLogged.id}')">
                              Change
                            </button>
                          </div>
                          ${isLogged.remarks ? `
                            <p class="font-label-sm text-xs opacity-75 italic mt-0.5" style="color: var(--color-on-surface-variant);">${esc(isLogged.remarks)}</p>
                          ` : ''}
                        ` : `
                          <div class="flex flex-col gap-1.5 mt-1 pt-2 border-t" style="border-color: var(--color-outline-variant);">
                            <div class="flex gap-2">
                              <button class="btn btn-safe flex-1 btn-sm" onclick="window.ClassTrackDashboard.quickLog('${slot.subjectId}', 'present', '${slot.timeStr}', '${slot.id}')">
                                <span class="material-symbols-outlined" style="font-size: 16px;">check_circle</span> Present
                              </button>
                              <button class="btn btn-danger flex-1 btn-sm" onclick="window.ClassTrackDashboard.quickLog('${slot.subjectId}', 'absent', '${slot.timeStr}', '${slot.id}')">
                                <span class="material-symbols-outlined" style="font-size: 16px;">cancel</span> Absent
                              </button>
                            </div>
                            <div class="flex gap-2">
                              <button class="btn btn-secondary flex-1 btn-sm" style="font-size: 0.75rem; padding: 4px 6px; background-color: var(--color-surface-container-high); color: var(--color-on-surface);" title="Faculty is on leave or class cancelled (free period - does not penalize attendance)" onclick="window.ClassTrackDashboard.quickLog('${slot.subjectId}', 'faculty_absent', '${slot.timeStr}', '${slot.id}')">
                                <span class="material-symbols-outlined" style="font-size: 14px;">person_off</span> Faculty Absent
                              </button>
                              <button class="btn btn-secondary flex-1 btn-sm" style="font-size: 0.75rem; padding: 4px 6px; border-color: rgba(124, 58, 237, 0.4); color: #7C3AED;" title="Record class taken by substitute/proxy faculty" onclick="window.ClassTrackApp.openSubstituteModal('${slot.subjectId}', '${slot.timeStr}')">
                                <span class="material-symbols-outlined" style="font-size: 14px; color: #7C3AED;">swap_horiz</span> Other Faculty
                              </button>
                            </div>
                          </div>
                        `}
                      </div>
                    `;
                  }).join('')}
                </div>

                <div class="mt-4 pt-3 border-t text-center" style="border-color: var(--color-outline-variant);">
                  <button class="btn btn-secondary w-full" onclick="window.ClassTrackApp.navigate('schedule')">
                    <span class="material-symbols-outlined">calendar_month</span> View Full Timetable
                  </button>
                </div>
              </div>
            </div>
          </div>
        `}
      </div>
    `;
  },

  setUpcomingFilter(filter) {
    this.upcomingFilter = filter;
    const container = document.getElementById('view-content');
    if (container) {
      this.render(container);
    }
  },

  quickLog(subjectId, status, timeStr, slotId) {
    const subject = window.EduTrackState.getState().subjects.find(s => s.id === subjectId);
    let remarks = 'Quick logged from Dashboard';
    if (status === 'faculty_absent') remarks = 'Faculty Absent / Free Period';

    window.EduTrackState.logAttendance(subjectId, status, {
      timeStr,
      slotId: slotId || '',
      type: subject?.type === 'lab' ? 'Lab' : 'Lecture',
      remarks
    });

    let msg = `Marked ${status.toUpperCase()} for ${subject?.name || 'Class'}`;
    let toastType = 'success';
    if (status === 'absent') {
      msg = `Marked Absent for ${subject?.name || 'Class'}`;
      toastType = 'warning';
    } else if (status === 'faculty_absent') {
      msg = `Marked Faculty Absent (Exempted) for ${subject?.name || 'Class'}`;
      toastType = 'info';
    }

    window.ClassTrackApp.showToast(msg, toastType);
    
    const container = document.getElementById('view-content');
    if (container) {
      this.render(container);
    }
  },

  undoLog(logId) {
    window.EduTrackState.deleteLog(logId);
    window.ClassTrackApp.showToast('Attendance record removed. You can re-mark now.', 'info');
    const container = document.getElementById('view-content');
    if (container) {
      this.render(container);
    }
  }
};

// Aliases for compatibility
window.EduTrackDashboard = window.ClassTrackDashboard;
