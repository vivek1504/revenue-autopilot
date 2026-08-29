# Revenue Autopilot

An autonomous AI agent system that detects lost revenue opportunities across a merchant's e-commerce data—abandoned checkouts, failed payments, lapsed customers—and autonomously generates, policy-gates, and executes recovery actions through Razorpay payment links, all under a cryptographically verifiable audit trail.

Built with **Gemini 3.6 Flash** · **Razorpay Payment Links API** · **Prisma ORM 7** · **React 19**

---

## How It Works

Revenue Autopilot operates as a **5-stage pipeline** where every customer opportunity flows through each stage sequentially. No action reaches the customer without passing all five gates.

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  1. DETECT  │───▶│ 2. PROPOSE  │───▶│  3. POLICY   │───▶│ 4. EXECUTE  │───▶│  5. SETTLE   │
│  Discovery  │    │  LLM Agent  │    │    Engine     │    │   Gateway   │    │  Audit + Pay │
└─────────────┘    └─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
 Scan database      Gemini 3.6         13 safety rules     Razorpay API       SHA-256 chain
 for revenue         generates          evaluate every      creates live       + webhook
 opportunities       proposals          proposal            payment links      verification
```

### Stage 1 — Discovery

Scans the PostgreSQL database for four classes of revenue opportunities:

| Opportunity Type    | Detection Logic                                           |
|---------------------|-----------------------------------------------------------|
| Abandoned Checkout  | Cart status = `abandoned`, last activity > 1 hour ago     |
| Failed Payment      | Order status = `failed`, created within last 48 hours     |
| Upsell              | Customer tier ∈ {`premium`, `vip`}, 3+ completed orders  |
| Re-engagement       | Last purchase > 30 days ago, 2+ prior orders              |

Each opportunity bundles the full customer profile, cart contents, order history, and any existing recovery offers—giving the LLM (or heuristic fallback) complete context for its proposal.

### Stage 2 — Proposal Generation

The system uses a **Strategy Pattern** with two interchangeable proposers:

- **`GeminiProposer`** — Calls Gemini 3.6 Flash with structured JSON output schema. The model receives a system prompt defining it as a revenue recovery specialist, plus the full customer context. Responses are validated with Zod against `AgentProposalSchema`. Falls back to heuristics on API failure.

- **`HeuristicProposer`** — Deterministic rule-based proposer for simulated/offline runs. Maps opportunity types to predefined recovery actions (e.g., abandoned cart → discounted payment link with 5-10% off).

Every proposal includes: `customer_id`, `action`, `amount_paise`, `discount_percent`, `expiry_hours`, `confidence_score`, `reason`, `opportunity_type`, and an `evidence` object with factual metrics from the database.

### Stage 3 — Policy Engine

**Every proposal is evaluated against all 13 rules.** The engine never short-circuits—it collects every violation so the dashboard can display the complete safety picture.

| Rule                    | What It Checks                                                                  |
|-------------------------|---------------------------------------------------------------------------------|
| `amount_limit`          | Amount ≤ ₹10,000 (configurable)                                                |
| `discount_limit`        | Discount ≤ 15%                                                                  |
| `customer_exists`       | Customer ID exists in database (DB query)                                       |
| `duplicate_offer`       | No active offer for same customer in last 24 hours (DB query)                   |
| `expiry_range`          | Expiry between 1–72 hours                                                       |
| `action_allowed`        | Action type in allowed set                                                      |
| `evidence_present`      | Evidence object contains at least one factual metric                            |
| `evidence_consistent`   | Evidence values (lifetime spend, cart value) match database records (DB query)  |
| `amount_positive`       | Non-reminder actions require positive amount                                    |
| `discount_for_action`   | Reminders and retry links cannot include discounts                              |
| `contact_frequency`     | ≤ 3 contacts per customer per 7-day window (stopping rule, DB query)            |
| `human_escalation`      | Amount > ₹25,000 requires human approval (escalation gate)                     |
| `confidence_threshold`  | Agent confidence ≥ 70%                                                          |

Rules that query the database (`customer_exists`, `duplicate_offer`, `evidence_consistent`, `contact_frequency`) provide real-time safety validation, not just static limit checks.

### Stage 4 — Execution Gateway

Another **Strategy Pattern** with two gateways:

- **`RazorpayGateway`** — Creates real Razorpay Orders + Payment Links via the official SDK. Includes idempotency key deduplication, a configurable live link budget cap (auto-falls back to simulation when budget exhausted), and discount calculation.

- **`SimulatedGateway`** — Returns deterministic simulated execution results with synthetic IDs. Zero external API calls. Used for development, testing, and demos.

Both gateways implement `IExecutionGateway` and are injected into the orchestrator at runtime based on the execution mode.

### Stage 5 — Settlement & Audit

- **Razorpay Webhooks** — `payment_link.paid` and `payment.captured` events are received, HMAC-verified against raw request bytes (not re-serialized JSON), and the corresponding `RecoveryOffer` record is updated to `redeemed` status.

- **SHA-256 Audit Ledger** — Every pipeline action (approved or blocked) is appended to a JSONL file as a hash-chained record. Each record's hash = `SHA-256(previous_hash + canonical_json(record))`. Canonical JSON sorts keys deterministically and strips `undefined` properties. The chain can be independently verified at any time to detect tampering.

---

## Dashboard

A React 19 single-page application with six views:

| View                | What It Shows                                                         |
|---------------------|-----------------------------------------------------------------------|
| **Executive**       | Revenue recovered, approval rate, live pipeline activity feed         |
| **Recoveries**      | Per-offer detail table, cohort breakdown, recovery timeseries         |
| **Telemetry**       | P99/avg latencies per stage, throughput, policy rule catch rates       |
| **Pipelines**       | 5-stage stepper visualization with per-stage data for each offer      |
| **Audit Ledger**    | Full audit log viewer, one-click chain verification, tamper testing   |
| **Settings**        | Policy config editor, execution mode toggle, export controls          |

The dashboard connects to the backend via REST API and receives real-time pipeline progress via SSE (Server-Sent Events) during autopilot runs.

---

## Tech Stack

| Layer        | Technology                                                           |
|--------------|----------------------------------------------------------------------|
| LLM          | Google Gemini 3.6 Flash (structured JSON output with Zod validation) |
| Payments     | Razorpay Orders API + Payment Links API + Webhooks                   |
| Database     | PostgreSQL with Prisma ORM 7 (`pg` driver adapter)                   |
| Backend      | Express 5, TypeScript 7, Node.js                                     |
| Frontend     | React 19, Tailwind CSS 4, Vite, Lucide icons                        |
| Audit        | SHA-256 hash-chained JSONL ledger with canonical JSON serialization  |
| Testing      | Vitest (unit), custom E2E simulation runner                          |

---

## Project Structure

```
razorpay/
├── src/
│   ├── agent/                  # Proposal generation
│   │   ├── detector.ts         # Opportunity discovery (DB queries)
│   │   ├── geminiProposer.ts   # Gemini 3.6 Flash LLM proposer
│   │   ├── simulatedProposer.ts # Deterministic heuristic proposer
│   │   ├── prompts.ts          # LLM system + user prompt templates
│   │   ├── schemas.ts          # Zod validation + Gemini response schema
│   │   └── revenue-agent.ts    # Proposer facade
│   ├── api/
│   │   ├── server.ts           # Express server with raw body capture
│   │   ├── dependencies.ts     # Prisma client singleton
│   │   └── routes/
│   │       ├── autopilot.ts    # POST /api/autopilot/run (SSE stream)
│   │       ├── webhook.ts      # Razorpay webhook handler + HMAC verify
│   │       ├── dashboard.ts    # GET /api/dashboard/summary
│   │       ├── analytics.ts    # GET /api/analytics/timeseries
│   │       ├── audit.ts        # Audit log + chain verification + tamper
│   │       ├── telemetry.ts    # GET /api/telemetry
│   │       ├── settings.ts     # Policy settings CRUD
│   │       ├── opportunities.ts # GET /api/opportunities
│   │       └── export.ts       # CSV/JSON export
│   ├── audit/
│   │   ├── logger.ts           # SHA-256 hash chain + canonical JSON
│   │   └── verifier.ts         # Independent chain integrity verifier
│   ├── autopilot/
│   │   ├── orchestrator.ts     # Main 5-stage pipeline loop
│   │   └── telemetry.ts        # Live telemetry stats accumulator
│   ├── gateway/
│   │   ├── razorpay-client.ts  # Razorpay SDK wrapper
│   │   ├── razorpay-gateway.ts # Live gateway (Orders + Payment Links)
│   │   ├── simulated-gateway.ts # Offline simulation gateway
│   │   ├── action-gateway.ts   # Gateway facade
│   │   ├── simulator.ts        # Simulated execution result generator
│   │   └── idempotency.ts      # Idempotency key generator
│   ├── interfaces/
│   │   ├── proposer.ts         # IProposer strategy interface
│   │   └── gateway.ts          # IExecutionGateway strategy interface
│   ├── policy/
│   │   ├── engine.ts           # Policy evaluation engine
│   │   ├── config.ts           # Default merchant policy config
│   │   └── rules.ts            # 13 individual rule implementations
│   ├── services/
│   │   ├── dashboard.service.ts # Dashboard aggregation queries
│   │   ├── analytics.service.ts # Timeseries + cohort analytics
│   │   └── telemetry.service.ts # Telemetry rule categorization
│   └── shared/
│       ├── config.ts           # Environment config loader
│       └── types/              # Shared TypeScript type definitions
├── dashboard/                  # React 19 SPA
│   └── src/
│       ├── App.tsx             # Root layout + view router
│       ├── hooks/useAutopilot.ts # API client + SSE hook
│       ├── types.ts            # Frontend type definitions
│       └── components/
│           ├── ExecutiveDashboardView.tsx
│           ├── RecoveriesAnalyticsView.tsx
│           ├── AgentTelemetryView.tsx
│           ├── PipelinesView.tsx
│           ├── AuditLogView.tsx
│           ├── SettingsView.tsx
│           ├── PolicyVerdictModal.tsx
│           ├── Sidebar.tsx
│           ├── TopNavBar.tsx
│           └── pipelines/      # 5-stage pipeline visualizations
│               ├── Stage1Discovery.tsx
│               ├── Stage2Reasoning.tsx
│               ├── Stage3Policy.tsx
│               ├── Stage4Gateway.tsx
│               ├── Stage5Settlement.tsx
│               └── PipelinesStepper.tsx
├── prisma/
│   └── schema.prisma           # Database schema (5 models, indexed)
├── tests/                      # Vitest unit & integration tests
│   ├── policy-engine.test.ts
│   ├── stopping-rules.test.ts
│   ├── audit-verifier.test.ts
│   ├── action-gateway.test.ts
│   ├── agent-schema.test.ts
│   └── pipeline-e2e.test.ts
└── scripts/                    # CLI utilities
    ├── seed-data.ts            # Seed database with sample data
    ├── seed-small.ts           # Minimal seed for demos
    ├── demo.ts                 # Live demo runner
    ├── demo-verify.ts          # Post-demo verification
    ├── test-simulated-e2e.ts   # Full simulated E2E test
    ├── verify-audit.ts         # Standalone audit chain verifier
    └── run-benchmark.ts        # Performance benchmark
```

---

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (running locally or remote)
- Razorpay Test Mode account (for live mode)
- Google AI Studio API key (for Gemini 3.6 Flash)

### Installation

```bash
# Clone and install
git clone https://github.com/vivek1504/revenue-autopilot.git
cd razorpay
npm install
npm --prefix dashboard install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
npx prisma db push

# Seed sample data
npm run seed
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/revenue_autopilot?schema=public"

# Server
PORT=3001

# Razorpay (test mode credentials)
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."

# Gemini
GEMINI_API_KEY="..."

# Execution mode: 'live' (real APIs) or 'simulated' (offline)
EXECUTION_MODE="simulated"
```

### Running

```bash
# Terminal 1: Backend API server
npm run start:api

# Terminal 2: Dashboard dev server
npm run dashboard
```

Backend runs on `http://localhost:3001`, dashboard on `http://localhost:5173`.

---

## Execution Modes

The system supports two execution modes, togglable from the dashboard sidebar or via `EXECUTION_MODE` env var:

| Mode          | LLM Proposer         | Payment Gateway         | Use Case                           |
|---------------|-----------------------|-------------------------|------------------------------------|
| **Live**      | Gemini 3.6 Flash      | Razorpay Orders + Links | Production / demo with real APIs   |
| **Simulated** | HeuristicProposer     | SimulatedGateway        | Development / testing / CI         |

In **live mode**, the `RazorpayGateway` enforces a configurable link budget cap (default: 10). Once the budget is exhausted, it transparently falls back to simulation for remaining opportunities, preventing runaway API usage.

---

## Testing

### Unit Tests

```bash
npm test
```

Runs 6 test suites (24 tests) covering:
- Policy engine rule evaluation
- Stopping rules (contact frequency, human escalation, confidence threshold)
- Audit chain integrity verification and tamper detection
- Gateway idempotency and execution modes
- Agent proposal schema validation
- Full pipeline E2E with in-memory audit

### Simulated E2E

```bash
npm run test:e2e-sim
```

Runs the complete 5-stage pipeline end-to-end in simulated mode against a real database, verifying:
1. Opportunity detection finds seeded data
2. Proposals pass Zod schema validation
3. Policy engine correctly blocks over-limit and policy-violating proposals
4. Approved proposals create `RecoveryOffer` database records
5. Audit chain integrity passes independent verification
6. Telemetry metrics are populated with real measured values

---

## API Endpoints

| Method | Endpoint                      | Description                              |
|--------|-------------------------------|------------------------------------------|
| POST   | `/api/autopilot/run`          | Start autopilot scan (SSE stream)        |
| GET    | `/api/dashboard/summary`      | Dashboard aggregate metrics              |
| GET    | `/api/opportunities`          | List detected opportunities              |
| GET    | `/api/analytics/timeseries`   | Recovery timeseries data                 |
| GET    | `/api/telemetry`              | Pipeline latency & throughput metrics    |
| GET    | `/api/audit/logs`             | Fetch audit ledger records               |
| POST   | `/api/audit/verify`           | Verify audit chain integrity             |
| POST   | `/api/audit/tamper`           | Tamper test (non-production only)        |
| GET    | `/api/settings`               | Get current policy settings              |
| PUT    | `/api/settings`               | Update policy settings                   |
| GET    | `/api/export/:format`         | Export data as CSV or JSON               |
| POST   | `/api/webhook/razorpay`       | Razorpay webhook receiver (HMAC-gated)   |
| GET    | `/api/webhook/razorpay`       | Payment success redirect page            |
| POST   | `/api/simulate/payment`       | Simulate payment settlement (Sandbox)    |

---

## Key Design Decisions

1. **Strategy Pattern over mode switches** — `IProposer` and `IExecutionGateway` interfaces allow swapping implementations without touching the orchestrator. The pipeline loop has zero `if (mode === 'live')` checks.

2. **Never short-circuit policy evaluation** — All 13 rules run on every proposal. This is deliberate: the dashboard needs the complete violation set for every proposal.

3. **Canonical JSON for audit hashing** — `canonicalJsonStringify` sorts object keys alphabetically and strips `undefined` properties. This ensures `SHA-256(written_record) === SHA-256(parsed_record)` regardless of property insertion order.

4. **Raw body webhook verification** — Express captures the raw byte buffer before JSON parsing via `express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })`. This prevents HMAC failures from whitespace/encoding differences.

5. **Idempotency keys** — Generated from `customer_id + action + amount`, preventing duplicate payment links even if the autopilot scans the same customer twice in a session.

---
