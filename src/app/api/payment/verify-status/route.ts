// src/app/api/payment/verify-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/lenco';
import { auth } from '@/lib/firebase';

/**
 * Manual verification endpoint for payment status
 * Used as a fallback if webhooks fail or for manual status checks
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Get collection ID from request
        const body = await request.json();
        const { collectionId } = body;

        if (!collectionId) {
            return NextResponse.json(
                { error: 'Collection ID is required' },
                { status: 400 }
            );
        }

        // 3. Fetch collection status from Lenco
        const collection = await getCollection(collectionId);

        // 4. Return status
        return NextResponse.json({
            success: true,
            collection: {
                id: collection.id,
                status: collection.status,
                amount: collection.amount,
                currency: collection.currency,
                lencoReference: collection.lencoReference,
                paymentType: collection.type,
                reasonForFailure: collection.reasonForFailure,
            },
        });

    } catch (error: any) {
        console.error('Error verifying payment status:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify payment status' },
            { status: 500 }
        );
    }
}
