import { validateToken } from '../../token-service/token-validator';
import { getTokenByString } from '../../token-service/token-repository';
import { TokenStatus } from '../../types/token';
import { db, mockPool, mockClient, resetMocks } from '../mocks/db.mock';
import { ApiError } from '../../utils/error-handler';

// Mock the token repository
jest.mock('../../token-service/token-repository', () => ({
  getTokenByString: jest.fn(),
}));

describe('Token Validator', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  it('should validate a token successfully', async () => {
    // Mock the token repository response
    (getTokenByString as jest.Mock).mockResolvedValueOnce({
      id: '550e8400-e29b-41d4-a716-446655440000',
      token: 'abc123',
      recipient_email: 'user@example.com',
      recipient_domain: 'example.com',
      meta: { version: 1, description: 'Test token' },
      data: { 
        senderEmail: 'sender@company.com', 
        senderDomains: ['company.com'],
        usageCount: 5
      },
      status: TokenStatus.ACTIVE,
      created_at: new Date('2023-01-01T00:00:00Z'),
      updated_at: new Date('2023-01-01T00:00:00Z'),
      expires_at: new Date('2024-01-01T00:00:00Z'),
      deleted_at: null,
    });

    // Call the function
    const result = await validateToken({
      token: 'abc123',
      recipient_email: 'user@example.com',
      sender_email: 'sender@company.com',
      sender_ip: '192.168.1.1',
      spf_result: 'pass',
      dkim_result: 'pass',
      dmarc_result: 'pass',
    });

    // Check the result
    expect(result).toBeDefined();
    expect(result.valid).toBe(true);
    expect(result.token_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.action).toBe('accept');
    expect(result.reason).toBe('valid_token');
    expect(result.confidence).toBe(1.0);
    expect(result.metadata).toEqual({
      usageCount: 6,
      description: 'Test token',
    });

    // Check that the token repository was called correctly
    expect(getTokenByString).toHaveBeenCalledWith('abc123');

    // Check that the database was called correctly for logging and updating
    expect(mockClient.query).toHaveBeenCalledTimes(2);
  });

  it('should reject when token is not found', async () => {
    // Mock the token repository response
    (getTokenByString as jest.Mock).mockResolvedValueOnce(null);

    // Call the function
    const result = await validateToken({
      token: 'nonexistent',
      recipient_email: 'user@example.com',
      sender_email: 'sender@company.com',
    });

    // Check the result
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.action).toBe('reject');
    expect(result.reason).toBe('token_not_found');

    // Check that the token repository was called correctly
    expect(getTokenByString).toHaveBeenCalledWith('nonexistent');

    // Check that the database was called correctly for logging
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });

  it('should reject when token is revoked', async () => {
    // Mock the token repository response
    (getTokenByString as jest.Mock).mockResolvedValueOnce({
      id: '550e8400-e29b-41d4-a716-446655440000',
      token: 'abc123',
      recipient_email: 'user@example.com',
      recipient_domain: 'example.com',
      meta: { version: 1, description: 'Test token', revocation_reason: 'No longer needed' },
      data: { senderEmail: 'sender@company.com', senderDomains: ['company.com'] },
      status: TokenStatus.REVOKED,
      created_at: new Date('2023-01-01T00:00:00Z'),
      updated_at: new Date('2023-01-02T00:00:00Z'),
      expires_at: new Date('2024-01-01T00:00:00Z'),
      deleted_at: null,
    });

    // Call the function
    const result = await validateToken({
      token: 'abc123',
      recipient_email: 'user@example.com',
      sender_email: 'sender@company.com',
    });

    // Check the result
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.token_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.action).toBe('reject');
    expect(result.reason).toBe('token_revoked');

    // Check that the token repository was called correctly
    expect(getTokenByString).toHaveBeenCalledWith('abc123');

    // Check that the database was called correctly for logging
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });

  it('should reject when token is expired', async () => {
    // Mock the token repository response
    (getTokenByString as jest.Mock).mockResolvedValueOnce({
      id: '550e8400-e29b-41d4-a716-446655440000',
      token: 'abc123',
      recipient_email: 'user@example.com',
      recipient_domain: 'example.com',
      meta: { version: 1, description: 'Test token' },
      data: { senderEmail: 'sender@company.com', senderDomains: ['company.com'] },
      status: TokenStatus.ACTIVE,
      created_at: new Date('2023-01-01T00:00:00Z'),
      updated_at: new Date('2023-01-01T00:00:00Z'),
      expires_at: new Date('2022-01-01T00:00:00Z'), // Expired
      deleted_at: null,
    });

    // Call the function
    const result = await validateToken({
      token: 'abc123',
      recipient_email: 'user@example.com',
      sender_email: 'sender@company.com',
    });

    // Check the result
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.token_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.action).toBe('reject');
    expect(result.reason).toBe('token_expired');

    // Check that the token repository was called correctly
    expect(getTokenByString).toHaveBeenCalledWith('abc123');

    // Check that the database was called correctly for updating and logging
    expect(mockClient.query).toHaveBeenCalledTimes(2);
  });

  it('should reject when recipient email does not match', async () => {
    // Mock the token repository response
    (getTokenByString as jest.Mock).mockResolvedValueOnce({
      id: '550e8400-e29b-41d4-a716-446655440000',
      token: 'abc123',
      recipient_email: 'user@example.com',
      recipient_domain: 'example.com',
      meta: { version: 1, description: 'Test token' },
      data: { senderEmail: 'sender@company.com', senderDomains: ['company.com'] },
      status: TokenStatus.ACTIVE,
      created_at: new Date('2023-01-01T00:00:00Z'),
      updated_at: new Date('2023-01-01T00:00:00Z'),
      expires_at: new Date('2024-01-01T00:00:00Z'),
      deleted_at: null,
    });

    // Call the function with a different recipient
    const result = await validateToken({
      token: 'abc123',
      recipient_email: 'different@example.com',
      sender_email: 'sender@company.com',
    });

    // Check the result
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.token_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.action).toBe('reject');
    expect(result.reason).toBe('recipient_mismatch');

    // Check that the token repository was called correctly
    expect(getTokenByString).toHaveBeenCalledWith('abc123');

    // Check that the database was called correctly for logging
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });

  it('should reject when sender is not authorized', async () => {
    // Mock the token repository response
    (getTokenByString as jest.Mock).mockResolvedValueOnce({
      id: '550e8400-e29b-41d4-a716-446655440000',
      token: 'abc123',
      recipient_email: 'user@example.com',
      recipient_domain: 'example.com',
      meta: { version: 1, description: 'Test token' },
      data: { 
        senderEmail: 'sender@company.com', 
        senderDomains: ['company.com'] // Only company.com is authorized
      },
      status: TokenStatus.ACTIVE,
      created_at: new Date('2023-01-01T00:00:00Z'),
      updated_at: new Date('2023-01-01T00:00:00Z'),
      expires_at: new Date('2024-01-01T00:00:00Z'),
      deleted_at: null,
    });

    // Call the function with a different sender domain
    const result = await validateToken({
      token: 'abc123',
      recipient_email: 'user@example.com',
      sender_email: 'sender@different.com',
    });

    // Check the result
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.token_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.action).toBe('reject');
    expect(result.reason).toBe('sender_not_authorized');

    // Check that the token repository was called correctly
    expect(getTokenByString).toHaveBeenCalledWith('abc123');

    // Check that the database was called correctly for logging
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });

  it('should quarantine when authentication fails', async () => {
    // Mock the token repository response
    (getTokenByString as jest.Mock).mockResolvedValueOnce({
      id: '550e8400-e29b-41d4-a716-446655440000',
      token: 'abc123',
      recipient_email: 'user@example.com',
      recipient_domain: 'example.com',
      meta: { version: 1, description: 'Test token' },
      data: { senderEmail: 'sender@company.com', senderDomains: ['company.com'] },
      status: TokenStatus.ACTIVE,
      created_at: new Date('2023-01-01T00:00:00Z'),
      updated_at: new Date('2023-01-01T00:00:00Z'),
      expires_at: new Date('2024-01-01T00:00:00Z'),
      deleted_at: null,
    });

    // Call the function with failed authentication
    const result = await validateToken({
      token: 'abc123',
      recipient_email: 'user@example.com',
      sender_email: 'sender@company.com',
      spf_result: 'fail',
      dkim_result: 'fail',
      dmarc_result: 'fail',
    });

    // Check the result
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.token_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.action).toBe('quarantine');
    expect(result.reason).toBe('authentication_failure');

    // Check that the token repository was called correctly
    expect(getTokenByString).toHaveBeenCalledWith('abc123');

    // Check that the database was called correctly for logging
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });

  it('should handle database errors', async () => {
    // Mock the token repository response
    (getTokenByString as jest.Mock).mockResolvedValueOnce({
      id: '550e8400-e29b-41d4-a716-446655440000',
      token: 'abc123',
      recipient_email: 'user@example.com',
      recipient_domain: 'example.com',
      meta: { version: 1, description: 'Test token' },
      data: { senderEmail: 'sender@company.com', senderDomains: ['company.com'] },
      status: TokenStatus.ACTIVE,
      created_at: new Date('2023-01-01T00:00:00Z'),
      updated_at: new Date('2023-01-01T00:00:00Z'),
      expires_at: new Date('2024-01-01T00:00:00Z'),
      deleted_at: null,
    });

    // Mock the database error
    mockClient.query.mockRejectedValueOnce(new Error('Database error'));

    // Call the function and expect it to throw
    await expect(validateToken({
      token: 'abc123',
      recipient_email: 'user@example.com',
      sender_email: 'sender@company.com',
    })).rejects.toThrow(ApiError);

    // Check that the token repository was called correctly
    expect(getTokenByString).toHaveBeenCalledWith('abc123');

    // Check that the database was called
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });
});
