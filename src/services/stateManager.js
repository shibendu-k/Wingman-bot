import { logger } from '../utils/logger.js';

/**
 * State Manager - Handles conversation flow state for multi-step interactions
 */
class StateManager {
  constructor() {
    this.states = new Map(); // userId -> state object
    this.timeouts = new Map(); // userId -> timeout handle
    this.stateTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Set state for user
   */
  setState(userId, state, data = {}) {
    this.clearTimeout(userId);
    
    this.states.set(userId, {
      state,
      data,
      timestamp: Date.now()
    });
    
    // Auto-clear state after timeout
    const timeout = setTimeout(() => {
      this.clearState(userId);
      logger.debug('State auto-cleared due to timeout', { userId });
    }, this.stateTimeout);
    
    this.timeouts.set(userId, timeout);
    
    logger.debug('State set', { userId, state });
  }

  /**
   * Get state for user
   */
  getState(userId) {
    return this.states.get(userId) || null;
  }

  /**
   * Update state data
   */
  updateStateData(userId, updates) {
    const current = this.states.get(userId);
    if (current) {
      current.data = {
        ...current.data,
        ...updates
      };
      current.timestamp = Date.now();
    }
  }

  /**
   * Clear state for user
   */
  clearState(userId) {
    this.clearTimeout(userId);
    this.states.delete(userId);
    logger.debug('State cleared', { userId });
  }

  /**
   * Clear timeout for user
   */
  clearTimeout(userId) {
    const timeout = this.timeouts.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(userId);
    }
  }

  /**
   * Check if user has active state
   */
  hasState(userId) {
    return this.states.has(userId);
  }

  /**
   * Check if user is in specific state
   */
  isInState(userId, stateName) {
    const state = this.states.get(userId);
    return state?.state === stateName;
  }

  /**
   * Get all active states (for debugging)
   */
  getAllStates() {
    return Array.from(this.states.entries()).map(([userId, state]) => ({
      userId,
      state: state.state,
      age: Date.now() - state.timestamp
    }));
  }

  /**
   * Clean up expired states
   */
  cleanup() {
    const now = Date.now();
    const expired = [];
    
    for (const [userId, state] of this.states.entries()) {
      if (now - state.timestamp > this.stateTimeout) {
        expired.push(userId);
      }
    }
    
    expired.forEach(userId => this.clearState(userId));
    
    if (expired.length > 0) {
      logger.info('Cleaned up expired states', { count: expired.length });
    }
  }
}

// Export singleton instance
const stateManager = new StateManager();

// Run cleanup every 10 minutes
setInterval(() => {
  stateManager.cleanup();
}, 10 * 60 * 1000);

export default stateManager;
