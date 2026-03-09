const fs = require('fs');
const path = require('path');

const indexPath = './src/index.js';

// Read current file
let content = fs.readFileSync(indexPath, 'utf8');

// 1. Add /close command after /market command
const marketCommandRegex = /(\/\/ Handle \/market command\nbot\.onText\(\/market\\s\+\.+\), async \(msg, match\) => \{\n  const chatId = msg\.chat\.id;\n  const args = match\[1\]\.trim\(\)\.split\(\/\\s\+\/\);\n  await tradeHandlers\.processMarketOrder\(bot, chatId, args\);\n\}\);/

const closeCommandHandler = `
// Handle /close command
bot.onText(/\/close/, async (msg) => {
  const chatId = msg.chat.id;
  await closeHandlers.handleGetActivePositions(bot, chatId);
});
`;

content = content.replace(marketCommandRegex, `$1\n${closeCommandHandler}`);

// 2. Add /close to menu commands
const setBotMenuRegex = /(await bot\.setMyCommands\(\s*\[\s*\{ command: 'start', description: '🚀 Start bot' \},\s*\{ command: 'menu', description: '📱 Show main menu' \},\s*\{ command: 'pnl', description: '💰 View profit\/loss' \},\s*\{ command: 'active', description: '📊 View active trades' \},\s*\{ command: 'pending', description: '📌 Place limit order' \},\s*\{ command: 'market', description: '⚡ Place market order' \},\s*\{ command: 'help', description: '❓ Show help' \}\s*\]\);)/

const menuWithClose = `
await bot.setMyCommands(
      [
        { command: 'start', description: '🚀 Start bot' },
        { command: 'menu', description: '📱 Show main menu' },
        { command: 'pnl', description: '💰 View profit/loss' },
        { command: 'active', description: '📊 View active trades' },
        { command: 'pending', description: '📌 Place limit order' },
        { command: 'market', description: '⚡ Place market order' },
        { command: 'close', description: '❌ Close position' },
        { command: 'help', description: '❓ Show help' },
      ]
    );
`;

content = content.replace(setBotMenuRegex, menuWithClose);

// 3. Update all commands array
const allCommandsRegex = /(const commands = \[\s*\{ command: 'start', description: '🚀 Start bot' \},\s*\{ command: 'menu', description: '📱 Show main menu' \},\s*\{ command: 'pnl', description: '💰 View profit\/loss' \},\s*\{ command: 'active', description: '📊 View active trades' \},\s*\{ command: 'pending', description: '📌 Place limit order' \},\s*\{ command: 'market', description: '⚡ Place market order' \},\s*\{ command: 'help', description: '❓ Show help' \}\s*\];)/

const commandsWithClose = `
const commands = [
    { command: 'start', description: '🚀 Start bot' },
    { command: 'menu', description: '📱 Show main menu' },
    { command: 'pnl', description: '💰 View profit/loss' },
    { command: 'active', description: '📊 View active trades' },
    { command: 'pending', description: '📌 Place limit order' },
    { command: 'market', description: '⚡ Place market order' },
    { command: 'close', description: '❌ Close position' },
    { command: 'help', description: '❓ Show help' },
  ];
`;

content = content.replace(allCommandsRegex, commandsWithClose);

// 4. Add close handlers to callback query switch
const callbackQueryRegex = /(      // Manual trade menu\n      case 'manual_trade_menu':\n        await menuHandlers\.showManualTradeMenu\(bot, chatId\);\n        break;\n      case 'manual_pending':\n        await tradeHandlers\.handleManualPendingOrder\(bot, chatId\);\n        break;\n      case 'manual_market':\n        await tradeHandlers\.handleManualMarketOrder\(bot, chatId\);\n        break;)/

const closeCallbackCases = `
      // Manual trade menu
      case 'manual_trade_menu':
        await menuHandlers.showManualTradeMenu(bot, chatId);
        break;
      case 'manual_pending':
        await tradeHandlers.handleManualPendingOrder(bot, chatId);
        break;
      case 'manual_market':
        await tradeHandlers.handleManualMarketOrder(bot, chatId);
        break;

      // Close position handlers
      case 'close_BTCUSDT':
      case 'close_ETHUSDT':
      case 'close_SOLUSDT':
      case 'close_BNBUSDT':
      case 'close_DOGEUSDT':
        await closeHandlers.handleClosePosition(bot, chatId, data);
        break;
      case 'refresh_positions':
        await closeHandlers.handleRefreshPositions(bot, chatId);
        break;
`;

content = content.replace(callbackQueryRegex, closeCallbackCases);

// Write updated file
fs.writeFileSync(indexPath, content, 'utf8');
console.log('✅ Successfully patched index.js with close position handlers');
console.log('   - Added /close command');
console.log('   - Added close button handlers');
console.log('   - Updated menu commands');
