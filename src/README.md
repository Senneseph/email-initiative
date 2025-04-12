# Email Token System - Source Code

This directory contains the source code for the Email Token System, a system of revocable tokens for email authentication.

## Project Structure

The project is organized into the following directories:

### `/api`

Contains the API routes for the application:

- `token-routes.ts`: Routes for token management (create, get, update, revoke, delete)
- `validate-routes.ts`: Routes for token validation
- `health-routes.ts`: Routes for health checks and monitoring

### `/db`

Contains database-related code:

- `connection.ts`: Database connection and query utilities
- `schema.sql`: SQL schema for the database
- `init.ts`: Database initialization script

### `/email-parser`

Contains code for parsing and manipulating email addresses:

- `email-parser.ts`: Utilities for parsing tokenized email addresses and extracting components

### `/token-service`

Contains the core token management logic:

- `token-generator.ts`: Utilities for generating tokens and IDs
- `token-repository.ts`: Data access layer for token operations
- `token-validator.ts`: Logic for validating tokens

### `/types`

Contains TypeScript type definitions:

- `token.ts`: Types for tokens, validation requests, and responses

### `/utils`

Contains utility functions:

- `logger.ts`: Logging utilities
- `error-handler.ts`: Error handling middleware and custom error classes

### `index.ts`

The main entry point for the application.

## Getting Started

1. Install dependencies:

   ```text
   npm install
   ```

2. Set up the database:
   - Create a PostgreSQL database
   - Update the `.env` file with your database credentials

3. Start the development server:

   ```text
   npm run dev
   ```

4. Build for production:

   ```text
   npm run build
   ```

5. Start the production server:

   ```text
   npm start
   ```

## API Endpoints

### Token Management

- `POST /api/tokens`: Create a new token
- `GET /api/tokens/:id`: Get a token by ID
- `GET /api/tokens`: Get tokens for a recipient
- `PATCH /api/tokens/:id`: Update a token
- `POST /api/tokens/:id/revoke`: Revoke a token
- `DELETE /api/tokens/:id`: Delete a token

### Token Validation

- `POST /api/validate`: Validate a token
- `POST /api/validate/batch`: Batch validate tokens

### Health Checks

- `GET /api/health`: Basic health check
- `GET /api/health/details`: Detailed health check

## Environment Variables

The application uses the following environment variables:

- `PORT`: The port to listen on (default: 3000)
- `NODE_ENV`: The environment (development, production, test)
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: Secret for JWT tokens
- `JWT_EXPIRES_IN`: JWT expiration time
- `TOKEN_LENGTH`: Length of generated tokens
- `TOKEN_EXPIRATION_DAYS`: Default token expiration in days
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

These can be set in a `.env` file in the root directory.
