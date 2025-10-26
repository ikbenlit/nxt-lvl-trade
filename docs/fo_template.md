# 🧩 Functioneel Ontwerp (FO) – Template

**Projectnaam:** _[vul in]_  
**Versie:** _v1.0_  
**Datum:** _[dd-mm-jjjj]_  
**Auteur:** _[naam]_  

---

## 1. Doel en relatie met het PRD
🎯 **Doel van dit document:**
Het Functioneel Ontwerp (FO) beschrijft **hoe** het product uit het PRD functioneel zal werken — dus wat de gebruiker ziet, doet en ervaart. Waar het PRD uitlegt *wat en waarom*, laat het FO zien *hoe dit in de praktijk werkt*.

📘 **Toelichting aan de lezer:**
Gebruik dit document om een gedeeld beeld te creëren tussen ontwerp, ontwikkeling en stakeholders. Het FO hoort compact te blijven: één niveau dieper dan het PRD, niet technisch maar functioneel-concreet.

---

## 2. Overzicht van de belangrijkste onderdelen
🎯 **Doel:** kort overzicht van de modules, schermen of onderdelen binnen de app of tool.  
📘 **Toelichting:** som de kernschermen of modules op (zoals ‘Dashboard’, ‘Cliëntenlijst’, ‘Editor’, ‘AI-rail’). Dit helpt de lezer snel te begrijpen waar het FO over gaat.

**Voorbeeld:**
1. Dashboard / Overzicht  
2. Cliëntdossier  
3. Intakeverslag  
4. Probleemprofiel  
5. Behandelplan  
6. *(Optioneel)* Rapportage / Agenda

---

## 3. Userstories (sjabloon + voorbeelden)
🎯 **Doel:** beschrijven wat gebruikers moeten kunnen doen, vanuit hun perspectief.

📘 **Toelichting:** gebruik dit vaste sjabloon:

**User Story Template:**
> Als [rol/gebruiker] wil ik [doel of actie] zodat [reden/waarde].

**Voorbeeld:**
> Als behandelaar wil ik snel een intakeverslag kunnen samenvatten zodat ik sneller tot een behandelplan kom.

**Aanvullende kolommen (optioneel):**
| ID | Rol | Doel / Actie | Verwachte waarde | Prioriteit |
|----|------|---------------|------------------|-------------|
| US-01 | Behandelaar | Nieuwe cliënt aanmaken | Kan direct starten met intake | Hoog |
| US-02 | Behandelaar | Intake samenvatten met AI | Tijdbesparing, inzicht | Hoog |
| US-03 | PO | Inzage demo-flow | Begrijpt AI toegevoegde waarde | Middel |

---

## 4. Functionele werking per onderdeel
🎯 **Doel:** per hoofdonderdeel beschrijven wat de gebruiker kan doen en wat het systeem doet.

📘 **Toelichting:** dit is de kern van het FO. Gebruik korte, actiematige beschrijvingen. Focus op gedrag, states en interacties.

**Voorbeeldstructuur:**

### 4.1 Dashboard / Overzicht
* Toont kaarten met samenvattingen van cliëntinformatie (intake, profiel, plan).  
* Knoppen: *Nieuw verslag*, *Ga naar behandelplan*.  
* Leeg-staat: melding “Nog geen dossiers”.

### 4.2 Intakeverslag
* Rich text editor met knoppen voor *Opslaan*, *AI-samenvatten*, *Leesbaarheid*.  
* AI-resultaat verschijnt in rechterzijpaneel (AI-rail).  
* Gebruiker kan *Preview → Invoegen* of *Annuleren*.

### 4.3 Probleemprofiel
* Formulier met dropdown (categorie) en slider (severity).  
* AI-suggestie met bronverwijzing uit intake.  
* Bevestigen activeert *Behandelplan* tab.

### 4.4 Behandelplan
* Vier secties: Doelen, Interventies, Frequentie/Duur, Meetmomenten.  
* Gebruiker kan elke sectie aanpassen of regenereren via micro-AI-acties.  
* Knoppen: *Opslaan* (concept), *Publiceer v1*.

---

## 5. UI-overzicht (visuele structuur)
🎯 **Doel:** eenvoudig inzicht geven in de globale schermopbouw.

📘 **Toelichting:** gebruik dit als communicatiemiddel met ontwerpers of developers. Het is geen pixel-perfect ontwerp, maar een functionele schets.

**Voorbeeld (ASCII-layout):**
```
┌───────────────────────────────────────────────┐
│ Topbalk: cliëntnaam, acties, zoeken           │
├───────────────┬───────────────────────────────┤
│ Linkernav     │  Middenpaneel (inhoud)        │
│ (Overzicht,   │  Detail, formulieren, editor) │
│ Intake, Prof.)│                               │
├───────────────┴───────────────────────────────┤
│ Footer: status / toasts                      │
└───────────────────────────────────────────────┘
```

**Tip:** Combineer dit later met wireframes of UX-schetsen uit Figma of Gamma.app.

---

## 6. Interacties met AI (functionele beschrijving)
🎯 **Doel:** uitleggen waar AI in de flow voorkomt en wat de gebruiker ziet of verwacht.

📘 **Toelichting:** beschrijf per AI-actie kort de trigger, verwerking en output.

**Voorbeeld:**
| Locatie | AI-actie | Trigger | Output |
|----------|-----------|----------|---------|
| Intake-editor | Samenvatten | Klik op knop *AI › Samenvatten* | Bullets in rechterzijpaneel |
| Intake-editor | Leesbaarheid (B1) | Klik op knop *AI › Leesbaarheid* | Herschreven tekstversie |
| Profiel | Extract problemen | Klik op *AI › Extract* | Categorie + severity + bronzinnen |
| Plan | Genereer behandelplan | Klik op *AI › Plan genereren* | Secties met bewerkbare doelen |

---

## 7. Gebruikersrollen en rechten (optioneel)
🎯 **Doel:** beschrijven welke rollen toegang hebben tot welke onderdelen.  
📘 **Toelichting:** alleen opnemen als het project meerdere gebruikersgroepen kent.

**Voorbeeld:**
| Rol | Toegang tot | Beperkingen |
|------|--------------|-------------|
| Behandelaar | Alle cliëntdossiers | Alleen eigen dossiers bewerken |
| Manager | Rapportages | Geen bewerkingen |
| Demo-user | Alles (fictieve data) | Alleen lezen |

---

## 8. Bijlagen & Referenties
🎯 **Doel:** linken naar de overige documenten binnen Mission Control.

**Verwijzingen:**
- PRD (Product Requirements Document)  
- TO (Technisch Ontwerp)  
- UX/UI-specificatie  
- Mission Control / Build Plan  
- API Access Document
