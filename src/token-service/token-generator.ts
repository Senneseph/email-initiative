import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * Generates a random token of the specified length
 * @param length The length of the token to generate
 * @returns A random token string
 */
export const generateToken = (length: number = 8): string => {
  try {
    // Define the character set for tokens
    const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
    
    // Generate random bytes
    const randomBytes = crypto.randomBytes(length);
    
    // Convert random bytes to characters from the charset
    let token = '';
    for (let i = 0; i < length; i++) {
      // Use modulo to ensure the byte value maps to a character in the charset
      const index = randomBytes[i] % charset.length;
      token += charset[index];
    }
    
    logger.debug(`Generated token: ${token}`);
    return token;
  } catch (error) {
    logger.error('Error generating token:', error);
    // Fallback method if crypto fails
    return Array.from({ length }, () => 
      charset.charAt(Math.floor(Math.random() * charset.length))
    ).join('');
  }
};

/**
 * Generates a UUID v4
 * @returns A UUID v4 string
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * Extracts the domain from an email address
 * @param email The email address
 * @returns The domain part of the email
 */
export const extractDomain = (email: string): string => {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : '';
};

/**
 * Creates a tokenized email address
 * @param token The token
 * @param email The original email address
 * @returns The tokenized email address
 */
export const createTokenizedAddress = (token: string, email: string): string => {
  const parts = email.split('@');
  if (parts.length !== 2) {
    throw new Error('Invalid email address');
  }
  
  return `$${token}+${parts[0]}@${parts[1]}`;
};

/**
 * Extracts a token from a tokenized email address
 * @param email The tokenized email address
 * @returns The token and the original email address, or null if no token is found
 */
export const extractTokenFromEmail = (email: string): { token: string; originalEmail: string } | null => {
  // Match the pattern $token+username@domain.tld
  const tokenPattern = /^\$([a-z0-9]+)\+(.+)@(.+)$/;
  const match = email.match(tokenPattern);
  
  if (!match) {
    return null;
  }
  
  const token = match[1];
  const username = match[2];
  const domain = match[3];
  
  return {
    token,
    originalEmail: `${username}@${domain}`,
  };
};

export default {
  generateToken,
  generateId,
  extractDomain,
  createTokenizedAddress,
  extractTokenFromEmail,
};
