const fs = require('fs');
const dump = fs.readFileSync('DB-postgres.sql', 'utf8');
const match = dump.match(/CREATE TABLE "t_institution"[\s\S]*?\);/i);
if (match) {
  console.log(match[0]);
} else {
  console.log('Table t_institution not found');
}
