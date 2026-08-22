/**
 * ClassTrack - Full-Page Authentication Views (Mobile & Desktop)
 * Modern full-screen responsive authentication experience.
 */

window.ClassTrackAuthView = {

  /* ----------------------------------------------------
     Left Showcase Panel Helper (Used across all auth views)
  ----------------------------------------------------- */

  getShowcaseHTML(activeScreen = 'login') {
    return `
      <div class="auth-showcase-panel hidden lg:flex lg:w-1/2 p-8 xl:p-14 flex-col justify-between relative">
        <!-- Ambient Glow Circles -->
        <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none"></div>

        <!-- Top Brand Header -->
        <div class="relative z-10 flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg font-bold text-white bg-blue-600">
            <span class="material-symbols-outlined" style="font-size: 26px;">school</span>
          </div>
          <div>
            <span class="text-xl font-bold tracking-tight text-white block leading-tight">ClassTrack</span>
            <span class="text-xs uppercase tracking-widest text-slate-400 font-semibold">Student Attendance Suite</span>
          </div>
        </div>

        <!-- Center Value Proposition & Live Visual Cards -->
        <div class="relative z-10 my-auto py-8 max-w-lg">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-blue-300 font-semibold mb-5">
            <span class="material-symbols-outlined" style="font-size: 16px;">verified</span>
            <span>Universal Student Attendance Tracker</span>
          </div>

          <h1 class="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Master your academic schedule with confidence.
          </h1>
          <p class="text-sm xl:text-base text-slate-300 mb-8 leading-relaxed">
            Designed for all students, majors, and programs. Easily manage timetable schedules, record daily class attendance, and monitor attendance thresholds in real time.
          </p>

          <!-- Feature Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="auth-glass-card p-3.5 flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined" style="font-size: 18px;">schedule</span>
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">Smart Timetable</h4>
                <p class="text-[11px] text-slate-300 leading-tight mt-0.5">Live duration sync & daily scheduling</p>
              </div>
            </div>

            <div class="auth-glass-card p-3.5 flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined" style="font-size: 18px;">fact_check</span>
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">1-Click Attendance</h4>
                <p class="text-[11px] text-slate-300 leading-tight mt-0.5">Quickly mark present, absent, or OD</p>
              </div>
            </div>

            <div class="auth-glass-card p-3.5 flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined" style="font-size: 18px;">auto_graph</span>
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">Target Analytics</h4>
                <p class="text-[11px] text-slate-300 leading-tight mt-0.5">Stay safely above minimum criteria</p>
              </div>
            </div>

            <div class="auth-glass-card p-3.5 flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined" style="font-size: 18px;">lock</span>
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">Privacy Focused</h4>
                <p class="text-[11px] text-slate-300 leading-tight mt-0.5">Offline-first local browser storage</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Note -->
        <div class="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-4">
          <span>ClassTrack Academic Platform</span>
          <span>Fast, Reliable & Modern</span>
        </div>
      </div>
    `;
  },

  /* ----------------------------------------------------
     1. Login Screen (Full Page Split Screen)
  ----------------------------------------------------- */

  renderLogin(container) {
    container.innerHTML = `
      <div class="auth-fullscreen-wrapper min-h-screen w-full flex flex-col lg:flex-row animate-fade-in">
        
        <!-- Left Showcase Panel (Desktop) -->
        ${this.getShowcaseHTML('login')}

        <!-- Right Form Panel (Full Viewport on Mobile, Half on Desktop) -->
        <div class="auth-form-panel flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 overflow-y-auto min-h-screen">
          
          <div class="w-full max-w-[440px] flex flex-col gap-5 my-auto">
            
            <!-- Mobile Brand Header -->
            <div class="flex flex-col items-center text-center gap-1.5 lg:hidden mb-2">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md text-white bg-blue-600 mb-1">
                <span class="material-symbols-outlined" style="font-size: 26px;">school</span>
              </div>
              <h1 class="text-xl font-bold tracking-tight text-primary">ClassTrack</h1>
              <p class="text-xs text-slate-500 dark:text-slate-400">Student Attendance Tracker</p>
            </div>

            <!-- Header Section -->
            <div class="flex flex-col gap-1 text-center sm:text-left">
              <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight" style="color: var(--color-on-background);">Welcome back</h2>
              <p class="font-body-sm" style="color: var(--color-on-surface-variant);">
                Sign in to manage your classes, schedule, and attendance.
              </p>
            </div>

            <!-- Instant Guest Access Banner -->
            <div class="p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-sm transition-all" style="background-color: var(--color-surface-container-low); border: 1.5px dashed var(--color-outline-variant);">
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-primary" style="font-size: 22px;">explore</span>
                <div>
                  <span class="font-label-sm font-bold block" style="color: var(--color-on-background);">Try Without Account</span>
                  <span class="font-body-sm block text-xs" style="color: var(--color-on-surface-variant);">Instant guest login with offline saving</span>
                </div>
              </div>
              <button type="button" class="btn btn-secondary btn-sm shrink-0" onclick="window.ClassTrackAuthView.handleGuestLogin()" style="padding: 6px 14px; font-weight: 700;">
                Guest Login
              </button>
            </div>

            <!-- Login Form -->
            <form id="auth-login-form" class="flex flex-col gap-4" onsubmit="window.ClassTrackAuthView.handleLoginSubmit(event)">
              
              <!-- Email / ID Input -->
              <div class="flex flex-col gap-1.5">
                <label class="font-label-sm uppercase tracking-wider font-semibold text-xs" style="color: var(--color-on-surface-variant);" for="login-email">
                  Email Address or Student ID
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style="font-size: 20px; color: var(--color-outline);">mail</span>
                  <input id="login-email" type="text" name="identifier" required placeholder="you@example.com or Student ID" class="form-input font-body-md" style="padding-left: 42px; height: 46px; border-radius: 10px;">
                </div>
              </div>

              <!-- Password Input -->
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between items-center">
                  <label class="font-label-sm uppercase tracking-wider font-semibold text-xs" style="color: var(--color-on-surface-variant);" for="login-password">
                    Password
                  </label>
                  <a href="#forgot-password" onclick="window.ClassTrackApp.navigate('forgot-password'); return false;" class="font-body-sm hover:underline" style="color: var(--color-primary); font-size: 0.8rem; font-weight: 500;">
                    Forgot password?
                  </a>
                </div>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style="font-size: 20px; color: var(--color-outline);">lock</span>
                  <input id="login-password" type="password" name="password" required placeholder="••••••••" class="form-input font-body-md" style="padding-left: 42px; padding-right: 42px; height: 46px; border-radius: 10px;">
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors p-1" onclick="window.ClassTrackAuthView.togglePasswordVisibility('login-password', this)">
                    <span class="material-symbols-outlined" style="font-size: 20px;">visibility_off</span>
                  </button>
                </div>
              </div>

              <!-- Remember Me -->
              <div class="flex items-center gap-2 mt-0.5">
                <input id="login-remember" type="checkbox" name="remember" checked class="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer">
                <label for="login-remember" class="font-body-sm cursor-pointer select-none text-xs" style="color: var(--color-on-surface-variant);">Remember me on this device</label>
              </div>

              <!-- Submit Button -->
              <button type="submit" class="btn btn-primary w-full shadow-md mt-1 flex items-center justify-center gap-2" style="height: 48px; border-radius: 10px; font-size: 0.95rem; font-weight: 600;">
                <span>SIGN IN</span>
                <span class="material-symbols-outlined" style="font-size: 20px;">arrow_forward</span>
              </button>

            </form>

            <!-- Bottom Switch to Sign Up -->
            <div class="mt-2 pt-3 border-t text-center" style="border-color: var(--color-outline-variant);">
              <p class="font-body-sm text-xs" style="color: var(--color-on-surface-variant);">
                New to ClassTrack? 
                <a href="#signup" onclick="window.ClassTrackApp.navigate('signup'); return false;" class="font-bold underline underline-offset-4 hover:text-primary transition-colors ml-1" style="color: var(--color-on-background);">
                  Create an Account
                </a>
              </p>
            </div>

          </div>

        </div>

      </div>
    `;
  },

  /* ----------------------------------------------------
     2. Create Account / Sign Up Screen (Full Page Split)
  ----------------------------------------------------- */

  renderSignUp(container) {
    container.innerHTML = `
      <div class="auth-fullscreen-wrapper min-h-screen w-full flex flex-col lg:flex-row animate-fade-in">
        
        <!-- Left Showcase Panel (Desktop) -->
        ${this.getShowcaseHTML('signup')}

        <!-- Right Form Panel -->
        <div class="auth-form-panel flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 overflow-y-auto min-h-screen">
          
          <div class="w-full max-w-[480px] flex flex-col gap-4 my-auto py-6">
            
            <!-- Mobile Brand Header -->
            <div class="flex flex-col items-center text-center gap-1.5 lg:hidden mb-1">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md text-white bg-blue-600 mb-1">
                <span class="material-symbols-outlined" style="font-size: 26px;">school</span>
              </div>
              <h1 class="text-xl font-bold tracking-tight text-primary">ClassTrack</h1>
            </div>

            <!-- Header Section -->
            <div class="flex flex-col gap-1 text-center sm:text-left">
              <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight" style="color: var(--color-on-background);">Create Account</h2>
              <p class="font-body-sm" style="color: var(--color-on-surface-variant);">
                For all students across any program, course, or curriculum.
              </p>
            </div>

            <!-- Form -->
            <form id="auth-signup-form" class="flex flex-col gap-3.5" onsubmit="window.ClassTrackAuthView.handleSignUpSubmit(event)">
              
              <!-- Full Name -->
              <div class="flex flex-col gap-1.5">
                <label class="font-label-sm uppercase tracking-wider font-semibold text-xs" style="color: var(--color-on-surface-variant);" for="signup-name">
                  Full Name <span class="text-error">*</span>
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style="font-size: 20px; color: var(--color-outline);">badge</span>
                  <input id="signup-name" type="text" name="fullName" required placeholder="e.g. Alex Morgan" class="form-input font-body-md" style="padding-left: 42px; height: 44px; border-radius: 10px;">
                </div>
              </div>

              <!-- Email Address (Any Email Accepted) -->
              <div class="flex flex-col gap-1.5">
                <label class="font-label-sm uppercase tracking-wider font-semibold text-xs" style="color: var(--color-on-surface-variant);" for="signup-email">
                  Email Address <span class="text-error">*</span>
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style="font-size: 20px; color: var(--color-outline);">mail</span>
                  <input id="signup-email" type="email" name="email" required placeholder="student@example.com or you@gmail.com" class="form-input font-body-md" style="padding-left: 42px; height: 44px; border-radius: 10px;">
                </div>
                <span class="text-[11px] text-slate-500 dark:text-slate-400">Accepts any personal or academic email (Gmail, Outlook, Yahoo, etc.)</span>
              </div>

              <!-- Degree / Major / Program -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label class="font-label-sm uppercase tracking-wider font-semibold text-xs" style="color: var(--color-on-surface-variant);" for="signup-program">
                    Degree / Course / Major
                  </label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style="font-size: 20px; color: var(--color-outline);">school</span>
                    <input id="signup-program" type="text" name="program" placeholder="e.g. Computer Science, B.A., B.Com" class="form-input font-body-md" style="padding-left: 42px; height: 44px; border-radius: 10px;">
                  </div>
                </div>

                <!-- Student ID / Roll No (Optional) -->
                <div class="flex flex-col gap-1.5">
                  <label class="font-label-sm uppercase tracking-wider font-semibold text-xs" style="color: var(--color-on-surface-variant);" for="signup-id">
                    Student ID <span class="opacity-60 text-[10px] lowercase">(optional)</span>
                  </label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style="font-size: 20px; color: var(--color-outline);">tag</span>
                    <input id="signup-id" type="text" name="universityId" placeholder="STD-2024" class="form-input font-body-md uppercase" style="padding-left: 42px; height: 44px; border-radius: 10px;">
                  </div>
                </div>
              </div>

              <!-- Semester Selection with Skip Option (Requirement 5) -->
              <div class="p-3.5 rounded-xl border flex flex-col gap-2.5" style="background-color: var(--color-surface-container-low); border-color: var(--color-outline-variant);">
                <div class="flex items-center justify-between">
                  <label class="font-label-sm uppercase tracking-wider font-bold text-xs" style="color: var(--color-on-surface-variant);" for="signup-semester">
                    Which semester are you in?
                  </label>
                  <button type="button" id="btn-skip-semester" class="btn btn-secondary btn-sm" style="padding: 2px 10px; font-size: 0.75rem;" onclick="window.ClassTrackAuthView.handleSkipSemester()">
                    <span class="material-symbols-outlined" style="font-size: 15px;">skip_next</span>
                    <span id="skip-semester-text">Skip Semester</span>
                  </button>
                </div>

                <div class="relative" id="semester-input-wrapper">
                  <select id="signup-semester" name="semester" class="form-select font-body-md w-full" style="height: 42px; border-radius: 8px;">
                    <option value="Semester 1" selected>Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                    <option value="Year 1">Year 1</option>
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                    <option value="Year 4">Year 4</option>
                    <option value="None">No Semester / Annual Curriculum</option>
                  </select>
                </div>
                <input type="hidden" id="signup-semester-skipped" value="false">
                <p id="semester-skip-hint" class="text-[11px] text-slate-500 dark:text-slate-400">
                  Select your current semester, or click <strong>Skip</strong> if your course does not follow semesters.
                </p>
              </div>

              <!-- Password -->
              <div class="flex flex-col gap-1.5">
                <label class="font-label-sm uppercase tracking-wider font-semibold text-xs" style="color: var(--color-on-surface-variant);" for="signup-password">
                  Create Password <span class="text-error">*</span>
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style="font-size: 20px; color: var(--color-outline);">lock</span>
                  <input id="signup-password" type="password" name="password" required minlength="6" placeholder="••••••••" class="form-input font-body-md" style="padding-left: 42px; padding-right: 42px; height: 44px; border-radius: 10px;">
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors p-1" onclick="window.ClassTrackAuthView.togglePasswordVisibility('signup-password', this)">
                    <span class="material-symbols-outlined" style="font-size: 20px;">visibility_off</span>
                  </button>
                </div>
              </div>

              <!-- Submit Button -->
              <button type="submit" class="btn btn-primary w-full shadow-md mt-2 flex items-center justify-center gap-2" style="height: 48px; border-radius: 10px; font-size: 0.95rem; font-weight: 600;">
                <span>CREATE ACCOUNT</span>
                <span class="material-symbols-outlined" style="font-size: 20px;">check</span>
              </button>

              <!-- Quick Guest Button -->
              <button type="button" class="btn btn-secondary w-full flex items-center justify-center gap-2" style="height: 42px; border-radius: 10px; font-size: 0.85rem;" onclick="window.ClassTrackAuthView.handleGuestLogin()">
                <span class="material-symbols-outlined" style="font-size: 18px;">explore</span>
                <span>Continue as Guest Instead</span>
              </button>

              <!-- Link to Login -->
              <div class="text-center mt-1 pt-3 border-t" style="border-color: var(--color-outline-variant);">
                <p class="font-body-sm text-xs" style="color: var(--color-on-surface-variant);">
                  Already have an account? 
                  <a href="#login" onclick="window.ClassTrackApp.navigate('login'); return false;" class="font-bold underline underline-offset-4 hover:text-primary transition-colors ml-1" style="color: var(--color-on-background);">
                    Log in
                  </a>
                </p>
              </div>

            </form>

          </div>

        </div>

      </div>
    `;
  },

  /* ----------------------------------------------------
     3. Forgot Password Screen (Full Page Split)
  ----------------------------------------------------- */

  renderForgotPassword(container) {
    container.innerHTML = `
      <div class="auth-fullscreen-wrapper min-h-screen w-full flex flex-col lg:flex-row animate-fade-in">
        
        <!-- Left Showcase Panel -->
        ${this.getShowcaseHTML('forgot')}

        <!-- Right Form Panel -->
        <div class="auth-form-panel flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 min-h-screen">
          
          <div class="w-full max-w-[420px] flex flex-col gap-5 my-auto">
            
            <button class="btn btn-secondary btn-sm self-start flex items-center gap-1.5 mb-2" onclick="window.ClassTrackApp.navigate('login')">
              <span class="material-symbols-outlined" style="font-size: 16px;">arrow_back</span>
              <span>Back to Login</span>
            </button>

            <!-- Hero Icon & Title -->
            <div class="flex flex-col gap-1">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm text-blue-600 bg-blue-100 dark:bg-blue-950/60 mb-2">
                <span class="material-symbols-outlined" style="font-size: 26px;">lock_reset</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold" style="color: var(--color-on-background);">Forgot Password</h1>
              <p class="font-body-sm" style="color: var(--color-on-surface-variant);">
                Enter your email address below, and we'll generate a secure link to reset your password.
              </p>
            </div>

            <!-- Form -->
            <form id="auth-forgot-form" class="flex flex-col gap-4" onsubmit="window.ClassTrackAuthView.handleForgotPasswordSubmit(event)">
              
              <div class="flex flex-col gap-1.5">
                <label class="font-label-sm uppercase tracking-wider font-semibold text-xs" style="color: var(--color-on-surface-variant);" for="forgot-email">
                  Email Address
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style="font-size: 20px; color: var(--color-outline);">mail</span>
                  <input id="forgot-email" type="email" name="email" required placeholder="you@example.com" class="form-input font-body-md" style="padding-left: 42px; height: 46px; border-radius: 10px;">
                </div>
              </div>

              <button type="submit" class="btn btn-primary w-full shadow-md mt-1 flex items-center justify-center gap-2" style="height: 48px; border-radius: 10px; font-size: 0.95rem; font-weight: 600;">
                <span>SEND RESET LINK</span>
                <span class="material-symbols-outlined" style="font-size: 18px;">send</span>
              </button>

              <!-- Reset Result feedback -->
              <div id="reset-link-feedback" class="hidden p-4 rounded-xl flex flex-col gap-2" style="background-color: var(--color-safe-bg); border: 1px solid var(--color-safe-border);">
                <div class="flex items-center gap-2" style="color: var(--color-safe-text);">
                  <span class="material-symbols-outlined" style="font-size: 20px;">check_circle</span>
                  <span class="font-body-sm font-semibold" id="reset-feedback-text">Reset code generated.</span>
                </div>
                <button type="button" class="btn btn-safe btn-sm w-full mt-1" onclick="window.ClassTrackApp.navigate('reset-password')">
                  Proceed to Reset Password
                </button>
              </div>

            </form>

            <div class="text-center pt-2">
              <p class="font-body-sm text-xs" style="color: var(--color-on-surface-variant);">
                Remember your password? 
                <a href="#login" onclick="window.ClassTrackApp.navigate('login'); return false;" class="font-bold underline underline-offset-4 hover:text-primary transition-colors ml-1" style="color: var(--color-on-background);">
                  Log in
                </a>
              </p>
            </div>

          </div>

        </div>

      </div>
    `;
  },

  /* ----------------------------------------------------
     4. Reset Password Screen (Full Page Split)
  ----------------------------------------------------- */

  renderResetPassword(container) {
    container.innerHTML = `
      <div class="auth-fullscreen-wrapper min-h-screen w-full flex flex-col lg:flex-row animate-fade-in">
        
        <!-- Left Showcase Panel -->
        ${this.getShowcaseHTML('reset')}

        <!-- Right Form Panel -->
        <div class="auth-form-panel flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 min-h-screen">
          
          <div class="w-full max-w-[420px] flex flex-col gap-5 my-auto">
            
            <div class="flex flex-col gap-1">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm text-blue-600 bg-blue-100 dark:bg-blue-950/60 mb-2">
                <span class="material-symbols-outlined" style="font-size: 26px;">password</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold" style="color: var(--color-on-background);">Create New Password</h1>
              <p class="font-body-sm" style="color: var(--color-on-surface-variant);">Choose a strong new password for your account.</p>
            </div>

            <form id="auth-reset-form" class="flex flex-col gap-4" onsubmit="window.ClassTrackAuthView.handleResetPasswordSubmit(event)">
              
              <!-- New Password -->
              <div class="flex flex-col gap-1.5">
                <label class="font-label-sm uppercase tracking-wider font-semibold text-xs" style="color: var(--color-on-surface-variant);" for="reset-new-password">
                  New Password
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style="font-size: 20px; color: var(--color-outline);">lock</span>
                  <input id="reset-new-password" type="password" required minlength="6" placeholder="Enter new password" class="form-input font-body-md" style="padding-left: 42px; padding-right: 42px; height: 46px; border-radius: 10px;" oninput="window.ClassTrackAuthView.validateResetPassword(this.value)">
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors p-1" onclick="window.ClassTrackAuthView.togglePasswordVisibility('reset-new-password', this)">
                    <span class="material-symbols-outlined" style="font-size: 20px;">visibility_off</span>
                  </button>
                </div>
              </div>

              <!-- Confirm Password -->
              <div class="flex flex-col gap-1.5">
                <label class="font-label-sm uppercase tracking-wider font-semibold text-xs" style="color: var(--color-on-surface-variant);" for="reset-confirm-password">
                  Confirm New Password
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style="font-size: 20px; color: var(--color-outline);">lock_clock</span>
                  <input id="reset-confirm-password" type="password" required minlength="6" placeholder="Confirm new password" class="form-input font-body-md" style="padding-left: 42px; padding-right: 42px; height: 46px; border-radius: 10px;">
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors p-1" onclick="window.ClassTrackAuthView.togglePasswordVisibility('reset-confirm-password', this)">
                    <span class="material-symbols-outlined" style="font-size: 20px;">visibility_off</span>
                  </button>
                </div>
              </div>

              <!-- Password Requirements List -->
              <div class="p-3.5 rounded-xl border" style="background-color: var(--color-surface-container-low); border-color: var(--color-outline-variant);">
                <p class="font-label-sm uppercase font-bold text-[11px] mb-2" style="color: var(--color-on-surface-variant);">Password Requirements:</p>
                <ul class="flex flex-col gap-1.5 font-label-sm text-xs">
                  <li id="req-length" class="flex items-center gap-2" style="color: var(--color-on-surface-variant);">
                    <span class="material-symbols-outlined req-icon" style="font-size: 16px;">radio_button_unchecked</span>
                    <span>At least 6 characters</span>
                  </li>
                  <li id="req-number" class="flex items-center gap-2" style="color: var(--color-on-surface-variant);">
                    <span class="material-symbols-outlined req-icon" style="font-size: 16px;">radio_button_unchecked</span>
                    <span>Contains at least one number</span>
                  </li>
                  <li id="req-match" class="flex items-center gap-2" style="color: var(--color-on-surface-variant);">
                    <span class="material-symbols-outlined req-icon" style="font-size: 16px;">radio_button_unchecked</span>
                    <span>Passwords match</span>
                  </li>
                </ul>
              </div>

              <!-- Submit Button -->
              <button type="submit" class="btn btn-primary w-full shadow-md mt-1 flex items-center justify-center gap-2" style="height: 48px; border-radius: 10px; font-size: 0.95rem; font-weight: 600;">
                <span>UPDATE PASSWORD</span>
                <span class="material-symbols-outlined" style="font-size: 20px;">check_circle</span>
              </button>

            </form>

            <div class="text-center pt-2">
              <a href="#login" onclick="window.ClassTrackApp.navigate('login'); return false;" class="font-label-sm text-xs hover:text-primary transition-colors inline-flex items-center gap-1.5" style="color: var(--color-on-surface-variant);">
                <span class="material-symbols-outlined" style="font-size: 16px;">arrow_back</span>
                <span>Back to Login</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    `;
  },

  /* ----------------------------------------------------
     Interactive Handlers
  ----------------------------------------------------- */

  handleSkipSemester() {
    const semSelect = document.getElementById('signup-semester');
    const skippedHidden = document.getElementById('signup-semester-skipped');
    const skipBtnText = document.getElementById('skip-semester-text');
    const hint = document.getElementById('semester-skip-hint');

    if (!semSelect || !skippedHidden) return;

    const isCurrentlySkipped = skippedHidden.value === 'true';

    if (!isCurrentlySkipped) {
      // Toggle to Skipped
      skippedHidden.value = 'true';
      semSelect.disabled = true;
      semSelect.value = 'None';
      if (skipBtnText) skipBtnText.textContent = 'Use Semester';
      if (hint) hint.innerHTML = '<span class="text-emerald-600 dark:text-emerald-400 font-semibold">Semester skipped (No semester will be assigned).</span>';
      window.ClassTrackApp.showToast('Semester skipped. You can always change this in your profile.', 'info');
    } else {
      // Toggle back to Active
      skippedHidden.value = 'false';
      semSelect.disabled = false;
      semSelect.value = 'Semester 1';
      if (skipBtnText) skipBtnText.textContent = 'Skip Semester';
      if (hint) hint.textContent = 'Select your current semester, or click Skip if your course does not follow semesters.';
    }
  },

  handleGuestLogin() {
    const res = window.ClassTrackAuth.loginAsGuest();
    if (res.success) {
      window.ClassTrackApp.showToast('Logged in as Guest! Welcome to ClassTrack.', 'success');
      window.ClassTrackApp.onAuthSuccess();
    }
  },

  async handleLoginSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span>Signing in...</span>
      `;
    }

    try {
      const formData = new FormData(e.target);
      const identifier = formData.get('identifier');
      const password = formData.get('password');
      const remember = formData.get('remember') !== null;

      const res = await window.ClassTrackAuth.login(identifier, password, remember);
      if (res.success) {
        window.ClassTrackApp.showToast(`Welcome back, ${res.user.fullName}!`, 'success');
        window.ClassTrackApp.onAuthSuccess();
      } else {
        window.ClassTrackApp.showToast(res.error, 'error');
      }
    } catch (err) {
      window.ClassTrackApp.showToast(err.message || 'Login error occurred.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
    }
  },

  async handleSignUpSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span>Creating account...</span>
      `;
    }

    try {
      const formData = new FormData(e.target);
      const fullName = formData.get('fullName');
      const universityId = formData.get('universityId');
      const program = formData.get('program') || 'General Studies';
      const email = formData.get('email');
      const password = formData.get('password');

      const skippedHidden = document.getElementById('signup-semester-skipped');
      const isSkipped = skippedHidden && skippedHidden.value === 'true';
      const semester = isSkipped ? 'None' : (formData.get('semester') || 'None');

      const res = await window.ClassTrackAuth.signUp({ fullName, universityId, program, semester, email, password });
      if (res.success) {
        if (res.requiresConfirmation) {
          window.ClassTrackApp.showToast(res.message || 'Please verify your email address to complete registration.', 'info');
          window.ClassTrackApp.navigate('login');
        } else {
          window.ClassTrackApp.showToast(`Account created! Welcome, ${res.user.fullName}.`, 'success');
          window.ClassTrackApp.onAuthSuccess();
        }
      } else {
        window.ClassTrackApp.showToast(res.error, 'error');
      }
    } catch (err) {
      window.ClassTrackApp.showToast(err.message || 'Signup error occurred.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
    }
  },

  async handleForgotPasswordSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span>Sending reset link...</span>
      `;
    }

    try {
      const formData = new FormData(e.target);
      const email = formData.get('email');

      const res = await window.ClassTrackAuth.sendPasswordReset(email);
      if (res.success) {
        const feedbackDiv = document.getElementById('reset-link-feedback');
        const feedbackText = document.getElementById('reset-feedback-text');
        if (feedbackDiv && feedbackText) {
          feedbackText.textContent = res.message;
          feedbackDiv.classList.remove('hidden');
        }
        window.ClassTrackApp.showToast('Password reset link sent to your email!', 'success');
      } else {
        window.ClassTrackApp.showToast(res.error, 'error');
      }
    } catch (err) {
      window.ClassTrackApp.showToast(err.message || 'Reset error occurred.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
    }
  },

  async handleResetPasswordSubmit(e) {
    e.preventDefault();
    const newPass = document.getElementById('reset-new-password')?.value;
    const confirmPass = document.getElementById('reset-confirm-password')?.value;

    if (newPass !== confirmPass) {
      window.ClassTrackApp.showToast('Passwords do not match.', 'error');
      return;
    }

    const res = await window.ClassTrackAuth.resetPassword(newPass);
    if (res.success) {
      window.ClassTrackApp.showToast('Password reset successfully! Please log in.', 'success');
      window.ClassTrackApp.navigate('login');
    } else {
      window.ClassTrackApp.showToast(res.error, 'error');
    }
  },

  handleSocialLogin(provider) {
    window.ClassTrackApp.showToast(`Connecting via ${provider}... (Demo session active)`, 'info');
    setTimeout(() => {
      this.handleGuestLogin();
    }, 600);
  },

  togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = btn.querySelector('.material-symbols-outlined');
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) icon.textContent = 'visibility';
    } else {
      input.type = 'password';
      if (icon) icon.textContent = 'visibility_off';
    }
  },

  validateResetPassword(val) {
    const reqLength = document.getElementById('req-length');
    const reqNumber = document.getElementById('req-number');
    const reqMatch = document.getElementById('req-match');
    const confirmInput = document.getElementById('reset-confirm-password');

    if (reqLength) {
      const ok = val.length >= 6;
      this.updateReqItem(reqLength, ok);
    }
    if (reqNumber) {
      const ok = /\d/.test(val);
      this.updateReqItem(reqNumber, ok);
    }
    if (reqMatch && confirmInput) {
      const ok = val.length > 0 && val === confirmInput.value;
      this.updateReqItem(reqMatch, ok);
    }
  },

  updateReqItem(el, ok) {
    const icon = el.querySelector('.req-icon');
    if (ok) {
      el.style.color = 'var(--color-safe)';
      if (icon) {
        icon.textContent = 'check_circle';
        icon.style.color = 'var(--color-safe)';
      }
    } else {
      el.style.color = 'var(--color-on-surface-variant)';
      if (icon) {
        icon.textContent = 'radio_button_unchecked';
        icon.style.color = 'var(--color-outline)';
      }
    }
  }
};

window.EduTrackAuthView = window.ClassTrackAuthView;
