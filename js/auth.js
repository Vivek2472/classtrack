/**
 * ClassTrack Engineering - Authentication & Session Management
 * Powered 100% by Supabase Auth (GoTrue)
 * Real-time fast local caching for instant synchronous rendering on reload
 */

class AuthManager {
  constructor() {
    this.session = null;
    this.user = null;
    this.listeners = [];
    
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
    if (!supabase) return;

    try {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        this.setSessionData(data.session);
        if (window.ClassTrackSync && data.session.user) {
          await window.ClassTrackSync.fetchUserData(data.session.user.id);
        }
      } else if (!this.user) {
        this.session = null;
        this.user = null;
        this.notify();
      }

      supabase.auth.onAuthStateChange(async (event, sbSession) => {
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
  /* ----------------------------------------------------
     Trusted Email Providers & Security Rules
  ----------------------------------------------------- */

  isTrustedEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) return false;
    const parts = email.trim().toLowerCase().split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1].trim();

    const TRUSTED_DOMAINS = [
      // Google
      'gmail.com', 'googlemail.com',
      // Microsoft
      'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'office365.com', 'outlook.in', 'hotmail.co.uk',
      // Proton Mail
      'proton.me', 'protonmail.com', 'pm.me',
      // Yahoo Mail
      'yahoo.com', 'ymail.com', 'myyahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'yahoo.ca', 'yahoo.com.au', 'yahoo.fr', 'yahoo.de', 'yahoo.es', 'yahoo.it', 'yahoo.com.br',
      // Zoho Mail
      'zohomail.com', 'zoho.com', 'zohomail.in', 'zoho.in', 'zohomail.eu', 'zoho.eu',
      // Apple iCloud
      'icloud.com', 'me.com', 'mac.com'
    ];

    if (TRUSTED_DOMAINS.includes(domain)) return true;

    // Regional yahoo and zoho domain extensions
    if (domain.startsWith('yahoo.') || domain.endsWith('.yahoo.com') || domain.startsWith('zoho.')) {
      return true;
    }

    return false;
  }

  /* ----------------------------------------------------
     Login Rate Limiting & 1-Hour Lockout Manager
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
      if (item.lockedUntil && now < item.lockedUntil) {
        const remainingMs = item.lockedUntil - now;
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
        return {
          isLocked: true,
          lockedUntil: item.lockedUntil,
          remainingMinutes,
          remainingAttempts: 0
        };
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
      if (!item || (item.firstAttempt && (now - item.firstAttempt) > ONE_HOUR && !item.lockedUntil)) {
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
     Sign Up (With Trusted Email Enforcement)
  ----------------------------------------------------- */

  async signUp({ fullName, universityId = '', branch = '', program = '', semester = '', email, password, phone = '' }) {
    if (!email || !password || !fullName) {
      return { success: false, error: 'Please fill in all required fields (Name, Email, Password).' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Enforce trusted email providers & reject disposable/temporary emails
    if (!this.isTrustedEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Temporary, disposable, or unverified emails are not permitted. Please use a trusted provider (Gmail, Outlook, ProtonMail, Yahoo, Zoho, or iCloud).'
      };
    }

    const cleanId = universityId ? universityId.trim().toUpperCase() : '';
    const displayProgram = program.trim() || branch.trim() || 'General Studies';
    const displaySemester = semester && semester.trim() && semester.toLowerCase() !== 'skip' ? semester.trim() : 'None';
    const cleanPhone = phone.trim();

    const supabase = this.getSupabase();
    if (!supabase) {
      return { success: false, error: 'Cloud service is not ready. Please verify your connection.' };
    }

    try {
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

      // In some Supabase configs with email confirmations, duplicate users return empty identities array
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

          // Sync initial profile
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
              phone: userObj.phone
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
     Sign In (With Trusted Provider & 5-Attempt Lockout)
  ----------------------------------------------------- */

  async login(email, password) {
    if (!email || !password) {
      return { success: false, error: 'Please enter your email and password.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Enforce trusted email providers
    if (!this.isTrustedEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Temporary, disposable, or unverified emails are not permitted. Please sign in with a trusted provider (Gmail, Outlook, ProtonMail, Yahoo, Zoho, or iCloud).'
      };
    }

    // 2. Check 5 failed attempts per hour lockout
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
      return { success: false, error: 'Cloud service is initializing. Please try again.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error) {
        // Record failed attempt and compute remaining attempts
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
        // Clear rate limit tracking on successful login
        this.clearLoginAttempts(cleanEmail);

        this.setSessionData(data.session);

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

    // Enforce trusted email providers
    if (!this.isTrustedEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Temporary, disposable, or unverified emails are not permitted. Please use a trusted provider (Gmail, Outlook, ProtonMail, Yahoo, Zoho, or iCloud).'
      };
    }

    const supabase = this.getSupabase();
    if (!supabase) {
      return { success: false, error: 'Cloud service is initializing. Please try again.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin + window.location.pathname + '#reset-password'
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
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const supabase = this.getSupabase();
    if (!supabase) {
      return { success: false, error: 'Cloud service is initializing. Please try again.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, message: 'Password updated successfully! You can now log in.' };
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
    try {
      localStorage.removeItem('classtrack_auth_user');
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
