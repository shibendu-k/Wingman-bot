import crypto from 'crypto';
import config from '../config.js';

/**
 * Security Manager - Handles rate limiting, abuse detection, and user banning
 */
class SecurityManager {
  constructor() {
    this.rateLimits = new Map(); // user -> { count, resetTime }
    this.failedAttempts = new Map(); // user -> { count, lockoutUntil }
    this.bannedUsers = new Set();
    this.sessions = new Map(); // user -> { token, expiresAt }
  }

  /**
   * Check rate limit for a user
   */
  checkRateLimit(userId) {
    const now = Date.now();
    const userLimit = this.rateLimits.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or create new limit
      this.rateLimits.set(userId, {
        count: 1,
        resetTime: now + config.rateLimit.windowMs
      });
      return { allowed: true, remaining: config.rateLimit.maxRequests - 1 };
    }

    if (userLimit.count >= config.rateLimit.maxRequests) {
      const waitSeconds = Math.ceil((userLimit.resetTime - now) / 1000);
      return { 
        allowed: false, 
        remaining: 0,
        retryAfter: waitSeconds
      };
    }

    userLimit.count++;
    return { 
      allowed: true, 
      remaining: config.rateLimit.maxRequests - userLimit.count 
    };
  }

  /**
   * Record a failed unlock attempt
   */
  recordFailedAttempt(userId) {
    const now = Date.now();
    const attempts = this.failedAttempts.get(userId) || { count: 0, lockoutUntil: 0 };

    attempts.count++;

    if (attempts.count >= config.maxFailedAttempts) {
      attempts.lockoutUntil = now + config.lockoutDuration;
      attempts.count = 0; // Reset for next cycle
    }

    this.failedAttempts.set(userId, attempts);
  }

  /**
   * Clear failed attempts for a user (on successful unlock)
   */
  clearFailedAttempts(userId) {
    this.failedAttempts.delete(userId);
  }

  /**
   * Check if user is locked out
   */
  isLockedOut(userId) {
    const attempts = this.failedAttempts.get(userId);
    if (!attempts || !attempts.lockoutUntil) {
      return { locked: false };
    }

    const now = Date.now();
    if (now < attempts.lockoutUntil) {
      const remainingMinutes = Math.ceil((attempts.lockoutUntil - now) / 60000);
      return { locked: true, remainingMinutes };
    }

    // Lockout expired
    this.failedAttempts.delete(userId);
    return { locked: false };
  }

  /**
   * Ban a user
   */
  banUser(userId) {
    this.bannedUsers.add(userId);
  }

  /**
   * Unban a user
   */
  unbanUser(userId) {
    this.bannedUsers.delete(userId);
  }

  /**
   * Check if user is banned
   */
  isBanned(userId) {
    return this.bannedUsers.has(userId);
  }

  /**
   * Detect abuse patterns in message
   */
  detectAbuse(message) {
    const patterns = {
      spam: /(.)\1{10,}/, // Repeated characters
      flood: message.length > 4000, // Too long
      injection: /[`$(){}[\]]/g.test(message), // Suspicious chars
      repetitive: /(\b\w+\b)(?:\s+\1){5,}/ // Repeated words
    };

    const detected = [];
    if (patterns.spam.test(message)) detected.push('spam');
    if (patterns.flood) detected.push('flood');
    if (patterns.injection) detected.push('injection');
    if (patterns.repetitive.test(message)) detected.push('repetitive');

    return {
      isAbusive: detected.length > 0,
      patterns: detected
    };
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input) {
    if (!input || typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
      .replace(/[`$(){}[\]]/g, '') // Remove injection chars
      .trim()
      .substring(0, 4000); // Limit length
  }

  /**
   * Validate WhatsApp JID format
   */
  validateJID(jid) {
    if (!jid || typeof jid !== 'string') return false;
    
    // Valid formats: 919876543210@s.whatsapp.net or 120363XXX@g.us (group)
    const patterns = [
      /^\d{10,15}@s\.whatsapp\.net$/, // Individual
      /^\d{10,20}@g\.us$/ // Group
    ];
    
    return patterns.some(pattern => pattern.test(jid));
  }

  /**
   * Create session token
   */
  createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    this.sessions.set(userId, { token, expiresAt });
    return token;
  }

  /**
   * Validate session token
   */
  validateSession(userId, token) {
    const session = this.sessions.get(userId);
    if (!session) return false;
    
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(userId);
      return false;
    }
    
    return session.token === token;
  }

  /**
   * Get security status for a user
   */
  getSecurityStatus(userId) {
    const rateLimit = this.rateLimits.get(userId);
    const failedAttempts = this.failedAttempts.get(userId);
    const lockout = this.isLockedOut(userId);
    
    return {
      banned: this.isBanned(userId),
      locked: lockout.locked,
      lockoutRemaining: lockout.remainingMinutes,
      rateLimitRemaining: rateLimit ? config.rateLimit.maxRequests - rateLimit.count : config.rateLimit.maxRequests,
      failedAttempts: failedAttempts?.count || 0
    };
  }
}

// Export singleton instance
const securityManager = new SecurityManager();
export default securityManager;
