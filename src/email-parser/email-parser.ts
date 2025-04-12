import { logger } from '../utils/logger';

/**
 * Represents the result of parsing a tokenized email address
 */
export interface ParsedEmail {
  token: string;
  username: string;
  domain: string;
  originalEmail: string;
  tokenizedEmail: string;
}

/**
 * Parses a tokenized email address
 * @param email The tokenized email address
 * @returns The parsed email or null if not a tokenized email
 */
export const parseTokenizedEmail = (email: string): ParsedEmail | null => {
  try {
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
      username,
      domain,
      originalEmail: `${username}@${domain}`,
      tokenizedEmail: email,
    };
  } catch (error) {
    logger.error('Error parsing tokenized email:', error);
    return null;
  }
};

/**
 * Creates a tokenized email address
 * @param token The token
 * @param email The original email address
 * @returns The tokenized email address
 */
export const createTokenizedEmail = (token: string, email: string): string => {
  try {
    const parts = email.split('@');
    if (parts.length !== 2) {
      throw new Error('Invalid email address');
    }
    
    return `$${token}+${parts[0]}@${parts[1]}`;
  } catch (error) {
    logger.error('Error creating tokenized email:', error);
    throw error;
  }
};

/**
 * Extracts the domain from an email address
 * @param email The email address
 * @returns The domain
 */
export const extractDomain = (email: string): string => {
  try {
    const parts = email.split('@');
    if (parts.length !== 2) {
      throw new Error('Invalid email address');
    }
    
    return parts[1];
  } catch (error) {
    logger.error('Error extracting domain:', error);
    throw error;
  }
};

/**
 * Extracts the username from an email address
 * @param email The email address
 * @returns The username
 */
export const extractUsername = (email: string): string => {
  try {
    const parts = email.split('@');
    if (parts.length !== 2) {
      throw new Error('Invalid email address');
    }
    
    return parts[0];
  } catch (error) {
    logger.error('Error extracting username:', error);
    throw error;
  }
};

export default {
  parseTokenizedEmail,
  createTokenizedEmail,
  extractDomain,
  extractUsername,
};
