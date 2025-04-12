import { z } from 'zod';

// Token status enum
export enum TokenStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  INACTIVE = 'inactive',
}

// Base token schema
export const TokenSchema = z.object({
  id: z.string().uuid(),
  token: z.string().min(6).max(32),
  recipient_email: z.string().email(),
  recipient_domain: z.string().min(3),
  meta: z.record(z.any()).default({}),
  data: z.record(z.any()).default({}),
  status: z.nativeEnum(TokenStatus).default(TokenStatus.ACTIVE),
  created_at: z.date(),
  updated_at: z.date(),
  expires_at: z.date().nullable(),
  deleted_at: z.date().nullable(),
});

// Token type
export type Token = z.infer<typeof TokenSchema>;

// Create token request schema
export const CreateTokenSchema = z.object({
  recipient_email: z.string().email(),
  sender_email: z.string().email().optional(),
  sender_domains: z.array(z.string()).min(1).optional(),
  expires_at: z.string().datetime().optional(),
  description: z.string().max(255).optional(),
  metadata: z.record(z.any()).optional(),
});

// Create token request type
export type CreateTokenRequest = z.infer<typeof CreateTokenSchema>;

// Token validation request schema
export const ValidateTokenSchema = z.object({
  token: z.string().min(6).max(32),
  recipient_email: z.string().email(),
  sender_email: z.string().email(),
  sender_ip: z.string().ip().optional(),
  sender_helo: z.string().optional(),
  spf_result: z.enum(['pass', 'fail', 'neutral', 'none']).optional(),
  dkim_result: z.enum(['pass', 'fail', 'neutral', 'none']).optional(),
  dmarc_result: z.enum(['pass', 'fail', 'neutral', 'none']).optional(),
});

// Token validation request type
export type ValidateTokenRequest = z.infer<typeof ValidateTokenSchema>;

// Token validation result schema
export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  token_id: z.string().uuid().optional(),
  action: z.enum(['accept', 'reject', 'quarantine', 'flag']),
  reason: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  metadata: z.record(z.any()).optional(),
});

// Token validation result type
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// Token request schema
export const TokenRequestSchema = z.object({
  id: z.string().uuid(),
  recipient_email: z.string().email(),
  sender_email: z.string().email(),
  meta: z.record(z.any()).default({}),
  data: z.record(z.any()).default({}),
  status: z.enum(['pending', 'approved', 'denied', 'expired']).default('pending'),
  created_at: z.date(),
  updated_at: z.date(),
  expires_at: z.date(),
  responded_at: z.date().nullable(),
  token_id: z.string().uuid().nullable(),
});

// Token request type
export type TokenRequest = z.infer<typeof TokenRequestSchema>;

// Create token request schema
export const CreateTokenRequestSchema = z.object({
  recipient_email: z.string().email(),
  sender_email: z.string().email(),
  purpose: z.string().max(255).optional(),
  redirect_url: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

// Create token request type
export type CreateTokenRequestRequest = z.infer<typeof CreateTokenRequestSchema>;

// Approve token request schema
export const ApproveTokenRequestSchema = z.object({
  expires_at: z.string().datetime().optional(),
  description: z.string().max(255).optional(),
});

// Approve token request type
export type ApproveTokenRequestRequest = z.infer<typeof ApproveTokenRequestSchema>;

// Deny token request schema
export const DenyTokenRequestSchema = z.object({
  reason: z.string().max(255).optional(),
});

// Deny token request type
export type DenyTokenRequestRequest = z.infer<typeof DenyTokenRequestSchema>;
