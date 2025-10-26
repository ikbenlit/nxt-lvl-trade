# 🧩 Functioneel Ontwerp (FO) – AI Trading Decision Support Bot

**Projectnaam:** AI Trading Decision Support Bot
**Versie:** v2.0
**Datum:** 26-10-2025
**Auteur:** Colin

---

## 1. Doel en relatie met het PRD

🎯 **Doel van dit document:**

Het Functioneel Ontwerp (FO) beschrijft **hoe** de AI Trading Decision Support Bot uit het PRD functioneel zal werken — wat de gebruiker ziet, doet en ervaart tijdens het identificeren, analyseren en loggen van trading setups.

📘 **Relatie met PRD:**

- **PRD bepaalt WAT:** Persoonlijke trading assistant voor SOL-PERP en BTC-PERP swing trading via Drift Protocol, focus op emotie-reductie en objectieve besluitvorming
- **FO bepaalt HOE:** Concrete schermen, user flows, AI interacties, en data flows voor conversational setup analysis, position sizing, en trade evaluation

**Kernverschil met PRD:**
- PRD: "Bot moet confluence analyseren en Claude consulteren"
- FO: "Gebruiker klikt 'Analyze Setup', systeem fetcht data, toont 5/6 confluence checklist, opent chat interface waar Claude uitlegt waarom dit wel/niet een setup is"

---

## 2. Overzicht van de belangrijkste onderdelen

🎯 **Doel:** Overzicht van modules en schermen binnen de applicatie.

### Kernmodules:

1. **Chat Interface** (Conversational Setup Analysis)
2. **Position Calculator** (Risk-based sizing & level calculator)
3. **Trade Log** (History with evaluation)
4. **Dashboard** (Overview & quick actions)

### Ondersteunende Componenten:

5. **Confluence Display** (Multi-factor checklist)
6. **Market Context Panel** (Real-time data sidebar)
7. **Strategy Config** (YAML editor, later fase)

---

## 3. User Stories

🎯 **Doel:** Beschrijven wat gebruikers moeten kunnen doen, vanuit hun perspectief.

### Primaire User Stories (Must-Have MVP):

| ID | Als... | Wil ik... | Zodat... | Prioriteit |
|----|--------|-----------|----------|------------|
| **US-01** | Trader | Een potentiële setup kunnen bespreken met Claude | Ik objectief begrijp of dit een goede entry is en mijn FOMO filter | **Hoog** |
| **US-02** | Trader | Real-time confluence score zien (RSI, OI, funding, FVG, liq) | Ik snel kan bepalen of een setup minimale kwaliteit heeft (4/6+) | **Hoog** |
| **US-03** | Trader | Claude vragen "Waarom is dit een setup?" of "Waarom niet?" | Ik leer welke factoren belangrijk zijn en mijn intuïtie verbeter | **Hoog** |
| **US-04** | Trader | Automatisch position size berekenen op basis van 1% risk | Ik consistent risico neem en niet te groot/klein ga | **Hoog** |
| **US-05** | Trader | Entry, stop en target levels voorgesteld krijgen | Ik objectieve levels heb gebaseerd op structure (niet gevoel) | **Hoog** |
| **US-06** | Trader | R:R ratio zien voordat ik een trade neem | Ik alleen trades neem met minimaal 1.5:1 ratio | **Hoog** |
| **US-07** | Trader | Mijn trades loggen met reasoning en emotional notes | Ik later kan analyseren wat werkte en waar emotie speelde | **Hoog** |
| **US-08** | Trader | Na een trade evaluatie krijgen van Claude | Ik leer wat goed/fout ging en mijn strategie verbeter | **Hoog** |
| **US-09** | Trader | Liquidation info zien (mijn liq price + clusters) | Ik veilige trades neem en squeeze potential kan inschatten | **Hoog** |
| **US-10** | Trader | OI divergence herkenning krijgen | Ik capitulation/exhaustion setups kan spotten | **Hoog** |

### Secundaire User Stories (Post-MVP):

| ID | Als... | Wil ik... | Zodat... | Prioriteit |
|----|--------|-----------|----------|------------|
| US-11 | Trader | Scheduled scans krijgen (2x/dag) | Ik setups niet mis als ik niet actief kijk | Middel |
| US-12 | Trader | Telegram alerts ontvangen | Ik op mijn telefoon gewaarschuwd word bij nieuwe setups | Middel |
| US-13 | Trader | Equity curve visualisatie zien | Ik mijn progressie over tijd kan tracken | Middel |
| US-14 | Trader | Win rate per asset/confluence level zien | Ik mijn edge kan identificeren (wat werkt voor mij) | Middel |
| US-15 | Trader | Strategy versies vergelijken (v1.0 vs v1.2) | Ik kan zien of updates daadwerkelijk helpen | Laag |

---

## 4. Functionele werking per onderdeel

🎯 **Doel:** Per hoofdonderdeel beschrijven wat de gebruiker kan doen en wat het systeem doet.

---

### 4.1 Dashboard (Landing Page)

**Doel:** Overzicht en snelle toegang tot kernfuncties.

**Schermopbouw:**
```
┌─────────────────────────────────────────────────────┐
│ Trade Level Up                    [Colin] [Settings]│
├─────────────────────────────────────────────────────┤
│                                                     │
│  Quick Scan                                         │
│  ┌───────────────────────────────────────────────┐ │
│  │ Asset: [SOL-PERP ▼] [BTC-PERP ▼]             │ │
│  │                                               │ │
│  │ Current: $138.20 (-3.2% today)                │ │
│  │ RSI: 34  |  OI: +8.2%  |  Funding: -0.015%   │ │
│  │                                               │ │
│  │ [Analyze with Claude] [Calculate Position]    │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Recent Activity                                    │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🟢 Trade #47: SOL +6.3% (2d ago)             │ │
│  │ 🔴 Trade #46: BTC -2.1% (5d ago)             │ │
│  │ 💬 Chat: "SOL setup?" (3h ago)               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [View All Trades] [Open Chat] [Trading Journal]   │
└─────────────────────────────────────────────────────┘
```

**Functionele elementen:**

1. **Asset Selector:**
   - Dropdown: SOL-PERP, BTC-PERP
   - Bij selectie: Fetch current price, RSI, OI change, funding rate
   - Update: Real-time (elke 30 sec via polling of SSE)

2. **Quick Stats Bar:**
   - Current Price + 24h change (kleurcode: groen/rood)
   - RSI (4h timeframe, kleuraanduiding: <30 rood, 30-70 grijs, >70 rood)
   - OI Change 24h (met richting: +8.2% = bullish divergence mogelijk)
   - Funding Rate (negatief = shorts domineren)

3. **Action Buttons:**
   - **[Analyze with Claude]:** → Navigeert naar `/chat` met pre-filled message: "Analyze SOL-PERP at current price"
   - **[Calculate Position]:** → Navigeert naar `/calculator` met asset pre-selected

4. **Recent Activity Feed:**
   - Laatste 3 trades (icoon: 🟢 win, 🔴 loss, ⚪ open)
   - Laatste 3 chat sessies (preview eerste message)
   - Klikbaar → Detail view

**States:**
- **Loading:** Skeleton loaders tijdens data fetch
- **Error:** "Could not fetch data from Drift API" met retry button
- **Empty:** "No trades yet. Start by analyzing a setup!"

---

### 4.2 Chat Interface (Conversational Setup Analysis)

**Doel:** Multi-turn conversatie met Claude over trading setups, met real-time data access.

**Schermopbouw:**
```
┌─────────────────────────────────────────────────────┐
│ ← Back to Dashboard         Chat with Claude        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Conversation History                                │
│ ┌───────────────────────────────────────────────┐ │
│ │ You: "SOL at $138, is this a setup?"          │ │
│ │      [3 min ago]                              │ │
│ │                                               │ │
│ │ Claude: "Let me analyze SOL-PERP..."         │ │
│ │      [Analyzing... ⏳]                        │ │
│ │                                               │ │
│ │      [Data fetched ✓]                         │ │
│ │                                               │ │
│ │      Price: $138.20 (-4.1% today)            │ │
│ │                                               │ │
│ │      Confluence: 5/6 ⭐⭐⭐⭐⭐              │ │
│ │      ✅ RSI 34 (oversold)                    │ │
│ │      ✅ Near support $137.50                 │ │
│ │      ✅ OI divergence (price down, OI up)    │ │
│ │      ✅ Negative funding                     │ │
│ │      ✅ Liq cluster $145 (15M shorts)        │ │
│ │      ❌ Volume low (Asia hours)              │ │
│ │                                               │ │
│ │      VERDICT: POTENTIAL SETUP, but WAIT      │ │
│ │                                               │ │
│ │      Reasoning: This shows capitulation      │ │
│ │      (shorts piling in as price drops), but  │ │
│ │      volume is weak. Better to wait for US   │ │
│ │      session (13:00 UTC) for confirmation.   │ │
│ │                                               │ │
│ │      Suggested entry: $138.50                │ │
│ │      Stop: $136.50 (-1.4%)                   │ │
│ │      Target: $145 (+4.7%)                    │ │
│ │      R:R: 3.4:1 ✅                            │ │
│ │                                               │ │
│ │      [Calculate Position] [Set Alert]        │ │
│ │      [2 min ago]                              │ │
│ │                                               │ │
│ │ You: "Why is volume important here?"         │ │
│ │      [Just now]                               │ │
│ │                                               │ │
│ │ Claude: [Typing... ⌨️]                       │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ Type your message...                    [Send]│ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Suggestions:                                        │
│ • "What if price doesn't dip to $137.50?"          │
│ • "Show me similar past setups"                    │
│ • "What invalidates this setup?"                   │
└─────────────────────────────────────────────────────┘
```

**Functionele elementen:**

1. **Message Input:**
   - Text area (multi-line support)
   - Send button (of Enter to send, Shift+Enter voor newline)
   - Character limit: 500 (om API kosten te beperken)

2. **Message Bubbles:**
   - **User messages:** Rechts aligned, blauwe achtergrond
   - **Claude messages:** Links aligned, grijze achtergrond
   - **Timestamps:** Relatief (Just now, 2 min ago, 1h ago)

3. **Claude Response States:**
   - **[Analyzing... ⏳]:** Claude is aan het denken
   - **[Fetching data...]:** Function call uitgevoerd (Drift API, etc.)
   - **[Data fetched ✓]:** Function result ontvangen
   - **Streaming:** Tokens komen binnen real-time (zoals ChatGPT UX)

4. **Embedded Action Buttons (in Claude messages):**
   - **[Calculate Position]:** → Pre-fill calculator met Claude's suggested levels
   - **[Set Alert]:** → Create price alert voor suggested entry
   - **[Show Chart]:** → Open TradingView widget modal met asset

5. **Context Sidebar (Collapsible, Rechterkant):**
   ```
   ┌─────────────────────────┐
   │ Current Context         │
   ├─────────────────────────┤
   │ Asset: SOL-PERP         │
   │ Price: $138.20          │
   │ Last Update: 10s ago    │
   │                         │
   │ Confluence: 5/6         │
   │ ✅ RSI oversold         │
   │ ✅ Support nearby       │
   │ ✅ OI divergence        │
   │ ✅ Negative funding     │
   │ ✅ Liquidations above   │
   │ ❌ Volume low           │
   │                         │
   │ [Refresh Data]          │
   └─────────────────────────┘
   ```

6. **Suggestion Chips:**
   - Onder input field
   - Pre-defined vragen (context-aware)
   - Klikken → Vult input field

**Interacties:**

**User → Claude:**
1. User typt: "SOL at $138, is this a setup?"
2. Frontend: POST `/api/chat` met message + thread_id
3. Backend: Claude API call met tools (fetch_drift_data, calculate_confluence, etc.)
4. Claude: Roept tools aan → Backend executes → Results terug naar Claude
5. Claude: Genereert response (streamed)
6. Frontend: Toont response token-by-token (smooth UX)

**Claude → User (with embedded actions):**
- Claude zegt: "Suggested entry: $138.50, Stop: $136.50"
- Button: [Calculate Position]
- Klik → Navigeer naar `/calculator` met pre-filled values

**Data Persistence:**
- Alle messages opgeslagen in database (conversation_messages table)
- Thread ID tracked (sessie-gebaseerd)
- Bij page refresh: Laad thread history (laatste 20 messages)

---

### 4.3 Position Calculator

**Doel:** Berekenen van position size, entry/stop/target levels, R:R ratio, en liquidation price.

**Schermopbouw:**
```
┌─────────────────────────────────────────────────────┐
│ ← Back                Position Calculator            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Asset Selection                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ [SOL-PERP ●] [BTC-PERP ○]                     │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Account Settings                                    │
│ ┌───────────────────────────────────────────────┐ │
│ │ Account Size: [$50,000    ]                   │ │
│ │ Risk per Trade: [1%       ] = $500            │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Price Levels                                        │
│ ┌───────────────────────────────────────────────┐ │
│ │ Entry Price:  [$138.50    ] (Current: $138.20)│ │
│ │ Stop Loss:    [$136.50    ] (-1.4% from entry)│ │
│ │ Target 1:     [$145.00    ] (+4.7% from entry)│ │
│ │ Target 2:     [$148.50    ] (+7.2% from entry)│ │
│ │                                               │ │
│ │ [Suggest Levels] ← Claude suggests based on  │ │
│ │                     support/resistance/FVG    │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Risk/Reward Analysis                                │
│ ┌───────────────────────────────────────────────┐ │
│ │ Entry → Stop:  $2.00 (-1.4%) 🔴              │ │
│ │ Entry → T1:    $6.50 (+4.7%) 🟢              │ │
│ │ Entry → T2:   $10.00 (+7.2%) 🟢              │ │
│ │                                               │ │
│ │ R:R Ratio (T1): 3.4:1 ✅ (>1.5 required)     │ │
│ │ R:R Ratio (T2): 5.2:1 ✅ (excellent)         │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Position Sizing                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ Calculation:                                  │ │
│ │ Risk Amount: $500 (1% of $50k)               │ │
│ │ Risk per SOL: $2.00 (entry - stop)           │ │
│ │ → Position: 250 SOL                          │ │
│ │                                               │ │
│ │ Leverage: [10x        ]                       │ │
│ │                                               │ │
│ │ Notional Value: $34,625                       │ │
│ │ Margin Required: $3,462                       │ │
│ │ Your Liquidation: $124.65 (-9.8%)            │ │
│ │                                               │ │
│ │ ⚠️ Safety Check: Liq price is 9.8% away ✅   │ │
│ │    (Minimum 8% recommended)                   │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Liquidation Context                                 │
│ ┌───────────────────────────────────────────────┐ │
│ │ Market Liquidations (via Coinglass):          │ │
│ │ • $145: $15M shorts (squeeze target)          │ │
│ │ • $150: $30M shorts (major cluster)           │ │
│ │ • $135: $8M longs (below your stop)           │ │
│ │                                               │ │
│ │ [View Heatmap on Coinglass]                   │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Actions                                             │
│ [Log Trade] [Ask Claude] [Copy to Clipboard]       │
└─────────────────────────────────────────────────────┘
```

**Functionele elementen:**

1. **Asset Selector:**
   - Radio buttons: SOL-PERP, BTC-PERP
   - Bij switch: Reset alle velden naar current price defaults

2. **Account Settings:**
   - **Account Size:** Editable, persistent (saved in localStorage)
   - **Risk %:** Editable (default 1%), berekent dollar amount live

3. **Price Levels Input:**
   - **Entry:** Manual input of pre-filled (van Claude suggestion)
   - **Stop:** Manual input, toont % distance real-time
   - **Targets:** Multiple targets (T1, T2 optional)
   - **[Suggest Levels] Button:** → Triggers Claude API call voor level suggestion op basis van current structure

4. **Risk/Reward Display:**
   - **Visual bars:** Rood voor risk, groen voor reward
   - **Ratio calculation:** Automatic bij elke input change
   - **Validation:** ❌ als R:R <1.5:1, ✅ als ≥1.5:1

5. **Position Sizing Calculation:**
   - **Formula zichtbaar:** "Risk $500 / $2 per SOL = 250 SOL"
   - **Leverage slider:** 1x - 10x (Drift max)
   - **Real-time updates:** Bij elke wijziging recalculatie

6. **Liquidation Display:**
   - **Your liq price:** Prominently displayed met % distance
   - **Safety check:** Groen als >8% weg, oranje 5-8%, rood <5%
   - **Market clusters:** Fetched van Coinglass API, toont top 3

7. **Action Buttons:**
   - **[Log Trade]:** → Opens modal om trade te loggen (pre-filled met deze data)
   - **[Ask Claude]:** → Opens chat met context: "I'm looking at SOL entry $138.50, stop $136.50, thoughts?"
   - **[Copy to Clipboard]:** → Kopieer alle data (voor gebruik in Drift UI)

**Validations:**
- Entry > 0
- Stop ≠ Entry (moet anders zijn)
- R:R ≥ 1.5:1 (anders: waarschuwing "R:R below minimum")
- Liquidation ≥ 8% away (anders: waarschuwing "Liquidation too close")
- Margin < Account Size (anders: error "Insufficient funds")

**States:**
- **Empty:** Default values (current price, reasonable stop/target)
- **Pre-filled (van Chat):** Values passed via URL params of state
- **Calculating:** Spinner tijdens Coinglass API call voor liquidation data
- **Error:** "Could not fetch liquidation data" → Graceful degradation (show calculator zonder liq context)

---

### 4.4 Trade Log (History & Evaluation)

**Doel:** Overzicht van alle trades met filtering, detail view, en post-trade evaluatie.

**Schermopbouw:**
```
┌─────────────────────────────────────────────────────┐
│ Trade Log                         [+ Add Trade]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Filters                                             │
│ ┌───────────────────────────────────────────────┐ │
│ │ Asset: [All ▼] Outcome: [All ▼]              │ │
│ │ Date: [Last 30 days ▼]                        │ │
│ │ [Apply] [Clear]                               │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Summary Stats                                       │
│ ┌───────────────────────────────────────────────┐ │
│ │ Total Trades: 47  |  Win Rate: 70% (33/47)   │ │
│ │ Avg R:R: 2.1:1    |  Total P&L: +18.4%        │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Trade History Table                                 │
│ ┌───────────────────────────────────────────────┐ │
│ │ # │ Asset│Entry  │Exit   │P&L  │R:R │Status │ │
│ ├───┼──────┼───────┼───────┼─────┼────┼───────┤ │
│ │47 │SOL   │138.50 │147.20 │+6.3%│4.5 │✅ 📝 │ │
│ │46 │BTC   │61200  │59800  │-2.1%│-   │❌ 📝 │ │
│ │45 │SOL   │135.00 │142.00 │+5.2%│3.1 │✅ 📝 │ │
│ │44 │BTC   │63000  │64500  │+2.4%│2.0 │✅    │ │
│ │43 │SOL   │140.00 │138.50 │-1.1%│-   │❌    │ │
│ │...│      │       │       │     │    │       │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Legend:                                             │
│ ✅ Win | ❌ Loss | 📝 Evaluated by Claude           │
│                                                     │
│ [Export CSV] [View Equity Curve]                   │
└─────────────────────────────────────────────────────┘
```

**Klik op row → Detail Modal:**
```
┌─────────────────────────────────────────────────────┐
│ Trade #47 Detail                              [✕]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Setup Details                                       │
│ ┌───────────────────────────────────────────────┐ │
│ │ Asset: SOL-PERP                               │ │
│ │ Entry: $138.50 (2025-10-20 14:30 UTC)        │ │
│ │ Exit: $147.20 (2025-10-22 16:15 UTC)         │ │
│ │ Hold Duration: 2 days 1h 45m                  │ │
│ │                                               │ │
│ │ P&L: +$1,575 (+6.3%)                          │ │
│ │ R:R Actual: 4.5:1 (projected was 3.4:1)      │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Your Reasoning (at entry)                           │
│ ┌───────────────────────────────────────────────┐ │
│ │ "Entered on FVG retest as Claude suggested.   │ │
│ │  Waited for US session for volume. Stop was   │ │
│ │  tight (1.4%) but FVG should hold. Confluence │ │
│ │  5/6 was strong."                             │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Emotional Notes                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ "Wanted to enter at $140 earlier (FOMO) but   │ │
│ │  Claude's advice to wait paid off. Almost     │ │
│ │  exited at $143 when BTC dipped, but held     │ │
│ │  because funding still negative."             │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Claude's Setup Analysis (at entry)                  │
│ ┌───────────────────────────────────────────────┐ │
│ │ "HIGH conviction setup. 5/6 confluence.       │ │
│ │  Capitulation signal (OI divergence). Entry   │ │
│ │  at FVG zone = structural support. Target     │ │
│ │  $145 aligns with liquidation cluster."       │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ Market Context (at entry)                           │
│ ┌───────────────────────────────────────────────┐ │
│ │ BTC: $61,200 (+2.1%)                          │ │
│ │ SPX: 4,520 (-0.5%)                            │ │
│ │ SOL Funding: -0.015%                          │ │
│ │ SOL OI: $280M (+8.2% in 24h)                  │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ [Evaluate with Claude] [Edit Notes] [Delete]       │
└─────────────────────────────────────────────────────┘
```

**Klik [Evaluate with Claude] → Evaluation View:**
```
┌─────────────────────────────────────────────────────┐
│ Trade #47 Evaluation                           [✕] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Claude's Analysis                                   │
│ ┌───────────────────────────────────────────────┐ │
│ │ [Analyzing trade #47...]                      │ │
│ │                                               │ │
│ │ TRADE BREAKDOWN:                              │ │
│ │                                               │ │
│ │ Setup Quality: 5/6 confluence ✅              │ │
│ │ Execution: Entry at planned level ✅          │ │
│ │ Timing: Waited for US session ✅              │ │
│ │ Exit: Target 1 hit exactly ✅                 │ │
│ │ Outcome: +6.3% (better than projected +4.7%) │ │
│ │                                               │ │
│ │ WHAT WENT RIGHT:                              │ │
│ │                                               │ │
│ │ 1. Discipline: You waited despite FOMO        │ │
│ │    → This patience added 1.5% better entry    │ │
│ │                                               │ │
│ │ 2. FVG support held perfectly                 │ │
│ │    → Your structure analysis was correct      │ │
│ │                                               │ │
│ │ 3. OI divergence played out                   │ │
│ │    → Shorts squeezed to $145 as predicted     │ │
│ │                                               │ │
│ │ WHAT COULD BE BETTER:                         │ │
│ │                                               │ │
│ │ 1. Early exit temptation at $143              │ │
│ │    → Your notes mention BTC dip fear          │ │
│ │    → But: SOL/BTC ratio was rising (ignore)   │ │
│ │    → Lesson: Check ratio before panic         │ │
│ │                                               │ │
│ │ 2. Forgot to move stop to breakeven          │ │
│ │    → At $141 (50% to target), should've moved │ │
│ │    → Risk management rule: Always do this     │ │
│ │                                               │ │
│ │ LEARNING FOR NEXT TRADE:                      │ │
│ │                                               │ │
│ │ ✅ FVG + OI divergence = your best setups     │ │
│ │ ✅ Waiting for volume confirmation pays off   │ │
│ │ ⚠️ Add checklist: Move stop to BE at 50%     │ │
│ │ ⚠️ Monitor SOL/BTC ratio during BTC volatility│ │
│ │                                               │ │
│ │ Your win rate on "FVG + OI divergence"       │ │
│ │ setups is now 5/5 (100%). This is your edge. │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ [Save Evaluation] [Continue Discussion]             │
└─────────────────────────────────────────────────────┘
```

**Functionele elementen:**

1. **Filters:**
   - Asset dropdown: All, SOL-PERP, BTC-PERP
   - Outcome dropdown: All, Wins, Losses
   - Date picker: Last 7 days, 30 days, 3 months, Custom range
   - Apply → Refresh table, Clear → Reset filters

2. **Summary Stats:**
   - Dynamically calculated gebaseerd op filtered data
   - Win rate: Percentage + absolute (33/47)
   - Avg R:R: Mean van alle closed trades
   - Total P&L: Sum van all P&L percentages

3. **Trade Table:**
   - Sortable columns (click header)
   - Row highlighting: Groen voor wins, rood voor losses
   - Icons: ✅/❌ voor outcome, 📝 als evaluated
   - Clickable rows → Detail modal

4. **Detail Modal:**
   - **Setup Details:** Entry/exit prices, timestamps, hold duration, P&L
   - **Your Reasoning:** Free text (entered at time of trade)
   - **Emotional Notes:** Free text (entered at time of trade)
   - **Claude's Setup Analysis:** Saved from original setup check
   - **Market Context:** Snapshot van BTC, SPX, funding, OI at entry time
   - **Actions:**
     - **[Evaluate with Claude]:** Triggers POST `/api/trades/:id/evaluate`
     - **[Edit Notes]:** Toggle edit mode voor reasoning/emotional notes
     - **[Delete]:** Soft delete (confirmatie modal)

5. **Evaluation View:**
   - **Streaming response:** Claude's analysis komt binnen token-by-token
   - **Structured output:** Bullets, clear sections
   - **Learning extraction:** Identified patterns + edge detection
   - **Save:** Stores evaluation in database (claude_evaluation column)
   - **Continue Discussion:** → Opens chat with trade context loaded

**Data Flow:**

**Log Trade:**
1. User clicks [+ Add Trade] → Modal opens
2. Form: Asset, Entry, Exit, P&L (auto-calculated), Your reasoning, Emotional notes
3. Submit → POST `/api/trades`
4. Backend: Save to database, fetch market context (BTC, SPX) for that timestamp
5. Success → Table refreshes, new trade appears

**Evaluate Trade:**
1. User clicks [Evaluate with Claude] in detail modal
2. Frontend: POST `/api/trades/:id/evaluate`
3. Backend:
   - Fetch trade details from DB
   - Fetch related conversation (if exists)
   - Call Claude with context:
     ```
     "Analyze Trade #47:
      Entry: $138.50, Exit: $147.20, P&L: +6.3%
      User reasoning: [text]
      Emotional notes: [text]
      Setup at entry: [confluence factors]
      Market context: [BTC, SPX, etc.]

      Provide: What worked, what didn't, learnings."
     ```
4. Claude: Generates structured evaluation (streamed)
5. Frontend: Shows streaming response
6. Backend: Saves evaluation to DB after complete

---

### 4.5 Navigation & Layout (Next.js App Router)

**Route Structure:**
```
app/
├── layout.tsx              # Root layout (persistent header/nav)
├── page.tsx                # Dashboard (landing)
├── chat/
│   └── page.tsx            # Chat interface
├── calculator/
│   └── page.tsx            # Position calculator
├── log/
│   ├── page.tsx            # Trade log table
│   └── [id]/
│       └── page.tsx        # Trade detail (dynamic route)
└── api/
    ├── chat/
    │   └── route.ts        # POST /api/chat
    ├── trades/
    │   ├── route.ts        # GET/POST /api/trades
    │   └── [id]/
    │       ├── route.ts    # GET/PUT/DELETE /api/trades/:id
    │       └── evaluate/
    │           └── route.ts # POST /api/trades/:id/evaluate
    └── data/
        ├── drift/
        │   └── route.ts    # GET /api/data/drift?asset=SOL
        └── coinglass/
            └── route.ts    # GET /api/data/coinglass?asset=SOL
```

**Persistent Layout (All Pages):**
```
┌─────────────────────────────────────────────────────┐
│ Trade Level Up    [Dashboard][Chat][Calculator][Log]│
│                                      [Colin][Theme ☀️]│
├─────────────────────────────────────────────────────┤
│                                                     │
│                 {page content}                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Navigation Bar:**
- **Left:** Logo + Title "Trade Level Up"
- **Center:** Main nav links (Dashboard, Chat, Calculator, Log)
- **Right:** User menu (Colin ▼), Theme toggle (Light/Dark)

**Responsive:**
- Desktop (>1024px): Full layout as shown
- Tablet (768-1024px): Collapsed sidebar, hamburger menu
- Mobile (<768px): Bottom tab bar navigation

---

## 5. UI-overzicht (visuele structuur)

🎯 **Doel:** Eenvoudig inzicht geven in de globale schermopbouw.

### Global Layout (Next.js App Router):

```
┌───────────────────────────────────────────────┐
│ Header: Logo, Nav, User Menu, Theme Toggle   │
├───────────────────────────────────────────────┤
│                                               │
│              Main Content Area                │
│         (Route-specific page content)         │
│                                               │
│  - Dashboard: Quick scan + Recent activity    │
│  - Chat: Message history + Input              │
│  - Calculator: Form + Results                 │
│  - Log: Table + Filters + Detail modal        │
│                                               │
├───────────────────────────────────────────────┤
│ Footer: Links, Version, API Status            │
└───────────────────────────────────────────────┘
```

### Component Hierarchy (React):

```
App (layout.tsx)
├── Header
│   ├── Logo
│   ├── Navigation (Dashboard, Chat, Calculator, Log)
│   └── UserMenu (Profile, Settings, Logout)
│
├── Page Content (route-specific)
│   ├── Dashboard (page.tsx)
│   │   ├── QuickScan
│   │   │   ├── AssetSelector
│   │   │   ├── QuickStats
│   │   │   └── ActionButtons
│   │   └── RecentActivity
│   │       └── ActivityCard[]
│   │
│   ├── Chat (/chat/page.tsx)
│   │   ├── MessageList
│   │   │   └── MessageBubble[]
│   │   ├── MessageInput
│   │   └── ContextSidebar (collapsible)
│   │       └── ConfluenceDisplay
│   │
│   ├── Calculator (/calculator/page.tsx)
│   │   ├── AssetSelector
│   │   ├── AccountSettings
│   │   ├── PriceLevelsForm
│   │   ├── RiskRewardDisplay
│   │   ├── PositionSizeResult
│   │   └── LiquidationContext
│   │
│   └── Log (/log/page.tsx)
│       ├── FilterBar
│       ├── SummaryStats
│       ├── TradeTable
│       │   └── TradeRow[]
│       └── TradeDetailModal
│           ├── TradeDetails
│           ├── ReasoningDisplay
│           └── EvaluationView
│
└── Footer
```

---

## 6. Interacties met AI (functionele beschrijving)

🎯 **Doel:** Uitleggen waar AI (Claude) in de flow voorkomt en wat de gebruiker ziet.

### AI Interacties:

| Locatie | AI-actie | Trigger | Claude Tools Used | Output |
|---------|----------|---------|-------------------|---------|
| **Chat Interface** | Setup Analysis | User: "SOL at $138, setup?" | `fetch_drift_data(SOL-PERP)`, `calculate_confluence()`, `get_liquidations()` | Confluence score, reasoning, suggested levels |
| **Chat Interface** | Follow-up Questions | User: "Why is volume important?" | (No tools, uses previous context) | Explanation, context-aware answer |
| **Calculator** | Level Suggestion | Click: [Suggest Levels] | `detect_fvg(SOL)`, `find_support_resistance()`, `get_liquidations()` | Entry/stop/target suggestions |
| **Trade Log** | Post-Trade Evaluation | Click: [Evaluate with Claude] | `query_trade(id)`, `get_market_context(date)` | Structured evaluation (what worked, learnings) |
| **Dashboard** | Quick Analysis | Click: [Analyze with Claude] | Pre-filled chat message → (same as Chat Interface) | Navigates to Chat with context |

### Claude Function Calling (Backend Implementation):

**Available Tools for Claude:**

1. **fetch_drift_data(asset: string)**
   - Fetches: Current price, 24h volume, OI, funding rate
   - Returns: JSON with all data

2. **calculate_confluence(asset: string)**
   - Calculates: RSI (4h), MACD, FVG zones, support/resistance
   - Returns: Confluence score (0-6), details per factor

3. **get_liquidations(asset: string)**
   - Fetches: Coinglass liquidation clusters
   - Returns: List of price levels with amounts

4. **calculate_position_size(entry, stop, risk_pct, account_size)**
   - Calculates: Position size, notional, margin, liq price
   - Returns: All sizing details

5. **query_trades(filters: object)**
   - Queries: SQLite database for trades
   - Returns: List of trades matching filters

6. **analyze_trade(trade_id: number)**
   - Fetches: Full trade context (entry, exit, reasoning, market snapshot)
   - Returns: Trade details for evaluation

### User Experience Flow (Example):

**Scenario: User asks "SOL setup?"**

```
1. User types in Chat: "SOL at $138, is this a setup?"

2. Frontend → POST /api/chat
   {
     "message": "SOL at $138, is this a setup?",
     "thread_id": "thread_abc123"
   }

3. Backend receives, calls Claude:
   messages = [
     {"role": "user", "content": "SOL at $138, is this a setup?"}
   ]
   tools = [fetch_drift_data, calculate_confluence, get_liquidations]

4. Claude decides: "I need data"
   → tool_use: fetch_drift_data("SOL-PERP")

5. Backend executes:
   drift_data = drift_api.get_market_data("SOL-PERP")
   → Returns: {price: 138.20, oi: 280M, funding: -0.015, ...}

6. Claude receives data, decides: "I need confluence"
   → tool_use: calculate_confluence("SOL-PERP")

7. Backend executes:
   confluence = strategy_engine.calculate(drift_data)
   → Returns: {score: 5, factors: {rsi: true, fvg: true, ...}}

8. Claude receives confluence, decides: "I need liquidations"
   → tool_use: get_liquidations("SOL-PERP")

9. Backend executes:
   liq_data = coinglass_api.get_liquidations("SOL")
   → Returns: {clusters: [{price: 145, amount: 15M}, ...]}

10. Claude has all data, generates response:
    "Let me analyze SOL-PERP at $138.20...

     Confluence: 5/6 ⭐⭐⭐⭐⭐
     ✅ RSI 34 (oversold)
     ✅ Near support $137.50
     [...]

     VERDICT: POTENTIAL SETUP, but WAIT

     Reasoning: [detailed explanation]"

11. Backend streams response → Frontend shows token-by-token

12. User sees analysis in chat bubble

13. User clicks embedded [Calculate Position] button
    → Navigates to /calculator with pre-filled values
```

---

## 7. Data Flows & Backend Integration

🎯 **Doel:** Beschrijven hoe data door het systeem stroomt.

### Architecture Overview:

```
┌─────────────────────────────────────────────┐
│         Next.js Frontend                    │
│  (app/, components/, lib/)                  │
├─────────────────────────────────────────────┤
│                                             │
│  User Interactions:                         │
│  - Chat with Claude                         │
│  - Calculate positions                      │
│  - Log trades                               │
│  - View history                             │
│                                             │
└────────────┬────────────────────────────────┘
             │ HTTP/SSE
             │
┌────────────▼────────────────────────────────┐
│      Next.js API Routes (Backend)           │
│      (app/api/)                             │
├─────────────────────────────────────────────┤
│                                             │
│  /api/chat          → Claude integration    │
│  /api/trades        → CRUD operations       │
│  /api/data/drift    → Drift API proxy       │
│  /api/data/coinglass → Coinglass proxy      │
│                                             │
│  Services:                                  │
│  ├─ claude_service.ts                       │
│  ├─ drift_service.ts                        │
│  ├─ coinglass_service.ts                    │
│  ├─ strategy_engine.ts                      │
│  └─ database.ts (SQLite via better-sqlite3) │
│                                             │
└────────────┬────────────────────────────────┘
             │
        ┌────┴────┬──────────┬──────────────┐
        │         │          │              │
    ┌───▼───┐ ┌──▼──┐  ┌────▼────┐   ┌────▼─────┐
    │Claude │ │Drift│  │Coinglass│   │  SQLite  │
    │  API  │ │ API │  │   API   │   │ Database │
    └───────┘ └─────┘  └─────────┘   └──────────┘
```

### Data Flow Examples:

#### Flow 1: User asks Claude about setup

```
User → Frontend (Chat UI)
  ↓ POST /api/chat
Next.js API Route
  ↓ Call claude_service.chat()
Claude Service
  ↓ messages.create() with tools
Claude API
  ↓ tool_use: fetch_drift_data
Next.js API Route (tool executor)
  ↓ Call drift_service.getMarketData()
Drift API
  ↓ Returns: {price, oi, funding}
Next.js API Route
  ↓ Return tool result to Claude
Claude API
  ↓ Generates response (streamed)
Next.js API Route
  ↓ Stream SSE to client
Frontend (Chat UI)
  ↓ Display tokens as they arrive
User sees response
```

#### Flow 2: User calculates position

```
User → Frontend (Calculator)
  ↓ Input: entry, stop, target
Frontend (local calculation)
  ↓ Calculate: size, R:R, margin
  ↓ POST /api/data/coinglass
Next.js API Route
  ↓ Call coinglass_service.getLiquidations()
Coinglass API
  ↓ Returns: liquidation clusters
Next.js API Route
  ↓ Return: {clusters: [...]}
Frontend (Calculator)
  ↓ Display: Position size + liq context
User sees results
```

#### Flow 3: User logs trade

```
User → Frontend (Trade Log Modal)
  ↓ POST /api/trades
Next.js API Route
  ↓ Validate input
  ↓ Call database.createTrade()
SQLite
  ↓ INSERT INTO trades (...)
  ↓ Returns: trade_id
Next.js API Route
  ↓ Fetch market context (BTC, SPX via cache)
  ↓ UPDATE trades SET market_context = {...}
Next.js API Route
  ↓ Return: {success: true, trade_id}
Frontend (Trade Log)
  ↓ Refresh table
User sees new trade in list
```

#### Flow 4: User evaluates trade

```
User → Frontend (Trade Detail Modal)
  ↓ POST /api/trades/:id/evaluate
Next.js API Route
  ↓ Call database.getTrade(id)
SQLite
  ↓ Returns: trade details
Next.js API Route
  ↓ Call claude_service.evaluateTrade(trade)
Claude API
  ↓ Analyze trade (with context)
  ↓ Generate evaluation (streamed)
Next.js API Route
  ↓ Stream SSE to client
  ↓ On complete: database.updateTrade(id, evaluation)
SQLite
  ↓ UPDATE trades SET claude_evaluation = {...}
Frontend (Evaluation View)
  ↓ Display streamed evaluation
User sees analysis + learnings
```

---

## 8. Database Schema (SQLite)

🎯 **Doel:** Definieren van data structuur.

### Tables:

```sql
-- Core trades table
CREATE TABLE trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset TEXT NOT NULL,              -- 'SOL-PERP' or 'BTC-PERP'
    direction TEXT NOT NULL,          -- 'long' or 'short'

    -- Entry
    entry_price REAL NOT NULL,
    entry_timestamp DATETIME NOT NULL,

    -- Exit
    exit_price REAL,
    exit_timestamp DATETIME,
    exit_reason TEXT,                 -- 'target', 'stop', 'manual'

    -- Performance
    pnl_pct REAL,
    pnl_usd REAL,
    hold_duration_hours REAL,
    r_multiple REAL,                  -- Actual R:R achieved

    -- Setup context
    confluence_score INTEGER,         -- 0-6
    confluence_factors JSON,          -- {rsi: true, fvg: true, ...}

    -- User input (CRITICAL for learning)
    user_reasoning TEXT,              -- Why you took this trade
    emotional_notes TEXT,             -- "Felt FOMO", "Was patient"

    -- AI context
    claude_setup_analysis TEXT,       -- Claude's verdict at entry
    claude_evaluation TEXT,           -- Post-trade evaluation

    -- Market context
    market_context JSON,              -- {btc_price, spx_close, funding, ...}

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conversation threads
CREATE TABLE conversation_threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    topic TEXT                        -- "Setup analysis SOL-PERP"
);

-- Individual messages
CREATE TABLE conversation_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    role TEXT NOT NULL,               -- 'user' or 'assistant'
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Context
    related_trade_ids JSON,           -- [47, 48] if discussing these
    tools_used JSON,                  -- [{"name": "fetch_drift_data", ...}]

    FOREIGN KEY (thread_id) REFERENCES conversation_threads(id)
);

-- Learnings extracted by Claude
CREATE TABLE learnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insight_type TEXT NOT NULL,       -- 'pattern', 'edge', 'weakness'
    title TEXT NOT NULL,              -- "FVG setups have 100% win rate"
    description TEXT,
    supporting_trade_ids JSON,        -- [47, 45, 43, ...]
    confidence_score REAL,            -- 0.0-1.0
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Strategy versions (for later phases)
CREATE TABLE strategy_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT UNIQUE NOT NULL,     -- "v1.0", "v1.1"
    config_yaml TEXT,
    changelog TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User settings
CREATE TABLE user_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_trades_asset ON trades(asset);
CREATE INDEX idx_trades_timestamp ON trades(entry_timestamp);
CREATE INDEX idx_messages_thread ON conversation_messages(thread_id);
CREATE INDEX idx_messages_timestamp ON conversation_messages(timestamp);
```

---

## 9. Tech Stack Summary (Next.js Focus)

🎯 **Doel:** Overzicht van technologieën.

### Frontend (Next.js):
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **UI Library:** shadcn/ui (Radix UI + Tailwind)
- **Styling:** Tailwind CSS
- **State Management:** React Context + Zustand (for global state)
- **Data Fetching:** SWR (for client-side) + Server Components (for SSR)
- **Streaming:** Server-Sent Events (SSE) for Claude responses

### Backend (Next.js API Routes):
- **Runtime:** Node.js (Next.js serverless functions)
- **Language:** TypeScript
- **Database:** SQLite (via better-sqlite3)
- **ORM:** Drizzle ORM (optional, for type-safety)

### External APIs:
- **AI:** Anthropic Claude API (claude-3-5-sonnet)
- **Trading Data:** Drift Protocol API (REST)
- **Liquidations:** Coinglass API
- **Macro Data:** Yahoo Finance (via yfinance equivalent in Node)
- **Indicators:** ta-lib WASM (or custom implementations)

### Deployment:
- **Phase 1 (MVP):** Local (npm run dev)
- **Phase 2:** Vercel (Next.js native platform)
- **Database:** SQLite file (local) → Later: Turso (SQLite edge) or PostgreSQL

### Development Tools:
- **Package Manager:** pnpm
- **Linting:** ESLint + Prettier
- **Testing:** Vitest (unit) + Playwright (e2e)
- **Version Control:** Git

---

## 10. User Journey Examples

🎯 **Doel:** End-to-end scenario's voor typische gebruik.

### Journey 1: First-time Setup Analysis

```
Colin opens app
  ↓
Dashboard loads
  ↓
Sees SOL at $138.20 (-3.2% today)
  ↓
Thinks: "Hmm, is dit een setup?"
  ↓
Clicks [Analyze with Claude]
  ↓
Navigates to /chat
  ↓
Pre-filled message: "Analyze SOL-PERP at current price"
  ↓
Hits Send
  ↓
Claude: "Let me check..." [Analyzing animation]
  ↓
Claude calls tools (fetch data, calculate confluence)
  ↓
Claude: "Confluence 5/6. This is a GOOD setup BUT..."
  ↓
Claude explains: "Wait for US session (volume low)"
  ↓
Colin: "Why is volume important?"
  ↓
Claude: "Your order is 2% of hourly volume in Asia..."
  ↓
Colin: "Got it. Set alert for $138.50 during US hours."
  ↓
Colin closes app, goes back to work
  ↓
[3 hours later, alert triggers]
  ↓
Colin opens app → Chat
  ↓
"SOL at $138.50 now, volume picked up. Still valid?"
  ↓
Claude: "Yes, setup still valid. FVG holding..."
  ↓
Colin clicks embedded [Calculate Position]
  ↓
Navigates to /calculator (pre-filled)
  ↓
Reviews: Entry $138.50, Stop $136.50, Target $145
  ↓
Position size: 250 SOL ($34,625 @ 10x)
  ↓
R:R: 3.4:1 ✅
  ↓
Liq price: $124.65 (safe ✅)
  ↓
Colin: "Looks good"
  ↓
Opens Drift UI (separate tab)
  ↓
Places limit order: 250 SOL @ $138.50
  ↓
Comes back to app → Clicks [Log Trade]
  ↓
Modal opens (pre-filled from calculator)
  ↓
Adds reasoning: "Entered on FVG retest, waited for volume"
  ↓
Emotional note: "Felt FOMO earlier but held discipline"
  ↓
Clicks [Save]
  ↓
Trade #47 logged, appears in /log
  ↓
Colin closes app, monitors Drift UI for fills
```

### Journey 2: Post-Trade Evaluation

```
[2 days later]

Colin's trade hits target ($145)
  ↓
Exits on Drift UI
  ↓
Opens Trade Level Up app
  ↓
Goes to /log
  ↓
Sees Trade #47: +6.3% ✅
  ↓
Clicks on row → Detail modal opens
  ↓
Reviews: Entry, exit, hold time (2d 1h 45m)
  ↓
Sees his notes: "Wanted to exit at $143 (BTC dip fear)"
  ↓
Clicks [Evaluate with Claude]
  ↓
Claude: "Analyzing trade #47..." [Streaming]
  ↓
Claude: "WHAT WENT RIGHT: Discipline, FVG held..."
  ↓
Claude: "WHAT COULD BE BETTER: $143 exit temptation..."
  ↓
Claude: "Check SOL/BTC ratio before panic..."
  ↓
Claude: "LEARNING: FVG + OI divergence = your edge (5/5 wins)"
  ↓
Colin reads evaluation
  ↓
Clicks [Continue Discussion]
  ↓
Navigates to /chat (trade context loaded)
  ↓
Colin: "How do I check SOL/BTC ratio next time?"
  ↓
Claude: "You can use TradingView chart SOLBTC..."
  ↓
Colin: "Got it. Add this to my checklist."
  ↓
Claude: "Noted. I'll remind you when BTC volatility occurs."
  ↓
Colin closes app, feels more confident about his process
```

---

## 11. Non-Functional Requirements

🎯 **Doel:** Performance, security, en UX vereisten.

### Performance:
- **Page Load:** <2s (first contentful paint)
- **Claude Response:** <5s (time to first token)
- **API Calls:** <500ms (Drift/Coinglass data fetch)
- **Database Queries:** <100ms (SQLite local reads)

### Security:
- **API Keys:** Stored in environment variables (never in code)
- **Claude API:** Rate limiting (max 100 requests/hour per user)
- **Input Validation:** All user inputs sanitized (XSS prevention)
- **Database:** Parameterized queries (SQL injection prevention)

### Reliability:
- **Error Handling:** Graceful degradation (show cached data if API fails)
- **Retry Logic:** 3 retries for transient API failures
- **Logging:** Winston logger for debugging (errors logged to file)

### User Experience:
- **Loading States:** Skeleton loaders (no blank screens)
- **Error Messages:** User-friendly (niet "Error 500", maar "Could not fetch data. Retry?")
- **Confirmations:** Destructive actions (delete trade) require confirmation modal
- **Keyboard Shortcuts:** Enter to send (chat), Esc to close modals

### Accessibility:
- **Contrast:** WCAG AA compliant (4.5:1 minimum)
- **Keyboard Navigation:** All interactive elements accessible via Tab
- **Screen Reader:** ARIA labels on complex components

---

## 12. Development Phases

🎯 **Doel:** Prioritering van features over tijd.

### Phase 1: MVP (Week 1-5)

**Week 1-2: Backend Setup**
- [ ] Next.js project init (App Router + TypeScript)
- [ ] SQLite database setup + schema
- [ ] Drift API integration (fetch price, OI, funding)
- [ ] Coinglass API integration (liquidations)
- [ ] Claude API integration (basic chat)

**Week 3: Core Features**
- [ ] Chat interface (multi-turn conversation)
- [ ] Claude function calling (fetch_drift_data, calculate_confluence)
- [ ] Position calculator (risk-based sizing)
- [ ] Trade logging (CRUD operations)

**Week 4: UI Polish**
- [ ] Dashboard (quick scan + recent activity)
- [ ] Trade log table + filters
- [ ] Detail modal (trade breakdown)
- [ ] Responsive design (mobile friendly)

**Week 5: Integration**
- [ ] End-to-end flows (setup → calculate → log → evaluate)
- [ ] Error handling + loading states
- [ ] Testing (basic E2E with Playwright)

**Success Criteria:**
- ✅ Can chat with Claude about setups
- ✅ Can calculate position sizes
- ✅ Can log trades with reasoning
- ✅ Can evaluate past trades

---

### Phase 2: Enhancement (Week 6-8)

**Week 6: Learning Loop**
- [ ] Post-trade evaluation (Claude analyzes outcomes)
- [ ] Learnings extraction (pattern identification)
- [ ] Win rate by confluence level (stats)

**Week 7: Automation**
- [ ] Scheduled scans (2x/day via cron or Vercel Cron)
- [ ] Telegram alerts (new setups found)
- [ ] Email notifications (optional)

**Week 8: Visualization**
- [ ] Equity curve chart (simple line chart)
- [ ] Win rate breakdown (by asset, confluence)
- [ ] Strategy performance dashboard

**Success Criteria:**
- ✅ Claude identifies patterns in your trading
- ✅ Automated setup scanning works
- ✅ You can see your progress visually

---

### Phase 3: Wallet Integration & Advanced Features (Month 3-4)

**Week 9-10: Solana Wallet Integration**

**Goal:** Automate trade entry/exit logging by reading Drift transactions from connected Phantom wallet.

**Features:**
- [ ] **Wallet Connect:** Integrate @solana/wallet-adapter-react (Phantom, Solflare support)
- [ ] **Transaction Parser:** Read Drift program transactions from wallet history
- [ ] **Import Flow:** "Import from Drift" button → backfills last 30 days
- [ ] **Auto-fill Trade Data:** Extract entry/exit/PnL from onchain data
- [ ] **Manual Reasoning:** User still adds reasoning + emotional notes (critical for learning)

**User Flow:**
```
User clicks [Connect Wallet] in Settings
  ↓
Phantom popup → Approve connection
  ↓
App reads wallet address
  ↓
User clicks [Import from Drift] in Trade Log
  ↓
App queries Solana RPC (via Helius API)
  ↓
Fetches last 30 days Drift transactions
  ↓
Parses: Entry/exit prices, timestamps, P&L
  ↓
Shows preview table: 15 trades found
  ↓
User reviews → Clicks [Import Selected]
  ↓
For each trade: Modal opens
  ↓
Pre-filled: Entry, exit, P&L (from blockchain)
Empty: Reasoning, emotional notes (user fills)
  ↓
User adds context: "This was the FVG setup..."
  ↓
Clicks [Save] → Trade logged with full context
```

**Technical Implementation:**

1. **Wallet Adapter:**
```typescript
// lib/wallet/config.ts
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';

export const wallets = [new PhantomWalletAdapter()];
```

2. **Transaction Fetching:**
```typescript
// lib/drift/transaction-parser.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { DRIFT_PROGRAM_ID } from './constants';

async function fetchDriftTransactions(
  walletAddress: string,
  startDate: Date
): Promise<DriftTransaction[]> {
  const connection = new Connection(HELIUS_RPC_URL);
  const pubkey = new PublicKey(walletAddress);

  // Fetch signatures (last 1000 max per call)
  const signatures = await connection.getSignaturesForAddress(
    pubkey,
    { until: startDate.toISOString() }
  );

  // Filter for Drift program interactions
  const driftSigs = signatures.filter(sig =>
    // Check if tx interacted with Drift program
  );

  // Parse each transaction
  const trades = [];
  for (const sig of driftSigs) {
    const tx = await connection.getParsedTransaction(sig.signature);
    const parsed = parseDriftTransaction(tx);
    if (parsed) trades.push(parsed);
  }

  return trades;
}
```

3. **Transaction Parser (Complex):**
```typescript
// Drift transactions zijn Anchor program calls
// Je moet instructie data decoden om entry/exit te bepalen
// Dit is niet trivial - Drift SDK heeft helpers

function parseDriftTransaction(tx: ParsedTransaction): Trade | null {
  // Check instruction type (PlacePerpOrder, ClosePerpPosition, etc.)
  // Extract: market (SOL-PERP/BTC-PERP), side (long/short), price, size
  // Match entries with exits (heuristic: same market, opposite direction)
  // Calculate P&L

  // Simplified:
  return {
    asset: 'SOL-PERP',
    entry_price: extractEntryPrice(tx),
    entry_timestamp: tx.blockTime,
    exit_price: extractExitPrice(tx), // if close tx
    exit_timestamp: tx.blockTime,
    pnl_usd: calculatePnL(tx),
    // Reasoning/emotional = null (user moet invullen)
  };
}
```

**Benefits:**
- ✅ Eliminates manual entry/exit/PnL data entry
- ✅ 100% accurate data (from blockchain, no typos)
- ✅ Can backfill historical trades (up to ~1000 transactions)

**Limitations:**
- ⚠️ Complex parsing logic (Drift program decoding)
- ⚠️ RPC rate limits (Helius free tier: 100k credits/month)
- ⚠️ User still must add reasoning (so not fully automated)
- ⚠️ Only works for Drift trades (not CEX or other DEXs)

**User Story:**
| ID | Als... | Wil ik... | Zodat... | Prioriteit |
|----|--------|-----------|----------|------------|
| US-16 | Trader | Mijn Phantom wallet connecten | Ik mijn Drift trade history kan importeren | Middel |
| US-17 | Trader | Automatisch entry/exit/P&L ophalen | Ik geen data entry fouten maak | Middel |
| US-18 | Trader | Historical trades backfillen | Ik mijn volledige trading historie in 1 plek heb | Laag |

**Alternative (Simpler MVP):**
If parsing is too complex, start with **manual logging only** in Phase 1-2, add wallet integration in Phase 3 when proven valuable.

---

### Phase 4: Advanced Features (Month 5+)

**Later Features:**
- [ ] Strategy config editor (YAML in UI)
- [ ] Backtest engine (test strategy on historical data)
- [ ] Multi-strategy support (mean reversion + trend following)
- [ ] Community features (optional: share anonymized performance)

---

## 13. Bijlagen & Referenties

🎯 **Doel:** Linken naar overige documenten.

### Gerelateerde Documenten:
- **PRD v2.0** - Product Requirements Document (waarom, wat, success criteria)
- **TO (TODO)** - Technisch Ontwerp (code architectuur, API specs, deployment)
- **Bouwplan (TODO)** - Sprint planning, development milestones

### External Resources:
- **Drift Protocol Docs:** https://docs.drift.trade/
- **Claude API Docs:** https://docs.anthropic.com/
- **Next.js Docs:** https://nextjs.org/docs
- **shadcn/ui:** https://ui.shadcn.com/
- **Coinglass API:** https://www.coinglass.com/api

### Code Repository Structure (Placeholder):
```
trade-level-up/
├── docs/
│   ├── PRD_AI_Trading_Bot_v2.0.md
│   ├── FO_AI_Trading_Bot_v2.0.md (this document)
│   └── conversation_summary.markdown
├── app/                      # Next.js app (to be created)
├── components/               # React components
├── lib/                      # Utilities, services
└── README.md
```

---

**Einde Functioneel Ontwerp v2.0**

*Dit document dient als blauwdruk voor de ontwikkeling van de frontend en user flows. Voor backend implementatie details, zie het Technisch Ontwerp (TO).*
