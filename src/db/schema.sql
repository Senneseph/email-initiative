-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY,
    token VARCHAR(32) NOT NULL UNIQUE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_domain VARCHAR(255) NOT NULL,
    meta JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for tokens table
CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_recipient_email ON tokens(recipient_email);
CREATE INDEX IF NOT EXISTS idx_tokens_recipient_domain ON tokens(recipient_domain);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at);
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_deleted_at ON tokens(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tokens_meta_status ON tokens((meta->>'status'));

-- Create token_authorized_senders table
CREATE TABLE IF NOT EXISTS token_authorized_senders (
    id UUID PRIMARY KEY,
    token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    sender_email VARCHAR(255) NOT NULL,
    sender_domain VARCHAR(255) NOT NULL,
    meta JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(token_id, sender_domain)
);

-- Create indexes for token_authorized_senders table
CREATE INDEX IF NOT EXISTS idx_token_authorized_senders_token_id ON token_authorized_senders(token_id);
CREATE INDEX IF NOT EXISTS idx_token_authorized_senders_sender_domain ON token_authorized_senders(sender_domain);
CREATE INDEX IF NOT EXISTS idx_token_authorized_senders_sender_email ON token_authorized_senders(sender_email);
CREATE INDEX IF NOT EXISTS idx_token_authorized_senders_created_at ON token_authorized_senders(created_at);
CREATE INDEX IF NOT EXISTS idx_token_authorized_senders_deleted_at ON token_authorized_senders(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create token_usage table
CREATE TABLE IF NOT EXISTS token_usage (
    id UUID PRIMARY KEY,
    token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    sender_email VARCHAR(255) NOT NULL,
    sender_ip VARCHAR(45),
    meta JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    validation_result VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for token_usage table
CREATE INDEX IF NOT EXISTS idx_token_usage_token_id ON token_usage(token_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_sender_email ON token_usage(sender_email);
CREATE INDEX IF NOT EXISTS idx_token_usage_validation_result ON token_usage(validation_result);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at);

-- Create token_requests table
CREATE TABLE IF NOT EXISTS token_requests (
    id UUID PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    meta JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    token_id UUID REFERENCES tokens(id)
);

-- Create indexes for token_requests table
CREATE INDEX IF NOT EXISTS idx_token_requests_recipient_email ON token_requests(recipient_email);
CREATE INDEX IF NOT EXISTS idx_token_requests_sender_email ON token_requests(sender_email);
CREATE INDEX IF NOT EXISTS idx_token_requests_status ON token_requests(status);
CREATE INDEX IF NOT EXISTS idx_token_requests_created_at ON token_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_token_requests_expires_at ON token_requests(expires_at);

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    meta JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    rules JSONB NOT NULL,
    default_action VARCHAR(20) NOT NULL DEFAULT 'accept',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for policies table
CREATE INDEX IF NOT EXISTS idx_policies_name ON policies(name);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at);
CREATE INDEX IF NOT EXISTS idx_policies_deleted_at ON policies(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create policy_assignments table
CREATE TABLE IF NOT EXISTS policy_assignments (
    id UUID PRIMARY KEY,
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    assignment_type VARCHAR(20) NOT NULL,
    assignment_value VARCHAR(255) NOT NULL,
    meta JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(policy_id, assignment_type, assignment_value)
);

-- Create indexes for policy_assignments table
CREATE INDEX IF NOT EXISTS idx_policy_assignments_policy_id ON policy_assignments(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_assignments_type_value ON policy_assignments(assignment_type, assignment_value);
CREATE INDEX IF NOT EXISTS idx_policy_assignments_created_at ON policy_assignments(created_at);
CREATE INDEX IF NOT EXISTS idx_policy_assignments_deleted_at ON policy_assignments(deleted_at) WHERE deleted_at IS NOT NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_tokens_updated_at
BEFORE UPDATE ON tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_authorized_senders_updated_at
BEFORE UPDATE ON token_authorized_senders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_requests_updated_at
BEFORE UPDATE ON token_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at
BEFORE UPDATE ON policies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policy_assignments_updated_at
BEFORE UPDATE ON policy_assignments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
