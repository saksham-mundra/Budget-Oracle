# Budget Oracle

> **An algorithmic AI research agent that buys evidence only when it is worth the price.**

Budget Oracle is an autonomous research agent built with Next.js (App Router), TypeScript, and Tailwind CSS. Given a research question and a hard USD budget, it acquires evidence from data sources sequentially—evaluating marginal probability shifts per cent spent. It halts acquisition when the next available source is not worth its cost or when spending limits (per-purchase cap and 10% reserve protection) would be breached. Finally, it formats a strictly code-determined verdict and synthesizes an AI cited report using **Gemma 4**.

---

## Core Philosophy & Honesty Rules

1. **Probability is Code-Only**: Probability numbers are calculated deterministically via log-odds math and Jev evaluation rules. The AI writer never estimates, calculates, or alters the probability.
2. **Transparent Provenance**: Every data source and engine displays a badge: **`REAL (testnet)`** or **`SIMULATED`**.
3. **No Key Storage**: The application never asks for, accepts, or stores private keys or seed phrases. Web3 transactions use browser-injected wallets (MetaMask) directly.
4. **Testnet Only**: Strictly restricted to testnets (Base Sepolia). The app will deliberately refuse to run on Ethereum or Base mainnet.

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
   - Calls **Gemma 4** (`gemma-4-31b-it` / `@google/genai`) on the server route.
   - Post-generation number consistency validator: if the AI outputs any probability conflicting with the agent's code verdict, it is immediately discarded.
5. **x402 Micropayments (`src/app/api/paid-source/route.ts` & `src/lib/purchase.ts`)**:
   - Local paid endpoint returning HTTP 402 with Base Sepolia USDC micropayment specifications until settled on-chain.

---

## Honest Architecture Status

### 1. Working (Fully Verified)
- Pure-code router with keyword detection, word count, clause parsing, route determination (Routes A, B, C)
- Deterministic log-odds probability engine (`getPrior` deterministic hash, `updatePosterior` logit/sigmoid)
- Spending agent algorithm: 10% reserve protection, $0.08 per-purchase cap, marginal utility threshold (`minShiftPerCent >= 1.0` pt/cent)
- Code-enforced verdict line formatting: `"Verdict: X.X% YES."`
- AI writer integration with Gemma 4 (`gemma-4-31b-it` / `@google/genai`) with strict system prompts
- Report consistency validator detecting and discarding conflicting hallucinated percentages
- Downloadable plaintext audit log (`budget-oracle-log-*.txt`)
- In-memory 5-run history (no localStorage)
- Fictional vendor parameter editor with instant rerun & reset
- Injected browser wallet connector with Base Sepolia detection and network switch request

### 2. Simulated
- Fictional data sources: Court Filings Archive, Industry Newswire, Satellite Foot Traffic, Analyst Consensus Feed, Social Sentiment Scan, Premium Research Vault
- Evidence records & simulated transaction references (`sim-tx-*`)
- Stand-in log-odds math for Jev evaluation

### 3. Written but Not Run
- Jev live evaluation API client (stubbed with explicit `"Jev live mode: API contract not yet configured"` exception as required)
- Real Base Sepolia on-chain x402 USDC micropayment contract interaction (requires user's funded testnet wallet and `.env.local` configuration)

### 4. Still to Validate
- Production Jev API schema once official specification and contract are released
- End-to-end multi-party x402 facilitator settlement under testnet network congestion

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
Runs 19 deterministic unit tests covering the pure-code router, spending agent reserve protection and caps, report consistency validator, and purchase safety gates.

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the keys in `.env.local`:
```env
# Gemma 4 AI Writer (Google Gen AI API key)
GEMINI_API_KEY=your_gemini_api_key_here

# Jev Engine Mode ("simulated" or "live")
JEV_MODE=simulated

# x402 Testnet Configuration
X402_NETWORK=testnet
X402_RECIPIENT_ADDRESS=0xYourBaseSepoliaWalletAddress
X402_FACILITATOR_URL=https://x402.org/facilitator
```

> **Warning**: Never put real private keys or seed phrases in `.env.local`. `.env.local` is added to `.gitignore`.

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## Testnet Safety Notice

> **TESTNET ONLY**: Never connect a wallet that holds real assets. Budget Oracle only interacts with Base Sepolia (Chain ID `84532`). Any attempt to configure the app for mainnet is blocked by internal safety assertions in `lib/purchase.ts`.

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
│   │   └── page.tsx                  # 14 UI sections in exact order
│   ├── components/
│   │   ├── CompareChart.tsx          # $0.10, $0.50, $1.00 budget chart
│   │   ├── HonestStatusPanel.tsx     # 4 transparency status cards
│   │   ├── VendorTable.tsx           # Editable pricing & deltas table
│   │   └── WalletConnect.tsx         # MetaMask & Base Sepolia connector
│   ├── lib/
│   │   ├── agent.ts                  # Pure deterministic spending agent
│   │   ├── jev.ts                    # Log-odds probability engine
│   │   ├── purchase.ts               # x402 Base Sepolia purchase logic
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
