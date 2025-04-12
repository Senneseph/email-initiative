# System Architecture

## Overview

This document describes the high-level architecture of the Email Initiative system. It outlines the major components, their interactions, and the design principles that guide the implementation.

## System Goals

The architecture is designed to achieve the following goals:

1. **Security**: Protect users from unwanted and potentially harmful emails
2. **User Control**: Give recipients control over who can send them emails
3. **Interoperability**: Work with existing email infrastructure
4. **Scalability**: Support adoption from individual users to large organizations
5. **Standardization**: Provide a foundation for an industry standard

## Core Components

### 1. Token Management System

The Token Management System is responsible for creating, validating, and revoking email tokens.

**Key Functions:**
- Generate cryptographically secure tokens
- Associate tokens with sender-recipient pairs
- Validate incoming email tokens
- Process token revocation requests
- Maintain token status database

**Implementation:**
- Core token logic implemented in Rust for performance and security
- API layer in TypeScript
- PostgreSQL database for token storage

### 2. Mail Server Integration

The Mail Server Integration components connect the token system to existing mail server software.

**Key Functions:**
- Intercept incoming emails for token validation
- Modify outgoing emails to include tokens when appropriate
- Apply policy decisions based on token status
- Report token validation results

**Implementation:**
- Plugins for popular mail servers (Postfix, Exchange, etc.)
- Lightweight proxy option for servers without plugin support
- Configuration tools for easy setup

### 3. Protocol Handler

The Protocol Handler manages the standardized interaction for requesting and issuing tokens.

**Key Functions:**
- Process token request URLs (`mailto:$request+user@example.com`)
- Present token request UI to users
- Issue tokens through secure channels
- Register tokens with the Token Management System

**Implementation:**
- Browser extensions for major browsers
- Native OS integration where possible
- Progressive Web App fallback

### 4. User Interface

The User Interface provides tools for users to manage their tokens.

**Key Functions:**
- View active tokens and associated senders
- Revoke tokens individually or in bulk
- Set token policies (auto-expiry, usage limits, etc.)
- Monitor token usage

**Implementation:**
- Progressive Web App built with Web Components
- Responsive design for mobile and desktop
- Accessibility-first approach

### 5. Reputation System

The Reputation System tracks sender behavior to inform trust decisions.

**Key Functions:**
- Monitor attempts to send without valid tokens
- Track token revocation patterns
- Calculate sender trust scores
- Share anonymized reputation data (optional)

**Implementation:**
- Event-driven architecture for real-time updates
- Machine learning for pattern detection
- Privacy-preserving data sharing protocol

## System Interactions

### Email Sending Flow

1. Sender composes email to recipient
2. Sender's mail client/server checks for valid token
3. If token exists, it's included in the email address (`$token+user@example.com`)
4. If no token exists, sender can initiate token request
5. Email is sent through normal channels

### Email Receiving Flow

1. Recipient's mail server receives email
2. Mail server plugin extracts token from address
3. Token is validated with Token Management System
4. Based on token status and policies, email is:
   - Delivered (valid token)
   - Flagged (suspicious token)
   - Rejected (invalid or revoked token)
5. Token usage is logged for reputation tracking

### Token Request Flow

1. Sender initiates token request (web form, email link, etc.)
2. Protocol Handler intercepts request
3. User is presented with token request details
4. If approved, Token Management System generates token
5. Token is returned to sender and associated with recipient
6. Sender can now use token in email address

### Token Revocation Flow

1. Recipient accesses token management UI
2. Recipient selects token(s) to revoke
3. Token Management System updates token status
4. Subsequent emails using revoked token are rejected
5. Revocation pattern is logged for reputation tracking

## Architecture Principles

### 1. Security by Design

- All components follow security best practices
- Cryptographic operations use proven libraries
- Regular security audits and testing
- Defense in depth approach

### 2. Privacy Preservation

- Minimal data collection
- Clear data retention policies
- User control over data sharing
- Anonymization of shared data

### 3. Decentralized Operation

- No central authority required
- Organizations can run their own token systems
- Optional federation for reputation sharing
- Works at individual and organizational levels

### 4. Progressive Enhancement

- Basic functionality works with existing email systems
- Advanced features available with fuller integration
- Graceful degradation when components are missing

### 5. Open Standards

- Protocol specifications are open and documented
- Reference implementations are open source
- Vendor-neutral approach
- Designed for RFC submission

## Technology Stack

### Backend

- **Rust**: Core token logic, performance-critical components
- **TypeScript**: API services, integration logic
- **PostgreSQL**: Primary data storage
- **Redis**: Caching and real-time features

### Frontend

- **TypeScript**: Client-side logic
- **Web Components**: UI components (Custom Elements API)
- **Progressive Web App**: For token management interface

### Infrastructure

- **Docker**: Containerized deployment
- **Kubernetes**: Orchestration for larger deployments
- **CI/CD**: Automated testing and deployment

## Deployment Models

### 1. Individual User

- Browser extension for token requests
- Local token management app
- Integration with personal email client

### 2. Small Organization

- Self-hosted token server
- Mail server plugin
- Web-based token management

### 3. Enterprise

- Distributed token management system
- Multiple mail server integrations
- Advanced policy controls
- SSO integration

### 4. Email Service Provider

- Integrated token management
- Native mail server integration
- Customer-facing token controls
- Reputation system participation

## Security Considerations

- **Token Encryption**: Tokens are cryptographically secure
- **Man-in-the-Middle Protection**: Secure channels for token exchange
- **Replay Prevention**: Tokens include usage limitations
- **Brute Force Resistance**: Rate limiting and monitoring
- **Phishing Protection**: Clear UI for token requests

## Performance Considerations

- **Validation Speed**: Token validation adds minimal latency
- **Scalability**: System scales horizontally for large deployments
- **Caching**: Frequently used tokens cached for performance
- **Asynchronous Processing**: Non-critical operations performed asynchronously

## Future Extensions

- **AI-Powered Filtering**: Machine learning for advanced filtering
- **Domain-Level Policies**: Organization-wide token policies
- **Integration API**: Third-party application integration
- **Mobile Apps**: Native mobile experiences
- **Hardware Security**: Hardware token support

---

This architecture document will evolve as the system is implemented and refined based on real-world feedback and testing.
