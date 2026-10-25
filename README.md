# Budget Oracle

> **An algorithmic AI research agent that buys evidence only when it is worth the price.**

Budget Oracle is an autonomous research agent built with Next.js (App Router), TypeScript, and Tailwind CSS. Given a research question and a hard USD budget, it acquires evidence from data sources sequentially—evaluating marginal probability shifts per cent spent. It halts acquisition when the next available source is not worth its cost or when spending limits (per-purchase cap and 10% reserve protection) would be breached. Finally, it formats a strictly code-determined verdict and synthesizes an AI cited report using **Gemma 4**.

---

## Core Philosophy & Honesty Rules

1. **Probability is Code-Only**: Probability numbers are calculated deterministically via log-odds math and Jev evaluation rules. The AI writer never estimates, calculates, or alters the probability.
2. **Transparent Provenance**: Every data source and engine displays a badge: **`REAL (testnet)`** or **`SIMULATED`**.
3. **No Key Storage**: The application never asks for, accepts, or stores private keys or seed phrases. Web3 transactions use browser-injected wallets (MetaMask) directly.
4. **Testnet Only**: Strictly restricted to testnets (Ethereum Sepolia). The app will deliberately refuse to run on Ethereum or Base mainnet.

---

## Architecture & Workflow

1. **Query Routing (`src/lib/router.ts`)**: Pure code classifier without AI. Computes keyword occurrences, word count, and clause structures to assign:
   - **Route A** (Token Cap: 0): Jev evaluation only, no AI writer.
   - **Route B** (Token Cap: 400): Moderate questions or explicit detailed reports.
   - **Route C** (Token Cap: 1200): Deep or open-ended inquiries.
2. **Spending Agent (`src/lib/agent.ts`)**:
   - Protects a **10% budget reserve** from ever being spent.
   - Enforces a strict **$0.08 per-purchase cap**.
   - Requires minimum efficiency of **1.0 percentage point shift per cent spent** (`minShiftPerCent`).
3. **Probability Engine (`src/lib/jev.ts`)**:
   - Deterministic question prior hash in `[0.35, 0.65]`.
   - Log-odds Bayesian updates: `updatePosterior(current, delta) = sigmoid(logit(current) + delta)`.
4. **AI Synthesis Reporter (`src/lib/report.ts` & `src/app/api/report/route.ts`)**:
   - Calls **Gemma 4** (`gemma-4-31b-it` / `@google/genai`) on the server route with graceful fallback tiering.
   - Post-generation number consistency validator: if the AI outputs any probability conflicting with the agent's code verdict, it is immediately discarded.
5. **x402 Multi-Agent Micropayments (`src/app/api/paid-source/route.ts` & `src/lib/purchase.ts`)**:
   - The user connects their MetaMask wallet on Ethereum Sepolia.
   - When evidence is purchased, payments flow **directly out of the user's wallet** sequentially into each specific **data provider agent's wallet address** on Ethereum Sepolia via x402 micropayments.
   - Eliminates any need to configure a static personal recipient address in `.env.local`.
   - Performs real-time Ethereum Sepolia JSON-RPC verification (`https://rpc.sepolia.org`) and returns verified on-chain transaction hashes linked directly to the Etherscan block explorer.
6. **System Status Introspection (`src/app/api/system-status/route.ts`)**:
   - Introspects server environment variables without leaking credentials, dynamically reflecting Writer and Jev configuration states.

---

## Honest Architecture Status

### 1. Working (Fully Verified)
- Pure-code router with keyword detection, word count, clause parsing, route determination (Routes A, B, C)
- Deterministic log-odds probability engine (`getPrior` deterministic hash, `updatePosterior` logit/sigmoid)
- Spending agent algorithm: 10% reserve protection, $0.08 per-purchase cap, marginal utility threshold (`minShiftPerCent >= 1.0` pt/cent)
- Code-enforced verdict line formatting: `"Verdict: X.X% YES."`
- Multi-agent on-chain payment flow: user wallet pays each data provider agent directly on Ethereum Sepolia
- Live Ethereum Sepolia JSON-RPC verification: queries `https://rpc.sepolia.org` to verify transaction inclusion and agent recipient
- Domain-specific intelligence dossiers for all vendor agents with context-aware findings
- AI writer integration with Gemma 4 (`gemma-4-31b-it` / `@google/genai`) with strict system prompts
- Report consistency validator detecting and discarding conflicting hallucinated percentages
- Downloadable plaintext audit log (`budget-oracle-log-*.txt`)
- In-memory 5-run history (no localStorage)
- Fictional vendor parameter editor with instant rerun & reset
- Injected browser wallet connector with Ethereum Sepolia detection and network switch request

### 2. Simulated
- Fictional data sources: Court Filings Archive, Industry Newswire, Satellite Foot Traffic, Analyst Consensus Feed, Social Sentiment Scan, Premium Research Vault
- Default simulated transaction references (`sim-tx-*`) when running without wallet connection
- Stand-in log-odds math for Jev evaluation

### 3. Written but Not Run
- Jev live evaluation API client (stubbed with explicit `"Jev live mode: API contract not yet configured"` exception as required)
- Mainnet x402 settlement (explicitly refused and blocked by testnet safety guards)

### 4. Still to Validate
- Production Jev API schema once official specification and contract are released
- Multi-party off-chain facilitator channel batching under extreme testnet gas volatility

---

## Installation & Setup

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Suite
```bash
npm test
```
Runs 22 deterministic unit tests covering the pure-code router, spending agent reserve protection and caps, report consistency validator, purchase safety gates, and real web scraper engine.

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the keys in `.env.local`:
```env
# AI Writer (Google AI Studio / Gemini API)
GEMINI_API_KEY=your_gemini_api_key_here

# Jev Engine Mode ("simulated" or "live")
JEV_MODE=simulated

# x402 Testnet Configuration
X402_NETWORK=testnet
X402_FACILITATOR_URL=https://x402.org/facilitator
```

> **Warning**: Never put real private keys or seed phrases in `.env.local`. `.env.local` is added to `.gitignore`.

### 4. Start Development Server
```bash
npm run dev
```
- **Executive Landing Page**: [http://localhost:3000](http://localhost:3000)
- **Interactive Research Terminal**: [http://localhost:3000/terminal](http://localhost:3000/terminal)

### 5. Deploy to Vercel

Budget Oracle is ready for 1-click deployment on [Vercel](https://vercel.com):

1. **Import the repository** on Vercel: `https://github.com/saksham-mundra/Budget-Oracle.git`
2. **Framework Preset**: Vercel will automatically detect `Next.js`.
3. **Environment Variables**: Add the following in the Vercel project settings:
   - `GEMINI_API_KEY`: Your Google AI Studio API key.
   - `JEV_MODE`: `simulated`
   - `X402_NETWORK`: `testnet`
   - `X402_FACILITATOR_URL`: `https://x402.org/facilitator`
4. Click **Deploy**. Vercel will build and deploy the production bundle with Edge & Serverless API routes.

---

## Testnet Safety Notice

> **TESTNET ONLY**: Never connect a wallet that holds real assets. Budget Oracle only interacts with Ethereum Sepolia (Chain ID `11155111`). Any attempt to configure the app for mainnet is blocked by internal safety assertions in `lib/purchase.ts`.

---

## Project Structure

```
budget-oracle/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── paid-source/route.ts  # x402 HTTP 402 paid endpoint
│   │   │   └── report/route.ts       # Gemma 4 synthesis route
│   │   ├── globals.css               # Dark theme & styling tokens
│   │   ├── layout.tsx                # Serif & Sans typography setup
│   │   ├── terminal/page.tsx         # Dedicated live research console
│   │   └── page.tsx                  # Landing page (Slide deck mapped)
│   ├── components/
│   │   ├── CompareChart.tsx          # $0.10, $0.50, $1.00 budget chart
│   │   ├── HonestStatusPanel.tsx     # 4 transparency status cards
│   │   ├── VendorTable.tsx           # Editable pricing & deltas table
│   │   └── WalletConnect.tsx         # MetaMask & Ethereum Sepolia connector
│   ├── lib/
│   │   ├── agent.ts                  # Pure deterministic spending agent
│   │   ├── jev.ts                    # Log-odds probability engine
│   │   ├── purchase.ts               # x402 Ethereum Sepolia purchase logic
│   │   ├── report.ts                 # Verdict formatter & validator
│   │   ├── router.ts                 # Pure code query router
│   │   └── vendors.ts                # Vendor datasets & spending caps
│   └── types/
│       └── ethereum.d.ts             # Window.ethereum provider typing
├── tests/
│   ├── agent.test.ts                 # Reserve, cap, and stop tests
│   ├── purchase.test.ts              # Safety checks tests
│   ├── report.test.ts                # Consistency validator tests
│   └── router.test.ts                # Route A, B, C questions tests
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

---

*“Limitations are part of the proof.”*
