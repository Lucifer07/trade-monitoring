const { Pool } = require('pg');
const { config } = require('../config');

class Database {
  constructor() {
    this.pool = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async query(text, params) {
    const start = Date.now();
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  }

  async getClient() {
    return this.pool.connect();
  }

  async getActiveTrades() {
    const query = `
      SELECT 
        id,
        trade_id,
        symbol,
        side,
        entry_price,
        stop_loss,
        take_profit,
        quantity,
        risk_amount,
        risk_percent,
        status,
        entry_time,
        profit_loss,
        profit_loss_percent,
        strategy
      FROM trades
      WHERE status = 'OPEN'
      ORDER BY entry_time DESC;
    `;
    const res = await this.query(query);
    return res.rows;
  }

  async getTradeByTradeId(tradeId) {
    const query = `
      SELECT * FROM trades
      WHERE trade_id = $1;
    `;
    const res = await this.query(query, [tradeId]);
    return res.rows[0];
  }

  async getRecentTrades(limit = 10) {
    const query = `
      SELECT 
        id,
        trade_id,
        symbol,
        side,
        entry_price,
        exit_price,
        quantity,
        profit_loss,
        profit_loss_percent,
        status,
        entry_time,
        exit_time,
        duration_seconds
      FROM trades
      ORDER BY entry_time DESC
      LIMIT $1;
    `;
    const res = await this.query(query, [limit]);
    return res.rows;
  }

  async getTotalPnL(timeRange = 'all') {
    let query = `
      SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN profit_loss < 0 THEN 1 ELSE 0 END) as losing_trades,
        SUM(profit_loss) as total_pnl,
        AVG(profit_loss) as avg_pnl,
        SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as total_profit,
        SUM(CASE WHEN profit_loss < 0 THEN profit_loss ELSE 0 END) as total_loss
      FROM trades
      WHERE status = 'CLOSED'
    `;

    let params = [];
    
    if (timeRange === 'today') {
      query += ` AND DATE(entry_time) = CURRENT_DATE`;
    } else if (timeRange === 'week') {
      query += ` AND entry_time >= NOW() - INTERVAL '7 days'`;
    } else if (timeRange === 'month') {
      query += ` AND entry_time >= NOW() - INTERVAL '30 days'`;
    }

    const res = await this.query(query, params);
    return res.rows[0];
  }

  async insertTrade(tradeData) {
    const query = `
      INSERT INTO trades (
        trade_id, symbol, side, entry_price, stop_loss, take_profit,
        quantity, risk_amount, risk_percent, status, strategy
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const values = [
      tradeData.trade_id,
      tradeData.symbol,
      tradeData.side,
      tradeData.entry_price,
      tradeData.stop_loss,
      tradeData.take_profit,
      tradeData.quantity,
      tradeData.risk_amount,
      tradeData.risk_percent,
      tradeData.status || 'OPEN',
      tradeData.strategy,
    ];
    const res = await this.query(query, values);
    return res.rows[0];
  }

  async close() {
    await this.pool.end();
  }
}

let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
}

module.exports = { Database, getDatabase };
