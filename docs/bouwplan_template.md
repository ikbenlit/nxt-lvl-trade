# 🚀 Mission Control – Bouwplan Template

💡 **Tip:** Dit document kun je samenstellen met hulp van AI-tools zoals **ChatGPT, Claude, Cursor** of **Gemini**.  
Gebruik ze als **sparringpartner** om de bouw van je software te plannen, te documenteren en te verbeteren – zelfs als je geen ontwikkelaar bent.  
Afhankelijk van de **complexiteit van je software** bepaal je zelf hoe gedetailleerd je elk onderdeel uitwerkt. Voor kleine prototypes volstaat een beknopt overzicht; voor grotere projecten kun je per fase en subfase inzoomen. In dit plan wordt geen code uitgewerkt, hooguit snippets of ter verduilijking.

---

**Projectnaam:** _[vul in]_  
**Versie:** _v1.0_  
**Datum:** _[dd-mm-jjjj]_  
**Auteur:** _[naam]_  

---

## 1. Doel en context
🎯 **Doel:** Leg uit wat je gaat bouwen en waarom.  
📘 **Toelichting:** Beschrijf kort de aanleiding voor het project en hoe het past binnen je organisatie of productstrategie. Verwijs hier naar het PRD of FO voor achtergrond.

**Voorbeeld:**  
> Het doel is een werkend MVP te bouwen van de AI-assistent voor zorgdossiers. We tonen de meerwaarde van AI binnen de intake → profiel → plan workflow.

---

## 2. Uitgangspunten
🎯 **Doel:** Benoem de vaste kaders waarbinnen het project wordt ontwikkeld.  
📘 **Toelichting:** Denk aan gebruikte stack, beperkingen (tijd, budget, resources) en aannames.

**Voorbeeld:**  
- Stack: Next.js + Firebase + Vertex AI  
- Tijd: 3 weken bouwtijd voor MVP  
- Geen productiegegevens (alle data fictief)  
- Doel: demo op AI-inspiratiesessie

## Development Principles
**Core Principles:**
- DRY (Don't Repeat Yourself) - Geen duplicatie, herbruikbare code
- SoC (Separation of Concerns) - UI / Business / Data gescheiden
- KISS (Keep It Simple) - Simpele oplossing > slimme oplossing
- YAGNI (You Aren't Gonna Need It) - Bouw alleen wat nodig is
- Single Responsibility - Elke functie/component doet één ding

**Code Quality:**
- Duidelijke naamgeving (getUserData, ClientCard)
- Error handling op alle API calls
- Secrets in .env, nooit in code
- Input validatie (client + server)
- Comments alleen voor "waarom", niet "wat"

**Bestandsnaamgeving:**
- Components: PascalCase (ClientCard.tsx, UserProfile.svelte)
- Utils/helpers: kebab-case (format-date.ts, api-client.ts)
- Pages/routes: volg framework conventie
	Next.js: page.tsx, layout.tsx, [id]/page.tsx
	SvelteKit: +page.svelte, +layout.svelte, [id]/+page.svelte
- Folders: kebab-case (api-routes, user-components)

---

## 3. Fase- en subfase-overzicht
🎯 **Doel:** De bouw opdelen in logische fases met een duidelijke volgorde.  
📘 **Toelichting:** Elke fase bevat het doel, afhankelijkheden en status. Je kunt de status handmatig of via AI bijhouden.

**Voorbeeld:**
| Fase | Titel | Doel | Status | Opmerkingen |
|------|--------|------|---------|--------------|
| 0 | Setup | Repo, omgeving, dependencies | ✅ Gereed | Config getest |
| 1 | Data & Firebase | Datamodel en demo-data | 🔄 In Progress | Rules nog aanvullen |
| 2 | UI & Layout | SvelteKit layout, navigatie | ⏳ To Do | Wireframes gereed |
| 3 | AI-integratie | Vertex AI endpoints | ⏳ To Do | Test met Gemini model |
| 4 | Testing & Deploy | Demo testen & live zetten | ⏳ To Do | | 

---

## 4. Subfases (uitwerking per fase)
🎯 **Doel:** Verdeel complexe fases in beheersbare subfases voor meer overzicht.  
📘 **Toelichting:** Je bepaalt zelf het detailniveau. Kleine projecten kunnen volstaan met 2-3 subfases; grotere implementaties kunnen tot 10 subfases bevatten. Gebruik dit format om focus en voortgang te behouden.

**Voorbeeldstructuur:**

### Fase 0 — Setup
| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|----------|------|--------|------------------|--------------|
| 0.1 | Repo aanmaken | ✅ | — | GitHub en Vercel gereed |
| 0.2 | Dependencies installeren | ✅ | 0.1 | Tailwind, Lucide, Firebase |
| 0.3 | Omgevingsvariabelen configureren | 🔄 | 0.2 | `.env.local` + Vercel vars |
| 0.4 | Template cleanup | ⏳ | 0.2 | Verwijder standaard demo-content |

### Fase 1 — Data & Firebase
| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|----------|------|--------|------------------|--------------|
| 1.1 | Datamodel ontwerpen | 🔄 | 0.4 | Definieer `clients`, `intakes`, `plans` |
| 1.2 | Security Rules schrijven | ⏳ | 1.1 | Demo-user all access |
| 1.3 | Demo-data seeden | ⏳ | 1.1 | 3 testcliënten + intake |

### Fase 2 — UI & Layout
| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|----------|------|--------|------------------|--------------|
| 2.1 | Layout skelet bouwen | ⏳ | 1.3 | Topbalk + navigatie |
| 2.2 | Componentenbibliotheek koppelen | ⏳ | 2.1 | shadcn/ui of eigen variant |
| 2.3 | Navigatie en routes | ⏳ | 2.1 | `/clients/[id]` structuur |

### Fase 3 — AI-integratie
| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|----------|------|--------|------------------|--------------|
| 3.1 | Vertex AI configureren | ⏳ | 0.3 | GCP SA key in `.env` |
| 3.2 | Endpoints aanmaken | ⏳ | 3.1 | summarize, extract, plan |
| 3.3 | Logging & telemetrie | ⏳ | 3.2 | Log requests in `ai_events` |

### Fase 4 — Testing & Deploy
| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|----------|------|--------|------------------|--------------|
| 4.1 | Smoke tests uitvoeren | ⏳ | 3.3 | Prompt snapshots testen |
| 4.2 | Demo dry-run | ⏳ | 4.1 | Met tijdmeting (≤10 min) |
| 4.3 | Publicatie Vercel | ⏳ | 4.2 | EU-regio deployment |

---

## 5. Fasebeschrijving (detail)
🎯 **Doel:** Per fase beschrijven wat er moet gebeuren, zonder in code te duiken.  
📘 **Toelichting:** Gebruik korte opsommingen en eventueel snippets om een AI-tool te laten helpen bij specifieke taken.

**Voorbeeldstructuur:**

### Fase 1 – Setup
* Doel: basisomgeving inrichten.  
* Taken:
  - Init SvelteKit project met Tailwind.
  - Voeg ESLint, Prettier en TypeScript toe.
  - Controleer lokale run in dev-modus.  
* Snippet (voorbeeld prompt voor Cursor):
  ```
  Maak een SvelteKit boilerplate met Tailwind en lucide-icons. Voeg een voorbeeldcomponent toe.
  ```

### Fase 2 – Data & Firebase
* Doel: datamodel definiëren en seed-data aanmaken.  
* Taken:
  - Collections opzetten (`clients`, `intakes`, `plans`).  
  - Security Rules schrijven.  
  - Demo-gebruiker configureren.

### Fase 3 – UI & Interactie
* Doel: interface opzetten volgens UX/FO.  
* Taken:
  - Layout bouwen met Topbalk + Linkernav.  
  - Dummy-content tonen per tab.  
  - Toetscombinaties testen (Ctrl+S, Cmd+K).  
* Snippet (prompt):
  ```
  Bouw een Svelte-component voor de linkernavigatie met active state en hover animatie.
  ```

### Fase 4 – AI-integratie
* Doel: AI-functionaliteit koppelen (server-side).  
* Taken:
  - Vertex AI instellen (Gemini model).  
  - Endpoints maken: summarize, extract, plan.  
  - Output testen met fictieve data.

---

## 6. Kwaliteit & Testplan
🎯 **Doel:** vastleggen hoe de kwaliteit van het project wordt geborgd.  
📘 **Toelichting:** Licht toe welke tests je uitvoert en hoe je weet dat de build stabiel is.

**Voorbeeld:**
- Smoke tests per flow (A/B/C)
- Snapshot tests op AI-output structuur
- Handmatige demo-run vóór oplevering

---

## 7. Demo & Presentatieplan
🎯 **Doel:** beschrijven hoe de demo wordt gepresenteerd of getest.  
📘 **Toelichting:** Vermeld wat je laat zien, wie betrokken is en welk scenario wordt gevolgd.

**Voorbeeld:**
> We tonen in 10 minuten de flow: nieuwe cliënt → intake → AI-samenvatting → behandelplan. 
> De demo draait lokaal in Vercel met mockdata.

---

## 8. Risico’s & Mitigatie
🎯 **Doel:** risico’s vroeg signaleren en voorzien van oplossingen.
📘 **Toelichting:** Gebruik dit als dynamische checklist.

**Voorbeeld:**
| Risico | Impact | Mitigatie |
|--------|---------|------------|
| AI-output inconsistent | Hoog | Test prompts, gebruik snapshot tests |
| Firebase regels te open | Middel | Sluiten voor productie |
| Tijdsdruk | Hoog | Schalen op taken via AI of no-code tooling |

---

## 9. Evaluatie & Lessons Learned
🎯 **Doel:** reflecteren op het proces en verbeteringen vastleggen.
📘 **Toelichting:** noteer inzichten na elke sprint of oplevering.

**Voorbeeld:**
> De AI-rail werkte goed, maar het kostte extra tijd om prompts te fine-tunen. Voor de volgende iteratie gebruiken we vooraf geteste promptblokken.

---

## 10. Referenties
🎯 **Doel:** koppelen aan de overige Mission Control-documenten.

**Verwijzingen:**
- PRD – Product Requirements Document  
- FO – Functioneel Ontwerp  
- TO – Technisch Ontwerp  
- UX/UI-specificatie  
- API Access Document