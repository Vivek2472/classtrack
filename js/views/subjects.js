/**
 * ClassTrack Engineering - Subjects View & Subject Detail View (Screen 4)
 * Precision Academic Tracker
 */

window.ClassTrackSubjects = {
  currentFilter: 'all',
  currentSearch: '',

  render(container) {
    const stateManager = window.EduTrackState;
    const state = stateManager.getState();
    const target = state.profile?.targetThreshold || 75;

    let filteredSubjects = (state.subjects || []).map(s => stateManager.getSubjectStats(s.id)).filter(Boolean);

    if (this.currentFilter !== 'all') {
      if (['theory', 'lab', 'tutorial'].includes(this.currentFilter)) {
        filteredSubjects = filteredSubjects.filter(s => s.type === this.currentFilter);
      } else if (this.currentFilter === 'safe') {
        filteredSubjects = filteredSubjects.filter(s => s.percentage >= target);
      } else if (this.currentFilter === 'warning') {
        filteredSubjects = filteredSubjects.filter(s => s.percentage < target && s.percentage >= 65);
      } else if (this.currentFilter === 'critical') {
        filteredSubjects = filteredSubjects.filter(s => s.percentage < 65);
      }
    }

    if (this.currentSearch) {
      const q = this.currentSearch.toLowerCase();
      filteredSubjects = filteredSubjects.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.code && s.code.toLowerCase().includes(q)) || 
        (s.instructor && s.instructor.toLowerCase().includes(q))
      );
    }

    container.innerHTML = `
      <div class="flex flex-col gap-6 animate-fade-in">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="font-headline-lg" style="color: var(--color-on-background);">Enrolled Subjects</h1>
            <p class="font-body-md" style="color: var(--color-on-surface-variant);">
              Track attendance requirements, credits, and safe margins per course.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button class="btn btn-primary" onclick="window.ClassTrackSubjects.openAddSubjectModal()">
              <span class="material-symbols-outlined">add</span> Add Subject
            </button>
          </div>
        </div>

        <!-- Filter Bar & Search -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl" style="background-color: var(--color-surface-container-low); border: 1px solid var(--color-outline-variant);">
          <!-- Filters (Horizontal scroll on mobile) -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar" style="-webkit-overflow-scrolling: touch;">
            <button class="btn btn-sm ${this.currentFilter === 'all' ? 'btn-primary' : 'btn-secondary'} shrink-0" style="padding: 5px 10px; font-size: 0.75rem;" onclick="window.ClassTrackSubjects.setFilter('all')">All Courses</button>
            <button class="btn btn-sm ${this.currentFilter === 'theory' ? 'btn-primary' : 'btn-secondary'} shrink-0" style="padding: 5px 10px; font-size: 0.75rem;" onclick="window.ClassTrackSubjects.setFilter('theory')">Theory</button>
            <button class="btn btn-sm ${this.currentFilter === 'lab' ? 'btn-primary' : 'btn-secondary'} shrink-0" style="padding: 5px 10px; font-size: 0.75rem;" onclick="window.ClassTrackSubjects.setFilter('lab')">Labs</button>
            <button class="btn btn-sm ${this.currentFilter === 'tutorial' ? 'btn-primary' : 'btn-secondary'} shrink-0" style="padding: 5px 10px; font-size: 0.75rem;" onclick="window.ClassTrackSubjects.setFilter('tutorial')">Tutorials</button>
            <button class="btn btn-sm ${this.currentFilter === 'warning' ? 'btn-primary' : 'btn-secondary'} shrink-0" style="padding: 5px 10px; font-size: 0.75rem;" onclick="window.ClassTrackSubjects.setFilter('warning')">Needs Attention</button>
          </div>

          <!-- Quick Search -->
          <div class="relative w-full sm:w-60 shrink-0">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style="font-size: 16px; color: var(--color-on-surface-variant);">search</span>
            <input type="text" placeholder="Filter courses..." class="form-input rounded-xl" style="padding-left: 34px; padding-top: 6px; padding-bottom: 6px; font-size: 0.8rem;" value="${this.currentSearch}" oninput="window.ClassTrackSubjects.setSearch(this.value)">
          </div>
        </div>

        <!-- Subjects Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${filteredSubjects.length === 0 ? `
            <div class="col-span-full py-16 text-center edu-card" style="color: var(--color-on-surface-variant);">
              <span class="material-symbols-outlined" style="font-size: 48px;">menu_book</span>
              <p class="font-headline-sm mt-3" style="color: var(--color-on-background);">No subjects enrolled yet</p>
              <p class="font-body-sm max-w-sm mx-auto mt-1" style="color: var(--color-on-surface-variant);">Add your engineering subjects, practical labs, and tutorials to track your attendance.</p>
              <button class="btn btn-primary mt-4" onclick="window.ClassTrackSubjects.openAddSubjectModal()">
                <span class="material-symbols-outlined">add</span> Add New Subject
              </button>
            </div>
          ` : filteredSubjects.map(sub => {
            let statusClass = 'safe';
            let statusText = `Safe: Can miss ${sub.safeAbsenceMargin} classes`;
            let badgeClass = 'status-safe';

            if (sub.percentage < 65) {
              statusClass = 'critical';
              statusText = `Alert: Must attend ${sub.catchUpNeeded} classes`;
              badgeClass = 'status-critical';
            } else if (sub.percentage < target) {
              statusClass = 'warning';
              statusText = `Warning: Must attend ${sub.catchUpNeeded} classes`;
              badgeClass = 'status-warning';
            }

            return `
              <div class="edu-card flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01]" onclick="window.ClassTrackApp.showSubjectDetail('${sub.id}')">
                <div>
                  <!-- Header Badges -->
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      ${sub.code ? `
                        <span class="font-label-sm px-2 py-0.5 rounded" style="background-color: var(--color-surface-container-high); color: var(--color-on-surface-variant); font-weight: 600;">
                          ${sub.code}
                        </span>
                      ` : ''}
                      <span class="font-label-sm px-2 py-0.5 rounded capitalize" style="background-color: ${sub.type === 'theory' ? 'var(--theory-bg)' : sub.type === 'lab' ? 'var(--lab-bg)' : 'var(--tutorial-bg)'}; color: ${sub.type === 'theory' ? 'var(--theory-text)' : sub.type === 'lab' ? 'var(--lab-text)' : 'var(--tutorial-text)'};">
                        ${sub.type}
                      </span>
                    </div>
                    <div class="flex items-center gap-1">
                      <span class="status-chip ${badgeClass}">${sub.percentage}%</span>
                      <button class="btn-icon hover:bg-slate-200 dark:hover:bg-slate-800" style="width: 28px; height: 28px;" title="Edit course" onclick="event.stopPropagation(); window.ClassTrackApp.openEditSubjectModal('${sub.id}')">
                        <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                      </button>
                      <button class="btn-icon text-error hover:bg-red-100 dark:hover:bg-red-950/40" style="width: 28px; height: 28px;" title="Delete course" onclick="event.stopPropagation(); window.ClassTrackSubjects.confirmDeleteSubject('${sub.id}', '${sub.name.replace(/'/g, "\\'")}')">
                        <span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-error);">delete</span>
                      </button>
                    </div>
                  </div>

                  <!-- Subject Title & Instructor -->
                  <h3 class="font-headline-md font-bold mb-1" style="color: var(--color-on-background);">${sub.name}</h3>
                  <p class="font-body-sm flex items-center gap-1 mb-4" style="color: var(--color-on-surface-variant);">
                    <span class="material-symbols-outlined" style="font-size: 16px;">person</span> ${sub.instructor || 'Faculty'}
                    <span class="mx-1">•</span>
                    <span class="material-symbols-outlined" style="font-size: 16px;">room</span> ${sub.room || 'TBA'}
                  </p>

                  <!-- Attendance Progress Track -->
                  <div class="mb-4">
                    <div class="flex justify-between items-center mb-1 font-label-sm">
                      <span style="color: var(--color-on-surface-variant);">Attendance Progress</span>
                      <span style="font-weight: 700; color: var(--color-on-background);">${sub.attended}/${sub.total} Classes</span>
                    </div>
                    <div class="progress-track">
                      <div class="progress-fill ${statusClass}" style="width: ${sub.percentage}%;"></div>
                    </div>
                  </div>
                </div>

                <!-- Footer Stats & Safe Margin -->
                <div class="pt-3 border-t flex items-center justify-between" style="border-color: var(--color-outline-variant);">
                  <span class="font-label-sm" style="color: ${sub.percentage >= target ? 'var(--color-safe-text)' : 'var(--color-error)'}; font-weight: 600;">
                    ${statusText}
                  </span>
                  <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.ClassTrackApp.showSubjectDetail('${sub.id}')">
                    Details <span class="material-symbols-outlined" style="font-size: 14px;">arrow_forward</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  setFilter(filter) {
    this.currentFilter = filter;
    this.render(document.getElementById('view-content'));
  },

  setSearch(query) {
    this.currentSearch = query;
    this.render(document.getElementById('view-content'));
  },

  openAddSubjectModal() {
    window.ClassTrackApp.openAddSubjectModal();
  },

  confirmDeleteSubject(subjectId, subjectName) {
    window.ClassTrackApp.confirmDialog({
      title: `Delete "${subjectName}"?`,
      message: 'This will permanently remove the course, all its weekly timetable slots, and all logged attendance records.',
      icon: 'delete',
      confirmText: 'Delete Course',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        window.EduTrackState.deleteSubject(subjectId);
        window.ClassTrackApp.showToast(`Deleted "${subjectName}"`, 'info');
        this.render(document.getElementById('view-content'));
      }
    });
  }
};

/**
 * Subject Detail View (Screen 4 Replication)
 */
window.ClassTrackSubjectDetail = {
  currentSubjectId: null,
  historyFilter: 'all',

  render(container, subjectId) {
    if (subjectId) this.currentSubjectId = subjectId;
    const stateManager = window.EduTrackState;
    const stats = stateManager.getSubjectStats(this.currentSubjectId);
    
    if (!stats) {
      container.innerHTML = `
        <div class="text-center py-20 edu-card">
          <p class="font-headline-md" style="color: var(--color-on-background);">Subject not found or has been deleted.</p>
          <button class="btn btn-primary mt-4" onclick="window.ClassTrackApp.navigate('subjects')">Back to Subjects</button>
        </div>
      `;
      return;
    }

    const state = stateManager.getState();
    const target = state.profile?.targetThreshold || 75;

    // Filter logs for this subject
    let subjectLogs = (state.logs || []).filter(l => l.subjectId === this.currentSubjectId);
    if (this.historyFilter !== 'all') {
      subjectLogs = subjectLogs.filter(l => l.status === this.historyFilter);
    }

    const isSafe = stats.percentage >= target;

    container.innerHTML = `
      <div class="flex flex-col gap-6 animate-fade-in">
        <!-- Top Actions Bar -->
        <div class="flex flex-wrap items-center justify-end gap-2">
          <button class="btn btn-secondary btn-sm" onclick="window.ClassTrackApp.openEditSubjectModal('${stats.id}')">
            <span class="material-symbols-outlined" style="font-size: 16px;">edit</span> Edit Course
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.ClassTrackSubjectDetail.requestLeave('${stats.id}')">
            <span class="material-symbols-outlined" style="font-size: 16px;">edit_calendar</span> Request Leave / OD
          </button>
          <button class="btn btn-danger btn-sm" onclick="window.ClassTrackSubjectDetail.confirmDeleteSubject('${stats.id}', '${stats.name.replace(/'/g, "\\'")}')">
            <span class="material-symbols-outlined" style="font-size: 16px;">delete</span> Delete Course
          </button>
        </div>

        <!-- Subject Hero Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b" style="border-color: var(--color-outline-variant);">
          <div>
            <div class="flex items-center gap-2 mb-2">
              ${stats.code ? `
                <span class="font-label-sm px-2.5 py-1 rounded" style="background-color: var(--color-surface-variant); color: var(--color-on-surface); font-weight: 600;">
                  ${stats.code}
                </span>
              ` : ''}
              <span class="font-label-sm px-2.5 py-1 rounded" style="background-color: var(--color-primary-fixed); color: var(--color-on-primary-fixed); font-weight: 600;">
                ${stats.category} ${stats.credits ? `(${stats.credits} Credits)` : ''}
              </span>
            </div>
            <h1 class="font-display text-primary" style="color: var(--color-on-background);">${stats.name}</h1>
            <p class="font-body-lg flex items-center gap-2 mt-1" style="color: var(--color-on-surface-variant);">
              <span class="material-symbols-outlined" style="font-size: 20px;">person</span> ${stats.instructor || 'Faculty'}
              <span class="mx-1">•</span>
              <span class="material-symbols-outlined" style="font-size: 20px;">room</span> ${stats.room || 'TBA'}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button class="btn btn-safe btn-sm" onclick="window.ClassTrackSubjectDetail.quickLogAttendance('present')">
              <span class="material-symbols-outlined">check_circle</span> Present
            </button>
            <button class="btn btn-danger btn-sm" onclick="window.ClassTrackSubjectDetail.quickLogAttendance('absent')">
              <span class="material-symbols-outlined">cancel</span> Absent
            </button>
            <button class="btn btn-secondary btn-sm" style="background-color: var(--color-surface-container-high); color: var(--color-on-surface);" title="Faculty is on leave or class cancelled" onclick="window.ClassTrackSubjectDetail.quickLogAttendance('faculty_absent')">
              <span class="material-symbols-outlined">person_off</span> Faculty Absent
            </button>
            <button class="btn btn-secondary btn-sm" style="border-color: rgba(124, 58, 237, 0.4); color: #7C3AED;" title="Record substitute / proxy class" onclick="window.ClassTrackApp.openSubstituteModal('${stats.id}')">
              <span class="material-symbols-outlined" style="color: #7C3AED;">swap_horiz</span> Proxy Class
            </button>
          </div>
        </div>

        <!-- Bento Grid Layout -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          <!-- Left Column (8 cols): Stats Bento + Standing Progress + Safe Zone banner -->
          <div class="md:col-span-8 flex flex-col gap-6">
            
            <!-- Stats Bento: Total / Attended / Missed -->
            <div class="grid grid-cols-3 gap-4">
              <div class="glass-card p-6 flex flex-col justify-center items-center text-center">
                <span class="font-label-sm uppercase tracking-wider mb-2" style="color: var(--color-on-surface-variant);">Total Classes</span>
                <span class="font-display font-bold" style="color: var(--color-on-background); font-size: 2.25rem;">${stats.total}</span>
              </div>

              <div class="glass-card p-6 flex flex-col justify-center items-center text-center" style="background-color: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.3);">
                <span class="font-label-sm uppercase tracking-wider mb-2" style="color: var(--color-safe-text);">Attended</span>
                <span class="font-display font-bold" style="color: var(--color-safe); font-size: 2.25rem;">${stats.attended}</span>
              </div>

              <div class="glass-card p-6 flex flex-col justify-center items-center text-center" style="background-color: rgba(186, 26, 26, 0.08); border-color: rgba(186, 26, 26, 0.3);">
                <span class="font-label-sm uppercase tracking-wider mb-2" style="color: var(--color-error);">Missed</span>
                <span class="font-display font-bold" style="color: var(--color-error); font-size: 2.25rem;">${stats.missed}</span>
              </div>
            </div>

            <!-- Current Standing Card -->
            <div class="glass-card p-6 relative overflow-hidden">
              <div class="flex justify-between items-end mb-4">
                <div>
                  <h3 class="font-headline-md mb-1" style="color: var(--color-on-background);">Current Standing</h3>
                  <p class="font-body-md" style="color: var(--color-on-surface-variant);">Requirement: <strong>${target}%</strong></p>
                </div>
                <div class="font-display font-black" style="color: ${isSafe ? 'var(--color-safe)' : 'var(--color-error)'}; font-size: 2.25rem;">
                  ${stats.percentage}%
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="w-full h-3 rounded-full overflow-hidden mb-6" style="background-color: var(--color-surface-container-high);">
                <div class="h-full rounded-full transition-all duration-700" style="width: ${stats.percentage}%; background-color: ${isSafe ? 'var(--color-safe)' : 'var(--color-error)'};"></div>
              </div>

              <!-- Safe Buffer Banner -->
              ${isSafe ? `
                <div class="p-4 rounded-xl flex items-center justify-between" style="background-color: var(--color-primary-container); color: #ffffff;">
                  <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined" style="color: var(--color-safe); font-size: 28px;">verified</span>
                    <div>
                      <span class="font-label-md block font-bold" style="color: var(--color-safe);">Safe Zone Active</span>
                      <span class="font-body-md opacity-90">
                        You can safely miss <strong>${stats.safeAbsenceMargin} more ${stats.safeAbsenceMargin === 1 ? 'class' : 'classes'}</strong> while maintaining &gt;${target}%.
                      </span>
                    </div>
                  </div>
                </div>
              ` : `
                <div class="p-4 rounded-xl flex items-center justify-between" style="background-color: var(--color-error-container); color: var(--color-on-error-container);">
                  <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined" style="font-size: 28px;">warning</span>
                    <div>
                      <span class="font-label-md block font-bold">Attendance Critical Alert</span>
                      <span class="font-body-md">
                        You must attend <strong>${stats.catchUpNeeded} consecutive classes</strong> without missing to reach ${target}%.
                      </span>
                    </div>
                  </div>
                </div>
              `}
            </div>

          </div>

          <!-- Right Column (4 cols): History Log -->
          <div class="md:col-span-4">
            <div class="glass-card p-6 h-full flex flex-col">
              <div class="flex items-center justify-between mb-4 pb-2 border-b" style="border-color: var(--color-outline-variant);">
                <div>
                  <h3 class="font-headline-md" style="color: var(--color-on-background);">History Log</h3>
                  <p class="font-label-sm" style="color: var(--color-on-surface-variant);">Past class records</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="window.ClassTrackSubjectDetail.openAddLogModal()">
                  <span class="material-symbols-outlined" style="font-size: 16px;">add</span> Add
                </button>
              </div>

              <!-- History Filters -->
              <div class="flex flex-wrap gap-1 mb-4">
                <button class="btn btn-sm ${this.historyFilter === 'all' ? 'btn-primary' : 'btn-secondary'} flex-1" style="padding: 4px; font-size: 0.75rem;" onclick="window.ClassTrackSubjectDetail.setHistoryFilter('all')">All</button>
                <button class="btn btn-sm ${this.historyFilter === 'present' ? 'btn-primary' : 'btn-secondary'} flex-1" style="padding: 4px; font-size: 0.75rem;" onclick="window.ClassTrackSubjectDetail.setHistoryFilter('present')">Present</button>
                <button class="btn btn-sm ${this.historyFilter === 'absent' ? 'btn-primary' : 'btn-secondary'} flex-1" style="padding: 4px; font-size: 0.75rem;" onclick="window.ClassTrackSubjectDetail.setHistoryFilter('absent')">Absent</button>
              </div>

              <!-- Log Items List -->
              <div class="flex-1 flex flex-col gap-3 overflow-y-auto pr-1" style="max-height: 480px;">
                ${subjectLogs.length === 0 ? `
                  <div class="text-center py-12" style="color: var(--color-on-surface-variant);">
                    <span class="material-symbols-outlined" style="font-size: 32px;">history</span>
                    <p class="font-body-sm mt-2">No history records logged yet.</p>
                  </div>
                ` : subjectLogs.map(log => {
                  let dotColor = '#10B981';
                  let dotBg = 'rgba(16, 185, 129, 0.15)';
                  let chipClass = 'status-safe';
                  let statusLabel = 'Present';

                  if (log.status === 'absent') {
                    dotColor = '#BA1A1A';
                    dotBg = 'rgba(186, 26, 26, 0.15)';
                    chipClass = 'status-critical';
                    statusLabel = 'Absent';
                  } else if (log.status === 'faculty_absent') {
                    dotColor = '#F59E0B';
                    dotBg = 'rgba(245, 158, 11, 0.15)';
                    chipClass = 'status-warning';
                    statusLabel = 'Faculty Absent';
                  } else if (log.status === 'other_faculty') {
                    dotColor = '#7C3AED';
                    dotBg = 'rgba(124, 58, 237, 0.15)';
                    chipClass = 'status-substitute';
                    statusLabel = 'Substitute';
                  } else if (log.status === 'holiday' || log.status === 'cancelled') {
                    dotColor = '#64748B';
                    dotBg = 'rgba(100, 116, 139, 0.15)';
                    chipClass = 'status-neutral';
                    statusLabel = 'Cancelled';
                  } else if (log.status === 'od') {
                    dotColor = '#6366F1';
                    dotBg = 'rgba(99, 102, 241, 0.15)';
                    chipClass = 'status-safe';
                    statusLabel = 'On-Duty';
                  }

                  let formattedDate = log.date;
                  if (log.date && log.date.includes('-')) {
                    const [dy, dm, dd] = log.date.split('-');
                    const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    formattedDate = `${mNames[parseInt(dm, 10) - 1] || ''} ${parseInt(dd, 10)}, ${dy}`;
                  }

                  return `
                    <div class="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-slate-300 transition-colors" style="background-color: var(--color-surface);">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style="background-color: ${dotBg};">
                          <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${dotColor};"></div>
                        </div>
                        <div>
                          <div class="font-label-md font-semibold" style="color: var(--color-on-background);">${formattedDate}</div>
                          <div class="font-label-sm" style="color: var(--color-on-surface-variant);">
                            ${log.timeStr} • ${log.type}
                            ${log.remarks ? `<span class="italic opacity-80 ml-2">• ${log.remarks}</span>` : ''}
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="status-chip ${chipClass}">${statusLabel}</span>
                        <button class="btn-icon" style="width: 28px; height: 28px;" title="Delete log" onclick="window.ClassTrackSubjectDetail.deleteLog('${log.id}')">
                          <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

            </div>
          </div>

        </div>
      </div>
    `;
  },

  setHistoryFilter(filter) {
    this.historyFilter = filter;
    this.render(document.getElementById('view-content'));
  },

  quickLogAttendance(status) {
    const subject = window.EduTrackState.getState().subjects.find(s => s.id === this.currentSubjectId);
    let remarks = 'Logged from Subject Detail view';
    if (status === 'faculty_absent') remarks = 'Faculty Absent / Free Period';

    const logRes = window.EduTrackState.logAttendance(this.currentSubjectId, status, {
      timeStr: 'Class Session',
      type: subject?.type === 'lab' ? 'Lab' : 'Lecture',
      remarks
    });
    
    if (!logRes) return;

    let msg = `Logged ${status.toUpperCase()} for ${subject?.name || 'Class'}`;
    let toastType = 'success';
    if (status === 'absent') {
      msg = `Marked Absent for ${subject?.name || 'Class'}`;
      toastType = 'warning';
    } else if (status === 'faculty_absent') {
      msg = `Marked Faculty Absent (Exempted) for ${subject?.name || 'Class'}`;
      toastType = 'info';
    }

    window.ClassTrackApp.showToast(msg, toastType);
    this.render(document.getElementById('view-content'));
  },

  deleteLog(logId) {
    window.ClassTrackApp.confirmDialog({
      title: 'Remove Log Entry?',
      message: 'This will delete this attendance record and adjust your total count accordingly.',
      icon: 'history',
      confirmText: 'Remove Entry',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        window.EduTrackState.deleteLog(logId);
        window.ClassTrackApp.showToast('Log entry removed', 'info');
        this.render(document.getElementById('view-content'));
      }
    });
  },

  confirmDeleteSubject(subjectId, subjectName) {
    window.ClassTrackApp.confirmDialog({
      title: `Delete "${subjectName}"?`,
      message: 'This will remove the course, its timetable slots, and all logged attendance records permanently.',
      icon: 'delete',
      confirmText: 'Delete Course',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        window.EduTrackState.deleteSubject(subjectId);
        window.ClassTrackApp.showToast(`Deleted "${subjectName}"`, 'info');
        window.ClassTrackApp.navigate('subjects');
      }
    });
  },

  openAddLogModal() {
    window.ClassTrackApp.openLogModal(this.currentSubjectId);
  },

  requestLeave(subjectId) {
    window.ClassTrackApp.showToast('Leave / On-Duty form opened.', 'info');
    window.ClassTrackApp.openLogModal(subjectId, 'od');
  }
};

// Aliases for compatibility
window.EduTrackSubjects = window.ClassTrackSubjects;
window.EduTrackSubjectDetail = window.ClassTrackSubjectDetail;
