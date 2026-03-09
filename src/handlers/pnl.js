const { getDatabase } = require('../services/database');
const { getBinance } = require('../services/binance');

async function handleGetPnL(bot, chatId, timeRange = 'all') {
  try {
    // Get PnL from database
    const db = getDatabase();
    const pnlData = await db.getTotalPnL(timeRange);

    // Get account info from Binance
    const binance = getBinance();
    const accountInfo = await binance.getAccountInfo();

    // Format time range label
    const timeRangeLabel = {
      'today': 'Today',
      'week': 'This Week',
      'month': 'This Month',
      'all': 'All Time',
    }[timeRange] || 'All Time';

    // Calculate win rate
    const totalTrades = parseInt(pnlData.total_trades) || 0;
    const winningTrades = parseInt(pnlData.winning_trades) || 0;
    const losingTrades = parseInt(pnlData.losing_trades) || 0;
    const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(2) : '0.00';

    const totalPnL = parseFloat(pnlData.total_pnl) || 0;
    const totalProfit = parseFloat(pnlData.total_profit) || 0;
    const totalLoss = parseFloat(pnlData.total_loss) || 0;

    // Create message
    let message = `
💰 *P&L Report - ${timeRangeLabel}*

━━━━━━━━━━━━━━━━━━━━

*📊 Account Status:*
• Balance: ${accountInfo.totalBalance.toFixed(2)} USDT
• Available: ${accountInfo.availableBalance.toFixed(2)} USDT
• Unrealized P&L: ${accountInfo.unrealizedPnL >= 0 ? '+' : ''}${accountInfo.unrealizedPnL.toFixed(2)} USDT

━━━━━━━━━━━━━━━━━━━━

*📈 Trading Stats (${timeRangeLabel}):*
• Total Trades: ${totalTrades}
• Winning Trades: ${winningTrades}
• Losing Trades: ${losingTrades}
• Win Rate: ${winRate}%

━━━━━━━━━━━━━━━━━━━━

*💵 P&L Summary:*
• Total P&L: ${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} USDT
• Total Profit: +${totalProfit.toFixed(2)} USDT
• Total Loss: ${totalLoss.toFixed(2)} USDT
${pnlData.avg_pnl ? `• Avg P&L per Trade: ${parseFloat(pnlData.avg_pnl) >= 0 ? '+' : ''}${parseFloat(pnlData.avg_pnl).toFixed(2)} USDT` : ''}
    `.trim();

    // Add P&L emoji based on value
    if (totalPnL > 0) {
      message = '🟢 ' + message;
    } else if (totalPnL < 0) {
      message = '🔴 ' + message;
    } else {
      message = '⚪ ' + message;
    }

    return await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling Get PnL:', error);
    return await bot.sendMessage(chatId, `❌ Error fetching P&L: ${error.message}`);
  }
}

async function handleGetActiveTrades(bot, chatId) {
  try {
    const db = getDatabase();
    const binance = getBinance();

    // Get active trades from database
    const activeTrades = await db.getActiveTrades();

    // Get open positions from Binance
    const openPositions = await binance.getOpenPositions();

    let message = `📊 *Active Trades*\n\n`;

    if (activeTrades.length === 0 && openPositions.length === 0) {
      message += 'No active trades or positions.\n\n';
    } else {
      // Show database trades
      if (activeTrades.length > 0) {
        message += '*📋 Database Trades:*\n\n';
        for (const trade of activeTrades) {
          const sideEmoji = trade.side === 'LONG' ? '🟢' : '🔴';
          const entryPrice = parseFloat(trade.entry_price).toFixed(2);
          const stopLoss = parseFloat(trade.stop_loss).toFixed(2);
          const takeProfit = trade.take_profit ? parseFloat(trade.take_profit).toFixed(2) : 'N/A';

          message += `
${sideEmoji} *${trade.symbol}* - ${trade.side}
• Entry: ${entryPrice}
• Stop Loss: ${stopLoss}
• Take Profit: ${takeProfit}
• Qty: ${trade.quantity}
• Risk: ${trade.risk_percent}%
• Entry Time: ${new Date(trade.entry_time).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━
          `;
        }
      }

      // Show Binance positions
      if (openPositions.length > 0) {
        message += '\n*💱 Binance Positions:*\n\n';
        for (const pos of openPositions) {
          const sideEmoji = pos.side === 'LONG' ? '🟢' : '🔴';
          const pnlEmoji = pos.unrealizedPnL >= 0 ? '✅' : '❌';
          const markPrice = pos.markPrice.toFixed(2);
          const entryPrice = pos.entryPrice.toFixed(2);

          message += `
${sideEmoji} *${pos.symbol}* - ${pos.side}
• Entry: ${entryPrice}
• Mark: ${markPrice}
• Position: ${pos.positionAmt}
• Leverage: ${pos.leverage}x
• ${pnlEmoji} Unrealized P&L: ${pos.unrealizedPnL >= 0 ? '+' : ''}${pos.unrealizedPnL.toFixed(2)} USDT (${pos.percentage.toFixed(2)}%)
━━━━━━━━━━━━━━━━━━━━
          `;
        }
      }
    }

    message += '\n*Powered by Sebas Butler* 🤵';

    return await bot.sendMessage(chatId, message.trim(), { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling Get Active Trades:', error);
    return await bot.sendMessage(chatId, `❌ Error fetching active trades: ${error.message}`);
  }
}

module.exports = {
  handleGetPnL,
  handleGetActiveTrades,
};
