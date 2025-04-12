import request from 'supertest';
import express from 'express';
import { validateRoutes } from '../../api/validate-routes';
import { errorHandler } from '../../utils/error-handler';
import tokenValidator from '../../token-service/token-validator';

// Mock the token validator
jest.mock('../../token-service/token-validator', () => ({
  validateToken: jest.fn(),
}));

describe('Validate Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/validate', validateRoutes);
    app.use(errorHandler);
    
    jest.clearAllMocks();
  });

  describe('POST /api/validate', () => {
    it('should validate a token successfully', async () => {
      // Mock the token validator response
      (tokenValidator.validateToken as jest.Mock).mockResolvedValueOnce({
        valid: true,
        token_id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'accept',
        reason: 'valid_token',
        confidence: 1.0,
        metadata: {
          usageCount: 6,
          description: 'Test token',
        },
      });

      // Make the request
      const response = await request(app)
        .post('/api/validate')
        .send({
          token: 'abc123',
          recipient_email: 'user@example.com',
          sender_email: 'sender@company.com',
          sender_ip: '192.168.1.1',
          spf_result: 'pass',
          dkim_result: 'pass',
          dmarc_result: 'pass',
        });

      // Check the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        valid: true,
        token_id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'accept',
        reason: 'valid_token',
        confidence: 1.0,
        metadata: {
          usageCount: 6,
          description: 'Test token',
        },
      });

      // Check that the token validator was called correctly
      expect(tokenValidator.validateToken).toHaveBeenCalledWith({
        token: 'abc123',
        recipient_email: 'user@example.com',
        sender_email: 'sender@company.com',
        sender_ip: '192.168.1.1',
        spf_result: 'pass',
        dkim_result: 'pass',
        dmarc_result: 'pass',
      });
    });

    it('should return 400 for invalid request body', async () => {
      // Make the request with invalid body
      const response = await request(app)
        .post('/api/validate')
        .send({
          // Missing required fields
          token: 'abc123',
        });

      // Check the response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle errors from token validator', async () => {
      // Mock the token validator error
      (tokenValidator.validateToken as jest.Mock).mockRejectedValueOnce(new Error('Validation error'));

      // Make the request
      const response = await request(app)
        .post('/api/validate')
        .send({
          token: 'abc123',
          recipient_email: 'user@example.com',
          sender_email: 'sender@company.com',
        });

      // Check the response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/validate/batch', () => {
    it('should batch validate tokens successfully', async () => {
      // Mock the token validator responses
      (tokenValidator.validateToken as jest.Mock)
        .mockResolvedValueOnce({
          valid: true,
          token_id: '550e8400-e29b-41d4-a716-446655440000',
          action: 'accept',
          reason: 'valid_token',
        })
        .mockResolvedValueOnce({
          valid: false,
          token_id: '660e8400-e29b-41d4-a716-446655440001',
          action: 'reject',
          reason: 'token_revoked',
        });

      // Make the request
      const response = await request(app)
        .post('/api/validate/batch')
        .send({
          validations: [
            {
              token: 'abc123',
              recipient_email: 'user1@example.com',
              sender_email: 'sender@company.com',
            },
            {
              token: 'def456',
              recipient_email: 'user2@example.com',
              sender_email: 'sender@company.com',
            },
          ],
        });

      // Check the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        results: [
          {
            valid: true,
            token_id: '550e8400-e29b-41d4-a716-446655440000',
            action: 'accept',
            reason: 'valid_token',
          },
          {
            valid: false,
            token_id: '660e8400-e29b-41d4-a716-446655440001',
            action: 'reject',
            reason: 'token_revoked',
          },
        ],
      });

      // Check that the token validator was called correctly
      expect(tokenValidator.validateToken).toHaveBeenCalledTimes(2);
      expect(tokenValidator.validateToken).toHaveBeenNthCalledWith(1, {
        token: 'abc123',
        recipient_email: 'user1@example.com',
        sender_email: 'sender@company.com',
      });
      expect(tokenValidator.validateToken).toHaveBeenNthCalledWith(2, {
        token: 'def456',
        recipient_email: 'user2@example.com',
        sender_email: 'sender@company.com',
      });
    });

    it('should return 400 for invalid request body', async () => {
      // Make the request with invalid body
      const response = await request(app)
        .post('/api/validate/batch')
        .send({
          // Missing validations array
        });

      // Check the response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid validation requests in batch', async () => {
      // Mock the token validator response for the valid request
      (tokenValidator.validateToken as jest.Mock).mockResolvedValueOnce({
        valid: true,
        token_id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'accept',
        reason: 'valid_token',
      });

      // Make the request with one valid and one invalid validation
      const response = await request(app)
        .post('/api/validate/batch')
        .send({
          validations: [
            {
              token: 'abc123',
              recipient_email: 'user1@example.com',
              sender_email: 'sender@company.com',
            },
            {
              // Missing required fields
              token: 'def456',
            },
          ],
        });

      // Check the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        results: [
          {
            valid: true,
            token_id: '550e8400-e29b-41d4-a716-446655440000',
            action: 'accept',
            reason: 'valid_token',
          },
          {
            valid: false,
            action: 'reject',
            reason: 'invalid_request',
          },
        ],
      });

      // Check that the token validator was called only for the valid request
      expect(tokenValidator.validateToken).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from token validator in batch', async () => {
      // Mock the token validator responses
      (tokenValidator.validateToken as jest.Mock)
        .mockResolvedValueOnce({
          valid: true,
          token_id: '550e8400-e29b-41d4-a716-446655440000',
          action: 'accept',
          reason: 'valid_token',
        })
        .mockRejectedValueOnce(new Error('Validation error'));

      // Make the request
      const response = await request(app)
        .post('/api/validate/batch')
        .send({
          validations: [
            {
              token: 'abc123',
              recipient_email: 'user1@example.com',
              sender_email: 'sender@company.com',
            },
            {
              token: 'def456',
              recipient_email: 'user2@example.com',
              sender_email: 'sender@company.com',
            },
          ],
        });

      // Check the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        results: [
          {
            valid: true,
            token_id: '550e8400-e29b-41d4-a716-446655440000',
            action: 'accept',
            reason: 'valid_token',
          },
          {
            valid: false,
            action: 'reject',
            reason: 'validation_error',
          },
        ],
      });

      // Check that the token validator was called for both requests
      expect(tokenValidator.validateToken).toHaveBeenCalledTimes(2);
    });
  });
});
