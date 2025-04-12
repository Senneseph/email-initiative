import fs from 'fs';
import path from 'path';
import db from './connection';
import { logger } from '../utils/logger';

// Initialize the database
export const initDatabase = async () => {
  try {
    // Test the connection
    const connected = await db.testConnection();
    if (!connected) {
      logger.error('Failed to connect to the database');
      process.exit(1);
    }

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    logger.info('Initializing database schema...');
    await db.query(schema);
    logger.info('Database schema initialized successfully');

    return true;
  } catch (error) {
    logger.error('Error initializing database:', error);
    return false;
  }
};

// Export the function to be called from the main application
export default { initDatabase };
