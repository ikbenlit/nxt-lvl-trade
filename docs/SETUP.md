# Setup Guide - AI Trading Decision Support Bot

**Versie:** v2.0
**Laatst bijgewerkt:** 26-10-2025

Deze guide helpt je bij het opzetten van het development environment voor de AI Trading Decision Support Bot.

---

## Vereisten

Zorg dat je het volgende geïnstalleerd hebt:

- **Node.js 20** of hoger ([download](https://nodejs.org/))
- **pnpm** package manager: `npm install -g pnpm`
- **Git** voor version control
- **Anthropic API key** ([aanmaken](https://console.anthropic.com/))

---

## Stap 1: Next.js Project Initialisatie

Voer dit uit in de **root folder** van het project:

```bash
pnpm create next-app@latest . --typescript --tailwind --app --eslint
```

**Antwoorden tijdens setup:**
- ✅ Would you like to use TypeScript? → **Yes**
- ✅ Would you like to use ESLint? → **Yes**
- ✅ Would you like to use Tailwind CSS? → **Yes**
- ✅ Would you like to use `src/` directory? → **No**
- ✅ Would you like to use App Router? → **Yes**
- ✅ Would you like to customize the default import alias? → **No** (gebruik @/*)

> **Let op:** De `docs/` folder blijft behouden tijdens initialisatie.

---

## Stap 2: Dependencies Installeren

### Core Dependencies

```bash
pnpm add @anthropic-ai/sdk better-sqlite3 drizzle-orm zod swr zustand axios date-fns
```

**Uitleg:**
- `@anthropic-ai/sdk` - Claude AI integratie
- `better-sqlite3` - SQLite database driver
- `drizzle-orm` - Type-safe ORM voor database
- `zod` - Schema validatie voor API's
- `swr` - Data fetching en caching
- `zustand` - State management
- `axios` - HTTP client voor externe API's
- `date-fns` - Datum/tijd utilities

### Dev Dependencies

```bash
pnpm add -D drizzle-kit @types/better-sqlite3 vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

**Uitleg:**
- `drizzle-kit` - Database migrations en schema generator
- `@types/better-sqlite3` - TypeScript types voor SQLite
- `vitest` - Unit testing framework
- Testing libraries - Voor component en integration tests

---

## Stap 3: shadcn/ui Component Library

### Initialisatie

```bash
npx shadcn@latest init
```

**Antwoorden tijdens setup:**
- Which style? → **New York**
- Which color? → **Slate**
- Would you like to use CSS variables? → **Yes**

### Essential Components Installeren

```bash
npx shadcn@latest add button input card dialog table badge textarea scroll-area skeleton select
```

**Componenten:**
- `button` - Knoppen voor acties
- `input` - Formulier inputs
- `card` - Container componenten
- `dialog` - Modals voor trade details
- `table` - Trade log tabel
- `badge` - Status indicators (WIN/LOSS)
- `textarea` - Multi-line input voor chat
- `scroll-area` - Scrollable message list
- `skeleton` - Loading states
- `select` - Dropdown voor asset selectie (SOL/BTC)

---

## Stap 4: Database Setup

### Database Folder Aanmaken

```bash
mkdir -p data
```

### Drizzle Schema Aanmaken

Maak `lib/db/schema.ts`:

```bash
mkdir -p lib/db
```

> **Let op:** De volledige schema definitie staat in TO v2.0 §4.1. Deze implementeren we in Fase 1.

### Drizzle Config

Maak `drizzle.config.ts` in de root:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  driver: 'better-sqlite3',
  dbCredentials: {
    url: './data/trading-bot.db',
  },
} satisfies Config;
```

### Package.json Scripts Toevoegen

Voeg toe aan `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:sqlite",
    "db:migrate": "drizzle-kit push:sqlite",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## Stap 5: Environment Variables

### .env.local Aanmaken

Maak een `.env.local` bestand in de root:

```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=your_api_key_here

# Database
DATABASE_URL=./data/trading-bot.db

# Environment
NODE_ENV=development

# Optional: External APIs (Fase 1)
# DRIFT_API_URL=https://api.drift.trade
# COINGLASS_API_KEY=your_key_here
```

### API Key Verkrijgen

1. Ga naar [Anthropic Console](https://console.anthropic.com/)
2. Login of maak account aan
3. Navigeer naar "API Keys"
4. Klik "Create Key"
5. Kopieer de key naar `.env.local`

> **Budget:** ~$10/maand verwacht voor MVP gebruik

---

## Stap 6: Git Setup

### .gitignore Aanvullen

Voeg toe aan `.gitignore`:

```bash
# Environment variables
.env.local
.env*.local

# Database
data/
*.db
*.db-shm
*.db-wal

# Testing
coverage/
.vitest/

# Drizzle
drizzle/
```

### Initial Commit

```bash
git init
git add .
git commit -m "Initial setup: Next.js 14 + dependencies + shadcn/ui"
```

---

## Stap 7: Verificatie

### Development Server Starten

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

### TypeScript Check

```bash
pnpm type-check
```

> **Let op:** Als dit script niet bestaat, voeg toe aan `package.json`:
> ```json
> "type-check": "tsc --noEmit"
> ```

### ESLint Check

```bash
pnpm lint
```

---

## Project Structure (na setup)

```
03-trade-level-up/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx
│   └── page.tsx
├── components/             # React components
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities en services
│   ├── db/                 # Database schema + repositories
│   └── services/           # API services (Drift, Claude, etc.)
├── data/                   # SQLite database (gitignored)
├── docs/                   # Documentatie (PRD, FO, TO, etc.)
├── public/                 # Static assets
├── .env.local              # Environment variables (gitignored)
├── drizzle.config.ts       # Drizzle ORM configuratie
├── next.config.js          # Next.js configuratie
├── package.json            # Dependencies
├── tailwind.config.ts      # Tailwind configuratie
└── tsconfig.json           # TypeScript configuratie
```

---

## Troubleshooting

### `better-sqlite3` installatie faalt

**Probleem:** Native module build errors op Windows/Mac.

**Oplossing:**
- Zorg dat je Python 3 geïnstalleerd hebt
- Windows: Installeer `windows-build-tools`: `npm install -g windows-build-tools`
- Mac: Installeer Xcode Command Line Tools: `xcode-select --install`

### `pnpm create next-app` overschrijft bestaande files

**Probleem:** Waarschuwing dat folder niet leeg is.

**Oplossing:**
- Dit is normaal, Next.js zal alleen nieuwe bestanden toevoegen
- De `docs/` folder blijft behouden
- Bevestig met `y` om door te gaan

### shadcn/ui componenten niet gevonden

**Probleem:** Import errors voor `@/components/ui/*`.

**Oplossing:**
- Check of `tsconfig.json` het `@` alias bevat:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./*"]
      }
    }
  }
  ```
- Herstart TypeScript server in je IDE

---

## Volgende Stappen

Na succesvolle setup:

1. **Fase 1:** Database schema implementeren (zie Bouwplan §4.1)
2. **Fase 1:** Core services bouwen (DriftService, ClaudeService)
3. **Fase 2:** Chat interface ontwikkelen

Zie **Bouwplan v2.0** voor gedetailleerde fase-planning.

---

## Hulp Nodig?

- **Next.js Docs:** https://nextjs.org/docs
- **shadcn/ui Docs:** https://ui.shadcn.com
- **Drizzle ORM Docs:** https://orm.drizzle.team
- **Anthropic API Docs:** https://docs.anthropic.com

**Questions?** Raadpleeg de PRD, FO, TO of Screen Specifications in de `docs/` folder.
