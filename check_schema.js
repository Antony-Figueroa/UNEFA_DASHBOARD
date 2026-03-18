const fs = require('fs');
const dump = fs.readFileSync('DB-postgres.sql', 'utf8');
const match = dump.match(/CREATE TABLE [a-zA-Z0-9_"]+manager[\s\S]*?\);/i);
console.log(match ? match[0] : 'Not Found');
