import db from '../db/connection';
import { Token, TokenStatus, CreateTokenRequest } from '../types/token';
import { generateToken, generateId, extractDomain } from './token-generator';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/error-handler';

/**
 * Creates a new token
 * @param createTokenRequest The token creation request
 * @returns The created token
 */
export const createToken = async (createTokenRequest: CreateTokenRequest): Promise<Token> => {
  const client = await db.getClient();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Generate token and ID
    const id = generateId();
    const tokenLength = parseInt(process.env.TOKEN_LENGTH || '8');
    const token = generateToken(tokenLength);
    
    // Extract domain from recipient email
    const recipientDomain = extractDomain(createTokenRequest.recipient_email);
    
    // Prepare metadata
    const meta = {
      version: 1,
      description: createTokenRequest.description || '',
      ...createTokenRequest.metadata,
    };
    
    // Prepare data
    const data = {
      senderEmail: createTokenRequest.sender_email || null,
      senderDomains: createTokenRequest.sender_domains || [],
    };
    
    // Calculate expiration date if provided
    let expiresAt = null;
    if (createTokenRequest.expires_at) {
      expiresAt = new Date(createTokenRequest.expires_at);
    } else if (process.env.TOKEN_EXPIRATION_DAYS) {
      const days = parseInt(process.env.TOKEN_EXPIRATION_DAYS);
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }
    
    // Insert token into database
    const result = await client.query(
      `INSERT INTO tokens(
        id, token, recipient_email, recipient_domain, meta, data, status, expires_at
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [
        id,
        token,
        createTokenRequest.recipient_email,
        recipientDomain,
        meta,
        data,
        TokenStatus.ACTIVE,
        expiresAt,
      ]
    );
    
    const newToken = result.rows[0];
    
    // If sender domains are provided, add them as authorized senders
    if (createTokenRequest.sender_domains && createTokenRequest.sender_domains.length > 0) {
      for (const domain of createTokenRequest.sender_domains) {
        await client.query(
          `INSERT INTO token_authorized_senders(
            id, token_id, sender_email, sender_domain
          ) VALUES($1, $2, $3, $4)`,
          [
            generateId(),
            id,
            createTokenRequest.sender_email || '',
            domain,
          ]
        );
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    logger.info(`Created token ${token} for ${createTokenRequest.recipient_email}`);
    
    return {
      ...newToken,
      created_at: new Date(newToken.created_at),
      updated_at: new Date(newToken.updated_at),
      expires_at: newToken.expires_at ? new Date(newToken.expires_at) : null,
      deleted_at: null,
    };
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    logger.error('Error creating token:', error);
    throw new ApiError(500, 'Failed to create token');
  } finally {
    // Release client back to pool
    client.release();
  }
};

/**
 * Gets a token by its string value
 * @param tokenString The token string
 * @returns The token or null if not found
 */
export const getTokenByString = async (tokenString: string): Promise<Token | null> => {
  try {
    const result = await db.query(
      'SELECT * FROM tokens WHERE token = $1 AND deleted_at IS NULL',
      [tokenString]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const token = result.rows[0];
    
    return {
      ...token,
      created_at: new Date(token.created_at),
      updated_at: new Date(token.updated_at),
      expires_at: token.expires_at ? new Date(token.expires_at) : null,
      deleted_at: null,
    };
  } catch (error) {
    logger.error('Error getting token by string:', error);
    throw new ApiError(500, 'Failed to get token');
  }
};

/**
 * Gets a token by its ID
 * @param id The token ID
 * @returns The token or null if not found
 */
export const getTokenById = async (id: string): Promise<Token | null> => {
  try {
    const result = await db.query(
      'SELECT * FROM tokens WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const token = result.rows[0];
    
    return {
      ...token,
      created_at: new Date(token.created_at),
      updated_at: new Date(token.updated_at),
      expires_at: token.expires_at ? new Date(token.expires_at) : null,
      deleted_at: null,
    };
  } catch (error) {
    logger.error('Error getting token by ID:', error);
    throw new ApiError(500, 'Failed to get token');
  }
};

/**
 * Gets tokens for a recipient
 * @param recipientEmail The recipient email
 * @param status Optional status filter
 * @param limit Optional limit
 * @param offset Optional offset
 * @returns The tokens
 */
export const getTokensByRecipient = async (
  recipientEmail: string,
  status?: TokenStatus,
  limit: number = 10,
  offset: number = 0
): Promise<Token[]> => {
  try {
    let query = 'SELECT * FROM tokens WHERE recipient_email = $1 AND deleted_at IS NULL';
    const params: any[] = [recipientEmail];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    return result.rows.map(token => ({
      ...token,
      created_at: new Date(token.created_at),
      updated_at: new Date(token.updated_at),
      expires_at: token.expires_at ? new Date(token.expires_at) : null,
      deleted_at: null,
    }));
  } catch (error) {
    logger.error('Error getting tokens by recipient:', error);
    throw new ApiError(500, 'Failed to get tokens');
  }
};

/**
 * Revokes a token
 * @param id The token ID
 * @param reason Optional reason for revocation
 * @returns The updated token or null if not found
 */
export const revokeToken = async (id: string, reason?: string): Promise<Token | null> => {
  const client = await db.getClient();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Get the token
    const getResult = await client.query(
      'SELECT * FROM tokens WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    
    if (getResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    
    // Update the token status
    const updateResult = await client.query(
      `UPDATE tokens 
       SET status = $1, 
           meta = jsonb_set(meta, '{revocation_reason}', $2),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [TokenStatus.REVOKED, JSON.stringify(reason || ''), id]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    const token = updateResult.rows[0];
    
    logger.info(`Revoked token ${token.token} for ${token.recipient_email}`);
    
    return {
      ...token,
      created_at: new Date(token.created_at),
      updated_at: new Date(token.updated_at),
      expires_at: token.expires_at ? new Date(token.expires_at) : null,
      deleted_at: null,
    };
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    logger.error('Error revoking token:', error);
    throw new ApiError(500, 'Failed to revoke token');
  } finally {
    // Release client back to pool
    client.release();
  }
};

/**
 * Updates a token
 * @param id The token ID
 * @param updates The updates to apply
 * @returns The updated token or null if not found
 */
export const updateToken = async (
  id: string,
  updates: {
    expires_at?: string;
    description?: string;
    metadata?: Record<string, any>;
  }
): Promise<Token | null> => {
  const client = await db.getClient();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Get the token
    const getResult = await client.query(
      'SELECT * FROM tokens WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    
    if (getResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    
    const token = getResult.rows[0];
    
    // Prepare updates
    let expiresAt = token.expires_at;
    if (updates.expires_at) {
      expiresAt = new Date(updates.expires_at);
    }
    
    const meta = { ...token.meta };
    if (updates.description) {
      meta.description = updates.description;
    }
    if (updates.metadata) {
      Object.assign(meta, updates.metadata);
    }
    
    // Update the token
    const updateResult = await client.query(
      `UPDATE tokens 
       SET expires_at = $1, 
           meta = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [expiresAt, meta, id]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    const updatedToken = updateResult.rows[0];
    
    logger.info(`Updated token ${updatedToken.token} for ${updatedToken.recipient_email}`);
    
    return {
      ...updatedToken,
      created_at: new Date(updatedToken.created_at),
      updated_at: new Date(updatedToken.updated_at),
      expires_at: updatedToken.expires_at ? new Date(updatedToken.expires_at) : null,
      deleted_at: null,
    };
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    logger.error('Error updating token:', error);
    throw new ApiError(500, 'Failed to update token');
  } finally {
    // Release client back to pool
    client.release();
  }
};

/**
 * Deletes a token (soft delete)
 * @param id The token ID
 * @returns The deleted token or null if not found
 */
export const deleteToken = async (id: string): Promise<Token | null> => {
  try {
    const result = await db.query(
      `UPDATE tokens 
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const token = result.rows[0];
    
    logger.info(`Deleted token ${token.token} for ${token.recipient_email}`);
    
    return {
      ...token,
      created_at: new Date(token.created_at),
      updated_at: new Date(token.updated_at),
      expires_at: token.expires_at ? new Date(token.expires_at) : null,
      deleted_at: new Date(token.deleted_at),
    };
  } catch (error) {
    logger.error('Error deleting token:', error);
    throw new ApiError(500, 'Failed to delete token');
  }
};

export default {
  createToken,
  getTokenByString,
  getTokenById,
  getTokensByRecipient,
  revokeToken,
  updateToken,
  deleteToken,
};
