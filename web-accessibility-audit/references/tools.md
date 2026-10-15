# Accessibility testing tools

**The 30–40% rule:** automated tools reliably detect only about a third of WCAG issues (missing alt,
low contrast, missing labels, invalid ARIA, etc.). The rest — reading order, meaningful alt *content*,
keyboard logic, focus management, error recovery, cognitive load, "does the screen reader announce
something *useful*" — needs a human and assistive tech. Use all three layers.

## Layer 1 — Automated

### Engine
- **axe-core** (Deque) — the de-facto engine; low false positives. Powers many other tools. Use
  directly via `@axe-core/playwright`, `@axe-core/puppeteer`, `jest-axe`, `cypress-axe`, or `axe-core`
  with jsdom for static HTML. Basis of `scripts/live-scan/` and referenced by the offline auditor.
- **Lighthouse** (Google, in Chrome DevTools / CLI) — its Accessibility category runs a subset of
  axe. Good for a quick score; **not** a full audit — a 100 score ≠ accessible.

### Browser / desktop tools
- **axe DevTools** (browser extension) — interactive, guided manual checks in Pro.
- **WAVE** (WebAIM) — visual overlay of errors/alerts/structure; great for explaining issues.
- **Accessibility Insights for Web** (Microsoft) — "FastPass" (automated) + "Assessment" (guided
  manual walkthrough mapped to WCAG); excellent for structured manual testing. Also **Tab stops**
  visualiser for keyboard order.
- **ARC Toolkit** (TPGi), **IBM Equal Access Accessibility Checker** — alternative engines; running a
  second engine occasionally surfaces issues axe misses.
- **Siteimprove / Deque axe Monitor / Level Access** — enterprise crawlers for site-wide monitoring.

### Commands (installable from npm — see `scripts/live-scan/`)
- `pa11y <url>` / **pa11y-ci** — CLI runner (axe or HTML_CodeSniffer runner) with a JSON config and
  CI thresholds.
- `lighthouse <url> --only-categories=accessibility`.
- `npx @axe-core/cli <url>`.

### Static / build-time (no live site needed)
- **eslint-plugin-jsx-a11y** — catches many issues in React/JSX at lint time (missing alt, invalid
  ARIA, non-interactive elements with handlers). Add to CI.
- **`scripts/audit_static_html.py`** (this skill) — offline structural checks on uploaded HTML.

## Layer 2 — Manual (browser + eyes + keyboard)

**The full step-by-step protocol lives in `references/manual-testing.md` (procedures M1–M10) — use
that when actually testing.** Summary of what it covers: keyboard-only operation & traps; focus
visibility/order/obscuring; reflow at 320px / 400% zoom and text spacing; contrast (text 4.5:1 / 3:1,
non-text 3:1) with **Colour Contrast Analyser (TPGi)** or DevTools; structure via the browser
**Accessibility tree** (headings, landmarks, title, lang, link purpose); media quality; forms & error
handling across whole processes; motion/timing/flashing; `prefers-reduced-motion` and forced-colors;
and the WCAG 2.2 specials (target size, dragging, consistent help, redundant entry, authentication).

## Layer 3 — Assistive technology (mandatory for a real audit)

**Scripted walkthroughs with exact key commands are in `references/manual-testing.md` (AT1–AT3).**
Test at least one screen reader end-to-end on a key task (e.g. complete the checkout):

- **NVDA** + Firefox/Chrome (Windows) — free; the standard baseline.
- **JAWS** + Chrome (Windows) — most common commercial SR.
- **VoiceOver** + Safari (macOS) and **VoiceOver** + Safari (iOS).
- **TalkBack** + Chrome (Android).
- **Voice control** (Dragon / Voice Control) and **screen magnification** (ZoomText) for broader
  coverage where relevant.

Listen for: is every control announced with a correct **name, role, and state**? Are dynamic updates
announced (live regions)? Is the reading order logical? Are images' alt text *useful* (or correctly
empty when decorative)? Are form errors announced and associated with their field?

## Formal conformance methodology (esp. Germany / EU)

- **WCAG-EM** (W3C Website Accessibility Conformance Evaluation Methodology) — how to define scope,
  sample representative pages, and report at *site* level rather than page level.
- **BITV-Test / BIK BITV-Test (Germany)** — the recognised German conformance-testing procedure
  (~50 test steps derived from BITV 2.0 / EN 301 549), performed by trained testers; the basis for a
  citable "BITV-Test" result. For an official/citable claim, a self-assessment with this skill is
  **preparation for**, not a replacement for, a certified BITV-Test.

## CI / regression prevention

Bake accessibility into the pipeline so fixes don't regress:
- **Lint:** `eslint-plugin-jsx-a11y` on every commit.
- **Unit/component:** `jest-axe` or `@axe-core/playwright` assertions on rendered components/pages.
- **E2E gate:** `pa11y-ci` or Playwright+axe against a preview/staging deploy, failing the build on new
  violations (baseline existing ones to avoid blocking on legacy debt).
- **Monitoring:** scheduled crawler (Siteimprove/axe Monitor) for content-driven regressions.

Never let the CI automated gate create a false sense of "done" — it guards the automatable third only.
