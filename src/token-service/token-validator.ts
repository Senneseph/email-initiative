import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection';
import { getTokenByString } from './token-repository';
import { TokenStatus, ValidateTokenRequest, ValidationResult } from '../types/token';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/error-handler';

/**
 * Validates a token
 * @param validateRequest The validation request
 * @returns The validation result
 */
export const validateToken = async (validateRequest: ValidateTokenRequest): Promise<ValidationResult> => {
  const client = await db.getClient();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Get the token
    const token = await getTokenByString(validateRequest.token);
    
    // If token doesn't exist
    if (!token) {
      await logValidation(client, null, validateRequest, false, 'reject', 'token_not_found');
      await client.query('COMMIT');
      
      return {
        valid: false,
        action: 'reject',
        reason: 'token_not_found',
      };
    }
    
    // Check if token is active
    if (token.status !== TokenStatus.ACTIVE) {
      await logValidation(client, token.id, validateRequest, false, 'reject', `token_${token.status}`);
      await client.query('COMMIT');
      
      return {
        valid: false,
        token_id: token.id,
        action: 'reject',
        reason: `token_${token.status}`,
      };
    }
    
    // Check if token has expired
    if (token.expires_at && token.expires_at < new Date()) {
      // Update token status to expired
      await client.query(
        `UPDATE tokens SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [TokenStatus.EXPIRED, token.id]
      );
      
      await logValidation(client, token.id, validateRequest, false, 'reject', 'token_expired');
      await client.query('COMMIT');
      
      return {
        valid: false,
        token_id: token.id,
        action: 'reject',
        reason: 'token_expired',
      };
    }
    
    // Check if recipient email matches
    if (token.recipient_email !== validateRequest.recipient_email) {
      await logValidation(client, token.id, validateRequest, false, 'reject', 'recipient_mismatch');
      await client.query('COMMIT');
      
      return {
        valid: false,
        token_id: token.id,
        action: 'reject',
        reason: 'recipient_mismatch',
      };
    }
    
    // Check if sender is authorized
    const senderDomain = validateRequest.sender_email.split('@')[1];
    const authorizedSenders = token.data.senderDomains || [];
    
    if (authorizedSenders.length > 0 && !authorizedSenders.includes(senderDomain)) {
      await logValidation(client, token.id, validateRequest, false, 'reject', 'sender_not_authorized');
      await client.query('COMMIT');
      
      return {
        valid: false,
        token_id: token.id,
        action: 'reject',
        reason: 'sender_not_authorized',
      };
    }
    
    // Check SPF, DKIM, and DMARC results if provided
    if (
      (validateRequest.spf_result && validateRequest.spf_result === 'fail') ||
      (validateRequest.dkim_result && validateRequest.dkim_result === 'fail') ||
      (validateRequest.dmarc_result && validateRequest.dmarc_result === 'fail')
    ) {
      await logValidation(client, token.id, validateRequest, false, 'quarantine', 'authentication_failure');
      await client.query('COMMIT');
      
      return {
        valid: false,
        token_id: token.id,
        action: 'quarantine',
        reason: 'authentication_failure',
      };
    }
    
    // Update token usage count
    await client.query(
      `UPDATE tokens 
       SET data = jsonb_set(
         data, 
         '{usageCount}', 
         (COALESCE(data->>'usageCount', '0')::int + 1)::text::jsonb
       ),
       updated_at = CURRENT_TIMESTAMP,
       meta = jsonb_set(meta, '{lastUsed}', to_jsonb(CURRENT_TIMESTAMP))
       WHERE id = $1`,
      [token.id]
    );
    
    // Log successful validation
    await logValidation(client, token.id, validateRequest, true, 'accept', 'valid_token');
    
    // Commit transaction
    await client.query('COMMIT');
    
    return {
      valid: true,
      token_id: token.id,
      action: 'accept',
      reason: 'valid_token',
      confidence: 1.0,
      metadata: {
        usageCount: (token.data.usageCount || 0) + 1,
        description: token.meta.description,
      },
    };
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    logger.error('Error validating token:', error);
    throw new ApiError(500, 'Failed to validate token');
  } finally {
    // Release client back to pool
    client.release();
  }
};

/**
 * Logs a token validation
 * @param client The database client
 * @param tokenId The token ID
 * @param validateRequest The validation request
 * @param valid Whether the validation was successful
 * @param action The action taken
 * @param reason The reason for the action
 */
const logValidation = async (
  client: any,
  tokenId: string | null,
  validateRequest: ValidateTokenRequest,
  valid: boolean,
  action: string,
  reason: string
) => {
  try {
    const id = uuidv4();
    const meta = {
      spfResult: validateRequest.spf_result || 'none',
      dkimResult: validateRequest.dkim_result || 'none',
      dmarcResult: validateRequest.dmarc_result || 'none',
      senderHelo: validateRequest.sender_helo || '',
    };
    const data = {
      valid,
      action,
      reason,
    };
    
    await client.query(
      `INSERT INTO token_usage(
        id, token_id, sender_email, sender_ip, meta, data, validation_result
      ) VALUES($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        tokenId,
        validateRequest.sender_email,
        validateRequest.sender_ip || '',
        meta,
        data,
        valid ? 'valid' : 'invalid',
      ]
    );
    
    logger.debug(`Logged validation for token ${validateRequest.token}: ${valid ? 'valid' : 'invalid'}`);
  } catch (error) {
    logger.error('Error logging validation:', error);
    // Don't throw here to avoid disrupting the main validation flow
  }
};

export default {
  validateToken,
};
