/**
 * ClassTrack Engineering - Weekly Schedule & Full Month Calendar View (Screen 2)
 * Precision Academic Tracker - Mobile-first & Desktop Matrix
 */

window.ClassTrackSchedule = {
  activeViewMode: 'weekly', // 'weekly' or 'monthly'
  selectedDay: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
  mobileLayout: 'day', // 'day' (default on mobile) or 'matrix'
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(), // 0-indexed (0 = Jan, 7 = Aug)
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  hours: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],

  getAcademicDateForDay(dayName) {
    const dayIndices = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
    const targetDayIdx = dayIndices[dayName] !== undefined ? dayIndices[dayName] : 1;
    const now = new Date();
    const currentDayIdx = now.getDay() === 0 ? 7 : now.getDay(); // 1=Mon, ..., 7=Sun
    const diffToMonday = 1 - currentDayIdx;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + (targetDayIdx - 1));

    const dd = String(targetDate.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const mm = monthNames[targetDate.getMonth()];
    const yy = String(targetDate.getFullYear()).slice(-2);
    const dayUpper = dayName.toUpperCase();

    return {
      dayUpper,
      formattedDate: `${dd}:${mm}:${yy}`,
      shortDate: `${dd} ${mm}`,
      fullHeader: `${dayUpper} ${dd}:${mm}:${yy}`,
      shortHeader: `${dayUpper.slice(0, 3)} ${dd}:${mm}:${yy}`,
      rawDate: targetDate
    };
  },

  render(container) {
    const stateManager = window.EduTrackState;
    const state = stateManager.getState();
    const now = new Date();
    const todayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Calculate current week date span (Monday to Saturday)
    const monInfo = this.getAcademicDateForDay('Monday');
    const satInfo = this.getAcademicDateForDay('Saturday');
    const weekSpan = `${monInfo.shortHeader} - ${satInfo.shortHeader}`;

    const totalSlots = (state.schedule || []).length;

    // Ensure selectedDay is valid
    if (!this.days.includes(this.selectedDay)) {
      this.selectedDay = 'Monday';
    }

    container.innerHTML = `
      <div class="flex flex-col gap-5 animate-fade-in">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="font-headline-lg font-bold" style="color: var(--color-on-background);">
                ${this.activeViewMode === 'weekly' ? 'Class Timetable' : 'Academic Calendar'}
              </h1>
              <span class="live-badge" title="Live synced academic time">
                <span class="live-dot"></span>
                <span>${this.getAcademicDateForDay(todayName).shortHeader}</span>
              </span>
            </div>
            <p class="font-body-md" style="color: var(--color-on-surface-variant); font-size: 0.875rem;">
              ${this.activeViewMode === 'weekly' ? 'Weekly schedule with lectures, labs, and classroom tracking.' : 'Full monthly interactive academic schedule and recorded history.'}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- View Switcher (Weekly vs Full Calendar) -->
            <div class="flex p-1 rounded-xl border shrink-0" style="background-color: var(--color-surface-container-low); border-color: var(--color-outline-variant);">
              <button class="px-3 py-1.5 rounded-lg font-label-sm font-semibold transition-all ${this.activeViewMode === 'weekly' ? 'btn-primary shadow-sm' : ''}" onclick="window.ClassTrackSchedule.switchView('weekly')">
                <span class="material-symbols-outlined align-middle mr-1" style="font-size: 16px;">view_week</span> Weekly
              </button>
              <button class="px-3 py-1.5 rounded-lg font-label-sm font-semibold transition-all ${this.activeViewMode === 'monthly' ? 'btn-primary shadow-sm' : ''}" onclick="window.ClassTrackSchedule.switchView('monthly')">
                <span class="material-symbols-outlined align-middle mr-1" style="font-size: 16px;">calendar_month</span> Calendar
              </button>
            </div>

            <!-- Manage Slots List -->
            <button class="btn btn-secondary btn-sm" onclick="window.ClassTrackSchedule.openManageSlotsModal()">
              <span class="material-symbols-outlined" style="font-size: 16px;">format_list_bulleted</span> Slots (${totalSlots})
            </button>

            <!-- Add Timetable Slot -->
            <button class="btn btn-primary btn-sm" onclick="window.ClassTrackSchedule.openAddSlotModal()">
              <span class="material-symbols-outlined" style="font-size: 16px;">add</span> Add Schedule
            </button>
          </div>
        </div>

        ${this.activeViewMode === 'weekly' ? this.renderWeeklySchedule(state, todayName, currentHour, currentMinute, weekSpan) : this.renderMonthlyCalendar(state)}
      </div>
    `;
  },

  renderWeeklySchedule(state, todayName, currentHour, currentMinute, weekSpan) {
    return `
      <!-- Mobile Day Selector & Switcher Header -->
      <div class="flex flex-col gap-3">
        <!-- Day Selector Pills (Horizontal swipe on mobile, clean grid on desktop) -->
        <div class="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar" style="-webkit-overflow-scrolling: touch;">
          <div class="flex items-center gap-1.5 min-w-max">
            ${this.days.map(day => {
      const acad = this.getAcademicDateForDay(day);
      const isToday = day === todayName;
      const isSelected = day === this.selectedDay;
      const slotCount = (state.schedule || []).filter(s => s.day === day).length;

      return `
                <button 
                  class="flex flex-col items-center justify-center px-3.5 py-2 rounded-xl transition-all font-mono text-center ${isSelected ? 'shadow-sm' : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60'}" 
                  style="
                    min-width: 62px;
                    background-color: ${isSelected ? 'var(--color-primary)' : isToday ? 'var(--color-primary-container)' : 'var(--color-surface-container-low)'};
                    color: ${isSelected ? '#ffffff' : isToday ? 'var(--color-on-primary-container)' : 'var(--color-on-surface)'};
                    border: 1px solid ${isSelected ? 'var(--color-primary)' : isToday ? 'var(--color-primary)' : 'var(--color-outline-variant)'};
                  "
                  onclick="window.ClassTrackSchedule.selectDay('${day}')"
                >
                  <span class="font-bold text-xs leading-none">${acad.dayUpper.slice(0, 3)}</span>
                  <span class="text-[10px] opacity-80 mt-0.5">${acad.shortDate}</span>
                  ${isToday ? `<span class="text-[9px] font-extrabold uppercase mt-0.5 ${isSelected ? 'text-amber-200' : 'text-primary'}">• TODAY</span>` : `<span class="text-[9px] opacity-60 mt-0.5">${slotCount} cls</span>`}
                </button>
              `;
    }).join('')}
          </div>

          <!-- View Mode Toggle: Day Stream vs Full Matrix -->
          <div class="flex items-center gap-1 shrink-0">
            <button 
              class="btn btn-sm ${this.mobileLayout === 'day' ? 'btn-primary' : 'btn-secondary'}" 
              style="padding: 4px 8px; font-size: 0.75rem;" 
              title="Day view list"
              onclick="window.ClassTrackSchedule.setLayout('day')"
            >
              <span class="material-symbols-outlined" style="font-size: 15px;">view_agenda</span> Day
            </button>
            <button 
              class="btn btn-sm ${this.mobileLayout === 'matrix' ? 'btn-primary' : 'btn-secondary'}" 
              style="padding: 4px 8px; font-size: 0.75rem;" 
              title="Full weekly grid matrix"
              onclick="window.ClassTrackSchedule.setLayout('matrix')"
            >
              <span class="material-symbols-outlined" style="font-size: 15px;">grid_view</span> Grid
            </button>
          </div>
        </div>

        <!-- Render Content based on mobileLayout -->
        ${this.mobileLayout === 'day' ? this.renderDayStream(state, todayName, currentHour, currentMinute) : this.renderMatrixGrid(state, todayName, currentHour, currentMinute, weekSpan)}
      </div>
    `;
  },

  /* ----------------------------------------------------
     Mobile-First Day Stream (Clean Vertical Timeline)
  ----------------------------------------------------- */
  renderDayStream(state, todayName, currentHour, currentMinute) {
    const stateManager = window.EduTrackState;
    const acad = this.getAcademicDateForDay(this.selectedDay);
    const isToday = this.selectedDay === todayName;

    // Filter slots for selected day & sort chronologically
    const daySlots = (state.schedule || [])
      .filter(s => s.day === this.selectedDay)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    if (daySlots.length === 0) {
      return `
        <div class="edu-card text-center py-12 px-4 flex flex-col items-center gap-3">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center" style="background-color: var(--color-surface-container-high); color: var(--color-on-surface-variant);">
            <span class="material-symbols-outlined" style="font-size: 32px;">event_available</span>
          </div>
          <div>
            <h3 class="font-headline-md font-bold" style="color: var(--color-on-background);">No Classes Scheduled</h3>
            <p class="font-body-sm mt-1" style="color: var(--color-on-surface-variant);">
              You have no lectures or practical labs set for <strong>${this.selectedDay} (${acad.shortDate})</strong>.
            </p>
          </div>
          <button class="btn btn-primary btn-sm mt-2" onclick="window.ClassTrackApp.openAddSlotModal('${this.selectedDay}')">
            <span class="material-symbols-outlined" style="font-size: 16px;">add</span> Add ${this.selectedDay} Class
          </button>
        </div>
      `;
    }

    return `
      <div class="flex flex-col gap-3.5">
        <div class="flex items-center justify-between px-1">
          <span class="font-label-md font-bold" style="color: var(--color-on-background);">
            ${this.selectedDay} Schedule (${daySlots.length} ${daySlots.length === 1 ? 'Class' : 'Classes'})
          </span>
          <span class="font-label-sm" style="color: var(--color-on-surface-variant);">${acad.formattedDate}</span>
        </div>

        <div class="flex flex-col gap-3">
          ${daySlots.map(slot => {
      const subject = stateManager.getSubjectStats(slot.subjectId) || { name: 'Subject', code: 'ENG', percentage: 0, instructor: 'Faculty' };
      const typeLabel = subject.type === 'lab' ? 'Lab' : subject.type === 'tutorial' ? 'Tutorial' : 'Theory';
      const typeChipClass = subject.type === 'lab' ? 'status-warning' : subject.type === 'tutorial' ? 'status-substitute' : 'status-safe';
      const durationFormatted = window.ClassTrackApp.formatDurationHuman(slot.duration, 'hours');

      return `
              <div class="edu-card p-4 flex flex-col gap-3 transition-all hover:border-slate-400">
                <!-- Top Row: Time Range, Duration, Subject Category -->
                <div class="flex items-center justify-between pb-2 border-b" style="border-color: var(--color-outline-variant);">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-sm" style="color: var(--color-primary);">
                      ${slot.timeStr || slot.time}
                    </span>
                    <span class="font-label-sm px-2 py-0.5 rounded text-[11px]" style="background-color: var(--color-surface-container-high); color: var(--color-on-surface-variant);">
                      ${durationFormatted}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="status-chip ${typeChipClass}" style="font-size: 0.7rem; padding: 2px 8px;">
                      ${typeLabel}
                    </span>
                    <button class="btn-icon" style="width: 28px; height: 28px;" title="Edit slot" onclick="window.ClassTrackApp.openEditSlotModal('${slot.id}')">
                      <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                    </button>
                    <button class="btn-icon text-error" style="width: 28px; height: 28px;" title="Delete slot" onclick="window.ClassTrackSchedule.confirmDeleteSlot('${slot.id}', '${subject.name.replace(/'/g, "\\'")}', '${slot.day}', '${slot.timeStr}')">
                      <span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-error);">delete</span>
                    </button>
                  </div>
                </div>

                <!-- Middle Row: Course Name, Code, Instructor, Room -->
                <div class="cursor-pointer" onclick="window.ClassTrackApp.showSubjectDetail('${slot.subjectId}')">
                  <div class="flex items-baseline gap-2">
                    <h3 class="font-headline-sm font-bold" style="color: var(--color-on-background); font-size: 1.05rem;">
                      ${subject.name}
                    </h3>
                    ${subject.code ? `<span class="font-label-sm font-mono font-bold opacity-75">(${subject.code})</span>` : ''}
                  </div>
                  <p class="font-body-sm flex items-center gap-2 mt-1" style="color: var(--color-on-surface-variant);">
                    <span class="material-symbols-outlined" style="font-size: 16px;">person</span> ${subject.instructor || 'Faculty'}
                    <span class="opacity-40">•</span>
                    <span class="material-symbols-outlined" style="font-size: 16px;">location_on</span> ${slot.room || 'TBA'}
                  </p>
                </div>

                <!-- Bottom Row: Status Reflection or Initial 1-Click Buttons -->
                ${(() => {
                  const now = new Date();
                  const currentDayName = now.toLocaleDateString('en-US', { weekday: 'long' });
                  const todayDateStr = window.EduTrackState.getLocalDateString();
                  const isTodaySelected = this.selectedDay === currentDayName;
                  const isLogged = isTodaySelected ? (state.logs || []).find(l => l.subjectId === slot.subjectId && l.date === todayDateStr) : null;

                  if (isLogged) {
                    return `
                      <div class="pt-2 border-t flex items-center justify-between" style="border-color: var(--color-outline-variant);">
                        <span class="font-label-sm text-xs" style="color: var(--color-on-surface-variant);">Attendance Status:</span>
                        <span class="status-chip ${isLogged.status === 'present' ? 'status-safe' : isLogged.status === 'absent' ? 'status-critical' : isLogged.status === 'faculty_absent' ? 'status-warning' : isLogged.status === 'other_faculty' ? 'status-substitute' : 'status-neutral'}">
                          <span class="material-symbols-outlined" style="font-size: 14px;">${isLogged.status === 'present' ? 'check_circle' : isLogged.status === 'absent' ? 'cancel' : isLogged.status === 'faculty_absent' ? 'person_off' : 'verified'}</span>
                          ${isLogged.status === 'present' ? 'PRESENT (ATTENDED)' : isLogged.status === 'absent' ? 'ABSENT (MISSED)' : isLogged.status === 'faculty_absent' ? 'FACULTY ABSENT (FREE)' : isLogged.status === 'other_faculty' ? 'SUBSTITUTE' : isLogged.status.toUpperCase()}
                        </span>
                      </div>
                    `;
                  }

                  if (isTodaySelected) {
                    return `
                      <div class="pt-2 border-t flex flex-wrap items-center gap-1.5" style="border-color: var(--color-outline-variant);">
                        <button class="btn btn-safe btn-sm flex-1" style="padding: 5px 8px; font-size: 0.75rem;" onclick="window.ClassTrackSchedule.quickLog('${slot.subjectId}', 'present', '${slot.timeStr || slot.time}')">
                          <span class="material-symbols-outlined" style="font-size: 15px;">check_circle</span> Present
                        </button>
                        <button class="btn btn-danger btn-sm flex-1" style="padding: 5px 8px; font-size: 0.75rem;" onclick="window.ClassTrackSchedule.quickLog('${slot.subjectId}', 'absent', '${slot.timeStr || slot.time}')">
                          <span class="material-symbols-outlined" style="font-size: 15px;">cancel</span> Absent
                        </button>
                        <button class="btn btn-secondary btn-sm flex-1" style="padding: 5px 8px; font-size: 0.75rem;" title="Faculty on leave" onclick="window.ClassTrackSchedule.quickLog('${slot.subjectId}', 'faculty_absent', '${slot.timeStr || slot.time}')">
                          <span class="material-symbols-outlined" style="font-size: 15px;">person_off</span> Free
                        </button>
                        <button class="btn btn-secondary btn-sm flex-1" style="padding: 5px 8px; font-size: 0.75rem; border-color: rgba(124, 58, 237, 0.4); color: #7C3AED;" title="Substitute faculty" onclick="window.ClassTrackApp.openSubstituteModal('${slot.subjectId}', '${slot.timeStr || slot.time}')">
                          <span class="material-symbols-outlined" style="font-size: 15px; color: #7C3AED;">swap_horiz</span> Proxy
                        </button>
                      </div>
                    `;
                  }

                  return `
                    <div class="pt-2 border-t flex items-center justify-between text-xs font-label-sm" style="border-color: var(--color-outline-variant); color: var(--color-on-surface-variant);">
                      <span>Scheduled Timetable Session</span>
                      <span class="status-chip status-neutral text-xs">Active Slot</span>
                    </div>
                  `;
                })()}
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  },

  /* ----------------------------------------------------
     Desktop / Matrix Full Grid Layout
  ----------------------------------------------------- */
  renderMatrixGrid(state, todayName, currentHour, currentMinute, weekSpan) {
    const stateManager = window.EduTrackState;
    const now = new Date();

    return `
      <div class="flex flex-col gap-4">
        <!-- Legend & Controls Bar -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
          <div class="flex items-center gap-4 text-xs">
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-sm" style="background-color: var(--theory-bg); border: 1.5px solid var(--theory-border);"></div>
              <span class="font-label-sm uppercase" style="color: var(--color-on-surface-variant);">Theory</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-sm" style="background-color: var(--lab-bg); border: 1.5px solid var(--lab-border);"></div>
              <span class="font-label-sm uppercase" style="color: var(--color-on-surface-variant);">Lab</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-sm" style="background-color: var(--tutorial-bg); border: 1.5px solid var(--tutorial-border);"></div>
              <span class="font-label-sm uppercase" style="color: var(--color-on-surface-variant);">Tutorial</span>
            </div>
          </div>
          <div class="font-label-sm font-bold tracking-wider" style="color: var(--color-on-surface-variant);">
            ${weekSpan}
          </div>
        </div>

        <!-- Timetable Grid Container with horizontal scroll -->
        <div class="timetable-wrapper">
          <div class="overflow-x-auto relative" style="-webkit-overflow-scrolling: touch;">
            <div class="timetable-grid">
              
              <!-- Header Row with DAY DD:MONTH:YY -->
              <div class="grid-header" style="color: var(--color-on-surface-variant);">Time</div>
              ${this.days.map(day => {
      const acad = this.getAcademicDateForDay(day);
      const isToday = day === todayName;
      return `
                  <div class="grid-header ${isToday ? 'today' : ''} flex-col py-2">
                    <span class="font-bold font-mono">${acad.dayUpper.slice(0, 3)}</span>
                    <span class="font-mono text-xs opacity-80">${acad.formattedDate}</span>
                  </div>
                `;
    }).join('')}

              <!-- Time Slot Rows -->
              ${this.hours.map((hour) => {
      const hourInt = parseInt(hour.split(':')[0], 10);
      const isCurrentHour = hourInt === currentHour;

      return `
                  <!-- Time Label -->
                  <div class="time-label ${isCurrentHour ? 'font-bold text-primary' : ''}">${hour}</div>

                  <!-- Day Cells for this hour -->
                  ${this.days.map(day => {
        const acad = this.getAcademicDateForDay(day);
        const isToday = day === todayName;
        const showTimeLine = isToday && isCurrentHour;
        const lineOffsetTop = showTimeLine ? Math.round((currentMinute / 60) * 65) : 0;

        // Find slots starting at this exact hour on this day
        const matchingSlots = (state.schedule || []).filter(s => {
          if (s.day !== day) return false;
          const sHour = parseInt(s.time.split(':')[0], 10);
          return sHour === hourInt;
        });

        return `
                      <div class="grid-cell ${isToday ? 'bg-slate-50/40 dark:bg-slate-900/30' : ''}">
                        
                        ${showTimeLine ? `
                          <div class="current-time-line" style="top: ${lineOffsetTop}px;" title="Current Time: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}"></div>
                        ` : ''}

                        ${matchingSlots.map(slot => {
          const subject = stateManager.getSubjectStats(slot.subjectId) || { name: 'Subject', code: 'ENG', percentage: 0, instructor: 'Instructor' };
          const typeClass = subject.type === 'lab' ? 'course-lab' : subject.type === 'tutorial' ? 'course-tutorial' : 'course-theory';

          // Calculate height spanning multi-hours
          const duration = slot.duration || 1;
          const heightStyle = duration > 1 ? `height: calc(${duration * 100}% + ${(duration - 1)}px); z-index: 15;` : '';
          const formattedSlotHeader = `${acad.shortHeader} ${slot.timeStr || slot.time}`;

          return `
                            <div class="course-block ${typeClass} group" style="${heightStyle}" onclick="window.ClassTrackApp.showSubjectDetail('${slot.subjectId}')">
                              
                              <!-- Quick Action Buttons on Top Right -->
                              <div class="absolute top-1.5 right-1.5 flex items-center gap-1 z-20">
                                <button class="btn-icon opacity-60 hover:opacity-100 hover:bg-black/15 dark:hover:bg-white/20 transition-all" style="width: 20px; height: 20px; padding: 0;" title="Edit slot" onclick="event.stopPropagation(); window.ClassTrackApp.openEditSlotModal('${slot.id}')">
                                  <span class="material-symbols-outlined" style="font-size: 13px;">edit</span>
                                </button>
                                <button class="btn-icon opacity-60 hover:opacity-100 hover:bg-black/15 dark:hover:bg-white/20 transition-all" style="width: 20px; height: 20px; padding: 0;" title="Delete slot" onclick="event.stopPropagation(); window.ClassTrackSchedule.confirmDeleteSlot('${slot.id}', '${subject.name.replace(/'/g, "\\'")}', '${slot.day}', '${slot.timeStr}')">
                                  <span class="material-symbols-outlined" style="font-size: 13px;">close</span>
                                </button>
                              </div>

                              <div class="font-label-sm font-bold truncate pr-10">${subject.code || subject.name}</div>
                              <div class="font-label-sm truncate text-xs opacity-90">${subject.name}</div>
                              <div class="mt-auto font-label-sm text-xs flex items-center gap-1 opacity-90">
                                <span class="material-symbols-outlined" style="font-size: 13px;">location_on</span> ${slot.room || 'TBA'}
                              </div>
                            </div>
                          `;
        }).join('')}
                      </div>
                    `;
      }).join('')}
                `;
    }).join('')}

            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ----------------------------------------------------
     Full Monthly Academic Calendar View
  ----------------------------------------------------- */
  renderMonthlyCalendar(state) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthName = monthNames[this.calendarMonth];
    const year = this.calendarYear;
    const today = new Date();

    const firstDay = new Date(year, this.calendarMonth, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sun
    const daysInMonth = new Date(year, this.calendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, this.calendarMonth, 0).getDate();

    const dayHeaders = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const cells = [];

    // Prev month padding
    const prevMonthDate = new Date(year, this.calendarMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDateNum = daysInPrevMonth - i;
      cells.push({
        dateNum: prevDateNum,
        isOtherMonth: true,
        fullDateStr: `${prevYear}-${prevMonth}-${String(prevDateNum).padStart(2, '0')}`
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const fullDateStr = `${year}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = today.getFullYear() === year && today.getMonth() === this.calendarMonth && today.getDate() === d;
      const dayDate = new Date(year, this.calendarMonth, d);
      const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });

      const daySlots = (state.schedule || []).filter(s => s.day === dayName);
      const dateLogs = (state.logs || []).filter(l => l.date === fullDateStr);

      cells.push({
        dateNum: d,
        isOtherMonth: false,
        isToday,
        dayName,
        fullDateStr,
        daySlots,
        dateLogs
      });
    }

    // Next month padding
    const nextMonthDate = new Date(year, this.calendarMonth + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const remainingCells = (7 - (cells.length % 7)) % 7;
    for (let n = 1; n <= remainingCells; n++) {
      cells.push({
        dateNum: n,
        isOtherMonth: true,
        fullDateStr: `${nextYear}-${nextMonth}-${String(n).padStart(2, '0')}`
      });
    }

    return `
      <div class="edu-card flex flex-col gap-4">
        <!-- Month Navigation Bar -->
        <div class="flex items-center justify-between pb-3 border-b" style="border-color: var(--color-outline-variant);">
          <div class="flex items-center gap-3">
            <h2 class="font-headline-md font-bold" style="color: var(--color-on-background);">
              ${currentMonthName} ${year}
            </h2>
            <button class="btn btn-secondary btn-sm" onclick="window.ClassTrackSchedule.goToCurrentMonth()">
              Today
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button class="btn-icon" onclick="window.ClassTrackSchedule.changeMonth(-1)" title="Previous Month">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <button class="btn-icon" onclick="window.ClassTrackSchedule.changeMonth(1)" title="Next Month">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        <!-- Month Grid (Responsive) -->
        <div class="calendar-month-grid overflow-x-auto pb-1" style="-webkit-overflow-scrolling: touch;">
          <!-- Day Headers -->
          ${dayHeaders.map(h => `
            <div class="calendar-day-header">${h}</div>
          `).join('')}

          <!-- Day Cells -->
          ${cells.map(cell => {
      if (cell.isOtherMonth) {
        return `
                <div class="calendar-day-cell other-month">
                  <span class="calendar-date-number opacity-40">${cell.dateNum}</span>
                </div>
              `;
      }

      return `
              <div class="calendar-day-cell ${cell.isToday ? 'today' : ''} cursor-pointer" onclick="window.ClassTrackSchedule.openDayDetailModal('${cell.fullDateStr}', '${cell.dayName}')">
                <div class="flex justify-between items-center mb-1">
                  <span class="calendar-date-number ${cell.isToday ? 'text-primary font-extrabold' : ''}">${cell.dateNum}</span>
                  ${cell.isToday ? '<span class="w-2 h-2 rounded-full" style="background-color: var(--color-primary);"></span>' : ''}
                </div>

                <div class="flex flex-col gap-1 overflow-y-auto max-h-16">
                  ${(cell.daySlots || []).slice(0, 2).map(slot => {
        const subject = state.subjects.find(s => s.id === slot.subjectId) || { name: 'Class', code: 'CRS' };
        return `
                      <span class="calendar-class-pill" style="background-color: var(--color-surface-container-high); color: var(--color-on-surface);" title="${subject.name} • ${slot.timeStr}">
                        ${slot.time} ${subject.code || subject.name.substring(0, 6)}
                      </span>
                    `;
      }).join('')}
                  ${(cell.daySlots || []).length > 2 ? `
                    <span class="font-label-sm text-[10px] opacity-70">+${cell.daySlots.length - 2} more</span>
                  ` : ''}

                  ${cell.dateLogs && cell.dateLogs.length > 0 ? `
                    <div class="mt-auto pt-0.5 flex items-center gap-1">
                      ${cell.dateLogs.some(l => l.status === 'present') ? '<span class="w-1.5 h-1.5 rounded-full" style="background-color: var(--color-safe);" title="Logged Present"></span>' : ''}
                      ${cell.dateLogs.some(l => l.status === 'absent') ? '<span class="w-1.5 h-1.5 rounded-full" style="background-color: var(--color-error);" title="Logged Absent"></span>' : ''}
                      <span class="font-label-sm text-[10px]" style="color: var(--color-on-surface-variant);">${cell.dateLogs.length} logged</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  },

  selectDay(day) {
    this.selectedDay = day;
    this.render(document.getElementById('view-content'));
  },

  setLayout(layout) {
    this.mobileLayout = layout;
    this.render(document.getElementById('view-content'));
  },

  switchView(mode) {
    this.activeViewMode = mode;
    this.render(document.getElementById('view-content'));
  },

  changeMonth(delta) {
    this.calendarMonth += delta;
    if (this.calendarMonth > 11) {
      this.calendarMonth = 0;
      this.calendarYear += 1;
    } else if (this.calendarMonth < 0) {
      this.calendarMonth = 11;
      this.calendarYear -= 1;
    }
    this.render(document.getElementById('view-content'));
  },

  goToCurrentMonth() {
    const now = new Date();
    this.calendarYear = now.getFullYear();
    this.calendarMonth = now.getMonth();
    this.render(document.getElementById('view-content'));
  },

  quickLog(subjectId, status, timeStr) {
    const subject = window.EduTrackState.getState().subjects.find(s => s.id === subjectId);
    let remarks = `Logged from Schedule (${this.selectedDay})`;
    if (status === 'faculty_absent') remarks = 'Faculty Absent / Free Period';

    window.EduTrackState.logAttendance(subjectId, status, {
      timeStr: timeStr || 'Class Session',
      type: subject?.type === 'lab' ? 'Lab' : 'Lecture',
      remarks
    });

    let msg = `Logged ${status.toUpperCase()} for ${subject?.name}`;
    let toastType = 'success';
    if (status === 'absent') {
      msg = `Marked Absent for ${subject?.name}`;
      toastType = 'warning';
    } else if (status === 'faculty_absent') {
      msg = `Marked Faculty Absent (Exempted) for ${subject?.name}`;
      toastType = 'info';
    }

    window.ClassTrackApp.showToast(msg, toastType);
    this.render(document.getElementById('view-content'));
  },

  openDayDetailModal(dateStr, dayName) {
    const state = window.EduTrackState.getState();
    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalContent || !modalOverlay) return;

    const daySlots = (state.schedule || []).filter(s => s.day === dayName);
    const dateLogs = (state.logs || []).filter(l => l.date === dateStr);

    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const [y, m, d] = dateStr.split('-');
    const formattedHeader = `${dayName.toUpperCase()} ${d}:${monthNames[parseInt(m, 10) - 1]}:${y.slice(-2)}`;

    const todayStr = window.EduTrackState.getLocalDateString();
    const isFuture = dateStr > todayStr;

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b mb-4" style="border-color: var(--color-outline-variant);">
          <div>
            <h3 class="font-headline-md font-bold" style="color: var(--color-on-background);">${formattedHeader}</h3>
            <p class="font-label-sm" style="color: var(--color-on-surface-variant);">${isFuture ? 'Upcoming Day (Future date)' : 'Day Details & Attendance'}</p>
          </div>
          <button class="btn-icon" onclick="window.ClassTrackApp.closeModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <h4 class="font-label-sm uppercase font-bold mb-2" style="color: var(--color-on-surface-variant);">Scheduled Classes (${daySlots.length})</h4>
            ${daySlots.length === 0 ? `
              <p class="font-body-sm py-2" style="color: var(--color-on-surface-variant);">No regular timetable classes scheduled for ${dayName}.</p>
            ` : daySlots.map(slot => {
      const subject = state.subjects.find(s => s.id === slot.subjectId) || { name: 'Class', code: 'CRS' };
      const logged = dateLogs.find(l => l.subjectId === slot.subjectId);

      return `
                <div class="p-3 rounded-xl mb-2 flex items-center justify-between border" style="background-color: var(--color-surface-container-low); border-color: var(--color-outline-variant);">
                  <div>
                    <span class="font-label-sm font-bold text-primary">${slot.timeStr || slot.time}</span>
                    <h5 class="font-body-md font-semibold mt-0.5" style="color: var(--color-on-background);">${subject.name} <span class="font-label-sm opacity-75">(${subject.code || 'CRS'})</span></h5>
                    <p class="font-label-sm opacity-80">${slot.room || 'TBA'}</p>
                  </div>
                  <div>
                    ${logged ? `
                      <span class="status-chip ${logged.status === 'present' ? 'status-safe' : logged.status === 'absent' ? 'status-critical' : logged.status === 'faculty_absent' ? 'status-warning' : logged.status === 'other_faculty' ? 'status-substitute' : 'status-neutral'} uppercase">
                        <span class="material-symbols-outlined" style="font-size: 14px;">${logged.status === 'present' ? 'check_circle' : logged.status === 'absent' ? 'cancel' : logged.status === 'faculty_absent' ? 'person_off' : 'verified'}</span>
                        ${logged.status === 'present' ? 'PRESENT' : logged.status === 'absent' ? 'ABSENT' : logged.status === 'faculty_absent' ? 'FACULTY ABSENT' : logged.status.toUpperCase()}
                      </span>
                    ` : isFuture ? `
                      <span class="status-chip status-neutral text-xs">Upcoming</span>
                    ` : `
                      <div class="flex gap-1.5">
                        <button class="btn btn-safe btn-sm" style="padding: 3px 8px; font-size: 0.75rem;" onclick="window.ClassTrackSchedule.logForDate('${slot.subjectId}', 'present', '${dateStr}', '${slot.timeStr || slot.time}')">Present</button>
                        <button class="btn btn-danger btn-sm" style="padding: 3px 8px; font-size: 0.75rem;" onclick="window.ClassTrackSchedule.logForDate('${slot.subjectId}', 'absent', '${dateStr}', '${slot.timeStr || slot.time}')">Absent</button>
                      </div>
                    `}
                  </div>
                </div>
              `;
    }).join('')}
          </div>

          <div class="flex justify-between items-center pt-3 border-t" style="border-color: var(--color-outline-variant);">
            ${!isFuture ? `
              <button class="btn btn-secondary btn-sm" onclick="window.ClassTrackApp.closeModal(); window.ClassTrackApp.openLogModal();">
                <span class="material-symbols-outlined" style="font-size: 16px;">add</span> Custom Log
              </button>
            ` : '<span></span>'}
            <button class="btn btn-primary btn-sm" onclick="window.ClassTrackApp.closeModal()">Done</button>
          </div>
        </div>
      </div>
    `;

    modalOverlay.classList.add('active');
  },

  logForDate(subjectId, status, date, timeStr) {
    const todayStr = window.EduTrackState.getLocalDateString();
    if (date > todayStr) {
      window.ClassTrackApp.showToast('Attendance cannot be marked for future dates.', 'error');
      return;
    }

    const subject = window.EduTrackState.getState().subjects.find(s => s.id === subjectId);
    const logRes = window.EduTrackState.logAttendance(subjectId, status, {
      date,
      timeStr,
      type: subject?.type === 'lab' ? 'Lab' : 'Lecture',
      remarks: `Logged for date ${date}`
    });

    if (!logRes) return;

    window.ClassTrackApp.showToast(`Marked ${status.toUpperCase()} for ${subject?.name || 'Class'}`, status === 'present' ? 'success' : 'warning');
    window.ClassTrackApp.closeModal();
    this.render(document.getElementById('view-content'));
  },

  openAddSlotModal() {
    window.ClassTrackApp.openAddSlotModal();
  },

  confirmDeleteSlot(slotId, subjectName, day, timeStr) {
    const acad = this.getAcademicDateForDay(day);
    const formattedHeader = `${acad.shortHeader} ${timeStr}`;

    window.ClassTrackApp.confirmDialog({
      title: 'Remove Timetable Slot?',
      message: `Are you sure you want to remove the slot for "${subjectName}" on ${formattedHeader}?`,
      icon: 'event_busy',
      confirmText: 'Remove Slot',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        window.EduTrackState.deleteScheduleSlot(slotId);
        window.ClassTrackApp.showToast(`Removed slot: ${formattedHeader}`, 'info');
        this.render(document.getElementById('view-content'));
      }
    });
  },

  openManageSlotsModal() {
    const state = window.EduTrackState.getState();
    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalContent || !modalOverlay) return;

    const slots = state.schedule || [];

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b mb-4" style="border-color: var(--color-outline-variant);">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">view_list</span>
            <h3 class="font-headline-md font-bold" style="color: var(--color-on-background);">Manage Timetable Slots</h3>
          </div>
          <button class="btn-icon" onclick="window.ClassTrackApp.closeModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
          ${slots.length === 0 ? `
            <div class="py-8 text-center" style="color: var(--color-on-surface-variant);">
              <span class="material-symbols-outlined" style="font-size: 36px;">event_busy</span>
              <p class="font-body-md mt-2">No timetable slots scheduled.</p>
              <button class="btn btn-primary btn-sm mt-3" onclick="window.ClassTrackApp.closeModal(); window.ClassTrackSchedule.openAddSlotModal();">
                Add First Slot
              </button>
            </div>
          ` : slots.map(slot => {
      const subject = state.subjects.find(s => s.id === slot.subjectId) || { name: 'Subject', code: 'ENG' };
      const acad = this.getAcademicDateForDay(slot.day);

      return `
              <div class="p-3 rounded-xl flex items-center justify-between border" style="background-color: var(--color-surface); border-color: var(--color-outline-variant);">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-label-sm font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">${acad.shortHeader}</span>
                    <span class="font-label-sm font-semibold" style="color: var(--color-primary);">${slot.timeStr}</span>
                  </div>
                  <h4 class="font-body-md font-semibold mt-1" style="color: var(--color-on-background);">${subject.name} <span class="font-label-sm opacity-70">${subject.code ? `(${subject.code})` : ''}</span></h4>
                  <p class="font-label-sm opacity-80" style="color: var(--color-on-surface-variant);">${slot.room || 'TBA'} • ${window.ClassTrackApp.formatDurationHuman(slot.duration, 'hours')}</p>
                </div>
                <div class="flex items-center gap-1">
                  <button class="btn-icon hover:bg-slate-200 dark:hover:bg-slate-800" title="Edit slot" onclick="window.ClassTrackApp.openEditSlotModal('${slot.id}')">
                    <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
                  </button>
                  <button class="btn-icon text-error hover:bg-red-50 dark:hover:bg-red-950/40" title="Delete slot" onclick="window.ClassTrackSchedule.confirmDeleteSlot('${slot.id}', '${subject.name.replace(/'/g, "\\'")}', '${slot.day}', '${slot.timeStr}');">
                    <span class="material-symbols-outlined" style="font-size: 18px; color: var(--color-error);">delete</span>
                  </button>
                </div>
              </div>
            `;
    }).join('')}
        </div>

        <div class="flex justify-between items-center pt-4 border-t mt-4" style="border-color: var(--color-outline-variant);">
          <button class="btn btn-secondary btn-sm" onclick="window.ClassTrackApp.closeModal(); window.ClassTrackSchedule.openAddSlotModal();">
            <span class="material-symbols-outlined" style="font-size: 16px;">add</span> Add Another Slot
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.ClassTrackApp.closeModal()">Done</button>
        </div>
      </div>
    `;

    modalOverlay.classList.add('active');
  }
};

// Aliases for compatibility
window.EduTrackSchedule = window.ClassTrackSchedule;
