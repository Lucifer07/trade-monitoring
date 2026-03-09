const fs = require('fs');

const menuPath = './src/handlers/menu.js';

// Read current file
let content = fs.readFileSync(menuPath, 'utf8');

console.log('🔧 Adding Close Position button to menu...\n');

// Update getMainMenuKeyboard to add Close Position button
const oldMainMenuKeyboard = `function getMainMenuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💰 Get P&L', callback_data: 'get_pnl' },
          { text: '📊 Active Trades', callback_data: 'get_active_trades' },
        ],
        [
          { text: '📝 Manual Trade', callback_data: 'manual_trade_menu' },
        ],
        [
          { text: '🔄 Refresh', callback_data: 'refresh_menu' },
        ],
      ],
    },
  };
}`;

const newMainMenuKeyboard = `function getMainMenuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💰 Get P&L', callback_data: 'get_pnl' },
          { text: '📊 Active Trades', callback_data: 'get_active_trades' },
        ],
        [
          { text: '📝 Manual Trade', callback_data: 'manual_trade_menu' },
        ],
        [
          { text: '❌ Close Position', callback_data: 'close_position' },
        ],
        [
          { text: '🔄 Refresh', callback_data: 'refresh_menu' },
        ],
      ],
    },
  };
}`;

content = content.replace(oldMainMenuKeyboard, newMainMenuKeyboard);
console.log('✅ Updated getMainMenuKeyboard()');

// Update showMainMenu message to include Close Position option
const oldMainMenuMessage = `async function showMainMenu(bot, chatId) {
  const message = \`
🤖 *Trading Monitor Bot*

Welcome, Tuan Muda Jayz! Select an option below:

*Quick Actions:*
• 💰 Get P&L - View profit/loss
• 📊 Active Trades - View open positions
• 📝 Manual Trade - Place manual orders

*Powered by Sebas Butler* 🤵
  \`.trim();

  return await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    ...getMainMenuKeyboard(),
  });
}`;

const newMainMenuMessage = `async function showMainMenu(bot, chatId) {
  const message = \`
🤖 *Trading Monitor Bot*

Welcome, Tuan Muda Jayz! Select an option below:

*Quick Actions:*
• 💰 Get P&L - View profit/loss
• 📊 Active Trades - View open positions
• 📝 Manual Trade - Place manual orders
• ❌ Close Position - View & close active positions

*Commands:*
• /close - View active positions with close buttons

*Powered by Sebas Butler* 🤵
  \`.trim();

  return await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    ...getMainMenuKeyboard(),
  });
}`;

content = content.replace(oldMainMenuMessage, newMainMenuMessage);
console.log('✅ Updated showMainMenu() message');

// Write back
fs.writeFileSync(menuPath, content, 'utf8');
console.log('\n✅ Successfully added Close Position button!');
console.log('   Restart bot: pm2 restart trading-monitor-bot');
