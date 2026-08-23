/**
 * Vercel Serverless Function: /api/config
 * Reads environment variables configured in Vercel project settings with IP rate limiting.
 */

// Simple in-memory sliding window IP rate limiter (per warm container instance)
const ipRequestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 60; // 60 requests per minute per IP

module.exports = (req, res) => {
  // Security and CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract client IP address
  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();

  let clientData = ipRequestCounts.get(clientIp);
  if (!clientData || (now - clientData.startTime) > RATE_LIMIT_WINDOW_MS) {
    clientData = { count: 1, startTime: now };
  } else {
    clientData.count += 1;
  }
  ipRequestCounts.set(clientIp, clientData);

  // If rate limit exceeded, return 429 Too Many Requests
  if (clientData.count > MAX_REQUESTS_PER_MINUTE) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      error: 'Too many requests. Please slow down.'
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  return res.status(200).json({
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey
  });
};
