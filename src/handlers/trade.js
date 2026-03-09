const { getDatabase } = require('../services/database');
const { getBinance } = require('../services/binance');

// Store pending trade data
const pendingTrades = new Map();

async function handleManualPendingOrder(bot, chatId) {
  try {
    const message = `
📌 *Pending Order Setup*

Please provide the following information in this format:

\`/pending SYMBOL SIDE QUANTITY PRICE\`

Example:
\`/pending BTCUSDT LONG 0.001 65000\`

*Parameters:*
• SYMBOL - Trading pair (e.g., BTCUSDT, ETHUSDT)
• SIDE - LONG or SHORT
• QUANTITY - Amount to trade
• PRICE - Order price

━━━━━━━━━━━━━━━━━━━━

*Powered by Sebas Butler* 🤵
    `.trim();

    return await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling Manual Pending Order:', error);
    return await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

async function handleManualMarketOrder(bot, chatId) {
  try {
    const message = `
⚡ *Market Order Setup*

Please provide the following information in this format:

\`/market SYMBOL SIDE QUANTITY\`

Example:
\`/market BTCUSDT LONG 0.001\`

*Parameters:*
• SYMBOL - Trading pair (e.g., BTCUSDT, ETHUSDT)
• SIDE - LONG or SHORT
• QUANTITY - Amount to trade

━━━━━━━━━━━━━━━━━━━━

⚠️ *Warning:* Market orders execute immediately at the current market price!

*Powered by Sebas Butler* 🤵
    `.trim();

    return await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling Manual Market Order:', error);
    return await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

async function processPendingOrder(bot, chatId, args) {
  try {
    // Validate input
    if (args.length < 4) {
      return await bot.sendMessage(chatId, 
        '❌ Invalid format. Usage: `/pending SYMBOL SIDE QUANTITY PRICE`\n\nExample: `/pending BTCUSDT LONG 0.001 65000`', 
        { parse_mode: 'Markdown' }
      );
    }

    const [symbol, side, quantity, price] = args;
    const normalizedSide = side.toUpperCase();

    // Validate side
    if (!['LONG', 'SHORT'].includes(normalizedSide)) {
      return await bot.sendMessage(chatId, 
        '❌ Invalid side. Must be LONG or SHORT.', 
        { parse_mode: 'Markdown' }
      );
    }

    // Validate numeric values
    const qty = parseFloat(quantity);
    const prc = parseFloat(price);

    if (isNaN(qty) || qty <= 0) {
      return await bot.sendMessage(chatId, 
        '❌ Invalid quantity. Must be a positive number.', 
        { parse_mode: 'Markdown' }
      );
    }

    if (isNaN(prc) || prc <= 0) {
      return await bot.sendMessage(chatId, 
        '❌ Invalid price. Must be a positive number.', 
        { parse_mode: 'Markdown' }
      );
    }

    // Convert side to Binance format
    const binanceSide = normalizedSide === 'LONG' ? 'BUY' : 'SELL';

    // Place limit order on Binance
    const binance = getBinance();
    const order = await binance.placeLimitOrder(symbol, binanceSide, qty, prc);

    // Store in database
    const db = getDatabase();
    const tradeId = order.orderId.toString();
    
    await db.insertTrade({
      trade_id: tradeId,
      symbol: symbol,
      side: normalizedSide,
      entry_price: prc,
      stop_loss: 0, // TODO: Calculate stop loss
      take_profit: 0, // TODO: Calculate take profit
      quantity: qty,
      risk_amount: 0, // TODO: Calculate risk
      risk_percent: 0,
      status: 'OPEN',
      strategy: 'MANUAL_PENDING',
    });

    const sideEmoji = normalizedSide === 'LONG' ? '🟢' : '🔴';
    const message = `
✅ *Pending Order Placed!*

━━━━━━━━━━━━━━━━━━━━

${sideEmoji} *${symbol}* - ${normalizedSide}

*Order Details:*
• Order ID: ${order.orderId}
• Type: LIMIT
• Side: ${binanceSide}
• Quantity: ${order.quantity}
• Price: ${order.price.toFixed(8)}
• Status: ${order.status}

━━━━━━━━━━━━━━━━━━━━

*Trade saved to database with ID: ${tradeId}*

*Powered by Sebas Butler* 🤵
    `.trim();

    return await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error processing pending order:', error);
    return await bot.sendMessage(chatId, `❌ Error placing order: ${error.message}`);
  }
}

async function processMarketOrder(bot, chatId, args) {
  try {
    // Validate input
    if (args.length < 3) {
      return await bot.sendMessage(chatId, 
        '❌ Invalid format. Usage: `/market SYMBOL SIDE QUANTITY`\n\nExample: `/market BTCUSDT LONG 0.001`', 
        { parse_mode: 'Markdown' }
      );
    }

    const [symbol, side, quantity] = args;
    const normalizedSide = side.toUpperCase();

    // Validate side
    if (!['LONG', 'SHORT'].includes(normalizedSide)) {
      return await bot.sendMessage(chatId, 
        '❌ Invalid side. Must be LONG or SHORT.', 
        { parse_mode: 'Markdown' }
      );
    }

    // Validate numeric values
    const qty = parseFloat(quantity);

    if (isNaN(qty) || qty <= 0) {
      return await bot.sendMessage(chatId, 
        '❌ Invalid quantity. Must be a positive number.', 
        { parse_mode: 'Markdown' }
      );
    }

    // Convert side to Binance format
    const binanceSide = normalizedSide === 'LONG' ? 'BUY' : 'SELL';

    // Place market order on Binance
    const binance = getBinance();
    const order = await binance.placeMarketOrder(symbol, binanceSide, qty);

    // Get current price
    const currentPrice = await binance.getCurrentPrice(symbol);

    // Store in database
    const db = getDatabase();
    const tradeId = order.orderId.toString();
    
    await db.insertTrade({
      trade_id: tradeId,
      symbol: symbol,
      side: normalizedSide,
      entry_price: order.price || currentPrice,
      stop_loss: 0, // TODO: Calculate stop loss
      take_profit: 0, // TODO: Calculate take profit
      quantity: order.executedQty,
      risk_amount: 0, // TODO: Calculate risk
      risk_percent: 0,
      status: 'OPEN',
      strategy: 'MANUAL_MARKET',
    });

    const sideEmoji = normalizedSide === 'LONG' ? '🟢' : '🔴';
    const message = `
✅ *Market Order Executed!*

━━━━━━━━━━━━━━━━━━━━

${sideEmoji} *${symbol}* - ${normalizedSide}

*Order Details:*
• Order ID: ${order.orderId}
• Type: MARKET
• Side: ${binanceSide}
• Quantity: ${order.quantity}
• Execution Price: ${order.price.toFixed(8)}
• Status: ${order.status}
• Filled: ${order.executedQty}

━━━━━━━━━━━━━━━━━━━━

*Trade saved to database with ID: ${tradeId}*

*Powered by Sebas Butler* 🤵
    `.trim();

    return await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error processing market order:', error);
    return await bot.sendMessage(chatId, `❌ Error placing order: ${error.message}`);
  }
}

module.exports = {
  handleManualPendingOrder,
  handleManualMarketOrder,
  processPendingOrder,
  processMarketOrder,
};
