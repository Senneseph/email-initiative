import { Pool } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

// Create a new Pool instance with connection details from environment variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Set a reasonable pool size
  max: 20,
  // How long a client is allowed to remain idle before being closed
  idleTimeoutMillis: 30000,
  // How long to wait for a connection from the pool
  connectionTimeoutMillis: 2000,
});

// Log pool events
pool.on('connect', () => {
  logger.debug('Connected to the database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    logger.info('Database connection successful');
    client.release();
    return true;
  } catch (error) {
    logger.error('Database connection error:', error);
    return false;
  }
};

// Execute a query
const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Executed query: ${text} - Duration: ${duration}ms - Rows: ${result.rowCount}`);
    return result;
  } catch (error) {
    logger.error(`Query error: ${text}`, error);
    throw error;
  }
};

// Get a client from the pool
const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  
  // Monkey patch the query method to log queries
  const query = async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
      const result = await originalQuery(text, params);
      const duration = Date.now() - start;
      logger.debug(`Executed query: ${text} - Duration: ${duration}ms - Rows: ${result.rowCount}`);
      return result;
    } catch (error) {
      logger.error(`Query error: ${text}`, error);
      throw error;
    }
  };

  // Return the client with the patched query method
  client.query = query as any;
  return client;
};

export default {
  pool,
  query,
  getClient,
  testConnection,
};
