// Browser-based axe-core scan via Playwright.
// Usage: node run-axe.mjs <url> [url2 ...]
// Output: axe-report.json + a console summary. Tests against WCAG 2.0/2.1/2.2 A & AA tags.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'node:fs';

const urls = process.argv.slice(2);
if (urls.length === 0) {
  console.error('Usage: node run-axe.mjs <url> [url2 ...]');
  process.exit(2);
}

// axe tag set covering WCAG 2.2 Level A + AA (supersets the EU legal minimum of 2.1 AA).
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const browser = await chromium.launch();
const results = {};
let totalViolations = 0;

for (const url of urls) {
  const page = await browser.newPage();

  // --- Authenticated pages: uncomment and adapt ---
  // await page.goto('https://example.com/login');
  // await page.fill('#email', process.env.A11Y_USER);
  // await page.fill('#password', process.env.A11Y_PASS);
  // await page.click('button[type=submit]');
  // await page.waitForURL('**/dashboard');

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    const { violations, passes, incomplete } = await new AxeBuilder({ page })
      .withTags(TAGS)
      .analyze();

    totalViolations += violations.length;
    results[url] = {
      violations: violations.map(v => ({
        id: v.id, impact: v.impact, help: v.help, wcag: v.tags.filter(t => t.startsWith('wcag')),
        helpUrl: v.helpUrl, nodes: v.nodes.map(n => ({ target: n.target, html: n.html.slice(0, 200) })),
      })),
      passCount: passes.length,
      incompleteCount: incomplete.length, // items needing MANUAL review
    };

    console.log(`\n${url}`);
    console.log(`  violations: ${violations.length} | passes: ${passes.length} | needs manual review: ${incomplete.length}`);
    for (const v of violations) {
      console.log(`   [${(v.impact || 'n/a').toUpperCase()}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`);
    }
  } catch (err) {
    results[url] = { error: String(err) };
    console.error(`  ERROR scanning ${url}: ${err}`);
  } finally {
    await page.close();
  }
}

await browser.close();
writeFileSync('axe-report.json', JSON.stringify(results, null, 2));
console.log(`\nWrote axe-report.json. Total violations: ${totalViolations}`);
console.log('NOTE: "needs manual review" items and everything not covered by axe still require manual + AT testing.');
process.exit(totalViolations > 0 ? 1 : 0);
