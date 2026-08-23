/**
 * ClassTrack Engineering - Supabase Client Manager
 * 
 * Automatically loads credentials from:
 * 1. Editor config (window.CLASSTRACK_SUPABASE_CONFIG via .env / js/config.js - Gitignored)
 * 2. Vercel Serverless API (/api/config via Vercel Environment Variables)
 * 
 * ZERO credentials or configuration forms are displayed on the webpage UI.
 */

class SupabaseManager {
  constructor() {
    this.client = null;
    this.url = '';
    this.key = '';
    this.isReady = false;
    this.init();
  }

  async init() {
    // 1. Try static config in editor (from .env / js/config.js)
    if (window.CLASSTRACK_SUPABASE_CONFIG) {
      const configUrl = window.CLASSTRACK_SUPABASE_CONFIG.SUPABASE_URL;
      const configKey = window.CLASSTRACK_SUPABASE_CONFIG.SUPABASE_ANON_KEY;
      if (configUrl && configKey && !configUrl.includes('your-project-id')) {
        this.url = configUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1\/?$/, '');
        this.key = configKey.trim();
        this.createClientInstance();
        return;
      }
    }

    // 2. If running on Vercel deployment, fetch from /api/config serverless function
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data.SUPABASE_URL && data.SUPABASE_ANON_KEY && !data.SUPABASE_URL.includes('your-project-id')) {
          this.url = data.SUPABASE_URL.trim().replace(/\/+$/, '').replace(/\/rest\/v1\/?$/, '');
          this.key = data.SUPABASE_ANON_KEY.trim();
          this.createClientInstance();
          
          // Re-trigger auth listener and sync if needed
          if (window.ClassTrackAuth && typeof window.ClassTrackAuth.initSupabaseListener === 'function') {
            window.ClassTrackAuth.initSupabaseListener();
          }
        }
      }
    } catch (e) {
      // Running offline or static without /api route, fallback to local storage silently
    }
  }

  createClientInstance() {
    const createFn = (window.supabase && typeof window.supabase.createClient === 'function')
      ? window.supabase.createClient
      : (typeof createClient === 'function' ? createClient : null);

    if (!createFn || !this.url || !this.key) {
      this.isReady = false;
      return false;
    }

    try {
      this.client = createFn(this.url, this.key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'classtrack_supabase_auth_token'
        }
      });
      this.isReady = true;
      return true;
    } catch (err) {
      console.error('Supabase initialization error:', err);
      this.client = null;
      this.isReady = false;
      return false;
    }
  }

  isConfigured() {
    return Boolean(this.client && this.isReady && this.url && this.key);
  }

  getClient() {
    if (!this.client && (this.url && this.key)) {
      this.createClientInstance();
    }
    return this.client;
  }
}

// Global Singleton Instance
window.ClassTrackSupabase = new SupabaseManager();
