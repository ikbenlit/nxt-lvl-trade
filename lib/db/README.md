# Database Setup

## Issue: better-sqlite3 Native Bindings

better-sqlite3 vereist C++ native bindings die gecompileerd moeten worden. Op WSL/Linux zijn build tools nodig.

### Oplossing: Installeer Build Tools

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3
```

### Na installatie: Rebuild better-sqlite3

```bash
pnpm rebuild better-sqlite3
```

### Test de database setup

```bash
# TypeScript type checking
pnpm type-check

# Push schema naar database (nieuwere syntax)
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### Alternatief: Gebruik migrate.ts script

Als `pnpm db:push` niet werkt, kun je ook het handmatige migrate script gebruiken:

```bash
node lib/db/migrate.ts
```

Dit maakt alle tabellen, indexes en triggers aan zonder Drizzle Kit.

## Database Structuur

De database bevat 7 tabellen:

1. **trades** - Trade records met entry/exit, P&L, setup analysis
2. **conversation_threads** - Chat sessies
3. **conversation_messages** - Individuele berichten met Claude metadata
4. **learnings** - AI-extracted patterns en edges
5. **strategy_versions** - Strategy configuraties (Phase 2+)
6. **user_settings** - Key-value store voor user preferences
7. **api_logs** - Cost tracking en debugging

## Database Location

Default: `./data/trading-bot.db`

Wijzig via environment variable in `.env.local`:

```bash
DATABASE_URL=./data/trading-bot.db
```

## Database Imports

```typescript
// Clean imports via barrel export
import { db, trades, Trade, NewTrade } from '@/lib/db';

// Example: Query trades
const allTrades = await db.select().from(trades);

// Example: Insert trade
const newTrade: NewTrade = {
  asset: 'SOL-PERP',
  direction: 'long',
  entryPrice: 138.5,
  entryTimestamp: new Date(),
  entrySize: 250,
  stopLoss: 136.5,
  leverage: 1.0,
};

await db.insert(trades).values(newTrade);
```

## Next Steps

Na succesvolle database setup → **Fase 1.2**: Repository pattern implementeren

Zie Bouwplan v2.0 §4 voor details.
