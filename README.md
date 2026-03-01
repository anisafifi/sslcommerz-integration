# SSLCommerz Integration Tutorial (Next.js + Prisma)

This project is a complete tutorial-style implementation of **SSLCommerz payment gateway integration** using modern Next.js server architecture.

It includes:
- Checkout and order creation
- SSLCommerz session initiation
- Secure IPN verification and payment validation
- Order/payment persistence with PostgreSQL + Prisma
- Success / fail / cancel handling

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI:** React 19, Tailwind CSS 4, shadcn/ui
- **Database:** PostgreSQL
- **ORM:** Prisma 7 (generated client in `src/generated/prisma`)
- **Payment Gateway:** SSLCommerz (Sandbox + Live)
- **Validation:** Zod
- **Runtime:** Node.js (for payment APIs/IPN route)

---

## Project Structure (Important Parts)

```text
src/
	actions/
		payment/
			initiate-payment.ts          # Creates order + starts SSL session
			sslcommerz/
				payments.ts                # Gateway/validation API calls
				ipn.ts                     # Signature verification + validation flow
	app/
		api/
			payment/
				ipn/route.ts               # IPN endpoint (security + DB updates)
		payment/
			success/page.tsx
			fail/page.tsx
			cancel/page.tsx
	lib/
		prisma.ts                      # Shared Prisma singleton
	global-config.ts                 # Env-based app/payment config

prisma/
	schema.prisma                    # Full ecommerce + payment schema
	seed.ts                          # Product seed script
```

---

## Environment Variables

Create a `.env.local` file in project root:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME

# SSLCommerz
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_ENV=sandbox

# Optional security hardening (comma-separated IP list)
SSLCOMMERZ_IPN_ALLOWLIST=

# Optional custom secret for your own transaction logic
SSLCOMMERZ_TRANSACTION_SECRET=
```

> For local development keep `SSLCOMMERZ_ENV=sandbox`.

---

## Installation & Setup

```bash
npm install
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate
```

Seed sample products (optional but recommended):

```bash
npm run prisma:seed
```

Start dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - run ESLint
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - run Prisma migrations in dev
- `npm run prisma:seed` - seed product data

---

## End-to-End Payment Flow

1. User submits checkout form.
2. `sslInitiatePayment` (`src/actions/payment/initiate-payment.ts`):
	 - Validates input with Zod
	 - Creates customer/address/order/order-items/payment rows in DB
	 - Calls SSLCommerz initiation API
	 - Stores `sessionkey` and updates order to `PROCESSING`
	 - Returns `GatewayPageURL`
3. User completes payment on SSLCommerz hosted page.
4. SSLCommerz calls IPN endpoint: `POST /api/payment/ipn`.
5. `src/app/api/payment/ipn/route.ts`:
	 - Validates payload shape and size
	 - Optionally checks IP allowlist
	 - Verifies IPN signature (`verify_sign`, `verify_key`)
	 - Calls SSLCommerz validation API (`val_id`)
	 - Cross-checks amount/currency/transaction ID
	 - Upserts payment details and updates order status atomically
6. User is redirected to success/fail/cancel pages.

---

## Database Design Summary

Key models in `prisma/schema.prisma`:

- `Order` - transaction-level order info and status lifecycle
- `Payment` - one order can have multiple payment attempts
- `Refund` - tracks refund lifecycle
- `Customer`, `Address`, `OrderItem`, `Product`, `ProductVariant`

Important enums:

- `OrderStatus`: `PENDING`, `PROCESSING`, `PAID`, `FAILED`, etc.
- `PaymentStatus`: `INITIATED`, `VALID`, `VALIDATED`, `FAILED`, etc.
- `RefundStatus`: `PENDING`, `PROCESSING`, `REFUNDED`, `FAILED`

---

## IPN Security Notes

This project includes the following protections:

- Signature verification using SSLCommerz `verify_sign` flow
- Validation API confirmation using `val_id`
- Amount/currency/tran_id cross-check before DB updates
- Optional IP allowlisting via `SSLCOMMERZ_IPN_ALLOWLIST`
- Basic idempotency guard in memory for duplicate IPN retries

> In multi-instance production deployment, replace in-memory idempotency with Redis or a strict DB-level idempotency strategy.

---

## Local IPN Testing Tips

SSLCommerz needs a publicly reachable `ipn_url`. For local testing, expose your app using a tunnel (for example, ngrok or Cloudflare Tunnel), then set:

- `NEXT_PUBLIC_APP_URL` to your tunnel URL
- SSLCommerz callback URLs (`success_url`, `fail_url`, `cancel_url`, `ipn_url`) to that same base URL

---

## Switching Sandbox to Live

Before go-live:

1. Set `SSLCOMMERZ_ENV=live`
2. Use live `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD`
3. Update domain and callback URLs to production HTTPS domain
4. Configure real IP allowlist for IPN endpoint
5. Monitor logs and payment/order status transitions

---

## Troubleshooting

### 1) `DATABASE_URL is missing`
- Ensure `.env.local` exists and includes `DATABASE_URL`.

### 2) Payment session creation fails
- Verify store credentials and environment (`sandbox` vs `live`).
- Confirm your server can reach SSLCommerz endpoints.

### 3) IPN not hitting local app
- Use a public tunnel and update callback URLs.
- Check SSLCommerz merchant panel callback settings if needed.

### 4) Order stuck in `PROCESSING`
- Check IPN logs and signature validation output.
- Confirm allowlist is not blocking SSLCommerz IP.

---

## Production Recommendations

- Move idempotency from in-memory map to Redis/DB
- Add structured logging and alerting for failed validations
- Add retry-safe background reconciliation job for pending payments
- Enforce strict network/security policies on payment endpoints
- Add admin visibility for payment attempts and risk flags

---

## License

Use this project as a learning reference for SSLCommerz integration. Add your own project license based on your distribution needs.
