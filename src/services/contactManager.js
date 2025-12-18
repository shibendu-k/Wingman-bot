import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Contact Manager - Handles contact/phonebook management
 */
class ContactManager {
  constructor() {
    this.contactsFile = path.join(config.paths.data, 'contacts.json');
    this.contacts = this.loadContacts();
  }

  /**
   * Load contacts from file
   */
  loadContacts() {
    try {
      if (fs.existsSync(this.contactsFile)) {
        const data = fs.readFileSync(this.contactsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error('Failed to load contacts', error);
    }
    return {};
  }

  /**
   * Save contacts to file
   */
  saveContacts() {
    try {
      fs.writeFileSync(
        this.contactsFile,
        JSON.stringify(this.contacts, null, 2),
        'utf8'
      );
    } catch (error) {
      logger.error('Failed to save contacts', error);
    }
  }

  /**
   * Generate UUID for contact
   */
  generateUUID() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Create or get contact
   */
  getOrCreateContact(jid, name = null) {
    // Normalize JID
    const normalizedJid = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`;
    
    if (!this.contacts[normalizedJid]) {
      this.contacts[normalizedJid] = {
        uuid: this.generateUUID(),
        name: name || 'Unknown',
        jid: normalizedJid,
        personality: 'superhuman',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          totalMessages: 0,
          lastMessage: null
        }
      };
      this.saveContacts();
      logger.info('Created new contact', { jid: normalizedJid });
    }
    
    return this.contacts[normalizedJid];
  }

  /**
   * Update contact name
   */
  updateContactName(jid, name) {
    const contact = this.getOrCreateContact(jid);
    contact.name = name;
    contact.updatedAt = new Date().toISOString();
    this.saveContacts();
  }

  /**
   * Set personality for contact
   */
  setPersonality(jid, personality) {
    const contact = this.getOrCreateContact(jid);
    contact.personality = personality;
    contact.updatedAt = new Date().toISOString();
    this.saveContacts();
    return contact;
  }

  /**
   * Get personality for contact
   */
  getPersonality(jid) {
    const contact = this.contacts[jid];
    return contact?.personality || 'superhuman';
  }

  /**
   * Update contact metadata
   */
  updateMetadata(jid, updates) {
    const contact = this.getOrCreateContact(jid);
    contact.metadata = {
      ...contact.metadata,
      ...updates
    };
    contact.updatedAt = new Date().toISOString();
    this.saveContacts();
  }

  /**
   * Get all contacts
   */
  getAllContacts() {
    return Object.values(this.contacts);
  }

  /**
   * Find contact by name (fuzzy search)
   */
  findByName(searchName) {
    const searchLower = searchName.toLowerCase();
    return Object.values(this.contacts).filter(contact =>
      contact.name.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Get contact by JID
   */
  getContact(jid) {
    return this.contacts[jid] || null;
  }

  /**
   * Delete contact
   */
  deleteContact(jid) {
    if (this.contacts[jid]) {
      delete this.contacts[jid];
      this.saveContacts();
      return true;
    }
    return false;
  }

  /**
   * Get contact list formatted for display
   */
  getFormattedList() {
    const contacts = this.getAllContacts();
    
    if (contacts.length === 0) {
      return '📇 No contacts yet. Send !suggest to create one.';
    }
    
    return '📇 **Your Contacts:**\n\n' + contacts.map((contact, index) => {
      const msgCount = contact.metadata?.totalMessages || 0;
      return `${index + 1}. **${contact.name}** [${contact.personality}]\n   Messages: ${msgCount}`;
    }).join('\n\n');
  }
}

// Export singleton instance
const contactManager = new ContactManager();
export default contactManager;
