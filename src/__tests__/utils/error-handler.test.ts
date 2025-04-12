import { Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { ApiError, errorHandler } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Error Handler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ApiError', () => {
    it('should create an ApiError with the correct properties', () => {
      const error = new ApiError(404, 'Not Found');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not Found');
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    it('should allow setting isOperational to false', () => {
      const error = new ApiError(500, 'Server Error', false);
      
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Server Error');
      expect(error.isOperational).toBe(false);
    });
  });

  describe('errorHandler middleware', () => {
    it('should handle ApiError', () => {
      const error = new ApiError(404, 'Not Found');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'ApiError',
          message: 'Not Found',
          isOperational: true,
        },
      });
    });

    it('should handle ZodError', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().positive(),
      });
      
      let zodError: ZodError;
      try {
        schema.parse({ name: 123, age: -5 });
      } catch (error) {
        zodError = error as ZodError;
        
        errorHandler(zodError, mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(logger.error).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: {
            code: 'validation_failed',
            message: 'Validation failed',
            details: expect.any(Object),
          },
        });
      }
    });

    it('should handle generic errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Some unexpected error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'Error',
          message: 'Internal Server Error',
          isOperational: false,
        },
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should include error message for generic errors in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Some unexpected error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'Error',
          message: 'Some unexpected error',
          isOperational: false,
        },
      });
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});
