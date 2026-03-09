const fs = require('fs');

const indexPath = './src/index.js';

// Read current file
let content = fs.readFileSync(indexPath, 'utf8');

console.log('🔧 Adding close_position callback handler...\n');

// Find the manual trade menu section and add close handlers before Refresh
const manualTradeSection = `      // Manual trade menu
      case 'manual_trade_menu':
        await menuHandlers.showManualTradeMenu(bot, chatId);
        break;
      case 'manual_pending':
        await tradeHandlers.handleManualPendingOrder(bot, chatId);
        break;
      case 'manual_market':
        await tradeHandlers.handleManualMarketOrder(bot, chatId);
        break;

      // Refresh
      case 'refresh_menu':
        await bot.sendMessage(chatId, '🔄 Refreshing...', { ...menuHandlers.getMainMenuKeyboard() });
        await menuHandlers.showMainMenu(bot, chatId);
        break;`;

const closePositionSection = `      // Manual trade menu
      case 'manual_trade_menu':
        await menuHandlers.showManualTradeMenu(bot, chatId);
        break;
      case 'manual_pending':
        await tradeHandlers.handleManualPendingOrder(bot, chatId);
        break;
      case 'manual_market':
        await tradeHandlers.handleManualMarketOrder(bot, chatId);
        break;

      // Close position
      case 'close_position':
        await closeHandlers.handleGetActivePositions(bot, chatId);
        break;

      // Refresh
      case 'refresh_menu':
        await bot.sendMessage(chatId, '🔄 Refreshing...', { ...menuHandlers.getMainMenuKeyboard() });
        await menuHandlers.showMainMenu(bot, chatId);
        break;`;

content = content.replace(manualTradeSection, closePositionSection);
console.log('✅ Added close_position callback handler');

// Write back
fs.writeFileSync(indexPath, content, 'utf8');
console.log('\n✅ Successfully added close_position handler!');
console.log('   Restart bot: pm2 restart trading-monitor-bot');
