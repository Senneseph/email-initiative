# Scripts

This directory contains utility scripts for the Email Token System.

## Available Scripts

### Database Initialization

Initializes the database schema:

```bash
npm run db:init
```

This script:
1. Connects to the database using the credentials in the `.env` file
2. Creates the necessary tables if they don't exist
3. Creates indexes for optimal performance
4. Sets up triggers for automatic timestamp updates

### Running Tests

Run all tests:

```bash
npm test
```

Run tests in watch mode (automatically re-run when files change):

```bash
npm run test:watch
```

Generate test coverage report:

```bash
npm run test:coverage
```

### Building and Running

Build the application:

```bash
npm run build
```

Start the application in production mode:

```bash
npm start
```

Start the application in development mode (with hot reloading):

```bash
npm run dev
```

### Code Quality

Lint the code:

```bash
npm run lint
```

Format the code:

```bash
npm run format
```
