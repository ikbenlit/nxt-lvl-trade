# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Trading Decision Support Bot** - A Next.js application that provides intelligent trading analysis for cryptocurrency perpetual futures (SOL-PERP, BTC-PERP) on Drift Protocol using Claude AI. This is NOT a fully autonomous trading bot, but a **decision support system** that helps identify high-quality swing trading setups.

**Key Philosophy**: Quality over quantity. Provides 3-5 high-conviction setups per week, not 20+ daily signals. Emphasizes confluence-based analysis (minimum 4/6 factors) and strict risk management (1% per trade).

## Common Commands

### Development
```bash
pnpm dev                    # Start Next.js dev server (port 3000)
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm type-check             # TypeScript type checking (no errors expected)
pnpm lint                   # ESLint validation
```

### Database (Drizzle ORM + SQLite)
```bash
pnpm db:generate            # Generate migrations from schema
pnpm db:push                # Push schema to database (dev workflow)
pnpm db:studio              # Open Drizzle Studio GUI (http://localhost:4983)
```

**Database location**: `./data/trading-bot.db` (SQLite file, git-ignored)

### Testing

**Unit Tests** (Vitest):
```bash
pnpm test:unit              # Run all unit tests
pnpm test:repos             # Test repository layer (trades, conversations)
pnpm test:strategy          # Test strategy engine (RSI, confluence, position sizing)
pnpm test:claude            # Test Claude service (mocked)
pnpm test:drift             # Test Drift service (mocked)
pnpm test:candles           # Test Binance candles service (mocked)
```

**Live Integration Tests** (tsx scripts, cost money/use real APIs):
```bash
pnpm test:claude:live       # Test Claude API (uses ANTHROPIC_API_KEY)
pnpm test:drift:live        # Test Drift SDK + Helius RPC (uses SOLANA_RPC_URL)
pnpm test:candles:live      # Test Binance Futures API (free, no key needed)
```

**Important**: Live tests should pass before committing. Unit tests must always pass.

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
│  app/page.tsx, app/chat/page.tsx, app/api/chat/route.ts │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 React Components Layer                   │
│  components/chat/* (MessageBubble, MessageList, Input)   │
│  components/shared/* (ConfluenceDisplay)                 │
│  components/ui/* (shadcn/ui primitives)                  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│               Service Layer (Business Logic)             │
│  lib/services/claude.service.ts       - AI chat          │
│  lib/services/strategy-engine.service.ts - Confluence    │
│  lib/services/drift.service.ts        - Market data      │
│  lib/services/binance-candles.service.ts - OHLCV data    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Repository Layer (Data Access)              │
│  lib/db/repositories/trades.repository.ts                │
│  lib/db/repositories/conversations.repository.ts         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  Database Layer (SQLite)                 │
│  lib/db/schema.ts  - 7 tables (trades, conversations,    │
│                      learnings, strategy_versions, etc)  │
│  lib/db/client.ts  - Drizzle ORM client                  │
└─────────────────────────────────────────────────────────┘
```

### Core Data Flow: Chat with Function Calling

1. **User sends message** → `app/chat/page.tsx` → `useChat` hook
2. **POST /api/chat** → Validates, gets/creates thread, loads history
3. **Claude API** with tools (fetch_drift_data, calculate_confluence, calculate_position_size)
4. **Function calling loop**:
   - Claude requests tool → API executes → Returns result → Claude continues
   - Can chain multiple tools (e.g., fetch data → calculate confluence → calculate position)
5. **SSE stream** to client: `chunk`, `tool_use`, `tool_result`, `done`, `error` events
6. **Persist** conversation to `conversation_messages` table
7. **Client renders** streamed response with tool badges

### Database Schema (7 Tables)

**Critical relationships**:
- `trades` ←1:N→ `conversation_threads` (via `relatedTradeId`)
- `conversation_threads` ←1:N→ `conversation_messages` (cascade delete)
- `learnings` references `trades` via JSON array (`supportingTradeIds`)

**Key fields**:
- `trades.confluenceScore` (0-6): Confluence factors count (RSI, S/R, OI, FVG, OB, funding)
- `trades.userReasoning`: Critical for learning loop (why user took/skipped trade)
- `conversation_messages.toolsUsed`: JSON array tracking Claude function calls
- `api_logs.costUsd`: Claude API cost tracking

### Service Singletons

All services are **singleton instances** (exported as `strategyEngine`, `claudeService`, etc.):

```typescript
// ✅ CORRECT - Import singleton
import { strategyEngine, driftService } from '@/lib/services';

// ❌ WRONG - Don't instantiate
import { StrategyEngine } from '@/lib/services';
const engine = new StrategyEngine(); // Avoid this
```

**Rationale**: Services maintain state (caches, connections). Singletons ensure consistent behavior.

### External API Integrations

| Service | Purpose | Data Source | Rate Limits | Cost |
|---------|---------|-------------|-------------|------|
| **DriftService** | Market data (price, OI, funding) | Helius RPC → Drift on-chain | 100k req/day (free) | Free |
| **BinanceCandlesService** | OHLCV candles for TA | Binance Futures API | 2400 req/min | Free |
| **ClaudeService** | AI chat + function calling | Anthropic Claude API | Project limits | $3/1M input, $15/1M output |

**Important**:
- Drift SDK reads **on-chain** data (no REST API)
- Binance is used for **candles only** (Drift doesn't have historical OHLCV)
- ~95% price correlation accepted (SOL-PERP vs SOLUSDT)
- Funding rates: Always use Drift (Binance funding ≠ Drift funding)

### Caching Strategy

**DriftService** (30s TTL):
```typescript
// Market data cached for 30s to reduce RPC calls
await driftService.getMarketData('SOL-PERP'); // Fetches from RPC
await driftService.getMarketData('SOL-PERP'); // Returns cached (within 30s)
```

**BinanceCandlesService** (5min TTL):
```typescript
// Candles don't change often, 5min cache is safe
await binanceCandlesService.getCandles('SOLUSDT', '1h', 100);
```

**Rationale**: Swing trading doesn't need real-time data. Caching reduces API costs and latency.

## Development Workflows

### Adding a New Service

1. Create service file in `lib/services/` (e.g., `coinglass.service.ts`)
2. Define singleton: `export const coinglassService = new CoinglassService();`
3. Add unit tests in `lib/services/__tests__/`
4. Add live test script in `lib/services/test-coinglass-live.ts`
5. Export from `lib/services/index.ts`
6. Add test scripts to `package.json`

### Adding a New Claude Tool

1. Define tool in `lib/tools/index.ts`:
   - Add to `tools` array (schema for Claude API)
   - Implement handler in `executeTool()` switch
2. Tool executes in `/api/chat` route during function calling loop
3. Test with live chat: "use [tool_name] to check SOL"

### Database Schema Changes

1. Edit `lib/db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Apply: `pnpm db:push`
4. Update TypeScript types (auto-inferred via Drizzle)
5. Test queries: `pnpm db:studio` (GUI)

**Important**: SQLite doesn't support column renames/drops easily. Use migrations carefully.

### Testing Strategy

**Unit tests** (lib/services/__tests__/):
- Mock external APIs (Anthropic, Drift, Binance)
- Test business logic in isolation
- Target: >80% coverage for services

**Live tests** (lib/services/test-*-live.ts):
- Validate real API integrations
- Run before major releases
- Document in commit messages

**No E2E yet**: Phase 5 will add Playwright tests for critical flows.

## Configuration Files

### Environment Variables (.env.local)

```bash
# Required for MVP
ANTHROPIC_API_KEY=sk-ant-...              # Claude API (required)
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=...  # Helius RPC (required)
DATABASE_URL=./data/trading-bot.db        # SQLite path (default)

# Optional (Phase 2+)
COINGLASS_API_KEY=...                     # Liquidation data (optional)
```

**Security**: `.env.local` is git-ignored. Never commit secrets.

### Import Aliases

```typescript
import { db } from '@/lib/db';                    // Database client
import { trades, Trade } from '@/lib/db';         // Schema + types
import { strategyEngine } from '@/lib/services';  // Services
import { Button } from '@/components/ui/button';  // UI components
```

**Path mapping**: `@/*` → project root (configured in `tsconfig.json`)

## Code Principles (from Bouwplan)

**DRY**: Services as single source of truth (e.g., `strategyEngine.calculateConfluence()`)
**SoC**: API routes → Services → Database (clear separation)
**KISS**: Avoid over-engineering in MVP (YAGNI principle)
**Type Safety**: TypeScript strict mode, Zod schemas for API inputs

**File Naming**:
- Components: `PascalCase.tsx` (MessageBubble.tsx)
- Services: `kebab-case.ts` (claude.service.ts)
- API routes: `route.ts` (Next.js App Router convention)

## Phase Status (from Bouwplan v2.0)

**Current Phase**: 2.4 (Context Sidebar - Real-time Confluence)
**MVP Progress**: ~50% (8/12 subfases)

**Completed**:
- ✅ Fase 0: Project setup (Next.js, dependencies, shadcn/ui, git)
- ✅ Fase 1.1: Database schema (7 tables, Drizzle ORM)
- ✅ Fase 1.2: Repository pattern (TradesRepository, ConversationsRepository)
- ✅ Fase 1.3: Drift SDK integration (market data, orderbook, liquidity)
- ✅ Fase 1.3.1: Binance Candles Service (OHLCV data)
- ✅ Fase 1.5: Strategy Engine (confluence calculation, position sizing)
- ✅ Fase 1.6: Claude service (basic chat, streaming, error handling)
- ✅ Fase 2.1: Chat UI components (MessageBubble, MessageList, MessageInput)
- ✅ Fase 2.2: SSE Streaming (/api/chat route, useChat hook)
- ✅ Fase 2.3: Claude Function Calling (3 tools)

**Next**:
- ⏳ Fase 2.4: Context sidebar (real-time confluence display)
- ⏳ Fase 2.5: Message persistence verification
- ⏳ Fase 3: Calculator & Trade Log (position calculator + trade CRUD)

## Key Design Decisions

### Why SQLite?
- Single-user MVP (no concurrency needed)
- Simple deployment (file-based, no server)
- Fast for read-heavy workloads (trade history queries)
- Easy backups (copy file)

### Why Binance for Candles?
- Drift has **no native OHLCV/historical data API**
- Without candles: 3/6 confluence factors fail (RSI, Order Blocks, Fair Value Gaps)
- Trade-off accepted: ~5% price variance vs Drift (acceptable for pattern detection)
- **Always use Drift for funding/OI** (Binance funding ≠ Drift funding)

### Why Singleton Services?
- Caching state (avoid redundant API calls)
- Connection pooling (Drift SDK subscription)
- Consistent behavior across requests
- Simpler testing (mock once, use everywhere)

### Why Server-Sent Events (SSE)?
- Streaming text improves UX (feels faster)
- Function calling requires multiple round-trips (Claude → tool → Claude)
- Status updates ("Running tool...") keep user informed
- Simpler than WebSockets for one-way streaming

## Debugging Tips

### Claude API Issues
```bash
pnpm test:claude:live     # Verify API key + connectivity
# Check logs: console.log in lib/services/claude.service.ts
```

### Drift/RPC Issues
```bash
pnpm test:drift:live      # Verify Helius RPC + Drift SDK
# Check network: curl https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### Database Issues
```bash
pnpm db:studio            # Visual inspection of data
# Check file exists: ls -lh ./data/trading-bot.db
# Rebuild: rm ./data/trading-bot.db && pnpm db:push
```

### Type Errors
```bash
pnpm type-check           # Must show 0 errors
# Common fix: Restart TS server in VSCode (Cmd+Shift+P → Restart TS)
```

## Documentation References

**Mission Control Docs** (in `docs/`):
- `Bouwplan_v2.0.md` - Development roadmap (this is the master plan)
- `PRD_AI_Trading_Bot_v2.0.md` - Product requirements
- `TO_AI_Trading_Bot_v2.0.md` - Technical architecture
- `Screen_Specifications_v2.0.md` - UI component specs

**External Docs**:
- Drift Protocol: https://docs.drift.trade/
- Anthropic Claude: https://docs.anthropic.com/
- Next.js 14: https://nextjs.org/docs
- Drizzle ORM: https://orm.drizzle.team/

**Session Logs**: Check `SESSION-SUMMARY.md` and `docs/SESSIONLOG-*.md` for implementation notes.
