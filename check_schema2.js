const fs = require('fs');
let out = '';
try {
  const dump = fs.readFileSync('DB-postgres.sql', 'utf8');
  const match = dump.match(/CREATE TABLE [a-zA-Z0-9_"]+manager[\s\S]*?\);/i);
  out = match ? match[0] : 'Not Found manager';
} catch (e) {
  out = String(e);
}
fs.writeFileSync('out.txt', out);
