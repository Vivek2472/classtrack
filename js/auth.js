/**
 * ClassTrack Engineering - Authentication & Session Management
 * Powered 100% by Supabase Auth (GoTrue)
 * Server-Enforced Single Active Session & Real-time Cloud Synchronization
 */

class AuthManager {
  constructor() {
    this.session = null;
    this.user = null;
    this.listeners = [];
    this.sessionToken = localStorage.getItem('classtrack_active_session_token') || '';
    
    // Fast synchronous cache restore for 0ms visual flash on page reload
    try {
      const cached = localStorage.getItem('classtrack_auth_user');
      if (cached) {
        this.user = JSON.parse(cached);
      }
    } catch (e) {}

    this.init();
  }

  getSupabase() {
    if (window.ClassTrackSupabase && window.ClassTrackSupabase.getClient()) {
      return window.ClassTrackSupabase.getClient();
    }
    return null;
  }

  async init() {
    const supabase = this.getSupabase();
    if (!supabase) {
      // Local-first / Offline mode: restore local session if cached
      try {
        const cached = localStorage.getItem('classtrack_auth_user');
        if (cached) {
          this.user = JSON.parse(cached);
          this.session = {
            user: {
              id: this.user.id,
              email: this.user.email,
              user_metadata: this.user
            },
            access_token: 'local_active_token'
          };
          this.notify();
        }
      } catch (e) {}
      return;
    }

    try {
      // Check for recovery token in URL hash
      const hash = window.location.hash || '';
      const isRecoveryUrl = hash.includes('type=recovery') || hash.includes('access_token=');

      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        this.setSessionData(data.session);
        if (window.ClassTrackSync && data.session.user) {
          await window.ClassTrackSync.fetchUserData(data.session.user.id);
        }
      } else {
        // No active session on server -> clear cached user to prevent redirect loop
        if (!isRecoveryUrl) {
          this.session = null;
          this.user = null;
          try {
            localStorage.removeItem('classtrack_auth_user');
          } catch (e) {}
          this.notify();
        }
      }

      supabase.auth.onAuthStateChange(async (event, sbSession) => {
        if (event === 'PASSWORD_RECOVERY' || (sbSession && isRecoveryUrl)) {
          this.setSessionData(sbSession);
          if (window.location.pathname.includes('login.html')) {
            if (typeof window.showPanel === 'function') {
              window.showPanel('reset');
            }
          }
          return;
        }

        if (sbSession?.user) {
          this.setSessionData(sbSession);
          if (window.ClassTrackSync) {
            await window.ClassTrackSync.fetchUserData(sbSession.user.id);
          }
        } else {
          this.session = null;
          this.user = null;
          try {
            localStorage.removeItem('classtrack_auth_user');
            localStorage.removeItem('classtrack_active_session_token');
          } catch (e) {}
          if (window.EduTrackState) {
            window.EduTrackState.resetToDefault();
          }
          this.notify();
        }
      });
    } catch (e) {
      console.warn('Supabase auth initialization error:', e);
    }
  }

  initSupabaseListener() {
    this.init();
  }

  generateSessionToken() {
    const token = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 12);
    this.sessionToken = token;
    try {
      localStorage.setItem('classtrack_active_session_token', token);
    } catch (e) {}
    return token;
  }

  setSessionData(sbSession) {
    this.session = sbSession;
    const userMeta = sbSession.user?.user_metadata || {};
    this.user = {
      id: sbSession.user.id,
      fullName: userMeta.fullName || userMeta.full_name || sbSession.user.email?.split('@')[0] || 'Student',
      universityId: userMeta.universityId || userMeta.rollNo || '',
      email: sbSession.user.email,
      branch: userMeta.branch || userMeta.program || 'General Studies',
      semester: userMeta.semester || '',
      phone: userMeta.phone || '',
      gpa: null
    };

    try {
      localStorage.setItem('classtrack_auth_user', JSON.stringify(this.user));
    } catch (e) {}

    this.notify();
  }

  async updateUserMetadata(meta) {
    const supabase = this.getSupabase();
    if (this.user) {
      if (meta.fullName) this.user.fullName = meta.fullName;
      if (meta.universityId !== undefined) this.user.universityId = meta.universityId;
      if (meta.branch) this.user.branch = meta.branch;
      if (meta.semester !== undefined) this.user.semester = meta.semester;
      if (meta.phone !== undefined) this.user.phone = meta.phone;
      try {
        localStorage.setItem('classtrack_auth_user', JSON.stringify(this.user));
      } catch (e) {}
      this.notify();
    }

    if (supabase) {
      try {
        await supabase.auth.updateUser({
          data: {
            fullName: meta.fullName || this.user?.fullName,
            full_name: meta.fullName || this.user?.fullName,
            universityId: meta.universityId !== undefined ? meta.universityId : this.user?.universityId,
            rollNo: meta.universityId !== undefined ? meta.universityId : this.user?.universityId,
            branch: meta.branch || this.user?.branch,
            program: meta.branch || this.user?.branch,
            semester: meta.semester !== undefined ? meta.semester : this.user?.semester,
            phone: meta.phone !== undefined ? meta.phone : this.user?.phone
          }
        });
      } catch (err) {
        console.warn('Could not update user auth metadata:', err.message);
      }
    }
  }

  /**
   * Update User Email Address - Dispatches confirmation email from Supabase
   */
  async updateEmail(newEmail) {
    if (!newEmail || !this.isTrustedEmail(newEmail)) {
      return {
        success: false,
        error: 'Please enter a valid, non-disposable email address.'
      };
    }

    const cleanEmail = newEmail.trim().toLowerCase();
    if (this.user && this.user.email === cleanEmail) {
      return { success: true, message: 'Email is already set to this address.' };
    }

    const supabase = this.getSupabase();
    if (!supabase) {
      if (this.user) {
        this.user.email = cleanEmail;
        try {
          localStorage.setItem('classtrack_auth_user', JSON.stringify(this.user));
        } catch (e) {}
        const users = this.getLocalUsers();
        const u = users.find(x => x.id === this.user.id);
        if (u) {
          u.email = cleanEmail;
          this.saveLocalUsers(users);
        }
        this.notify();
      }
      return { success: true, message: 'Email address updated successfully.' };
    }

    try {
      const { data, error } = await supabase.auth.updateUser({ email: cleanEmail });
      if (error) throw error;

      return {
        success: true,
        message: `A confirmation link has been sent to ${cleanEmail}. Please check your inbox and confirm the link to finalize your new email address.`
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to update email address.'
      };
    }
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
        fn(this.session);
      } catch (err) {
        console.error('Auth listener notification error:', err);
      }
    });
  }

  isAuthenticated() {
    return Boolean(this.session && this.user);
  }

  isSupabase() {
    return Boolean(this.session && this.user);
  }

  isGuest() {
    return false;
  }

  getCurrentUser() {
    return this.user;
  }

  saveSession(session) {
    if (session) {
      this.setSessionData(session);
    }
  }

  /* ----------------------------------------------------
     Password Validation Policy (Compulsory 8-10 Alphanumeric)
  ----------------------------------------------------- */

  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { valid: false, message: 'Password is required.' };
    }
    if (password.length < 8 || password.length > 10) {
      return { valid: false, message: 'Password must be exactly 8 to 10 characters long.' };
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (!hasLetter || !hasNumber || !hasSpecial) {
      return { 
        valid: false, 
        message: 'Password must be 8–10 characters and contain letters, numbers, and at least one special character (e.g. @, #, $, !, %, *, ?).' 
      };
    }
    return { valid: true };
  }

  /* ----------------------------------------------------
     Trusted Email Providers & University Support
  ----------------------------------------------------- */

  isTrustedEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) return false;
    const parts = email.trim().toLowerCase().split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1].trim();
    if (!domain || !domain.includes('.')) return false;

    // Block known disposable/temporary email providers
    const DISPOSABLE_DOMAINS = [
      'tempmail.com', 'temp-mail.org', 'tempmail.net', 'mailinator.com', '10minutemail.com',
      'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'trashmail.com',
      'sharklasers.com', 'yopmail.com', 'getairmail.com', 'dispostable.com', 'throwawaymail.com',
      'burnermail.io', 'fakemailgenerator.com', 'inboxkitten.com', 'mohmal.com', 'crazymailing.com',
      'mytemp.email', 'tempinbox.com', 'trashmail.net', 'throwawaymail.org'
    ];

    if (DISPOSABLE_DOMAINS.includes(domain) || domain.includes('tempmail') || domain.includes('disposable')) {
      return false;
    }

    return true;
  }

  /* ----------------------------------------------------
     Login Rate Limiting & Lockout Manager
  ----------------------------------------------------- */

  getLockoutStatus(email) {
    if (!email) return { isLocked: false, remainingAttempts: 5 };
    const key = email.trim().toLowerCase();
    try {
      const records = JSON.parse(localStorage.getItem('classtrack_login_rate_limits') || '{}');
      const item = records[key];
      if (!item) return { isLocked: false, remainingAttempts: 5 };

      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;

      // If locked, check if 1 hour has elapsed
      if (item.lockedUntil) {
        if (now < item.lockedUntil) {
          const remainingMs = item.lockedUntil - now;
          const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
          return {
            isLocked: true,
            lockedUntil: item.lockedUntil,
            remainingMinutes,
            remainingAttempts: 0
          };
        } else {
          // Lock expired -> reset
          delete records[key];
          localStorage.setItem('classtrack_login_rate_limits', JSON.stringify(records));
          return { isLocked: false, remainingAttempts: 5 };
        }
      }

      // If window passed (> 1 hour since first attempt), reset
      if (item.firstAttempt && (now - item.firstAttempt) > ONE_HOUR) {
        delete records[key];
        localStorage.setItem('classtrack_login_rate_limits', JSON.stringify(records));
        return { isLocked: false, remainingAttempts: 5 };
      }

      const attempts = item.attempts || 0;
      const remainingAttempts = Math.max(0, 5 - attempts);
      return {
        isLocked: false,
        attempts,
        remainingAttempts
      };
    } catch (e) {
      return { isLocked: false, remainingAttempts: 5 };
    }
  }

  recordFailedLogin(email) {
    if (!email) return { isLocked: false, remainingAttempts: 4 };
    const key = email.trim().toLowerCase();
    try {
      const records = JSON.parse(localStorage.getItem('classtrack_login_rate_limits') || '{}');
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;

      let item = records[key];
      if (!item || (item.lockedUntil && now >= item.lockedUntil) || (item.firstAttempt && (now - item.firstAttempt) > ONE_HOUR)) {
        item = { attempts: 0, firstAttempt: now, lockedUntil: null };
      }

      item.attempts = (item.attempts || 0) + 1;

      // Lock if 5 attempts reached
      if (item.attempts >= 5) {
        item.lockedUntil = now + ONE_HOUR;
        records[key] = item;
        localStorage.setItem('classtrack_login_rate_limits', JSON.stringify(records));
        return {
          isLocked: true,
          lockedUntil: item.lockedUntil,
          remainingMinutes: 60,
          remainingAttempts: 0
        };
      }

      records[key] = item;
      localStorage.setItem('classtrack_login_rate_limits', JSON.stringify(records));
      return {
        isLocked: false,
        attempts: item.attempts,
        remainingAttempts: Math.max(0, 5 - item.attempts)
      };
    } catch (e) {
      return { isLocked: false, remainingAttempts: 4 };
    }
  }

  clearLoginAttempts(email) {
    if (!email) return;
    const key = email.trim().toLowerCase();
    try {
      const records = JSON.parse(localStorage.getItem('classtrack_login_rate_limits') || '{}');
      if (records[key]) {
        delete records[key];
        localStorage.setItem('classtrack_login_rate_limits', JSON.stringify(records));
      }
    } catch (e) {}
  }

  /* ----------------------------------------------------
     Local-First Storage Helpers (Offline & Local Preview)
  ----------------------------------------------------- */

  getLocalUsers() {
    try {
      return JSON.parse(localStorage.getItem('classtrack_local_users') || '[]');
    } catch (e) {
      return [];
    }
  }

  saveLocalUsers(users) {
    try {
      localStorage.setItem('classtrack_local_users', JSON.stringify(users));
    } catch (e) {}
  }

  /* ----------------------------------------------------
     Sign Up (Compulsory 8-10 Alphanumeric + Special Char Password)
  ----------------------------------------------------- */

  async signUp({ fullName, universityId = '', branch = '', program = '', semester = '', email, password, phone = '' }) {
    if (!email || !password || !fullName) {
      return { success: false, error: 'Please fill in all required fields (Name, Email, Password).' };
    }

    // Validate 8-10 alphanumeric with special character password
    const passCheck = this.validatePassword(password);
    if (!passCheck.valid) {
      return { success: false, error: passCheck.message };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Enforce trusted email providers & reject disposable emails
    if (!this.isTrustedEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Temporary or disposable emails are not permitted. Please use a valid email provider or your university email.'
      };
    }

    const cleanId = universityId ? universityId.trim().toUpperCase() : '';
    const displayProgram = program.trim() || branch.trim() || 'General Studies';
    const displaySemester = semester && semester.trim() && semester.toLowerCase() !== 'skip' ? semester.trim() : 'None';
    const cleanPhone = phone.trim();

    const supabase = this.getSupabase();
    if (!supabase) {
      // Offline / Local-first Sign Up Mode
      const users = this.getLocalUsers();
      const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return {
          success: false,
          alreadyExists: true,
          email: cleanEmail,
          error: `An account with ${cleanEmail} already exists! Please log in instead.`
        };
      }

      const sessionToken = this.generateSessionToken();
      const userObj = {
        id: 'usr_' + Date.now(),
        fullName: fullName.trim(),
        universityId: cleanId,
        email: cleanEmail,
        password: password,
        branch: displayProgram,
        semester: displaySemester,
        phone: cleanPhone,
        gpa: null
      };

      users.push(userObj);
      this.saveLocalUsers(users);

      const localSession = {
        user: {
          id: userObj.id,
          email: userObj.email,
          user_metadata: {
            fullName: userObj.fullName,
            full_name: userObj.fullName,
            universityId: userObj.universityId,
            rollNo: userObj.universityId,
            branch: userObj.branch,
            program: userObj.branch,
            semester: userObj.semester,
            phone: userObj.phone
          }
        },
        access_token: 'local_token_' + Date.now()
      };

      this.setSessionData(localSession);

      if (window.EduTrackState) {
        window.EduTrackState.updateProfile({
          name: userObj.fullName,
          rollNo: userObj.universityId,
          program: userObj.branch,
          semester: userObj.semester,
          email: userObj.email,
          phone: userObj.phone
        });
      }

      return { success: true, user: userObj, requiresConfirmation: false };
    }

    try {
      const sessionToken = this.generateSessionToken();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            fullName: fullName.trim(),
            full_name: fullName.trim(),
            universityId: cleanId,
            rollNo: cleanId,
            branch: displayProgram,
            program: displayProgram,
            semester: displaySemester,
            phone: cleanPhone
          }
        }
      });

      // Check if user already exists
      if (error) {
        const msg = error.message ? error.message.toLowerCase() : '';
        if (msg.includes('already registered') || msg.includes('already exists') || error.status === 422) {
          return {
            success: false,
            alreadyExists: true,
            email: cleanEmail,
            error: `An account with ${cleanEmail} already exists! Please log in instead.`
          };
        }
        return { success: false, error: error.message };
      }

      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          success: false,
          alreadyExists: true,
          email: cleanEmail,
          error: `An account with ${cleanEmail} already exists! Please log in instead.`
        };
      }

      if (data?.user) {
        const userObj = {
          id: data.user.id,
          fullName: fullName.trim(),
          universityId: cleanId,
          email: cleanEmail,
          branch: displayProgram,
          semester: displaySemester,
          phone: cleanPhone,
          gpa: null
        };

        if (data.session) {
          this.setSessionData(data.session);

          // Sync initial profile and active session token to cloud
          if (window.EduTrackState) {
            window.EduTrackState.updateProfile({
              name: userObj.fullName,
              rollNo: userObj.universityId,
              program: userObj.branch,
              semester: userObj.semester,
              email: userObj.email,
              phone: userObj.phone
            });
          }

          if (window.ClassTrackSync) {
            await window.ClassTrackSync.syncProfile({
              name: userObj.fullName,
              rollNo: userObj.universityId,
              program: userObj.branch,
              semester: userObj.semester,
              email: userObj.email,
              phone: userObj.phone,
              activeSessionToken: sessionToken
            });
          }

          return { success: true, user: userObj, requiresConfirmation: false };
        } else {
          return {
            success: true,
            user: userObj,
            requiresConfirmation: true,
            message: 'Account created! Please check your email to confirm your account before signing in.'
          };
        }
      }
    } catch (err) {
      return { success: false, error: err.message || 'Signup failed. Please try again.' };
    }
  }

  /* ----------------------------------------------------
     Sign In (Enforcing 8-10 Alphanumeric + Special Char Password & Single Server Session)
  ----------------------------------------------------- */

  async login(email, password) {
    if (!email || !password) {
      return { success: false, error: 'Please enter your email and password.' };
    }

    // Validate 8-10 alphanumeric with special char password
    const passCheck = this.validatePassword(password);
    if (!passCheck.valid) {
      return { success: false, error: passCheck.message };
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!this.isTrustedEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Temporary or disposable emails are not permitted. Please sign in with your registered email.'
      };
    }

    // Check 5 failed attempts lockout
    const lockout = this.getLockoutStatus(cleanEmail);
    if (lockout.isLocked) {
      return {
        success: false,
        isLocked: true,
        remainingMinutes: lockout.remainingMinutes,
        error: `Account access locked due to 5 failed attempts. Please try again in ${lockout.remainingMinutes} minute(s).`
      };
    }

    const supabase = this.getSupabase();
    if (!supabase) {
      // Local-first Offline Login
      const users = this.getLocalUsers();
      const matched = users.find(u => u.email.toLowerCase() === cleanEmail);

      if (!matched || matched.password !== password) {
        const updatedLock = this.recordFailedLogin(cleanEmail);
        if (updatedLock.isLocked) {
          return {
            success: false,
            isLocked: true,
            remainingMinutes: 60,
            error: 'Maximum login attempts (5) exceeded! Login locked for 1 hour.'
          };
        } else {
          return {
            success: false,
            remainingAttempts: updatedLock.remainingAttempts,
            error: `Invalid email or password (${updatedLock.remainingAttempts} attempt(s) remaining before 1-hour lockout).`
          };
        }
      }

      this.clearLoginAttempts(cleanEmail);
      const sessionToken = this.generateSessionToken();

      const localSession = {
        user: {
          id: matched.id,
          email: matched.email,
          user_metadata: {
            fullName: matched.fullName,
            full_name: matched.fullName,
            universityId: matched.universityId,
            rollNo: matched.universityId,
            branch: matched.branch,
            program: matched.branch,
            semester: matched.semester,
            phone: matched.phone
          }
        },
        access_token: 'local_token_' + Date.now()
      };

      this.setSessionData(localSession);

      if (window.EduTrackState) {
        window.EduTrackState.updateProfile({
          name: matched.fullName,
          rollNo: matched.universityId,
          program: matched.branch,
          semester: matched.semester,
          email: matched.email,
          phone: matched.phone
        });
      }

      return { success: true, user: this.user };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error) {
        const updatedLock = this.recordFailedLogin(cleanEmail);
        if (updatedLock.isLocked) {
          return {
            success: false,
            isLocked: true,
            remainingMinutes: 60,
            error: 'Maximum login attempts (5) exceeded! Login locked for 1 hour.'
          };
        } else {
          return {
            success: false,
            remainingAttempts: updatedLock.remainingAttempts,
            error: `${error.message} (${updatedLock.remainingAttempts} attempt(s) remaining before 1-hour lockout).`
          };
        }
      }

      if (data?.session && data?.user) {
        this.clearLoginAttempts(cleanEmail);

        // Generate and record unique active session token on server for single session enforcement
        const sessionToken = this.generateSessionToken();

        this.setSessionData(data.session);

        // Update server profile with new active session token
        if (supabase) {
          try {
            await supabase.from('profiles').update({
              active_session_token: sessionToken,
              updated_at: new Date().toISOString()
            }).eq('id', data.user.id);
          } catch (e) {}
        }

        // Fetch live database records from cloud database
        if (window.ClassTrackSync) {
          await window.ClassTrackSync.fetchUserData(data.user.id);
        }

        return { success: true, user: this.user };
      }
    } catch (err) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  }

  /* ----------------------------------------------------
     Forgot & Reset Password
  ----------------------------------------------------- */

  async sendPasswordReset(email) {
    if (!email || !email.trim()) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!this.isTrustedEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Temporary or disposable emails are not permitted.'
      };
    }

    const supabase = this.getSupabase();
    if (!supabase) {
      const users = this.getLocalUsers();
      const exists = users.some(u => u.email.toLowerCase() === cleanEmail);
      if (exists) {
        return {
          success: true,
          message: `Password reset link simulated for ${cleanEmail}. You can now proceed to set a new password.`
        };
      }
      return { success: false, error: 'No account found with this email address.' };
    }

    try {
      const redirectUrl = window.location.origin + window.location.pathname + '#reset-password';
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: `Password reset link has been sent to ${cleanEmail}. Check your inbox!`
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async resetPassword(newPassword) {
    const passCheck = this.validatePassword(newPassword);
    if (!passCheck.valid) {
      return { success: false, error: passCheck.message };
    }

    const supabase = this.getSupabase();
    if (!supabase) {
      if (this.user) {
        const users = this.getLocalUsers();
        const u = users.find(x => x.id === this.user.id || x.email === this.user.email);
        if (u) {
          u.password = newPassword;
          this.saveLocalUsers(users);
        }
      }
      return { success: true, message: 'Password updated successfully! You can now log in with your new password.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, message: 'Password updated successfully! You can now log in with your new password.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /* ----------------------------------------------------
     Supabase Sign Out
  ----------------------------------------------------- */

  async logout() {
    const supabase = this.getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    this.session = null;
    this.user = null;
    this.sessionToken = '';
    try {
      localStorage.removeItem('classtrack_auth_user');
      localStorage.removeItem('classtrack_active_session_token');
      localStorage.removeItem('classtrack_state_cache');
    } catch (e) {}
    if (window.EduTrackState) {
      window.EduTrackState.resetToDefault();
    }
    this.notify();
    return { success: true };
  }
}

// Global Singleton Instance
window.ClassTrackAuth = new AuthManager();
