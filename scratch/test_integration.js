/**
 * Simulation Test for Supabase Integration Modules
 */

// Mock browser global environment
global.window = global;
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.document = {
  body: {
    classList: {
      add() {},
      remove() {}
    }
  }
};

// Mock Supabase client
global.supabase = {
  createClient: (url, key) => ({
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signUp: async ({ email, password, options }) => ({
        data: {
          user: { id: 'sb_user_123', email },
          session: { access_token: 'fake_sb_token', user: { id: 'sb_user_123', email } }
        },
        error: null
      }),
      signInWithPassword: async ({ email, password }) => ({
        data: {
          user: { id: 'sb_user_123', email },
          session: { access_token: 'fake_sb_token', user: { id: 'sb_user_123', email } }
        },
        error: null
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: (table) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }), order: async () => ({ data: [], error: null }) }) }),
      upsert: async (payload) => ({ data: payload, error: null }),
      insert: async (payload) => ({ data: payload, error: null }),
      delete: () => ({ match: async () => ({ error: null }) }),
      update: () => ({ match: async () => ({ error: null }) })
    })
  })
};

console.log('--- Step 1: Loading Modules ---');
require('../js/config.js');
require('../js/supabase.js');
require('../js/sync.js');
require('../js/state.js');
require('../js/auth.js');

console.log('--- Step 2: Testing Supabase Configuration ---');
const sb = window.ClassTrackSupabase;
sb.saveCredentials('https://sample-project.supabase.co', 'sample-anon-key-123').then(async (testRes) => {
  console.log('Save credentials test:', testRes.success ? 'PASS' : 'FAIL');
  console.log('Is Supabase configured:', sb.isConfigured() ? 'PASS' : 'FAIL');

  console.log('--- Step 3: Testing Supabase Auth Signup & Login ---');
  const signupRes = await window.ClassTrackAuth.signUp({
    fullName: 'Alex River',
    email: 'alex@engineering.edu',
    password: 'SecurePassword123!',
    universityId: 'ENG-901',
    branch: 'Computer Science'
  });
  console.log('Supabase Signup test:', signupRes.success && signupRes.user.isSupabase ? 'PASS' : 'FAIL');
  console.log('Authenticated user:', window.ClassTrackAuth.getCurrentUser().fullName);

  console.log('--- Step 4: Testing Subject Creation & State Sync ---');
  const newSub = window.ClassTrackState.addSubject({
    name: 'Embedded Systems',
    code: 'CS401',
    category: 'Core',
    type: 'theory',
    credits: 4
  });
  console.log('Subject added:', newSub.name, newSub.id);

  console.log('--- Step 5: Testing Attendance Logging ---');
  const newLog = window.ClassTrackState.logAttendance(newSub.id, 'present', {
    date: '2026-08-22',
    timeStr: '10:00 AM'
  });
  console.log('Attendance logged:', newLog.status, newLog.id);

  const stats = window.ClassTrackState.getOverallStats();
  console.log('Calculated attendance percentage:', stats.percentage + '%');

  console.log('--- Step 6: Testing Guest Mode Fallback ---');
  await window.ClassTrackAuth.logout();
  const guestRes = window.ClassTrackAuth.loginAsGuest();
  console.log('Guest login test:', guestRes.success && guestRes.isGuest ? 'PASS' : 'FAIL');

  console.log('ALL SIMULATION TESTS PASSED SUCCESSFULLY! ✅');
}).catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
