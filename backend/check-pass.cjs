const bcrypt = require('bcryptjs');
const hash = '$2b$10$FwPfuoFovP9hqFJiaVBHMOGedhHlIo6ZvCQVYgm8pybR0G4CLLhB6';
bcrypt.compare('Admin123!', hash).then(m => console.log('Password match:', m));
