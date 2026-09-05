<div align="center">

<img src="https://razorpay.com/favicon.ico" alt="Revenue Autopilot Logo" width="64" height="64" />

# Revenue Autopilot

*Autonomous AI revenue recovery pipeline with policy safety guardrails and cryptographic audit trail.*

[![Tests](https://img.shields.io/badge/Tests-38%20Passing-success?style=flat-square&logo=vitest&logoColor=white)](tests/)
![Node Version](https://img.shields.io/badge/Node.js->=20-3c873a?style=flat-square&logo=node.js&logoColor=white)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Gemini](https://img.shields.io/badge/LLM-Gemini%203.6%20Flash-8e75ff?style=flat-square&logo=google)](https://ai.google.dev/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay%20API-0c2340?style=flat-square&logo=razorpay)](https://razorpay.com)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%207-2d3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![React](https://img.shields.io/badge/Frontend-React%2019-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)

⭐ If you find this project useful, please consider giving it a star on GitHub!

[Overview](#overview) • [Pipeline Architecture](#pipeline-architecture) • [Features](#features) • [Getting Started](#getting-started) • [Dashboard](#dashboard) • [Policy Engine](#policy-engine) • [Audit Ledger](#cryptographic-audit-ledger) • [API Reference](#api-reference) • [Testing](#testing)

</div>

---

## Overview

**Revenue Autopilot** is an autonomous AI agent system designed to detect and recover lost revenue across e-commerce operations. It continuously scans merchant databases for revenue leakages—such as abandoned checkouts, failed payments, lapsed high-value customers, and post-purchase upsell opportunities—generates context-aware recovery proposals using **Gemini 3.6 Flash**, policy-gates every proposal against **13 deterministic safety rules**, and dispatches targeted **Razorpay Payment Links**, all anchored by a tamper-evident **SHA-256 hash-chained audit ledger**.

> [!TIP]
> You can run and test the entire system locally with zero external API dependencies using the built-in **`simulated`** execution mode.

---

## Pipeline Architecture

Revenue Autopilot processes every recovery candidate through a **5-stage sequential pipeline**. No action reaches a customer without passing all validation gates.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   1. DISCOVER   │───▶│   2. PROPOSE    │───▶│    3. POLICY    │───▶│   4. EXECUTE    │───▶│   5. SETTLE     │
│ Database Scan   │    │  Gemini Agent   │    │  Safety Engine  │    │ Payment Gateway │    │ Audit & Webhook │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
 Scans PostgreSQL       Generates context-     Evaluates 13 hard      Dispatches live      HMAC-verifies
 for 4 opportunity      rich recovery          safety rules           Razorpay payment     webhooks & records
 classes                proposals (Zod)        simultaneously         links / orders       SHA-256 hash chain
```

### Stage 1: Discovery
Scans the PostgreSQL database for revenue opportunities across four distinct segments:
- **Abandoned Checkout**: Shopping carts with `abandoned` status and inactivity $> 1$ hour.
- **Failed Payment**: Orders with `failed` status within the last 48 hours.
- **High-Value Upsell**: Customers in `premium` or `vip` tiers with 3+ completed orders.
- **Re-engagement (Winback)**: Inactive customers with 2+ historical purchases and no activity in $> 30$ days.

### Stage 2: Proposal Generation
Uses a **Strategy Pattern** with two interchangeable engines:
- **`GeminiProposer`**: Leverages Gemini 3.6 Flash with structured JSON output and strict Zod schema validation (`AgentProposalSchema`). Automatically falls back to heuristics upon API timeouts or errors.
- **`HeuristicProposer`**: Deterministic rule-based proposer for offline simulations, CI/CD, and testing.

### Stage 3: Policy Engine
Evaluates every proposal against **13 non-short-circuiting safety rules**. All rules run concurrently to collect comprehensive diagnostic reports for merchant oversight.

### Stage 4: Execution Gateway
Dispatches recovery actions via pluggable gateway strategies:
- **`RazorpayGateway`**: Creates live Razorpay Orders and Payment Links with idempotency deduplication and an automated live link budget safety cap.
- **`SimulatedGateway`**: Emulates payment link creation with zero external network calls.

### Stage 5: Settlement & Cryptographic Audit
- **Webhook Processing**: Ingests raw-byte HMAC-verified Razorpay webhooks (`payment_link.paid`, `payment.captured`) to reconcile orders to `RECOVERED` state.
- **SHA-256 Audit Trail**: Appends canonical JSON records to an immutable, cryptographically verifiable hash chain ledger.

---

## Features

- **Autonomous AI Decisioning** — Gemini 3.6 Flash formulates recovery strategies with strict JSON schema guarantees and factual evidence grounding.
- **13-Rule Deterministic Policy Engine** — Guarantees financial limits, discount ceilings, contact rate stopping rules, and anti-hallucination evidence validation.
- **Production-Grade Razorpay Integration** — Idempotent Payment Link generation, live link budget caps, and raw-buffer HMAC webhook verification.
- **Cryptographic Audit Ledger** — Append-only JSONL hash chain (`SHA-256(previous_hash + canonical_json)`) with instant integrity verification and tamper detection.
- **Interactive React 19 Dashboard** — Real-time telemetry, live SSE stream during autopilot runs, 5-stage pipeline stepper, and timeseries analytics.
- **Dual Execution Strategy** — Instant toggling between offline simulated sandbox and live Razorpay/Gemini production environments.

---

## Getting Started

### Prerequisites

- **Node.js** `>= 20.x`
- **PostgreSQL** `15+` (local or managed instance)
- **Google AI Studio API Key** (for Gemini LLM proposer)
- **Razorpay Test Account** (for live payment link generation)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vivek1504/revenue-autopilot.git
   cd razorpay
   ```

2. **Install dependencies:**
   ```bash
   npm install
   npm --prefix dashboard install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to configure your credentials:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/revenue_autopilot?schema=public"
   PORT=3001
   RAZORPAY_KEY_ID="rzp_test_..."
   RAZORPAY_KEY_SECRET="..."
   RAZORPAY_WEBHOOK_SECRET="..."
   GEMINI_API_KEY="..."
   EXECUTION_MODE="simulated"
   CALLBACK_BASE_URL="http://localhost:3001"
   ```

4. **Initialize database schema & seed data:**
   ```bash
   npx prisma db push
   npm run seed
   ```

### Running the Application

Start the backend API server and frontend dashboard in separate terminal sessions:

```bash
# Terminal 1: Backend API Server
npm run start:api

# Terminal 2: Dashboard Frontend
npm run dashboard
```

- **Backend API**: `http://localhost:3001`
- **Dashboard UI**: `http://localhost:3000`

> [!NOTE]
> You can also run the autopilot pipeline directly from the command line using `npm run dev`.

---

## Dashboard

The React 19 single-page application offers comprehensive visibility across operations:

| View | Capabilities |
| :--- | :--- |
| **Executive Overview** | Real-time aggregate net revenue recovered, approval rates, live activity feed, and one-click autopilot trigger. |
| **Recovery Benchmark** | 3-tier comparative evaluation (Baseline vs Heuristic Rules vs Gemini Autopilot) measuring net recovered margin and safety. |
| **Recoveries & Cohorts** | Tabular breakdown of recovery offers, settlement statuses, discount distributions, and conversion timeseries. |
| **Agent Telemetry** | Stage-by-stage P99/avg latency metrics, throughput counters, and policy violation frequency charts. |
| **Pipelines Stepper** | Granular 5-stage visualization inspecting input data, agent reasoning, policy evaluation, and gateway responses per offer. |
| **Audit Ledger** | Full inspection of the append-only ledger, one-click hash chain verification, and interactive tamper simulation. |
| **Settings** | Real-time adjustment of policy thresholds (max amount, discount ceiling, contact frequency limits, execution mode). |

---

## Policy Engine

Every candidate action is verified against 13 deterministic safety rules before execution:

| Rule Name | Scope | Verification Type | Description |
| :--- | :--- | :--- | :--- |
| `amount_limit` | Financial | Static Policy | Caps automated transactions at configured threshold (default: ₹1,00,000). |
| `discount_limit` | Financial | Static Policy | Limits maximum allowed discount percentage (default: $\le 15\%$). |
| `customer_exists` | Entity | Live DB Query | Verifies target customer ID exists in the database. |
| `duplicate_offer` | Frequency | Live DB Query | Prevents multiple active offers for the same customer within 24 hours. |
| `expiry_range` | Operational | Static Policy | Enforces payment link lifespan between 1 and 72 hours. |
| `action_allowed` | Action | Static Policy | Ensures proposed action is within the merchant's allowed action whitelist. |
| `evidence_present` | Integrity | Static Policy | Rejects proposals lacking factual metric evidence. |
| `evidence_consistent`| Anti-Hallucination | Live DB Query | Cross-checks agent's evidence (cart totals, lifetime spend) against real DB records. |
| `amount_positive` | Financial | Static Policy | Ensures non-reminder actions specify a strictly positive monetary value. |
| `discount_for_action`| Financial | Static Policy | Forbids discounts on reminders and retry links. |
| `contact_frequency` | Stopping Rule | Live DB Query | Blocks outreach if customer received $\ge 3$ contacts in the past 7 days. |
| `human_escalation` | Escalation Gate | Static Policy | Flags transactions $> ₹25,000$ for mandatory human manager approval. |
| `confidence_threshold`| AI Safety | Static Policy | Requires agent confidence score $\ge 70\%$. |

---

## Cryptographic Audit Ledger

Every event in the pipeline (proposals, policy verdicts, dispatches, settlements) is cryptographically locked into an immutable JSONL file (`data/audit.jsonl`):

$$\text{Record Hash} = \text{SHA-256}\left(\text{Previous Hash} + \text{Canonical JSON}(\text{Record})\right)$$

- **Deterministic Serialization**: Custom canonical JSON serialization sorts keys alphabetically and removes `undefined` fields, guaranteeing consistent hashing across environments.
- **Genesis Block**: Initiated with 64 zeros (`000000...000000`).
- **Tamper Detection**: Modifying or removing any past entry invalidates all downstream hash pointers.

Verify the audit ledger anytime via CLI:
```bash
npx tsx scripts/verify-audit.ts
```

---

## API Reference

| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/autopilot/run` | Triggers autopilot execution stream via Server-Sent Events (SSE). |
| `GET` | `/api/dashboard/summary` | Retrieves aggregate metrics, recovery stats, and pipeline activity. |
| `GET` | `/api/opportunities` | Returns detected opportunities with customer and cart context. |
| `GET` | `/api/analytics/timeseries` | Fetches historical recovery and conversion analytics. |
| `GET` | `/api/telemetry` | Provides stage latencies, execution throughput, and rule statistics. |
| `GET` | `/api/evaluate/report` | Retrieves latest 3-tier recovery benchmark evaluation report. |
| `POST` | `/api/evaluate/run` | Triggers on-demand benchmark evaluation simulation across all strategies. |
| `GET` | `/api/audit/logs` | Fetches all recorded audit ledger entries. |
| `POST` | `/api/audit/verify` | Validates complete SHA-256 hash chain integrity. |
| `POST` | `/api/audit/tamper` | Injects synthetic tampering to test ledger verification (non-prod). |
| `GET` | `/api/settings` | Retrieves current merchant policy parameters and execution mode. |
| `PUT` | `/api/settings` | Updates policy limits and operational configurations. |
| `GET` | `/api/export/:format` | Exports recovery data in `csv` or `json` formats. |
| `POST` | `/api/webhook/razorpay` | Ingests HMAC-verified webhook events (`payment_link.paid`). |
| `POST` | `/api/simulate/payment` | Simulates payment settlement for testing and demo flows. |

---

## Testing

The project includes an extensive automated test suite covering unit, integration, and end-to-end simulated execution paths:

```bash
# Run Vitest test suite (38 tests across 11 suites)
npm test

# Run 3-tier recovery benchmark evaluation (Baseline vs Heuristics vs Gemini Autopilot)
npm run evaluate

# Run full simulated end-to-end pipeline against test database
npm run test:e2e-sim

# Run pipeline performance benchmark
npm run benchmark

# Verify live or test Razorpay credentials
npm run test-razorpay
```
