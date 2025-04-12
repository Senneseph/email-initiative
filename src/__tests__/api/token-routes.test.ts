import request from 'supertest';
import express from 'express';
import { tokenRoutes } from '../../api/token-routes';
import { errorHandler } from '../../utils/error-handler';
import tokenRepository from '../../token-service/token-repository';
import { createTokenizedEmail } from '../../email-parser/email-parser';

// Mock the token repository
jest.mock('../../token-service/token-repository', () => ({
  createToken: jest.fn(),
  getTokenById: jest.fn(),
  getTokensByRecipient: jest.fn(),
  revokeToken: jest.fn(),
  updateToken: jest.fn(),
  deleteToken: jest.fn(),
}));

// Mock the email parser
jest.mock('../../email-parser/email-parser', () => ({
  createTokenizedEmail: jest.fn(),
}));

describe('Token Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/tokens', tokenRoutes);
    app.use(errorHandler);
    
    jest.clearAllMocks();
  });

  describe('POST /api/tokens', () => {
    it('should create a token successfully', async () => {
      // Mock the token repository response
      (tokenRepository.createToken as jest.Mock).mockResolvedValueOnce({
        id: '550e8400-e29b-41d4-a716-446655440000',
        token: 'abc123',
        recipient_email: 'user@example.com',
        recipient_domain: 'example.com',
        meta: { version: 1, description: 'Test token' },
        data: { senderEmail: 'sender@company.com', senderDomains: ['company.com'] },
        status: 'active',
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-01T00:00:00Z'),
        expires_at: new Date('2024-01-01T00:00:00Z'),
        deleted_at: null,
      });

      // Mock the tokenized email
      (createTokenizedEmail as jest.Mock).mockReturnValueOnce('$abc123+user@example.com');

      // Make the request
      const response = await request(app)
        .post('/api/tokens')
        .send({
          recipient_email: 'user@example.com',
          sender_email: 'sender@company.com',
          sender_domains: ['company.com'],
          expires_at: '2024-01-01T00:00:00Z',
          description: 'Test token',
        });

      // Check the response
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        token_id: '550e8400-e29b-41d4-a716-446655440000',
        token: 'abc123',
        tokenized_address: '$abc123+user@example.com',
        status: 'active',
        created_at: '2023-01-01T00:00:00.000Z',
        expires_at: '2024-01-01T00:00:00.000Z',
      });

      // Check that the token repository was called correctly
      expect(tokenRepository.createToken).toHaveBeenCalledWith({
        recipient_email: 'user@example.com',
        sender_email: 'sender@company.com',
        sender_domains: ['company.com'],
        expires_at: '2024-01-01T00:00:00Z',
        description: 'Test token',
      });

      // Check that the email parser was called correctly
      expect(createTokenizedEmail).toHaveBeenCalledWith('abc123', 'user@example.com');
    });

    it('should return 400 for invalid request body', async () => {
      // Make the request with invalid body
      const response = await request(app)
        .post('/api/tokens')
        .send({
          // Missing required recipient_email
          sender_email: 'sender@company.com',
        });

      // Check the response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle errors from token repository', async () => {
      // Mock the token repository error
      (tokenRepository.createToken as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      // Make the request
      const response = await request(app)
        .post('/api/tokens')
        .send({
          recipient_email: 'user@example.com',
          sender_email: 'sender@company.com',
        });

      // Check the response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/tokens/:id', () => {
    it('should get a token by ID successfully', async () => {
      // Mock the token repository response
      (tokenRepository.getTokenById as jest.Mock).mockResolvedValueOnce({
        id: '550e8400-e29b-41d4-a716-446655440000',
        token: 'abc123',
        recipient_email: 'user@example.com',
        recipient_domain: 'example.com',
        meta: { version: 1, description: 'Test token' },
        data: { senderEmail: 'sender@company.com', senderDomains: ['company.com'] },
        status: 'active',
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-01T00:00:00Z'),
        expires_at: new Date('2024-01-01T00:00:00Z'),
        deleted_at: null,
      });

      // Mock the tokenized email
      (createTokenizedEmail as jest.Mock).mockReturnValueOnce('$abc123+user@example.com');

      // Make the request
      const response = await request(app)
        .get('/api/tokens/550e8400-e29b-41d4-a716-446655440000');

      // Check the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        token_id: '550e8400-e29b-41d4-a716-446655440000',
        token: 'abc123',
        tokenized_address: '$abc123+user@example.com',
        recipient_email: 'user@example.com',
        sender_email: 'sender@company.com',
        sender_domains: ['company.com'],
        status: 'active',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        expires_at: '2024-01-01T00:00:00.000Z',
        description: 'Test token',
        metadata: { version: 1, description: 'Test token' },
      });

      // Check that the token repository was called correctly
      expect(tokenRepository.getTokenById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');

      // Check that the email parser was called correctly
      expect(createTokenizedEmail).toHaveBeenCalledWith('abc123', 'user@example.com');
    });

    it('should return 404 when token is not found', async () => {
      // Mock the token repository response
      (tokenRepository.getTokenById as jest.Mock).mockResolvedValueOnce(null);

      // Make the request
      const response = await request(app)
        .get('/api/tokens/nonexistent');

      // Check the response
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/tokens/:id/revoke', () => {
    it('should revoke a token successfully', async () => {
      // Mock the token repository response
      (tokenRepository.revokeToken as jest.Mock).mockResolvedValueOnce({
        id: '550e8400-e29b-41d4-a716-446655440000',
        token: 'abc123',
        recipient_email: 'user@example.com',
        recipient_domain: 'example.com',
        meta: { version: 1, description: 'Test token', revocation_reason: 'No longer needed' },
        data: { senderEmail: 'sender@company.com', senderDomains: ['company.com'] },
        status: 'revoked',
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-02T00:00:00Z'),
        expires_at: new Date('2024-01-01T00:00:00Z'),
        deleted_at: null,
      });

      // Make the request
      const response = await request(app)
        .post('/api/tokens/550e8400-e29b-41d4-a716-446655440000/revoke')
        .send({
          reason: 'No longer needed',
          notify_sender: true,
        });

      // Check the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        token_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'revoked',
        revoked_at: '2023-01-02T00:00:00.000Z',
        reason: 'No longer needed',
      });

      // Check that the token repository was called correctly
      expect(tokenRepository.revokeToken).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        'No longer needed'
      );
    });

    it('should return 404 when token is not found', async () => {
      // Mock the token repository response
      (tokenRepository.revokeToken as jest.Mock).mockResolvedValueOnce(null);

      // Make the request
      const response = await request(app)
        .post('/api/tokens/nonexistent/revoke')
        .send({
          reason: 'No longer needed',
        });

      // Check the response
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
