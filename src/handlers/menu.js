const TelegramBot = require('node-telegram-bot-api');

function getMainMenuKeyboard() {
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
}

function getPnLKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Today', callback_data: 'pnl_today' },
          { text: 'This Week', callback_data: 'pnl_week' },
          { text: 'This Month', callback_data: 'pnl_month' },
        ],
        [
          { text: 'All Time', callback_data: 'pnl_all' },
        ],
        [
          { text: '⬅️ Back', callback_data: 'main_menu' },
        ],
      ],
    },
  };
}

function getManualTradeMenuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📌 Pending Order', callback_data: 'manual_pending' },
          { text: '⚡ Market Order', callback_data: 'manual_market' },
        ],
        [
          { text: '⬅️ Back', callback_data: 'main_menu' },
        ],
      ],
    },
  };
}

function getTradeTypeKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🟢 LONG', callback_data: 'trade_long' },
          { text: '🔴 SHORT', callback_data: 'trade_short' },
        ],
        [
          { text: '⬅️ Back', callback_data: 'manual_trade_menu' },
        ],
      ],
    },
  };
}

function getBackKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '⬅️ Back', callback_data: 'main_menu' },
        ],
      ],
    },
  };
}

async function showMainMenu(bot, chatId) {
  const message = `
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
  `.trim();

  return await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    ...getMainMenuKeyboard(),
  });
}

async function showPnLMenu(bot, chatId) {
  const message = `
💰 *P&L Overview*

Select time period:

*Options:*
• Today - P&L for today
• This Week - P&L for last 7 days
• This Month - P&L for last 30 days
• All Time - Total P&L
  `.trim();

  return await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    ...getPnLKeyboard(),
  });
}

async function showManualTradeMenu(bot, chatId) {
  const message = `
📝 *Manual Trade*

Select order type:

*Order Types:*
• 📌 Pending Order - Limit order at specific price
• ⚡ Market Order - Execute immediately at market price
  `.trim();

  return await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    ...getManualTradeMenuKeyboard(),
  });
}

module.exports = {
  getMainMenuKeyboard,
  getPnLKeyboard,
  getManualTradeMenuKeyboard,
  getTradeTypeKeyboard,
  getBackKeyboard,
  showMainMenu,
  showPnLMenu,
  showManualTradeMenu,
};
