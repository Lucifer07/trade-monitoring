const fs = require('fs');
const path = require('path');

const indexPath = './src/index.js';

// Read current file
let content = fs.readFileSync(indexPath, 'utf8');

console.log('🔧 Patching index.js...\n');

// 1. Add /close command handler after /market command
const marketCommandSection = `
// Handle /close command
bot.onText(/\/close/, async (msg) => {
  const chatId = msg.chat.id;
  await closeHandlers.handleGetActivePositions(bot, chatId);
});
`;

// Find and insert after /market handler
const insertAfter = "// Handle /market command\nbot.onText(/\\/market\\s\\+(.+)/, async (msg, match) => {\n  const chatId = msg.chat.id;\n  const args = match[1].trim().split(/\\s+/);\n  await tradeHandlers.processMarketOrder(bot, chatId, args);\n});";

if (!content.includes('/close command')) {
  const idx = content.indexOf(insertAfter);
  if (idx !== -1) {
    const insertPos = idx + insertAfter.length;
    content = content.slice(0, insertPos) + marketCommandSection + content.slice(insertPos);
    console.log('✅ Added /close command handler');
  }
}

// 2. Update menu commands array to include /close
if (content.includes("command: 'help', description: '❓ Show help'")) {
  content = content.replace(
    "{ command: 'help', description: '❓ Show help' }",
    "{ command: 'help', description: '❓ Show help' },\n        { command: 'close', description: '❌ Close position' }"
  );
  console.log('✅ Updated menu commands');
}

if (content.includes("{ command: 'help', description: '❓ Show help' }")) {
  content = content.replace(
    "{ command: 'help', description: '❓ Show help' }",
    "{ command: 'help', description: '❓ Show help' },\n    { command: 'close', description: '❌ Close position' }"
  );
  console.log('✅ Updated all commands');
}

// 3. Add close handlers to callback query
if (!content.includes("closeHandlers.handleClosePosition")) {
  const refreshMenuCase = "      case 'refresh_menu':";
  const closeHandlersSection = `
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

      // Refresh menu
      ${refreshMenuCase}`;
  
  content = content.replace(
    `      // Refresh\n      ${refreshMenuCase}`,
    closeHandlersSection
  );
  console.log('✅ Added close position handlers');
}

// Write updated file
fs.writeFileSync(indexPath, content, 'utf8');
console.log('\n✅ Patch applied successfully!');
console.log('   Restart bot with: pm2 restart trading-monitor-bot');
