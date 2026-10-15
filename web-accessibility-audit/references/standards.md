# Technical standards: WCAG and EN 301 549

## WCAG structure (the thing you actually test against)

WCAG (Web Content Accessibility Guidelines, by the W3C/WAI) is organised as:

- **4 principles — POUR:** content must be **Perceivable, Operable, Understandable, Robust.**
- **Guidelines** under each principle.
- **Success Criteria (SC)** — the testable statements, each graded **A**, **AA**, or **AAA**.
- **Conformance levels are cumulative:** meeting AA means meeting all A **and** all AA criteria.

**Legal target is almost always Level AA** (A + AA). AAA is not required wholesale by any regime and
some AAA criteria can't apply site-wide; treat AAA as selective enhancement.

Conformance also has **5 requirements** beyond the per-SC checks: (1) meet the chosen level for
(2) full pages, over (3) complete processes (e.g. the *whole* checkout, not just the cart), using
(4) accessibility-supported technologies, and (5) with no interference from non-conforming content.
A single broken step in a process breaks conformance for that process.

## WCAG versions and which one the law wants

| Version | Status | Legal relevance |
|---|---|---|
| WCAG 2.0 (2008) | superseded | Referenced by Section 508 (US) and some older laws |
| WCAG 2.1 (2018) | current W3C Rec | **The current EU legal baseline** — EN 301 549 v3.2.1 incorporates 2.1 AA |
| WCAG 2.2 (Oct 2023) | current W3C Rec | **Recommended target now**; EN 301 549 **v4.1.1 (expected ~Oct 2026)** adopts it |
| WCAG 3.0 | early draft | Not a standard yet — do **not** audit against it for compliance |

**Practical stance:** audit against **WCAG 2.2 AA**, but tag the 2.2-only findings so the WCAG 2.1 AA
(= today's legal minimum) picture stays readable. Anything failing 2.1 AA is a *current* legal gap;
2.2-only failures are near-future gaps and best practice today.

### WCAG 2.2 changes vs 2.1
- **Removed:** SC **4.1.1 Parsing** (now obsolete — modern browsers handle the underlying issue;
  treat as satisfied).
- **Added — Level A:** **3.2.6 Consistent Help**, **3.3.7 Redundant Entry**.
- **Added — Level AA:** **2.4.11 Focus Not Obscured (Minimum)**, **2.5.7 Dragging Movements**,
  **2.5.8 Target Size (Minimum)** (≥ 24×24 CSS px or adequate spacing), **3.3.8 Accessible
  Authentication (Minimum)** (no cognitive-function test like remembering/transcribing unless an
  alternative exists).
- **Added — Level AAA:** 2.4.12 Focus Not Obscured (Enhanced), 2.4.13 Focus Appearance,
  3.3.9 Accessible Authentication (Enhanced).

The A/AA additions are the ones that matter for compliance and are the most-missed on existing sites —
check them explicitly.

## EN 301 549: what it adds beyond WCAG

EN 301 549 wraps WCAG and extends it. For a **website** the web clauses (Chapter 9) are essentially
WCAG 2.1 AA verbatim, plus a handful of extra web requirements. But EN 301 549 also covers:

- **Chapter 10 — non-web documents** (PDF, DOCX, EPUB linked/served by the site): these must meet the
  WCAG criteria as interpreted by **WCAG2ICT**. A perfectly accessible page linking an untagged PDF
  can still fail.
- **Chapter 11 — non-web software** (native/mobile apps, embedded web views).
- **Chapters 5–8, 12–13** — hardware, closed functionality, documentation & support, relay/emergency
  services (relevant when the "service" spans terminals, telecoms, etc.).

So for a pure marketing website, "WCAG 2.x AA" ≈ the web obligation. For an e-commerce platform with
downloadable invoices, a mobile app, and phone support, the EN 301 549 scope is broader — flag those
extra surfaces in scope even if you only audit the web front-end.

## Mapping summary

```
WCAG 2.2 AA          ← recommended audit target (superset of legal minimum)
  └ WCAG 2.1 AA      ← current EU legal minimum (EN 301 549 v3.2.1, clause 9)
      └ EN 301 549   ← technical standard
          ├ WAD / BITV 2.0 (public sector)  → v3.2.1 cited in OJEU = presumption of conformity ✅
          └ EAA / BFSG (private B2C)         → not yet cited in OJEU = NO formal presumption yet
                                               (v4.1.1 expected ~Oct 2026); use as best benchmark
```

Do not tell a private-sector client that conforming to EN 301 549 "guarantees" or "presumes" EAA/BFSG
compliance — that presumption isn't in force yet. It conforms to the recognised state of the art,
which is the strongest available position, and it will convert to a formal presumption when v4.1.1 is
cited. For **public-sector** clients under BITV/WAD, the presumption already applies today.

Record the target as an explicit string in the report, e.g.:
*"Target: WCAG 2.2 Level AA + EN 301 549 v3.2.1 web requirements. Legal minimum: WCAG 2.1 AA.
Out-of-web-scope surfaces noted: linked PDFs (Ch.10), iOS app (Ch.11) — not audited here."*
