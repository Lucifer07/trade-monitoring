const Binance = require('binance-api-node').default;
const { config } = require('../config');

class BinanceService {
  constructor() {
    this.client = Binance({
      apiKey: config.binance.apiKey,
      apiSecret: config.binance.secretKey,
      httpFutures: config.binance.baseUrl,
      wsFutures: config.binance.baseUrl.replace('https://wss', 'wss').replace('https://', 'wss://'),
    });
  }

  async testConnection() {
    try {
      // Test public endpoint
      await this.client.ping();
      console.log('✅ Binance API connected (public)');
      
      // Test authenticated endpoint
      const account = await this.client.futuresAccountInfo();
      console.log('✅ Binance API connected (authenticated)');
      
      return true;
    } catch (error) {
      console.error('Binance API connection failed:', error.message);
      throw error;
    }
  }

  async getAccountInfo() {
    try {
      const account = await this.client.futuresAccountInfo();
      return {
        totalBalance: parseFloat(account.totalWalletBalance || 0),
        availableBalance: parseFloat(account.availableBalance || 0),
        unrealizedPnL: parseFloat(account.totalUnrealizedProfit || 0),
        openPositions: 0, // Will get from positions
      };
    } catch (error) {
      console.error('Error getting account info:', error.message);
      throw error;
    }
  }

  async getOpenPositions() {
    try {
      const positions = await this.client.futuresPositionRisk();
      return positions
        .filter(p => parseFloat(p.positionAmt) !== 0)
        .map(p => ({
          symbol: p.symbol,
          side: parseFloat(p.positionAmt) > 0 ? 'LONG' : 'SHORT',
          positionAmt: parseFloat(p.positionAmt),
          entryPrice: parseFloat(p.entryPrice),
          markPrice: parseFloat(p.markPrice),
          unrealizedPnL: parseFloat(p.unRealizedProfit),
          percentage: parseFloat(p.percentage),
          leverage: parseFloat(p.leverage),
        }));
    } catch (error) {
      console.error('Error getting open positions:', error.message);
      throw error;
    }
  }

  async placeMarketOrder(symbol, side, quantity) {
    try {
      const order = await this.client.futuresOrder({
        symbol,
        side,
        type: 'MARKET',
        quantity,
      });
      return {
        orderId: order.orderId,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: parseFloat(order.origQty),
        status: order.status,
        price: parseFloat(order.avgPrice || 0),
        executedQty: parseFloat(order.executedQty),
      };
    } catch (error) {
      console.error('Error placing market order:', error.message);
      throw error;
    }
  }

  async placeLimitOrder(symbol, side, quantity, price) {
    try {
      const order = await this.client.futuresOrder({
        symbol,
        side,
        type: 'LIMIT',
        quantity,
        price: price.toFixed(8),
        timeInForce: 'GTC',
      });
      return {
        orderId: order.orderId,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: parseFloat(order.origQty),
        price: parseFloat(order.price),
        status: order.status,
        executedQty: parseFloat(order.executedQty),
      };
    } catch (error) {
      console.error('Error placing limit order:', error.message);
      throw error;
    }
  }

  async cancelOrder(symbol, orderId) {
    try {
      const order = await this.client.futuresCancelOrder({
        symbol,
        orderId,
      });
      return {
        orderId: order.orderId,
        symbol: order.symbol,
        status: order.status,
      };
    } catch (error) {
      console.error('Error canceling order:', error.message);
      throw error;
    }
  }

  async getOpenOrders(symbol = null) {
    try {
      const orders = await this.client.futuresOpenOrders({ symbol });
      return orders.map(o => ({
        orderId: o.orderId,
        symbol: o.symbol,
        side: o.side,
        type: o.type,
        quantity: parseFloat(o.origQty),
        price: parseFloat(o.price),
        filledQuantity: parseFloat(o.executedQty),
        status: o.status,
        time: o.time,
      }));
    } catch (error) {
      console.error('Error getting open orders:', error.message);
      throw error;
    }
  }

  async getCurrentPrice(symbol) {
    try {
      const ticker = await this.client.prices({ symbol });
      return parseFloat(ticker[symbol]);
    } catch (error) {
      console.error('Error getting current price:', error.message);
      throw error;
    }
  }

  async close() {
    // Binance client doesn't have explicit close method
    console.log('Binance service closed');
  }
}

let binanceInstance = null;

function getBinance() {
  if (!binanceInstance) {
    binanceInstance = new BinanceService();
  }
  return binanceInstance;
}

module.exports = { BinanceService, getBinance };
