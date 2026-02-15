import { aiService, AIQuery } from '../services/ai.service.js';
import { cacheManager } from '../lib/cache-manager.js';

// Mock console.log to avoid clutter
const originalLog = console.log;
console.log = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].startsWith('[AI_AUDIT]')) {
    originalLog('\n[AUDIT LOG DETECTED]:', args[0]);
  } else {
    originalLog(...args);
  }
};

const runTests = async () => {
  console.log('Running AI Service Tests...\n');

  // Test 1: Basic Query (Students)
  try {
    console.log('Test 1: Query Students (Basic)...');
    const query: any = {
      entity: 'students',
      select: ['STUDENTS_ID', 'NAME', 'SURNAME'],
      limit: 5
    };
    // Note: This will attempt to connect to real DB if credentials are in .env
    // If not connected, it might fail or hang. We assume env is set up.
    const result = await aiService.executeQuery(query, 'test-runner');
    console.log('Result:', result.data ? `Success (${result.data.length} records)` : 'No Data');
  } catch (error: any) {
    console.error('Test 1 Failed:', error.message);
  }

  // Test 2: Filtered Query (Active Students)
  try {
    console.log('\nTest 2: Query Students (Filtered)...');
    const query: any = {
      entity: 'students',
      select: ['STUDENTS_ID'],
      filters: { STATUS: 1 } // Assuming 'STATUS' column exists and 1 is active
    };
    const result = await aiService.executeQuery(query, 'test-runner');
    console.log('Result:', result.data ? `Success (${result.data.length} records)` : 'No Data');
  } catch (error: any) {
    console.error('Test 2 Failed:', error.message); 
  }

  // Test 3: Caching
  try {
    console.log('\nTest 3: Caching Check...');
    const query: any = {
      entity: 'careers',
      select: ['CAREER_ID', 'CAREER_NAME'],
      limit: 1
    };
    
    console.time('First Call');
    await aiService.executeQuery(query, 'test-runner');
    console.timeEnd('First Call');

    console.time('Second Call (Cached)');
    await aiService.executeQuery(query, 'test-runner');
    console.timeEnd('Second Call (Cached)');
  } catch (error: any) {
    console.error('Test 3 Failed:', error.message);
  }

  console.log('\nTests Completed.');
};

runTests().catch(console.error);
