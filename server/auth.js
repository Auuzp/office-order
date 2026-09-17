import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Parse .env if present without needing external dependencies
export function loadEnvFile(envPath) {
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  } catch (err) {
    console.error('Failed to load .env file:', err.message);
  }
}

// Password/PIN hashing using crypto.scryptSync
export function hashPin(pin, salt = null) {
  if (!pin || typeof pin !== 'string') {
    throw new Error('PIN must be a non-empty string');
  }
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(pin, generatedSalt, 64);
  return `${generatedSalt}:${derivedKey.toString('hex')}`;
}

export function verifyPin(pin, storedCombined) {
  if (!pin || typeof pin !== 'string' || !storedCombined || typeof storedCombined !== 'string') {
    return false;
  }
  const parts = storedCombined.split(':');
  if (parts.length !== 2) {
    return false;
  }
  const [salt, storedHash] = parts;
  if (!salt || !storedHash) {
    return false;
  }
  try {
    const derivedKey = crypto.scryptSync(pin, salt, 64);
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (derivedKey.length !== storedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(derivedKey, storedBuf);
  } catch {
    return false;
  }
}

// Session store
// Maps token -> { createdAt: number, expiresAt: number, role: 'ADMIN' }
export const sessions = new Map();

// Default TTL: 2 hours (in ms)
export const DEFAULT_SESSION_TTL = 2 * 60 * 60 * 1000;

export function getSessionTtl() {
  const envVal = parseInt(process.env.SESSION_TTL_MS, 10);
  return !isNaN(envVal) && envVal > 0 ? envVal : DEFAULT_SESSION_TTL;
}

export function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const ttl = getSessionTtl();
  const session = {
    createdAt: now,
    expiresAt: now + ttl,
    role: 'ADMIN'
  };
  sessions.set(token, session);
  return { token, session };
}

export function getValidSession(token) {
  if (!token || typeof token !== 'string') return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function destroySession(token) {
  if (token && sessions.has(token)) {
    sessions.delete(token);
    return true;
  }
  return false;
}

// Clean up expired sessions periodically
let cleanupInterval = null;
if (process.env.NODE_ENV !== 'test') {
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [token, session] of sessions.entries()) {
      if (now > session.expiresAt) {
        sessions.delete(token);
      }
    }
  }, 5 * 60 * 1000);
  cleanupInterval.unref();
}

// Rate limiting for login attempts
// Maps ip -> { count: number, resetAt: number, lockedUntil: number }
export const loginAttempts = new Map();
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_ATTEMPTS = 5;

export function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  if (now > record.resetAt) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingSec };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip) {
  const now = Date.now();
  let record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS, lockedUntil: 0 };
  } else {
    record.count += 1;
  }

  if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    record.lockedUntil = now + RATE_LIMIT_WINDOW_MS;
  }

  loginAttempts.set(ip, record);
}

export function resetFailedLogins(ip) {
  loginAttempts.delete(ip);
}

// Helper to extract session token and authentication method from Authorization header or Cookie
export function extractAuth(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return { token: authHeader.slice(7).trim(), method: 'bearer' };
  }

  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/);
    if (match) {
      return { token: decodeURIComponent(match[1]), method: 'cookie' };
    }
  }

  return { token: null, method: null };
}

export function extractToken(req) {
  return extractAuth(req).token;
}

// Middleware: Require Admin Authentication
export function requireAdminAuth(req, res, next) {
  const { token, method } = extractAuth(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'จำเป็นต้องเข้าสู่ระบบในฐานะผู้ดูแลระบบ (Unauthorized: Admin authentication required)'
    });
  }

  const session = getValidSession(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่ (Unauthorized: Session expired or invalid)'
    });
  }

  // CSRF Protection for cookie-authenticated mutating requests
  const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (method === 'cookie' && mutatingMethods.includes(req.method)) {
    const customHeader = req.headers['x-requested-with'] || req.headers['x-csrf-protection'];
    const origin = req.headers.origin;
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
      : ['http://localhost:5173', 'http://localhost:3000', 'https://auuzp.github.io'];

    const isOriginAllowed = origin && (allowedOriginsEnv.includes(origin) || allowedOriginsEnv.includes('*'));

    if (!customHeader && !isOriginAllowed) {
      return res.status(403).json({
        success: false,
        message: 'การตรวจสอบ CSRF ล้มเหลว (CSRF protection: cookie mutations require X-Requested-With header or verified Origin)'
      });
    }
  }

  req.adminSession = session;
  req.sessionToken = token;
  req.authMethod = method;
  next();
}
