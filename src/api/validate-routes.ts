import express from 'express';
import { ValidateTokenSchema } from '../types/token';
import tokenValidator from '../token-service/token-validator';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/error-handler';

const router = express.Router();

/**
 * Validate a token
 * POST /api/validate
 */
router.post('/', async (req, res, next) => {
  try {
    // Validate request body
    const validationResult = ValidateTokenSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ApiError(400, 'Invalid request body');
    }
    
    // Validate token
    const result = await tokenValidator.validateToken(validationResult.data);
    
    // Return response
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Batch validate tokens
 * POST /api/validate/batch
 */
router.post('/batch', async (req, res, next) => {
  try {
    // Validate request body
    const BatchValidateSchema = {
      validations: [ValidateTokenSchema],
    };
    
    // Check if validations array exists and is an array
    if (!req.body.validations || !Array.isArray(req.body.validations)) {
      throw new ApiError(400, 'Invalid request body: validations must be an array');
    }
    
    const validations = req.body.validations;
    const results = [];
    
    // Process each validation request
    for (const validation of validations) {
      try {
        const validationResult = ValidateTokenSchema.safeParse(validation);
        if (!validationResult.success) {
          results.push({
            valid: false,
            action: 'reject',
            reason: 'invalid_request',
          });
          continue;
        }
        
        const result = await tokenValidator.validateToken(validationResult.data);
        results.push(result);
      } catch (error) {
        logger.error('Error in batch validation:', error);
        results.push({
          valid: false,
          action: 'reject',
          reason: 'validation_error',
        });
      }
    }
    
    // Return response
    res.json({
      results,
    });
  } catch (error) {
    next(error);
  }
});

export { router as validateRoutes };
