import request from 'supertest';
import express from 'express';
import { healthRoutes } from '../../api/health-routes';
import db from '../../db/connection';

// Mock the database connection
jest.mock('../../db/connection', () => ({
  testConnection: jest.fn(),
}));

describe('Health Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/api/health', healthRoutes);
    
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return healthy status when database is connected', async () => {
      // Mock the database connection
      (db.testConnection as jest.Mock).mockResolvedValueOnce(true);

      // Make the request
      const response = await request(app).get('/api/health');

      // Check the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'healthy',
        version: expect.any(String),
        environment: expect.any(String),
        uptime: expect.any(String),
        database: {
          connected: true,
        },
        memory: {
          rss: expect.any(String),
          heapTotal: expect.any(String),
          heapUsed: expect.any(String),
          external: expect.any(String),
        },
      });

      // Check that the database connection was tested
      expect(db.testConnection).toHaveBeenCalled();
    });

    it('should return healthy status with database disconnected', async () => {
      // Mock the database connection
      (db.testConnection as jest.Mock).mockResolvedValueOnce(false);

      // Make the request
      const response = await request(app).get('/api/health');

      // Check the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'healthy',
        version: expect.any(String),
        environment: expect.any(String),
        uptime: expect.any(String),
        database: {
          connected: false,
        },
        memory: {
          rss: expect.any(String),
          heapTotal: expect.any(String),
          heapUsed: expect.any(String),
          external: expect.any(String),
        },
      });

      // Check that the database connection was tested
      expect(db.testConnection).toHaveBeenCalled();
    });

    it('should return unhealthy status when database check throws an error', async () => {
      // Mock the database connection error
      (db.testConnection as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      // Make the request
      const response = await request(app).get('/api/health');

      // Check the response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: 'unhealthy',
        error: 'Internal server error',
      });

      // Check that the database connection was tested
      expect(db.testConnection).toHaveBeenCalled();
    });
  });

  describe('GET /api/health/details', () => {
    it('should return detailed health information', async () => {
      // Mock the database connection
      (db.testConnection as jest.Mock).mockResolvedValueOnce(true);

      // Make the request
      const response = await request(app).get('/api/health/details');

      // Check the response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'healthy',
        version: expect.any(String),
        environment: expect.any(String),
        uptime: expect.any(String),
        database: {
          connected: true,
        },
        system: {
          platform: expect.any(String),
          arch: expect.any(String),
          nodeVersion: expect.any(String),
          cpuUsage: expect.any(Object),
          memoryUsage: {
            rss: expect.any(String),
            heapTotal: expect.any(String),
            heapUsed: expect.any(String),
            external: expect.any(String),
          },
          resourceUsage: expect.any(Object),
        },
        env: expect.any(Object),
      });

      // Check that the database connection was tested
      expect(db.testConnection).toHaveBeenCalled();
    });

    it('should redact sensitive environment variables', async () => {
      // Set some sensitive environment variables
      process.env.DB_PASSWORD = 'secret_password';
      process.env.JWT_SECRET = 'secret_key';
      process.env.API_KEY = 'api_key';

      // Mock the database connection
      (db.testConnection as jest.Mock).mockResolvedValueOnce(true);

      // Make the request
      const response = await request(app).get('/api/health/details');

      // Check that sensitive variables are redacted
      expect(response.body.env.DB_PASSWORD).toBe('[REDACTED]');
      expect(response.body.env.JWT_SECRET).toBe('[REDACTED]');
      expect(response.body.env.API_KEY).toBe('[REDACTED]');

      // Clean up
      delete process.env.DB_PASSWORD;
      delete process.env.JWT_SECRET;
      delete process.env.API_KEY;
    });

    it('should return unhealthy status when database check throws an error', async () => {
      // Mock the database connection error
      (db.testConnection as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      // Make the request
      const response = await request(app).get('/api/health/details');

      // Check the response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: 'unhealthy',
        error: 'Internal server error',
      });

      // Check that the database connection was tested
      expect(db.testConnection).toHaveBeenCalled();
    });
  });
});
