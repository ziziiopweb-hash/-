# SHADOW STORE — Deployment & Operational Guide

## Brand & Core Business Constants
- **Store Name**: SHADOW STORE
- **Target Market**: Mauritania (MRU currency)
- **Primary Payment Number**: `31520844`
- **Supported Payment Providers**: Bankily (BPM), Masrivi (BMCI), Sedad
- **Fulfillment Method**: Manual verification & authorized ID top-up

---

## 1. Environment Variables (`.env`)
```bash
# Server Port (Default: 3000)
PORT=3000
NODE_ENV=production

# JWT / Token Signature Key
JWT_SECRET="shadow-store-secure-token-secret-2026-mru"

# Default Admin Seed Password (change on first setup)
ADMIN_PASSWORD="ShadowAdmin#2026!"

# Optional PostgreSQL / Supabase connection (for external SQL hosting)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Optional Payment Webhooks / Top-Up API (when official provider API credentials become available)
BANKILY_MERCHANT_KEY=""
MASRIVI_API_TOKEN=""
GARENA_TOPUP_API_KEY=""
```

---

## 2. Default Administrative Access
- **Admin Email**: `admin@shadowstore.mr`
- **Default Password**: `ShadowAdmin#2026!`
- **Access Route**: Navigate to `Account` -> Sign in -> `Admin Console` is enabled for administrative roles.

---

## 3. Deployment Instructions

### Local & Node.js Production
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build frontend assets:
   ```bash
   npm run build
   ```
3. Start the fullstack production server:
   ```bash
   npm run start
   ```

### Supabase / PostgreSQL Setup
1. Log into your Supabase Dashboard at [supabase.com](https://supabase.com).
2. Create a new project named `shadow-store`.
3. Open the **SQL Editor** in Supabase and paste the contents of `supabase-schema.sql`.
4. Run the query to initialize all tables, foreign keys, indexes, and RLS policies.

### Vercel / Cloud Run Deployment
1. Set the root directory and build command to `npm run build`.
2. Configure environment variables in the project settings (`JWT_SECRET`, `ADMIN_PASSWORD`).
3. Point API calls to the serverless routes or containerized Express backend.

---

## 4. Payment Verification & Order Fulfillment Protocol
As specified in the operational requirements:
1. **Never treat submitted transaction IDs or screenshots as automatically confirmed payment.**
2. When a customer places an order:
   - Order is created with initial status `awaiting_payment`.
   - Customer is directed to transfer the exact amount in MRU to **31520844** via Bankily, Masrivi, or Sedad.
3. Once the customer attaches a reference ID or WhatsApp receipt:
   - Status changes to `needs_review`.
4. The administrator inspects their banking application (Bankily / Masrivi / Sedad) to confirm the received credit on number `31520844`.
5. Upon confirmation:
   - Admin changes status to `in_progress` or `completed`.
   - Admin enters the Player ID into the authorized recharge distributor panel.
   - Admin adds a customer-visible note (e.g., "تم شحن 1,166 جوهرة بنجاح").
