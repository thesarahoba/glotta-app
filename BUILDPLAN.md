# Glotta — Build Plan (Phase by Phase)

---

## Phase 1 — Project Foundation
**Goal:** Runnable Next.js app with database connected

- Initialize Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Set up Prisma ORM with PostgreSQL
- Define the full database schema:
  - `User` (sellers + buyers, role-based)
  - `Product` (name, price, type: fixed/flexible, quantity)
  - `InstallmentPlan` (amount, frequency, duration)
  - `Wallet` (per buyer per product — amount paid, balance, progress %)
  - `Payment` (amount, status, gateway reference, timestamps)
  - `Notification`
- Set up environment variables (`.env`)
- Run `prisma migrate` to create tables

---

## Phase 2 — Authentication
**Goal:** Sellers and buyers can sign up / log in

- NextAuth.js with credentials provider (email + password, bcrypt hashed)
- Seller registration → creates storefront slug (e.g. `kikihair`)
- Buyer registration is lightweight — triggered from product link
- Session management, protected routes via middleware
- Role-based access (`SELLER` vs `BUYER`)

---

## Phase 3 — Seller Core (Products & Plans)
**Goal:** Sellers can create products and configure installment plans

- Seller dashboard layout
- Create product form:
  - Name, description, price, image upload (Cloudinary)
  - Payment type: `FLEXIBLE` or `FIXED`
  - If fixed: interval (daily/weekly), amount per interval, duration
  - Lock funds toggle
- Product list page with status indicators
- Each product auto-generates a shareable payment link

---

## Phase 4 — Buyer Onboarding & Wallet System
**Goal:** Buyer clicks link, joins, gets their wallet

- Public product page at `/pay/[slug]/[productId]`
- Buyer fills: name, phone, address, quantity
- On submit → system creates:
  - Buyer account (or links existing)
  - **Wallet** tied to that buyer + that product
  - Wallet pre-loaded with: total price, ₦0 paid, full balance
- Buyer lands on their wallet dashboard

---

## Phase 5 — Payment Integration (Paystack)
**Goal:** Real money flows in, Glotta records it

- Integrate Paystack inline JS for payments
- Create `/api/payments/initiate` — generates Paystack transaction ref
- Create `/api/payments/verify` — verifies after redirect
- Paystack webhook endpoint `/api/webhooks/paystack`:
  - Verifies signature (HMAC)
  - Updates wallet: `amountPaid += payment.amount`, recalculates balance + progress %
  - Creates `Payment` record
  - Fires notification to seller
- Handle edge cases: duplicate webhooks, failed payments

---

## Phase 6 — Seller Dashboard (Full)
**Goal:** Sellers have full visibility and control

- Overview stats: total collected, active buyers, completed orders
- Product list with per-product stats
- Customer list per product:
  - Name, phone, progress bar, amount paid, balance
  - Filter: active / completed / behind
- Payment history table
- Real-time notifications (Pusher or polling)
- Withdraw funds flow (mock or Paystack Transfer API)

---

## Phase 7 — Buyer Dashboard (Full)
**Goal:** Buyers track all their installments

- Wallet overview per product (progress bar, amount paid, balance)
- Payment history per wallet
- Quick-pay button
- Points/rewards display (gamification)
- Notifications: payment confirmed, completion alerts

---

## Phase 8 — Notifications & Comms
**Goal:** Both sides stay informed without manual chasing

- Email via Resend:
  - Payment confirmation to buyer
  - New payment alert to seller
  - Completion alert to seller
- SMS via Termii (Nigerian numbers):
  - Payment receipts
  - Reminders for flexible plan buyers
- In-app notification bell

---

## Phase 9 — Gamification & Engagement
**Goal:** Drive buyers to complete payments

- Points system: earn points per payment
- Progress ring / bar per wallet
- "Almost there" milestone alerts (50%, 75%, 90%)
- Completion badge / confetti on final payment

---

## Phase 10 — Public Storefront & Polish
**Goal:** Sellers have a brandable link to share

- Public storefront at `[slug].glotta.app` or `/store/[slug]`
- Lists all seller's active products
- SEO meta tags per product
- Landing page (`glotta.app`) — marketing page for sellers to sign up
- Mobile-first responsive polish
- Error boundaries, loading states, empty states

---

## Phase 11 — Security & Hardening

- Input validation with Zod on all API routes
- Rate limiting on payment endpoints
- Paystack webhook signature verification
- HTTPS-only cookies, CSRF protection
- SQL injection prevention (Prisma handles this)
- Secrets in env only, never client-side

---

## Phase 12 — Deployment

- Database: Railway or Supabase (PostgreSQL)
- App: Vercel (Next.js native)
- Redis (optional): Upstash for caching / real-time
- Domain: `glotta.app` + wildcard subdomain for storefronts
- CI/CD: GitHub → Vercel auto-deploy

---

> **Estimated total files:** ~80–100 files across 12 phases.
>
> Say **"build it"** to execute phase by phase.
