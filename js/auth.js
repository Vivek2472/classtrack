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
     Supabase Sign Up (With Duplicate Email Detection)
  ----------------------------------------------------- */

  async signUp({ fullName, universityId = '', branch = '', program = '', semester = '', email, password, phone = '' }) {
    if (!email || !password || !fullName) {
      return { success: false, error: 'Please fill in all required fields (Name, Email, Password).' };
    }

    const cleanEmail = email.trim().toLowerCase();
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
     Cloud Sign In
  ----------------------------------------------------- */

  async login(email, password) {
    if (!email || !password) {
      return { success: false, error: 'Please enter your email and password.' };
    }

    const cleanEmail = email.trim().toLowerCase();
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
        return { success: false, error: error.message };
      }

      if (data?.session && data?.user) {
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
