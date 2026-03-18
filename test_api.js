const http = require('http');

const data = JSON.stringify({
  identificationPrefix: 'V',
  identificationNumber: '12123123',
  firstName: 'TEST',
  middleName: '',
  lastName: 'TEST',
  secondLastName: '',
  phone: '04121231234',
  email: 'test@admin.com',
  cargo: 'TEST',
  institutionId: '1',
  status: true
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/institutional-responsibles',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body);
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e);
});

req.write(data);
req.end();
