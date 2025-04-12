import { TokenStatus } from '../../types/token';
import * as tokenRepository from '../../token-service/token-repository';
import { db, mockPool, resetMocks } from '../mocks/db.mock';
import { ApiError } from '../../utils/error-handler';

// Mock the token generator
jest.mock('../../token-service/token-generator', () => ({
  generateToken: jest.fn().mockReturnValue('abc123'),
  generateId: jest.fn().mockReturnValue('550e8400-e29b-41d4-a716-446655440000'),
  extractDomain: jest.fn().mockReturnValue('example.com'),
  createTokenizedAddress: jest.fn(),
  extractTokenFromEmail: jest.fn(),
}));

describe('Token Repository', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  describe('createToken', () => {
    it('should create a token successfully', async () => {
      // Mock the database response
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: '550e8400-e29b-41d4-a716-446655440000',
          token: 'abc123',
          recipient_email: 'user@example.com',
          recipient_domain: 'example.com',
          meta: { version: 1, description: 'Test token' },
          data: { senderEmail: 'sender@company.com', senderDomains: ['company.com'] },
          status: 'active',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          expires_at: '2024-01-01T00:00:00Z',
          deleted_at: null,
        }],
      });

      // Call the function
      const result = await tokenRepository.createToken({
        recipient_email: 'user@example.com',
        sender_email: 'sender@company.com',
        sender_domains: ['company.com'],
        expires_at: '2024-01-01T00:00:00Z',
        description: 'Test token',
      });

      // Check the result
      expect(result).toBeDefined();
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.token).toBe('abc123');
      expect(result.recipient_email).toBe('user@example.com');
      expect(result.status).toBe('active');
      expect(result.meta).toEqual({ version: 1, description: 'Test token' });
      expect(result.data).toEqual({ senderEmail: 'sender@company.com', senderDomains: ['company.com'] });
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(result.expires_at).toBeInstanceOf(Date);
      expect(result.deleted_at).toBeNull();

      // Check that the database was called correctly
      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tokens'),
        expect.arrayContaining([
          '550e8400-e29b-41d4-a716-446655440000',
          'abc123',
          'user@example.com',
          'example.com',
          expect.any(Object),
          expect.any(Object),
          'active',
          expect.any(Date),
        ])
      );
    });

    it('should handle database errors', async () => {
      // Mock the database error
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      // Call the function and expect it to throw
      await expect(tokenRepository.createToken({
        recipient_email: 'user@example.com',
      })).rejects.toThrow(ApiError);

      // Check that the database was called
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTokenByString', () => {
    it('should return a token when found', async () => {
      // Mock the database response
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: '550e8400-e29b-41d4-a716-446655440000',
          token: 'abc123',
          recipient_email: 'user@example.com',
          recipient_domain: 'example.com',
          meta: { version: 1, description: 'Test token' },
          data: { senderEmail: 'sender@company.com', senderDomains: ['company.com'] },
          status: 'active',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          expires_at: '2024-01-01T00:00:00Z',
          deleted_at: null,
        }],
      });

      // Call the function
      const result = await tokenRepository.getTokenByString('abc123');

      // Check the result
      expect(result).toBeDefined();
      expect(result?.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result?.token).toBe('abc123');
      expect(result?.recipient_email).toBe('user@example.com');
      expect(result?.status).toBe('active');

      // Check that the database was called correctly
      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM tokens WHERE token = $1'),
        ['abc123']
      );
    });

    it('should return null when token is not found', async () => {
      // Mock the database response
      mockPool.query.mockResolvedValueOnce({
        rows: [],
      });

      // Call the function
      const result = await tokenRepository.getTokenByString('nonexistent');

      // Check the result
      expect(result).toBeNull();

      // Check that the database was called correctly
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      // Mock the database error
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      // Call the function and expect it to throw
      await expect(tokenRepository.getTokenByString('abc123')).rejects.toThrow(ApiError);

      // Check that the database was called
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('revokeToken', () => {
    it('should revoke a token successfully', async () => {
      // Mock the database responses
      mockPool.query
        // First query to check if token exists
        .mockResolvedValueOnce({
          rows: [{
            id: '550e8400-e29b-41d4-a716-446655440000',
            token: 'abc123',
            recipient_email: 'user@example.com',
            status: 'active',
          }],
        })
        // Second query to update the token
        .mockResolvedValueOnce({
          rows: [{
            id: '550e8400-e29b-41d4-a716-446655440000',
            token: 'abc123',
            recipient_email: 'user@example.com',
            recipient_domain: 'example.com',
            meta: { version: 1, description: 'Test token', revocation_reason: 'No longer needed' },
            data: { senderEmail: 'sender@company.com', senderDomains: ['company.com'] },
            status: 'revoked',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
            expires_at: '2024-01-01T00:00:00Z',
            deleted_at: null,
          }],
        });

      // Call the function
      const result = await tokenRepository.revokeToken('550e8400-e29b-41d4-a716-446655440000', 'No longer needed');

      // Check the result
      expect(result).toBeDefined();
      expect(result?.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result?.token).toBe('abc123');
      expect(result?.status).toBe('revoked');
      expect(result?.meta.revocation_reason).toBe('No longer needed');

      // Check that the database was called correctly
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should return null when token is not found', async () => {
      // Mock the database response
      mockPool.query.mockResolvedValueOnce({
        rows: [],
      });

      // Call the function
      const result = await tokenRepository.revokeToken('nonexistent');

      // Check the result
      expect(result).toBeNull();

      // Check that the database was called correctly
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      // Mock the database error
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      // Call the function and expect it to throw
      await expect(tokenRepository.revokeToken('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(ApiError);

      // Check that the database was called
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });
});
