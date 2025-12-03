# VerticalSync - Lenco Pay Payment Gateway Integration

## Environment Variables Setup

Add these to your `.env.local` file:

```env
# === Lenco Pay (VSHR) Configuration ===
# Get these from your Lenco Pay merchant dashboard

# Secret Key (SERVER-SIDE ONLY - Never expose to client)
VSHR_SECRET_KEY=your_secret_key_here

# Base URL (Lenco API endpoint)
VSHR_BASE_URL=https://api.lenco.co/v2

# Public Key (CLIENT-SIDE - Safe to expose)
NEXT_PUBLIC_VSHR_PUBLIC_KEY=your_public_key_here

# === App Configuration ===
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

## Quick Start Guide

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment  

1. Get your Lenco Pay credentials from the merchant dashboard
2. Create `.env.local` file (see above)
3. **Important**: Never commit `.env.local` to git

### 3. Configure Webhooks

**Development (using ngrok)**:
```bash
# Install ngrok globally
npm install -g ngrok

# Start ngrok
ngrok http 9002

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

**Webhook URL in Lenco Dashboard**:

| Environment | Webhook URL |
|-------------|-------------|
| Development | `https://your-ngrok-url.ngrok.io/api/payment/webhooks` |
| Production | `https://your-domain.com/api/payment/webhooks` |

**Events to Enable**:
- ✅ `collection.successful`
- ✅ `collection.failed`  
- ✅ `collection.settled`

### 4. Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:9002`

## How It Works

### Payment Flow

1. **User Clicks "Choose Plan"** 
   - Subscription tab component triggers Lenco Pay SDK
   - `window.LencoPay.getPaid()` opens payment modal
   
2. **Payment Modal Opens**
   - User chooses: Card OR Mobile Money
   - Card: Enters card details in secure iframe
   - Mobile Money: Enters phone number, gets STK push
   
3. **Payment Processed**
   - Lenco processes payment securely
   - On success: `onSuccess` callback triggered
   - On cancel: `onClose` callback triggered
   
4. **Verification**
   - Frontend calls `/api/payment/verify?reference=xxx`
   - Backend calls Lenco API to confirm status
   - Returns payment details
   
5. **Webhook (Background)**
   - Lenco sends webhook to `/api/payment/webhooks`
   - System updates subscription status in Firebase
   - Logs transaction

### Architecture

````
┌─────────────────┐
│   User Browser  │
│                 │
│  Subscription   │
│  Settings UI    │
└────────┬────────┘
         │ 1. Click "Choose Plan"
         ▼
┌─────────────────┐
│  Lenco Pay SDK  │ (Client-Side)
│  window.        │
│  LencoPay       │
└────────┬────────┘
         │ 2. getPaid({ amount, reference... })
         ▼
┌─────────────────┐
│  Lenco Pay      │
│  Payment Modal  │ (Secure Hosted UI)
├─────────────────┤
│ ○ Card          │
│ ○ Mobile Money  │
└────────┬────────┘
         │ 3. Process Payment
         ▼
┌─────────────────────────────────────┐
│         Lenco Pay Servers           │
│  (Process card/mobile money)        │
└──────┬─────────────────────┬────────┘
       │ 4a. onSuccess        │ 4b. Webhook
       ▼                      ▼
┌─────────────┐        ┌──────────────┐
│  Frontend   │        │   Backend    │
│  Callback   │        │   Webhook    │
└──────┬──────┘        │  /api/payment│
       │               │  /webhooks   │
       │ 5. Verify     └──────┬───────┘
       ▼                      │
┌───────────────┐             │ 6. Update
│ GET /api/     │             │ Subscription
│ payment/      │             ▼
│ verify        │       ┌──────────────┐
└───────────────┘       │   Firebase   │
                        │   Database   │
                        └──────────────┘
````

## Payment Methods Supported

### 1. Card Payments
- Visa
- Mastercard  
- Verve
- 3D Secure support

### 2. Mobile Money
- **Zambia**: MTN, Airtel, Zamtel
- **Kenya**: M-Pesa, Airtel Money
- **Ghana**: MTN, AirtelTigo, Vodafone
- **Uganda**: MTN, Airtel
- **Tanzania**: M-Pesa, Airtel, Tigo

## Testing

### Test Cards (Sandbox Mode)

| Card Number | Status | Description |
|-------------|--------|-------------|
| `4111111111111111` | Success | Successful payment |
| `5200000000000007` | Declined | Card declined |
| `4000000000000002` | Error | Processing error |

### Test Mobile Money

Use phone number: `+260964000000` (test number from Lenco)

### Test Payment Flow

1. Login to your app
2. Navigate to **Dashboard** → **Settings** → **Subscription**
3. Click **"Choose Plan"** on any plan
4. Payment modal opens
5. Select **"Card"** or **"Mobile Money"**  
6. Use test credentials above
7. Complete payment
8. Verify success page shows
9. Check Firebase for updated subscription

### Verify Webhook Delivery

```bash
# Check server logs for:
Received Lenco webhook event: collection.successful
Subscription activated for company: {companyId}
```

## Troubleshooting

### "Payment System Loading" Error

**Cause**: Lenco Pay SDK not loaded

**Fix**:
1. Check browser console for script errors
2. Verify internet connection
3. Clear cache and reload
4. Check if `https://pay.lenco.co/js/v1/inline.js` loads

### "Configuration Error"

**Cause**: `NEXT_PUBLIC_VSHR_PUBLIC_KEY` not set

**Fix**:
1. Check `.env.local` file exists
2. Verify `NEXT_PUBLIC_VSHR_PUBLIC_KEY=...` is set
3. Restart dev server (`npm run dev`)

### Webhook Not Received

**Causes**:
- Webhook URL not configured in Lenco dashboard
- ngrok session expired
- Firewall blocking requests

**Fixes**:
1. Verify webhook URL in Lenco dashboard
2. Check ngrok is still running: `ngrok http 9002`
3. Test webhook manually:
   ```bash
   curl -X POST https://your-url.ngrok.io/api/payment/webhooks \
     -H "Content-Type: application/json" \
     -H "X-Lenco-Signature: test" \
     -d '{"event":"collection.successful","data":{}}'
   ```

### Payment succeeded but subscription not activated

1. Check webhook signature verification:
   ```
   # Server logs should show:
   ✅ Webhook signature verification: passed
   ```

2. Check Firebase subscription object:
   ```
   companies/{companyId}/subscription/status
   # Should be "active"
   ```

3. Verify `VSHR_SECRET_KEY` matches Lenco dashboard

## Production Deployment

### Environment Variables

Set in your hosting platform (Vercel, Railway, etc.):

| Variable | Value |
|----------|-------|
| `VSHR_SECRET_KEY` | Production secret key from Lenco |
| `VSHR_BASE_URL` | `https://api.lenco.co/v2` |
| `NEXT_PUBLIC_VSHR_PUBLIC_KEY` | Production public key |
| `NEXT_PUBLIC_APP_URL` | Your production URL |

### Webhook Configuration

Update Lenco dashboard:
```
Webhook URL: https://your-production-domain.com/api/payment/webhooks
```

### Security Checklist

- [ ] Production API keys configured
- [ ] Webhook signature verification enabled
- [ ] HTTPS enforced on production
- [ ] `.env.local` not committed to git
- [ ] Firebase security rules reviewed
- [ ] Error logging set up (Sentry, LogRocket, etc.)

## Support

- **Lenco Pay API Docs**: https://lenco-api.readme.io/v2.0
- **Lenco Support**: [email protected]
- **Implementation Guide**: See [walkthrough.md](walkthrough.md)
