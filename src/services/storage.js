import fs from 'fs';
import path from 'path';
import config from '../config.js';
import cryptoManager from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

/**
 * Storage Manager - Handles encrypted conversation storage with archiving
 */
class StorageManager {
  constructor() {
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const dirs = [
      config.paths.data,
      config.paths.conversations,
      config.paths.archives,
      config.paths.backups
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get file path for contact
   */
  getConversationPath(contactUuid) {
    return path.join(config.paths.conversations, `${contactUuid}.enc`);
  }

  /**
   * Get archive path for contact
   */
  getArchivePath(contactUuid, archiveIndex) {
    return path.join(config.paths.archives, `${contactUuid}_${archiveIndex}.enc`);
  }

  /**
   * Save conversation (encrypted)
   */
  saveConversation(contactUuid, conversation) {
    try {
      if (!cryptoManager.isUnlocked()) {
        throw new Error('System is locked. Cannot save encrypted data.');
      }

      const encrypted = cryptoManager.encrypt(conversation);
      const filePath = this.getConversationPath(contactUuid);
      
      fs.writeFileSync(filePath, encrypted, 'utf8');
      return true;
    } catch (error) {
      logger.error('Failed to save conversation', error);
      return false;
    }
  }

  /**
   * Load conversation (encrypted)
   */
  loadConversation(contactUuid) {
    try {
      if (!cryptoManager.isUnlocked()) {
        throw new Error('System is locked. Unlock first.');
      }

      const filePath = this.getConversationPath(contactUuid);
      
      if (!fs.existsSync(filePath)) {
        return {
          messages: [],
          metadata: {
            totalMessages: 0,
            archived: 0,
            lastUpdate: new Date().toISOString()
          }
        };
      }

      const encrypted = fs.readFileSync(filePath, 'utf8');
      const decrypted = cryptoManager.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Failed to load conversation', error);
      return {
        messages: [],
        metadata: {
          totalMessages: 0,
          archived: 0,
          lastUpdate: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Add message to conversation
   */
  addMessage(contactUuid, sender, text) {
    const conversation = this.loadConversation(contactUuid);
    
    const message = {
      sender,
      text,
      timestamp: new Date().toISOString()
    };
    
    conversation.messages.push(message);
    conversation.metadata.totalMessages++;
    conversation.metadata.lastUpdate = new Date().toISOString();
    
    // Auto-archive if needed
    if (conversation.messages.length > config.archiveThreshold) {
      this.archiveOldMessages(contactUuid, conversation);
    }
    
    this.saveConversation(contactUuid, conversation);
    return message;
  }

  /**
   * Archive old messages
   */
  archiveOldMessages(contactUuid, conversation) {
    try {
      const archiveCount = conversation.messages.length - config.maxActiveMessages;
      
      if (archiveCount <= 0) return;
      
      const toArchive = conversation.messages.splice(0, archiveCount);
      const archiveIndex = conversation.metadata.archived || 0;
      
      // Save archive
      const archivePath = this.getArchivePath(contactUuid, archiveIndex);
      const encrypted = cryptoManager.encrypt(toArchive);
      fs.writeFileSync(archivePath, encrypted, 'utf8');
      
      conversation.metadata.archived = archiveIndex + 1;
      
      logger.info('Archived old messages', { 
        contactUuid, 
        count: archiveCount,
        archiveIndex 
      });
    } catch (error) {
      logger.error('Failed to archive messages', error);
    }
  }

  /**
   * Load all messages including archives
   */
  loadFullHistory(contactUuid) {
    const conversation = this.loadConversation(contactUuid);
    const allMessages = [...conversation.messages];
    
    // Load archives
    const archiveCount = conversation.metadata.archived || 0;
    for (let i = 0; i < archiveCount; i++) {
      try {
        const archivePath = this.getArchivePath(contactUuid, i);
        if (fs.existsSync(archivePath)) {
          const encrypted = fs.readFileSync(archivePath, 'utf8');
          const decrypted = cryptoManager.decrypt(encrypted);
          const archived = JSON.parse(decrypted);
          allMessages.unshift(...archived);
        }
      } catch (error) {
        logger.error('Failed to load archive', { index: i, error });
      }
    }
    
    return allMessages;
  }

  /**
   * Search messages
   */
  searchMessages(contactUuid, keyword) {
    const allMessages = this.loadFullHistory(contactUuid);
    const searchLower = keyword.toLowerCase();
    
    return allMessages.filter(msg =>
      msg.text.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Get conversation statistics
   */
  getStats(contactUuid) {
    const conversation = this.loadConversation(contactUuid);
    const allMessages = this.loadFullHistory(contactUuid);
    
    const userMessages = allMessages.filter(m => m.sender === 'user');
    const theirMessages = allMessages.filter(m => m.sender === 'them');
    
    return {
      total: allMessages.length,
      active: conversation.messages.length,
      archived: conversation.metadata.archived || 0,
      fromUser: userMessages.length,
      fromThem: theirMessages.length,
      avgLength: {
        user: userMessages.length > 0 
          ? Math.round(userMessages.reduce((sum, m) => sum + m.text.length, 0) / userMessages.length)
          : 0,
        them: theirMessages.length > 0
          ? Math.round(theirMessages.reduce((sum, m) => sum + m.text.length, 0) / theirMessages.length)
          : 0
      },
      firstMessage: allMessages[0]?.timestamp,
      lastMessage: allMessages[allMessages.length - 1]?.timestamp
    };
  }

  /**
   * Export conversation to JSON
   */
  exportConversation(contactUuid, contactName) {
    try {
      const allMessages = this.loadFullHistory(contactUuid);
      const stats = this.getStats(contactUuid);
      
      const exportData = {
        contact: contactName,
        exported: new Date().toISOString(),
        stats,
        messages: allMessages
      };
      
      const exportPath = path.join(
        config.paths.data, 
        `export_${contactName}_${Date.now()}.json`
      );
      
      fs.writeFileSync(
        exportPath,
        JSON.stringify(exportData, null, 2),
        'utf8'
      );
      
      return exportPath;
    } catch (error) {
      logger.error('Failed to export conversation', error);
      return null;
    }
  }

  /**
   * Create full backup
   */
  createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(config.paths.backups, `backup_${timestamp}`);
      
      fs.mkdirSync(backupDir, { recursive: true });
      
      // Copy all data files
      const files = [
        ...fs.readdirSync(config.paths.conversations).map(f => 
          path.join(config.paths.conversations, f)
        ),
        ...fs.readdirSync(config.paths.archives).map(f => 
          path.join(config.paths.archives, f)
        ),
        path.join(config.paths.data, 'contacts.json')
      ];
      
      files.forEach(file => {
        if (fs.existsSync(file)) {
          const fileName = path.basename(file);
          fs.copyFileSync(file, path.join(backupDir, fileName));
        }
      });
      
      return backupDir;
    } catch (error) {
      logger.error('Failed to create backup', error);
      return null;
    }
  }
}

// Export singleton instance
const storageManager = new StorageManager();
export default storageManager;
