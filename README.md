# IntelliMod Studio

IntelliMod Studio is a Next.js application that gives Roblox experience owners a secure control plane for provisioning API secrets, managing subscriptions through Stripe, and integrating with a Cloudflare Worker that validates prompts from their games.

## Features

- Roblox OAuth (OIDC) sign-in powered by NextAuth.js + Prisma
- Self-service plan management with a free tier and Stripe-powered Creator plan
- Secure secret generation with rotation history
- REST API for Cloudflare Workers to validate Roblox prompt requests
- Ready-to-deploy Worker script that verifies secrets before forwarding prompts to AI providers

## Tech stack

- [Next.js 14](https://nextjs.org/) with the App Router
- [NextAuth.js](https://next-auth.js.org/) for authentication
- [Prisma](https://www.prisma.io/) with SQLite (or any supported provider)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout) for paid subscriptions
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) for Roblox prompt ingestion

## Getting started

### 1. Install dependencies

```bash
npm install
```

> **Note**
> The base Docker image used in this environment may block access to the npm registry. If installation fails with `E403 Forbidden`, configure an npm registry mirror or install dependencies in your deployment environment instead.

### 2. Configure environment variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Set the following values:

- `NEXTAUTH_URL` – URL where the app will run (e.g. `http://localhost:3000`)
- `NEXTAUTH_SECRET` – random string for NextAuth encryption
- `DATABASE_URL` – Prisma connection string (`file:./dev.db` for SQLite)
- `ROBLOX_CLIENT_ID` / `ROBLOX_CLIENT_SECRET` – credentials from your Roblox OAuth application
- `STRIPE_SECRET_KEY` – Stripe secret key
- `STRIPE_PRICE_ID` – price ID for the Creator subscription plan
- `STRIPE_WEBHOOK_SECRET` – webhook secret to confirm subscription events (see below)
- `NEXT_PUBLIC_APP_URL` – public URL of your deployment used for Stripe redirects

### 3. Create the database

Generate the Prisma client and create the SQLite database:

```bash
npx prisma migrate dev --name init
```

### 4. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the landing page. Sign in with Roblox, select a plan, and copy your generated secret key from the dashboard.

### 5. Configure Stripe webhooks (optional)

Create a webhook endpoint in Stripe that points to `/api/stripe/webhook` (endpoint implementation stub described below) to listen for `checkout.session.completed` and `customer.subscription.updated` events. Use the webhook secret in `STRIPE_WEBHOOK_SECRET` to verify events and update Prisma with active subscription IDs.

## API overview

### `POST /api/plan`

Authenticated route used by the dashboard to:

- Select the free plan (generates a secret if none exists)
- Kick off a Stripe Checkout session for the Creator plan
- Rotate the current secret key

### `POST /api/verify`

Public endpoint for Cloudflare Workers. Validates a secret key against the database and returns Roblox metadata tied to the key along with the prompt payload.

Example request:

```bash
curl -X POST https://your-domain.com/api/verify \
  -H "Content-Type: application/json" \
  -d '{"secret":"ims_abc123","prompt":"What quest should I send the player on?"}'
```

## Cloudflare Worker

Deploy the Worker script in [`cloudflare/worker.ts`](cloudflare/worker.ts). The worker expects an environment variable `INTELLIMOD_API_URL` pointing to your deployed Next.js instance. It validates the Roblox-provided secret before proxying prompts to Cloudflare's AI models.

## Next steps

- Implement `/api/stripe/webhook` to persist `stripeSubscriptionId` when the checkout completes.
- Add rate limiting to `/api/verify` if you want to enforce plan limits.
- Hash secrets before persisting in production (stored as plain text here for demo purposes).

## License

MIT
