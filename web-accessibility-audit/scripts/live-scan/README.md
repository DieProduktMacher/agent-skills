# Live browser scan (run in your own environment)

Real browser-based automated testing against a reachable URL (production, staging, or a `localhost`
dev server). Run these where a browser and the target site are reachable — a sandbox usually can't
reach external sites, so run locally and paste the results back for interpretation.

**Reminder:** `run-audit.mjs` below reaches a high-confidence automated verdict on ~65–75% of A/AA
criteria (see `../../references/automation.md` for the exact tier breakdown) — the lighter single-purpose
runners further down cover much less on their own. The guided-review pass in
`../../references/guided-review.md` and, where no browser is drivable, the manual protocol in
`../../references/manual-testing.md` are still required for the remainder.

## One-time setup
```bash
cd scripts/live-scan
npm install
npx playwright install chromium   # browser for the harness / axe / flow runners
```

## Comprehensive agent-driven harness (primary) — `run-audit.mjs`
Drives a real browser and automates most of the WCAG 2.2 A/AA manual protocol (keyboard, focus
visibility/order/obscuring, reflow, text spacing, target size, label-in-name, accessibility-tree
name/role/state, user preferences, paste-blocked auth), then emits a `humanConfirmations` queue for
the few items needing vision/judgement. See `../../references/automation.md` for the coverage ceiling.
```bash
node run-audit.mjs https://example.com        # single page
node run-audit.mjs --flow flow.example.json   # whole journey, full battery at every state
# → audit-report/<name>.json + per-item screenshots
```
The JSON has `results` (pass/fail/warn) and `humanConfirmations` (tappable questions, each with a
recommended answer + evidence). An agent resolves the screenshot-backed items itself; only the residue
goes to a human. `lib.mjs` holds the pure, unit-tested accessibility maths used by the harness.

## Lighter-weight, single-purpose runners

Use `run-audit.mjs` above for a real audit. These are narrower tools — reach for one only when you
specifically want just its output (e.g. a bare axe JSON report for another pipeline), not as a
substitute for the comprehensive harness.

**axe-core via Playwright (raw axe output only, no keyboard/contrast/hover/legal-link checks):**
```bash
node run-axe.mjs https://example.com https://example.com/checkout
# writes axe-report.json + prints a summary; tag WCAG 2.2 AA
```

**pa11y-ci (CI gate with thresholds):**
```bash
npm run pa11y   # runs `pa11y-ci --config .pa11yci.json`
```
Edit `.pa11yci.json`'s `urls` to point at the page(s) under test.

**Lighthouse (quick score, subset of axe):**
```bash
npx lighthouse https://example.com --only-categories=accessibility \
  --output=json --output-path=./lighthouse-a11y.json --quiet --chrome-flags="--headless"
```

**Lighthouse CI (threshold-gated, config-driven):**
```bash
npm run lhci   # runs `lhci autorun --config=./lighthouserc.json`
```
Edit `lighthouserc.json`'s `collect.url` to point at the page(s) under test; `assert.assertions`
fails the run below the configured accessibility score (defaults to 100%, i.e. zero violations).

**Flow scan — a whole user journey, state by state (recommended for critical tasks):**
```bash
node run-flow.mjs flow.example.json
# drives the journey and scans EVERY state (incl. error/dynamic states), attributing each new
# violation to the step that introduced it; writes flow-report/<name>.json + per-step screenshots
```
Define your journey by copying `flow.example.json`. Each step is a name + a list of `actions`:

| Action | Meaning |
|---|---|
| `{"goto": "url"}` | navigate |
| `{"click": "selector-or-text=Label"}` | click (Playwright selectors, incl. `text=`) |
| `{"fill": ["#sel", "value"]}` | type into a field |
| `{"select": ["#sel", "value"]}` / `{"check": "#sel"}` | choose option / tick |
| `{"press": "Enter"}` or `{"press": ["#sel", "Enter"]}` | keyboard |
| `{"waitFor": "#sel"}` / `{"wait": 1000}` | wait for element / ms |

Include an explicit **error state** step (e.g. submit the checkout form empty) — that's where the
worst, least-tested failures live. For authenticated flows, put the login actions as the first steps
(or reuse `run-axe.mjs`'s storage-state approach). A step that can't be executed aborts the flow and
is logged — treat an unreachable-by-script control as a finding candidate, not just a test bug.

## Interpreting results
- Feed the JSON back into the audit. Each violation maps to one or more WCAG SC — slot them into the
  report's "Missed criteria" table with severity and location.
- **Zero automated violations is the floor, not the ceiling.** Proceed to keyboard, zoom/reflow,
  contrast, and screen-reader checks before any conformance statement.
- For authenticated pages, add a login step in `run-axe.mjs` (see the commented block) or use
  Playwright storage state.
- For a *site-level* claim, sample representative pages per **WCAG-EM** (templates, key user journeys,
  richest/most-complex pages), not just the home page.
