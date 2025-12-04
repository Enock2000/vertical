// src/lib/lenco.ts
// Server-side utility for Lenco Pay integration
// This file is used by API routes which are already server-side

import crypto from 'crypto';
import { z } from 'zod';

// ============================================================================
// Environment Configuration
// ============================================================================

const VSHR_BASE_URL = process.env.VSHR_BASE_URL || 'https://api.lenco.co/access/v2';
const VSHR_SECRET_KEY = process.env.VSHR_SECRET_KEY;

if (!VSHR_SECRET_KEY) {
    console.warn('VSHR_SECRET_KEY is not set in environment variables');
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface LencoCollection {
    id: string;
    initiatedAt: string;
    completedAt: string | null;
    amount: string;
    fee: string | null;
    bearer: 'merchant' | 'customer';
    currency: string;
    reference: string | null;
    lencoReference: string;
    type: 'card' | 'mobile-money' | 'bank-account' | null;
    status: 'pending' | 'successful' | 'failed' | 'pay-offline' | '3ds-auth-required';
    source: 'banking-app' | 'api';
    reasonForFailure: string | null;
    settlementStatus: 'pending' | 'settled' | null;
    mobileMoneyDetails?: {
        country: string;
        phone: string;
        operator: string;
        accountName: string | null;
        operatorTransactionId: string | null;
    } | null;
}

export interface LencoWebhookEvent {
    event: 'collection.successful' | 'collection.failed' | 'collection.settled';
    data: LencoCollection;
}

export interface CreateCollectionInput {
    amount: number;
    currency: string;
    reference: string;
    redirectUrl?: string;
    metadata?: Record<string, any>;
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const MobileMoneySchema = z.object({
    amount: z.number().positive(),
    currency: z.string().default('ZMW'),
    phone: z.string(),
    country: z.string().default('ZM'),
    reference: z.string(),
});

// ============================================================================
// Collection Management
// ============================================================================

/**
 * Create a new collection (payment request)
 * This initiates a payment that can be completed via card, mobile money, or bank
 */
export async function createCollection(input: CreateCollectionInput): Promise<LencoCollection> {
    if (!VSHR_SECRET_KEY) {
        throw new Error('Payment gateway not configured');
    }

    try {
        const res = await fetch(`${VSHR_BASE_URL}/collections`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${VSHR_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: input.amount.toString(),
                currency: input.currency,
                reference: input.reference,
                redirectUrl: input.redirectUrl,
                metadata: input.metadata,
            }),
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(json.message || 'Failed to create collection');
        }

        return json.data as LencoCollection;

    } catch (e: any) {
        console.error('Create collection error:', e);
        throw e;
    }
}

/**
 * Get collection by ID
 */
export async function getCollection(collectionId: string): Promise<LencoCollection> {
    if (!VSHR_SECRET_KEY) {
        throw new Error('Payment gateway not configured');
    }

    try {
        const res = await fetch(
            `${VSHR_BASE_URL}/collections/${encodeURIComponent(collectionId)}`,
            {
                headers: {
                    'Authorization': `Bearer ${VSHR_SECRET_KEY}`,
                },
            }
        );

        const json = await res.json();

        if (!res.ok) {
            throw new Error(json.message || 'Failed to get collection');
        }

        return json.data as LencoCollection;

    } catch (e: any) {
        console.error('Get collection error:', e);
        throw e;
    }
}

// ============================================================================
// Mobile Money Payment (Server-Side)
// ============================================================================

/**
 * Initiate a mobile money payment (server-side)
 * Used for direct mobile money payments (MTN, Airtel, Zamtel)
 */
export async function initiateMobileMoney(input: z.infer<typeof MobileMoneySchema>) {
    const parsed = MobileMoneySchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors };
    }

    if (!VSHR_SECRET_KEY) {
        return { success: false, error: 'Payment gateway not configured' };
    }

    try {
        const res = await fetch(`${VSHR_BASE_URL}/collections/mobile-money`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${VSHR_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: input.amount.toString(),
                currency: input.currency,
                phone: input.phone,
                country: input.country,
                reference: input.reference,
            }),
        });

        const json = await res.json();

        if (!res.ok) {
            return { success: false, error: json };
        }

        return { success: true, data: json.data };

    } catch (e: any) {
        console.error('Mobile money payment error:', e);
        return { success: false, error: e.message };
    }
}

// ============================================================================
// Payment Verification
// ============================================================================

/**
 * Verify payment status by reference
 * Works for both card and mobile money payments
 */
export async function verifyPayment(reference: string) {
    if (!VSHR_SECRET_KEY) {
        return { success: false, error: 'Payment gateway not configured' };
    }

    try {
        const res = await fetch(
            `${VSHR_BASE_URL}/collections/status/${encodeURIComponent(reference)}`,
            {
                headers: {
                    'Authorization': `Bearer ${VSHR_SECRET_KEY}`,
                },
            }
        );

        const json = await res.json();

        if (!res.ok) {
            return { success: false, error: json };
        }

        return { success: true, data: json.data as LencoCollection };

    } catch (e: any) {
        console.error('Payment verification error:', e);
        return { success: false, error: e.message };
    }
}

// ============================================================================
// Webhook Verification
// ============================================================================

/**
 * Verify Lenco webhook signature
 * webhook_hash_key = SHA256(SECRET_KEY)
 * signature = HMAC_SHA512(webhook_hash_key, request_body)
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!VSHR_SECRET_KEY) {
        console.error('Cannot verify webhook: VSHR_SECRET_KEY not configured');
        return false;
    }

    try {
        // Step 1: Create webhook hash key (SHA256 of secret key)
        const webhookHashKey = crypto
            .createHash('sha256')
            .update(VSHR_SECRET_KEY)
            .digest('hex');

        // Step 2: Create expected signature (HMAC SHA512)
        const expectedSignature = crypto
            .createHmac('sha512', webhookHashKey)
            .update(payload)
            .digest('hex');

        // Step 3: Timing-safe comparison
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        console.error('Error verifying webhook signature:', error);
        return false;
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique reference for a subscription payment
 */
export function generatePaymentReference(companyId: string, planId: string): string {
    const timestamp = Date.now();
    return `vsync_sub_${companyId}_${planId}_${timestamp}`;
}

/**
 * Extract payment method details from Lenco collection
 */
export function extractPaymentMethod(collection: LencoCollection): {
    type: 'card' | 'mobile-money' | 'bank-account';
    brand?: string;
    last4?: string;
    operator?: string;
    phone?: string;
} | null {
    if (!collection.type) return null;

    if (collection.type === 'mobile-money' && collection.mobileMoneyDetails) {
        return {
            type: 'mobile-money',
            operator: collection.mobileMoneyDetails.operator,
            phone: collection.mobileMoneyDetails.phone,
        };
    }

    if (collection.type === 'card') {
        return {
            type: 'card',
            // Card details would be extracted from collection if available
        };
    }

    if (collection.type === 'bank-account') {
        return {
            type: 'bank-account',
        };
    }

    return { type: collection.type };
}
