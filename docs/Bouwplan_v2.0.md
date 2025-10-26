# 🚀 Mission Control – Bouwplan AI Trading Decision Support Bot

**Projectnaam:** AI Trading Decision Support Bot
**Versie:** v2.0
**Datum:** 26-10-2025
**Auteur:** Colin

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
| 0 | Project Setup | Repo, dependencies, boilerplate | Week 1 (2d) | ⏳ To Do | TO §7.1 |
| 1 | Database & Core Services | SQLite schema, repositories, Drift/Coinglass API | Week 1-2 (5d) | ⏳ To Do | TO §4, §6 |
| 2 | Chat Interface | Conversational setup analysis met Claude | Week 2-3 (5d) | ⏳ To Do | FO §4.2, Screen Specs §3.3 |
| 3 | Calculator & Trade Log | Position sizing + trade CRUD | Week 3-4 (5d) | ⏳ To Do | FO §4.3-4.4, Screen Specs §3.4-3.5 |
| 4 | Dashboard & Integration | Landing page + end-to-end flows | Week 4 (3d) | ⏳ To Do | FO §4.1, Screen Specs §3.2 |
| 5 | Testing & Deployment | E2E tests, bug fixes, Vercel deploy | Week 5 (5d) | ⏳ To Do | TO §10, §8 |

---

## 4. Subfases (uitwerking per fase)

### Fase 0 — Project Setup

| Subfase | Doel | Status | Afhankelijkheden | Referentie |
|----------|------|--------|------------------|------------|
| 0.1 | Next.js project initialisatie | ⏳ | — | TO §7.1 |
| 0.2 | Dependencies installeren | ⏳ | 0.1 | TO §3, Appendix §14.2 |
| 0.3 | shadcn/ui component library setup | ⏳ | 0.2 | Screen Specs §2.1 |
| 0.4 | Database schema & migrations | ⏳ | 0.2 | TO §4.1 |
| 0.5 | Environment variables configureren | ⏳ | 0.1 | TO §8.1 |
| 0.6 | Git repository + initial commit | ⏳ | 0.5 | TO §13.3 |

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
| 1.1 | SQLite schema implementeren | ⏳ | 0.4 | TO §4.1 (volledige schema) |
| 1.2 | Repository pattern implementeren | ⏳ | 1.1 | TO §4.2 (TradesRepository) |
| 1.3 | Drift API service | ⏳ | 0.2 | TO §6.2 (DriftService) |
| 1.4 | Coinglass API service | ⏳ | 0.2 | TO §6.2 (analoog aan Drift) |
| 1.5 | Strategy Engine (confluence) | ⏳ | 1.3 | TO §6.3 (StrategyEngine) |
| 1.6 | Claude service skeleton | ⏳ | 0.2 | TO §6.1 (basis zonder tools) |

**Details:**
- Schema: Copy volledige SQL van TO §4.1, run via `pnpm db:migrate`
- Repositories: Implementeer TradesRepository (CRUD + analytics), ConversationsRepository
- Drift: Implementeer `getMarketData()`, `getCandles()`, `getOrderbook()`, `checkLiquidity()`
- Coinglass: Implementeer `getLiquidations()` met caching (30s)
- Strategy: Implementeer `calculateConfluence()` met alle 6 factoren (RSI, OI, FVG, OB, liq, funding)
- Claude: Basic `chat()` method zonder tools (test met "Hello" → response)

**Test:**
- Unit test: `StrategyEngine.calculateRSI()` met mock candles
- Integration test: Drift API call → verify response structure
- Database test: Insert trade → read back → verify data

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
1. Implementeer volledige SQLite schema (trades, conversations, learnings tables)
2. Build TradesRepository met CRUD + analytics methods
3. Create DriftService voor market data, candles, orderbook
4. Create CoinglassService voor liquidation clusters
5. Build StrategyEngine voor confluence calculation (6 factors)
6. Implement Claude service skeleton (basic chat, no tools yet)

**Snippet (Cursor prompt):**
```
Implement DriftService class with methods:
- getMarketData(asset: string): fetch price, OI, funding from Drift API
- getCandles(asset, interval, limit): fetch OHLCV data
- checkLiquidity(asset): calculate orderbook depth within 0.2% spread
Add axios retry logic (3 attempts, exponential backoff).
```

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
