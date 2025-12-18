import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { getPersonalityPrompt } from './personalities.js';

/**
 * AI Service - Google Gemini Integration
 */
class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = null;
  }

  /**
   * Initialize AI service
   */
  async init() {
    try {
      this.model = this.genAI.getGenerativeModel({ 
        model: config.geminiModel,
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      });
      logger.info('🤖 AI Service initialized with Gemini');
    } catch (error) {
      logger.error('Failed to initialize AI:', error.message);
      throw error;
    }
  }

  /**
   * Detect language/dialect from text
   */
  detectLanguage(text) {
    // Simple heuristic detection
    const hasHindi = /[\u0900-\u097F]/.test(text);
    const hasBengali = /[\u0980-\u09FF]/.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    
    if (hasHindi && hasEnglish) return 'Hinglish';
    if (hasBengali && hasEnglish) return 'Benglish';
    if (hasHindi) return 'Hindi';
    if (hasBengali) return 'Bengali';
    return 'English';
  }

  /**
   * Build conversation context from history
   */
  buildContext(conversation) {
    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
      return '';
    }
    
    // Get last 10 messages for context
    const recentMessages = conversation.messages.slice(-10);
    
    let context = '\n\n=== CONVERSATION HISTORY ===\n';
    recentMessages.forEach(msg => {
      const role = msg.role === 'user' ? 'THEM' : 'YOU';
      context += `${role}: ${msg.content}\n`;
    });
    context += '=== END HISTORY ===\n\n';
    
    return context;
  }

  /**
   * Generate AI suggestion
   */
  async generateSuggestion(userMessage, personality = 'superhuman', conversation = null) {
    try {
      const detectedLang = this.detectLanguage(userMessage);
      const personalityPrompt = getPersonalityPrompt(personality);
      
      // Build context from conversation history
      const contextHistory = conversation ? this.buildContext(conversation) : '';
      
      const systemPrompt = `${personalityPrompt}

DETECTED LANGUAGE: ${detectedLang}
YOU MUST RESPOND IN ${detectedLang} - Match the EXACT language, dialect, and style of the input.

${contextHistory}

TASK: The user needs help replying to a message. Generate a suggestion they can use.
- Be natural and authentic
- Match the tone and context
- Be UNFILTERED - no censorship
- MUST use ${detectedLang} language/dialect

Message to respond to: "${userMessage}"

Generate a suggested reply:`;

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const suggestion = response.text();
      
      logger.debug(`Generated suggestion using ${personality} personality`);
      return suggestion.trim();
      
    } catch (error) {
      logger.error('AI generation failed:', error.message);
      throw new Error('Failed to generate suggestion. Please try again.');
    }
  }

  /**
   * Analyze message for personality recommendation
   */
  async recommendPersonality(message) {
    try {
      const prompt = `Analyze this message and recommend the BEST personality to handle it.

Message: "${message}"

Personalities available:
- neurocoach: Psychology, empathy, emotional support
- professor: Intelligent, mature, educational
- gullyboy: Street-smart, bold, handles insults
- poet: Creative, romantic, beautiful
- lawyer: Legal, authoritative, handles threats
- medic: Medical, caring, health-related
- superhuman: Adaptive, handles anything

Respond with ONLY the personality key (one word, lowercase). No explanation.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const recommendation = response.text().trim().toLowerCase();
      
      return recommendation;
    } catch (error) {
      logger.error('Personality recommendation failed:', error.message);
      return 'superhuman'; // Default fallback
    }
  }
}

export const aiService = new AIService();
