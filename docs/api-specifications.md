# Token System API Specifications

## Overview

This document outlines the API specifications for the token-based email authentication system. These APIs enable token management, validation, and integration with email servers and clients.

## Base URL

All API endpoints are relative to the base URL:

```
https://api.emailtoken.example.com/v1
```

## Authentication

Most API endpoints require authentication using one of the following methods:

- **API Key**: For server-to-server communication
- **OAuth 2.0**: For user-facing applications
- **JWT**: For authenticated sessions

Include authentication in the request header:

```
Authorization: Bearer {token}
```

## Token Management API

### Create Token

Creates a new token for a recipient-sender pair.

**Endpoint:** `POST /tokens`

**Request:**
```json
{
  "recipient_email": "user@example.com",
  "sender_email": "service@company.com",
  "sender_domains": ["company.com", "mail.company.com"],
  "expires_at": "2024-12-31T23:59:59Z",
  "description": "Company Newsletter",
  "metadata": {
    "category": "newsletter",
    "requested_by": "user@example.com"
  }
}
```

**Response:**
```json
{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "abc123",
  "tokenized_address": "$abc123+user@example.com",
  "status": "active",
  "created_at": "2023-04-12T15:30:45Z",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

### Get Token

Retrieves information about a specific token.

**Endpoint:** `GET /tokens/{token_id}`

**Response:**
```json
{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "abc123",
  "recipient_email": "user@example.com",
  "sender_email": "service@company.com",
  "sender_domains": ["company.com", "mail.company.com"],
  "status": "active",
  "created_at": "2023-04-12T15:30:45Z",
  "expires_at": "2024-12-31T23:59:59Z",
  "last_used_at": "2023-04-15T10:22:33Z",
  "usage_count": 5,
  "description": "Company Newsletter",
  "metadata": {
    "category": "newsletter",
    "requested_by": "user@example.com"
  }
}
```

### List Tokens

Retrieves a list of tokens for a recipient.

**Endpoint:** `GET /tokens`

**Query Parameters:**
- `recipient_email` (required): Email address of the recipient
- `status` (optional): Filter by token status (active, revoked, expired)
- `page` (optional): Page number for pagination
- `limit` (optional): Number of tokens per page

**Response:**
```json
{
  "tokens": [
    {
      "token_id": "550e8400-e29b-41d4-a716-446655440000",
      "token": "abc123",
      "sender_email": "service@company.com",
      "status": "active",
      "created_at": "2023-04-12T15:30:45Z",
      "expires_at": "2024-12-31T23:59:59Z",
      "description": "Company Newsletter"
    },
    {
      "token_id": "660e8400-e29b-41d4-a716-446655440001",
      "token": "def456",
      "sender_email": "support@anothercompany.com",
      "status": "active",
      "created_at": "2023-03-10T09:15:22Z",
      "expires_at": null,
      "description": "Support Tickets"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

### Revoke Token

Revokes a token, preventing its future use.

**Endpoint:** `POST /tokens/{token_id}/revoke`

**Request:**
```json
{
  "reason": "No longer needed",
  "notify_sender": false
}
```

**Response:**
```json
{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "revoked",
  "revoked_at": "2023-04-20T14:25:10Z",
  "reason": "No longer needed"
}
```

### Update Token

Updates token properties.

**Endpoint:** `PATCH /tokens/{token_id}`

**Request:**
```json
{
  "expires_at": "2025-12-31T23:59:59Z",
  "description": "Updated description",
  "metadata": {
    "category": "important",
    "priority": "high"
  }
}
```

**Response:**
```json
{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "abc123",
  "status": "active",
  "expires_at": "2025-12-31T23:59:59Z",
  "description": "Updated description",
  "metadata": {
    "category": "important",
    "priority": "high"
  }
}
```

## Token Validation API

### Validate Token

Validates a token for an incoming email.

**Endpoint:** `POST /validate`

**Request:**
```json
{
  "token": "abc123",
  "recipient_email": "user@example.com",
  "sender_email": "service@company.com",
  "sender_ip": "192.168.1.1",
  "sender_helo": "mail.company.com",
  "spf_result": "pass",
  "dkim_result": "pass",
  "dmarc_result": "pass"
}
```

**Response:**
```json
{
  "valid": true,
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "accept",
  "reason": "valid_token",
  "confidence": 0.98,
  "metadata": {
    "category": "newsletter"
  }
}
```

### Batch Validate Tokens

Validates multiple tokens in a single request.

**Endpoint:** `POST /validate/batch`

**Request:**
```json
{
  "validations": [
    {
      "token": "abc123",
      "recipient_email": "user1@example.com",
      "sender_email": "service@company.com"
    },
    {
      "token": "def456",
      "recipient_email": "user2@example.com",
      "sender_email": "support@company.com"
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "valid": true,
      "token_id": "550e8400-e29b-41d4-a716-446655440000",
      "action": "accept",
      "reason": "valid_token"
    },
    {
      "valid": false,
      "token_id": "660e8400-e29b-41d4-a716-446655440001",
      "action": "reject",
      "reason": "token_revoked"
    }
  ]
}
```

## Token Request API

### Create Token Request

Creates a request for a new token.

**Endpoint:** `POST /requests`

**Request:**
```json
{
  "recipient_email": "user@example.com",
  "sender_email": "service@company.com",
  "purpose": "Newsletter subscription",
  "redirect_url": "https://company.com/token-confirmation",
  "metadata": {
    "source": "website_signup",
    "campaign": "spring_2023"
  }
}
```

**Response:**
```json
{
  "request_id": "770e8400-e29b-41d4-a716-446655440002",
  "status": "pending",
  "created_at": "2023-04-22T11:45:30Z",
  "expires_at": "2023-04-29T11:45:30Z",
  "request_url": "https://emailtoken.example.com/approve/770e8400-e29b-41d4-a716-446655440002"
}
```

### Get Token Request

Retrieves information about a token request.

**Endpoint:** `GET /requests/{request_id}`

**Response:**
```json
{
  "request_id": "770e8400-e29b-41d4-a716-446655440002",
  "recipient_email": "user@example.com",
  "sender_email": "service@company.com",
  "purpose": "Newsletter subscription",
  "status": "pending",
  "created_at": "2023-04-22T11:45:30Z",
  "expires_at": "2023-04-29T11:45:30Z",
  "metadata": {
    "source": "website_signup",
    "campaign": "spring_2023"
  }
}
```

### Approve Token Request

Approves a token request and creates a new token.

**Endpoint:** `POST /requests/{request_id}/approve`

**Request:**
```json
{
  "expires_at": "2024-12-31T23:59:59Z",
  "description": "Approved from request"
}
```

**Response:**
```json
{
  "request_id": "770e8400-e29b-41d4-a716-446655440002",
  "status": "approved",
  "approved_at": "2023-04-22T14:30:15Z",
  "token": {
    "token_id": "880e8400-e29b-41d4-a716-446655440003",
    "token": "ghi789",
    "tokenized_address": "$ghi789+user@example.com",
    "status": "active",
    "created_at": "2023-04-22T14:30:15Z",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
```

### Deny Token Request

Denies a token request.

**Endpoint:** `POST /requests/{request_id}/deny`

**Request:**
```json
{
  "reason": "Do not want to receive these emails"
}
```

**Response:**
```json
{
  "request_id": "770e8400-e29b-41d4-a716-446655440002",
  "status": "denied",
  "denied_at": "2023-04-22T14:35:22Z",
  "reason": "Do not want to receive these emails"
}
```

## Policy Management API

### Create Policy

Creates a new validation policy.

**Endpoint:** `POST /policies`

**Request:**
```json
{
  "name": "Marketing Emails",
  "description": "Policy for handling marketing emails",
  "rules": [
    {
      "condition": "token.status == 'revoked'",
      "action": "reject",
      "priority": 100
    },
    {
      "condition": "sender.dmarc_result != 'pass'",
      "action": "quarantine",
      "priority": 90
    }
  ],
  "default_action": "accept",
  "applies_to": {
    "recipients": ["user@example.com"],
    "domains": ["example.com"],
    "categories": ["marketing"]
  }
}
```

**Response:**
```json
{
  "policy_id": "990e8400-e29b-41d4-a716-446655440004",
  "name": "Marketing Emails",
  "status": "active",
  "created_at": "2023-04-23T09:12:45Z"
}
```

### Get Policy

Retrieves information about a policy.

**Endpoint:** `GET /policies/{policy_id}`

**Response:**
```json
{
  "policy_id": "990e8400-e29b-41d4-a716-446655440004",
  "name": "Marketing Emails",
  "description": "Policy for handling marketing emails",
  "rules": [
    {
      "condition": "token.status == 'revoked'",
      "action": "reject",
      "priority": 100
    },
    {
      "condition": "sender.dmarc_result != 'pass'",
      "action": "quarantine",
      "priority": 90
    }
  ],
  "default_action": "accept",
  "applies_to": {
    "recipients": ["user@example.com"],
    "domains": ["example.com"],
    "categories": ["marketing"]
  },
  "status": "active",
  "created_at": "2023-04-23T09:12:45Z",
  "updated_at": "2023-04-23T09:12:45Z"
}
```

## Analytics API

### Get Token Usage

Retrieves usage statistics for a token.

**Endpoint:** `GET /analytics/tokens/{token_id}/usage`

**Query Parameters:**
- `start_date` (optional): Start date for the analysis period
- `end_date` (optional): End date for the analysis period
- `interval` (optional): Grouping interval (day, week, month)

**Response:**
```json
{
  "token_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_usage": 42,
  "first_used_at": "2023-04-15T10:22:33Z",
  "last_used_at": "2023-04-22T16:45:12Z",
  "usage_by_interval": [
    {
      "interval": "2023-04-15",
      "count": 5
    },
    {
      "interval": "2023-04-16",
      "count": 8
    },
    {
      "interval": "2023-04-17",
      "count": 12
    }
  ]
}
```

### Get System Statistics

Retrieves system-wide statistics.

**Endpoint:** `GET /analytics/system`

**Query Parameters:**
- `start_date` (optional): Start date for the analysis period
- `end_date` (optional): End date for the analysis period
- `interval` (optional): Grouping interval (day, week, month)

**Response:**
```json
{
  "total_tokens": 1245,
  "active_tokens": 1156,
  "revoked_tokens": 89,
  "total_validations": 45678,
  "validation_results": {
    "accept": 42567,
    "reject": 2345,
    "quarantine": 766
  },
  "validations_by_interval": [
    {
      "interval": "2023-04-15",
      "count": 1523,
      "accept": 1423,
      "reject": 78,
      "quarantine": 22
    },
    {
      "interval": "2023-04-16",
      "count": 1645,
      "accept": 1534,
      "reject": 89,
      "quarantine": 22
    }
  ]
}
```

## Error Responses

All API endpoints use standard HTTP status codes and return error details in a consistent format:

```json
{
  "error": {
    "code": "invalid_token",
    "message": "The provided token is invalid or has been revoked",
    "details": {
      "token": "abc123",
      "status": "revoked",
      "revoked_at": "2023-04-20T14:25:10Z"
    }
  }
}
```

Common error codes:

- `invalid_request`: The request was malformed or missing required parameters
- `authentication_required`: Authentication is required for this endpoint
- `permission_denied`: The authenticated user doesn't have permission
- `resource_not_found`: The requested resource doesn't exist
- `validation_failed`: The request failed validation checks
- `rate_limit_exceeded`: The client has exceeded rate limits
- `internal_error`: An internal server error occurred

## Webhooks

The system can send webhook notifications for various events:

### Webhook Configuration

**Endpoint:** `POST /webhooks`

**Request:**
```json
{
  "url": "https://example.com/webhook-handler",
  "secret": "webhook_signing_secret",
  "events": [
    "token.created",
    "token.used",
    "token.revoked",
    "request.created",
    "request.approved",
    "request.denied"
  ]
}
```

**Response:**
```json
{
  "webhook_id": "aa0e8400-e29b-41d4-a716-446655440005",
  "url": "https://example.com/webhook-handler",
  "events": [
    "token.created",
    "token.used",
    "token.revoked",
    "request.created",
    "request.approved",
    "request.denied"
  ],
  "status": "active",
  "created_at": "2023-04-24T10:15:30Z"
}
```

### Webhook Payload

```json
{
  "event": "token.used",
  "timestamp": "2023-04-24T15:30:45Z",
  "data": {
    "token_id": "550e8400-e29b-41d4-a716-446655440000",
    "token": "abc123",
    "recipient_email": "user@example.com",
    "sender_email": "service@company.com",
    "validation_result": {
      "valid": true,
      "action": "accept",
      "reason": "valid_token"
    }
  }
}
```

## Rate Limits

API endpoints have rate limits to prevent abuse:

- Token Management API: 100 requests per minute
- Token Validation API: 1000 requests per minute
- Token Request API: 50 requests per minute
- Policy Management API: 20 requests per minute
- Analytics API: 10 requests per minute

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1682345400
```

When a rate limit is exceeded, the API returns a 429 Too Many Requests status code.
