import { Request, Response } from 'express';
import { aiService, AIQuerySchema } from '../services/ai.service.js';
import { z } from 'zod';
import { AIAuthRequest } from '../middlewares/ai-auth.middleware.js';

export const executeAIQuery = async (req: AIAuthRequest, res: Response) => {
  try {
    // Validate request body
    const query = AIQuerySchema.parse(req.body);
    
    // Get requester ID from middleware
    const requesterId = req.aiAgent?.id || 'unknown';

    // Execute query
    const result = await aiService.executeQuery(query, requesterId);

    res.json({
      success: true,
      data: result.data,
      meta: result.meta
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query format',
        errors: error.flatten().fieldErrors
      });
    }

    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Unknown error occurred'
    });
  }
};
