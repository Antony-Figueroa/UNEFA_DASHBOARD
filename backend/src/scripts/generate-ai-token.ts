import { generateToken } from '../utils/auth.utils.js';
import { AI_ROLE } from '../middlewares/ai-auth.middleware.js';

const generateAIToken = () => {
  const payload = {
    userId: 'ai-system-agent',
    role: AI_ROLE // 99
  };

  // Generate a token valid for 365 days
  const token = generateToken(payload, '365d');
  
  console.log('\n=== AI AGENT TOKEN GENERATED ===');
  console.log('Role: AI_AGENT (99)');
  console.log('Expires: 365 days');
  console.log('\nToken:');
  console.log(token);
  console.log('\nUse this token in the Authorization header: Bearer <token>');
  console.log('================================\n');
};

generateAIToken();
