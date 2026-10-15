# Accessibility statement generator (Erklärung zur Barrierefreiheit)

A published statement is a **legal requirement in its own right** — its absence is a compliance
failure independent of the site's technical quality (report station **G25**). This file gives
ready-to-fill templates for both regimes and how to populate them from the audit. Output the statement
in the site's language (German for German services). **Fill placeholders honestly from the audit's
"Missed criteria" table — never assert "fully conformant" unless the audit verified it.** Templates
are a starting point for the provider to review; this is not legal advice.

Pick the regime from `references/legal.md`:
- **Public-sector body (BITV 2.0 / WAD)** → the full EU-model statement (§ A). Structure is mandatory.
- **Private B2C service (BFSG / EAA)** → the service-information statement (§ B). Less prescriptive;
  BFSG § 14 + Anlage 3 require accessible information on *how the service meets the requirements*.

How to fill the conformance status from the audit:
- **fully / vollständig konform** — only if every applicable A/AA criterion in scope passed *and* the
  manual/AT residue was completed. Rare; be sceptical.
- **partially / teilweise konform** — some known barriers exist (the normal honest outcome). List them.
- **not / nicht konform** — major/untested. Use when the audit is incomplete or many criteria fail.
Populate "non-accessible content" directly from the report's Missed-criteria and Not-tested rows.

---

## § A — Public sector (BITV 2.0), German — EU-model structure

```markdown
# Erklärung zur Barrierefreiheit

[BEHÖRDE/ANBIETER] ist bemüht, [seine Website / seine App] im Einklang mit [§ 12a BGG] und der
Barrierefreie-Informationstechnik-Verordnung (BITV 2.0) barrierefrei zugänglich zu machen.

## Stand der Vereinbarkeit mit den Anforderungen
Diese Website ist mit der BITV 2.0 bzw. EN 301 549 (WCAG 2.1 Stufe AA)
[ vollständig | teilweise | nicht ] vereinbar. [Bei „teilweise": aufgrund der nachfolgend
aufgeführten Unvereinbarkeiten.]

## Nicht barrierefreie Inhalte
Die folgenden Inhalte sind aus den genannten Gründen nicht barrierefrei:
- [Inhalt/Seite]: [Beschreibung des Problems] — [WCAG-Kriterium]. Grund:
  [ nicht mit BITV vereinbar | unverhältnismäßige Belastung (§ …) | fällt nicht in den Anwendungsbereich ].
  [Alternative, falls vorhanden.]
- […]
[Aus der Tabelle „Nicht erfüllte Kriterien" des Prüfberichts übernehmen.]

## Datum der Erstellung / letzten Überprüfung
Diese Erklärung wurde am [DATUM] erstellt / zuletzt überprüft. Grundlage:
[ Selbstbewertung | Bewertung durch Dritte / BITV-Test ] vom [DATUM].

## Feedback und Kontakt
Sind Ihnen Barrieren aufgefallen oder benötigen Sie Informationen in einer barrierefreien Form?
Kontakt: [Name/Stelle], [E-Mail], [Telefon]. Wir bemühen uns um zeitnahe Rückmeldung.

## Durchsetzungsverfahren
Wenn Ihre Rückmeldung nicht zufriedenstellend beantwortet wird, können Sie sich an die
Schlichtungsstelle nach § 16 BGG wenden:
Schlichtungsstelle BGG, [Anschrift], [E-Mail/Web]. [Für Landesbehörden: zuständige Landes-Schlichtungs-
/Durchsetzungsstelle.]

[Optional, empfohlen: Verweise auf Fassungen in Leichter Sprache und in Deutscher Gebärdensprache (DGS).]
```

## § A (EN gloss)
Same structure in English: title; effort statement citing BGG/BITV 2.0; **conformance status** (fully/
partially/not, naming the standard); **non-accessible content** with per-item reason (not compatible /
disproportionate burden / outside scope) and alternatives; **date & method** (self-assessment vs
third-party/BITV-Test); **feedback contact**; **enforcement procedure** (conciliation body under § 16
BGG). Public bodies should also link easy-read and sign-language versions.

---

## § B — Private B2C service (BFSG / EAA), German

```markdown
# Erklärung zur Barrierefreiheit

[ANBIETER] bietet [Dienstleistung, z. B. den Online-Shop unter example.de] an und ist nach dem
Barrierefreiheitsstärkungsgesetz (BFSG) verpflichtet, diese Dienstleistung barrierefrei zu erbringen.

## Barrierefreiheitsfeatures der Dienstleistung
Die Dienstleistung erfüllt die Anforderungen des BFSG / der EN 301 549 (WCAG 2.1 AA) durch u. a.:
[Tastaturbedienbarkeit; Screenreader-Unterstützung; ausreichende Kontraste; skalierbaren Text/Reflow;
beschriftete Formulare mit verständlichen Fehlermeldungen; Untertitel für Videos; …].

## Bekannte Einschränkungen
Derzeit sind folgende Inhalte/Funktionen noch nicht vollständig barrierefrei:
- [Inhalt/Funktion]: [Problem] — [WCAG-Kriterium]. [Geplante Behebung bis DATUM / Alternative.]
[Aus dem Prüfbericht übernehmen. Falls eine unverhältnismäßige Belastung geltend gemacht wird:
Begründung nach den Kriterien der Anlage 4 BFSG dokumentieren.]

## Stand
Bewertungsgrundlage: [ Selbstbewertung mit automatisierter + manueller Prüfung | Prüfung durch Dritte ],
Stand [DATUM]. Zielstandard: WCAG 2.2 AA (rechtliches Minimum WCAG 2.1 AA).

## Kontakt / Rückmeldung
Barriere melden oder Informationen barrierefrei anfordern: [Name], [E-Mail], [Telefon].
Wir antworten in der Regel innerhalb von [Frist].

## Marktüberwachung
Zuständig ist die Marktüberwachungsstelle der Länder für die Barrierefreiheit von Produkten und
Dienstleistungen (MLBF), Magdeburg. [Kontakt/Link.]
```

## § B (EN gloss)
Title; who provides which service and that BFSG applies; **accessibility features** (how the service
meets the requirements — the Anlage-3 core); **known limitations** with WCAG reference and remediation
date/alternative (and any documented disproportionate-burden justification per Anlage 4); **assessment
basis + date + target standard**; **feedback contact** with a response time; **market-surveillance
authority** (MLBF). Keep the feature list truthful and specific to what the audit verified.

---

## Publishing & upkeep
- Link the statement from the **footer of every page** (persistent, consistent — supports 3.2.6).
- Make the statement page **itself accessible** (it's the most-scrutinised page).
- Re-review on every significant change and at least annually; update the date and the known-barriers
  list from each new audit. An outdated statement (e.g. still claiming "fully conformant" after a
  redesign) is itself a finding.
- Offer to generate the filled statement as a `.md` or Word file from the completed report.
