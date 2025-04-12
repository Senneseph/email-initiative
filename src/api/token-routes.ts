import express from 'express';
import { z } from 'zod';
import { CreateTokenSchema, ApproveTokenRequestSchema, DenyTokenRequestSchema } from '../types/token';
import tokenRepository from '../token-service/token-repository';
import { createTokenizedEmail } from '../email-parser/email-parser';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/error-handler';

const router = express.Router();

/**
 * Create a new token
 * POST /api/tokens
 */
router.post('/', async (req, res, next) => {
  try {
    // Validate request body
    const validationResult = CreateTokenSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ApiError(400, 'Invalid request body');
    }
    
    // Create token
    const token = await tokenRepository.createToken(validationResult.data);
    
    // Create tokenized email address
    const tokenizedAddress = createTokenizedEmail(token.token, token.recipient_email);
    
    // Return response
    res.status(201).json({
      token_id: token.id,
      token: token.token,
      tokenized_address: tokenizedAddress,
      status: token.status,
      created_at: token.created_at,
      expires_at: token.expires_at,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get a token by ID
 * GET /api/tokens/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get token
    const token = await tokenRepository.getTokenById(id);
    
    // If token not found
    if (!token) {
      throw new ApiError(404, 'Token not found');
    }
    
    // Create tokenized email address
    const tokenizedAddress = createTokenizedEmail(token.token, token.recipient_email);
    
    // Return response
    res.json({
      token_id: token.id,
      token: token.token,
      tokenized_address: tokenizedAddress,
      recipient_email: token.recipient_email,
      sender_email: token.data.senderEmail,
      sender_domains: token.data.senderDomains,
      status: token.status,
      created_at: token.created_at,
      updated_at: token.updated_at,
      expires_at: token.expires_at,
      description: token.meta.description,
      metadata: token.meta,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get tokens for a recipient
 * GET /api/tokens
 */
router.get('/', async (req, res, next) => {
  try {
    // Validate query parameters
    const QuerySchema = z.object({
      recipient_email: z.string().email(),
      status: z.enum(['active', 'revoked', 'expired', 'inactive']).optional(),
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
    });
    
    const validationResult = QuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      throw new ApiError(400, 'Invalid query parameters');
    }
    
    const { recipient_email, status, page = 1, limit = 10 } = validationResult.data;
    const offset = (page - 1) * limit;
    
    // Get tokens
    const tokens = await tokenRepository.getTokensByRecipient(
      recipient_email,
      status,
      limit,
      offset
    );
    
    // Return response
    res.json({
      tokens: tokens.map(token => ({
        token_id: token.id,
        token: token.token,
        tokenized_address: createTokenizedEmail(token.token, token.recipient_email),
        sender_email: token.data.senderEmail,
        status: token.status,
        created_at: token.created_at,
        expires_at: token.expires_at,
        description: token.meta.description,
      })),
      pagination: {
        page,
        limit,
        // Note: In a real implementation, we would also return total count
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Revoke a token
 * POST /api/tokens/:id/revoke
 */
router.post('/:id/revoke', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const RevokeSchema = z.object({
      reason: z.string().optional(),
      notify_sender: z.boolean().optional(),
    });
    
    const validationResult = RevokeSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ApiError(400, 'Invalid request body');
    }
    
    const { reason } = validationResult.data;
    
    // Revoke token
    const token = await tokenRepository.revokeToken(id, reason);
    
    // If token not found
    if (!token) {
      throw new ApiError(404, 'Token not found');
    }
    
    // Return response
    res.json({
      token_id: token.id,
      status: token.status,
      revoked_at: token.updated_at,
      reason: token.meta.revocation_reason || reason,
    });
    
    // Note: In a real implementation, we would also handle notifying the sender
    logger.info(`Token ${token.token} revoked. Notify sender: ${validationResult.data.notify_sender}`);
  } catch (error) {
    next(error);
  }
});

/**
 * Update a token
 * PATCH /api/tokens/:id
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const UpdateSchema = z.object({
      expires_at: z.string().datetime().optional(),
      description: z.string().max(255).optional(),
      metadata: z.record(z.any()).optional(),
    });
    
    const validationResult = UpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ApiError(400, 'Invalid request body');
    }
    
    // Update token
    const token = await tokenRepository.updateToken(id, validationResult.data);
    
    // If token not found
    if (!token) {
      throw new ApiError(404, 'Token not found');
    }
    
    // Return response
    res.json({
      token_id: token.id,
      token: token.token,
      status: token.status,
      expires_at: token.expires_at,
      description: token.meta.description,
      metadata: token.meta,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a token
 * DELETE /api/tokens/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete token
    const token = await tokenRepository.deleteToken(id);
    
    // If token not found
    if (!token) {
      throw new ApiError(404, 'Token not found');
    }
    
    // Return response
    res.json({
      token_id: token.id,
      status: 'deleted',
      deleted_at: token.deleted_at,
    });
  } catch (error) {
    next(error);
  }
});

export { router as tokenRoutes };
