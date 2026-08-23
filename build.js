const fs = require('fs');
const path = require('path');

// 1. Check environment variables
let url = process.env.SUPABASE_URL || '';
let key = process.env.SUPABASE_ANON_KEY || '';

// 2. Fall back to reading local .env file in editor
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [k, ...v] = trimmed.split('=');
      const val = v.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (k.trim() === 'SUPABASE_URL') url = val;
      if (k.trim() === 'SUPABASE_ANON_KEY') key = val;
    }
  });
}

const configContent = `/**
 * ClassTrack Supabase Configuration (Local Editor Only)
 * Auto-synced from .env / environment variables.
 * This file is gitignored and will NOT be uploaded to GitHub.
 */

window.CLASSTRACK_SUPABASE_CONFIG = {
  SUPABASE_URL: '${url}',
  SUPABASE_ANON_KEY: '${key}'
};
`;

fs.writeFileSync(path.join(__dirname, 'js', 'config.js'), configContent);
console.log('ClassTrack: Configuration synced from environment successfully.');
