import fs from 'fs';
import path from 'path';
import config from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Advanced Features - Quick replies and other convenience features
 */
class AdvancedFeatures {
  constructor() {
    this.quickRepliesFile = path.join(config.paths.data, 'quick_replies.json');
    this.quickReplies = this.loadQuickReplies();
  }

  /**
   * Load quick replies from file
   */
  loadQuickReplies() {
    try {
      if (fs.existsSync(this.quickRepliesFile)) {
        const data = fs.readFileSync(this.quickRepliesFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error('Failed to load quick replies', error);
    }
    return {};
  }

  /**
   * Save quick replies to file
   */
  saveQuickReplies() {
    try {
      fs.writeFileSync(
        this.quickRepliesFile,
        JSON.stringify(this.quickReplies, null, 2),
        'utf8'
      );
    } catch (error) {
      logger.error('Failed to save quick replies', error);
    }
  }

  /**
   * Add quick reply
   */
  addQuickReply(trigger, response) {
    this.quickReplies[trigger.toLowerCase()] = {
      response,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    this.saveQuickReplies();
    return true;
  }

  /**
   * Get quick reply
   */
  getQuickReply(trigger) {
    const reply = this.quickReplies[trigger.toLowerCase()];
    if (reply) {
      reply.usageCount++;
      this.saveQuickReplies();
      return reply.response;
    }
    return null;
  }

  /**
   * Delete quick reply
   */
  deleteQuickReply(trigger) {
    if (this.quickReplies[trigger.toLowerCase()]) {
      delete this.quickReplies[trigger.toLowerCase()];
      this.saveQuickReplies();
      return true;
    }
    return false;
  }

  /**
   * List all quick replies
   */
  listQuickReplies() {
    const replies = Object.entries(this.quickReplies);
    
    if (replies.length === 0) {
      return '⚡ No quick replies saved yet.\n\nUse: !quick <trigger> <response>';
    }
    
    return '⚡ **Quick Replies:**\n\n' + replies.map(([trigger, data], index) => {
      const usage = data.usageCount || 0;
      return `${index + 1}. **${trigger}**\n   Response: ${data.response}\n   Used: ${usage} times`;
    }).join('\n\n');
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text, limit = 5) {
    // Remove common words and get most frequent
    const commonWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
      'it', 'from', 'be', 'are', 'was', 'were', 'been', 'have', 'has'
    ]);
    
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
    
    // Count frequency
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Sort by frequency and return top N
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  /**
   * Calculate message statistics
   */
  calculateStats(messages) {
    if (!messages || messages.length === 0) {
      return {
        total: 0,
        avgLength: 0,
        keywords: []
      };
    }
    
    const totalLength = messages.reduce((sum, msg) => sum + msg.text.length, 0);
    const allText = messages.map(m => m.text).join(' ');
    
    return {
      total: messages.length,
      avgLength: Math.round(totalLength / messages.length),
      keywords: this.extractKeywords(allText)
    };
  }

  /**
   * Format duration
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  /**
   * Get time-based greeting
   */
  getGreeting() {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  }

  /**
   * Suggest emojis for text
   */
  suggestEmojis(text) {
    const emojiMap = {
      'happy': '😊 😄 🎉',
      'sad': '😢 😞 💔',
      'love': '❤️ 😍 💕',
      'angry': '😠 😡 💢',
      'cool': '😎 🔥 👍',
      'thanks': '🙏 💯 ✨',
      'food': '🍕 🍔 🍜',
      'party': '🎉 🎊 🥳',
      'work': '💼 📊 💻',
      'sleep': '😴 💤 🛌'
    };
    
    const textLower = text.toLowerCase();
    const suggestions = [];
    
    for (const [keyword, emojis] of Object.entries(emojiMap)) {
      if (textLower.includes(keyword)) {
        suggestions.push(emojis);
      }
    }
    
    return suggestions.length > 0 
      ? suggestions.join(' ')
      : '😊 👍 ✨ 💯';
  }
}

// Export singleton instance
const advancedFeatures = new AdvancedFeatures();
export default advancedFeatures;
