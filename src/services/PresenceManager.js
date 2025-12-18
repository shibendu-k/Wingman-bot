import { logger } from '../utils/logger.js';
import config from '../config.js';

/**
 * Presence Manager - Handles online status, sleep mode, and ghost reading
 * Makes bot behave more human-like to avoid bans
 */
class PresenceManager {
  constructor() {
    // Sleep mode config
    this.sleepModeEnabled = config.sleepMode || true;
    this.inactivityTimeout = config.inactivityTimeout || 15 * 60 * 1000; // 15 minutes
    this.lastActivity = Date.now();
    this.isAsleep = false;
    this.sleepCheckInterval = null;
    
    // Ghost read config (read without blue ticks)
    this.ghostReadContacts = new Set(); // Contacts to ghost read
    this.pendingMessages = new Map(); // chatId -> [messages]
    
    // Presence state
    this.currentPresence = 'available'; // available, unavailable, composing, recording
    
    // Random delays for human-like behavior
    this.typingDelayMin = 1000; // 1 second
    this.typingDelayMax = 3000; // 3 seconds
  }

  /**
   * Initialize presence manager
   */
  init(sock) {
    this.sock = sock;
    
    // Start sleep mode checker
    if (this.sleepModeEnabled) {
      this.startSleepChecker();
      logger.info('😴 Sleep mode enabled (inactive after 15 minutes)');
    }
    
    logger.info('👻 Ghost read feature ready');
  }

  /**
   * Update last activity timestamp
   */
  updateActivity() {
    this.lastActivity = Date.now();
    
    if (this.isAsleep) {
      this.wakeUp();
    }
  }

  /**
   * Start sleep mode checker
   */
  startSleepChecker() {
    this.sleepCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - this.lastActivity;
      
      // Check if should go to sleep
      if (!this.isAsleep && timeSinceActivity > this.inactivityTimeout) {
        this.goToSleep();
      }
    }, 60000); // Check every minute
  }

  /**
   * Put bot to sleep (appear offline)
   */
  async goToSleep() {
    if (this.isAsleep) return;
    
    this.isAsleep = true;
    await this.setPresence('unavailable');
    logger.info('😴 Bot went to sleep (appearing offline)');
  }

  /**
   * Wake up bot
   */
  async wakeUp() {
    if (!this.isAsleep) return;
    
    this.isAsleep = false;
    await this.setPresence('available');
    logger.info('👁️  Bot woke up');
  }

  /**
   * Set presence status
   */
  async setPresence(status, chatId = null) {
    try {
      if (chatId) {
        await this.sock.sendPresenceUpdate(status, chatId);
      } else {
        // Global presence
        this.currentPresence = status;
      }
    } catch (error) {
      logger.debug('Failed to update presence:', error.message);
    }
  }

  /**
   * Simulate typing with human-like delay
   */
  async simulateTyping(chatId, duration = null) {
    if (this.isAsleep) return;
    
    try {
      // Random typing duration if not specified
      const typingTime = duration || 
        Math.floor(Math.random() * (this.typingDelayMax - this.typingDelayMin)) + this.typingDelayMin;
      
      // Start composing
      await this.setPresence('composing', chatId);
      
      // Wait
      await new Promise(resolve => setTimeout(resolve, typingTime));
      
      // Stop composing
      await this.setPresence('paused', chatId);
      
    } catch (error) {
      logger.debug('Failed to simulate typing:', error.message);
    }
  }

  /**
   * Enable ghost reading for a contact
   */
  enableGhostRead(contactName) {
    this.ghostReadContacts.add(contactName);
    logger.info(`👻 Ghost read enabled for: ${contactName}`);
    return true;
  }

  /**
   * Disable ghost reading for a contact
   */
  disableGhostRead(contactName) {
    this.ghostReadContacts.delete(contactName);
    logger.info(`👁️  Ghost read disabled for: ${contactName}`);
    return true;
  }

  /**
   * Check if ghost reading is enabled for contact
   */
  isGhostReadEnabled(contactName) {
    return this.ghostReadContacts.has(contactName);
  }

  /**
   * List all ghost read contacts
   */
  getGhostReadContacts() {
    return Array.from(this.ghostReadContacts);
  }

  /**
   * Store message for ghost reading (don't send read receipt)
   */
  storeGhostMessage(chatId, messageId, message) {
    if (!this.pendingMessages.has(chatId)) {
      this.pendingMessages.set(chatId, []);
    }
    
    this.pendingMessages.get(chatId).push({
      id: messageId,
      message,
      timestamp: Date.now()
    });
    
    logger.debug(`👻 Message stored for ghost read: ${chatId}`);
  }

  /**
   * Get pending ghost messages for a chat
   */
  getGhostMessages(chatId) {
    return this.pendingMessages.get(chatId) || [];
  }

  /**
   * Mark ghost messages as read (send blue ticks)
   */
  async markGhostMessagesAsRead(chatId, messageIds = null) {
    try {
      const messages = this.pendingMessages.get(chatId);
      if (!messages || messages.length === 0) return;

      // If specific messageIds provided, mark only those
      const toMark = messageIds 
        ? messages.filter(m => messageIds.includes(m.id))
        : messages;

      // Send read receipts
      for (const msg of toMark) {
        await this.sock.readMessages([{
          remoteJid: chatId,
          id: msg.id,
          participant: msg.message.key.participant
        }]);
      }

      // Remove marked messages
      if (messageIds) {
        this.pendingMessages.set(
          chatId,
          messages.filter(m => !messageIds.includes(m.id))
        );
      } else {
        this.pendingMessages.delete(chatId);
      }

      logger.info(`✅ Marked ${toMark.length} ghost messages as read`);
      return toMark.length;
    } catch (error) {
      logger.error('Failed to mark messages as read:', error.message);
      return 0;
    }
  }

  /**
   * Clear old ghost messages (older than 24 hours)
   */
  cleanupOldGhostMessages() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [chatId, messages] of this.pendingMessages.entries()) {
      const filtered = messages.filter(m => now - m.timestamp < maxAge);
      
      if (filtered.length === 0) {
        this.pendingMessages.delete(chatId);
      } else if (filtered.length < messages.length) {
        this.pendingMessages.set(chatId, filtered);
      }
    }
  }

  /**
   * Get pending messages statistics
   */
  getPendingMessageStats() {
    const stats = {
      totalChats: this.pendingMessages.size,
      totalMessages: 0,
      chats: []
    };

    for (const [chatId, messages] of this.pendingMessages.entries()) {
      stats.totalMessages += messages.length;
      stats.chats.push({
        chatId,
        count: messages.length
      });
    }

    return stats;
  }

  /**
   * Get all pending messages (for iteration)
   */
  getAllPendingMessages() {
    return Array.from(this.pendingMessages.entries());
  }

  /**
   * Get status report
   */
  getStatus() {
    return {
      isAsleep: this.isAsleep,
      sleepModeEnabled: this.sleepModeEnabled,
      lastActivity: new Date(this.lastActivity).toLocaleString(),
      timeSinceActivity: Math.floor((Date.now() - this.lastActivity) / 1000) + 's',
      ghostReadContacts: this.getGhostReadContacts(),
      pendingGhostMessages: this.pendingMessages.size,
      currentPresence: this.currentPresence
    };
  }

  /**
   * Cleanup on shutdown
   */
  cleanup() {
    if (this.sleepCheckInterval) {
      clearInterval(this.sleepCheckInterval);
    }
  }
}

const presenceManager = new PresenceManager();
export default presenceManager;