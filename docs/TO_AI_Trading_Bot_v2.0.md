# 🏗️ Technisch Ontwerp (TO) – AI Trading Decision Support Bot

**Projectnaam:** AI Trading Decision Support Bot
**Versie:** v2.0
**Datum:** 26-10-2025
**Auteur:** Colin

---

## 1. Doel en Relatie met PRD/FO

🎯 **Doel van dit document:**

Het Technisch Ontwerp (TO) beschrijft **hoe** de AI Trading Decision Support Bot technisch gebouwd wordt — architectuur, tech stack, API specs, data models, en deployment strategie.

📘 **Relatie met PRD/FO:**

- **PRD bepaalt WAT:** Trading decision support voor SOL-PERP/BTC-PERP swing trading
- **FO bepaalt HOE (UX):** Schermen, flows, user interactions
- **TO bepaalt HOE (Tech):** Code architectuur, API contracts, database schemas, deployment

**Scope:**
- **In Scope:** MVP (Phase 1) technische implementatie details
- **Toekomstig:** Phase 2-4 features als referentie (niet gedetailleerd)

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  (Browser - Desktop/Mobile)                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Next.js 14 Frontend (React)                 │   │
│  │  - Server Components (SSR)                          │   │
│  │  - Client Components (Interactive UI)              │   │
│  │  - SWR (Client-side data fetching)                 │   │
│  │  - SSE Client (Streaming Claude responses)         │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   APPLICATION LAYER                         │
│      (Next.js 14 App Router + API Routes)                   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes (Backend)                    │  │
│  │  /api/chat          - Claude interaction            │  │
│  │  /api/trades        - CRUD operations               │  │
│  │  /api/calculator    - Position sizing               │  │
│  │  /api/data/*        - External API proxies          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                Service Layer                         │  │
│  │  ├─ claude_service.ts     (AI orchestration)        │  │
│  │  ├─ drift_service.ts      (Trading data)            │  │
│  │  ├─ coinglass_service.ts  (Liquidations)            │  │
│  │  ├─ strategy_engine.ts    (Confluence calc)         │  │
│  │  └─ database_service.ts   (Data persistence)        │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬───────┬────────┬──────────────────┘
                         │       │        │
        ┌────────────────┘       │        └──────────────────┐
        │                        │                           │
┌───────▼────────┐   ┌───────────▼──────────┐   ┌───────────▼────────┐
│ EXTERNAL APIs  │   │   DATA LAYER         │   │   INFRASTRUCTURE   │
│                │   │                      │   │                    │
│ Claude API     │   │  SQLite Database     │   │  Vercel (Deploy)   │
│ Drift API      │   │  (better-sqlite3)    │   │  Node.js Runtime   │
│ Coinglass API  │   │  - trades            │   │  Environment Vars  │
│ Helius RPC     │   │  - conversations     │   │                    │
│ CryptoCompare  │   │  - learnings         │   │                    │
│ Yahoo Finance  │   │  - settings          │   │                    │
└────────────────┘   └──────────────────────┘   └────────────────────┘
```

### 2.2 Architecture Principles

**Design Patterns:**
1. **Server-First:** Leverage Next.js Server Components voor initial load performance
2. **API-as-Backend:** Next.js API routes als backend (geen separate Express server)
3. **Service Layer Pattern:** Business logic in services (niet in routes/components)
4. **Repository Pattern:** Database access via typed repositories
5. **Error Boundaries:** Graceful degradation bij API failures

**Key Decisions:**
| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Frontend Framework** | Next.js 14 (App Router) | SSR, API routes, file-based routing, Vercel-optimized |
| **Language** | TypeScript | Type safety, better DX, catch errors at compile time |
| **Database** | SQLite (better-sqlite3) | Local-first, zero config, fast for single-user, easy backups |
| **AI Provider** | Anthropic Claude API | Best-in-class reasoning, function calling, 200k context window |
| **UI Library** | shadcn/ui + Radix UI | Accessible, customizable, Tailwind-native |
| **Styling** | Tailwind CSS | Utility-first, fast development, consistent design |
| **State Management** | React Context + Zustand | Simple for MVP, can scale to Zustand for complex state |
| **Data Fetching** | SWR (client) + Server Components | Caching, revalidation, optimistic updates |
| **Deployment** | Vercel | Next.js native, serverless, auto-scaling, free tier |

---

## 3. Tech Stack Detailed

### 3.1 Frontend Stack

**Core:**
- **Framework:** Next.js 14.2+ (App Router)
- **Language:** TypeScript 5.4+
- **React:** 18.3+

**UI Components:**
- **Component Library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS 3.4+
- **Icons:** lucide-react
- **Forms:** react-hook-form + zod (validation)
- **Charts:** recharts (for equity curve, Phase 2)

**Data Fetching:**
- **Client-side:** SWR 2.2+
- **Server-side:** Native fetch (Next.js extended)
- **Streaming:** Server-Sent Events (native EventSource)

**State Management:**
- **Global State:** Zustand 4.5+ (lightweight)
- **Server State:** SWR cache
- **URL State:** Next.js searchParams

### 3.2 Backend Stack

**Runtime:**
- **Environment:** Node.js 20+ (Vercel serverless functions)
- **Framework:** Next.js API Routes (App Router)
- **Language:** TypeScript 5.4+

**Database:**
- **Database:** SQLite 3.45+
- **Driver:** better-sqlite3 (synchronous, fast)
- **ORM:** Drizzle ORM 0.30+ (optional, type-safe queries)
- **Migrations:** Drizzle Kit (migration management)

**External APIs:**
- **AI:** @anthropic-ai/sdk 0.20+
- **Drift:** Custom client (REST API wrapper)
- **Solana:** @solana/web3.js 1.91+ (Phase 3)
- **HTTP Client:** Axios 1.6+ (with retry logic)

**Utilities:**
- **Date/Time:** date-fns 3.3+
- **Validation:** zod 3.22+
- **Logging:** pino 8.19+ (structured logging)
- **Environment:** dotenv 16.4+

### 3.3 Development Tools

**Code Quality:**
- **Linting:** ESLint 8+ (next/core-web-vitals config)
- **Formatting:** Prettier 3.2+
- **Type Checking:** TypeScript compiler (strict mode)
- **Pre-commit:** Husky + lint-staged

**Testing:**
- **Unit Tests:** Vitest 1.4+ (fast, Vite-powered)
- **E2E Tests:** Playwright 1.42+
- **API Tests:** Supertest (for API routes)
- **Coverage:** Vitest coverage (c8)

**Build Tools:**
- **Package Manager:** pnpm 8.15+ (fast, disk-efficient)
- **Bundler:** Next.js built-in (Turbopack in dev)
- **TypeScript Compiler:** tsc (type checking only, no emit)

---

## 4. Database Design

### 4.1 Schema (SQLite)

**Full Schema with Indexes:**

```sql
-- ============================================
-- CORE TABLES
-- ============================================

-- Trades table (central entity)
CREATE TABLE trades (
    -- Primary Key
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Trade Identification
    asset TEXT NOT NULL CHECK(asset IN ('SOL-PERP', 'BTC-PERP')),
    direction TEXT NOT NULL CHECK(direction IN ('long', 'short')),

    -- Entry Details
    entry_price REAL NOT NULL CHECK(entry_price > 0),
    entry_timestamp DATETIME NOT NULL,
    entry_size REAL NOT NULL, -- Position size in asset units (e.g., 250 SOL)
    leverage REAL NOT NULL DEFAULT 1.0 CHECK(leverage >= 1 AND leverage <= 10),

    -- Exit Details (nullable until trade closes)
    exit_price REAL CHECK(exit_price IS NULL OR exit_price > 0),
    exit_timestamp DATETIME,
    exit_reason TEXT CHECK(exit_reason IS NULL OR exit_reason IN ('target_1', 'target_2', 'target_3', 'stop', 'manual', 'liquidation')),

    -- Risk Management
    stop_loss REAL NOT NULL CHECK(stop_loss > 0),
    target_1 REAL CHECK(target_1 IS NULL OR target_1 > 0),
    target_2 REAL,
    target_3 REAL,

    -- Performance Metrics
    pnl_pct REAL, -- P&L as percentage
    pnl_usd REAL, -- P&L in USD
    hold_duration_hours REAL,
    r_multiple REAL, -- Actual R:R achieved (target_hit - entry) / (entry - stop)

    -- Setup Context
    confluence_score INTEGER CHECK(confluence_score >= 0 AND confluence_score <= 6),
    confluence_factors TEXT, -- JSON: {"rsi": true, "fvg": true, "oi_divergence": true, ...}

    -- User Input (CRITICAL for learning loop)
    user_reasoning TEXT, -- "Entered on FVG retest, Claude suggested wait for volume"
    emotional_notes TEXT, -- "Felt FOMO at $140 but waited, almost panic sold at $143"

    -- AI Context
    claude_setup_analysis TEXT, -- Claude's full analysis at entry time
    claude_confidence TEXT CHECK(claude_confidence IN ('LOW', 'MEDIUM', 'HIGH')),
    claude_evaluation TEXT, -- Post-trade evaluation (after close)
    evaluation_timestamp DATETIME, -- When Claude evaluated

    -- Market Context (snapshot at entry time)
    market_context TEXT, -- JSON: {"btc_price": 61200, "spx_close": 4520, "sol_funding": -0.015, ...}

    -- Status
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed', 'cancelled')),

    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Conversation threads
CREATE TABLE conversation_threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Metadata
    topic TEXT, -- "SOL-PERP setup analysis"
    asset TEXT, -- Asset being discussed (optional)

    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Optional: Link to trade if conversation led to trade
    related_trade_id INTEGER,
    FOREIGN KEY (related_trade_id) REFERENCES trades(id) ON DELETE SET NULL
);

-- Individual messages
CREATE TABLE conversation_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,

    -- Message Content
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- Metadata
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Claude-specific
    model TEXT, -- "claude-3-5-sonnet-20250219"
    tokens_used INTEGER, -- For cost tracking
    tools_used TEXT, -- JSON array: [{"name": "fetch_drift_data", "input": {...}, "output": {...}}]

    -- Context
    related_trade_ids TEXT, -- JSON array: [47, 48]

    FOREIGN KEY (thread_id) REFERENCES conversation_threads(id) ON DELETE CASCADE
);

-- Learnings extracted by Claude (weekly analysis)
CREATE TABLE learnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Learning Type
    insight_type TEXT NOT NULL CHECK(insight_type IN ('pattern', 'edge', 'weakness', 'rule', 'warning')),

    -- Content
    title TEXT NOT NULL, -- "FVG + OI divergence setups have 100% win rate"
    description TEXT, -- Detailed explanation

    -- Evidence
    supporting_trade_ids TEXT, -- JSON array: [47, 45, 43, 39, 35]
    sample_size INTEGER, -- Number of trades analyzed
    win_rate REAL, -- Win rate for this pattern (0.0-1.0)
    avg_r_multiple REAL, -- Average R:R for this pattern

    -- Metadata
    confidence_score REAL CHECK(confidence_score >= 0.0 AND confidence_score <= 1.0),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disproven', 'archived')),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Strategy versions (Phase 2+)
CREATE TABLE strategy_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    version TEXT UNIQUE NOT NULL, -- "v1.0", "v1.1"
    config_yaml TEXT NOT NULL, -- Full YAML content

    -- Documentation
    changelog TEXT, -- What changed from previous version
    description TEXT, -- Human-readable summary

    -- Performance tracking
    active BOOLEAN NOT NULL DEFAULT 0, -- Only one version active at a time

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User settings (key-value store)
CREATE TABLE user_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL, -- JSON for complex values

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- API call logs (for debugging + cost tracking)
CREATE TABLE api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    service TEXT NOT NULL, -- 'claude', 'drift', 'coinglass'
    endpoint TEXT NOT NULL, -- '/v1/messages', '/markets/SOL-PERP'

    -- Request
    request_params TEXT, -- JSON

    -- Response
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,

    -- Cost tracking (for Claude)
    tokens_input INTEGER,
    tokens_output INTEGER,
    cost_usd REAL,

    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES (Performance Optimization)
-- ============================================

-- Trades indexes
CREATE INDEX idx_trades_asset ON trades(asset);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_entry_timestamp ON trades(entry_timestamp DESC);
CREATE INDEX idx_trades_confluence_score ON trades(confluence_score);
CREATE INDEX idx_trades_created_at ON trades(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_trades_asset_status ON trades(asset, status);

-- Conversation indexes
CREATE INDEX idx_messages_thread ON conversation_messages(thread_id);
CREATE INDEX idx_messages_timestamp ON conversation_messages(timestamp DESC);
CREATE INDEX idx_threads_created ON conversation_threads(created_at DESC);

-- Learnings indexes
CREATE INDEX idx_learnings_type ON learnings(insight_type);
CREATE INDEX idx_learnings_status ON learnings(status);

-- API logs index
CREATE INDEX idx_api_logs_timestamp ON api_logs(timestamp DESC);
CREATE INDEX idx_api_logs_service ON api_logs(service, timestamp DESC);

-- ============================================
-- TRIGGERS (Auto-update timestamps)
-- ============================================

CREATE TRIGGER update_trades_timestamp
AFTER UPDATE ON trades
BEGIN
    UPDATE trades SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_threads_timestamp
AFTER UPDATE ON conversation_threads
BEGIN
    UPDATE conversation_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_learnings_timestamp
AFTER UPDATE ON learnings
BEGIN
    UPDATE learnings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_settings_timestamp
AFTER UPDATE ON user_settings
BEGIN
    UPDATE user_settings SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
END;

-- ============================================
-- VIEWS (Commonly used queries)
-- ============================================

-- Open trades summary
CREATE VIEW v_open_trades AS
SELECT
    id,
    asset,
    direction,
    entry_price,
    entry_timestamp,
    stop_loss,
    target_1,
    target_2,
    confluence_score,
    claude_confidence,
    ROUND((julianday('now') - julianday(entry_timestamp)) * 24, 1) as hours_open
FROM trades
WHERE status = 'open'
ORDER BY entry_timestamp DESC;

-- Closed trades with performance
CREATE VIEW v_closed_trades_performance AS
SELECT
    id,
    asset,
    direction,
    entry_timestamp,
    exit_timestamp,
    pnl_pct,
    pnl_usd,
    r_multiple,
    confluence_score,
    CASE WHEN pnl_pct > 0 THEN 1 ELSE 0 END as is_win,
    claude_evaluation IS NOT NULL as is_evaluated
FROM trades
WHERE status = 'closed'
ORDER BY exit_timestamp DESC;

-- Win rate by asset
CREATE VIEW v_winrate_by_asset AS
SELECT
    asset,
    COUNT(*) as total_trades,
    SUM(CASE WHEN pnl_pct > 0 THEN 1 ELSE 0 END) as wins,
    ROUND(AVG(CASE WHEN pnl_pct > 0 THEN 1.0 ELSE 0.0 END) * 100, 1) as win_rate_pct,
    ROUND(AVG(pnl_pct), 2) as avg_pnl_pct,
    ROUND(AVG(r_multiple), 2) as avg_r_multiple
FROM trades
WHERE status = 'closed'
GROUP BY asset;

-- Win rate by confluence score
CREATE VIEW v_winrate_by_confluence AS
SELECT
    confluence_score,
    COUNT(*) as total_trades,
    SUM(CASE WHEN pnl_pct > 0 THEN 1 ELSE 0 END) as wins,
    ROUND(AVG(CASE WHEN pnl_pct > 0 THEN 1.0 ELSE 0.0 END) * 100, 1) as win_rate_pct,
    ROUND(AVG(pnl_pct), 2) as avg_pnl_pct
FROM trades
WHERE status = 'closed'
GROUP BY confluence_score
ORDER BY confluence_score DESC;
```

### 4.2 Database Access Layer

**Repository Pattern Implementation:**

```typescript
// lib/database/repositories/trades.repository.ts
import Database from 'better-sqlite3';
import { Trade, TradeInsert, TradeUpdate } from '@/types/database';

export class TradesRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // Create
  create(trade: TradeInsert): Trade {
    const stmt = this.db.prepare(`
      INSERT INTO trades (
        asset, direction, entry_price, entry_timestamp, entry_size, leverage,
        stop_loss, target_1, target_2, target_3, confluence_score,
        confluence_factors, user_reasoning, emotional_notes,
        claude_setup_analysis, claude_confidence, market_context
      ) VALUES (
        @asset, @direction, @entry_price, @entry_timestamp, @entry_size, @leverage,
        @stop_loss, @target_1, @target_2, @target_3, @confluence_score,
        @confluence_factors, @user_reasoning, @emotional_notes,
        @claude_setup_analysis, @claude_confidence, @market_context
      )
    `);

    const result = stmt.run(trade);
    return this.findById(result.lastInsertRowid as number)!;
  }

  // Read
  findById(id: number): Trade | undefined {
    const stmt = this.db.prepare('SELECT * FROM trades WHERE id = ?');
    return stmt.get(id) as Trade | undefined;
  }

  findAll(filters?: {
    asset?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Trade[] {
    let query = 'SELECT * FROM trades WHERE 1=1';
    const params: any[] = [];

    if (filters?.asset) {
      query += ' AND asset = ?';
      params.push(filters.asset);
    }

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY entry_timestamp DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Trade[];
  }

  findOpenTrades(): Trade[] {
    const stmt = this.db.prepare('SELECT * FROM v_open_trades');
    return stmt.all() as Trade[];
  }

  // Update
  update(id: number, updates: TradeUpdate): Trade {
    const fields = Object.keys(updates)
      .map(key => `${key} = @${key}`)
      .join(', ');

    const stmt = this.db.prepare(`
      UPDATE trades
      SET ${fields}
      WHERE id = @id
    `);

    stmt.run({ ...updates, id });
    return this.findById(id)!;
  }

  closeTrade(id: number, exitData: {
    exit_price: number;
    exit_timestamp: string;
    exit_reason: string;
    pnl_pct: number;
    pnl_usd: number;
    r_multiple: number;
  }): Trade {
    const trade = this.findById(id);
    if (!trade) throw new Error(`Trade ${id} not found`);

    const hold_duration_hours =
      (new Date(exitData.exit_timestamp).getTime() -
       new Date(trade.entry_timestamp).getTime()) / (1000 * 60 * 60);

    return this.update(id, {
      ...exitData,
      hold_duration_hours,
      status: 'closed',
    });
  }

  // Delete (soft delete by status change)
  delete(id: number): void {
    this.update(id, { status: 'cancelled' });
  }

  // Analytics
  getPerformanceStats(filters?: { asset?: string }): {
    total_trades: number;
    wins: number;
    losses: number;
    win_rate: number;
    avg_pnl_pct: number;
    avg_r_multiple: number;
    total_pnl_usd: number;
  } {
    let query = `
      SELECT
        COUNT(*) as total_trades,
        SUM(CASE WHEN pnl_pct > 0 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN pnl_pct <= 0 THEN 1 ELSE 0 END) as losses,
        AVG(CASE WHEN pnl_pct > 0 THEN 1.0 ELSE 0.0 END) * 100 as win_rate,
        AVG(pnl_pct) as avg_pnl_pct,
        AVG(r_multiple) as avg_r_multiple,
        SUM(pnl_usd) as total_pnl_usd
      FROM trades
      WHERE status = 'closed'
    `;

    if (filters?.asset) {
      query += ' AND asset = ?';
      const stmt = this.db.prepare(query);
      return stmt.get(filters.asset) as any;
    }

    const stmt = this.db.prepare(query);
    return stmt.get() as any;
  }
}
```

---

## 5. API Design

### 5.1 API Routes Structure

```
app/api/
├── chat/
│   └── route.ts              # POST /api/chat
├── trades/
│   ├── route.ts              # GET, POST /api/trades
│   ├── [id]/
│   │   ├── route.ts          # GET, PUT, DELETE /api/trades/:id
│   │   └── evaluate/
│   │       └── route.ts      # POST /api/trades/:id/evaluate
│   └── stats/
│       └── route.ts          # GET /api/trades/stats
├── calculator/
│   ├── position/
│   │   └── route.ts          # POST /api/calculator/position
│   └── levels/
│       └── route.ts          # POST /api/calculator/levels (Claude suggests)
├── data/
│   ├── drift/
│   │   ├── market/
│   │   │   └── route.ts      # GET /api/data/drift/market?asset=SOL
│   │   ├── candles/
│   │   │   └── route.ts      # GET /api/data/drift/candles
│   │   └── funding/
│   │       └── route.ts      # GET /api/data/drift/funding
│   ├── coinglass/
│   │   ├── liquidations/
│   │   │   └── route.ts      # GET /api/data/coinglass/liquidations
│   │   └── funding/
│   │       └── route.ts      # GET /api/data/coinglass/funding
│   └── health/
│       └── route.ts          # GET /api/data/health (all sources)
└── settings/
    └── route.ts              # GET, PUT /api/settings
```

### 5.2 API Endpoint Specifications

#### 5.2.1 Chat API

**POST /api/chat**

Chat with Claude about trading setups with function calling.

**Request:**
```typescript
{
  message: string;           // User message
  thread_id?: string;        // Optional: existing thread
  asset?: string;            // Context: SOL-PERP/BTC-PERP
}
```

**Response (SSE Stream):**
```typescript
// Event: message_start
{
  type: 'message_start',
  message: { id: string, role: 'assistant' }
}

// Event: content_block_delta (streaming text)
{
  type: 'content_block_delta',
  delta: { type: 'text_delta', text: string }
}

// Event: content_block_delta (tool use)
{
  type: 'content_block_delta',
  delta: {
    type: 'tool_use',
    name: 'fetch_drift_data',
    input: { asset: 'SOL-PERP' }
  }
}

// Event: tool_result (after execution)
{
  type: 'tool_result',
  tool_use_id: string,
  content: { ... } // Tool output
}

// Event: message_stop
{
  type: 'message_stop',
  message: { stop_reason: 'end_turn' | 'tool_use' }
}
```

**Error Responses:**
```typescript
// 400 Bad Request
{
  error: 'Invalid message format',
  details: { field: 'message', issue: 'empty' }
}

// 429 Too Many Requests
{
  error: 'Rate limit exceeded',
  retry_after: 60 // seconds
}

// 500 Internal Server Error
{
  error: 'Claude API error',
  message: string
}
```

#### 5.2.2 Trades API

**GET /api/trades**

List trades with filtering and pagination.

**Query Parameters:**
```typescript
{
  asset?: 'SOL-PERP' | 'BTC-PERP';
  status?: 'open' | 'closed' | 'cancelled';
  limit?: number;        // Default: 50, Max: 200
  offset?: number;       // Default: 0
  sort?: 'entry_timestamp' | 'pnl_pct'; // Default: entry_timestamp
  order?: 'asc' | 'desc'; // Default: desc
}
```

**Response:**
```typescript
{
  trades: Trade[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  }
}
```

**POST /api/trades**

Create a new trade.

**Request:**
```typescript
{
  asset: 'SOL-PERP' | 'BTC-PERP';
  direction: 'long' | 'short';
  entry_price: number;
  entry_timestamp: string; // ISO 8601
  entry_size: number;
  leverage: number; // 1-10
  stop_loss: number;
  target_1?: number;
  target_2?: number;
  target_3?: number;
  confluence_score?: number;
  confluence_factors?: object;
  user_reasoning?: string;
  emotional_notes?: string;
  claude_setup_analysis?: string;
  claude_confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

**Response:**
```typescript
{
  trade: Trade;
  message: 'Trade created successfully'
}
```

**GET /api/trades/:id**

Get single trade details.

**Response:**
```typescript
{
  trade: Trade;
}
```

**PUT /api/trades/:id**

Update trade (e.g., add exit data).

**Request:**
```typescript
{
  exit_price?: number;
  exit_timestamp?: string;
  exit_reason?: string;
  user_reasoning?: string;
  emotional_notes?: string;
  // Any other Trade fields
}
```

**Response:**
```typescript
{
  trade: Trade;
  message: 'Trade updated successfully'
}
```

**DELETE /api/trades/:id**

Soft delete (cancel) trade.

**Response:**
```typescript
{
  message: 'Trade cancelled successfully'
}
```

**POST /api/trades/:id/evaluate**

Trigger Claude evaluation of closed trade.

**Response (SSE Stream):**
```typescript
// Same SSE format as /api/chat
// Evaluation saved to trade.claude_evaluation after complete
```

**GET /api/trades/stats**

Get performance statistics.

**Query Parameters:**
```typescript
{
  asset?: 'SOL-PERP' | 'BTC-PERP';
  date_from?: string; // ISO 8601
  date_to?: string;
}
```

**Response:**
```typescript
{
  overall: {
    total_trades: number;
    wins: number;
    losses: number;
    win_rate: number; // Percentage
    avg_pnl_pct: number;
    avg_r_multiple: number;
    total_pnl_usd: number;
  },
  by_asset: {
    'SOL-PERP': { ... },
    'BTC-PERP': { ... }
  },
  by_confluence: {
    '6': { win_rate: 85, total: 10 },
    '5': { win_rate: 70, total: 15 },
    // ...
  }
}
```

#### 5.2.3 Calculator API

**POST /api/calculator/position**

Calculate position size and risk metrics.

**Request:**
```typescript
{
  asset: string;
  entry_price: number;
  stop_loss: number;
  target_1?: number;
  account_size: number;
  risk_pct: number; // Default: 1
  leverage: number; // Default: 10
}
```

**Response:**
```typescript
{
  position_size: number; // In asset units (e.g., 250 SOL)
  notional_value: number; // USD
  margin_required: number; // USD
  liquidation_price: number;
  liquidation_distance_pct: number;
  risk_amount_usd: number;
  risk_per_unit: number;
  r_r_ratio?: number; // If target_1 provided
  is_safe: boolean; // Liq distance > 8%
  warnings: string[]; // ["Liquidation too close", "R:R below 1.5"]
}
```

**POST /api/calculator/levels**

Ask Claude to suggest entry/stop/target levels.

**Request:**
```typescript
{
  asset: string;
  current_price?: number; // Optional, fetches if not provided
}
```

**Response (SSE Stream):**
```typescript
// Streaming Claude response with suggested levels
// Final event includes structured data:
{
  type: 'levels_suggested',
  data: {
    entry: number;
    stop: number;
    targets: number[];
    reasoning: string;
  }
}
```

#### 5.2.4 Data APIs

**GET /api/data/drift/market**

Get current market data for asset.

**Query Parameters:**
```typescript
{
  asset: 'SOL-PERP' | 'BTC-PERP';
}
```

**Response:**
```typescript
{
  asset: string;
  price: number;
  price_change_24h_pct: number;
  volume_24h: number;
  open_interest: number;
  oi_change_24h_pct: number;
  funding_rate: number; // Current 8h rate
  funding_rate_annualized: number;
  next_funding_time: string; // ISO 8601
  last_update: string;
}
```

**GET /api/data/drift/candles**

Get OHLCV candles.

**Query Parameters:**
```typescript
{
  asset: string;
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  limit?: number; // Default: 100, Max: 500
}
```

**Response:**
```typescript
{
  candles: Array<{
    timestamp: number; // Unix timestamp
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}
```

**GET /api/data/coinglass/liquidations**

Get liquidation heatmap data.

**Query Parameters:**
```typescript
{
  asset: 'SOL' | 'BTC'; // Note: no -PERP suffix
}
```

**Response:**
```typescript
{
  asset: string;
  clusters: Array<{
    price: number;
    amount_usd: number;
    side: 'long' | 'short';
  }>;
  last_update: string;
}
```

**GET /api/data/health**

Health check for all external APIs.

**Response:**
```typescript
{
  drift: { status: 'ok' | 'degraded' | 'down', latency_ms: number },
  coinglass: { status: 'ok' | 'degraded' | 'down', latency_ms: number },
  claude: { status: 'ok' | 'degraded' | 'down', latency_ms: number },
  solana: { status: 'ok' | 'degraded' | 'down', latency_ms: number },
  overall: 'ok' | 'degraded' | 'down'
}
```

---

## 6. Service Layer Design

### 6.1 Claude Service

**lib/services/claude.service.ts**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { DriftService } from './drift.service';
import { CoinglassService } from './coinglass.service';
import { StrategyEngine } from './strategy-engine.service';

export class ClaudeService {
  private client: Anthropic;
  private driftService: DriftService;
  private coinglassService: CoinglassService;
  private strategyEngine: StrategyEngine;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
    this.driftService = new DriftService();
    this.coinglassService = new CoinglassService();
    this.strategyEngine = new StrategyEngine();
  }

  /**
   * Main chat method with streaming support
   */
  async chat(params: {
    messages: Anthropic.MessageParam[];
    asset?: string;
    onStream?: (event: Anthropic.MessageStreamEvent) => void;
  }): Promise<Anthropic.Message> {
    const tools = this.getTools();

    const stream = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20250219',
      max_tokens: 4096,
      temperature: 0.7,
      system: this.getSystemPrompt(),
      messages: params.messages,
      tools,
      stream: true,
    });

    let finalMessage: Anthropic.Message | null = null;
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for await (const event of stream) {
      // Stream to client if callback provided
      if (params.onStream) {
        params.onStream(event);
      }

      // Handle tool use
      if (event.type === 'content_block_delta' &&
          event.delta.type === 'tool_use') {
        const toolUse = event.delta;
        const result = await this.executeTool(
          toolUse.name,
          toolUse.input,
          params.asset
        );

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // Capture final message
      if (event.type === 'message_stop') {
        finalMessage = event.message as any;
      }
    }

    // If tools were used, make another request with results
    if (toolResults.length > 0) {
      return this.chat({
        messages: [
          ...params.messages,
          { role: 'assistant', content: finalMessage!.content },
          { role: 'user', content: toolResults },
        ],
        asset: params.asset,
        onStream: params.onStream,
      });
    }

    return finalMessage!;
  }

  /**
   * Define available tools for Claude
   */
  private getTools(): Anthropic.Tool[] {
    return [
      {
        name: 'fetch_drift_data',
        description: 'Fetch current market data from Drift Protocol for a perpetual futures asset',
        input_schema: {
          type: 'object',
          properties: {
            asset: {
              type: 'string',
              enum: ['SOL-PERP', 'BTC-PERP'],
              description: 'The perpetual futures market to fetch data for',
            },
          },
          required: ['asset'],
        },
      },
      {
        name: 'calculate_confluence',
        description: 'Calculate confluence score (0-6) based on technical indicators, Open Interest, FVG, Order Blocks, etc.',
        input_schema: {
          type: 'object',
          properties: {
            asset: {
              type: 'string',
              enum: ['SOL-PERP', 'BTC-PERP'],
            },
          },
          required: ['asset'],
        },
      },
      {
        name: 'get_liquidations',
        description: 'Fetch liquidation clusters (heatmap) from Coinglass',
        input_schema: {
          type: 'object',
          properties: {
            asset: {
              type: 'string',
              enum: ['SOL', 'BTC'],
              description: 'Asset symbol (no -PERP suffix)',
            },
          },
          required: ['asset'],
        },
      },
      {
        name: 'calculate_position_size',
        description: 'Calculate position size based on risk percentage and stop loss',
        input_schema: {
          type: 'object',
          properties: {
            entry_price: { type: 'number' },
            stop_loss: { type: 'number' },
            risk_pct: { type: 'number', description: 'Risk percentage (default 1)' },
            account_size: { type: 'number' },
            leverage: { type: 'number', description: 'Leverage (1-10, default 10)' },
          },
          required: ['entry_price', 'stop_loss', 'account_size'],
        },
      },
      {
        name: 'query_trades',
        description: 'Query historical trades from database with filters',
        input_schema: {
          type: 'object',
          properties: {
            asset: { type: 'string', enum: ['SOL-PERP', 'BTC-PERP'] },
            status: { type: 'string', enum: ['open', 'closed'] },
            limit: { type: 'number' },
          },
        },
      },
      {
        name: 'analyze_trade',
        description: 'Fetch full context for a specific trade for post-trade evaluation',
        input_schema: {
          type: 'object',
          properties: {
            trade_id: { type: 'number' },
          },
          required: ['trade_id'],
        },
      },
    ];
  }

  /**
   * Execute tool based on name
   */
  private async executeTool(
    name: string,
    input: any,
    contextAsset?: string
  ): Promise<any> {
    try {
      switch (name) {
        case 'fetch_drift_data':
          return await this.driftService.getMarketData(input.asset);

        case 'calculate_confluence':
          const marketData = await this.driftService.getMarketData(input.asset);
          const candles = await this.driftService.getCandles(input.asset, '4h', 100);
          return this.strategyEngine.calculateConfluence({
            asset: input.asset,
            marketData,
            candles,
          });

        case 'get_liquidations':
          return await this.coinglassService.getLiquidations(input.asset);

        case 'calculate_position_size':
          return this.strategyEngine.calculatePosition({
            entry_price: input.entry_price,
            stop_loss: input.stop_loss,
            risk_pct: input.risk_pct || 1,
            account_size: input.account_size,
            leverage: input.leverage || 10,
          });

        case 'query_trades':
          // Import TradesRepository here
          const { TradesRepository } = await import('@/lib/database/repositories/trades.repository');
          const db = await import('@/lib/database/client');
          const repo = new TradesRepository(db.default);
          return repo.findAll(input);

        case 'analyze_trade':
          // Fetch trade with full context
          const { TradesRepository: TR } = await import('@/lib/database/repositories/trades.repository');
          const database = await import('@/lib/database/client');
          const tradesRepo = new TR(database.default);
          const trade = tradesRepo.findById(input.trade_id);

          if (!trade) {
            throw new Error(`Trade ${input.trade_id} not found`);
          }

          return {
            ...trade,
            confluence_factors: JSON.parse(trade.confluence_factors || '{}'),
            market_context: JSON.parse(trade.market_context || '{}'),
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      console.error(`Tool execution error (${name}):`, error);
      return {
        error: `Failed to execute ${name}`,
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * System prompt for trading context
   */
  private getSystemPrompt(): string {
    return `You are an expert trading assistant specializing in cryptocurrency perpetual futures on Drift Protocol (Solana). Your role is to help the user (Colin) make objective trading decisions for SOL-PERP and BTC-PERP swing trades.

Key Principles:
1. **Objectivity:** Always provide unbiased analysis. Challenge user's FOMO or fear-based decisions.
2. **Risk Management:** Emphasize proper position sizing (1% risk per trade), R:R ratios (minimum 1.5:1), and stop loss discipline.
3. **Confluence-Based:** Quality over quantity. Only suggest setups with 4+ confluence factors (RSI, OI divergence, FVG, Order Blocks, liquidations, funding).
4. **Transparency:** Always explain your reasoning. If you don't have enough data, say so.
5. **Learning-Oriented:** Help user understand patterns and build intuition, not just follow signals blindly.

Trading Context:
- **Platform:** Drift Protocol (Solana)
- **Assets:** SOL-PERP, BTC-PERP
- **Style:** Swing trading (3-7 day holds)
- **Target:** 3-5 quality setups per week
- **Risk per trade:** 1% of portfolio
- **Minimum R:R:** 1.5:1

When analyzing setups:
1. Use tools to fetch real-time data
2. Calculate confluence score (0-6)
3. Check liquidity and market conditions
4. Suggest entry/stop/target levels
5. Calculate position size
6. Provide clear verdict: TAKE, WAIT, or SKIP

When evaluating trades:
1. Review what was planned vs what happened
2. Identify emotional decisions from user notes
3. Extract learnings (patterns, edges, mistakes)
4. Update strategy understanding

Always be conversational, supportive, and focused on helping Colin improve as a trader.`;
  }

  /**
   * Evaluate a closed trade
   */
  async evaluateTrade(
    tradeId: number,
    onStream?: (event: Anthropic.MessageStreamEvent) => void
  ): Promise<string> {
    // Fetch trade data using analyze_trade tool internally
    const trade = await this.executeTool('analyze_trade', { trade_id: tradeId });

    const evaluationPrompt = `Analyze Trade #${tradeId}:

**Setup Details:**
- Asset: ${trade.asset}
- Direction: ${trade.direction}
- Entry: $${trade.entry_price} (${trade.entry_timestamp})
- Exit: $${trade.exit_price} (${trade.exit_timestamp})
- Stop: $${trade.stop_loss}
- Targets: $${trade.target_1}${trade.target_2 ? `, $${trade.target_2}` : ''}

**Performance:**
- P&L: ${trade.pnl_pct > 0 ? '+' : ''}${trade.pnl_pct}% ($${trade.pnl_usd})
- R:R Actual: ${trade.r_multiple}:1
- Hold Duration: ${trade.hold_duration_hours} hours

**Setup Context:**
- Confluence Score: ${trade.confluence_score}/6
- Confluence Factors: ${JSON.stringify(trade.confluence_factors, null, 2)}
- Claude's Setup Analysis: "${trade.claude_setup_analysis}"
- Claude Confidence: ${trade.claude_confidence}

**User's Perspective:**
- Reasoning: "${trade.user_reasoning}"
- Emotional Notes: "${trade.emotional_notes}"

**Market Context at Entry:**
${JSON.stringify(trade.market_context, null, 2)}

Please provide a structured evaluation:

1. **TRADE BREAKDOWN:** Setup quality, execution, timing, outcome
2. **WHAT WENT RIGHT:** Specific decisions that contributed to success/limited loss
3. **WHAT COULD BE BETTER:** Areas for improvement (execution, emotional control, risk management)
4. **LEARNING FOR NEXT TRADE:** Actionable insights to apply going forward

Focus on patterns the user should recognize (their edge) and behavioral issues to address.`;

    const response = await this.chat({
      messages: [{ role: 'user', content: evaluationPrompt }],
      onStream,
    });

    // Extract text content
    const evaluation = response.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    return evaluation;
  }
}
```

### 6.2 Drift Service

**lib/services/drift.service.ts**

```typescript
import axios, { AxiosInstance } from 'axios';

export interface DriftMarketData {
  asset: string;
  price: number;
  price_change_24h_pct: number;
  volume_24h: number;
  open_interest: number;
  oi_change_24h_pct: number;
  funding_rate: number;
  funding_rate_annualized: number;
  next_funding_time: string;
  last_update: string;
}

export interface DriftCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class DriftService {
  private client: AxiosInstance;
  private baseURL = 'https://api.drift.trade'; // Replace with actual Drift API URL

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        if (!config || !config.retry) {
          config.retry = 0;
        }

        if (config.retry < 3 && this.isRetryableError(error)) {
          config.retry += 1;
          await this.delay(1000 * config.retry); // Exponential backoff
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get current market data
   */
  async getMarketData(asset: string): Promise<DriftMarketData> {
    try {
      // This is pseudo-code - adjust to actual Drift API
      const response = await this.client.get(`/markets/${asset}`);

      return {
        asset,
        price: response.data.mark_price,
        price_change_24h_pct: response.data.price_change_24h,
        volume_24h: response.data.volume_24h,
        open_interest: response.data.open_interest,
        oi_change_24h_pct: this.calculateOIChange(response.data),
        funding_rate: response.data.funding_rate,
        funding_rate_annualized: response.data.funding_rate * 3 * 365,
        next_funding_time: response.data.next_funding_time,
        last_update: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Failed to fetch Drift data for ${asset}:`, error);
      throw new Error(`Drift API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get OHLCV candles
   */
  async getCandles(
    asset: string,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
    limit: number = 100
  ): Promise<DriftCandle[]> {
    try {
      const response = await this.client.get(`/markets/${asset}/candles`, {
        params: { resolution: interval, limit },
      });

      return response.data.candles.map((c: any) => ({
        timestamp: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));
    } catch (error) {
      console.error(`Failed to fetch candles for ${asset}:`, error);
      throw error;
    }
  }

  /**
   * Get funding rate history
   */
  async getFundingHistory(asset: string, limit: number = 30): Promise<any[]> {
    try {
      const response = await this.client.get(`/markets/${asset}/funding`, {
        params: { limit },
      });
      return response.data.funding_history;
    } catch (error) {
      console.error(`Failed to fetch funding history for ${asset}:`, error);
      throw error;
    }
  }

  /**
   * Get orderbook snapshot
   */
  async getOrderbook(asset: string): Promise<{
    bids: Array<{ price: number; size: number }>;
    asks: Array<{ price: number; size: number }>;
  }> {
    try {
      const response = await this.client.get(`/markets/${asset}/orderbook`);
      return {
        bids: response.data.bids,
        asks: response.data.asks,
      };
    } catch (error) {
      console.error(`Failed to fetch orderbook for ${asset}:`, error);
      throw error;
    }
  }

  /**
   * Calculate liquidity depth (used in confluence)
   */
  async checkLiquidity(asset: string, spreadPct: number = 0.2): Promise<{
    is_sufficient: boolean;
    bid_depth_usd: number;
    ask_depth_usd: number;
  }> {
    const orderbook = await this.getOrderbook(asset);
    const marketData = await this.getMarketData(asset);
    const midPrice = marketData.price;

    const bidThreshold = midPrice * (1 - spreadPct / 100);
    const askThreshold = midPrice * (1 + spreadPct / 100);

    const bidDepth = orderbook.bids
      .filter((b) => b.price >= bidThreshold)
      .reduce((sum, b) => sum + b.price * b.size, 0);

    const askDepth = orderbook.asks
      .filter((a) => a.price <= askThreshold)
      .reduce((sum, a) => sum + a.price * a.size, 0);

    return {
      is_sufficient: bidDepth >= 50000 && askDepth >= 50000,
      bid_depth_usd: bidDepth,
      ask_depth_usd: askDepth,
    };
  }

  // Helper methods
  private calculateOIChange(data: any): number {
    // Calculate 24h OI change percentage
    // Implementation depends on Drift API response structure
    return 0; // Placeholder
  }

  private isRetryableError(error: any): boolean {
    return (
      !error.response ||
      error.response.status >= 500 ||
      error.code === 'ECONNABORTED'
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 6.3 Strategy Engine Service

**lib/services/strategy-engine.service.ts**

```typescript
import { DriftMarketData, DriftCandle } from './drift.service';

export interface ConfluenceResult {
  score: number; // 0-6
  factors: {
    rsi_oversold_bought: boolean;
    support_resistance: boolean;
    oi_divergence: boolean;
    fvg_present: boolean;
    order_block: boolean;
    funding_extreme: boolean;
  };
  details: {
    rsi: number;
    support_levels: number[];
    resistance_levels: number[];
    fvg_zones: Array<{ top: number; bottom: number }>;
    order_blocks: Array<{ price: number; type: 'demand' | 'supply' }>;
    funding_rate: number;
  };
}

export class StrategyEngine {
  /**
   * Calculate confluence score based on multiple factors
   */
  calculateConfluence(params: {
    asset: string;
    marketData: DriftMarketData;
    candles: DriftCandle[];
  }): ConfluenceResult {
    const { marketData, candles } = params;

    // Calculate indicators
    const rsi = this.calculateRSI(candles, 14);
    const { supports, resistances } = this.findSupportResistance(candles);
    const oiDivergence = this.detectOIDivergence(marketData, candles);
    const fvgZones = this.detectFairValueGaps(candles);
    const orderBlocks = this.detectOrderBlocks(candles);
    const fundingExtreme = Math.abs(marketData.funding_rate) > 0.02;

    // Evaluate each factor
    const factors = {
      rsi_oversold_bought: rsi < 35 || rsi > 65,
      support_resistance: this.isPriceNearLevel(
        marketData.price,
        [...supports, ...resistances],
        0.02
      ),
      oi_divergence: oiDivergence,
      fvg_present: fvgZones.length > 0,
      order_block: orderBlocks.length > 0,
      funding_extreme: fundingExtreme,
    };

    // Count true factors
    const score = Object.values(factors).filter(Boolean).length;

    return {
      score,
      factors,
      details: {
        rsi,
        support_levels: supports,
        resistance_levels: resistances,
        fvg_zones: fvgZones,
        order_blocks: orderBlocks,
        funding_rate: marketData.funding_rate,
      },
    };
  }

  /**
   * Calculate position size based on risk
   */
  calculatePosition(params: {
    entry_price: number;
    stop_loss: number;
    risk_pct: number;
    account_size: number;
    leverage: number;
  }): {
    position_size: number;
    notional_value: number;
    margin_required: number;
    liquidation_price: number;
    liquidation_distance_pct: number;
    risk_amount_usd: number;
    risk_per_unit: number;
    is_safe: boolean;
    warnings: string[];
  } {
    const { entry_price, stop_loss, risk_pct, account_size, leverage } = params;

    const risk_amount_usd = account_size * (risk_pct / 100);
    const risk_per_unit = Math.abs(entry_price - stop_loss);
    const position_size = risk_amount_usd / risk_per_unit;
    const notional_value = position_size * entry_price;
    const margin_required = notional_value / leverage;

    // Simplified liquidation calculation (Drift uses maintenance margin)
    // This is approximate - actual calculation depends on Drift's margin requirements
    const maintenanceMarginPct = 0.03; // 3% maintenance margin (example)
    const direction = entry_price > stop_loss ? 'long' : 'short';

    let liquidation_price: number;
    if (direction === 'long') {
      liquidation_price = entry_price * (1 - (1 / leverage) + maintenanceMarginPct);
    } else {
      liquidation_price = entry_price * (1 + (1 / leverage) - maintenanceMarginPct);
    }

    const liquidation_distance_pct =
      Math.abs(liquidation_price - entry_price) / entry_price * 100;

    const warnings: string[] = [];
    if (liquidation_distance_pct < 8) {
      warnings.push('Liquidation price too close (< 8%)');
    }
    if (margin_required > account_size) {
      warnings.push('Insufficient account balance');
    }

    return {
      position_size,
      notional_value,
      margin_required,
      liquidation_price,
      liquidation_distance_pct,
      risk_amount_usd,
      risk_per_unit,
      is_safe: liquidation_distance_pct >= 8 && margin_required <= account_size,
      warnings,
    };
  }

  // Technical Indicators (Simplified implementations)

  private calculateRSI(candles: DriftCandle[], period: number = 14): number {
    if (candles.length < period + 1) return 50; // Not enough data

    let gains = 0;
    let losses = 0;

    for (let i = candles.length - period; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return rsi;
  }

  private findSupportResistance(
    candles: DriftCandle[]
  ): { supports: number[]; resistances: number[] } {
    // Simplified: Find local highs/lows in recent candles
    const lookback = 20;
    const recentCandles = candles.slice(-lookback);

    const highs = recentCandles.map((c) => c.high);
    const lows = recentCandles.map((c) => c.low);

    // Find pivots (simple implementation)
    const resistances = this.findLocalExtrema(highs, 'max');
    const supports = this.findLocalExtrema(lows, 'min');

    return { supports, resistances };
  }

  private findLocalExtrema(values: number[], type: 'max' | 'min'): number[] {
    const extrema: number[] = [];
    const window = 3;

    for (let i = window; i < values.length - window; i++) {
      const slice = values.slice(i - window, i + window + 1);
      const value = values[i];

      if (type === 'max' && value === Math.max(...slice)) {
        extrema.push(value);
      } else if (type === 'min' && value === Math.min(...slice)) {
        extrema.push(value);
      }
    }

    // Deduplicate nearby levels (within 1%)
    return this.deduplicateLevels(extrema, 0.01);
  }

  private deduplicateLevels(levels: number[], thresholdPct: number): number[] {
    const sorted = [...levels].sort((a, b) => a - b);
    const deduplicated: number[] = [];

    for (const level of sorted) {
      if (
        deduplicated.length === 0 ||
        Math.abs(level - deduplicated[deduplicated.length - 1]) / level >
          thresholdPct
      ) {
        deduplicated.push(level);
      }
    }

    return deduplicated;
  }

  private isPriceNearLevel(
    price: number,
    levels: number[],
    thresholdPct: number
  ): boolean {
    return levels.some(
      (level) => Math.abs(price - level) / level < thresholdPct
    );
  }

  private detectOIDivergence(
    marketData: DriftMarketData,
    candles: DriftCandle[]
  ): boolean {
    // OI divergence: Price down + OI up (or vice versa)
    // This requires historical OI data which isn't in candles
    // Simplified: Check if OI change is opposite to price change
    const priceChange = marketData.price_change_24h_pct;
    const oiChange = marketData.oi_change_24h_pct;

    // Divergence: opposite signs and both significant
    return (
      Math.sign(priceChange) !== Math.sign(oiChange) &&
      Math.abs(priceChange) > 2 &&
      Math.abs(oiChange) > 5
    );
  }

  private detectFairValueGaps(
    candles: DriftCandle[]
  ): Array<{ top: number; bottom: number }> {
    const fvgs: Array<{ top: number; bottom: number }> = [];

    // FVG: Gap between candle[i-1].high and candle[i+1].low (or vice versa)
    for (let i = 1; i < candles.length - 1; i++) {
      const prev = candles[i - 1];
      const curr = candles[i];
      const next = candles[i + 1];

      // Bullish FVG: prev.high < next.low
      if (prev.high < next.low) {
        fvgs.push({ bottom: prev.high, top: next.low });
      }

      // Bearish FVG: prev.low > next.high
      if (prev.low > next.high) {
        fvgs.push({ top: prev.low, bottom: next.high });
      }
    }

    // Filter only recent FVGs (last 50 candles)
    return fvgs.slice(-5);
  }

  private detectOrderBlocks(
    candles: DriftCandle[]
  ): Array<{ price: number; type: 'demand' | 'supply' }> {
    const blocks: Array<{ price: number; type: 'demand' | 'supply' }> = [];

    // Order Block: Large move candle followed by retracement
    // Simplified heuristic
    for (let i = 1; i < candles.length - 1; i++) {
      const curr = candles[i];
      const next = candles[i + 1];

      const currRange = curr.high - curr.low;
      const avgRange =
        candles.slice(Math.max(0, i - 10), i).reduce((sum, c) => sum + (c.high - c.low), 0) / 10;

      // Large bullish candle (demand zone)
      if (curr.close > curr.open && currRange > avgRange * 1.5) {
        blocks.push({ price: curr.low, type: 'demand' });
      }

      // Large bearish candle (supply zone)
      if (curr.close < curr.open && currRange > avgRange * 1.5) {
        blocks.push({ price: curr.high, type: 'supply' });
      }
    }

    return blocks.slice(-3); // Recent order blocks only
  }
}
```

---

## 7. Frontend Architecture

### 7.1 Project Structure

```
trade-level-up/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (persistent header/nav)
│   ├── page.tsx                  # Dashboard (/)
│   ├── chat/
│   │   └── page.tsx              # Chat interface
│   ├── calculator/
│   │   └── page.tsx              # Position calculator
│   ├── log/
│   │   ├── page.tsx              # Trade log
│   │   └── [id]/
│   │       └── page.tsx          # Trade detail
│   ├── settings/
│   │   └── page.tsx              # User settings
│   └── api/                      # API routes (see Section 5)
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   └── ContextSidebar.tsx
│   ├── calculator/
│   │   ├── PositionForm.tsx
│   │   ├── RiskDisplay.tsx
│   │   └── LiquidationInfo.tsx
│   ├── trades/
│   │   ├── TradeTable.tsx
│   │   ├── TradeRow.tsx
│   │   ├── TradeDetailModal.tsx
│   │   ├── TradeForm.tsx
│   │   └── EvaluationView.tsx
│   ├── dashboard/
│   │   ├── QuickScan.tsx
│   │   ├── AssetSelector.tsx
│   │   └── RecentActivity.tsx
│   └── shared/
│       ├── ConfluenceDisplay.tsx
│       ├── LoadingSkeleton.tsx
│       └── ErrorBoundary.tsx
│
├── lib/                          # Utilities & services
│   ├── services/                 # Backend services (see Section 6)
│   │   ├── claude.service.ts
│   │   ├── drift.service.ts
│   │   ├── coinglass.service.ts
│   │   └── strategy-engine.service.ts
│   ├── database/
│   │   ├── client.ts             # SQLite connection
│   │   ├── schema.ts             # Drizzle schema
│   │   └── repositories/
│   │       ├── trades.repository.ts
│   │       ├── conversations.repository.ts
│   │       └── learnings.repository.ts
│   ├── hooks/                    # Custom React hooks
│   │   ├── useTrades.ts
│   │   ├── useChat.ts
│   │   └── useMarketData.ts
│   ├── utils/
│   │   ├── cn.ts                 # Tailwind class merge
│   │   ├── date.ts               # Date formatting
│   │   └── validators.ts         # Zod schemas
│   └── types/
│       ├── database.ts           # Database types
│       └── api.ts                # API types
│
├── public/                       # Static assets
│   ├── favicon.ico
│   └── ...
│
├── docs/                         # Documentation
│   ├── PRD_AI_Trading_Bot_v2.0.md
│   ├── FO_AI_Trading_Bot_v2.0.md
│   └── TO_AI_Trading_Bot_v2.0.md (this file)
│
├── .env.local                    # Environment variables (git-ignored)
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── package.json
├── pnpm-lock.yaml
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

### 7.2 Key Frontend Components

**Example: MessageBubble Component**

```typescript
// components/chat/MessageBubble.tsx
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ConfluenceDisplay } from '@/components/shared/ConfluenceDisplay';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confluenceData?: {
    score: number;
    factors: Record<string, boolean>;
  };
  onActionClick?: (action: string, data?: any) => void;
}

export function MessageBubble({
  role,
  content,
  timestamp,
  confluenceData,
  onActionClick,
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
        )}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap">{content}</div>

        {/* Confluence display if available */}
        {confluenceData && (
          <div className="mt-3">
            <ConfluenceDisplay
              score={confluenceData.score}
              factors={confluenceData.factors}
            />
          </div>
        )}

        {/* Action buttons (embedded in Claude messages) */}
        {!isUser && onActionClick && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onActionClick('calculate_position')}
            >
              Calculate Position
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onActionClick('show_chart')}
            >
              Show Chart
            </Button>
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            'text-xs mt-2',
            isUser ? 'text-blue-200' : 'text-gray-500'
          )}
        >
          {format(timestamp, 'HH:mm')}
        </div>
      </div>
    </div>
  );
}
```

### 7.3 State Management Strategy

**Global State (Zustand):**

```typescript
// lib/store/global.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalState {
  // User settings
  accountSize: number;
  riskPct: number;
  theme: 'light' | 'dark';

  // UI state
  sidebarOpen: boolean;

  // Actions
  setAccountSize: (size: number) => void;
  setRiskPct: (pct: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      // Default values
      accountSize: 50000,
      riskPct: 1,
      theme: 'dark',
      sidebarOpen: true,

      // Actions
      setAccountSize: (size) => set({ accountSize: size }),
      setRiskPct: (pct) => set({ riskPct: pct }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'trade-level-up-settings', // localStorage key
    }
  )
);
```

**Server State (SWR):**

```typescript
// lib/hooks/useTrades.ts
import useSWR from 'swr';
import { Trade } from '@/lib/types/database';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTrades(filters?: {
  asset?: string;
  status?: string;
}) {
  const params = new URLSearchParams(filters as any);
  const { data, error, isLoading, mutate } = useSWR<{
    trades: Trade[];
    pagination: any;
  }>(`/api/trades?${params}`, fetcher, {
    refreshInterval: 30000, // Refresh every 30s
    revalidateOnFocus: true,
  });

  return {
    trades: data?.trades ?? [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useTrade(id: number) {
  const { data, error, isLoading, mutate } = useSWR<{ trade: Trade }>(
    `/api/trades/${id}`,
    fetcher
  );

  return {
    trade: data?.trade,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
```

---

## 8. Deployment & DevOps

### 8.1 Environment Variables

**.env.local (Development):**

```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-xxx

# Database (SQLite local path)
DATABASE_URL=./data/trades.db

# Drift Protocol API (if auth required)
DRIFT_API_KEY=optional

# Coinglass API
COINGLASS_API_KEY=optional

# Helius RPC (for Solana - Phase 3)
HELIUS_API_KEY=xxx

# App Config
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

**.env.production (Vercel):**

```bash
# Same as above, but with production values
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://trade-level-up.vercel.app

# Database (use Turso for serverless SQLite in production)
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=xxx
```

### 8.2 Deployment Strategy

**Phase 1 (MVP): Local Development**

```bash
# Setup
pnpm install
pnpm db:migrate  # Run SQLite migrations
pnpm dev         # Start dev server on localhost:3000
```

**Phase 2: Vercel Deployment**

1. **Connect GitHub Repository:**
   - Push to GitHub
   - Import to Vercel
   - Auto-deploy on push to `main`

2. **Environment Variables:**
   - Add all `.env` variables to Vercel dashboard
   - Set production values

3. **Database Migration:**
   - Option A: Use Turso (serverless SQLite)
   - Option B: Use Vercel Postgres (migrate schema)
   - Option C: Keep SQLite, mount Vercel Volume (not recommended for serverless)

4. **Build Configuration:**
   ```json
   // next.config.js
   module.exports = {
     output: 'standalone', // For Docker (optional)
     env: {
       NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
     },
   };
   ```

5. **Performance Optimizations:**
   - Enable Vercel Edge Functions for `/api/data/*` (low latency)
   - Use Incremental Static Regeneration (ISR) for `/log` page
   - Implement SWR caching aggressively

### 8.3 CI/CD Pipeline

**GitHub Actions Workflow (.github/workflows/ci.yml):**

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm tsc --noEmit

      - name: Lint
        run: pnpm lint

      - name: Run unit tests
        run: pnpm test

      - name: Build
        run: pnpm build
        env:
          DATABASE_URL: ./test.db
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 8.4 Monitoring & Logging

**Logging Strategy:**

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

// Usage in services
logger.info({ asset: 'SOL-PERP', price: 138.50 }, 'Fetched market data');
logger.error({ error: err }, 'Claude API error');
```

**Error Tracking (Phase 2):**
- Integrate Sentry for production error monitoring
- Track API failures, Claude errors, database issues

**Performance Monitoring:**
- Vercel Analytics (built-in)
- Track API route response times
- Monitor database query performance

### 8.5 Database Backups

**Automated Backup Script:**

```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_FILE="./data/trades.db"

mkdir -p $BACKUP_DIR
sqlite3 $DB_FILE ".backup '$BACKUP_DIR/trades_$DATE.db'"

# Keep only last 30 backups
ls -t $BACKUP_DIR/trades_*.db | tail -n +31 | xargs rm -f

echo "Backup created: trades_$DATE.db"
```

**Cron Job (local):**

```bash
# Run daily at 3 AM
0 3 * * * /path/to/scripts/backup-db.sh
```

---

## 9. Security Considerations

### 9.1 API Key Management

**Never commit API keys:**
- All keys in `.env.local` (git-ignored)
- Use Vercel environment variables in production
- Rotate keys periodically

**Rate Limiting:**

```typescript
// lib/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many chat requests, please try again later.',
});

// Apply in API route:
// export default chatRateLimiter(handler);
```

### 9.2 Input Validation

**Validate all user inputs:**

```typescript
// lib/utils/validators.ts
import { z } from 'zod';

export const TradeCreateSchema = z.object({
  asset: z.enum(['SOL-PERP', 'BTC-PERP']),
  direction: z.enum(['long', 'short']),
  entry_price: z.number().positive(),
  stop_loss: z.number().positive(),
  entry_size: z.number().positive(),
  leverage: z.number().min(1).max(10),
  // ... more fields
});

// Usage in API route:
const validated = TradeCreateSchema.parse(req.body);
```

### 9.3 SQL Injection Prevention

**Use parameterized queries (better-sqlite3):**

```typescript
// GOOD ✅
const stmt = db.prepare('SELECT * FROM trades WHERE id = ?');
const trade = stmt.get(id);

// BAD ❌ (never do this)
const trade = db.prepare(`SELECT * FROM trades WHERE id = ${id}`).get();
```

### 9.4 CORS & CSRF

**Next.js API routes default to same-origin:**
- No CORS issues for MVP (same domain)
- Add CSRF tokens if adding external integrations

---

## 10. Testing Strategy

### 10.1 Unit Tests (Vitest)

**Example: Strategy Engine Tests**

```typescript
// lib/services/__tests__/strategy-engine.test.ts
import { describe, it, expect } from 'vitest';
import { StrategyEngine } from '../strategy-engine.service';

describe('StrategyEngine', () => {
  const engine = new StrategyEngine();

  describe('calculateRSI', () => {
    it('should return RSI value between 0-100', () => {
      const candles = generateMockCandles(30);
      const rsi = engine['calculateRSI'](candles, 14);

      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
    });
  });

  describe('calculatePosition', () => {
    it('should calculate position size correctly', () => {
      const result = engine.calculatePosition({
        entry_price: 138.50,
        stop_loss: 136.50,
        risk_pct: 1,
        account_size: 50000,
        leverage: 10,
      });

      expect(result.position_size).toBeCloseTo(250, 0);
      expect(result.risk_amount_usd).toBe(500);
      expect(result.liquidation_distance_pct).toBeGreaterThan(5);
    });

    it('should warn if liquidation too close', () => {
      const result = engine.calculatePosition({
        entry_price: 100,
        stop_loss: 95,
        risk_pct: 5, // High risk
        account_size: 10000,
        leverage: 10,
      });

      expect(result.warnings).toContain('Liquidation price too close (< 8%)');
    });
  });
});
```

### 10.2 Integration Tests (Playwright)

**Example: Chat Flow E2E Test**

```typescript
// tests/e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test('should analyze setup with Claude', async ({ page }) => {
    await page.goto('/chat');

    // Type message
    await page.fill('textarea[placeholder="Type your message..."]',
      'SOL at $138, is this a setup?');

    // Send message
    await page.click('button[type="submit"]');

    // Wait for Claude response
    await expect(page.locator('text=/Analyzing/')).toBeVisible();

    // Wait for confluence score
    await expect(page.locator('text=/Confluence: \\d\/6/')).toBeVisible({ timeout: 15000 });

    // Check for embedded action buttons
    await expect(page.locator('button:has-text("Calculate Position")')).toBeVisible();
  });

  test('should navigate to calculator from chat', async ({ page }) => {
    await page.goto('/chat');

    // ... (trigger chat response with suggested levels)

    // Click Calculate Position button
    await page.click('button:has-text("Calculate Position")');

    // Should navigate to calculator
    await expect(page).toHaveURL(/\/calculator/);

    // Check if values are pre-filled
    await expect(page.locator('input[name="entry_price"]')).toHaveValue(/\d+/);
  });
});
```

### 10.3 API Tests

**Example: Trades API Test**

```typescript
// tests/api/trades.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from '../helpers/db';
import request from 'supertest';
import { app } from '@/app'; // Your Next.js app instance

describe('Trades API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('POST /api/trades should create a trade', async () => {
    const response = await request(app)
      .post('/api/trades')
      .send({
        asset: 'SOL-PERP',
        direction: 'long',
        entry_price: 138.50,
        entry_timestamp: new Date().toISOString(),
        entry_size: 250,
        leverage: 10,
        stop_loss: 136.50,
        target_1: 145.00,
      });

    expect(response.status).toBe(201);
    expect(response.body.trade).toHaveProperty('id');
    expect(response.body.trade.asset).toBe('SOL-PERP');
  });

  it('GET /api/trades should list trades', async () => {
    const response = await request(app).get('/api/trades');

    expect(response.status).toBe(200);
    expect(response.body.trades).toBeInstanceOf(Array);
    expect(response.body.pagination).toHaveProperty('total');
  });
});
```

---

## 11. Performance Optimization

### 11.1 Database Optimization

**Indexes (already in schema):**
- Critical queries covered by indexes
- Composite indexes for common filters

**Query Optimization:**
- Use prepared statements (cached)
- Limit result sets (pagination)
- Use views for complex queries

### 11.2 API Response Caching

**SWR Configuration:**

```typescript
// lib/config/swr.ts
export const swrConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 10000, // 10s
  focusThrottleInterval: 5000,
};

// For market data (changes frequently)
export const marketDataConfig = {
  refreshInterval: 30000, // 30s
  dedupingInterval: 5000,
};

// For trade history (rarely changes)
export const tradeHistoryConfig = {
  refreshInterval: 0, // Manual revalidation only
  revalidateOnFocus: false,
};
```

**API Route Caching:**

```typescript
// app/api/data/drift/market/route.ts
import { NextResponse } from 'next/server';

export const revalidate = 30; // Cache for 30 seconds (Next.js feature)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const asset = searchParams.get('asset');

  // ... fetch data

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
```

### 11.3 Code Splitting

**Dynamic Imports:**

```typescript
// app/chat/page.tsx
import dynamic from 'next/dynamic';

// Heavy chart component loaded only when needed
const TradingViewWidget = dynamic(
  () => import('@/components/charts/TradingViewWidget'),
  { ssr: false, loading: () => <LoadingSkeleton /> }
);
```

---

## 12. Cost Estimation

### 12.1 Claude API Costs

**Pricing (as of 2025):**
- Claude 3.5 Sonnet: $3/M input tokens, $15/M output tokens

**Estimated Usage (MVP):**
- Average chat: 500 input + 1500 output tokens
- Average evaluation: 2000 input + 3000 output tokens
- Estimated monthly: 200 chats + 50 evaluations

**Monthly Cost:**
```
Chats:      200 × (500 × $3/M + 1500 × $15/M) = $4.80
Evaluations: 50 × (2000 × $3/M + 3000 × $15/M) = $2.55
Total: ~$7.35/month
```

### 12.2 Infrastructure Costs

**Vercel (Hobby Plan):**
- Free tier: 100 GB bandwidth, 100 GB-hours serverless
- MVP likely stays within free tier
- Pro plan ($20/month) if exceed limits

**Turso (SQLite - Phase 2):**
- Free tier: 8 GB storage, 1B row reads/month
- Likely sufficient for single user

**Total MVP Infrastructure: $0-20/month**

---

## 13. Migration from MVP to Production

### 13.1 Database Migration (SQLite → PostgreSQL)

**Why migrate:**
- Better concurrency for multi-user (Phase 6)
- More robust for production
- Better Vercel integration

**Migration Steps:**

1. **Export SQLite data:**
   ```bash
   sqlite3 trades.db .dump > dump.sql
   ```

2. **Convert to PostgreSQL:**
   ```bash
   # Install pgloader
   pgloader dump.sql postgresql://user:pass@host/db
   ```

3. **Update Drizzle schema:**
   ```typescript
   // Switch from better-sqlite3 to pg
   import { drizzle } from 'drizzle-orm/node-postgres';
   ```

4. **Test migration:**
   - Verify data integrity
   - Run full test suite
   - Compare analytics (should match)

### 13.2 Adding Authentication (Phase 6)

**Use NextAuth.js:**

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**Middleware for protected routes:**

```typescript
// middleware.ts
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/chat/:path*', '/calculator/:path*', '/log/:path*'],
};
```

---

## 14. Appendix

### 14.1 Development Commands

```bash
# Setup
pnpm install

# Database
pnpm db:generate     # Generate Drizzle migrations
pnpm db:migrate      # Run migrations
pnpm db:studio       # Open Drizzle Studio (DB GUI)
pnpm db:seed         # Seed test data

# Development
pnpm dev             # Start dev server (localhost:3000)
pnpm build           # Build for production
pnpm start           # Start production server

# Testing
pnpm test            # Run unit tests
pnpm test:watch      # Run tests in watch mode
pnpm test:e2e        # Run Playwright E2E tests
pnpm test:coverage   # Generate coverage report

# Code Quality
pnpm lint            # Run ESLint
pnpm format          # Run Prettier
pnpm type-check      # Run TypeScript compiler

# Utilities
pnpm analyze         # Analyze bundle size
pnpm clean           # Clean build artifacts
```

### 14.2 Package.json (Essential Dependencies)

```json
{
  "name": "trade-level-up",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@anthropic-ai/sdk": "^0.20.0",
    "better-sqlite3": "^9.4.0",
    "drizzle-orm": "^0.30.0",
    "axios": "^1.6.0",
    "zod": "^3.22.0",
    "swr": "^2.2.0",
    "zustand": "^4.5.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.344.0",
    "date-fns": "^3.3.0",
    "recharts": "^2.12.0",
    "pino": "^8.19.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/better-sqlite3": "^7.6.0",
    "typescript": "^5.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "prettier": "^3.2.0",
    "vitest": "^1.4.0",
    "@playwright/test": "^1.42.0",
    "drizzle-kit": "^0.20.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### 14.3 Git Workflow

**Branching Strategy:**

```
main                # Production-ready code
├── develop         # Integration branch
│   ├── feature/chat-interface
│   ├── feature/position-calculator
│   └── feature/trade-logging
└── hotfix/claude-api-error
```

**Commit Message Convention:**

```bash
feat: Add chat streaming support
fix: Handle Drift API timeout errors
docs: Update API endpoint documentation
test: Add unit tests for strategy engine
refactor: Extract confluence calculation
chore: Update dependencies
```

---

## 15. Success Criteria & Milestones

### 15.1 MVP Completion Checklist

**Week 1-2: Backend Setup**
- [ ] Next.js project initialized with TypeScript
- [ ] SQLite database created with full schema
- [ ] Drift API service implemented and tested
- [ ] Coinglass API service implemented
- [ ] Claude API integration with function calling working

**Week 3: Core Features**
- [ ] Chat interface with multi-turn conversation
- [ ] Claude function calling executing tools successfully
- [ ] Position calculator with all validations
- [ ] Trade CRUD operations functional
- [ ] Database repositories implemented

**Week 4: UI Polish**
- [ ] Dashboard showing real-time data
- [ ] Trade log table with filtering
- [ ] Trade detail modal with full context
- [ ] Responsive design (mobile friendly)
- [ ] Loading states and error handling

**Week 5: Integration & Testing**
- [ ] End-to-end user flow works (setup → calculate → log → evaluate)
- [ ] All API routes have error handling
- [ ] Unit tests pass (>80% coverage)
- [ ] E2E tests pass for critical flows
- [ ] Performance acceptable (<2s page load)

**MVP Launch Criteria:**
- ✅ Can chat with Claude about SOL/BTC setups
- ✅ Can calculate position size with risk validation
- ✅ Can log trades with reasoning and emotional notes
- ✅ Can evaluate closed trades with Claude
- ✅ Data persists correctly (no data loss)
- ✅ App works locally without errors

---

**Einde Technisch Ontwerp v2.0**

*Dit document dient als technische blauwdruk voor de implementatie van de AI Trading Decision Support Bot. Voor product requirements, zie het PRD. Voor user flows en schermontwerp, zie het FO.*
