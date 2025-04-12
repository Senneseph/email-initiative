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

## Project Structure

## Getting Started

To begin working with this project:

1. Clone the repository
2. Run `docker-compose up -d` to build, test, and serve the application
3. Access the application at `http://localhost:$APP_PORT` where $APP_PORT is specified in your `.env` or `default.env` file

## Development

This project follows a specification-first approach with strict adherence to the style guide. Key technologies include:

- TypeScript and Rust (with WASM as target) for implementation
- Functional programming with strict typing
- Event-driven architecture
- Web Components (Custom Elements API)

## Contributing

Contributions to this project should follow the process outlined in [CONTRIBUTING.md](./CONTRIBUTING.md). Please respect this repository's code style and structure.

## Future Plans

- Create a formal RFC for the email token system
- Develop reference implementations for popular mail servers
- Build a comprehensive trust and reputation system
- Create user-friendly interfaces for token management

## License

[License information to be determined]

---

For more information, contact [Contact information to be determined]
