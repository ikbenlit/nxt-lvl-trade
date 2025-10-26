# 📄 Product Requirements Document (PRD) – AI Trading Decision Support Bot

**Projectnaam:** AI Trading Decision Support Bot
**Versie:** v2.0
**Datum:** 26-10-2025
**Auteur:** Colin

---

## 1. Doelstelling

🎯 **Doel van deze sectie:** Beschrijf waarom dit product of prototype wordt gebouwd en wat het beoogde resultaat is.
📘 **Toelichting:** Geef een korte samenvatting van het *waarom* van dit project. Wat wil je aantonen, oplossen of verbeteren? Benoem ook of het om een demo, MVP of productieversie gaat.

### Beschrijving

Dit project ontwikkelt een **AI-gedreven trading decision support systeem** voor persoonlijk gebruik bij het handelen in cryptocurrency perpetual futures (SOL-PERP en BTC-PERP) op Drift Protocol (Solana). Het doel is **niet** een volledig autonome trading bot, maar een **intelligente sparring partner** die helpt bij het identificeren van high-quality swing trading setups en het reduceren van emotionele biases.

### Primaire Doelen

1. **Betere besluitvorming:** Objectieve analyse van setups op basis van meerdere confluente factoren (price action, Open Interest, liquidation levels, Fair Value Gaps, Order Blocks)
2. **Bias-reductie:** Bot helpt emotionele beslissingen (FOMO, revenge trading) te voorkomen; gebruiker helpt bot's overfitting te corrigeren
3. **Wederzijds leren:** Iteratieve verbetering van strategie op basis van trade outcomes en gebruikersfeedback
4. **Tijdsbesparing:** 2-3 scans per dag identificeren setups, gebruiker hoeft niet continu charts te monitoren
5. **Risk management:** Consistent position sizing op basis van portfolio risk (1% per trade), minimum R:R vereisten (1:1.5 of hoger)

### Type Product

**MVP (Minimum Viable Product)** voor persoonlijk gebruik, met focus op:
- Swing trading (3-7 dagen hold periods)
- 3-5 quality setups per week (niet 20+ dagelijkse signalen)
- Manual execution in fase 1, semi-autonome execution in fase 2
- Testnet validatie voordat mainnet gebruik

---

## 2. Doelgroep

🎯 **Doel:** Schets wie de eindgebruikers, stakeholders en testers zijn.
📘 **Toelichting:** Omschrijf de primaire doelgroepen en hun belangrijkste behoeften of problemen.

### Primaire Gebruiker

**Colin (individuele crypto trader)**
- **Profiel:** Tech-savvy retail trader met ervaring in cryptocurrency trading en DeFi
- **Huidige situatie:**
  - Capital reeds op Solana (praktische reden voor Drift Protocol keuze)
  - Solana wallet setup compleet (Phantom/Solflare)
  - Vertrouwd met perpetual futures en leverage trading
  - Heeft basiskennis van technical analysis en onchain metrics
- **Behoeften:**
  - Objectieve setup identificatie zonder emotionele bias
  - Tijdsbesparing (geen fulltime chart-watching)
  - Structured learning van trade outcomes
  - Risicomanagement discipline (consistent position sizing)
- **Pain Points:**
  - Mist setups door niet 24/7 te kunnen monitoren
  - Emotionele trading decisions (FOMO, fear bij drawdowns)
  - Inconsistent position sizing leidt tot onnodige verliezen
  - Moeilijk om objectief eigen trades te analyseren

### Secundaire Stakeholders

**Toekomstige gebruikers (post-MVP):**
- Andere retail swing traders met Solana exposure
- Crypto traders die decision support zoeken (geen volautomatisering)

**Niet de doelgroep:**
- Institutionele traders (andere requirements)
- High-frequency traders (andere timeframes)
- Spot-only traders (geen perps)

---

## 3. Kernfunctionaliteiten (MVP-scope)

🎯 **Doel:** Afbakenen van de minimale werkende functies.
📘 **Toelichting:** Maak een genummerde lijst van functies die in deze versie moeten werken.

### 3.1 Hybrid Strategy Engine

**Base Criteria Filters (Layer 1):**
- **OHLCV Pattern Detection:** Identificatie van candlestick patterns (hammers, engulfing), price structure (higher lows, range compression)
- **Open Interest Dynamics:** OI divergence detection (price down + OI up = capitulation setups), OI percentile tracking
- **Liquidation Analysis:** Clustering van liquidation levels, squeeze/cascade potential identificatie
- **Fair Value Gap Detection:** Identificatie van unfilled FVGs, tracking van gap fill status
- **Order Block Identification:** Detection van institutional demand/supply zones
- **Liquidity Validation:** Orderbook depth checks (min $50k binnen 0.2% spread), spread monitoring

**Claude Confluence Evaluation (Layer 2):**
- Multi-concept alignment scoring (welke factoren conflueren?)
- Conflict identification (bijv. liquidation risk near stop)
- Macro context integration (BTC trend, SPX correlation, news events)
- Entry/stop/target optimization op basis van alle factoren
- Conviction rating: LOW/MEDIUM/HIGH
- Minimum confluence threshold: 4+ factoren voor signaal

### 3.2 Risk-Based Position Sizing

**Portfolio Risk Management:**
- **Fixed percentage risk per trade:** Default 1% van total portfolio value
- **Position size calculation:**
  ```
  Position Size = (Portfolio Value × Risk %) / (Entry Price - Stop Loss Price)
  ```
- **Dynamic adjustment:** Rekening houden met leverage (max 10x op Drift)
- **Maximum position limits:**
  - Absolute: $5k per position (SOL-PERP), $8k (BTC-PERP)
  - Percentage: Max 20% van portfolio per position
  - Volume-based: Max 1% van 24h Drift volume voor asset

**Risk/Reward Filters:**
- **Minimum R:R ratio:** 1:1.5 (bij voorkeur 1:2 of hoger)
- **Setup rejection:** Als R:R niet voldoet, wordt setup niet gesignaleerd
- **Multi-target system:**
  - T1: Partial profit (40-50% position close)
  - T2: Majority close (30-40%)
  - T3: Runner met trailing stop (10-20%)

### 3.3 Data Ingestion Pipeline

**Primary Sources (Drift Protocol):**
- Drift Protocol REST API (gratis, geen key nodig)
- OHLCV candles (4h, daily, weekly timeframes)
- Funding rates (8h settlements)
- Open Interest data (real-time + historical)
- Orderbook snapshots (depth analysis)

**Supplementary Sources:**
- **Helius API:** Solana RPC + enhanced data (free tier: 100k credits/month)
- **Birdeye API:** Solana DEX volumes, token flows (free tier)
- **CryptoCompare:** Historical validation, cross-check prices (free tier: 250k calls/month)
- **CoinGecko:** Backup price data, market cap metrics (free tier)
- **Coinglass:** Liquidation heatmaps, aggregated funding rates (free tier: 100 calls/day)
- **Yahoo Finance:** Macro data (SPX, DXY) via yfinance library (gratis)

**Data Refresh Schedule:**
- **2x per dag scans:** 08:00 UTC en 20:00 UTC (morning + evening)
- **On-demand queries:** User kan manual scan triggeren ("Check SOL setup now")
- **Position monitoring:** Elk uur check van open positions voor target/stop proximity

### 3.4 Strategy Configuration System

**YAML-based Strategy Definition:**
- Declarative config files (version controlled via Git)
- User-editable criteria zonder code wijzigingen
- Support voor meerdere strategies parallel (portfolio allocation)

**Natural Language Interface:**
- User beschrijft strategie in plain text
- Claude vertaalt naar executable config
- Backtest capability voor validatie

**Strategy Versioning:**
- Git-tracked changes (v1.0 → v1.1 → v2.0)
- Changelog documentation bij elke update
- A/B testing support (run meerdere versions, compare)

### 3.5 Trade Logging & Analysis

**Trade Capture:**
- **Bot data:** Asset, direction, entry, stop, targets, confluence score, Claude confidence
- **User data:** User's reasoning (waarom wel/niet genomen), manual overrides
- **Outcome data:** Entry fill price, exit(s), P&L, hold duration
- **Context data:** Market conditions, BTC correlation, funding at entry/exit

**Storage:**
- SQLite database (lokale opslag, geen cloud)
- Schema: `trades`, `setups_rejected`, `positions_active`, `strategy_versions`
- CSV export capability voor Jupyter analysis
- Weekly automated backups

**Learning Loop:**
- Weekly review cycle: Claude analyzeert outcomes
- Pattern identification: "Wat werkte? Wat niet?"
- Strategy improvement suggestions met rationale
- User approves/modifies/rejects updates

### 3.6 Monitoring Dashboard (Streamlit)

**Tab 1: Active Setups**
- Real-time confluence scores per asset
- "Hot" criteria (close to triggering)
- Pending limit orders status
- Watchlist (setups in WAIT status)

**Tab 2: Open Positions**
- Current P&L (unrealized)
- Distance to targets/stops
- Claude's position management suggestions
- Risk exposure (% of portfolio)

**Tab 3: Trade History**
- Filterable log (won/lost, by asset, by strategy version)
- Performance metrics (win rate, avg R:R, Sharpe ratio)
- Equity curve visualization

**Tab 4: Strategy Builder**
- Natural language strategy input
- Generated config preview
- Backtest interface
- Version comparison

**Tab 5: Learning Insights**
- Claude's weekly analysis
- Suggested improvements
- Strategy evolution timeline (v1.0 → v1.x)

### 3.7 Execution Module (Phase 2 Feature)

**Semi-Autonomous Execution:**
- User pre-approves strategy → Bot places limit orders automatically
- Limit order logic (patient fills, 0.2% from mid-price)
- 1-hour fill timeout → Re-evaluate setup if not filled
- Stop-limit orders (niet market orders om slippage te voorkomen)

**Safety Mechanisms:**
- Solana network health check before execution
- Drift TVL monitoring (pause if >10% drop)
- Orderbook validation before every order
- Max concurrent positions enforced (2 in MVP)

**Notifications:**
- Telegram alerts voor fills, target hits, stop triggers
- Email backup voor kritieke events
- In-dashboard notification center

### 3.8 Health Monitoring

**Solana Network Status:**
- Slot progression monitoring (chain health)
- Validator status checks via status.solana.com API
- Automatic pause bij network degradation

**Drift Protocol Health:**
- TVL tracking (alert bij sudden drops)
- Volume monitoring (detect liquiditeit issues)
- Funding rate anomaly detection

**Data Quality Checks:**
- Cross-validation tussen sources (Drift vs CryptoCompare)
- Gap detection in historical data
- API availability monitoring

---

## 4. Gebruikersflows (Demo- of MVP-flows)

🎯 **Doel:** Laten zien hoe de gebruiker stap-voor-stap door het systeem gaat.
📘 **Toelichting:** Beschrijf 2–4 concrete "flows" in stappen (input → actie → resultaat).

### Flow 1: Scheduled Setup Identification (Passive Mode)

1. **08:00 UTC Scheduled Scan**
   - Bot fetcht data voor SOL-PERP en BTC-PERP (candles, OI, funding, orderbook)
   - Computes technical indicators (RSI, MACD, FVGs, Order Blocks)
   - Applies base criteria filters → Identifies 3 candidate setups

2. **Claude Evaluatie**
   - Voor elk candidate: Claude analyzeert confluence, checks macro context
   - SOL-PERP: 6/6 confluence, HIGH conviction → APPROVED
   - BTC-PERP: 4/6 confluence, maar SPX down -2% → WAIT
   - ETH-PERP: 3/6 confluence → REJECTED (below threshold)

3. **User Notification**
   - Telegram alert: "SOL-PERP long setup identified (HIGH conviction)"
   - Details: Entry $138.50, Stop $136.50 (-1.4%), Targets $145/$148.50/$150
   - Confluence: FVG + Order Block + OI divergence + Liq magnet + Hammer candle + Negative funding
   - Position size (1% risk): 145 SOL (~$20k notional at 10x leverage)

4. **User Review in Dashboard**
   - Opens Streamlit → Views full analysis
   - Asks Claude: "Why now? Could we get better entry?"
   - Claude: "FVG retest ongoing, entry is optimal. Waiting risks missing move."

5. **User Decision**
   - **Option A:** Approves → Places limit order manually (or bot does in Phase 2)
   - **Option B:** Modifies → "Wait for $137.50 dip" → Bot updates watchlist
   - **Option C:** Rejects → Logs reason: "BTC looks weak, want confirmation first"

### Flow 2: On-Demand Manual Query

1. **User Trigger**
   - Colin sees SOL pumping, wonders if setup
   - Types in dashboard: "Check SOL-PERP setup right now"

2. **Immediate Analysis**
   - Bot fetches real-time data
   - Runs base filters + Claude evaluation
   - Response in <10 seconds

3. **Claude Response**
   - "WAIT - No high-conviction setup yet"
   - "Price at $142 is between FVGs (no structure)"
   - "Momentum is strong but wait for retest of $139 support or breakout above $144"
   - "Current R:R is only 1:1.2 (below minimum 1:1.5)"

4. **User Action**
   - Accepts advice → Sets alert for $139 or $144
   - Avoids FOMO trade

### Flow 3: Weekly Strategy Review & Improvement

1. **User Initiates Review (Zondag avond)**
   - Opens "Trade History" tab
   - Last week: 3 trades (2 wins SOL, 1 loss BTC)
   - Clicks "Analyze Performance" button

2. **Claude Analysis**
   - "SOL-PERP: 2/2 wins (100%), avg R:R 2.3:1 → Strategy working well"
   - "BTC-PERP: 0/1 wins (0%) → Loss during SPX selloff"
   - "Pattern: BTC setups fail when SPX down >2%"
   - "Suggestion: Add SPX filter for BTC (skip if SPX < -2% daily)"

3. **Strategy Update Proposal**
   - Claude shows proposed YAML changes
   - User modifies: "Make threshold -1.5% instead of -2%"
   - Clicks "Backtest V1.1" → Shows improvement in historical data

4. **Deployment**
   - User approves → Strategy updates to v1.1
   - Git commit created with changelog
   - Bot starts using new criteria from next scan

### Flow 4: Position Management (Open Trade)

1. **Trade Entry (Day 1)**
   - SOL-PERP long entered at $138.50
   - Stop at $136.50, Targets: T1 $145, T2 $148.50, T3 $150+

2. **Daily Check-ins**
   - **Day 2:** Price at $141 → Claude: "Hold, trending toward T1"
   - **Day 3:** Price at $144 → Claude: "Close to T1, consider taking profit on 40%"
   - User sets limit sell for 40% at $145

3. **T1 Hit (Day 4)**
   - $145 reached → 40% closed at +4.7%
   - Claude: "Strong momentum, T2 likely. Consider moving stop to breakeven."
   - User moves stop to $139 (locks in profit)

4. **T2 Hit (Day 5)**
   - $148.50 reached → 40% closed at +7.2%
   - 20% runner remains with trailing stop at $145

5. **Exit & Logging**
   - Final close at $149 (+7.6% on runner)
   - Bot logs full trade: avg exit +6.2%, hold 5 days
   - User adds note: "Execution was patient, paid off. FVG confluence was key."

---

## 5. Niet in Scope

🎯 **Doel:** Duidelijk maken wat (nog) niet wordt gebouwd.
📘 **Toelichting:** Noem features of modules die bewust buiten deze versie vallen.

### MVP Exclusions

**Trading Scope:**
- ❌ Volautomatische execution zonder user approval (Phase 2 feature)
- ❌ Multiple platforms (Hyperliquid, dYdX, CEX'es) - alleen Drift in MVP
- ❌ Altcoins beyond BTC/SOL (JUP-PERP, BONK-PERP, WIF-PERP) - Phase 3
- ❌ Spot trading (alleen perpetuals)
- ❌ Options, structured products

**Technical Features:**
- ❌ Real-time WebSocket streaming (REST API is voldoende voor swing trading)
- ❌ Mobile app (alleen desktop Streamlit)
- ❌ Cloud deployment (lokaal draaien is voldoende)
- ❌ Multi-user support, authentication
- ❌ Advanced backtesting engine (basic only in MVP)

**AI Features:**
- ❌ Fine-tuning van Claude models (gebruikt standard API)
- ❌ Reinforcement Learning voor autonomous improvement
- ❌ Multi-agent architectures (single Claude instance in MVP)
- ❌ Computer vision voor chart pattern recognition

**Integration:**
- ❌ Koppelingen met portfolio trackers (Delta, CoinStats)
- ❌ Tax reporting automation
- ❌ Social trading features (delen van setups)
- ❌ Discord/Twitter bots voor signals

### Post-MVP Roadmap Items

**Phase 2 (Month 3-4):**
- Semi-autonomous execution met pre-approval workflow
- Enhanced backtesting met walk-forward optimization
- Telegram bot voor mobile notifications

**Phase 3 (Month 5-6):**
- Altcoin support (JUP, BONK, WIF) met strikte liquiditeit filters
- Multi-strategy portfolio management
- Advanced learning loop met strategy A/B testing

**Phase 4 (Q2 2026):**
- Hyperliquid integration voor betere liquiditeit majors (BTC/ETH)
- Cross-platform arbitrage detection
- Mobile dashboard (React Native of PWA)

**Long-term (Q3-Q4 2026):**
- Reinforcement Learning layer voor autonomous strategy evolution
- Multi-timeframe strategy combinations (4h + daily confluence)
- Community features (optioneel delen van anonymized performance)

---

## 6. Succescriteria

🎯 **Doel:** Objectieve meetlat voor een geslaagde oplevering.
📘 **Toelichting:** Formuleer concrete, toetsbare criteria.

### MVP Success Metrics (3 maanden evaluatie)

**Setup Quality:**
- ✅ Bot identificeert 3-5 high-quality setups per week (niet te veel ruis)
- ✅ Minimum 4/6 confluence voor elk gesignaleerd setup
- ✅ 80%+ van gesignaleerde setups hebben R:R ≥1:1.5
- ✅ <5% false signals (setups die binnen 4h invalideren)

**Execution Quality:**
- ✅ Limit orders filled binnen 0.5% van signal price (goede fills)
- ✅ Zero failed exits due to liquiditeit issues
- ✅ Orderbook depth validatie voorkomt illiquide setups (100% success rate)
- ✅ Solana network health checks voorkomen trades tijdens outages

**Trading Performance:**
- ✅ Win rate >50% over 3 maanden (minimum 15 trades sample)
- ✅ Average R:R >1.5:1 op closed trades
- ✅ Maximum drawdown <15% van portfolio
- ✅ Sharpe ratio >0.5 (risk-adjusted returns positief)

**User Engagement:**
- ✅ User neemt ≥80% van bot's HIGH conviction signals
- ✅ User logs reasoning voor ≥90% van trades (learning data)
- ✅ Weekly review cycle wordt uitgevoerd (strategy iteration)
- ✅ User rapporteert tijdsbesparing van ≥50% vs manual chart watching

**System Reliability:**
- ✅ Scheduled scans completion rate >95% (uptime)
- ✅ Data pipeline errors <1% (API failures gracefully handled)
- ✅ Dashboard load time <3 seconds
- ✅ Zero data loss (SQLite backups functional)

**Learning & Improvement:**
- ✅ Strategy evolves through ≥2 versions in 3 months (v1.0 → v1.2+)
- ✅ Measurable performance improvement between versions (≥10% ROI increase)
- ✅ User can articulate what strategy does differently (transparency)

### Red Flags (Abort/Pivot Criteria)

**Performance Red Flags:**
- ⛔ Win rate <40% after 20+ trades → Strategy fundamentally broken
- ⛔ Average R:R <1:1 → Risk management failing
- ⛔ >3 consecutive losses due to same issue → Systematic flaw

**Technical Red Flags:**
- ⛔ Liquiditeit issues cause >2 failed exits → Drift not viable, switch platforms
- ⛔ Solana downtime impacts >10% van trades → Consider alternatives
- ⛔ Data quality issues persist (>5% bad data) → Source reliability problem

**Usage Red Flags:**
- ⛔ User ignores >50% van signals → Bot not adding value
- ⛔ User stops logging reasoning → Learning loop broken
- ⛔ User reverts to 100% manual trading → Decision support failing

---

## 7. Risico's & Mitigatie

🎯 **Doel:** Risico's vroeg signaleren en plannen hoe ermee om te gaan.
📘 **Toelichting:** Beschrijf de belangrijkste risico's en hoe je ze voorkomt of opvangt.

### Financiële Risico's

| Risico | Impact | Waarschijnlijkheid | Mitigatie |
|--------|--------|-------------------|-----------|
| **Capital loss door slechte trades** | Hoog | Middel | - Start met testnet (Solana devnet)<br>- Conservative position sizing (1% risk/trade)<br>- Max drawdown limit (pause bij -15%)<br>- Stop-loss discipline (altijd plaatsen) |
| **Overleveraging op Drift (max 10x)** | Hoog | Laag | - Software limit op 5x leverage (conservatiever)<br>- Position size caps ($5k SOL, $8k BTC)<br>- Real-time margin monitoring |
| **Liquidatie door Solana volatility** | Middel | Middel | - Stops ver genoeg van entry (min 2%)<br>- Avoid liquidation cascade zones<br>- Monitor funding rate spikes (close bij extreme) |
| **Slippage bij illiquide periods** | Laag | Middel | - Orderbook depth validator (min $50k)<br>- Limit orders only (geen market orders)<br>- Skip setups tijdens Asia low-liquidity hours |

### Platform & Technical Risico's

| Risico | Impact | Waarschijnlijkheid | Mitigatie |
|--------|--------|-------------------|-----------|
| **Solana network outage tijdens trade** | Hoog | Laag | - Network health monitoring (pause bij issues)<br>- Emergency exit plan (CEX backup account)<br>- Don't hold positions tijdens known upgrades |
| **Drift Protocol smart contract bug** | Zeer Hoog | Zeer Laag | - Use audited v2 protocol only<br>- Monitor Drift TVL (exit bij >10% drop)<br>- Diversify later naar Hyperliquid (Phase 4) |
| **API rate limiting (Claude/Drift)** | Laag | Middel | - Caching van historical data<br>- Async calls, request pooling<br>- Fallback naar less frequent scans |
| **Data quality issues** | Middel | Laag | - Cross-validation tussen sources<br>- Anomaly detection (price spikes, gaps)<br>- Manual override capability |

### AI & Strategy Risico's

| Risico | Impact | Waarschijnlijkheid | Mitigatie |
|--------|--------|-------------------|-----------|
| **Strategy overfitting (works in backtest, fails live)** | Hoog | Hoog | - Walk-forward validation<br>- Out-of-sample testing<br>- Conservative criteria (min 4/6 confluence)<br>- Cross-timeframe validation |
| **Claude hallucination/bad advice** | Middel | Laag | - User is final decision maker (not blindly follow)<br>- Base criteria filters (hard constraints)<br>- Log all reasoning for audit |
| **Bias amplification** | Middel | Middel | - Diversify signals (OHLCV + OI + Liquidations + FVG + OB)<br>- User override logging teaches bot<br>- Periodic strategy resets (prevent drift) |
| **Market regime change (strategy stops working)** | Hoog | Middel | - Monthly performance review<br>- Multiple strategies (mean reversion + trend)<br>- Macro filters (pause tijdens black swans) |

### Operational Risico's

| Risico | Impact | Waarschijnlijkheid | Mitigatie |
|--------|--------|-------------------|-----------|
| **User forgets to monitor (over-reliance on bot)** | Middel | Middel | - Daily email summary (forced check-in)<br>- Alerts voor critical events<br>- Weekly review mandatory |
| **SQLite database corruption** | Laag | Laag | - Daily automated backups<br>- CSV exports as fallback<br>- Git-tracked strategy configs |
| **Laptop downtime (bot offline)** | Laag | Middel | - Cloud VPS deployment in Phase 2<br>- Mobile alerts work independently<br>- Positions manageable via Drift UI |
| **Security (wallet key exposure)** | Zeer Hoog | Zeer Laag | - Wallet keys never in code/logs<br>- Use Phantom/Solflare extension (not raw keys)<br>- Consider hardware wallet for larger capital |

### Risk Monitoring Dashboard

**Daily Checks:**
- Current drawdown vs max allowed
- Open position exposure (% of portfolio)
- Solana network status
- Drift TVL trend

**Weekly Review:**
- Strategy performance vs benchmarks
- Risk-adjusted returns (Sharpe ratio)
- Consecutive loss streaks
- Position sizing consistency

**Monthly Deep Dive:**
- Strategy version performance comparison
- Market regime analysis (trending vs ranging)
- Correlation breakdown (SOL vs BTC)
- Capital allocation optimization

---

## 8. Roadmap / Vervolg (Post-MVP)

🎯 **Doel:** Richting geven aan toekomstige uitbreidingen.
📘 **Toelichting:** Beschrijf logische vervolgstappen na de MVP.

### Phase 1: MVP Development (Month 1-2)

**Focus:** Core functionality + manual execution

**Deliverables:**
- ✅ Hybrid strategy engine (base filters + Claude)
- ✅ Data ingestion pipeline (Drift + supplementary sources)
- ✅ YAML-based strategy config (v1.0)
- ✅ SQLite trade logging
- ✅ Streamlit dashboard (basic)
- ✅ Risk-based position sizing calculator
- ✅ Testnet validation (Solana devnet)

**Success Gate:**
- 10+ setups identified in testnet
- User takes 5+ paper trades
- Zero technical blockers
- Strategy config iterations working (v1.0 → v1.1)

---

### Phase 2: Semi-Automation (Month 3-4)

**Focus:** Execution automation + learning loop

**New Features:**
- 🆕 drift-py integration (automated limit orders)
- 🆕 Pre-approval workflow (user whitelists strategy)
- 🆕 Position monitoring (hourly checks, target/stop alerts)
- 🆕 Telegram bot (mobile notifications)
- 🆕 Enhanced backtesting (walk-forward optimization)
- 🆕 Trade review system (Claude analyzes outcomes weekly)

**Enhancements:**
- 📈 Dashboard: Real-time P&L tracking
- 📈 Strategy builder: Improved natural language interface
- 📈 Logging: User reasoning prompts, sentiment tracking

**Success Gate:**
- 50% van setups autonomous executed (with pre-approval)
- Win rate >50%, avg R:R >1.5:1
- User actively using learning loop (weekly reviews)
- Strategy evolves to v1.3+

---

### Phase 3: Expansion (Month 5-6)

**Focus:** Multi-strategy + altcoins

**New Features:**
- 🆕 Altcoin support (JUP-PERP, BONK-PERP, WIF-PERP)
  - Strict liquidity filters (min $5M volume)
  - Solana ecosystem correlation analysis
- 🆕 Multi-strategy portfolio
  - Mean reversion strategy (current)
  - Trend following strategy (breakouts)
  - Allocation logic (40% / 40% / 20%)
- 🆕 Advanced backtesting
  - Monte Carlo simulation
  - Strategy comparison (v1.0 vs v1.3 vs v2.0)

**Enhancements:**
- 📈 Dashboard: Portfolio view (aggregate metrics)
- 📈 Risk management: Correlation-based position limits
- 📈 Claude: Portfolio rebalancing suggestions

**Success Gate:**
- 2-3 strategies running parallel
- Altcoin trades profitable (win rate >45%)
- Portfolio Sharpe ratio >0.8
- User satisfied with diversification

---

### Phase 4: Platform Expansion (Q2 2026)

**Focus:** Hyperliquid integration + cross-platform

**Rationale:**
- Drift liquiditeit kan limiting factor worden voor scaling
- Hyperliquid heeft betere liquidity voor BTC/ETH
- Cross-platform arbitrage opportunities

**New Features:**
- 🆕 Hyperliquid SDK integration
- 🆕 Platform selection logic (best execution routing)
- 🆕 Unified portfolio view (Drift + Hyperliquid)
- 🆕 Cross-platform position hedging

**Capital Allocation:**
- Majors (BTC/ETH): Hyperliquid (70%)
- SOL: Drift (20%)
- Solana altcoins: Drift (10%)

**Success Gate:**
- Smooth multi-platform operation
- No bridge friction (capital moves seamlessly)
- Improved fill quality vs Drift-only

---

### Phase 5: Intelligence Upgrade (Q3 2026)

**Focus:** Advanced AI capabilities

**New Features:**
- 🆕 Reinforcement Learning layer
  - Bot learns optimal entry timing autonomously
  - Dynamic stop/target adjustment
- 🆕 Multi-agent architecture
  - Agent 1: Technical analysis
  - Agent 2: Onchain analysis
  - Agent 3: Risk management
  - Coordinator agent: Consensus building
- 🆕 Sentiment analysis
  - Twitter/Reddit scraping
  - News impact prediction
- 🆕 Market regime detection
  - Trending vs ranging auto-detection
  - Strategy switching (mean reversion in ranges, trend following in trends)

**Research Areas:**
- Claude fine-tuning on trade logs (if Anthropic supports)
- Integration met other AI models (specialized technical analysis)

---

### Phase 6: Productization (Q4 2026 - Optional)

**Focus:** Prepare for potential commercialization

**Features:**
- 🆕 Multi-user support (authentication, isolation)
- 🆕 Cloud deployment (AWS/GCP)
- 🆕 Mobile app (React Native)
- 🆕 Subscription model ($29-99/month)
- 🆕 Community features
  - Anonymous performance leaderboard
  - Strategy marketplace (users share configs)
  - Educational content (how to use bot)

**Decision Point:**
- Evaluate after 6 months personal use
- Only pursue if:
  - Proven profitability (>20% annual ROI)
  - User demand from community
  - Willing to commit to support/maintenance

---

### Long-term Vision (2027+)

**Potential Directions:**
1. **Institutional Features:** API for hedge funds, white-label solution
2. **Multi-asset:** Equities, forex, commodities (via brokers like IBKR)
3. **DAO Governance:** Community-driven strategy development
4. **Open Source Core:** Release anonymized version, build community

**Exit Criteria (Abandon Project):**
- Consistently unprofitable after 12 months (despite iterations)
- Platform risk too high (Drift hacks, Solana stability issues)
- Regulatory crackdown on algo trading bots
- User finds it more burden than help (over-complexity)

---

## 9. Bijlagen & Referenties

🎯 **Doel:** Bronnen koppelen voor context en consistentie.
📘 **Toelichting:** Verwijs naar ondersteunende documenten of interne kennisbestanden.

### Gerelateerde Documenten

**Design & Specificaties:**
- 📄 **Functioneel Ontwerp (FO) v1.1** - Gedetailleerde module beschrijvingen, user stories, AI interactions
- 📄 **Technisch Ontwerp (TO)** - Architectuur, tech stack, API integraties (nog te maken)
- 📄 **Bouwplan** - Sprint planning, development milestones (nog te maken)

**Strategy Documentatie:**
- 📄 `strategy_config_v1.0.yaml` - Initiële strategie definitie
- 📄 `strategy_evolution_log.md` - Changelog van strategy versies
- 📄 `confluence_criteria_explained.md` - Deep dive in OHLCV/OI/FVG/OB/Liquidations

**Context & Research:**
- 📄 `conversation_summary.markdown` - Uitgebreide samenvatting van design gesprekken (Grok sessie)
- 📄 `drift_vs_hyperliquid_analysis.md` - Platform vergelijking, liquiditeit analyse
- 📄 `data_sources_overview.md` - API specs, rate limits, kosten per source

### Externe Resources

**Platform Documentatie:**
- 🔗 [Drift Protocol Docs](https://docs.drift.trade/) - API reference, SDK guides
- 🔗 [drift-py GitHub](https://github.com/drift-labs/drift-py) - Python SDK repository
- 🔗 [Solana Docs](https://docs.solana.com/) - Blockchain basics, RPC methods
- 🔗 [Helius API Docs](https://docs.helius.dev/) - Enhanced Solana RPC

**Data Providers:**
- 🔗 [Birdeye API](https://docs.birdeye.so/) - Solana DEX aggregator
- 🔗 [CryptoCompare API](https://min-api.cryptocompare.com/documentation) - Crypto market data
- 🔗 [Coinglass API](https://open-api.coinglass.com/docs/) - Liquidations, funding rates
- 🔗 [CoinGecko API](https://www.coingecko.com/en/api/documentation) - Price data, market cap

**AI & Tools:**
- 🔗 [Anthropic Claude API](https://docs.anthropic.com/) - Claude integration guide
- 🔗 [Streamlit Docs](https://docs.streamlit.io/) - Dashboard framework
- 🔗 [TA-Lib](https://ta-lib.org/) - Technical analysis library

**Trading Education:**
- 🔗 [Smart Money Concepts (SMC)](https://www.youtube.com/@TheICTTrader) - Order Blocks, FVGs, liquidity
- 🔗 [Coinglass University](https://www.coinglass.com/academy) - OI, funding, liquidations
- 🔗 [Drift Trading Guide](https://docs.drift.trade/trading-guide) - Perps best practices

### Key Contacts & Support

**Technical Support:**
- Drift Protocol Discord: [discord.gg/drift](https://discord.gg/drift)
- Solana Developer Discord: [solana.com/discord](https://solana.com/discord)
- Anthropic Support: support@anthropic.com

**Community:**
- Crypto Twitter: [@drift_protocol](https://twitter.com/drift_protocol), [@solana](https://twitter.com/solana)
- Reddit: r/solana, r/algotrading

### Versiegeschiedenis

| Versie | Datum | Auteur | Wijzigingen |
|--------|-------|--------|-------------|
| v1.0 | [Eerdere datum] | Colin + Grok | Initiële versie met Hyperliquid focus, daytrading scope |
| v1.1 | [Eerdere datum] | Colin + Grok | Toegevoegd: Drift Protocol, logging systeem, Claude integratie |
| v1.2 | [Eerdere datum] | Colin + Grok | Toegevoegd: Trade logging details, monitoring dashboard |
| **v2.0** | **26-10-2025** | **Colin + Claude** | **Major update:** Swing trading focus, Drift-first strategy, multi-concept confluence (FVG/OB/Liquidations), risk-based position sizing, hybrid strategy engine, decision support model (niet volautomaat) |

---

**Einde PRD v2.0**

*Dit document dient als leidraad voor de ontwikkeling van de AI Trading Decision Support Bot. Voor technische implementatiedetails, zie het Functioneel Ontwerp (FO) en Technisch Ontwerp (TO). Voor dagelijkse development tracking, zie het Bouwplan.*
