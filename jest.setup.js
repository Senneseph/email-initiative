// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'email_token_system_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.TOKEN_LENGTH = '8';
process.env.TOKEN_EXPIRATION_DAYS = '30';
process.env.LOG_LEVEL = 'error';

// Mock the logger to prevent console output during tests
jest.mock('./src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
  stream: {
    write: jest.fn(),
  },
}));
