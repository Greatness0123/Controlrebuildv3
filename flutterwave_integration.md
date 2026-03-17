# Flutterwave Integration Manager

This document explains how to integrate the Flutterwave payment gateway into the Control application to handle subscription upgrades and plan verification.

## 1. Overview
The payment flow works as follows:
1. User clicks "Upgrade" on the **Pricing Page**.
2. Frontend initializes the Flutterwave Modal or redirects to a Hosted Payment Page.
3. Upon successful payment, Flutterwave sends a webhook to your backend.
4. Backend verifies the payment using the `tx_ref` or `transaction_id`.
5. Backend updates the `user_metadata` in Supabase Auth and the `plan` column in the `public.users` table.

---

## 2. Frontend Integration (React/Next.js)

Install the Flutterwave library:
```bash
npm install flutterwave-react-v3
```

Example usage in `components/UpgradeButton.tsx`:
```tsx
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

const config = {
  public_key: 'FLWPUBK_TEST-DUMMY-KEY-123456789',
  tx_ref: Date.now().toString(),
  amount: 49,
  currency: 'USD',
  payment_options: 'card,mobilemoney,ussd',
  customer: {
    email: user.email,
    phone_number: '070********',
    name: user.name,
  },
  customizations: {
    title: 'Control Pro Plan',
    description: 'Payment for Pro Subscription',
    logo: 'https://your-app-logo.com/logo.png',
  },
};

const handleFlutterPayment = useFlutterwave(config);

handleFlutterPayment({
  callback: (response) => {
    console.log(response);
    if (response.status === 'successful') {
        // You can proactively notify your backend here, 
        // but always rely on the Webhook for the final source of truth.
        window.location.href = '/workspace?payment=success';
    }
    closePaymentModal();
  },
  onClose: () => {},
});
```

---

## 3. Backend Verification (FastAPI / Node.js)

Create a webhook endpoint to receive payment notifications.

### Webhook Setup
To receive automated payment updates (e.g., when a user successfully pays), you must configure the Webhook URL in your Flutterwave Dashboard.

**Webhook URL:** `https://YOUR_BACKEND_DOMAIN/api/webhooks/flutterwave`
> [!IMPORTANT]
> Flutterwave requires the Webhook URL to start with **https://**. If you are using an IP address (e.g., `http://20.164.16.171:8000`), the dashboard will say "Invalid URL". You must use a domain with SSL or a tunnel (like ngrok/Cloudflare) to provide an HTTPS endpoint.

**Secret Hash:** `5d9368c9-d741-f35e-7e3e-4d69528ab52b`
(This hash is exactly 36 characters long. Ensure it matches the value in your backend `.env` file.)

### Python Example (`backend/app/routes/payment_routes.py`)

```python
import hmac
import hashlib
from fastapi import APIRouter, Request, Header, HTTPException
from app.auth import get_service_client

router = APIRouter(prefix="/api/webhooks", tags=["Payments"])

# Your SECRET HASH from Flutterwave Dashboard
FLUTTERWAVE_SECRET_HASH = "your_secret_hash_here"

@router.post("/flutterwave")
async def flutterwave_webhook(request: Request, verif_hash: str = Header(None, alias="verif-hash")):
    # 1. Verify Secret Hash
    if not verif_hash or verif_hash != FLUTTERWAVE_SECRET_HASH:
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    
    # 2. Extract Data
    if payload["status"] == "successful":
        transaction_id = payload["id"]
        tx_ref = payload["tx_ref"]
        amount = payload["amount"]
        user_email = payload["customer"]["email"]
        
        # Determine plan based on amount (or metadata passed in tx_ref)
        plan = "pro" if amount == 49 else "master" if amount == 199 else "free"
        
        # 3. Verify with Flutterwave API (Optional but Recommended)
        # GET https://api.flutterwave.com/v3/transactions/{transaction_id}/verify
        
        # 4. Update Database
        db = get_service_client()
        
        # Update public.users table
        db.table("users").update({"plan": plan}).eq("email", user_email).execute()
        
        # Update Supabase Auth metadata (so frontend reflects it immediately)
        # Note: Requires supabase-py service role
        res = db.auth.admin.update_user_by_id(
            payload["customer"]["id"], # Pass this ID in tx_ref or metadata during checkout
            attributes={"user_metadata": {"plan": plan}}
        )
        
        return {"status": "success"}
    
    return {"status": "ignored"}
```

---

## 4. Plan Synchronization Strategy

1. **Supabase Metadata**: Store the plan name in `user_metadata`. This is easily accessible on the frontend via `supabase.auth.getUser()`.
2. **Public Users Table**: Store the plan name in the `public.users` table. The backend uses this to enforce resource limits (e.g., in `vm_service.py`).
3. **Consistency**: Ensure both locations are updated when a payment is verified.

## 5. Security Checklist
- [ ] Never trust the frontend for payment confirmation.
- [ ] Always verify the Webhook signature (`verif-hash`).
- [ ] Compare the payment amount against your internal pricing values.
- [ ] Log every webhook event for auditing.
