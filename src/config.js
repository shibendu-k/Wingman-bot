import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration object
const config = {
  // Owner configuration
  ownerNumber: process.env.OWNER_NUMBER || '',
  
  // API Keys
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  
  // Presence & Sleep Mode settings
  sleepMode: process.env.SLEEP_MODE !== 'false', // Enabled by default
  inactivityTimeout: parseInt(process.env.INACTIVITY_TIMEOUT || '900000'), // 15 minutes in ms
  
  // Security settings
  maxActiveMessages: parseInt(process.env.MAX_ACTIVE_MESSAGES || '100'),
  archiveThreshold: parseInt(process.env.ARCHIVE_THRESHOLD || '200'),
  
  // Allowed groups (optional)
  allowedGroups: process.env.ALLOWED_GROUPS 
    ? process.env.ALLOWED_GROUPS.split(',').map(g => g.trim())
    : [],
  
  // Rate limiting
  rateLimit: {
    maxRequests: 20,
    windowMs: 60000 // 1 minute
  },
  
  // Failed attempts
  maxFailedAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  
  // Paths
  paths: {
    root: path.resolve(__dirname, '..'),
    data: path.resolve(__dirname, '../data'),
    conversations: path.resolve(__dirname, '../data/conversations'),
    archives: path.resolve(__dirname, '../data/archives'),
    backups: path.resolve(__dirname, '../backups'),
    logs: path.resolve(__dirname, '../logs')
  }
};

// Validation
function validateConfig() {
  const errors = [];
  
  if (!config.ownerNumber) {
    errors.push('OWNER_NUMBER is required in .env file');
  }
  
  if (!config.geminiApiKey) {
    errors.push('GEMINI_API_KEY is required in .env file');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(err => console.error(`   - ${err}`));
    console.error('\n💡 Please check your .env file');
    process.exit(1);
  }
}

// Validate on import
validateConfig();

export default config;
