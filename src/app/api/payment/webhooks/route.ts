// src/app/api/payment/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, extractPaymentMethod } from '@/lib/lenco';
import type { LencoWebhookEvent, LencoCollection } from '@/lib/lenco';
import { db } from '@/lib/firebase';
import { ref, get, update, push, set, query, orderByChild, equalTo } from 'firebase/database';
import type { PaymentTransaction, CompanySubscription } from '@/lib/data';
import { add } from 'date-fns';

export async function POST(request: NextRequest) {
    try {
        // 1. Get raw body for signature verification
        const rawBody = await request.text();

        // 2. Get signature from headers
        const signature = request.headers.get('x-lenco-signature');

        if (!signature) {
            console.error('No signature provided in webhook');
            return NextResponse.json(
                { error: 'No signature provided' },
                { status: 400 }
            );
        }

        // 3. Verify webhook signature
        const isValid = verifyWebhookSignature(rawBody, signature);

        if (!isValid) {
            console.error('Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // 4. Parse the webhook event
        const event: LencoWebhookEvent = JSON.parse(rawBody);

        console.log('Received Lenco webhook event:', event.event);

        // 5. Handle different event types
        switch (event.event) {
            case 'collection.successful':
                await handleCollectionSuccessful(event.data);
                break;

            case 'collection.failed':
                await handleCollectionFailed(event.data);
                break;

            case 'collection.settled':
                await handleCollectionSettled(event.data);
                break;

            default:
                console.log('Unhandled webhook event type:', event.event);
        }

        // 6. Acknowledge receipt (Lenco expects 200/201/202)
        return NextResponse.json(
            { received: true },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        // Still return 200 to prevent retries for parsing errors
        return NextResponse.json(
            { error: 'Internal error', received: true },
            { status: 200 }
        );
    }
}

/**
 * Handle successful collection webhook
 */
async function handleCollectionSuccessful(collection: LencoCollection) {
    try {
        // Find company by lencoCollectionId
        const companyId = await findCompanyByCollectionId(collection.id);

        if (!companyId) {
            console.error('Company not found for collection:', collection.id);
            return;
        }

        // Get company and plan details
        const companySnapshot = await get(ref(db, `companies/${companyId}`));
        const company = companySnapshot.val();
        const planId = company.subscription.planId;

        const planSnapshot = await get(ref(db, `subscriptionPlans/${planId}`));
        const plan = planSnapshot.val();

        // Extract payment method
        const paymentMethod = extractPaymentMethod(collection);

        // Update subscription to active
        const nextBillingDate = add(new Date(), { months: 1 }).toISOString();

        const subscriptionUpdate: Partial<CompanySubscription> = {
            status: 'active',
            jobPostingsRemaining: plan.jobPostings,
            nextBillingDate,
            lencoCollectionId: collection.id,
            paymentMethod: paymentMethod || undefined,
        };

        await update(ref(db, `companies/${companyId}/subscription`), subscriptionUpdate);

        // Log transaction
        await logTransaction(companyId, collection, plan, 'successful');

        console.log(`Subscription activated for company: ${companyId}`);

    } catch (error) {
        console.error('Error handling collection.successful:', error);
    }
}

/**
 * Handle failed collection webhook
 */
async function handleCollectionFailed(collection: LencoCollection) {
    try {
        // Find company by lencoCollectionId
        const companyId = await findCompanyByCollectionId(collection.id);

        if (!companyId) {
            console.error('Company not found for collection:', collection.id);
            return;
        }

        // Get plan details
        const companySnapshot = await get(ref(db, `companies/${companyId}`));
        const company = companySnapshot.val();
        const planId = company.subscription.planId;

        const planSnapshot = await get(ref(db, `subscriptionPlans/${planId}`));
        const plan = planSnapshot.val();

        // Update subscription to past_due
        await update(ref(db, `companies/${companyId}/subscription`), {
            status: 'past_due',
        });

        // Log failed transaction
        await logTransaction(companyId, collection, plan, 'failed');

        console.log(`Payment failed for company: ${companyId}. Reason: ${collection.reasonForFailure}`);

        // TODO: Send notification email to company admin

    } catch (error) {
        console.error('Error handling collection.failed:', error);
    }
}

/**
 * Handle collection settled webhook
 */
async function handleCollectionSettled(collection: LencoCollection) {
    try {
        const companyId = await findCompanyByCollectionId(collection.id);

        if (!companyId) {
            console.error('Company not found for collection:', collection.id);
            return;
        }

        // Update transaction settlement status
        const transactionsRef = ref(db, `companies/${companyId}/transactions`);
        const transactionsSnapshot = await get(transactionsRef);

        if (transactionsSnapshot.exists()) {
            const transactions = transactionsSnapshot.val();

            // Find transaction matching this collection
            for (const [txId, tx] of Object.entries<any>(transactions)) {
                if (tx.lencoCollectionId === collection.id) {
                    await update(ref(db, `companies/${companyId}/transactions/${txId}`), {
                        settlementStatus: 'settled',
                    });
                    break;
                }
            }
        }

        console.log(`Payment settled for collection: ${collection.id}`);

    } catch (error) {
        console.error('Error handling collection.settled:', error);
    }
}

/**
 * Find company ID by Lenco collection ID
 */
async function findCompanyByCollectionId(collectionId: string): Promise<string | null> {
    try {
        const companiesRef = ref(db, 'companies');
        const snapshot = await get(companiesRef);

        if (!snapshot.exists()) {
            return null;
        }

        const companies = snapshot.val();

        for (const [companyId, company] of Object.entries<any>(companies)) {
            if (company.subscription?.lencoCollectionId === collectionId) {
                return companyId;
            }
        }

        return null;
    } catch (error) {
        console.error('Error finding company by collection ID:', error);
        return null;
    }
}

/**
 * Log payment transaction to Firebase
 */
async function logTransaction(
    companyId: string,
    collection: LencoCollection,
    plan: any,
    status: 'successful' | 'failed'
) {
    try {
        const transactionsRef = ref(db, `companies/${companyId}/transactions`);
        const newTransactionRef = push(transactionsRef);

        const transaction: PaymentTransaction = {
            id: newTransactionRef.key!,
            companyId,
            amount: parseFloat(collection.amount),
            currency: collection.currency,
            status,
            lencoCollectionId: collection.id,
            lencoReference: collection.lencoReference,
            timestamp: collection.completedAt || new Date().toISOString(),
            planId: plan.id,
            planName: plan.name,
            paymentType: collection.type,
            reasonForFailure: collection.reasonForFailure,
            settlementStatus: collection.settlementStatus,
        };

        await set(newTransactionRef, transaction);
    } catch (error) {
        console.error('Error logging transaction:', error);
    }
}
