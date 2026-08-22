/**
 * ClassTrack Engineering - Authentication & Session Management
 * 
 * Supports:
 * 1. Supabase Cloud Authentication (Sign Up, Sign In, Reset Password, Session Persistence)
 * 2. Instant Guest Mode (Zero registration, offline local state)
 * 3. Local Mock Account Sign-in (Fallback if Supabase is unconfigured or offline)
 */

const AUTH_STORAGE_KEY = 'classtrack_auth_session_v2';
const USERS_STORAGE_KEY = 'classtrack_registered_users_v2';

class AuthManager {
  constructor() {
    this.session = this.loadSession();
    this.users = this.loadUsers();
    this.listeners = [];
    this.initSupabaseListener();
  }

  /* ----------------------------------------------------
     Supabase Connection & Real-time Auth Listener
  ----------------------------------------------------- */

  getSupabase() {
    if (window.ClassTrackSupabase && window.ClassTrackSupabase.isConfigured()) {
      return window.ClassTrackSupabase.getClient();
    }
    return null;
  }

  initSupabaseListener() {
    const supabase = this.getSupabase();
    if (!supabase) return;

    try {
      supabase.auth.onAuthStateChange(async (event, sbSession) => {
        if (event === 'SIGNED_IN' && sbSession?.user) {
          const userMeta = sbSession.user.user_metadata || {};
          const sessionData = {
            token: sbSession.access_token,
            user: {
              id: sbSession.user.id,
              fullName: userMeta.fullName || userMeta.full_name || 'Student',
              universityId: userMeta.universityId || userMeta.rollNo || 'STD-2024',
              email: sbSession.user.email,
              branch: userMeta.branch || userMeta.program || 'General Studies',
              semester: userMeta.semester || '',
              phone: userMeta.phone || '',
              gpa: null,
              isGuest: false,
              isSupabase: true
            },
            isGuest: false,
            isSupabase: true,
            loginTime: new Date().toISOString()
          };

          this.saveSession(sessionData);

          // Hydrate user data from Supabase
          if (window.ClassTrackSync) {
            await window.ClassTrackSync.fetchUserData(sbSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          if (this.session && this.session.isSupabase) {
            this.saveSession(null);
          }
        }
      });
    } catch (e) {
      console.warn('Failed to attach Supabase auth listener:', e);
    }
  }

  /* ----------------------------------------------------
     Session Persistence
  ----------------------------------------------------- */

  loadSession() {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load auth session from localStorage:', e);
    }
    return null;
  }

  saveSession(sessionData) {
    this.session = sessionData;
    try {
      if (sessionData) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Error saving auth session:', e);
    }
    this.notify();
  }

  loadUsers() {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load registered users:', e);
    }
    return [];
  }

  saveUsers() {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
    } catch (e) {
      console.error('Error saving users list:', e);
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

  /* ----------------------------------------------------
     Authentication Status
  ----------------------------------------------------- */

  isAuthenticated() {
    return this.session !== null;
  }

  isGuest() {
    return this.session ? Boolean(this.session.isGuest) : false;
  }

  isSupabase() {
    return this.session ? Boolean(this.session.isSupabase) : false;
  }

  getCurrentUser() {
    if (!this.session) return null;
    return this.session.user;
  }

  /* ----------------------------------------------------
     1. Guest Login (Offline Local Mode)
  ----------------------------------------------------- */

  loginAsGuest() {
    const guestUser = {
      id: 'guest_' + Date.now(),
      fullName: 'Guest Student',
      universityId: 'GUEST-' + Math.floor(1000 + Math.random() * 9000),
      email: 'guest@classtrack.app',
      branch: 'General Studies',
      semester: 'None',
      phone: '',
      gpa: null,
      isGuest: true,
      isSupabase: false
    };

    const session = {
      token: 'guest_token_' + Date.now(),
      user: guestUser,
      isGuest: true,
      isSupabase: false,
      loginTime: new Date().toISOString()
    };

    this.saveSession(session);

    // Sync state profile without loading demo data
    if (window.EduTrackState) {
      window.EduTrackState.updateProfile({
        name: guestUser.fullName,
        rollNo: guestUser.universityId,
        program: guestUser.branch,
        semester: guestUser.semester
      });
    }

    return { success: true, user: guestUser, isGuest: true };
  }

  /* ----------------------------------------------------
     2. User Registration (Supabase Cloud + Local Fallback)
  ----------------------------------------------------- */

  async signUp({ fullName, universityId = '', branch = '', program = '', semester = '', email, password, phone = '' }) {
    if (!email || !password || !fullName) {
      return { success: false, error: 'Please fill in all required fields (Name, Email, Password).' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanId = universityId ? universityId.trim().toUpperCase() : `STD-${Math.floor(1000 + Math.random() * 9000)}`;
    const displayProgram = program.trim() || branch.trim() || 'General Studies';
    const displaySemester = semester && semester.trim() && semester.toLowerCase() !== 'skip' ? semester.trim() : 'None';
    const cleanPhone = phone.trim();

    const supabase = this.getSupabase();

    // --- Path A: Supabase Cloud Auth ---
    if (supabase) {
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

        if (error) {
          return { success: false, error: error.message };
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
            gpa: null,
            isGuest: false,
            isSupabase: true
          };

          // If session returned immediately (email confirmation disabled)
          if (data.session) {
            const session = {
              token: data.session.access_token,
              user: userObj,
              isGuest: false,
              isSupabase: true,
              loginTime: new Date().toISOString()
            };
            this.saveSession(session);

            // Sync state profile
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

            // Migrate any local guest data created before signing up
            if (window.ClassTrackSync) {
              window.ClassTrackSync.migrateLocalDataToSupabase(data.user.id);
            }

            return { success: true, user: userObj, requiresConfirmation: false };
          } else {
            // Email confirmation is required by Supabase project
            return {
              success: true,
              user: userObj,
              requiresConfirmation: true,
              message: 'Account created! Please check your email to confirm your account before signing in.'
            };
          }
        }
      } catch (err) {
        console.error('Supabase signup error:', err);
        return { success: false, error: err.message || 'Signup failed with Supabase.' };
      }
    }

    // --- Path B: Local Browser Accounts (Offline Fallback) ---
    const existing = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please sign in.' };
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      fullName: fullName.trim(),
      universityId: cleanId,
      email: cleanEmail,
      branch: displayProgram,
      semester: displaySemester,
      password: password,
      phone: cleanPhone,
      gpa: null,
      createdAt: new Date().toISOString(),
      isGuest: false,
      isSupabase: false
    };

    this.users.push(newUser);
    this.saveUsers();

    const session = {
      token: 'token_' + Date.now(),
      user: newUser,
      isGuest: false,
      isSupabase: false,
      loginTime: new Date().toISOString()
    };

    this.saveSession(session);

    if (window.EduTrackState) {
      window.EduTrackState.updateProfile({
        name: newUser.fullName,
        rollNo: newUser.universityId,
        program: newUser.branch,
        semester: newUser.semester,
        email: newUser.email,
        phone: newUser.phone
      });
    }

    return { success: true, user: newUser, requiresConfirmation: false };
  }

  /* ----------------------------------------------------
     3. User Login (Supabase Cloud + Local Fallback)
  ----------------------------------------------------- */

  async login(identifier, password, remember = true) {
    if (!identifier || !password) {
      return { success: false, error: 'Please enter your email or Student ID and password.' };
    }

    const cleanIdent = identifier.trim();
    const supabase = this.getSupabase();

    // If identifier is an email and Supabase is configured
    if (supabase && cleanIdent.includes('@')) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanIdent.toLowerCase(),
          password: password
        });

        if (error) {
          // If error is invalid credentials, attempt local fallback check
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            const localUser = this.users.find(u => u.email.toLowerCase() === cleanIdent.toLowerCase() && u.password === password);
            if (localUser) {
              return this.loginLocal(localUser, remember);
            }
          }
          return { success: false, error: error.message };
        }

        if (data?.user) {
          const userMeta = data.user.user_metadata || {};
          const userObj = {
            id: data.user.id,
            fullName: userMeta.fullName || userMeta.full_name || 'Student',
            universityId: userMeta.universityId || userMeta.rollNo || 'STD-2024',
            email: data.user.email,
            branch: userMeta.branch || userMeta.program || 'General Studies',
            semester: userMeta.semester || '',
            phone: userMeta.phone || '',
            gpa: null,
            isGuest: false,
            isSupabase: true
          };

          const session = {
            token: data.session.access_token,
            user: userObj,
            isGuest: false,
            isSupabase: true,
            remember: Boolean(remember),
            loginTime: new Date().toISOString()
          };

          this.saveSession(session);

          // Hydrate user data from Supabase DB
          if (window.ClassTrackSync) {
            await window.ClassTrackSync.fetchUserData(data.user.id);
          }

          return { success: true, user: userObj };
        }
      } catch (err) {
        console.error('Supabase signin error:', err);
        return { success: false, error: err.message || 'Login failed with Supabase.' };
      }
    }

    // Local Fallback Check
    const lowerIdent = cleanIdent.toLowerCase();
    const user = this.users.find(u => 
      (u.email && u.email.toLowerCase() === lowerIdent) || 
      (u.universityId && u.universityId.toLowerCase() === lowerIdent)
    );

    if (!user) {
      return { success: false, error: 'No account found with this Email or Student ID. Please check your credentials or create an account.' };
    }

    if (user.password !== password) {
      return { success: false, error: 'Incorrect password. Please try again or click "Forgot Password".' };
    }

    return this.loginLocal(user, remember);
  }

  loginLocal(user, remember) {
    const session = {
      token: 'token_' + Date.now(),
      user: user,
      isGuest: false,
      isSupabase: false,
      remember: Boolean(remember),
      loginTime: new Date().toISOString()
    };

    this.saveSession(session);

    if (window.EduTrackState) {
      window.EduTrackState.updateProfile({
        name: user.fullName,
        rollNo: user.universityId,
        program: user.branch,
        semester: user.semester || '',
        email: user.email,
        phone: user.phone || ''
      });
    }

    return { success: true, user };
  }

  /* ----------------------------------------------------
     4. Forgot & Reset Password
  ----------------------------------------------------- */

  async sendPasswordReset(email) {
    if (!email || !email.trim()) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabase = this.getSupabase();

    if (supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin + window.location.pathname + '#reset-password'
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return {
          success: true,
          message: `Password reset instructions have been sent to ${cleanEmail}. Check your inbox!`,
          isSupabase: true
        };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // Local simulation fallback
    const user = this.users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    const resetToken = 'rst_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    this.pendingReset = {
      email: cleanEmail,
      token: resetToken,
      expiresAt: Date.now() + (15 * 60 * 1000)
    };

    return {
      success: true,
      message: `Reset link & verification code (${resetToken}) generated for ${cleanEmail}.`,
      token: resetToken,
      userExists: Boolean(user),
      isSupabase: false
    };
  }

  async resetPassword(newPassword, email = null) {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const supabase = this.getSupabase();
    if (supabase && this.session?.isSupabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true, message: 'Password updated successfully in Supabase! You can now log in.' };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    const targetEmail = email || (this.pendingReset ? this.pendingReset.email : null) || (this.session ? this.session.user.email : null);
    if (targetEmail) {
      const user = this.users.find(u => u.email && u.email.toLowerCase() === targetEmail.toLowerCase());
      if (user) {
        user.password = newPassword;
        this.saveUsers();
      }
    }

    this.pendingReset = null;
    return { success: true, message: 'Password updated successfully! You can now log in.' };
  }

  /* ----------------------------------------------------
     5. Logout
  ----------------------------------------------------- */

  async logout() {
    const supabase = this.getSupabase();
    if (supabase && this.session?.isSupabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    this.saveSession(null);
    return { success: true };
  }
}

// Global Singleton Instance
window.ClassTrackAuth = new AuthManager();
