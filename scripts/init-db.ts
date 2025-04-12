import { initDatabase } from '../src/db/init';
import { logger } from '../src/utils/logger';

// Initialize the database
initDatabase()
  .then((success) => {
    if (success) {
      logger.info('Database initialization completed successfully');
      process.exit(0);
    } else {
      logger.error('Database initialization failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    logger.error('Error initializing database:', error);
    process.exit(1);
  });
