import {
  generateToken,
  generateId,
  extractDomain,
  createTokenizedAddress,
  extractTokenFromEmail,
} from '../../token-service/token-generator';

describe('Token Generator', () => {
  describe('generateToken', () => {
    it('should generate a token of the specified length', () => {
      const token = generateToken(8);
      expect(token).toBeDefined();
      expect(token.length).toBe(8);
    });

    it('should generate a token with only lowercase letters and numbers', () => {
      const token = generateToken(12);
      expect(token).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate different tokens on subsequent calls', () => {
      const token1 = generateToken(8);
      const token2 = generateToken(8);
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateId', () => {
    it('should generate a valid UUID', () => {
      const id = generateId();
      expect(id).toBeDefined();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should generate different IDs on subsequent calls', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('extractDomain', () => {
    it('should extract the domain from an email address', () => {
      const domain = extractDomain('user@example.com');
      expect(domain).toBe('example.com');
    });

    it('should return an empty string for invalid email addresses', () => {
      const domain = extractDomain('invalid-email');
      expect(domain).toBe('');
    });
  });

  describe('createTokenizedAddress', () => {
    it('should create a tokenized email address', () => {
      const tokenizedAddress = createTokenizedAddress('abc123', 'user@example.com');
      expect(tokenizedAddress).toBe('$abc123+user@example.com');
    });

    it('should throw an error for invalid email addresses', () => {
      expect(() => {
        createTokenizedAddress('abc123', 'invalid-email');
      }).toThrow('Invalid email address');
    });
  });

  describe('extractTokenFromEmail', () => {
    it('should extract the token and original email from a tokenized address', () => {
      const result = extractTokenFromEmail('$abc123+user@example.com');
      expect(result).toBeDefined();
      expect(result?.token).toBe('abc123');
      expect(result?.originalEmail).toBe('user@example.com');
    });

    it('should return null for non-tokenized addresses', () => {
      const result = extractTokenFromEmail('user@example.com');
      expect(result).toBeNull();
    });

    it('should return null for invalid tokenized addresses', () => {
      const result = extractTokenFromEmail('$abc123user@example.com');
      expect(result).toBeNull();
    });
  });
});
