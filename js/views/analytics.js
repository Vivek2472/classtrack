/**
 * EduTrack Engineering - Attendance Analytics & Reports View (Screen 3)
 * Precision Academic Tracker - Mobile-first & Desktop Matrix
 */

window.EduTrackAnalytics = {
  selectedTrendSubject: 'all',

  render(container) {
    const stateManager = window.EduTrackState;
    const state = stateManager.getState();
    const overallStats = stateManager.getOverallStats();
    const typeStats = stateManager.getTypeStats();
    const subjects = (state.subjects || []).map(s => stateManager.getSubjectStats(s.id)).filter(Boolean);

    if (subjects.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col gap-6 animate-fade-in">
          <div>
            <h1 class="font-headline-lg font-bold" style="color: var(--color-on-background);">Semester Analytics</h1>
            <p class="font-body-md" style="color: var(--color-on-surface-variant); font-size: 0.875rem;">
              Detailed breakdown of your academic engagement and attendance metrics.
            </p>
          </div>

          <div class="edu-card text-center py-12 px-4 flex flex-col items-center gap-3">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center" style="background-color: var(--color-surface-container-high); color: var(--color-on-surface-variant);">
              <span class="material-symbols-outlined" style="font-size: 32px;">analytics</span>
            </div>
            <div>
              <h2 class="font-headline-md font-bold" style="color: var(--color-on-background);">No Attendance Data Available</h2>
              <p class="font-body-sm max-w-md mx-auto mt-1" style="color: var(--color-on-surface-variant);">
                Enroll subjects and log class attendance to view monthly trajectories, lab ratios, and subject comparison reports.
              </p>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-2 mt-2">
              <button class="btn btn-primary btn-sm" onclick="window.ClassTrackApp.openAddSubjectModal()">
                <span class="material-symbols-outlined" style="font-size: 16px;">add_box</span> Add First Course
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.ClassTrackApp.openAddSlotModal()">
                <span class="material-symbols-outlined" style="font-size: 16px;">schedule</span> Add Schedule Slot
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="flex flex-col gap-5 animate-fade-in">
        <!-- Header & Export Actions -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 class="font-headline-lg font-bold" style="color: var(--color-on-background);">Semester Analytics</h1>
            <p class="font-body-md" style="color: var(--color-on-surface-variant); font-size: 0.875rem;">
              Detailed breakdown of academic engagement and course trajectories.
            </p>
          </div>
          <div class="flex flex-wrap gap-2 w-full sm:w-auto">
            <button class="btn btn-secondary btn-sm flex-1 sm:flex-initial" onclick="window.EduTrackAnalytics.exportCSV()">
              <span class="material-symbols-outlined" style="font-size: 16px;">download</span> CSV
            </button>
            <button class="btn btn-primary btn-sm flex-1 sm:flex-initial" onclick="window.EduTrackAnalytics.exportPDF()">
              <span class="material-symbols-outlined" style="font-size: 16px;">picture_as_pdf</span> PDF
            </button>
          </div>
        </div>

        <!-- Weekly Insight Card -->
        <div class="p-4 sm:p-5 rounded-2xl relative overflow-hidden flex items-center gap-4 shadow-sm" style="background-color: var(--color-primary-container); color: #ffffff;">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0" style="background-color: rgba(255, 255, 255, 0.15);">
            <span class="material-symbols-outlined text-2xl" style="color: #facc15;">lightbulb</span>
          </div>
          <div class="flex-1">
            <h3 class="font-headline-sm font-bold mb-0.5" style="font-size: 1rem;">Weekly Attendance Insight</h3>
            <p class="font-body-sm opacity-90 text-xs sm:text-sm">
              Overall academic standing is <strong style="color: #6ee7b7;">${overallStats.percentage}%</strong> across <strong>${subjects.length} registered courses</strong>.
            </p>
          </div>
        </div>

        <!-- Charts Bento Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          <!-- Monthly Trend (Spans 8 columns) -->
          <div class="lg:col-span-8 edu-card p-4 sm:p-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <div>
                <h2 class="font-headline-md font-bold" style="color: var(--color-on-background);">Attendance Trajectory</h2>
                <p class="font-label-sm" style="color: var(--color-on-surface-variant);">Historical progression curve</p>
              </div>
              <select class="form-select text-xs py-1.5 px-3 w-full sm:w-auto" onchange="window.EduTrackAnalytics.onTrendChange(this.value)">
                <option value="all">Overall Trend</option>
                ${subjects.map(s => `
                  <option value="${s.id}" ${this.selectedTrendSubject === s.id ? 'selected' : ''}>${s.name}</option>
                `).join('')}
              </select>
            </div>

            <!-- SVG Line Graph Component (Responsive) -->
            <div class="relative w-full h-64 sm:h-72 pt-3 pb-7 pl-10 pr-4 flex flex-col justify-between overflow-hidden">
              <!-- Y-Axis Labels -->
              <div class="absolute left-0 top-3 bottom-7 flex flex-col justify-between font-label-sm text-[10px] sm:text-xs" style="color: var(--color-on-surface-variant);">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              <!-- Background Grid Lines -->
              <div class="absolute inset-0 left-10 right-4 top-3 bottom-7 flex flex-col justify-between pointer-events-none opacity-30">
                <div class="border-b" style="border-color: var(--color-outline-variant);"></div>
                <div class="border-b border-dashed" style="border-color: var(--color-safe); border-width: 1.5px;"></div>
                <div class="border-b" style="border-color: var(--color-outline-variant);"></div>
                <div class="border-b" style="border-color: var(--color-outline-variant);"></div>
                <div class="border-b" style="border-color: var(--color-outline-variant);"></div>
              </div>

              <!-- SVG Trend Polyline -->
              <div class="relative w-full h-full">
                <svg class="w-full h-full overflow-visible" viewBox="0 0 400 160" preserveAspectRatio="none">
                  <!-- 75% Threshold Target Line -->
                  <line x1="0" y1="40" x2="400" y2="40" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6"></line>
                  
                  <!-- Trend Gradient Fill -->
                  <defs>
                    <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
                      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
                    </linearGradient>
                  </defs>

                  ${this.generateTrendSVG()}
                </svg>
              </div>

              <!-- X-Axis Month Labels -->
              <div class="absolute bottom-0 left-10 right-4 flex justify-between font-label-sm text-[10px] sm:text-xs" style="color: var(--color-on-surface-variant);">
                <span>Wk 1</span>
                <span>Wk 2</span>
                <span>Wk 3</span>
                <span>Current</span>
              </div>
            </div>

            <div class="mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between text-xs gap-2" style="border-color: var(--color-outline-variant); color: var(--color-on-surface-variant);">
              <span class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 inline-block" style="background-color: #10b981; border-top: 1px dashed;"></span> 75% Target Threshold
              </span>
              <span>Standing: <strong class="text-primary font-mono">${overallStats.percentage}%</strong></span>
            </div>
          </div>

          <!-- Theory vs Lab vs Tutorial (Spans 4 columns) -->
          <div class="lg:col-span-4 edu-card p-4 sm:p-6 flex flex-col justify-between gap-4">
            <div>
              <h2 class="font-headline-md font-bold mb-4" style="color: var(--color-on-background);">Theory vs. Lab Ratio</h2>
              <div class="flex flex-col gap-4">
                <!-- Theory Bar -->
                <div>
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="font-label-sm font-semibold" style="color: var(--color-on-surface-variant);">Theory Classes</span>
                    <span class="font-label-md font-bold" style="color: var(--color-on-background);">${typeStats.theory.percentage}%</span>
                  </div>
                  <div class="progress-track" style="height: 8px;">
                    <div class="progress-fill ${typeStats.theory.percentage >= 75 ? 'safe' : 'warning'}" style="width: ${typeStats.theory.percentage}%;"></div>
                  </div>
                  <span class="font-label-sm block mt-1" style="color: var(--color-on-surface-variant); font-size: 0.725rem;">
                    ${typeStats.theory.attended}/${typeStats.theory.total} Attended
                  </span>
                </div>

                <!-- Lab Bar -->
                <div>
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="font-label-sm font-semibold" style="color: var(--color-on-surface-variant);">Practical Labs</span>
                    <span class="font-label-md font-bold" style="color: var(--color-safe);">${typeStats.lab.percentage}%</span>
                  </div>
                  <div class="progress-track" style="height: 8px;">
                    <div class="progress-fill safe" style="width: ${typeStats.lab.percentage}%;"></div>
                  </div>
                  <span class="font-label-sm block mt-1" style="color: var(--color-on-surface-variant); font-size: 0.725rem;">
                    ${typeStats.lab.attended}/${typeStats.lab.total} Labs Attended
                  </span>
                </div>

                <!-- Tutorial Bar -->
                <div>
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="font-label-sm font-semibold" style="color: var(--color-on-surface-variant);">Tutorials</span>
                    <span class="font-label-md font-bold" style="color: ${typeStats.tutorial.percentage >= 75 ? 'var(--color-safe)' : 'var(--color-warning)'};">${typeStats.tutorial.percentage}%</span>
                  </div>
                  <div class="progress-track" style="height: 8px;">
                    <div class="progress-fill ${typeStats.tutorial.percentage >= 75 ? 'safe' : 'warning'}" style="width: ${typeStats.tutorial.percentage}%;"></div>
                  </div>
                  <span class="font-label-sm block mt-1" style="color: var(--color-on-surface-variant); font-size: 0.725rem;">
                    ${typeStats.tutorial.attended}/${typeStats.tutorial.total} Tutorials Attended
                  </span>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t flex items-start gap-2" style="border-color: var(--color-outline-variant);">
              <span class="material-symbols-outlined text-sm" style="color: var(--color-safe);">verified</span>
              <p class="font-label-sm text-xs" style="color: var(--color-on-surface-variant);">
                Maintain attendance above 75% to ensure semester exam eligibility.
              </p>
            </div>
          </div>

        </div>

        <!-- Semester Attendance Heatmap Matrix -->
        <div class="edu-card p-4 sm:p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h2 class="font-headline-md font-bold" style="color: var(--color-on-background);">Attendance Engagement Matrix</h2>
              <p class="font-label-sm" style="color: var(--color-on-surface-variant);">Daily session activity</p>
            </div>
            <div class="flex items-center gap-3 text-xs font-label-sm">
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm" style="background-color: var(--color-surface-container-high);"></span> Off</span>
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm" style="background-color: #10b981;"></span> Present</span>
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm" style="background-color: #ef4444;"></span> Absent</span>
            </div>
          </div>

          <div class="heatmap-grid overflow-x-auto pb-2" style="-webkit-overflow-scrolling: touch;">
            ${this.generateHeatmapCells()}
          </div>
        </div>

        <!-- Subject Comparison Matrix: Responsive Cards on Mobile & Table on Desktop -->
        <div class="edu-card p-4 sm:p-6 overflow-hidden">
          <div class="pb-3 mb-3 border-b flex items-center justify-between" style="border-color: var(--color-outline-variant);">
            <div>
              <h2 class="font-headline-md font-bold" style="color: var(--color-on-background);">Course Comparison Matrix</h2>
              <p class="font-label-sm" style="color: var(--color-on-surface-variant);">Detailed breakdown per enrolled course</p>
            </div>
          </div>

          <!-- Mobile Cards View (shown on screens < 768px) -->
          <div class="flex flex-col gap-3 md:hidden">
            ${subjects.map(sub => {
              const isSafe = sub.percentage >= 75;
              return `
                <div class="p-3.5 rounded-xl border flex flex-col gap-2.5 cursor-pointer transition-all hover:border-slate-400" style="background-color: var(--color-surface-container-low); border-color: var(--color-outline-variant);" onclick="window.ClassTrackApp.showSubjectDetail('${sub.id}')">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <h4 class="font-body-md font-bold" style="color: var(--color-on-background);">${sub.name}</h4>
                      <span class="font-label-sm font-mono opacity-75">${sub.code || 'ENG'} • ${sub.type}</span>
                    </div>
                    <span class="status-chip ${isSafe ? 'status-safe' : 'status-critical'} font-bold">
                      ${sub.percentage}%
                    </span>
                  </div>

                  <div class="progress-track" style="height: 6px;">
                    <div class="progress-fill ${isSafe ? 'safe' : sub.percentage >= 65 ? 'warning' : 'critical'}" style="width: ${sub.percentage}%;"></div>
                  </div>

                  <div class="flex items-center justify-between text-xs font-label-sm" style="color: var(--color-on-surface-variant);">
                    <span>${sub.attended}/${sub.total} Held Classes</span>
                    <span class="font-semibold" style="color: ${isSafe ? 'var(--color-safe-text)' : 'var(--color-error)'};">
                      ${isSafe ? `Can miss ${sub.safeAbsenceMargin} cls` : `Must attend ${sub.catchUpNeeded} cls`}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Desktop Table View (shown on md+ screens) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b font-label-sm uppercase tracking-wider text-xs" style="border-color: var(--color-outline-variant); color: var(--color-on-surface-variant);">
                  <th class="py-3 px-4">Subject Name</th>
                  <th class="py-3 px-4 text-center">Total Held</th>
                  <th class="py-3 px-4">Attendance %</th>
                  <th class="py-3 px-4 text-center">Trend</th>
                  <th class="py-3 px-4">Buffer / Recovery Forecast</th>
                </tr>
              </thead>
              <tbody class="divide-y text-sm" style="border-color: var(--color-outline-variant);">
                ${subjects.map(sub => {
                  let trendIcon = 'trending_flat';
                  let trendColor = 'var(--color-secondary)';
                  if (sub.percentage >= 85) {
                    trendIcon = 'trending_up';
                    trendColor = 'var(--color-safe)';
                  } else if (sub.percentage < 75) {
                    trendIcon = 'trending_down';
                    trendColor = 'var(--color-error)';
                  }

                  return `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer" onclick="window.ClassTrackApp.showSubjectDetail('${sub.id}')">
                      <td class="py-3 px-4 font-semibold" style="color: var(--color-on-background);">
                        ${sub.name} <span class="font-label-sm opacity-70">(${sub.code || 'CRS'})</span>
                      </td>
                      <td class="py-3 px-4 text-center font-label-sm" style="color: var(--color-on-surface-variant);">
                        ${sub.total}
                      </td>
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                          <div class="w-24 progress-track" style="height: 6px;">
                            <div class="progress-fill ${sub.percentage >= 75 ? 'safe' : sub.percentage >= 65 ? 'warning' : 'critical'}" style="width: ${sub.percentage}%;"></div>
                          </div>
                          <span class="font-label-md font-bold font-mono" style="color: ${sub.percentage >= 75 ? 'var(--color-safe)' : 'var(--color-error)'};">
                            ${sub.percentage}%
                          </span>
                        </div>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="material-symbols-outlined" style="color: ${trendColor}; font-size: 20px;">${trendIcon}</span>
                      </td>
                      <td class="py-3 px-4 font-label-sm" style="color: var(--color-on-surface-variant);">
                        ${sub.percentage >= 75 ? `Safe: Can miss ${sub.safeAbsenceMargin} classes` : `Alert: Must attend ${sub.catchUpNeeded} classes`}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  generateTrendSVG() {
    const stateManager = window.EduTrackState;
    const stats = this.selectedTrendSubject === 'all' 
      ? stateManager.getOverallStats() 
      : stateManager.getSubjectStats(this.selectedTrendSubject);

    if (!stats || (stats.totalClasses !== undefined && stats.totalClasses === 0) || (stats.total !== undefined && stats.total === 0)) {
      return `
        <text x="200" y="85" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="var(--color-on-surface-variant)" font-weight="500">
          No attendance sessions recorded yet. Log sessions to view live trajectory.
        </text>
      `;
    }

    const state = stateManager.getState();
    const logs = (state.logs || []).filter(l => this.selectedTrendSubject === 'all' || l.subjectId === this.selectedTrendSubject);

    const currPct = stats.percentage;
    const pts = [
      { pct: currPct, x: 40, y: 160 - (currPct / 100 * 160) },
      { pct: currPct, x: 150, y: 160 - (currPct / 100 * 160) },
      { pct: currPct, x: 260, y: 160 - (currPct / 100 * 160) },
      { pct: currPct, x: 370, y: 160 - (currPct / 100 * 160) }
    ];

    if (logs.length >= 4) {
      // Sort chronologically (oldest to newest)
      const chronologicalLogs = [...logs].reverse();
      const chunkSize = Math.ceil(chronologicalLogs.length / 4);
      for (let i = 0; i < 4; i++) {
        const slice = chronologicalLogs.slice(0, Math.min(chronologicalLogs.length, (i + 1) * chunkSize));
        const attended = slice.filter(l => l.status === 'present' || l.status === 'od' || l.status === 'other_faculty').length;
        const total = slice.filter(l => l.status !== 'holiday' && l.status !== 'faculty_absent').length;
        const pct = total > 0 ? parseFloat(((attended / total) * 100).toFixed(1)) : currPct;
        pts[i].pct = pct;
        pts[i].y = 160 - (pct / 100 * 160);
      }
      pts[3].pct = currPct;
      pts[3].y = 160 - (currPct / 100 * 160);
    }

    const d = `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y} L ${pts[2].x} ${pts[2].y} L ${pts[3].x} ${pts[3].y}`;
    const fillArea = `${d} L 370 160 L 40 160 Z`;

    return `
      <path d="${fillArea}" fill="url(#trendGradient)"></path>
      <path d="${d}" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
      ${pts.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${p.pct >= 75 ? '#10b981' : p.pct >= 65 ? '#f59e0b' : '#ba1a1a'}" stroke="#ffffff" stroke-width="1.5"></circle>
        <text x="${p.x}" y="${Math.max(14, p.y - 8)}" text-anchor="middle" font-family="JetBrains Mono" font-size="10" font-weight="700" fill="var(--color-on-background)">
          ${p.pct}%
        </text>
      `).join('')}
    `;
  },

  generateHeatmapCells() {
    const state = window.EduTrackState.getState();
    const logs = state.logs || [];
    const cells = [];
    const daysTotal = 70;
    const now = new Date();

    const dateMap = {};
    logs.forEach(l => {
      if (l.date) {
        if (!dateMap[l.date]) dateMap[l.date] = [];
        dateMap[l.date].push(l);
      }
    });

    for (let i = daysTotal - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = window.EduTrackState.getLocalDateString(d);
      const dayLogs = dateMap[dateStr] || [];

      let level = 'level-0';
      if (dayLogs.length > 0) {
        const hasPresent = dayLogs.some(l => l.status === 'present' || l.status === 'od' || l.status === 'other_faculty');
        const hasAbsent = dayLogs.some(l => l.status === 'absent');
        if (hasPresent && !hasAbsent) level = 'level-2';
        else if (hasPresent && hasAbsent) level = 'level-1';
        else if (hasAbsent) level = 'level-absent';
        else level = 'level-holiday';
      }

      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const title = dayLogs.length > 0 ? `${formatted}: ${dayLogs.length} session(s)` : `${formatted}: No classes recorded`;
      cells.push(`<div class="heatmap-cell ${level}" title="${title}"></div>`);
    }

    return cells.join('');
  },

  onTrendChange(subjectId) {
    this.selectedTrendSubject = subjectId;
    this.render(document.getElementById('view-content'));
  },

  exportCSV() {
    const state = window.EduTrackState.getState();
    let csv = 'Subject Code,Subject Name,Type,Credits,Total Classes,Attended,Missed,Attendance %,Status\n';

    (state.subjects || []).forEach(s => {
      const stats = window.EduTrackState.getSubjectStats(s.id);
      if (stats) {
        csv += `"${stats.code || ''}","${stats.name || ''}","${stats.type || 'theory'}",${stats.credits || 3},${stats.total || 0},${stats.attended || 0},${stats.missed || 0},${stats.percentage || 0}%,"${stats.status || 'safe'}"\n`;
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ClassTrack_Attendance_Report_${window.EduTrackState.getLocalDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.ClassTrackApp.showToast('Attendance report CSV downloaded successfully!', 'success');
  },

  exportPDF() {
    window.ClassTrackApp.showToast('Opening print dialog to export PDF...', 'info');
    setTimeout(() => {
      window.print();
    }, 400);
  }
};

// Aliases for compatibility
window.ClassTrackAnalytics = window.EduTrackAnalytics;
