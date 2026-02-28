import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { interpretMessage } from './services/ai.js';
import { executeCommand, readFile } from './services/tools.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID;

if (!BOT_TOKEN || !OWNER_ID) {
  console.error('❌ Error: Missing required environment variables.');
  console.error('Please ensure BOT_TOKEN and OWNER_ID are set in .env file.');
  process.exit(1);
}

// Initialize Telegram bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Convert OWNER_ID to number for comparison
const authorizedUserId = parseInt(OWNER_ID, 10);

if (isNaN(authorizedUserId)) {
  console.error('❌ Error: OWNER_ID must be a valid number.');
  process.exit(1);
}

console.log('✅ Bot initialized successfully');
console.log(`✅ Authorized user ID: ${authorizedUserId}`);

/**
 * Checks if user is authorized
 * @param {number} userId - Telegram user ID
 * @returns {boolean} True if authorized
 */
function isAuthorized(userId) {
  return userId === authorizedUserId;
}

// Handle incoming messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const messageText = msg.text;

  // Check authorization
  if (!isAuthorized(userId)) {
    console.log(`⚠️  Unauthorized access attempt from user ID: ${userId}`);
    await bot.sendMessage(
      chatId,
      '❌ Access denied. You are not authorized to use this bot.'
    );
    return;
  }

  // Ignore non-text messages
  if (!messageText) {
    await bot.sendMessage(chatId, 'Please send a text message.');
    return;
  }

  console.log(`📨 Received message from authorized user: ${messageText}`);

  try {
    // Show typing indicator
    await bot.sendChatAction(chatId, 'typing');

    // Interpret message using AI
    const action = await interpretMessage(messageText);

    let response = '';

    // Execute action based on AI decision
    switch (action.action) {
      case 'execute_command':
        console.log(`🔧 Executing command: ${action.input}`);
        response = await executeCommand(action.input);
        break;

      case 'read_file':
        console.log(`📄 Reading file: ${action.input}`);
        response = await readFile(action.input);
        break;

      case 'none':
      default:
        console.log(`💬 Normal response`);
        response = action.input;
        break;
    }

    // Send response (Telegram has a 4096 character limit per message)
    if (response.length > 4096) {
      // Split into chunks
      const chunks = [];
      for (let i = 0; i < response.length; i += 4096) {
        chunks.push(response.substring(i, i + 4096));
      }
      for (const chunk of chunks) {
        await bot.sendMessage(chatId, chunk);
      }
    } else {
      await bot.sendMessage(chatId, response);
    }
  } catch (error) {
    console.error('❌ Error processing message:', error);
    await bot.sendMessage(
      chatId,
      '❌ An error occurred while processing your request. Please try again.'
    );
  }
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

console.log('🚀 Personal AI Agent is running...');
