# PDF & document accessibility (EN 301 549 Ch.10)

A perfectly accessible web page that links an **untagged PDF invoice, ticket, menu, or brochure still
fails** — EN 301 549 clause 10 requires *non-web documents* served by the site to meet the WCAG
criteria as interpreted by **WCAG2ICT**, and the document standard is **PDF/UA (ISO 14289-1)**. For
German sites this is squarely in scope: BITV public-sector bodies must make documents accessible, and
BFSG services (e-commerce invoices/tickets, e-books) deliver documents as part of the service. Museums,
authorities, and shops are the classic offenders (scanned brochures, exported-from-Word PDFs).

## The standards
- **PDF/UA (ISO 14289-1)** — the technical requirements for an accessible PDF (tagging, structure,
  metadata). Verified against the **Matterhorn Protocol** (31 checkpoints / 136 failure conditions).
- **WCAG 2.x via WCAG2ICT** — the same success criteria, applied to documents (alt text, contrast,
  headings, reading order, language, link purpose…).
- **EN 301 549 clause 10** — makes the above the legal yardstick for non-web documents under EAA/WAD.

## Tools
- **`scripts/audit_pdf.py`** (this skill) — offline structural pre-check (tagged? lang? title?
  DisplayDocTitle? scanned image-only? unlabelled form fields? encryption blocking extraction?
  bookmarks?). The machine-checkable subset; no network. AUTO tier.
- **veraPDF** — open-source, **CLI, machine-verifiable PDF/UA validator**; the automatable path to a
  full Matterhorn check. Ideal for CI on document pipelines. AUTO tier (deeper than the pikepdf subset).
- **PAC (PDF Accessibility Checker)** — free (Windows); the de-facto PDF/UA + WCAG checker with a
  visual reading-order/structure preview. Best single manual-verification tool.
- **Adobe Acrobat Pro** — built-in Accessibility Checker, **Reading Order (Touch Up)** tool, tag tree
  editor, OCR. The main remediation tool.
- **axesPDF / CommonLook / pdfix** — remediation and automated tagging.

## Automation tiers (same philosophy as the web audit)
- **AUTO** — `audit_pdf.py` then **veraPDF** for the full machine-checkable PDF/UA set. Run both.
- **AGENT+VISION** — render pages to images; an agent can judge alt-text quality, heading/visual match,
  colour-only cues, and obvious reading-order problems from the rendered page + tag dump.
- **CONFIRM/HUMAN** — reading-order *correctness*, table-header semantics, and "do the tags match the
  content" are best confirmed in PAC/Acrobat's structure view (stations P1–P8 below).

## Workflow for a PDF
1. `python3 scripts/audit_pdf.py <file-or-dir>` → triage. A **not-tagged** or **scanned image-only**
   result is an immediate Critical: the document is fundamentally inaccessible; remediate before finer
   checks. Run **veraPDF** for the full PDF/UA machine verdict.
2. For tagged PDFs that pass the machine checks, work stations **P1–P8** (in PAC/Acrobat, or agent+vision
   on rendered pages) as guided questions.
3. Feed findings into the main report's *Missed criteria* table (tag each `[PDF: filename]`) and list
   remediation TODOs. Note the document scope explicitly — which files were checked.

## Guided stations P1–P8 (the judgment residue)

Ask each of these the same way as `guided-review.md`'s G-stations and SKILL.md's Step 0 questions —
a tappable question, its options, your recommended answer up front, via the interactive options tool.
The finished PDF assessment is the combination of `audit_pdf.py`'s automated results and these answers.

**P1 · Reading order — WCAG 1.3.2 (human/vision)**
*What:* the tag order must match the intended reading order (columns, sidebars, captions not jumbled).
*How:* PAC "Screen-reader preview" or Acrobat Reading Order / Tags panel; or read the tag dump in order.
*Q:* "Does the content read in a logical order?" `Yes`→Pass · `No, jumbled`→Fail · `Not tagged`→fix tagging first.

**P2 · Heading structure — WCAG 1.3.1 / 2.4.6 (vision)**
*What:* real heading tags (H1–H6), nested without skips, matching the visual hierarchy.
*How:* Tags panel / PAC outline.
*Q:* "Are visual headings real, correctly-levelled heading tags?" `Yes`→Pass · `No/faked`→Fail.

**P3 · Figure alt text — WCAG 1.1.1 (vision)**
*What:* informative images have a Figure tag with meaningful `/Alt`; decorative images are artifacted.
*How:* Tags panel; compare each figure's alt to the image.
*Q:* "Do images have accurate alt text (or are decoratives artifacted)?" `Yes`→Pass · `Missing/poor`→Fail.

**P4 · Tables — WCAG 1.3.1 (human)**
*What:* data tables use Table/TR/TH/TD with header cells and scope; not just visually-aligned text.
*How:* Tags panel / Acrobat Table Editor.
*Q:* "Are data tables properly tagged with headers?" `Yes`→Pass · `No`→Fail · `No tables`→Not present.

**P5 · Lists — WCAG 1.3.1 (vision)**
*What:* real list tags (L/LI/Lbl/LBody), not dashes/bullets typed as text.
*Q:* "Are lists properly tagged?" `Yes`→Pass · `No`→Fail · `No lists`→Not present.

**P6 · Links — WCAG 2.4.4 (vision)**
*What:* links are tagged Link with meaningful text (not a raw URL or "here").
*Q:* "Are links tagged and meaningfully labelled?" `Yes`→Pass · `No`→Fail · `No links`→Not present.

**P7 · Contrast & colour — WCAG 1.4.3 / 1.4.1 (vision)**
*What:* text meets 4.5:1 (3:1 large); information isn't conveyed by colour alone (e.g. red = overdue).
*How:* contrast tool on rendered pages; greyscale check.
*Q:* "Sufficient contrast and no colour-only meaning?" `Yes`→Pass · `No`→Fail.

**P8 · Artifacts & scanned text — WCAG 1.1.1 / 4.1.2 (human/auto-assisted)**
*What:* decorative page furniture is artifacted (not announced); any scanned text is OCR'd and tagged.
*How:* `audit_pdf.py` flags image-only; PAC shows un-artifacted noise.
*Q:* "Is decorative content artifacted and all text real (OCR'd)?" `Yes`→Pass · `No`→Fail.

## Remediation quick-reference
Untagged → Acrobat *Autotag* then **fix** in the Tags panel (autotag is a start, not a finish).
Scanned → **OCR** first, then tag. Word/InDesign source → fix there (styles, alt text, table headers)
and **re-export as tagged PDF** rather than patching the PDF each time — cheaper and repeatable.
