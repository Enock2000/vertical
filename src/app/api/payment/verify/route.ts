// src/app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/lenco';

/**
 * Verify payment status by reference
 * Used after Lenco Pay SDK completes payment
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
        return NextResponse.json(
            { success: false, error: 'Missing reference parameter' },
            { status: 400 }
        );
    }

    try {
        const result = await verifyPayment(reference);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Verification failed' },
            { status: 500 }
        );
    }
}
