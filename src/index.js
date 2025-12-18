import WingmanBot from './bot.js';
import { logger } from './utils/logger.js';

/**
 * Main entry point for Wingman Bot
 */
async function main() {
  try {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║                                              ║');
    console.log('║          🤖 WINGMAN BOT v2.0                ║');
    console.log('║          Starting up...                      ║');
    console.log('║                                              ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    const bot = new WingmanBot();
    await bot.start();

    // Handle process termination
    process.on('SIGINT', () => {
      logger.info('Shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Shutting down gracefully...');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Fatal error', error);
    console.error('\n❌ Failed to start bot:', error.message);
    console.error('\n💡 Please check your configuration and try again.\n');
    process.exit(1);
  }
}

// Start the bot
main();
