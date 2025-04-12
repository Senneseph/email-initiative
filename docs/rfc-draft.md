# RFC Draft: Email Token Authentication System (ETAS)

## Abstract

This document proposes a standard for email authentication using revocable tokens embedded in email addresses. The Email Token Authentication System (ETAS) allows recipients to control who can send them emails by requiring senders to include a valid token in the email address. This approach reduces unwanted emails, enhances security, and provides recipients with greater control over their inboxes.

## Status of This Memo

This document is a draft proposal for an Internet Standard.

## Copyright Notice

Copyright (c) 2023 Email Initiative. All rights reserved.

## Table of Contents

1. Introduction
2. Terminology
3. Token Format
4. Token Lifecycle
5. Email Processing
6. Security Considerations
7. Privacy Considerations
8. IANA Considerations
9. References
10. Acknowledgments

## 1. Introduction

### 1.1. Background

Email has become a victim of its own success. What was once a revolutionary communication tool has evolved into a source of frustration, security vulnerabilities, and information overload for many users. The fundamental issues include:

1. Unwanted Communication: Users receive excessive amounts of unsolicited or low-value emails
2. Security Vulnerabilities: Email remains a primary vector for phishing, malware, and other attacks
3. Lack of User Control: Recipients have limited ability to manage who can contact them
4. Sender Accountability: There are insufficient consequences for abusive sending practices
5. Trust Deficit: Users increasingly distrust email communications, even legitimate ones

### 1.2. Motivation

The Email Token Authentication System (ETAS) addresses these issues by introducing a paradigm shift in email communication through a system of revocable tokens. Instead of providing a standard email address that becomes a permanent point of contact, users provide tokenized addresses. Each token represents a revocable permission to communicate with the recipient.

### 1.3. Goals

The goals of ETAS are to:

1. Reduce unwanted and malicious emails
2. Enhance email security
3. Give recipients control over their inbox
4. Create accountability for senders
5. Restore trust in email as a communication channel
6. Work with existing email infrastructure

### 1.4. Non-Goals

ETAS is not intended to:

1. Replace existing email authentication mechanisms (SPF, DKIM, DMARC)
2. Solve all spam problems
3. Provide end-to-end encryption
4. Change the fundamental SMTP protocol

## 2. Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

- Token: A unique identifier that grants permission to send email to a recipient
- Tokenized Address: An email address that includes a token
- Sender: An entity that sends email
- Recipient: An entity that receives email
- Token Management System: A system that creates, validates, and revokes tokens
- Mail Server Integration: Components that connect the token system to mail servers

## 3. Token Format

### 3.1. Tokenized Address Format

The format for a tokenized email address is:

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

### 3.2. Token Structure

Tokens MUST be:

1. Unique within the recipient's domain
2. Random enough to prevent guessing
3. Short enough to be practical in email addresses

The RECOMMENDED token format is:

```
[a-z0-9]{6,12}
```

Examples:
```
abc123
x7y8z9
rt56hn90plm
```

### 3.3. Alternative Formats

Implementations MAY support alternative formats for tokenized addresses:

#### 3.3.1. Subdomain Format

```
username@token.domain.tld
```

Example:
```
john@abc123.example.com
```

#### 3.3.2. Local Part Format

```
username-token@domain.tld
```

Example:
```
john-abc123@example.com
```

### 3.4. Format Considerations

When choosing a format, implementations SHOULD consider:

1. Compatibility with existing email systems
2. Ease of token extraction
3. User experience when sharing email addresses
4. Potential conflicts with existing email address formats

## 4. Token Lifecycle

### 4.1. Token Creation

Tokens are created through the following process:

1. A sender requests permission to email a recipient
2. The recipient's token management system generates a new token
3. The token is associated with the sender's email server(s)
4. The token is provided to the sender

The token creation process SHOULD include:

1. Verification of the sender's identity
2. Clear communication of the token's purpose and limitations
3. Association of the token with specific sender domains
4. Optional expiration date or usage limits

### 4.2. Token Validation

When an email is received, the token is validated through the following process:

1. The mail server extracts the token from the email address
2. The token management system verifies that the token exists and is valid
3. The system checks that the sender's email server matches the one associated with the token
4. If validation passes, the email is delivered to the inbox
5. If validation fails, the email is handled according to recipient policies

Token validation SHOULD include:

1. Verification of token existence
2. Checking token status (active, revoked, expired)
3. Verification of sender authorization
4. Logging of token usage

### 4.3. Token Revocation

Recipients can revoke tokens at any time through the following process:

1. The recipient indicates which token to revoke
2. The token management system marks the token as invalid
3. Future emails using that token will fail validation
4. Optionally, the sender is notified of the revocation

Token revocation SHOULD:

1. Take effect immediately
2. Be permanent unless explicitly renewed
3. Include a reason for revocation (optional)
4. Be logged for auditing purposes

### 4.4. Token Expiration

Tokens MAY have an expiration date. When a token expires:

1. The token is automatically marked as invalid
2. Future emails using that token will fail validation
3. The sender would need to request a new token

Implementations SHOULD:

1. Allow recipients to set expiration dates for tokens
2. Notify senders before tokens expire
3. Provide mechanisms for token renewal

## 5. Email Processing

### 5.1. Sending Process

When sending an email to a tokenized address:

1. The sender includes the token in the recipient's email address
2. The email is sent through normal SMTP channels
3. No modifications to the email content are required

Senders SHOULD:

1. Store tokens securely
2. Use the correct token for each recipient
3. Handle token errors appropriately
4. Request new tokens when needed

### 5.2. Receiving Process

When receiving an email with a tokenized address:

1. The mail server extracts the token from the recipient address
2. The token is validated against the token management system
3. Based on the validation result, the email is:
   - Delivered to the inbox (valid token)
   - Delivered to a special folder (invalid or missing token)
   - Rejected with an appropriate error (optional)

Mail servers SHOULD:

1. Extract tokens accurately from different address formats
2. Validate tokens efficiently to minimize processing delays
3. Apply recipient-defined policies for invalid tokens
4. Log token validation results

### 5.3. Handling Invalid Tokens

When a token is invalid (revoked, expired, or non-existent), the mail server SHOULD handle the email according to recipient preferences:

1. Deliver to a special "Unauthorized" folder
2. Deliver to the spam folder
3. Reject with an SMTP error
4. Add headers indicating token status and deliver normally

### 5.4. Token Request Protocol

The token request protocol defines how senders request tokens from recipients:

1. The sender initiates a token request through:
   - A web form
   - An email to a special address (e.g., `$request+user@example.com`)
   - A standardized mailto: link
2. The recipient reviews the request
3. If approved, a token is generated and provided to the sender

The token request protocol SHOULD:

1. Include sender identification information
2. Explain the purpose of the requested token
3. Allow the recipient to set token parameters
4. Provide secure delivery of the token to the sender

## 6. Security Considerations

### 6.1. Token Generation

Tokens MUST be generated using a secure random number generator to prevent guessing or prediction. The token space should be large enough to make brute force attacks impractical.

### 6.2. Token Storage

Tokens SHOULD be stored securely with appropriate access controls. While tokens themselves are not secrets (they are visible in email addresses), the token database should be protected to prevent unauthorized modifications.

### 6.3. Sender Verification

To prevent token abuse, implementations SHOULD verify that emails come from the authorized sender associated with the token. This verification can use:

1. SPF (Sender Policy Framework) records
2. DKIM (DomainKeys Identified Mail) signatures
3. DMARC (Domain-based Message Authentication, Reporting & Conformance) policies

### 6.4. Rate Limiting

Implementations SHOULD implement rate limiting for token validation to prevent denial of service attacks or token harvesting attempts.

### 6.5. Token Enumeration

To prevent token enumeration attacks, implementations SHOULD:

1. Not disclose whether a token exists in error messages
2. Rate limit token validation requests
3. Monitor for patterns that might indicate token harvesting

### 6.6. Phishing Considerations

The token system introduces new possibilities for phishing attacks. Implementations SHOULD:

1. Educate users about legitimate token request processes
2. Provide clear user interfaces for token requests
3. Implement anti-phishing measures in token request interfaces

## 7. Privacy Considerations

### 7.1. Data Collection

Token management systems SHOULD collect only the minimum data necessary for token validation. This typically includes:

1. Token string
2. Recipient email address
3. Authorized sender information
4. Token status and metadata

### 7.2. Data Retention

Implementations SHOULD:

1. Define clear data retention policies
2. Retain token usage data only as long as necessary
3. Allow recipients to delete their token data
4. Anonymize or aggregate historical data

### 7.3. Sender Privacy

The token system reveals information about sender-recipient relationships. Implementations SHOULD:

1. Protect the list of tokens associated with a recipient
2. Not disclose recipient token policies to senders
3. Limit information in token validation responses

### 7.4. Recipient Privacy

Tokenized addresses can potentially be used to track recipients across services. Recipients SHOULD be advised to:

1. Use different tokens for different senders
2. Revoke tokens that are no longer needed
3. Be cautious about sharing tokenized addresses

## 8. IANA Considerations

### 8.1. Email Address Format

This document defines a new email address format using the `$` character as a prefix and the `+` character as a delimiter. These characters are already allowed in the local part of email addresses according to RFC 5322.

### 8.2. SMTP Error Codes

No new SMTP error codes are defined by this specification. Implementations SHOULD use existing error codes when rejecting emails with invalid tokens.

## 9. References

### 9.1. Normative References

[RFC2119] Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", BCP 14, RFC 2119, March 1997.

[RFC5321] Klensin, J., "Simple Mail Transfer Protocol", RFC 5321, October 2008.

[RFC5322] Resnick, P., "Internet Message Format", RFC 5322, October 2008.

### 9.2. Informative References

[RFC7208] Kitterman, S., "Sender Policy Framework (SPF) for Authorizing Use of Domains in Email, Version 1", RFC 7208, April 2014.

[RFC6376] Crocker, D., Hansen, T., and M. Kucherawy, "DomainKeys Identified Mail (DKIM) Signatures", RFC 6376, September 2011.

[RFC7489] Kucherawy, M. and E. Zwicky, "Domain-based Message Authentication, Reporting, and Conformance (DMARC)", RFC 7489, March 2015.

## 10. Acknowledgments

The authors thank the following individuals for their contributions to this document:

[List of contributors]

## Authors' Addresses

[Author information]

## Appendix A. Implementation Examples

### A.1. Token Management System

```python
# Example token generation function
def generate_token(length=8):
    """Generate a random token of specified length."""
    import secrets
    import string
    alphabet = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

# Example token validation function
def validate_token(token, sender_email, recipient_email):
    """Validate a token for the given sender and recipient."""
    # 1. Check if token exists
    token_record = database.find_token(token)
    if not token_record:
        return {"valid": False, "reason": "token_not_found"}
    
    # 2. Check if token is active
    if token_record.status != "active":
        return {"valid": False, "reason": token_record.status}
    
    # 3. Check if token has expired
    if token_record.expires_at and token_record.expires_at < current_time():
        return {"valid": False, "reason": "token_expired"}
    
    # 4. Check if sender is authorized
    if not is_sender_authorized(token_record, sender_email):
        return {"valid": False, "reason": "sender_not_authorized"}
    
    # 5. Token is valid
    return {"valid": True, "reason": "valid_token"}
```

### A.2. Mail Server Integration

```python
# Example Postfix policy server for token validation
def process_policy_request(request):
    """Process a Postfix policy request."""
    # Extract recipient address
    recipient = request.get("recipient", "")
    
    # Extract token from recipient address
    token_match = re.match(r'\$([a-z0-9]+)\+(.+)@(.+)', recipient)
    if not token_match:
        # No token in address
        return {"action": "DUNNO"}
    
    token = token_match.group(1)
    username = token_match.group(2)
    domain = token_match.group(3)
    
    # Extract sender information
    sender = request.get("sender", "")
    
    # Validate token
    result = validate_token(token, sender, f"{username}@{domain}")
    
    if result["valid"]:
        # Token is valid, accept the email
        return {"action": "DUNNO"}
    else:
        # Token is invalid, handle according to policy
        if policy.get_action(result["reason"]) == "reject":
            return {"action": "REJECT", "message": "Invalid token"}
        elif policy.get_action(result["reason"]) == "quarantine":
            return {"action": "PREPEND", "prepend": "X-Token-Status: Invalid"}
        else:
            return {"action": "DUNNO"}
```

## Appendix B. Token Request Examples

### B.1. Web Form Request

```html
<form action="https://token.example.com/request" method="post">
  <label for="recipient">Recipient:</label>
  <input type="email" id="recipient" name="recipient" required>
  
  <label for="sender">Your Email:</label>
  <input type="email" id="sender" name="sender" required>
  
  <label for="purpose">Purpose:</label>
  <input type="text" id="purpose" name="purpose" required>
  
  <button type="submit">Request Token</button>
</form>
```

### B.2. Email Request

```
To: $request+user@example.com
From: sender@company.com
Subject: Token Request

I would like to request a token to send emails to your address.

Purpose: Newsletter subscription
Company: Example Company
Website: https://example.com
```

### B.3. Mailto Link

```
<a href="mailto:$request+user@example.com?subject=Token%20Request&body=Purpose%3A%20Newsletter%0ACompany%3A%20Example%20Company%0AWebsite%3A%20https%3A%2F%2Fexample.com">
  Request Email Token
</a>
```

## Appendix C. Migration Strategies

Organizations adopting ETAS can use the following migration strategies:

### C.1. Parallel Operation

1. Set up the token system alongside existing email infrastructure
2. Begin issuing tokenized addresses for new subscriptions
3. Continue accepting non-tokenized emails
4. Gradually encourage senders to use tokenized addresses

### C.2. Opt-In Approach

1. Allow users to opt into token-based email
2. Provide tools for managing the transition
3. Support both tokenized and non-tokenized addresses
4. Collect data on effectiveness and user satisfaction

### C.3. Gradual Enforcement

1. Start with token validation in monitoring mode
2. Flag emails with missing or invalid tokens
3. Gradually increase enforcement based on data
4. Eventually require tokens for all non-personal emails
