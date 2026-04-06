/**
 * Vercel Serverless Entry Point
 * 
 * This file exports the Express app as a Vercel-compatible handler.
 * Vercel auto-detects Express and wraps it in a serverless function.
 * 
 * IMPORTANT: 
 * - No HTTP server is created (Vercel handles this)
 * - SSE is disabled (not compatible with serverless)
 * - Scheduler is disabled (use Vercel Cron Jobs instead)
 */

import app from '../app.js';

// Export the Express app as default — Vercel auto-detects and wraps it
export default app;
