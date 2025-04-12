import {
  parseTokenizedEmail,
  createTokenizedEmail,
  extractDomain,
  extractUsername,
} from '../../email-parser/email-parser';

describe('Email Parser', () => {
  describe('parseTokenizedEmail', () => {
    it('should parse a valid tokenized email address', () => {
      const result = parseTokenizedEmail('$abc123+user@example.com');
      
      expect(result).toBeDefined();
      expect(result?.token).toBe('abc123');
      expect(result?.username).toBe('user');
      expect(result?.domain).toBe('example.com');
      expect(result?.originalEmail).toBe('user@example.com');
      expect(result?.tokenizedEmail).toBe('$abc123+user@example.com');
    });

    it('should return null for a non-tokenized email address', () => {
      const result = parseTokenizedEmail('user@example.com');
      expect(result).toBeNull();
    });

    it('should return null for an invalid tokenized email address', () => {
      const result = parseTokenizedEmail('$abc123user@example.com');
      expect(result).toBeNull();
    });

    it('should handle complex usernames', () => {
      const result = parseTokenizedEmail('$abc123+user.name+tag@example.com');
      
      expect(result).toBeDefined();
      expect(result?.token).toBe('abc123');
      expect(result?.username).toBe('user.name+tag');
      expect(result?.domain).toBe('example.com');
      expect(result?.originalEmail).toBe('user.name+tag@example.com');
    });
  });

  describe('createTokenizedEmail', () => {
    it('should create a tokenized email address', () => {
      const result = createTokenizedEmail('abc123', 'user@example.com');
      expect(result).toBe('$abc123+user@example.com');
    });

    it('should throw an error for invalid email addresses', () => {
      expect(() => {
        createTokenizedEmail('abc123', 'invalid-email');
      }).toThrow('Invalid email address');
    });

    it('should handle complex usernames', () => {
      const result = createTokenizedEmail('abc123', 'user.name+tag@example.com');
      expect(result).toBe('$abc123+user.name+tag@example.com');
    });
  });

  describe('extractDomain', () => {
    it('should extract the domain from an email address', () => {
      const result = extractDomain('user@example.com');
      expect(result).toBe('example.com');
    });

    it('should throw an error for invalid email addresses', () => {
      expect(() => {
        extractDomain('invalid-email');
      }).toThrow('Invalid email address');
    });

    it('should handle subdomains', () => {
      const result = extractDomain('user@sub.example.com');
      expect(result).toBe('sub.example.com');
    });
  });

  describe('extractUsername', () => {
    it('should extract the username from an email address', () => {
      const result = extractUsername('user@example.com');
      expect(result).toBe('user');
    });

    it('should throw an error for invalid email addresses', () => {
      expect(() => {
        extractUsername('invalid-email');
      }).toThrow('Invalid email address');
    });

    it('should handle complex usernames', () => {
      const result = extractUsername('user.name+tag@example.com');
      expect(result).toBe('user.name+tag');
    });
  });
});
