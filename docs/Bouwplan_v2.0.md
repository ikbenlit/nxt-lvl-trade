# 🚀 Mission Control – Bouwplan AI Trading Decision Support Bot

**Projectnaam:** AI Trading Decision Support Bot
**Versie:** v2.0
**Datum:** 26-10-2025
**Auteur:** Colin
**Laatste Update:** 27-10-2025 08:40 (Fase 1.3.1 voltooid - Binance Candles Service)

---

## 📊 Development Status

**Huidige Fase:** 2.1 (Chat UI Components)
**Voltooiingsgraad MVP:** ~38% (6.5/12 subfases)

**Recent Voltooid:**
- ✅ Fase 0: Complete project setup (Next.js, dependencies, shadcn/ui, git)
- ✅ Fase 1.1: Database schema met 7 tabellen, Drizzle ORM, better-sqlite3
- ✅ Fase 1.2: Repository pattern (TradesRepository, ConversationsRepository)
- ✅ Fase 1.3: Drift SDK integration (market data, orderbook, liquidity, Helius RPC)
- ✅ Fase 1.3.1: Binance Candles Service (OHLCV data voor technical analysis)
- ✅ Fase 1.5: Strategy Engine (confluence calculation, position sizing, RSI)
- ✅ Fase 1.6: Claude service skeleton (basic chat, streaming, error handling)

**Nu Actief:**
- ⏳ Fase 2.1: Chat UI components (MessageBubble, MessageList, MessageInput)

**Volgende:**
- ⏳ Fase 2.2-2.5: SSE streaming, function calling, context sidebar, message persistence

---

## 1. Doel en context

🎯 **Doel:** Een werkend MVP bouwen van een AI-gedreven trading decision support systeem voor persoonlijk gebruik bij swing trading van SOL-PERP en BTC-PERP op Drift Protocol.

📘 **Context:** Dit is geen volledig autonome trading bot, maar een **intelligente sparring partner** die helpt bij het identificeren van high-quality setups, objectieve besluitvorming en het reduceren van emotionele biases. Het systeem gebruikt Claude AI voor setup analyse en leert iteratief van trade outcomes.

**Referenties:**
- PRD v2.0 - Volledige product requirements en success criteria
- FO v2.0 - User flows en schermontwerp
- TO v2.0 - Technische architectuur en API specs
- Screen Specifications v2.0 - Component library en UI details

---

## 2. Uitgangspunten

**Stack:**
- Frontend: Next.js 14 (App Router), TypeScript, shadcn/ui, Tailwind CSS
- Backend: Next.js API Routes, Node.js 20
- Database: SQLite (better-sqlite3) + Drizzle ORM
- AI: Anthropic Claude API (3.5 Sonnet)
- External APIs: Drift Protocol, Coinglass, Helius (Phase 3)
- Deployment: Vercel (serverless)

**Beperkingen:**
- Tijd: 5 weken voor MVP (Phase 1)
- Scope: Alleen SOL-PERP en BTC-PERP
- User: Single-user (Colin), geen authenticatie in MVP
- Execution: Manual trade entry (semi-autonomous in Phase 2)
- Environment: Local development → Vercel production

**Aannames:**
- Capital reeds op Solana (Phantom wallet)
- Drift Protocol API gratis toegankelijk
- Claude API credits beschikbaar (~$10/maand budget)
- Testnet validatie vooraf (Solana devnet)

## Development Principles

**Core Principles:**
- DRY (Don't Repeat Yourself) - Services als single source of truth
- SoC (Separation of Concerns) - API routes / Services / Database gescheiden
- KISS (Keep It Simple) - Geen over-engineering in MVP
- YAGNI (You Aren't Gonna Need It) - Multi-user, auth, etc. pas in Phase 6
- Single Responsibility - Elke service doet één ding (DriftService, ClaudeService)

**Code Quality:**
- TypeScript strict mode (catch errors compile-time)
- Zod schemas voor alle API inputs/outputs
- Error handling op alle externe API calls (retry logic 3x)
- Secrets in `.env.local` (ANTHROPIC_API_KEY, etc.)
- Parameterized SQL queries (SQL injection preventie)

**Bestandsnaamgeving:**
- Components: PascalCase (MessageBubble.tsx, TradeTable.tsx)
- Services: kebab-case (claude.service.ts, drift.service.ts)
- Pages: Next.js conventie (page.tsx, layout.tsx, [id]/page.tsx)
- API Routes: route.ts (Next.js App Router)
- Folders: kebab-case (api/trades, components/chat)

---

## 3. Fase- en subfase-overzicht

| Fase | Titel | Doel | Duur | Status | Referentie |
|------|--------|------|------|---------|------------|
| 0 | Project Setup | Repo, dependencies, boilerplate | Week 1 (2d) | ✅ Done | TO §7.1 |
| 1 | Database & Core Services | SQLite schema, repositories, Drift/Coinglass API | Week 1-2 (5d) | 🔄 In Progress | TO §4, §6 |
| 2 | Chat Interface | Conversational setup analysis met Claude | Week 2-3 (5d) | ⏳ To Do | FO §4.2, Screen Specs §3.3 |
| 3 | Calculator & Trade Log | Position sizing + trade CRUD | Week 3-4 (5d) | ⏳ To Do | FO §4.3-4.4, Screen Specs §3.4-3.5 |
| 4 | Dashboard & Integration | Landing page + end-to-end flows | Week 4 (3d) | ⏳ To Do | FO §4.1, Screen Specs §3.2 |
| 5 | Testing & Deployment | E2E tests, bug fixes, Vercel deploy | Week 5 (5d) | ⏳ To Do | TO §10, §8 |

---

## 4. Subfases (uitwerking per fase)

### Fase 0 — Project Setup

| Subfase | Doel | Status | Afhankelijkheden | Referentie |
|----------|------|--------|------------------|------------|
| 0.1 | Next.js project initialisatie | ✅ | — | TO §7.1 |
| 0.2 | Dependencies installeren | ✅ | 0.1 | TO §3, Appendix §14.2 |
| 0.3 | shadcn/ui component library setup | ✅ | 0.2 | Screen Specs §2.1 |
| 0.4 | Database schema & migrations | ✅ | 0.2 | TO §4.1 |
| 0.5 | Environment variables configureren | ✅ | 0.1 | TO §8.1 |
| 0.6 | Git repository + initial commit | ✅ | 0.5 | TO §13.3 |

**Details:**
- Init: `pnpm create next-app@latest --typescript --tailwind --app`
- Install: `@anthropic-ai/sdk`, `better-sqlite3`, `drizzle-orm`, `zod`, `swr`, `zustand`, `axios`, `date-fns`
- shadcn/ui: `npx shadcn-ui@latest init` + install essentials (Button, Input, Card, Dialog, Table)
- Database: Create `data/` folder, SQLite file, run migrations (Drizzle Kit)
- `.env.local`: Add ANTHROPIC_API_KEY, DATABASE_URL, NODE_ENV
- Git: Initialize repo, `.gitignore` for `.env.local`, `data/`, `node_modules/`

---

### Fase 1 — Database & Core Services

| Subfase | Doel | Status | Afhankelijkheden | Referentie |
|----------|------|--------|------------------|------------|
| 1.1 | SQLite schema implementeren | ✅ | 0.4 | TO §4.1 (volledige schema) |
| 1.2 | Repository pattern implementeren | ✅ | 1.1 | TO §4.2 (TradesRepository) |
| 1.3 | Drift SDK service (read-only market data) | ✅ | 0.2 | TO §6.2 (DriftService met SDK) |
| 1.3.1 | Binance Candles Service (OHLCV data) | ✅ | 1.3, 1.5 | Binance Futures API (critical voor RSI/OB/FVG) |
| 1.4 | Coinglass API service | ⏸️ | 0.2 | TO §6.2 (analoog aan Drift) - Uitgesteld (geen API key) |
| 1.5 | Strategy Engine (confluence) | ✅ | — | TO §6.3 (StrategyEngine) |
| 1.6 | Claude service skeleton | ✅ | 0.2 | TO §6.1 (basis zonder tools) |

**Details:**
- ✅ Schema: Volledige SQLite schema (7 tabellen) met Drizzle ORM
- ✅ Repositories: TradesRepository (CRUD + 6 analytics), ConversationsRepository (threads + messages)
- ✅ **Binance Candles:** OHLCV data via Binance Futures API (SOLUSDT/BTCUSDT ~95% correlatie, 5min cache, 23 tests)
- ✅ **Drift SDK:**
  - Install: `@drift-labs/sdk` + `@solana/web3.js` ✅
  - Setup: Helius RPC endpoint (free tier, 100k requests/dag) - **geen Drift API key nodig** ✅
  - Read-only DriftClient (dummy wallet voor read-only mode) ✅
  - Methods: `getMarketData()` (price, OI, funding), `getOrderbook()`, `checkLiquidity()` ✅
  - Types: DriftMarketData interface (shared met strategyEngine) ✅
  - Caching: 30s TTL voor market data (reduce RPC calls) ✅
  - Live test: All 6 tests passed (SOL-PERP + BTC-PERP verified) ✅
- ⏸️ Coinglass: Liquidations API (vereist API key - uitgesteld)
- ✅ Strategy: Confluence calculation (6 factors), RSI, S/R, FVG, OB detection, position sizing
- ✅ Claude: Chat (streaming + non-streaming), system prompt, error handling, cost tracking

**Test:**
- ✅ Unit test: StrategyEngine (25 tests passed) - RSI, confluence, position sizing
- ✅ Unit test: BinanceCandlesService (23 tests passed) - validation, caching, errors
- ✅ Integration test: Drift SDK → getMarketData('SOL-PERP') → verified response structure
- ✅ Live test: Helius RPC connection → fetched SOL-PERP + BTC-PERP price → verified real-time data
- ✅ Live test: Binance API → SOL $203.38, BTC $115,757 (100 candles, 6 scenarios)
- ✅ Database test: Insert/read/update/delete trades (15 tests passed)
- ✅ Claude API test: Live API integration verified (model: claude-sonnet-4-5-20250929)

---

### Fase 2 — Chat Interface

| Subfase | Doel | Status | Afhankelijkheden | Referentie |
|----------|------|--------|------------------|------------|
| 2.1 | Chat UI components | ⏳ | 0.3 | Screen Specs §3.3 (MessageBubble, MessageList) |
| 2.2 | SSE streaming implementatie | ⏳ | 1.6 | TO §5.2.1 (API route /api/chat) |
| 2.3 | Claude function calling | ⏳ | 1.3, 1.4, 1.5 | TO §6.1 (tools: fetch_drift_data, calculate_confluence) |
| 2.4 | Context sidebar (confluence display) | ⏳ | 2.1 | Screen Specs §4.1 (ConfluenceDisplay) |
| 2.5 | Message persistence | ⏳ | 1.2 | TO §4.1 (conversation_messages table) |

**Details:**
- Components: MessageBubble (user/assistant variants), MessageInput (Textarea + Send), MessageList (ScrollArea)
- API Route: `/api/chat` POST → Stream SSE events → Return streamed response
- Tools: Implement 6 Claude tools (fetch_drift_data, calculate_confluence, get_liquidations, calculate_position_size, query_trades, analyze_trade)
- Sidebar: Show real-time asset price + confluence score (SWR polling 30s)
- Database: Save messages to `conversation_messages` table, link to thread_id

**Test:**
- E2E: Type "SOL at $138, setup?" → Verify Claude calls tools → Verify confluence displayed
- Unit: Test tool execution (mock Drift API response)
- Visual: Verify streaming tokens appear incrementally (no flash)

---

### Fase 3 — Calculator & Trade Log

| Subfase | Doel | Status | Afhankelijkheden | Referentie |
|----------|------|--------|------------------|------------|
| 3.1 | Position calculator UI | ⏳ | 0.3 | Screen Specs §3.4 (form + results) |
| 3.2 | Position sizing logic | ⏳ | 1.5 | TO §6.3 (calculatePosition method) |
| 3.3 | R:R validation & warnings | ⏳ | 3.2 | Screen Specs §3.4 (visual bars + badges) |
| 3.4 | Trade log table + filters | ⏳ | 0.3 | Screen Specs §3.5 (Table component) |
| 3.5 | Trade CRUD API routes | ⏳ | 1.2 | TO §5.2.2 (GET/POST/PUT/DELETE /api/trades) |
| 3.6 | Trade detail modal | ⏳ | 3.4 | Screen Specs §3.5 (Dialog component) |
| 3.7 | Trade evaluation (Claude) | ⏳ | 1.6, 3.5 | TO §6.1 (evaluateTrade method) |

**Details:**
- Calculator: Form inputs (entry, stop, targets) + live calculation + visual R:R bars
- Logic: Implement position size formula, liquidation price calculation, safety checks
- Validation: Show warnings if R:R < 1.5:1 or liq < 8% away
- Table: Sortable, filterable (asset, status, date), clickable rows
- API: Full CRUD operations on `trades` table, include market context snapshot
- Modal: Show full trade details + reasoning + emotional notes + Claude analysis
- Evaluation: POST `/api/trades/:id/evaluate` → Stream Claude analysis → Save to DB

**Test:**
- Calculator: Input entry $138.50, stop $136.50 → Verify position size = 250 SOL (if 1% risk on $50k)
- Trade Log: Create trade → Verify appears in table → Click row → Verify modal opens
- Evaluation: Close trade → Evaluate → Verify Claude provides structured feedback

---

### Fase 4 — Dashboard & Integration

| Subfase | Doel | Status | Afhankelijkheden | Referentie |
|----------|------|--------|------------------|------------|
| 4.1 | Dashboard layout | ⏳ | 0.3 | Screen Specs §3.2 (Quick Scan + Recent Activity) |
| 4.2 | Asset selector + live data | ⏳ | 1.3 | FO §4.1 (Quick Stats Bar) |
| 4.3 | Navigation (header + routing) | ⏳ | 2.1, 3.1, 3.4 | Screen Specs §3.1 (Global Layout) |
| 4.4 | User flow integration | ⏳ | 2.5, 3.5 | FO §10 (Journey examples) |
| 4.5 | Error boundaries & loading states | ⏳ | All | Screen Specs §4.2-4.3 (Skeleton, ErrorDisplay) |
| 4.6 | Dark mode + responsive design | ⏳ | 0.3 | Screen Specs §6, §8 |

**Details:**
- Dashboard: Quick Scan card (asset selector + stats) + Recent Activity feed (last 3 trades + chats)
- Live Data: Fetch Drift API on asset change → Display price, RSI, OI, funding (SWR 30s refresh)
- Navigation: Header with logo + nav links (Dashboard, Chat, Calculator, Log) + user menu + theme toggle
- Integration: Test full flow: Dashboard → Analyze → Chat → Calculate → Log → Evaluate
- Loading: Implement Skeleton components for all async content
- Responsive: Test mobile (< 768px), tablet (768-1024px), desktop (> 1024px)

**Test:**
- Flow: Complete full user journey without errors (FO §10.1 scenario)
- Responsive: Verify all screens work on mobile Safari + desktop Chrome
- Dark Mode: Toggle theme → Verify all components adapt correctly

---

### Fase 5 — Testing & Deployment

| Subfase | Doel | Status | Afhankelijkheden | Referentie |
|----------|------|--------|------------------|------------|
| 5.1 | Unit tests (services) | ⏳ | 1.3-1.6 | TO §10.1 (Vitest) |
| 5.2 | Integration tests (API routes) | ⏳ | 2.2, 3.5 | TO §10.3 (Supertest) |
| 5.3 | E2E tests (critical flows) | ⏳ | 4.4 | TO §10.2 (Playwright) |
| 5.4 | Bug fixes & polish | ⏳ | 5.1-5.3 | — |
| 5.5 | Vercel deployment | ⏳ | 5.4 | TO §8.2 |
| 5.6 | Production smoke tests | ⏳ | 5.5 | — |

**Details:**
- Unit: Test StrategyEngine (RSI, confluence, position sizing), DriftService (API mocks)
- Integration: Test `/api/chat` POST → Verify tool execution, test `/api/trades` CRUD
- E2E: Setup analysis flow (type message → Claude responds → calculate → log)
- Fixes: Address all failing tests, fix UI bugs, improve error messages
- Deploy: Connect GitHub → Vercel, add env vars, deploy to production
- Smoke: Verify production URL loads, test one full flow (real Drift API)

**Test Coverage Goal:**
- Services: >80% coverage (critical business logic)
- API Routes: >70% coverage (error handling tested)
- E2E: 3 critical flows covered (chat, calculate, log)

---

## 5. Fasebeschrijving (detail)

### Fase 0 – Project Setup
**Doel:** Basisomgeving inrichten, dependencies installeren, database schema creëren.

**Taken:**
1. Init Next.js project met TypeScript + Tailwind
2. Install all dependencies (zie TO Appendix §14.2)
3. Setup shadcn/ui (Button, Input, Card, Dialog, Table, Badge, Textarea, ScrollArea, Skeleton)
4. Create database schema (TO §4.1), run migrations
5. Configure `.env.local` met API keys
6. Git init + initial commit

**Snippet (Cursor prompt):**
```
Create Next.js 14 App Router project with TypeScript, Tailwind CSS, and ESLint.
Install shadcn/ui and add Button, Input, Card components.
Setup SQLite with better-sqlite3 and create trades table schema.
```

---

### Fase 1 – Database & Core Services
**Doel:** Data layer en externe API integraties werkend krijgen.

**Taken:**
1. ✅ Implementeer volledige SQLite schema (trades, conversations, learnings tables)
2. ✅ Build TradesRepository met CRUD + analytics methods
3. ⏳ Create DriftService met Drift SDK voor read-only market data
4. ⏸️ Create CoinglassService voor liquidation clusters (uitgesteld - API key nodig)
5. ✅ Build StrategyEngine voor confluence calculation (6 factors)
6. ✅ Implement Claude service skeleton (basic chat, no tools yet)

**Snippet (Cursor prompt) - Fase 1.3 DriftService:**
```typescript
// Install dependencies:
// pnpm add @drift-labs/sdk @solana/web3.js

// Implement DriftService using Drift TypeScript SDK:
import { DriftClient, initialize, PerpMarkets, convertToNumber, PRICE_PRECISION } from '@drift-labs/sdk';
import { Connection } from '@solana/web3.js';

class DriftService {
  private client: DriftClient;
  private connection: Connection;

  constructor() {
    // Use Helius RPC (free tier: 100k requests/day)
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl);

    // Initialize read-only client (no wallet needed)
    const sdkConfig = initialize({ env: 'mainnet-beta' });
    this.client = new DriftClient({ connection: this.connection });

    await this.client.subscribe(); // Subscribe to on-chain account updates
  }

  // Methods to implement:
  // - getMarketData(asset: 'SOL-PERP' | 'BTC-PERP'): price, OI, funding rate, 24h change
  // - getOrderbook(asset, depth): bid/ask levels within 0.2% spread
  // - checkLiquidity(asset): calculate orderbook depth

  // Add 30s caching to reduce RPC calls
  // Use BigNum convertToNumber() for precision handling
  // Error handling: connection timeout, RPC rate limits
}

// Environment variable needed in .env.local:
// SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_key (free tier)
```

---

### Fase 1.3 – Drift SDK Integration (Uitgebreid)

**Doel:** Read-only market data ophalen van Drift Protocol via TypeScript SDK voor SOL-PERP en BTC-PERP.

**Waarom SDK i.p.v. REST API:**
- Drift heeft geen traditionele REST API voor market data
- SDK leest direct van Solana blockchain via RPC endpoint
- On-chain data = authoritative source (geen tussenlaag)
- Type-safe TypeScript interfaces included

**Setup Requirements:**

1. **Dependencies:**
   ```bash
   pnpm add @drift-labs/sdk @solana/web3.js
   ```

2. **Helius RPC Account (Gratis):**
   - Sign up: https://helius.dev
   - Free tier: 100k requests/dag (ruim genoeg voor MVP)
   - Alternative: Public Solana RPC (rate limited)
   - Add to `.env.local`: `SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`

**File Structure:**
```
lib/services/
├── drift.service.ts           # Main service (350-400 lines)
├── __tests__/
│   └── drift.test.ts           # Unit tests met mocks (250 lines)
└── test-drift-live.ts          # Live SDK test (150 lines)
```

**TypeScript Interfaces:**

```typescript
// DriftMarketData - Return type voor getMarketData()
export interface DriftMarketData {
  asset: 'SOL-PERP' | 'BTC-PERP';
  price: number;                    // Oracle price (float)
  bidPrice: number;                 // Best bid
  askPrice: number;                 // Best ask
  openInterest: number;             // OI in base asset (SOL/BTC)
  openInterestUsd: number;          // OI in USD
  fundingRate: number;              // Current funding rate (annualized %)
  fundingRatePer8h: number;         // Funding per 8h (more intuitive)
  volume24h: number;                // 24h volume in USD
  priceChange24h: number;           // 24h price change (%)
  timestamp: number;                // Unix timestamp (ms)
}

// DriftOrderbook - Return type voor getOrderbook()
export interface DriftOrderbook {
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
  spread: number;                   // Spread in % (ask - bid) / mid
  midPrice: number;                 // (bid + ask) / 2
  timestamp: number;
}

// DriftLiquidity - Return type voor checkLiquidity()
export interface DriftLiquidity {
  bidLiquidity: number;             // Total size within 0.2% below mid
  askLiquidity: number;             // Total size within 0.2% above mid
  totalLiquidity: number;           // bidLiquidity + askLiquidity
  isSufficient: boolean;            // true if both sides > threshold
  threshold: number;                // Min liquidity per side (e.g., $10k)
}
```

**Methods to Implement:**

1. **`getMarketData(asset: 'SOL-PERP' | 'BTC-PERP'): Promise<DriftMarketData>`**
   - Fetch perp market account via SDK
   - Get oracle price data
   - Calculate bid/ask prices (AMM + DLOB)
   - Extract OI, funding rate, volume
   - 30s caching (reduce RPC calls)

2. **`getOrderbook(asset, depth = 10): Promise<DriftOrderbook>`**
   - Fetch DLOB (decentralized limit order book)
   - Get AMM liquidity bands
   - Merge DLOB + AMM orders
   - Return top N levels per side

3. **`checkLiquidity(asset): Promise<DriftLiquidity>`**
   - Calculate orderbook depth within 0.2% of mid
   - Used for confluence factor (tight spreads = high conviction)

4. **`getCandles(asset, interval, limit): Promise<DriftCandle[]>` (PRIORITEIT)**
   - **Critical for confluence calculation** - Without candles, 3/6 factors don't work:
     - ❌ RSI (requires 14+ candles)
     - ❌ Order Blocks (requires large move detection)
     - ❌ Fair Value Gaps (requires gap detection between candles)
   - Data sources (in order of preference):
     1. **Drift Historical Data API** (primary) - Native PERP data, most accurate
     2. **Pyth Network** (fallback) - Oracle snapshots, ~95% accurate
     3. **Third-party** (avoid) - Wrong market (Binance PERP ≠ Drift PERP)
   - Returns OHLCV data for technical analysis
   - Used by StrategyEngine for confluence calculation

**Implementation Notes:**

- **BigNum handling**: Drift uses BN (BigNumber) for precision
  ```typescript
  const price = convertToNumber(oracleData.price, PRICE_PRECISION); // 10^6
  const oi = convertToNumber(market.amm.baseAssetAmountWithAmm, BASE_PRECISION);
  ```

- **Market index mapping**:
  ```typescript
  const MARKET_INDEX = {
    'SOL-PERP': 0,
    'BTC-PERP': 1,
  };
  ```

- **Caching strategy**:
  ```typescript
  private cache = new Map<string, { data: DriftMarketData; expiry: number }>();

  private getCached(key: string, ttlMs = 30_000) {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) return cached.data;
    return null;
  }
  ```

- **Error handling**:
  - RPC connection timeout (5s)
  - Rate limit errors (429 from RPC)
  - Invalid market index
  - Uninitialized DriftClient

**Test Strategy:**

1. **Unit Tests (Vitest):**
   - Mock DriftClient responses
   - Test BigNum conversions
   - Test caching logic
   - Test error scenarios (timeout, invalid asset)
   - Target: 20+ tests

2. **Live Integration Test:**
   ```bash
   pnpm test:drift:live  # Run with real RPC
   ```
   - Test SOL-PERP market data fetch
   - Test BTC-PERP market data fetch
   - Verify data structure matches interface
   - Log RPC call latency (should be < 500ms)

**Success Criteria:**
- ✅ getMarketData() returns valid data voor SOL-PERP en BTC-PERP
- ✅ Price matches Drift app UI (within 0.5%)
- ✅ Caching reduces RPC calls (30s TTL)
- ✅ All unit tests pass
- ✅ Live test succeeds on Helius free tier
- ✅ No TypeScript errors

**Scripts to Add:**
```json
{
  "test:drift": "vitest run lib/services/__tests__/drift.test.ts",
  "test:drift:live": "tsx lib/services/test-drift-live.ts"
}
```

---

### Fase 1.3.1 – Binance Candles Service (Historical Data)

**Doel:** OHLCV (Open-High-Low-Close-Volume) candle data voor technical analysis ophalen.

**Waarom Binance i.p.v. Drift:**
- Drift heeft **geen native OHLCV/historical data API**
- **CRITICAL issue:** Zonder candles werken 3/6 confluence factoren niet:
  - ❌ RSI (requires 14+ candles)
  - ❌ Order Blocks (requires large move detection)
  - ❌ Fair Value Gaps (requires gap detection between candles)
- Binance SOLUSDT/BTCUSDT Perpetuals: ~95% price correlation met Drift
- **Trade-off accepted:** Binance funding rates ≠ Drift funding (use DriftService voor funding/OI)
- Gratis, hoge rate limits (2400 req/min), stabiel

**Implementation:**

1. **BinanceCandlesService** (272 lines)
   ```typescript
   class BinanceCandlesService {
     async getCandles(
       symbol: 'SOLUSDT' | 'BTCUSDT',
       interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
       limit: number = 100
     ): Promise<DriftCandle[]>
   }
   ```
   - Fetches from Binance Futures API: `https://fapi.binance.com/fapi/v1/klines`
   - Returns `DriftCandle[]` interface (shared type met StrategyEngine)
   - 5min caching (candles don't change often, reduce API calls)
   - Error handling: timeout (10s), rate limit (429), network errors
   - Data validation: OHLC consistency (H ≥ O/C, L ≤ O/C), ascending timestamps

2. **DriftService Integration**
   - Added `getCandles()` method to DriftService (delegates to BinanceCandlesService)
   - Asset mapping: SOL-PERP → SOLUSDT, BTC-PERP → BTCUSDT
   - Transparent for callers: `driftService.getCandles('SOL-PERP', '1h', 100)`

3. **Test Suite** (356 lines, 23 tests)
   - Input validation (7 tests): symbols, intervals, limit range
   - Data transformation (3 tests): Binance kline → DriftCandle format
   - Cache behavior (3 tests): TTL, different cache keys, clearCache()
   - Error handling (5 tests): 429 rate limit, 500 server error, timeout, network error
   - Data validation (4 tests): ascending timestamps, OHLC consistency
   - Integration (1 test): compatibility met StrategyEngine

**Live Test Results:**
```
✅ SOLUSDT: $203.38, 100 candles, 509ms latency
✅ BTCUSDT: $115,757, 100 candles, 255ms latency
✅ All intervals work (1m, 5m, 15m, 1h, 4h, 1d)
✅ Caching works (0ms cached vs 292ms API)
✅ RSI calculation ready (+10.58% price change over 100h)
✅ Confluence factors detected (7 S/R, 8 FVG, 7 OB)
```

**Files Created:**
- `lib/services/binance-candles.service.ts` (272 lines)
- `lib/services/__tests__/binance-candles.test.ts` (356 lines)
- `lib/services/test-binance-live.ts` (223 lines)

**Files Modified:**
- `lib/services/drift.service.ts`: Added `getCandles()` method (+41 lines)
- `lib/services/index.ts`: Added Binance exports
- `lib/services/test-drift-live.ts`: Added candles + RSI tests (+87 lines)
- `package.json`: Added `test:candles` + `test:candles:live` scripts

**Scripts Added:**
```json
{
  "test:candles": "vitest run lib/services/__tests__/binance-candles.test.ts",
  "test:candles:live": "tsx lib/services/test-binance-live.ts"
}
```

**Success Criteria:**
- ✅ All 23 unit tests passing
- ✅ Live API test succeeds (no rate limits, free endpoint)
- ✅ Data structure compatible met StrategyEngine (DriftCandle interface)
- ✅ Caching reduces API calls (5min TTL)
- ✅ No TypeScript errors
- ✅ Price accuracy ~95% vs Drift (acceptable for technical patterns)

**Trade-offs Accepted:**
- Binance funding rates ≠ Drift funding rates (use DriftService.getMarketData() for funding/OI)
- ~1-2% price difference acceptable for technical patterns (RSI, S/R, FVG, OB)
- Future improvement: Replace with Drift Historical Data API when available

**Why This Matters:**
- **Unlocks 3/6 confluence factors** (RSI, Order Blocks, Fair Value Gaps)
- StrategyEngine.calculateConfluence() now fully functional
- Claude can provide informed setup analysis (needs candles for technical indicators)
- MVP progression: ~38% complete (6.5/12 subfases)

---

### Fase 2 – Chat Interface
**Doel:** Conversational setup analysis met Claude werkend krijgen, inclusief tool calling.

**Taken:**
1. Build MessageBubble, MessageList, MessageInput components
2. Implement `/api/chat` route met SSE streaming
3. Add Claude function calling (6 tools: fetch_drift_data, calculate_confluence, etc.)
4. Create ContextSidebar met real-time confluence display
5. Persist conversations in database (messages table)

**Snippet (Cursor prompt):**
```
Create Claude service with function calling.
Tools: fetch_drift_data (calls DriftService), calculate_confluence (calls StrategyEngine).
Implement streaming response via SSE (Server-Sent Events).
Handle tool execution: Claude calls tool → execute → return result → Claude continues.
```

---

### Fase 3 – Calculator & Trade Log
**Doel:** Position sizing calculator en trade history management.

**Taken:**
1. Build position calculator form (entry, stop, targets inputs)
2. Implement position sizing logic (1% risk formula, liquidation calculation)
3. Add R:R validation + visual bars + warnings
4. Create trade log table (sortable, filterable)
5. Implement trade CRUD API routes (`/api/trades`)
6. Build trade detail modal met evaluation feature
7. Implement Claude trade evaluation (post-trade analysis)

**Snippet (Cursor prompt):**
```
Build position calculator:
- Inputs: entry_price, stop_loss, account_size, risk_pct (default 1%)
- Calculate: position_size = (account_size * risk_pct) / (entry - stop)
- Display: notional value, margin required (10x leverage), liquidation price
- Warnings: if R:R < 1.5:1 or liquidation < 8% away
Use shadcn/ui Input, Card, Badge components. Show visual bars for risk/reward.
```

---

### Fase 4 – Dashboard & Integration
**Doel:** Landing page bouwen en alle flows end-to-end testen.

**Taken:**
1. Build dashboard Quick Scan card (asset selector + live stats)
2. Build Recent Activity feed (last 3 trades + chats)
3. Implement global navigation (header met links)
4. Test complete user flow (dashboard → chat → calculate → log → evaluate)
5. Add loading states (Skeleton) en error boundaries
6. Implement dark mode + responsive design (mobile/tablet/desktop)

**Snippet (Cursor prompt):**
```
Create dashboard page:
- Quick Scan card: dropdown to select SOL-PERP or BTC-PERP
- Display live data: price, 24h change, RSI, OI change, funding rate
- Fetch via SWR with 30s refresh interval
- Action buttons: "Analyze with Claude" (navigate to /chat), "Calculate Position" (navigate to /calculator)
Use shadcn/ui Card, Select, Button components.
```

---

## 6. Kwaliteit & Testplan

**Testing Strategy:**

**Unit Tests (Vitest):**
- Services: StrategyEngine (RSI, confluence, position sizing), DriftService (mocked API)
- Utilities: Validators (Zod schemas), formatters (date, currency)
- Target: >80% coverage voor business logic

**Integration Tests (Supertest):**
- API Routes: `/api/chat` (POST), `/api/trades` (GET/POST/PUT/DELETE)
- Database: Repository methods (create, read, update, delete)
- Target: >70% coverage

**E2E Tests (Playwright):**
- Flow 1: Setup analysis (type message → Claude responds with confluence → embedded buttons work)
- Flow 2: Position calculation (fill form → verify calculations → log trade)
- Flow 3: Trade evaluation (view trade → click evaluate → verify Claude analysis)
- Target: 3 critical flows covered

**Manual Testing:**
- Smoke test: Complete user journey (FO §10.1) op local + production
- Responsive test: Mobile Safari, tablet, desktop Chrome
- Dark mode: Toggle theme, verify all screens

**Quality Gates:**
- All tests pass (CI/CD pipeline)
- No TypeScript errors (`pnpm type-check`)
- No ESLint warnings (`pnpm lint`)
- Lighthouse score: >90 performance, >95 accessibility

---

## 7. Demo & Presentatieplan

**Demo Scenario:**

**Duur:** 10-15 minuten

**Flow:**
1. **Dashboard** (1 min)
   - Open app → Show SOL at $138, RSI 34 (oversold)
   - Click "Analyze with Claude"

2. **Chat Analysis** (3 min)
   - Type: "SOL at $138, is this a setup?"
   - Show Claude streaming response → Fetching data → Confluence 5/6
   - Claude verdict: "POTENTIAL SETUP, but WAIT for US session (volume low)"
   - Ask follow-up: "Why is volume important?" → Claude explains

3. **Position Calculator** (2 min)
   - Click embedded "Calculate Position" button
   - Show pre-filled values (entry $138.50, stop $136.50, target $145)
   - Show position size: 250 SOL, R:R 3.4:1 ✅, liq $124.65 (safe ✅)
   - Click "Log Trade"

4. **Trade Log** (2 min)
   - Modal opens with pre-filled data
   - Add reasoning: "Entered on FVG retest, waited for volume"
   - Add emotional note: "Felt FOMO earlier but held discipline"
   - Save → Trade appears in log table

5. **Trade Evaluation** (3 min)
   - Fast-forward: "Trade closed at $147.20 (+6.3%)"
   - Click trade row → Detail modal
   - Click "Evaluate with Claude"
   - Show streaming evaluation: What went right, what could be better, learnings
   - Highlight: "FVG + OI divergence = your edge (5/5 wins)"

**Environment:**
- Production URL (Vercel): https://trade-level-up.vercel.app
- Test data: 3 historical trades (2 wins, 1 loss) + 1 open position
- Real APIs: Drift (live SOL/BTC data), Claude (real responses)

**Audience:** Colin (self-demo), potentieel toekomstige users

---

## 8. Risico's & Mitigatie

| Risico | Impact | Waarschijnlijkheid | Mitigatie |
|--------|---------|-------------------|-----------|
| **Claude API rate limits** | Hoog | Middel | Implement caching (SWR), retry logic, graceful degradation (show last cached response) |
| **Drift API downtime** | Middel | Laag | Health check before calls, fallback to CryptoCompare API (secondary source) |
| **SQLite file corruption** | Hoog | Zeer Laag | Daily automated backups (TO §8.5), Git-track strategy configs |
| **Complex confluence calculation bugs** | Hoog | Middel | Extensive unit tests, manual validation vs TradingView indicators |
| **Vercel cold start latency** | Middel | Middel | Use Vercel Edge Functions voor `/api/data/*` endpoints (low latency) |
| **Overfitting strategy** | Hoog | Hoog | Cross-validation, out-of-sample testing, conservative criteria (min 4/6 confluence) |
| **Scope creep (feature bloat)** | Middel | Hoog | Strict MVP scope, defer Phase 2-4 features, YAGNI principle |
| **Time pressure (5 weeks)** | Hoog | Middel | Focus on critical path (chat + calculator + log), cut nice-to-haves (equity curve, alerts) |

**Contingency Plan:**
- If 5 weeks insufficient: Cut Dashboard (start on `/chat`), defer evaluation feature to Phase 2
- If Drift API problematic: Switch to Hyperliquid API (architecture supports)
- If Claude costs exceed budget: Reduce context window (use summaries), cache responses aggressively

---

## 9. Evaluatie & Lessons Learned

**Post-MVP Retrospective (na Week 5):**

**Te evalueren:**
1. **Development velocity:** Haalden we de 5-week deadline? Waar liepen we vast?
2. **Architecture decisions:** Was Next.js App Router + SQLite de juiste keuze? Bottlenecks?
3. **Claude integration:** Werkte function calling zoals verwacht? Prompt quality issues?
4. **User experience:** Is de flow intuïtief? Te veel clicks? Te veel cognitive load?
5. **Code quality:** Technische schuld opgebouwd? Refactor nodig voor Phase 2?

**Inzichten documenteren:**
- What worked: [Vul in na afloop]
- What didn't: [Vul in na afloop]
- Surprises: [Vul in na afloop]
- Next iteration improvements: [Vul in na afloop]

**Success Metrics (PRD §6):**
- ✅ Bot identificeert 3-5 setups/week (niet te veel ruis)
- ✅ Confluence score ≥4 voor alle signalen
- ✅ User neemt ≥80% van HIGH conviction signals
- ✅ Win rate >50% (minimum 15 trades sample over 3 maanden)
- ✅ System uptime >95% (scheduled scans completion rate)

---

## 10. Referenties

**Mission Control Documenten:**
- **PRD v2.0** – Product Requirements Document (waarom, wat, success criteria)
  - Zie: Doelstelling, Kernfunctionaliteiten, Succescriteria, Risico's
- **FO v2.0** – Functioneel Ontwerp (user flows, schermen, AI interacties)
  - Zie: User Stories, Functionele werking per onderdeel, User Journey Examples
- **TO v2.0** – Technisch Ontwerp (architectuur, API specs, deployment)
  - Zie: System Architecture, Database Schema, Service Layer, API Endpoints
- **Screen Specifications v2.0** – Component library, UI states, responsive design
  - Zie: shadcn/ui components, Layout grids, Loading/Error states

**Externe Resources:**
- Drift Protocol Docs: https://docs.drift.trade/
- Anthropic Claude API: https://docs.anthropic.com/
- Next.js 14 Docs: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com/
- Coinglass API: https://www.coinglass.com/api

**Code Repository:**
- GitHub: [TODO: Add repo URL]
- Vercel: [TODO: Add production URL]

---

**Einde Bouwplan v2.0**

*Dit document dient als development roadmap voor de MVP implementatie (Week 1-5). Voor product context zie PRD, voor UI details zie FO/Screen Specs, voor technische specs zie TO.*
