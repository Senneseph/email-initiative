# Email Initiative

A project to solve the email problem through revocable tokens, improving security and reducing unwanted emails.

## Overview

The Email Initiative aims to address the growing problems with email communication: security vulnerabilities, unwanted messages, and lack of sender accountability. By implementing a system of revocable tokens that govern email acceptance, we create a more secure, user-controlled email ecosystem.

## Key Features

- **Revocable Email Tokens**: Instead of providing an email address, users provide a revocable token
- **User Control**: Recipients can revoke tokens to stop receiving emails from specific senders
- **Reputation System**: Track senders who attempt to bypass token requirements
- **Trust-Based Framework**: Mail servers can implement trust decisions based on sender behavior
- **Standard Protocol**: Designed to become an RFC standard for wide adoption

## How It Works

1. When signing up for email communications, instead of just providing an email address, a revocable token is added to the address (e.g., `$<token+user@example.com>` instead of `<user@example.com>`)
2. Website proprietors can initiate an OS-managed email token request using standard protocol handling
3. When a recipient no longer wishes to receive emails from a sender, they can revoke the token
4. Mail servers can implement policies based on token validity and sender reputation

## Implementation

The project is implemented as a Node.js application with TypeScript. It provides a RESTful API for token management and validation, and can be integrated with email servers through plugins or proxies.

### Key Components

- **Token Service**: Generates and validates tokens
- **Email Parser**: Parses and tokenizes email addresses
- **API**: RESTful endpoints for token operations
- **Database**: Stores tokens and validation history

### Technology Stack

- **Backend**: Node.js with TypeScript
- **Database**: PostgreSQL
- **API**: Express.js
- **Validation**: Zod
- **Logging**: Winston
- **Containerization**: Docker

## Project Structure

```text
├── docs/                 # Documentation
├── src/                  # Source code
│   ├── api/              # API routes
│   ├── db/               # Database code
│   ├── email-parser/     # Email parsing utilities
│   ├── token-service/    # Token management logic
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── index.ts          # Application entry point
├── .env                  # Environment variables
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile            # Docker configuration
└── package.json          # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 15 or higher
- Docker and Docker Compose (optional)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/email-initiative.git
   cd email-initiative
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   # Edit .env with your configuration
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

### Using Docker

1. Start the services:

   ```bash
   docker-compose up -d
   ```

2. Access the API at <http://localhost:3000>

3. Access Adminer (database management) at <http://localhost:8080>

## Development

This project follows a specification-first approach with strict adherence to the style guide. Key technologies include:

- TypeScript and Rust (with WASM as target) for implementation
- Functional programming with strict typing
- Event-driven architecture
- Web Components (Custom Elements API)

## Documentation

- [API Documentation](docs/api-specifications.md)
- [Token System Design](docs/token-system-design.md)
- [Database Schema](docs/database-schema.md)
- [Email Server Integration](docs/email-server-integration.md)
- [User Interface](docs/user-interface.md)

## Status

This project is currently in the implementation phase. The core token system is being developed, with email server integration to follow.

## License

[License information to be determined]
