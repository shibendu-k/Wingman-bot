import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logger with privacy-focused settings
const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Mask phone numbers for privacy
 * Example: 919876543210 -> 9198*****210
 */
function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return phone;
  
  // Remove @s.whatsapp.net suffix if present
  const cleaned = phone.replace('@s.whatsapp.net', '');
  
  if (cleaned.length < 8) return cleaned;
  
  const start = cleaned.substring(0, 4);
  const end = cleaned.substring(cleaned.length - 3);
  const masked = start + '*****' + end;
  
  return phone.includes('@') ? masked + '@s.whatsapp.net' : masked;
}

/**
 * Sanitize message content for logging
 */
function sanitizeMessage(message) {
  if (!message) return '';
  
  // Only show first 50 characters
  const preview = message.substring(0, 50);
  return preview + (message.length > 50 ? '...' : '');
}

/**
 * Privacy-focused logging methods
 */
const privacyLogger = {
  info: (message, data = {}) => {
    const sanitized = {
      ...data,
      sender: data.sender ? maskPhone(data.sender) : undefined,
      phone: data.phone ? maskPhone(data.phone) : undefined,
      message: data.message ? sanitizeMessage(data.message) : undefined
    };
    logger.info(sanitized, message);
  },
  
  warn: (message, data = {}) => {
    const sanitized = {
      ...data,
      sender: data.sender ? maskPhone(data.sender) : undefined,
      phone: data.phone ? maskPhone(data.phone) : undefined
    };
    logger.warn(sanitized, message);
  },
  
  error: (message, error = {}) => {
    const sanitized = {
      error: error.message || error,
      stack: error.stack
    };
    logger.error(sanitized, message);
  },
  
  debug: (message, data = {}) => {
    const sanitized = {
      ...data,
      sender: data.sender ? maskPhone(data.sender) : undefined
    };
    logger.debug(sanitized, message);
  }
};

export { privacyLogger as logger, maskPhone };
