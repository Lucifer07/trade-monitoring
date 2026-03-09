const fs = require('fs');

const closePath = './src/handlers/close.js';

// Fix the duration calculation
let content = fs.readFileSync(closePath, 'utf8');

// Fix: replace duration calculation with correct syntax
content = content.replace(
  'const duration = Math.floor((new Date() - new Date(trade.entry_time)) / (1000 / 60);',
  'const duration = Math.floor((new Date() - new Date(trade.entry_time)) / 1000 / 60);'
);

// Write back
fs.writeFileSync(closePath, content, 'utf8');
console.log('✅ Fixed close.js duration calculation');

// Verify syntax
require('child_process').exec('node -c ' + closePath, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Syntax error still exists:');
    console.error(stderr);
    process.exit(1);
  } else {
    console.log('✅ Syntax check passed!');
  }
});
