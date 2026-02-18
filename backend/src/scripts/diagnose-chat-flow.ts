import axios from 'axios';
import { generateToken } from '../utils/auth.utils.js';
import { ROLES } from '../middlewares/auth.middleware.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from backend root (where we are running)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// We assume we run this from backend root, so .env is in current dir or ../../backend/.env
// But since this file is in src/scripts, backend root is ../..
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');


const PORT = process.env.PORT || 3000;
const API_URL = `http://localhost:${PORT}/api/ai/chat`;

async function diagnoseChat() {
  console.log('--- Starting Chat Diagnosis ---');
  console.log(`Target URL: ${API_URL}`);

  // 0. Check Server Health
  console.log('Checking server connectivity...');
  try {
      // Try root or a known public endpoint if any. If not, just check if port connects.
      // We'll use a short timeout.
      await axios.get(`http://localhost:${PORT}/`, { timeout: 2000, validateStatus: () => true });
      console.log('Server is reachable.');
  } catch (e: any) {
      console.error('Server unreachable:', e.message);
      return;
  }

  // 1. Generate Token
  // Mock user payload (simulating an admin user)
  const userPayload = {
    userId: 1,
    userCi: '12345678',
    role: ROLES.ADMIN
  };
  
  const token = generateToken(userPayload);
  console.log('Token generated successfully.');

  // 2. Prepare Request
  const messages = [
    { role: 'user', content: 'Hola, ¿estás funcionando? Responde con una sola frase.' }
  ];

  console.log(`Sending POST request...`);
  
  try {
    const response = await axios.post(API_URL, { messages }, {
      headers: {
        'Cookie': `auth_token=${token}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream', // vital for SSE
      validateStatus: () => true // accept any status to debug
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('--- Stream Started ---');
      response.data.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        // Print only data lines to keep it clean, or everything
        console.log('Chunk received:', text.trim());
      });
      
      response.data.on('end', () => {
        console.log('--- Stream Ended ---');
      });
    } else {
        // If not 200, try to read the body
        let data = '';
        response.data.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        response.data.on('end', () => {
            console.error('Error Body:', data);
        });
    }

  } catch (error: any) {
    console.error('Request Failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
        console.error('Connection refused. Is the backend server running on port ' + PORT + '?');
    }
    if (error.response) {
       console.error('Status:', error.response.status);
    }
  }
}

diagnoseChat();
