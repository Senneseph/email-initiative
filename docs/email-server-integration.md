# Email Server Integration

## Overview

This document outlines how the token-based email authentication system integrates with existing email servers. The integration is designed to be minimally invasive, allowing email servers to continue functioning normally while adding token validation capabilities.

## Integration Approaches

### 1. Server Plugin

The preferred integration method is through server-specific plugins that hook into the email processing pipeline.

#### Postfix Integration

For Postfix mail servers, we provide a policy service that integrates with Postfix's `smtpd_recipient_restrictions` mechanism.

**Configuration in `main.cf`:**

```
smtpd_recipient_restrictions =
  check_recipient_access tcp:127.0.0.1:9876,
  ... existing restrictions ...
```

**Plugin Installation:**

1. Install the token validator service:
   ```bash
   apt-get install email-token-validator
   ```

2. Configure the service:
   ```bash
   # /etc/email-token-validator/config.yaml
   api:
     url: https://api.emailtoken.example.com/v1
     key: your_api_key
   
   service:
     listen: 127.0.0.1:9876
     timeout: 5s
   
   validation:
     default_action: accept
     unauthorized_folder: Unauthorized
   ```

3. Enable and start the service:
   ```bash
   systemctl enable email-token-validator
   systemctl start email-token-validator
   ```

#### Exchange Integration

For Microsoft Exchange servers, we provide a transport agent that integrates with the SMTP receive pipeline.

**Installation:**

1. Install the token validator transport agent:
   ```
   TokenValidator.msi
   ```

2. Register the transport agent:
   ```powershell
   Install-TransportAgent -Name "TokenValidator" -TransportAgentFactory "TokenValidator.TokenValidatorFactory" -AssemblyPath "C:\Program Files\TokenValidator\TokenValidator.dll"
   Enable-TransportAgent -Name "TokenValidator"
   ```

3. Configure the agent:
   ```xml
   <!-- C:\Program Files\TokenValidator\config.xml -->
   <TokenValidatorConfig>
     <ApiSettings>
       <Url>https://api.emailtoken.example.com/v1</Url>
       <Key>your_api_key</Key>
     </ApiSettings>
     <ValidationSettings>
       <DefaultAction>Accept</DefaultAction>
       <UnauthorizedFolder>Unauthorized</UnauthorizedFolder>
     </ValidationSettings>
   </TokenValidatorConfig>
   ```

4. Restart the transport service:
   ```powershell
   Restart-Service MSExchangeTransport
   ```

#### Other Mail Servers

Similar plugins are available for other popular mail servers:

- **Sendmail**: Milter-based integration
- **Exim**: Local router/transport integration
- **Dovecot**: Sieve script integration for incoming mail
- **qmail**: Custom patch for recipient verification

### 2. SMTP Proxy

For mail servers without plugin support or where direct modification is not possible, we provide an SMTP proxy that sits between the internet and the mail server.

**Deployment Diagram:**

```
Internet --> [SMTP Proxy] --> [Mail Server]
                  |
                  v
           [Token Validator]
```

**Installation:**

1. Install the SMTP proxy:
   ```bash
   apt-get install email-token-proxy
   ```

2. Configure the proxy:
   ```yaml
   # /etc/email-token-proxy/config.yaml
   proxy:
     listen: 0.0.0.0:25
     target: 127.0.0.1:2525
     timeout: 30s
   
   api:
     url: https://api.emailtoken.example.com/v1
     key: your_api_key
   
   validation:
     default_action: accept
     unauthorized_folder: Unauthorized
   ```

3. Configure your mail server to listen on the internal port (2525) and only accept connections from the proxy.

4. Update DNS MX records to point to the proxy server.

### 3. Milter Integration

For mail servers that support the Milter (Mail Filter) protocol, we provide a Milter-based integration.

**Installation:**

1. Install the token validator milter:
   ```bash
   apt-get install email-token-milter
   ```

2. Configure the milter:
   ```ini
   # /etc/email-token-milter/milter.conf
   [Milter]
   Socket = inet:9877@127.0.0.1
   Timeout = 20
   
   [API]
   Url = https://api.emailtoken.example.com/v1
   Key = your_api_key
   
   [Validation]
   DefaultAction = accept
   UnauthorizedFolder = Unauthorized
   ```

3. Configure your mail server to use the milter:

   **Postfix (`main.cf`):**
   ```
   smtpd_milters = inet:127.0.0.1:9877
   milter_default_action = accept
   ```

   **Sendmail (`sendmail.cf`):**
   ```
   INPUT_MAIL_FILTER(`token-validator', `S=inet:9877@127.0.0.1, F=T')
   ```

4. Restart your mail server.

## Email Processing Flow

Regardless of the integration method, the email processing flow follows these steps:

### Incoming Email Flow

1. **Email Received**: Mail server receives an email.

2. **Token Extraction**:
   - The plugin/proxy extracts the recipient address.
   - If the address follows the format `$token+username@domain.tld`, the token is extracted.
   - If no token is present, the email is processed according to the default policy.

3. **Token Validation**:
   - The plugin/proxy sends the token, sender information, and recipient information to the token validation API.
   - The API checks if the token is valid, active, and associated with the sender.
   - The API returns a validation result and recommended action.

4. **Action Application**:
   - Based on the validation result, the plugin/proxy takes the appropriate action:
     - **Accept**: Deliver the email to the recipient's inbox.
     - **Quarantine**: Deliver the email to the "Unauthorized Emails" folder.
     - **Reject**: Reject the email with an appropriate SMTP error code.
     - **Flag**: Add headers indicating the token status and deliver normally.

5. **Logging and Analytics**:
   - The validation result and action taken are logged.
   - Usage statistics are updated.

### Outgoing Email Flow (Optional)

For full integration, the system can also modify outgoing emails:

1. **Email Submission**: User sends an email.

2. **Token Lookup**:
   - The plugin checks if the sender has a token for the recipient.
   - If a token exists, the plugin modifies the "From" address to include the token.

3. **Email Delivery**:
   - The email is sent with the tokenized address.

## Configuration Options

### Common Configuration Options

All integration methods support these common configuration options:

#### API Configuration

```yaml
api:
  url: https://api.emailtoken.example.com/v1
  key: your_api_key
  timeout: 5s
  retry_count: 3
  retry_delay: 1s
```

#### Validation Configuration

```yaml
validation:
  default_action: accept  # accept, quarantine, reject, flag
  unauthorized_folder: Unauthorized
  add_headers: true
  header_prefix: X-Token-
  cache_results: true
  cache_ttl: 300  # seconds
```

#### Logging Configuration

```yaml
logging:
  level: info  # debug, info, warn, error
  file: /var/log/email-token-validator.log
  max_size: 100  # MB
  max_backups: 5
  max_age: 30  # days
  compress: true
```

### Advanced Configuration

#### Policy Rules

```yaml
policies:
  - name: reject_revoked
    condition: "token.status == 'revoked'"
    action: reject
    priority: 100
  
  - name: quarantine_expired
    condition: "token.status == 'expired'"
    action: quarantine
    priority: 90
  
  - name: flag_first_use
    condition: "token.usage_count == 0"
    action: flag
    priority: 80
    headers:
      X-Token-First-Use: "true"
```

#### Rate Limiting

```yaml
rate_limiting:
  enabled: true
  max_tokens: 100
  window: 60  # seconds
  by_sender_ip: true
  by_sender_domain: true
  action: delay  # delay, reject
```

## Folder Setup

The integration can automatically create special folders for unauthorized emails:

### IMAP Folder Structure

```
INBOX/
├── Unauthorized/
│   ├── Missing_Token/
│   ├── Invalid_Token/
│   ├── Revoked_Token/
│   └── Expired_Token/
└── ...
```

### Folder Creation

The integration can create these folders automatically or use existing folders:

```yaml
folders:
  create_if_missing: true
  unauthorized:
    path: INBOX/Unauthorized
    children:
      - name: Missing_Token
        condition: "token == null"
      - name: Invalid_Token
        condition: "token != null && !token.valid"
      - name: Revoked_Token
        condition: "token.status == 'revoked'"
      - name: Expired_Token
        condition: "token.status == 'expired'"
```

## Headers

The integration adds headers to emails for tracking and filtering:

### Added Headers

```
X-Token-Status: valid
X-Token-ID: 550e8400-e29b-41d4-a716-446655440000
X-Token-Recipient: user@example.com
X-Token-Sender: service@company.com
X-Token-Created: 2023-04-12T15:30:45Z
X-Token-Validation-Result: accept
X-Token-Validation-Time: 0.023s
```

### Header Configuration

```yaml
headers:
  add: true
  prefix: X-Token-
  include:
    - status
    - id
    - recipient
    - sender
    - created
    - validation_result
    - validation_time
```

## Performance Considerations

### Caching

To minimize API calls and improve performance, the integration includes a caching layer:

```yaml
cache:
  enabled: true
  type: memory  # memory, redis
  ttl: 300  # seconds
  max_size: 10000  # entries
  redis:
    url: redis://localhost:6379
    db: 0
```

### Timeout Handling

The integration includes configurable timeout handling:

```yaml
timeouts:
  api: 5s
  total: 10s
  fallback_action: accept  # What to do if API times out
```

### High Availability

For high-volume mail servers, the integration supports high availability configurations:

```yaml
high_availability:
  mode: active_passive  # active_passive, active_active
  heartbeat_interval: 5s
  failover_timeout: 15s
  nodes:
    - host: validator1.example.com
      port: 9876
    - host: validator2.example.com
      port: 9876
```

## Monitoring and Metrics

The integration provides monitoring endpoints and metrics:

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "api_connection": "ok",
  "cache": "ok",
  "uptime": "3d 2h 15m",
  "version": "1.2.3"
}
```

### Metrics

```
GET /metrics
```

Response:
```
# HELP token_validator_requests_total Total number of token validation requests
# TYPE token_validator_requests_total counter
token_validator_requests_total 15423

# HELP token_validator_request_duration_seconds Token validation request duration in seconds
# TYPE token_validator_request_duration_seconds histogram
token_validator_request_duration_seconds_bucket{le="0.005"} 1245
token_validator_request_duration_seconds_bucket{le="0.01"} 10234
token_validator_request_duration_seconds_bucket{le="0.025"} 14321
token_validator_request_duration_seconds_bucket{le="0.05"} 15001
token_validator_request_duration_seconds_bucket{le="0.1"} 15321
token_validator_request_duration_seconds_bucket{le="0.25"} 15410
token_validator_request_duration_seconds_bucket{le="0.5"} 15420
token_validator_request_duration_seconds_bucket{le="1"} 15423
token_validator_request_duration_seconds_bucket{le="+Inf"} 15423
token_validator_request_duration_seconds_sum 123.45
token_validator_request_duration_seconds_count 15423

# HELP token_validator_results Token validation results
# TYPE token_validator_results counter
token_validator_results{result="valid"} 12543
token_validator_results{result="invalid"} 1245
token_validator_results{result="revoked"} 876
token_validator_results{result="expired"} 456
token_validator_results{result="missing"} 303
```

## Troubleshooting

### Common Issues

#### 1. Token Extraction Failures

**Symptoms:**
- Tokens not being extracted from email addresses
- All emails being treated as if they have no token

**Solutions:**
- Check the email address format in logs
- Verify the token extraction regex pattern
- Ensure the mail server is not modifying the recipient address

#### 2. API Connection Issues

**Symptoms:**
- Timeouts when validating tokens
- Fallback actions being taken frequently

**Solutions:**
- Check network connectivity to the API server
- Verify API key is valid
- Check API server logs for errors
- Increase timeout values

#### 3. Performance Problems

**Symptoms:**
- Email delivery delays
- High CPU usage during email processing

**Solutions:**
- Enable caching
- Optimize database queries
- Increase server resources
- Implement load balancing

### Logging

Enable debug logging for troubleshooting:

```yaml
logging:
  level: debug
  file: /var/log/email-token-validator.log
```

Example debug log:
```
2023-04-25T10:15:30Z DEBUG Received email: from=sender@company.com to=$abc123+user@example.com
2023-04-25T10:15:30Z DEBUG Extracted token: abc123
2023-04-25T10:15:30Z DEBUG Validating token: abc123 for sender=sender@company.com recipient=user@example.com
2023-04-25T10:15:30Z DEBUG API request: POST /validate
2023-04-25T10:15:30Z DEBUG API response: {"valid":true,"action":"accept","reason":"valid_token"}
2023-04-25T10:15:30Z INFO  Token valid, delivering to inbox: $abc123+user@example.com
```

### Testing

Use the provided test tools to verify integration:

```bash
# Test token extraction
token-validator-test extract '$abc123+user@example.com'

# Test token validation
token-validator-test validate --token abc123 --sender sender@company.com --recipient user@example.com

# Test full email flow
token-validator-test email --from sender@company.com --to '$abc123+user@example.com' --server localhost:25
```

## Upgrade Process

### Upgrading the Integration

1. Backup the current configuration:
   ```bash
   cp /etc/email-token-validator/config.yaml /etc/email-token-validator/config.yaml.bak
   ```

2. Install the new version:
   ```bash
   apt-get update
   apt-get install --only-upgrade email-token-validator
   ```

3. Review configuration changes:
   ```bash
   diff /etc/email-token-validator/config.yaml.bak /etc/email-token-validator/config.yaml.new
   ```

4. Update your configuration with any new options.

5. Restart the service:
   ```bash
   systemctl restart email-token-validator
   ```

### Rollback Procedure

If issues occur after upgrading:

1. Stop the service:
   ```bash
   systemctl stop email-token-validator
   ```

2. Reinstall the previous version:
   ```bash
   apt-get install email-token-validator=1.2.3  # Specify previous version
   ```

3. Restore the backup configuration:
   ```bash
   cp /etc/email-token-validator/config.yaml.bak /etc/email-token-validator/config.yaml
   ```

4. Start the service:
   ```bash
   systemctl start email-token-validator
   ```
