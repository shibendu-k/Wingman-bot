import makeWASocket, { DisconnectReason, useMultiFileAuthState, delay } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import config from './config.js';
import { logger } from './utils/logger.js';
import cryptoManager from './utils/crypto.js';
import securityManager from './utils/security.js';
import contactManager from './services/contactManager.js';
import storageManager from './services/storage.js';
import aiService from './services/aiService.js';
import stateManager from './services/stateManager.js';
import advancedFeatures from './services/advancedFeatures.js';
import { getPersonalityList } from './services/personalities.js';

/**
 * Wingman Bot - Main bot logic
 */
class WingmanBot {
  constructor() {
    this.sock = null;
    this.isReady = false;
  }

  /**
   * Start the bot
   */
  async start() {
    try {
      logger.info('🤖 Starting Wingman Bot...');

      const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ['Wingman Bot', 'Chrome', '1.0.0']
      });

      this.sock = sock;

      // Save credentials when updated
      sock.ev.on('creds.update', saveCreds);

      // Handle connection updates
      sock.ev.on('connection.update', (update) => this.handleConnection(update));

      // Handle incoming messages
      sock.ev.on('messages.upsert', async (m) => this.handleMessages(m));

      logger.info('✅ Bot initialization complete');
    } catch (error) {
      logger.error('Failed to start bot', error);
      throw error;
    }
  }

  /**
   * Handle connection updates
   */
  handleConnection(update) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Scan this QR code with WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      
      logger.info('Connection closed', { 
        shouldReconnect,
        reason: lastDisconnect?.error?.output?.statusCode
      });

      if (shouldReconnect) {
        setTimeout(() => this.start(), 3000);
      }
    } else if (connection === 'open') {
      this.isReady = true;
      logger.info('✅ Connected to WhatsApp!');
      console.log('\n🎉 Wingman Bot is ready!');
      console.log('🔒 System is LOCKED. Send !unlock <password> to start using the bot.\n');
    }
  }

  /**
   * Handle incoming messages
   */
  async handleMessages(m) {
    try {
      const message = m.messages[0];
      if (!message.message || message.key.fromMe) return;

      const sender = message.key.remoteJid;
      const text = message.message.conversation || 
                   message.message.extendedTextMessage?.text || '';

      // Check if sender is owner
      if (sender !== config.ownerNumber) {
        return; // Silently ignore non-owner messages
      }

      // Security checks
      if (securityManager.isBanned(sender)) {
        return; // Silently ignore banned users
      }

      const rateLimit = securityManager.checkRateLimit(sender);
      if (!rateLimit.allowed) {
        await this.reply(sender, `⏱️ Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`);
        return;
      }

      // Process command
      await this.processMessage(sender, text, message);
    } catch (error) {
      logger.error('Error handling message', error);
    }
  }

  /**
   * Process message and commands
   */
  async processMessage(sender, text, message) {
    try {
      const trimmedText = text.trim();

      // Check for quick reply triggers (if system is unlocked)
      if (cryptoManager.isUnlocked() && !trimmedText.startsWith('!')) {
        const quickReply = advancedFeatures.getQuickReply(trimmedText);
        if (quickReply) {
          await this.reply(sender, quickReply);
          return;
        }
      }

      // Handle state-based flows
      if (stateManager.hasState(sender)) {
        await this.handleStateFlow(sender, trimmedText);
        return;
      }

      // Handle commands
      if (trimmedText.startsWith('!')) {
        await this.handleCommand(sender, trimmedText);
      }
    } catch (error) {
      logger.error('Error processing message', error);
      await this.reply(sender, '❌ An error occurred. Please try again.');
    }
  }

  /**
   * Handle commands
   */
  async handleCommand(sender, text) {
    const [command, ...args] = text.slice(1).split(' ');
    const cmd = command.toLowerCase();

    // Commands that work when locked
    if (cmd === 'unlock') {
      await this.handleUnlock(sender, args.join(' '));
      return;
    }

    // All other commands require unlocked system
    if (!cryptoManager.isUnlocked()) {
      await this.reply(sender, '🔒 System is locked. Use !unlock <password> first.');
      return;
    }

    // Route commands
    switch (cmd) {
      case 'help':
        await this.handleHelp(sender);
        break;
      case 'suggest':
        await this.handleSuggest(sender, args.join(' '));
        break;
      case 'multi':
        await this.handleMultiSuggest(sender, args.join(' '));
        break;
      case 'list':
        await this.handleList(sender);
        break;
      case 'personality':
        await this.handlePersonality(sender);
        break;
      case 'profile':
        await this.handleProfile(sender, args);
        break;
      case 'tone':
        await this.handleTone(sender, args.join(' '));
        break;
      case 'rewrite':
        await this.handleRewrite(sender, args.join(' '));
        break;
      case 'quick':
        await this.handleQuick(sender, args);
        break;
      case 'summary':
        await this.handleSummary(sender, args[0]);
        break;
      case 'insights':
        await this.handleInsights(sender, args[0]);
        break;
      case 'stats':
        await this.handleStats(sender, args[0]);
        break;
      case 'search':
        await this.handleSearch(sender, args.join(' '));
        break;
      case 'export':
        await this.handleExport(sender, args[0]);
        break;
      case 'backup':
        await this.handleBackup(sender);
        break;
      case 'lock':
        await this.handleLock(sender);
        break;
      case 'ban':
        await this.handleBan(sender, args[0]);
        break;
      case 'unban':
        await this.handleUnban(sender, args[0]);
        break;
      default:
        await this.reply(sender, '❓ Unknown command. Use !help to see all commands.');
    }
  }

  /**
   * Handle unlock command
   */
  async handleUnlock(sender, password) {
    if (!password) {
      await this.reply(sender, '❌ Usage: !unlock <password>');
      return;
    }

    // Check lockout
    const lockout = securityManager.isLockedOut(sender);
    if (lockout.locked) {
      await this.reply(sender, `🔒 Too many failed attempts. Try again in ${lockout.remainingMinutes} minutes.`);
      return;
    }

    try {
      cryptoManager.deriveKey(password);
      securityManager.clearFailedAttempts(sender);
      
      await this.reply(sender, '🔓 System unlocked successfully!\n\nUse !help to see all commands.');
      logger.info('System unlocked', { sender });
    } catch (error) {
      securityManager.recordFailedAttempt(sender);
      const attempts = securityManager.isLockedOut(sender);
      
      if (attempts.locked) {
        await this.reply(sender, `🔒 Too many failed attempts. Locked for ${attempts.remainingMinutes} minutes.`);
      } else {
        await this.reply(sender, '❌ Wrong password. Try again.');
      }
    }
  }

  /**
   * Handle lock command
   */
  async handleLock(sender) {
    cryptoManager.clearKey();
    await this.reply(sender, '🔒 System locked. Use !unlock <password> to unlock.');
    logger.info('System locked', { sender });
  }

  /**
   * Handle help command
   */
  async handleHelp(sender) {
    const help = `🤖 **Wingman Bot v2.0 - Commands**

📱 **Core Commands:**
!suggest <message> - Get AI reply suggestion
!multi <message> - Get 3 different suggestions
!list - View all contacts
!personality - List all 7 personalities
!profile <contact> <personality> - Set personality

⚡ **Quick Features:**
!quick <trigger> <response> - Save quick reply
!quick - List all quick replies
!quick delete <trigger> - Delete quick reply

📊 **Analysis:**
!summary <contact> - AI conversation summary
!insights <contact> - Detailed analytics
!stats <contact> - Message statistics
!search <keyword> - Search conversations
!tone <message> - Analyze emotional tone
!rewrite <style> | <msg> - Rewrite message

💾 **Data Management:**
!export <contact> - Export conversation
!backup - Create full backup (owner only)

🔐 **Security:**
!unlock <password> - Unlock system
!lock - Lock system
!ban <user_jid> - Ban user
!unban <user_jid> - Unban user

💡 Use !personality to see all 7 AI personalities.`;

    await this.reply(sender, help);
  }

  /**
   * Handle suggest command
   */
  async handleSuggest(sender, message) {
    if (!message) {
      await this.reply(sender, '❌ Usage: !suggest <message to respond to>');
      return;
    }

    // Show contact selection
    const contacts = contactManager.getAllContacts();
    
    if (contacts.length === 0) {
      stateManager.setState(sender, 'creating_contact', { message });
      await this.reply(sender, '📝 Create a profile for this conversation:\n\nWhat should I call this contact?');
      return;
    }

    const contactList = contacts.map((c, i) => 
      `${i + 1}. ${c.name} [${c.personality}]`
    ).join('\n');

    stateManager.setState(sender, 'selecting_contact', { message });
    await this.reply(sender, `🎯 **Select Context:**\n\n${contactList}\n${contacts.length + 1}. ➕ Create New Profile\n${contacts.length + 2}. 🔄 Temporary (One-time)\n\nReply with number:`);
  }

  /**
   * Handle multi-suggest command
   */
  async handleMultiSuggest(sender, message) {
    if (!message) {
      await this.reply(sender, '❌ Usage: !multi <message to respond to>');
      return;
    }

    await this.reply(sender, '🤔 Generating multiple suggestions...');

    const result = await aiService.generateMultiSuggestions(message);
    
    if (result.success) {
      await this.reply(sender, `💡 **Multiple Suggestions:**\n\n${result.suggestions}`);
    } else {
      await this.reply(sender, `❌ ${result.error}`);
    }
  }

  /**
   * Handle list command
   */
  async handleList(sender) {
    const list = contactManager.getFormattedList();
    await this.reply(sender, list);
  }

  /**
   * Handle personality command
   */
  async handlePersonality(sender) {
    const list = getPersonalityList();
    await this.reply(sender, `🎭 **Available Personalities:**\n\n${list}\n\nUse !profile <contact> <personality> to set.`);
  }

  /**
   * Handle profile command
   */
  async handleProfile(sender, args) {
    if (args.length < 2) {
      await this.reply(sender, '❌ Usage: !profile <contact_name> <personality>');
      return;
    }

    const contactName = args[0];
    const personality = args[1];

    const contacts = contactManager.findByName(contactName);
    if (contacts.length === 0) {
      await this.reply(sender, '❌ Contact not found. Use !list to see all contacts.');
      return;
    }

    const contact = contacts[0];
    contactManager.setPersonality(contact.jid, personality);
    await this.reply(sender, `✅ Personality set to **${personality}** for ${contact.name}`);
  }

  /**
   * Handle tone analysis
   */
  async handleTone(sender, message) {
    if (!message) {
      await this.reply(sender, '❌ Usage: !tone <message to analyze>');
      return;
    }

    await this.reply(sender, '🎭 Analyzing tone...');

    const result = await aiService.analyzeTone(message);
    
    if (result.success) {
      await this.reply(sender, `🎭 **Tone Analysis:**\n\n${result.analysis}`);
    } else {
      await this.reply(sender, `❌ ${result.error}`);
    }
  }

  /**
   * Handle rewrite command
   */
  async handleRewrite(sender, text) {
    const parts = text.split('|').map(p => p.trim());
    
    if (parts.length < 2) {
      await this.reply(sender, '❌ Usage: !rewrite <style> | <message>\n\nStyles: casual, professional, romantic, funny, brief, detailed');
      return;
    }

    const [style, message] = parts;

    await this.reply(sender, '✍️ Rewriting...');

    const result = await aiService.rewriteMessage(message, style);
    
    if (result.success) {
      await this.reply(sender, `✍️ **${style.toUpperCase()} version:**\n\n${result.rewritten}`);
    } else {
      await this.reply(sender, `❌ ${result.error}`);
    }
  }

  /**
   * Handle quick reply commands
   */
  async handleQuick(sender, args) {
    if (args.length === 0) {
      const list = advancedFeatures.listQuickReplies();
      await this.reply(sender, list);
      return;
    }

    if (args[0] === 'delete' && args.length > 1) {
      const deleted = advancedFeatures.deleteQuickReply(args[1]);
      if (deleted) {
        await this.reply(sender, `✅ Quick reply **${args[1]}** deleted.`);
      } else {
        await this.reply(sender, `❌ Quick reply **${args[1]}** not found.`);
      }
      return;
    }

    if (args.length < 2) {
      await this.reply(sender, '❌ Usage: !quick <trigger> <response>');
      return;
    }

    const trigger = args[0];
    const response = args.slice(1).join(' ');

    advancedFeatures.addQuickReply(trigger, response);
    await this.reply(sender, `✅ Quick reply saved!\n\nTrigger: **${trigger}**\nResponse: ${response}`);
  }

  /**
   * Handle summary command
   */
  async handleSummary(sender, contactName) {
    if (!contactName) {
      await this.reply(sender, '❌ Usage: !summary <contact_name>');
      return;
    }

    const contacts = contactManager.findByName(contactName);
    if (contacts.length === 0) {
      await this.reply(sender, '❌ Contact not found.');
      return;
    }

    const contact = contacts[0];
    const history = storageManager.loadFullHistory(contact.uuid);

    if (history.length === 0) {
      await this.reply(sender, '❌ No conversation history found.');
      return;
    }

    await this.reply(sender, '📋 Generating summary...');

    const result = await aiService.generateSummary(history, contact.name);
    
    if (result.success) {
      await this.reply(sender, `📋 **Summary for ${contact.name}:**\n\n${result.summary}`);
    } else {
      await this.reply(sender, `❌ ${result.error}`);
    }
  }

  /**
   * Handle insights command
   */
  async handleInsights(sender, contactName) {
    if (!contactName) {
      await this.reply(sender, '❌ Usage: !insights <contact_name>');
      return;
    }

    const contacts = contactManager.findByName(contactName);
    if (contacts.length === 0) {
      await this.reply(sender, '❌ Contact not found.');
      return;
    }

    const contact = contacts[0];
    const history = storageManager.loadFullHistory(contact.uuid);

    if (history.length === 0) {
      await this.reply(sender, '❌ No conversation history found.');
      return;
    }

    await this.reply(sender, '📊 Generating insights...');

    const result = await aiService.generateInsights(history, contact.name);
    
    if (result.success) {
      await this.reply(sender, `📊 **Insights for ${contact.name}:**\n\n${result.insights}`);
    } else {
      await this.reply(sender, `❌ ${result.error}`);
    }
  }

  /**
   * Handle stats command
   */
  async handleStats(sender, contactName) {
    if (!contactName) {
      await this.reply(sender, '❌ Usage: !stats <contact_name>');
      return;
    }

    const contacts = contactManager.findByName(contactName);
    if (contacts.length === 0) {
      await this.reply(sender, '❌ Contact not found.');
      return;
    }

    const contact = contacts[0];
    const stats = storageManager.getStats(contact.uuid);

    const statsText = `📊 **Stats for ${contact.name}:**

💬 Total Messages: ${stats.total}
📥 From Them: ${stats.fromThem}
📤 From You: ${stats.fromUser}
📏 Avg Length: ${stats.avgLength.them} (them), ${stats.avgLength.user} (you)
📁 Active: ${stats.active}
🗄️ Archived: ${stats.archived}
📅 First: ${stats.firstMessage ? new Date(stats.firstMessage).toLocaleDateString() : 'N/A'}
📅 Last: ${stats.lastMessage ? new Date(stats.lastMessage).toLocaleDateString() : 'N/A'}`;

    await this.reply(sender, statsText);
  }

  /**
   * Handle search command
   */
  async handleSearch(sender, keyword) {
    if (!keyword) {
      await this.reply(sender, '❌ Usage: !search <keyword>');
      return;
    }

    const allContacts = contactManager.getAllContacts();
    const results = [];

    for (const contact of allContacts) {
      const matches = storageManager.searchMessages(contact.uuid, keyword);
      if (matches.length > 0) {
        results.push({ contact: contact.name, count: matches.length });
      }
    }

    if (results.length === 0) {
      await this.reply(sender, `🔍 No results found for "${keyword}"`);
      return;
    }

    const resultText = `🔍 **Search Results for "${keyword}":**\n\n` +
      results.map(r => `${r.contact}: ${r.count} matches`).join('\n');

    await this.reply(sender, resultText);
  }

  /**
   * Handle export command
   */
  async handleExport(sender, contactName) {
    if (!contactName) {
      await this.reply(sender, '❌ Usage: !export <contact_name>');
      return;
    }

    const contacts = contactManager.findByName(contactName);
    if (contacts.length === 0) {
      await this.reply(sender, '❌ Contact not found.');
      return;
    }

    const contact = contacts[0];
    const exportPath = storageManager.exportConversation(contact.uuid, contact.name);

    if (exportPath) {
      await this.reply(sender, `✅ Conversation exported!\n\nSaved to: ${exportPath}`);
    } else {
      await this.reply(sender, '❌ Export failed.');
    }
  }

  /**
   * Handle backup command
   */
  async handleBackup(sender) {
    await this.reply(sender, '💾 Creating backup...');

    const backupPath = storageManager.createBackup();

    if (backupPath) {
      await this.reply(sender, `✅ Backup created!\n\nLocation: ${backupPath}`);
    } else {
      await this.reply(sender, '❌ Backup failed.');
    }
  }

  /**
   * Handle ban command
   */
  async handleBan(sender, userJid) {
    if (!userJid) {
      await this.reply(sender, '❌ Usage: !ban <user_jid>');
      return;
    }

    securityManager.banUser(userJid);
    await this.reply(sender, `✅ User banned: ${userJid}`);
  }

  /**
   * Handle unban command
   */
  async handleUnban(sender, userJid) {
    if (!userJid) {
      await this.reply(sender, '❌ Usage: !unban <user_jid>');
      return;
    }

    securityManager.unbanUser(userJid);
    await this.reply(sender, `✅ User unbanned: ${userJid}`);
  }

  /**
   * Handle state-based flows
   */
  async handleStateFlow(sender, text) {
    const state = stateManager.getState(sender);
    
    if (state.state === 'creating_contact') {
      const contactName = text;
      stateManager.setState(sender, 'selecting_personality', { 
        ...state.data, 
        contactName 
      });
      await this.reply(sender, '🎭 Select personality:\n\n1. superhuman\n2. neurocoach\n3. professor\n4. gullyboy\n5. poet\n6. lawyer\n7. medic\n\nReply with number:');
    } else if (state.state === 'selecting_personality') {
      const personalityMap = ['superhuman', 'neurocoach', 'professor', 'gullyboy', 'poet', 'lawyer', 'medic'];
      const index = parseInt(text) - 1;
      
      if (index < 0 || index >= personalityMap.length) {
        await this.reply(sender, '❌ Invalid selection. Please reply with a number 1-7.');
        return;
      }

      const personality = personalityMap[index];
      const contact = contactManager.getOrCreateContact(sender, state.data.contactName);
      contactManager.setPersonality(contact.jid, personality);

      // Generate suggestion
      await this.reply(sender, '🤔 Generating suggestion...');

      const history = storageManager.loadConversation(contact.uuid).messages;
      const result = await aiService.generateSuggestion(state.data.message, personality, history);

      if (result.success) {
        await this.reply(sender, `💡 **Suggestion for ${contact.name}:**\n\n${result.suggestion}`);
        
        // Save message to history
        storageManager.addMessage(contact.uuid, 'them', state.data.message);
        storageManager.addMessage(contact.uuid, 'user', result.suggestion);
      } else {
        await this.reply(sender, `❌ ${result.error}`);
      }

      stateManager.clearState(sender);
    } else if (state.state === 'selecting_contact') {
      const contacts = contactManager.getAllContacts();
      const selection = parseInt(text) - 1;

      if (selection === contacts.length) {
        // Create new profile
        stateManager.setState(sender, 'creating_contact', state.data);
        await this.reply(sender, '📝 Create a profile for this conversation:\n\nWhat should I call this contact?');
        return;
      } else if (selection === contacts.length + 1) {
        // Temporary mode
        await this.reply(sender, '🤔 Generating suggestion...');

        const result = await aiService.generateSuggestion(state.data.message, 'superhuman', []);

        if (result.success) {
          await this.reply(sender, `💡 **Temporary Suggestion:**\n\n${result.suggestion}`);
        } else {
          await this.reply(sender, `❌ ${result.error}`);
        }

        stateManager.clearState(sender);
        return;
      }

      if (selection < 0 || selection >= contacts.length) {
        await this.reply(sender, '❌ Invalid selection. Please try again.');
        return;
      }

      const contact = contacts[selection];
      
      // Generate suggestion
      await this.reply(sender, '🤔 Generating suggestion...');

      const history = storageManager.loadConversation(contact.uuid).messages;
      const result = await aiService.generateSuggestion(
        state.data.message, 
        contact.personality, 
        history
      );

      if (result.success) {
        await this.reply(sender, `💡 **Suggestion for ${contact.name}:**\n\n${result.suggestion}`);
        
        // Save message to history
        storageManager.addMessage(contact.uuid, 'them', state.data.message);
        storageManager.addMessage(contact.uuid, 'user', result.suggestion);
      } else {
        await this.reply(sender, `❌ ${result.error}`);
      }

      stateManager.clearState(sender);
    }
  }

  /**
   * Send reply to user
   */
  async reply(jid, text) {
    try {
      await this.sock.sendMessage(jid, { text });
    } catch (error) {
      logger.error('Failed to send message', error);
    }
  }
}

export default WingmanBot;
