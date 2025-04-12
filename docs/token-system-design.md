# Token System Design

## Overview

This document outlines the design of the token-based email authentication system. The system allows recipients to control who can send them emails by requiring senders to include a valid token in the email address.

## Token Format

### Email Address Format

```
$token+username@domain.tld
```

Where:
- `$` is a literal dollar sign that indicates a token is present
- `token` is the unique token string associated with the sender
- `+` is the delimiter between the token and username
- `username@domain.tld` is the standard email address

Example:
```
$abc123+john@example.com
```

### Token Structure

Tokens are simple nonces (numbers used once) that serve as identifiers. They don't need to be cryptographically secure but should be:

1. Unique
2. Random enough to prevent guessing
3. Short enough to be practical in email addresses

Recommended format:
```
[a-z0-9]{6,12}
```

Example tokens:
```
abc123
x7y8z9
rt56hn90plm
```

## Token Lifecycle

### Creation

1. A sender requests permission to email a recipient
2. The recipient's email system generates a new token
3. The token is associated with the sender's email server(s)
4. The token is provided to the sender

### Validation

When an email is received:

1. The system extracts the token from the email address
2. The system verifies that the token exists and is valid
3. The system checks that the sender's email server matches the one associated with the token
4. If validation passes, the email is delivered to the inbox
5. If validation fails, the email is delivered to the "Unauthorized Emails" folder or spam

### Revocation

Recipients can revoke tokens at any time through their email client or a web interface. When a token is revoked:

1. The token is marked as invalid in the system
2. Future emails using that token will fail validation
3. The sender would need to request a new token

### Expiration

Tokens can optionally have an expiration date. When a token expires:

1. The token is automatically marked as invalid
2. Future emails using that token will fail validation
3. The sender would need to request a new token

## Sender Verification

To prevent token abuse, the system verifies that the email is coming from the authorized email server(s) associated with the token. This verification can use:

1. SPF (Sender Policy Framework) records
2. DKIM (DomainKeys Identified Mail) signatures
3. DMARC (Domain-based Message Authentication, Reporting & Conformance) policies

If the sender changes their email service provider or server configuration, the token would no longer be valid, requiring a new token to be issued.

## User Experience

### For Recipients

Recipients will have:

1. A list of all active tokens and their associated senders
2. The ability to revoke tokens individually or in bulk
3. Options to set expiration dates for tokens
4. Control over what happens to emails with invalid or missing tokens

### For Senders

Senders will:

1. Need to request tokens from recipients
2. Include the token in the email address when sending emails
3. Need to store and manage tokens for different recipients
4. Have to request new tokens if their email server configuration changes

## Email Delivery

### Valid Token

Emails with valid tokens are delivered to the recipient's inbox normally.

### Invalid or Missing Token

Emails with invalid or missing tokens can be:

1. Delivered to a special "Unauthorized Emails" folder
2. Sent to the spam folder
3. Rejected with a bounce message explaining the token requirement
4. Handled according to recipient-defined policies

## Implementation Considerations

### Email Server Integration

The token validation system can be implemented as:

1. A plugin for popular email servers (Postfix, Exchange, etc.)
2. A proxy that sits in front of existing email servers
3. A service that integrates with email servers via existing filtering mechanisms

### Token Storage

Tokens and their associations should be stored in a database with:

1. Fast lookup capabilities for validation
2. Backup and recovery mechanisms
3. Synchronization across multiple email servers (if applicable)

### User Interface

The system should provide:

1. A web interface for token management
2. Integration with email clients for in-client token management
3. APIs for third-party integration

## Security Considerations

While tokens themselves are not cryptographically secure, the system should:

1. Protect the token database from unauthorized access
2. Implement rate limiting for token validation to prevent brute force attacks
3. Monitor for unusual patterns that might indicate token harvesting or abuse
4. Provide audit logs for token creation, usage, and revocation
