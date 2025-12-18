import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config.js';
import { getPersonality } from './personalities.js';
import { logger } from '../utils/logger.js';

/**
 * AI Service - Handles Google Gemini API interactions
 */
class AIService {
  constructor() {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Build context from conversation history
   */
  buildContext(history) {
    if (!history || history.length === 0) {
      return '';
    }
    
    // Take last 10 messages for context
    const recentHistory = history.slice(-10);
    
    return '\n\nRecent conversation:\n' + recentHistory.map(msg => 
      `${msg.sender === 'user' ? 'Them' : 'You'}: ${msg.text}`
    ).join('\n');
  }

  /**
   * Detect language from text
   */
  detectLanguage(text) {
    // Simple language detection
    const hindiPattern = /[\u0900-\u097F]/;
    const hasHindi = hindiPattern.test(text);
    
    if (hasHindi) return 'Hindi/Hinglish';
    return 'English';
  }

  /**
   * Generate AI suggestion
   */
  async generateSuggestion(message, personalityKey = 'superhuman', history = []) {
    try {
      const personality = getPersonality(personalityKey);
      const context = this.buildContext(history);
      const language = this.detectLanguage(message);
      
      const prompt = `${personality.prompt}

${context}

They just sent: "${message}"

Respond in ${language}. Generate a natural, conversational reply that the user can send.
Only provide the reply text, nothing else.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        suggestion: text.trim(),
        personality: personality.name
      };
    } catch (error) {
      logger.error('AI generation failed', error);
      return {
        success: false,
        error: 'Failed to generate suggestion. Please try again.'
      };
    }
  }

  /**
   * Generate multiple suggestions (3 different styles)
   */
  async generateMultiSuggestions(message, history = []) {
    try {
      const context = this.buildContext(history);
      const language = this.detectLanguage(message);
      
      const prompt = `You are an AI assistant helping someone reply to a message.

${context}

They received: "${message}"

Generate 3 different reply options in ${language}:
1. CASUAL - Friendly, relaxed tone
2. PROFESSIONAL - Polite, formal tone  
3. FUNNY - Humorous, witty tone

Format each as:
1. CASUAL
[reply]

2. PROFESSIONAL
[reply]

3. FUNNY
[reply]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        suggestions: text.trim()
      };
    } catch (error) {
      logger.error('Multi-suggestion failed', error);
      return {
        success: false,
        error: 'Failed to generate suggestions. Please try again.'
      };
    }
  }

  /**
   * Analyze message tone
   */
  async analyzeTone(message) {
    try {
      const prompt = `Analyze the emotional tone of this message:

"${message}"

Provide:
1. Primary tone (one word: HAPPY, SAD, ANGRY, NEUTRAL, EXCITED, WORRIED, UPSET, FLIRTY, etc.)
2. Confidence (percentage)
3. Brief advice on how to respond

Format:
Tone: [TONE]
Confidence: [X]%
Advice: [brief advice]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        analysis: text.trim()
      };
    } catch (error) {
      logger.error('Tone analysis failed', error);
      return {
        success: false,
        error: 'Failed to analyze tone. Please try again.'
      };
    }
  }

  /**
   * Rewrite message in different style
   */
  async rewriteMessage(message, style) {
    try {
      const styles = {
        casual: 'casual, friendly, relaxed',
        professional: 'professional, formal, polite',
        romantic: 'romantic, sweet, affectionate',
        funny: 'humorous, witty, playful',
        brief: 'very short and concise',
        detailed: 'detailed and elaborate'
      };
      
      const styleDesc = styles[style] || style;
      
      const prompt = `Rewrite this message in a ${styleDesc} style:

Original: "${message}"

Provide only the rewritten message, nothing else.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        rewritten: text.trim()
      };
    } catch (error) {
      logger.error('Message rewrite failed', error);
      return {
        success: false,
        error: 'Failed to rewrite message. Please try again.'
      };
    }
  }

  /**
   * Generate conversation summary
   */
  async generateSummary(history, contactName) {
    try {
      const messages = history.slice(-50).map(msg =>
        `${msg.sender === 'user' ? 'Them' : 'You'}: ${msg.text}`
      ).join('\n');
      
      const prompt = `Summarize this conversation with ${contactName}:

${messages}

Provide a brief, insightful summary covering:
- Main topics discussed
- Current situation/context
- Tone/mood of conversation
- Any important details to remember

Keep it concise (3-4 sentences).`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        summary: text.trim()
      };
    } catch (error) {
      logger.error('Summary generation failed', error);
      return {
        success: false,
        error: 'Failed to generate summary. Please try again.'
      };
    }
  }

  /**
   * Generate conversation insights
   */
  async generateInsights(history, contactName) {
    try {
      const messages = history.map(msg =>
        `${msg.sender === 'user' ? 'Them' : 'You'}: ${msg.text}`
      ).join('\n');
      
      const prompt = `Analyze this conversation with ${contactName} and provide insights:

${messages}

Provide:
- Relationship dynamic
- Communication patterns
- Topics they care about
- Their personality traits
- Suggestions for better communication

Be specific and insightful.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        insights: text.trim()
      };
    } catch (error) {
      logger.error('Insights generation failed', error);
      return {
        success: false,
        error: 'Failed to generate insights. Please try again.'
      };
    }
  }
}

// Export singleton instance
const aiService = new AIService();
export default aiService;
