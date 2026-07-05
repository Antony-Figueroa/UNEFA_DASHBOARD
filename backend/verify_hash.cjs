const bcrypt = require('bcryptjs');
const hash = '$2b$10$EEdx7N9jYvMYe7CIZWjR6OnJdPJ8ZPQx1MNmEejnpo6BeWY1s460e';
console.log('Verify Admin123:', bcrypt.compareSync('Admin123', hash));
const newHash = bcrypt.hashSync('Admin123', 10);
console.log('New hash:', newHash);
console.log('Verify new:', bcrypt.compareSync('Admin123', newHash));
