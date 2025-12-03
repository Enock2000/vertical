// src/app/api/payment/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import { createCollection, generatePaymentReference } from '@/lib/lenco';
import type { SubscriptionPlan } from '@/lib/data';

export async function POST(request: NextRequest) {
    try {
        // 1. Verify user authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized - No auth token provided' },
                { status: 401 }
            );
        }

        const idToken = authHeader.split('Bearer ')[1];

        // Verify the Firebase ID token
        let decodedToken;
        try {
            // Note: In production, use Firebase Admin SDK to verify token
            // For now, we'll trust the client token (this should be enhanced)
            const user = auth.currentUser;
            if (!user) {
                return NextResponse.json(
                    { error: 'User not authenticated' },
                    { status: 401 }
                );
            }
            const companyId = user.uid;

            // 2. Get request body
            const body = await request.json();
            const { planId } = body;

            if (!planId) {
                return NextResponse.json(
                    { error: 'Plan ID is required' },
                    { status: 400 }
                );
            }

            // 3. Get plan details from Firebase
            const planSnapshot = await get(ref(db, `subscriptionPlans/${planId}`));

            if (!planSnapshot.exists()) {
                return NextResponse.json(
                    { error: 'Plan not found' },
                    { status: 404 }
                );
            }

            const plan: SubscriptionPlan = planSnapshot.val();

            // 4. Get company details
            const companySnapshot = await get(ref(db, `companies/${companyId}`));
            if (!companySnapshot.exists()) {
                return NextResponse.json(
                    { error: 'Company not found' },
                    { status: 404 }
                );
            }

            const company = companySnapshot.val();

            // 5. Generate unique reference
            const reference = generatePaymentReference(companyId, planId);

            // 6. Get app URL for redirects
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

            // 7. Create Lenco collection
            const collection = await createCollection({
                amount: plan.price,
                currency: 'ZMW',
                reference,
                redirectUrl: `${appUrl}/payment/success`,
                metadata: {
                    companyId,
                    companyName: company.name,
                    planId: plan.id,
                    planName: plan.name,
                },
            });

            // 8. Update company subscription to pending_payment
            await update(ref(db, `companies/${companyId}/subscription`), {
                status: 'pending_payment',
                lencoCollectionId: collection.id,
            });

            // 9. Return checkout information
            // Note: Lenco may return a checkout URL or require custom implementation
            // For now, we'll return the collection details
            return NextResponse.json({
                success: true,
                collectionId: collection.id,
                lencoReference: collection.lencoReference,
                amount: collection.amount,
                currency: collection.currency,
                // If Lenco provides a payment link, return it here
                // checkoutUrl: collection.paymentLink
                message: 'Payment collection created. Awaiting payment.'
            });

        } catch (authError: any) {
            console.error('Authentication error:', authError);
            return NextResponse.json(
                { error: 'Invalid authentication token' },
                { status: 401 }
            );
        }

    } catch (error: any) {
        console.error('Error creating checkout:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create payment checkout' },
            { status: 500 }
        );
    }
}
