# Token System Database Schema

## Overview

This document outlines the database schema for the token-based email authentication system. The schema is designed to efficiently store and retrieve tokens, track their usage, and support the policy engine.

## Tables

### tokens

Stores the core token information.

```sql
CREATE TABLE tokens (
    id UUID PRIMARY KEY,
    token VARCHAR(32) NOT NULL UNIQUE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_domain VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    sender_domain VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    revoked_by UUID REFERENCES users(id),
    revocation_reason TEXT,
    last_used_at TIMESTAMP,
    usage_count INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    metadata JSONB
);

CREATE INDEX idx_tokens_recipient_email ON tokens(recipient_email);
CREATE INDEX idx_tokens_sender_email ON tokens(sender_email);
CREATE INDEX idx_tokens_recipient_domain ON tokens(recipient_domain);
CREATE INDEX idx_tokens_sender_domain ON tokens(sender_domain);
CREATE INDEX idx_tokens_status ON tokens(status);
CREATE INDEX idx_tokens_created_at ON tokens(created_at);
CREATE INDEX idx_tokens_expires_at ON tokens(expires_at);
```

### token_authorized_senders

Stores the authorized email servers for each token.

```sql
CREATE TABLE token_authorized_senders (
    id UUID PRIMARY KEY,
    token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(token_id, domain)
);

CREATE INDEX idx_token_authorized_senders_token_id ON token_authorized_senders(token_id);
CREATE INDEX idx_token_authorized_senders_domain ON token_authorized_senders(domain);
```

### token_usage

Tracks the usage of tokens.

```sql
CREATE TABLE token_usage (
    id UUID PRIMARY KEY,
    token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sender_email VARCHAR(255) NOT NULL,
    sender_ip VARCHAR(45),
    sender_helo VARCHAR(255),
    spf_result VARCHAR(20),
    dkim_result VARCHAR(20),
    dmarc_result VARCHAR(20),
    action_taken VARCHAR(20) NOT NULL,
    message_id VARCHAR(255),
    additional_data JSONB
);

CREATE INDEX idx_token_usage_token_id ON token_usage(token_id);
CREATE INDEX idx_token_usage_timestamp ON token_usage(timestamp);
CREATE INDEX idx_token_usage_sender_email ON token_usage(sender_email);
CREATE INDEX idx_token_usage_action_taken ON token_usage(action_taken);
```

### token_requests

Stores token requests from senders.

```sql
CREATE TABLE token_requests (
    id UUID PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    purpose TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    responded_at TIMESTAMP,
    token_id UUID REFERENCES tokens(id),
    denial_reason TEXT,
    redirect_url TEXT,
    metadata JSONB
);

CREATE INDEX idx_token_requests_recipient_email ON token_requests(recipient_email);
CREATE INDEX idx_token_requests_sender_email ON token_requests(sender_email);
CREATE INDEX idx_token_requests_status ON token_requests(status);
CREATE INDEX idx_token_requests_created_at ON token_requests(created_at);
CREATE INDEX idx_token_requests_expires_at ON token_requests(expires_at);
```

### policies

Stores validation policies.

```sql
CREATE TABLE policies (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rules JSONB NOT NULL,
    default_action VARCHAR(20) NOT NULL DEFAULT 'accept',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_policies_name ON policies(name);
CREATE INDEX idx_policies_status ON policies(status);
```

### policy_assignments

Maps policies to recipients, domains, or categories.

```sql
CREATE TABLE policy_assignments (
    id UUID PRIMARY KEY,
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    assignment_type VARCHAR(20) NOT NULL, -- 'recipient', 'domain', 'category'
    assignment_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(policy_id, assignment_type, assignment_value)
);

CREATE INDEX idx_policy_assignments_policy_id ON policy_assignments(policy_id);
CREATE INDEX idx_policy_assignments_type_value ON policy_assignments(assignment_type, assignment_value);
```

### users

Stores user information for authentication and authorization.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    password_hash VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    settings JSONB
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### api_keys

Stores API keys for server-to-server authentication.

```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY,
    key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    permissions JSONB
);

CREATE INDEX idx_api_keys_key ON api_keys(key);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_status ON api_keys(status);
```

### webhooks

Stores webhook configurations.

```sql
CREATE TABLE webhooks (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_triggered_at TIMESTAMP,
    failure_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_status ON webhooks(status);
```

### webhook_deliveries

Tracks webhook delivery attempts.

```sql
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY,
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL,
    status_code INTEGER,
    response_body TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
```

### audit_logs

Tracks important system events for auditing purposes.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## Relationships

### Primary Relationships

- A **token** belongs to a **recipient** and is associated with a **sender**
- A **token** can have multiple **authorized senders**
- A **token** can have multiple **usage records**
- A **token request** can result in a **token** (if approved)
- A **policy** can be assigned to multiple **recipients**, **domains**, or **categories**
- A **user** can have multiple **API keys** and **webhooks**

### Relationship Diagram

```
users
 ├── tokens (created_by, revoked_by)
 ├── policies (created_by, updated_by)
 ├── api_keys
 └── webhooks
     └── webhook_deliveries

tokens
 ├── token_authorized_senders
 ├── token_usage
 └── token_requests

policies
 └── policy_assignments
```

## Data Types

### Token Status

Possible values for `tokens.status`:
- `active`: Token is valid and can be used
- `revoked`: Token has been explicitly revoked
- `expired`: Token has reached its expiration date
- `inactive`: Token is temporarily disabled

### Token Request Status

Possible values for `token_requests.status`:
- `pending`: Request is waiting for recipient approval
- `approved`: Request has been approved and a token created
- `denied`: Request has been denied
- `expired`: Request has expired without a response

### Policy Assignment Types

Possible values for `policy_assignments.assignment_type`:
- `recipient`: Policy applies to a specific recipient email
- `domain`: Policy applies to all recipients in a domain
- `category`: Policy applies to tokens with a specific category

### User Roles

Possible values for `users.role`:
- `admin`: Full system access
- `manager`: Can manage tokens and policies
- `user`: Can manage their own tokens
- `api`: API-only access

## Indexing Strategy

The schema includes indexes for:

1. **Primary lookup patterns**:
   - Finding tokens by token string
   - Finding tokens by recipient or sender
   - Finding tokens by status

2. **Range queries**:
   - Finding tokens by creation date
   - Finding tokens by expiration date

3. **Join optimization**:
   - Foreign key references have corresponding indexes

4. **Filtering**:
   - Common filtering operations (status, type, etc.)

## Data Retention

Consider implementing the following data retention policies:

1. **Token Usage**: Retain for 90 days, then archive or aggregate
2. **Revoked Tokens**: Retain for 30 days after revocation, then archive
3. **Token Requests**: Retain for 30 days after response or expiration
4. **Webhook Deliveries**: Retain for 30 days
5. **Audit Logs**: Retain for 1 year

Implement these policies using:
- Database partitioning by date
- Scheduled jobs to archive or delete old data
- Aggregation of historical data for reporting

## Scaling Considerations

For high-volume deployments:

1. **Sharding**:
   - Shard the `tokens` table by recipient domain
   - Shard the `token_usage` table by date

2. **Caching**:
   - Cache frequently validated tokens
   - Cache policy evaluation results

3. **Read Replicas**:
   - Use read replicas for analytics queries
   - Distribute read load across replicas

4. **Partitioning**:
   - Partition large tables by date
   - Implement automatic partition management
