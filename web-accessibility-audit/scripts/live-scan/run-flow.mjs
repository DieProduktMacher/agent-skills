// Flow-based accessibility scan: executes a user journey (e.g. buying a ticket) step by step
// and runs axe-core against EVERY state, deduplicating so each step shows what IT introduced.
//
// Why: page-level scans miss state-dependent UI — opened modals, validation errors, seat pickers,
// payment iframes, confirmation screens. WCAG conformance applies to COMPLETE processes: one
// broken step breaks the claim for the whole journey.
//
// Usage:  node run-flow.mjs <flow.json>        (see flow.example.json)
// Output: flow-report/<name>.json + per-step screenshots + console summary.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const flowPath = process.argv[2];
if (!flowPath) { console.error('Usage: node run-flow.mjs <flow.json>'); process.exit(2); }
const flow = JSON.parse(readFileSync(flowPath, 'utf8'));

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const OUT = 'flow-report';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
const seen = new Set();           // violationId::targetSelector — for step-level dedup
const report = { flow: flow.name, start: flow.start, scannedAt: new Date().toISOString(), steps: [] };
let totalNew = 0;

async function scanState(stepName, index) {
  const { violations, incomplete } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const fresh = [];
  for (const v of violations) {
    const newNodes = v.nodes.filter(n => {
      const key = `${v.id}::${n.target.join('>')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (newNodes.length) {
      fresh.push({
        id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl,
        wcag: v.tags.filter(t => t.startsWith('wcag')),
        nodes: newNodes.map(n => ({ target: n.target, html: n.html.slice(0, 200) })),
      });
    }
  }
  const shot = `${OUT}/${String(index).padStart(2, '0')}-${stepName.replace(/[^a-z0-9]+/gi, '-')}.png`;
  await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
  totalNew += fresh.reduce((s, v) => s + v.nodes.length, 0);
  report.steps.push({
    step: stepName, url: page.url(),
    newViolations: fresh,
    totalViolationsInState: violations.length,
    needsManualReview: incomplete.length,
    screenshot: shot,
  });
  const n = fresh.reduce((s, v) => s + v.nodes.length, 0);
  console.log(`  [${index}] ${stepName} — ${n} NEW violation node(s) (state total: ${violations.length} rule(s), manual review: ${incomplete.length})`);
  for (const v of fresh) console.log(`       [${(v.impact || 'n/a').toUpperCase()}] ${v.id} — ${v.help}`);
}

async function doAction(a) {
  if (a.goto) return page.goto(a.goto, { waitUntil: 'networkidle' });
  if (a.click) return page.click(a.click);
  if (a.fill) return page.fill(a.fill[0], a.fill[1]);
  if (a.select) return page.selectOption(a.select[0], a.select[1]);
  if (a.check) return page.check(a.check);
  if (a.press) return Array.isArray(a.press) ? page.press(a.press[0], a.press[1]) : page.keyboard.press(a.press);
  if (a.waitFor) return page.waitForSelector(a.waitFor, { timeout: 30000 });
  if (a.wait) return page.waitForTimeout(a.wait);
  throw new Error(`Unknown action: ${JSON.stringify(a)}`);
}

console.log(`\nFlow: ${flow.name}\n`);
try {
  await page.goto(flow.start, { waitUntil: 'networkidle', timeout: 60000 });
  await scanState('start', 0);
  for (const [i, step] of (flow.steps || []).entries()) {
    for (const action of step.actions || []) await doAction(action);
    await page.waitForLoadState('networkidle').catch(() => {});
    await scanState(step.name || `step-${i + 1}`, i + 1);
  }
} catch (err) {
  report.error = String(err);
  console.error(`\nFlow aborted at step ${report.steps.length}: ${err}`);
  console.error('An unexecutable flow step is itself a finding candidate — check selectors, then whether the blocker is an accessibility barrier.');
}
await browser.close();

const outFile = `${OUT}/${flow.name.replace(/[^a-z0-9]+/gi, '-')}.json`;
writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(`\nWrote ${outFile} + screenshots. Total NEW violation nodes across the flow: ${totalNew}`);
console.log('Reminder: this covers the automatable subset per state. Run the manual flow protocol (M1/M2/M7 per step) and complete the journey with a screen reader (AT1 step 7).');
process.exit(report.error || totalNew > 0 ? 1 : 0);
