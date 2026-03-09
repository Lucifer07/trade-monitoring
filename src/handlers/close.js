const { getDatabase } = require('../services/database');
const { getBinance } = require('../services/binance');
const { config } = require('../config');

/**
 * Handle /close command - Show active positions with close buttons
 */
async function handleGetActivePositions(bot, chatId) {
  try {
    // Get positions from Binance
    const binance = getBinance();
    const binancePositions = await binance.getOpenPositions();
    
    // Get active trades from database
    const db = getDatabase();
    const dbTrades = await db.getActiveTrades();
    
    if (binancePositions.length === 0) {
      await bot.sendMessage(chatId, `
📊 *Active Positions*

━━━━━━━━━━━━━━━━━━━━

⚪ No active positions found in Binance

*Powered by Sebas Butler* 🤵
      `.trim(), { parse_mode: 'Markdown' });
      return;
    }
    
    let message = `
📊 *Active Positions*

━━━━━━━━━━━━━━━━━━━━
`;
    
    const keyboard = {
      inline_keyboard: []
    };
    
    binancePositions.forEach((pos, index) => {
      const pnlPercent = parseFloat(pos.percentage);
      const pnl = parseFloat(pos.unrealizedPnL);
      const entry = parseFloat(pos.entryPrice);
      const current = parseFloat(pos.markPrice);
      
      const emoji = pnl >= 0 ? '🟢' : '🔴';
      const sign = pnl >= 0 ? '+' : '';
      
      message += `
${emoji} *${pos.symbol}* ${pos.side}

   Entry: $${entry.toFixed(2)}
   Mark: $${current.toFixed(2)}
   P/L: ${sign}$${pnl.toFixed(2)} (${sign}${pnlPercent.toFixed(2)}%)
   Size: ${pos.positionAmt}
   Leverage: ${pos.leverage}x

━━━━━━━━━━━━━━━━━━━━
`;
      
      // Add close button for each position
      keyboard.inline_keyboard.push([
        {
          text: `❌ Close ${pos.symbol}`,
          callback_data: `close_${pos.symbol}`
        }
      ]);
    });
    
    // Add refresh button
    keyboard.inline_keyboard.push([
      {
        text: '🔄 Refresh',
        callback_data: 'refresh_positions'
      }
    ]);
    
    message += `
*Total Active Positions:* ${binancePositions.length}
`;

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Error getting active positions:', error);
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

/**
 * Handle close position callback
 */
async function handleClosePosition(bot, chatId, data) {
  try {
    const [action, symbol] = data.split('_');
    
    if (action !== 'close') {
      return;
    }
    
    // Acknowledge callback
    await bot.answerCallbackQuery({
      callback_query_id: data.id,
      text: '🔄 Processing...',
      show_alert: true
    });
    
    const binance = getBinance();
    const positions = await binance.getOpenPositions();
    const position = positions.find(p => p.symbol === symbol);
    
    if (!position) {
      await bot.sendMessage(chatId, `⚠️ No active position found for ${symbol}`);
      return;
    }
    
    const currentPrice = parseFloat(position.markPrice);
    const positionAmt = parseFloat(position.positionAmt);
    const entryPrice = parseFloat(position.entryPrice);
    const unrealizedPnL = parseFloat(position.unrealizedPnL);
    
    // Calculate final P/L
    const pnl = position.side === 'LONG'
      ? (currentPrice - entryPrice) * Math.abs(positionAmt)
      : (entryPrice - currentPrice) * Math.abs(positionAmt);
    
    const emoji = pnl >= 0 ? '🟢' : '🔴';
    const sign = pnl >= 0 ? '+' : '';
    
    // Send confirmation
    await bot.sendMessage(chatId, `
🔒 *Closing Position: ${symbol}*

━━━━━━━━━━━━━━━━━━━━

${symbol} ${position.side}
Entry: $${entryPrice.toFixed(2)}
Exit: $${currentPrice.toFixed(2)}
${emoji} P/L: ${sign}$${pnl.toFixed(2)} (${sign}${unrealizedPnL.toFixed(2)}%)

━━━━━━━━━━━━━━━━━━━━
🔄 Processing close order...
    `.trim(), { parse_mode: 'Markdown' });
    
    // Close position
    const closeOrder = await binance.placeMarketOrder(
      symbol,
      position.side === 'LONG' ? 'SELL' : 'BUY',
      Math.abs(positionAmt)
    );
    
    // Update database trade
    const db = getDatabase();
    const activeTrades = await db.getActiveTrades();
    const trade = activeTrades.find(t => 
      t.symbol === symbol && 
      t.status === 'OPEN' &&
      t.side === position.side
    );
    
    if (trade) {
      const duration = Math.floor((new Date() - new Date(trade.entry_time)) / 1000 / 60);
      
      await db.query(`
        UPDATE trades
          SET status = 'CLOSED',
              exit_price = $1,
              profit_loss = $2,
              profit_loss_percent = $3,
              exit_time = NOW(),
              duration_seconds = $4,
              notes = $5
          WHERE trade_id = $6
        `, [
          currentPrice,
          pnl.toFixed(2),
          (unrealizedPnL / (entryPrice * Math.abs(positionAmt)) * 100).toFixed(2),
          duration * 60,
          'Manual close via Telegram',
          trade.trade_id
        ]);
    }
    
    // Send success message
    await bot.sendMessage(chatId, `
✅ *Position Closed Successfully!*

━━━━━━━━━━━━━━━━━━━━

📊 *${symbol}* ${position.side}

Entry: $${entryPrice.toFixed(2)}
Exit: $${currentPrice.toFixed(2)}
${emoji} Final P/L: ${sign}$${pnl.toFixed(2)}

Order ID: ${closeOrder.orderId}

━━━━━━━━━━━━━━━━━━━━

*Powered by Sebas Butler* 🤵
    `.trim(), { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error closing position:', error);
    await bot.sendMessage(chatId, `❌ Error closing position: ${error.message}`);
  }
}

/**
 * Handle refresh positions callback
 */
async function handleRefreshPositions(bot, chatId) {
  try {
    await bot.answerCallbackQuery({
      callback_query_id: query.id,
      text: '🔄 Refreshing...'
    });
    await handleGetActivePositions(bot, chatId);
  } catch (error) {
    console.error('Error refreshing positions:', error);
  }
}

module.exports = {
  handleGetActivePositions,
  handleClosePosition,
  handleRefreshPositions
};
