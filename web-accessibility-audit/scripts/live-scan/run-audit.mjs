// Comprehensive agent-driven accessibility harness.
// Goes far beyond a static scan: drives a real browser to test keyboard operability, focus
// visibility/order/obscuring, reflow, text spacing, target size, label-in-name, the accessibility
// tree (name/role/state — "screen reader without a screen reader"), user-preference media, and
// paste-blocked authentication. Everything it CAN'T decide programmatically is emitted as a
// `humanConfirmations` item with a screenshot + a recommended answer, so a human only answers
// questions instead of running procedures.
//
// Usage:
//   node run-audit.mjs <url>                 # single page
//   node run-audit.mjs --flow flow.json      # drive a journey, full battery at every state
//
// Output: audit-report/<name>.json  +  audit-report/*.png evidence.
// Requires: playwright, @axe-core/playwright, pngjs  (see package.json). Browser: chromium.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import {
  parseColor, evaluateTargetSize, nameContainsVisible, pixelDiffFraction, hasVisibleFocusChange,
  autoContrastOverRegion,
} from './lib.mjs';

// A+AA across WCAG 2.0/2.1/2.2 — this is the harness's fixed floor regardless of Step 0's chosen
// target (a lighter A-only target just means the report filters down; it never means testing less).
// NOTE: does not include 'wcag2aaa' — if the audit's target level is AAA, axe's AAA rule coverage is
// itself thin, so AAA criteria are assessed via references/wcag-checklist.md's guidance + manual
// review, not this tag list. See that file's AAA caveat.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const OUT = 'audit-report';
mkdirSync(OUT, { recursive: true });

const arg = process.argv[2];
if (!arg) { console.error('Usage: node run-audit.mjs <url> | --flow <file.json>'); process.exit(2); }

const R = [];          // results: {criterion, method, status, detail, screenshot?}
const CONFIRM = [];    // humanConfirmations: {id, criterion, question, options, recommendation, evidence, screenshot}
let shotCounter = 0;

const add = (criterion, method, status, detail, screenshot) =>
  R.push({ criterion, method, status, detail, ...(screenshot ? { screenshot } : {}) });
const ask = (criterion, question, options, recommendation, evidence, screenshot) =>
  CONFIRM.push({ id: `C${CONFIRM.length + 1}`, criterion, question, options, recommendation, evidence, ...(screenshot ? { screenshot } : {}) });
const shot = async (locOrPage, label) => {
  const p = `${OUT}/${String(++shotCounter).padStart(3, '0')}-${label.replace(/[^a-z0-9]+/gi, '-')}.png`;
  try { await locOrPage.screenshot({ path: p }); return p; } catch { return null; }
};
const decodePNG = (buf) => { try { return PNG.sync.read(buf); } catch { return null; } };

// ---- 1. Baseline axe (also surfaces "incomplete" = needs-review items) ----
async function axePass(page, tag) {
  try {
    const { violations, incomplete } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    for (const v of violations)
      add(v.tags.filter(t => t.startsWith('wcag')).join(','), `axe:${v.id}`, 'fail',
        `${v.help} — ${v.nodes.length} node(s); e.g. ${v.nodes[0]?.target?.join(' ')}`);
    // axe "incomplete" = it can't decide → perfect candidates for agent/human confirmation
    for (const v of incomplete) {
      const sc = v.tags.filter(t => t.startsWith('wcag')).join(',');
      ask(sc, `axe could not automatically decide "${v.help}" for ${v.nodes.length} node(s) at ${tag}. Is it a real problem?`,
        ['Yes — a barrier', 'No — false alarm', 'Needs manual check'],
        'Inspect the flagged nodes; often colour-on-image contrast or ambiguous ARIA.',
        (v.nodes || []).slice(0, 5).map(n => n.target?.join(' ')));
    }
  } catch (e) { add('n/a', 'axe', 'error', String(e)); }
}

// ---- 2. Keyboard traversal + trap detection (2.1.1, 2.1.2, 2.4.3) ----
async function keyboardPass(page) {
  try {
    const interactiveCount = await page.evaluate(() =>
      document.querySelectorAll('a[href],button,input,select,textarea,[tabindex],[role=button],[role=link],[contenteditable=true]').length);
    await page.evaluate(() => (document.activeElement && document.activeElement.blur?.()));
    await page.keyboard.press('Tab');
    const stops = [];
    const MAX = Math.min(interactiveCount * 2 + 20, 400);
    let repeats = 0;
    for (let i = 0; i < MAX; i++) {
      const cur = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          name: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('alt') || el.value || '').trim().slice(0, 40),
          rect: { x: r.x, y: r.y, w: r.width, h: r.height },
          key: el.tagName + '#' + (el.id || '') + '.' + (el.className || '').toString().slice(0, 30) + '@' + Math.round(r.x) + ',' + Math.round(r.y),
        };
      });
      if (cur) {
        if (stops.length && stops[stops.length - 1].key === cur.key) { repeats++; if (repeats > 3) break; }
        else repeats = 0;
        stops.push(cur);
      }
      await page.keyboard.press('Tab');
    }
    const uniqueKeys = new Set(stops.map(s => s.key));
    add('2.1.1', 'kbd:reachability', uniqueKeys.size >= interactiveCount ? 'pass' : 'warn',
      `Tab reached ${uniqueKeys.size} distinct stops vs ${interactiveCount} interactive elements in DOM. ` +
      (uniqueKeys.size < interactiveCount ? 'Some interactive elements may be keyboard-unreachable.' : 'All appear reachable.'));
    if (repeats > 3) add('2.1.2', 'kbd:trap', 'fail', 'Focus stopped advancing (possible keyboard trap).');
    else add('2.1.2', 'kbd:trap', 'pass', 'No keyboard trap detected in traversal.');

    // focus order vs visual order (top-to-bottom, left-to-right for LTR)
    const outOfOrder = stops.filter((s, i) => i > 0 &&
      (s.rect.y < stops[i - 1].rect.y - 20)).length;
    add('2.4.3', 'kbd:order', outOfOrder > 1 ? 'warn' : 'pass',
      `${outOfOrder} focus step(s) move upward against visual flow — review whether order preserves meaning.`);
    return stops;
  } catch (e) { add('2.1.1', 'kbd', 'error', String(e)); return []; }
}

// ---- 3. Focus visible + not obscured (2.4.7, 2.4.11) ----
async function focusPass(page, stops) {
  let checked = 0, invisible = 0, obscured = 0;
  for (const s of stops.slice(0, 25)) {
    try {
      // screenshot the element region unfocused vs focused
      const clip = { x: Math.max(0, s.rect.x - 4), y: Math.max(0, s.rect.y - 4), width: s.rect.w + 8, height: s.rect.h + 8 };
      if (clip.width < 2 || clip.height < 2) continue;
      await page.evaluate(() => document.activeElement?.blur?.());
      const before = decodePNG(await page.screenshot({ clip }));
      await page.evaluate((k) => {
        const els = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex],[role=button]')];
        const el = els.find(e => { const r = e.getBoundingClientRect(); return (e.tagName + '#' + (e.id || '') + '.' + (e.className || '').toString().slice(0,30) + '@' + Math.round(r.x) + ',' + Math.round(r.y)) === k; });
        el?.focus?.();
      }, s.key);
      const after = decodePNG(await page.screenshot({ clip }));
      checked++;
      if (before && after) {
        const frac = pixelDiffFraction(before.data, after.data);
        if (!hasVisibleFocusChange(frac)) { invisible++; }
      }
      // obscured check: is the focused element the topmost at its centre?
      const isTop = await page.evaluate((r) => {
        const el = document.elementFromPoint(r.x + r.w / 2, r.y + r.h / 2);
        return el ? (el === document.activeElement || document.activeElement?.contains(el) || el.contains(document.activeElement)) : true;
      }, s.rect);
      if (!isTop) obscured++;
    } catch { /* skip element */ }
  }
  add('2.4.7', 'focus:visible', invisible === 0 ? 'pass' : 'fail',
    `${invisible}/${checked} sampled focus stops showed no visible focus change (likely outline:none with no replacement).`);
  add('2.4.11', 'focus:obscured', obscured === 0 ? 'pass' : 'fail',
    `${obscured}/${checked} focused elements were obscured (e.g. hidden behind a sticky header).`);
}

// ---- 4. Reflow + text spacing (1.4.10, 1.4.12) ----
async function reflowPass(page, url) {
  try {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.waitForTimeout(300);
    const horiz = await page.evaluate(() => document.scrollingElement.scrollWidth > document.scrollingElement.clientWidth + 2);
    add('1.4.10', 'reflow:320', horiz ? 'fail' : 'pass',
      horiz ? 'Horizontal scrolling required at 320px width (content does not reflow).' : 'No horizontal scroll at 320px.');
    // text spacing overrides
    await page.addStyleTag({ content: `* {line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important;} p{margin-bottom:2em !important;}` });
    await page.waitForTimeout(200);
    const clipped = await page.evaluate(() => {
      let n = 0;
      for (const el of document.querySelectorAll('p,span,a,li,button,h1,h2,h3,h4,label')) {
        if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') n++;
      }
      return n;
    });
    add('1.4.12', 'text-spacing', clipped > 0 ? 'warn' : 'pass',
      `${clipped} element(s) clip/overflow after WCAG text-spacing overrides — verify no content is lost.`);
    await page.setViewportSize({ width: 1280, height: 900 });
  } catch (e) { add('1.4.10', 'reflow', 'error', String(e)); }
}

// ---- 5. Target size (2.5.8) ----
async function targetSizePass(page) {
  try {
    const targets = await page.evaluate(() => {
      const els = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,[role=button],[role=link],[onclick]')];
      return els.map(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, name: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30) }; })
                .filter(t => t.w > 0 && t.h > 0);
    });
    let fails = 0;
    for (const t of targets) {
      if (t.w >= 24 && t.h >= 24) continue;
      // nearest-neighbour spacing (centre distance) to apply the exception
      let minGap = Infinity;
      for (const o of targets) {
        if (o === t) continue;
        const dx = (t.x + t.w / 2) - (o.x + o.w / 2), dy = (t.y + t.h / 2) - (o.y + o.h / 2);
        minGap = Math.min(minGap, Math.hypot(dx, dy));
      }
      if (!evaluateTargetSize({ width: t.w, height: t.h }, minGap).pass) fails++;
    }
    add('2.5.8', 'target-size', fails === 0 ? 'pass' : 'fail',
      `${fails} pointer target(s) under 24×24 CSS px without adequate spacing.`);
  } catch (e) { add('2.5.8', 'target-size', 'error', String(e)); }
}

// ---- 6. Label in name (2.5.3) + accessibility-tree name/role audit (4.1.2) ----
async function a11yTreePass(page) {
  try {
    const snap = await page.accessibility.snapshot({ interestingOnly: true });
    let missingName = 0, total = 0;
    const interactiveRoles = new Set(['button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'menuitem', 'switch', 'slider', 'tab', 'searchbox']);
    (function walk(node) {
      if (!node) return;
      if (interactiveRoles.has(node.role)) { total++; if (!node.name || !node.name.trim()) missingName++; }
      (node.children || []).forEach(walk);
    })(snap);
    add('4.1.2', 'a11y-tree:name', missingName === 0 ? 'pass' : 'fail',
      `${missingName}/${total} interactive nodes in the accessibility tree have no accessible name (screen readers announce nothing useful).`);

    // label-in-name: compare visible text to accessible name for controls with visible text
    const li = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('button,a[href],[role=button],[role=link]')) {
        const visible = (el.textContent || '').trim();
        const acc = (el.getAttribute('aria-label') || el.getAttribute('title') || visible).trim();
        if (visible) out.push({ visible: visible.slice(0, 40), acc: acc.slice(0, 60) });
      }
      return out;
    });
    const mismatches = li.filter(x => !nameContainsVisible(x.acc, x.visible));
    add('2.5.3', 'label-in-name', mismatches.length === 0 ? 'pass' : 'fail',
      `${mismatches.length} control(s) whose accessible name omits their visible label (breaks voice control).` +
      (mismatches[0] ? ` e.g. visible "${mismatches[0].visible}" vs name "${mismatches[0].acc}".` : ''));
  } catch (e) { add('4.1.2', 'a11y-tree', 'error', String(e)); }
}

// ---- 7. User preferences (reduced motion, forced colors) — screenshot for agent/human confirm ----
async function preferencesPass(page, url) {
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'networkidle' });
    const rm = await shot(page, 'reduced-motion');
    ask('2.3.3/2.2.2', 'With prefers-reduced-motion enabled, are large/auto animations actually reduced or stopped?',
      ['Yes', 'No — still animating', 'No animations on page'], 'Compare against the default render; parallax/auto-carousels are common offenders.', [url], rm);
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: null });
    await page.reload({ waitUntil: 'networkidle' });
    const fc = await shot(page, 'forced-colors');
    ask('1.4.1/1.4.11', 'In forced-colors (high-contrast) mode, do all controls, icons, and focus indicators remain visible?',
      ['Yes', 'No — content disappears'], 'Buttons drawn with background images/box-shadow often vanish in forced-colors.', [url], fc);
    await page.emulateMedia({ forcedColors: null });
  } catch (e) { add('1.4.1', 'preferences', 'error', String(e)); }
}

// ---- 8. Accessible authentication: paste blocking (3.3.8) ----
async function authPass(page) {
  try {
    const pw = await page.$('input[type=password]');
    if (!pw) { add('3.3.8', 'auth:paste', 'n/a', 'No password field on this page.'); return; }
    await pw.focus();
    const blocked = await page.evaluate(() => {
      const el = document.querySelector('input[type=password]');
      let prevented = false;
      const h = (e) => { if (e.defaultPrevented) prevented = true; };
      el.addEventListener('paste', h);
      const ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
      el.dispatchEvent(ev);
      el.removeEventListener('paste', h);
      // also detect explicit onpaste="return false"
      return prevented || el.getAttribute('onpaste')?.includes('false') || false;
    });
    add('3.3.8', 'auth:paste', blocked ? 'fail' : 'pass',
      blocked ? 'Password field appears to block paste — breaks password managers (cognitive-function barrier).' : 'Password field allows paste.');
  } catch (e) { add('3.3.8', 'auth', 'error', String(e)); }
}

// ---- 9. Contrast (1.4.3, 1.4.11) — real computation, not a manual question.
async function contrastPass(page) {
  try {
    const candidates = await page.evaluate(() => {
      const out = [];
      const isVisible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        return r.width > 4 && r.height > 4 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
      // A "non-solid background" isn't just CSS background-image — the far more common modern pattern
      // (Next.js <Image>, plain <img>, <picture>, <video>) is an image ELEMENT stacked behind text via
      // absolute positioning or grid/flex layering. Check both: walk ancestors for background-image,
      // AND sample elementsFromPoint under the text box for an image/video element in the stack.
      const hasImageInStack = (r) => {
        const pts = [[r.x + 2, r.y + 2], [r.x + r.width - 2, r.y + 2], [r.x + 2, r.y + r.height - 2], [r.x + r.width / 2, r.y + r.height / 2]];
        for (const [px, py] of pts) {
          if (px < 0 || py < 0 || px > innerWidth || py > innerHeight) continue;
          const stack = document.elementsFromPoint(px, py);
          for (const stackEl of stack) {
            if (stackEl.tagName === 'IMG' || stackEl.tagName === 'PICTURE' || stackEl.tagName === 'VIDEO' || stackEl.tagName === 'CANVAS') return true;
          }
        }
        return false;
      };
      for (const el of document.querySelectorAll('p,span,a,button,h1,h2,h3,h4,h5,h6,li,label,div')) {
        const text = (el.textContent || '').trim();
        if (!text || text.length > 200) continue;
        if (el.children.length > 2) continue;
        if (!isVisible(el)) continue;
        let overNonSolid = false, node = el, depth = 0;
        while (node && depth < 4) {
          const cs = getComputedStyle(node);
          if (cs.backgroundImage && cs.backgroundImage !== 'none') { overNonSolid = true; break; }
          node = node.parentElement; depth++;
        }
        const r = el.getBoundingClientRect();
        if (!overNonSolid) overNonSolid = hasImageInStack(r);
        if (!overNonSolid) continue;
        const cs = getComputedStyle(el);
        out.push({
          x: r.x, y: r.y, w: r.width, h: r.height,
          color: cs.color, fontSize: parseFloat(cs.fontSize), bold: parseInt(cs.fontWeight) >= 700 || cs.fontWeight === 'bold',
          snippet: text.slice(0, 40),
        });
      }
      return out.slice(0, 20);
    });
    let auto = 0, escalated = 0;
    for (const c of candidates) {
      try {
        const clip = { x: Math.max(0, c.x), y: Math.max(0, c.y), width: Math.max(2, c.w), height: Math.max(2, c.h) };
        const png = decodePNG(await page.screenshot({ clip }));
        if (!png) continue;
        const pts = [[1,1],[png.width-2,1],[1,png.height-2],[png.width-2,png.height-2],[Math.floor(png.width/2),1]]
          .filter(([x,y]) => x >= 0 && y >= 0 && x < png.width && y < png.height);
        const samples = pts.map(([x,y]) => { const i = (png.width*y+x)<<2; return { r: png.data[i], g: png.data[i+1], b: png.data[i+2] }; });
        const textColor = parseColor(c.color);
        if (!textColor || samples.length === 0) continue;
        const result = autoContrastOverRegion(textColor, samples, c.fontSize, c.bold);
        if (result.escalate) {
          escalated++;
          const shotPath = await shot(page, `contrast-${c.snippet}`);
          ask('1.4.3/1.4.11', `Text over an image/gradient ("${c.snippet}") — estimated contrast ${result.ratio ?? '?'}:1 ` +
            `(need ${result.required ?? (result.reason ? 'n/a — ' + result.reason : '?')}). Is it clearly readable at its worst point?`,
            ['Yes, readable', 'No / too low', 'Show me again'],
            result.reason === 'busy/varied background' ? 'Background too varied to estimate reliably — please eyeball the worst spot.'
              : 'Estimate is near the legal threshold — please confirm.',
            [c.snippet], shotPath);
        } else {
          auto++;
          add('1.4.3', 'contrast:over-image', result.pass ? 'pass' : 'fail',
            `"${c.snippet}" over image/gradient: estimated ${result.ratio}:1 (need ${result.required}:1, ${result.large ? 'large' : 'normal'} text).`);
        }
      } catch { /* skip this element */ }
    }
    add('1.4.3', 'contrast:summary', 'pass',
      `Solid-background text contrast: see axe color-contrast results above (not duplicated here). ` +
      `Text-over-image/gradient: ${candidates.length} candidate(s) found, ${auto} auto-resolved, ${escalated} escalated.`);
  } catch (e) { add('1.4.3', 'contrast', 'error', String(e)); }
}

// ---- 10. Content on hover/focus (1.4.13) — scripted, not a manual question.
async function hoverFocusPass(page) {
  try {
    const triggers = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('[aria-describedby],[aria-haspopup],[data-tooltip],[title]').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) out.push({
          x: r.x + r.width / 2, y: r.y + r.height / 2,
          describedby: el.getAttribute('aria-describedby'),
          label: (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 30),
        });
      });
      return out.slice(0, 15);
    });
    if (triggers.length === 0) { add('1.4.13', 'hover-focus', 'n/a', 'No hover/focus-triggered content detected.'); return; }
    let dismissFails = 0, persistFails = 0, checked = 0, unscriptable = 0;
    for (const t of triggers) {
      if (!t.describedby) {
        // Scriptable only via the aria-describedby relationship (we need an id to poll for
        // visibility). aria-haspopup/title/data-tooltip triggers without it are REAL candidates the
        // harness detected but cannot verify Escape-dismiss/persist behaviour for — surface them
        // rather than silently dropping, so they don't disappear as false "nothing to see" negatives.
        unscriptable++;
        if (unscriptable <= 5) {
          try {
            await page.mouse.move(t.x, t.y);
            await page.waitForTimeout(300);
            const shotPath = await shot(page, `hover-${t.label || 'trigger'}`);
            ask('1.4.13', `A possible hover/focus popup trigger ("${t.label || 'unlabelled'}") was found but its popup ` +
              `couldn't be script-verified (no aria-describedby link to poll). Does it dismiss with Escape and stay ` +
              `open while you move the pointer onto it?`,
              ['Yes, dismisses & persists correctly', 'No, fails one or both', 'No popup actually appears'],
              'Native title tooltips and non-ARIA hover popups are common gaps — worth a manual glance.',
              [t.label], shotPath);
          } catch { /* best-effort screenshot only */ }
        }
        continue;
      }
      try {
        await page.mouse.move(t.x, t.y);
        await page.waitForTimeout(300);
        const visibleAfterHover = await page.evaluate((id) => {
          const el = document.getElementById(id); if (!el) return null;
          const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
          return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0;
        }, t.describedby);
        if (visibleAfterHover === null) continue;
        checked++;
        if (visibleAfterHover) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
          const visibleAfterEsc = await page.evaluate((id) => {
            const el = document.getElementById(id); if (!el) return null;
            const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none';
          }, t.describedby);
          if (visibleAfterEsc) dismissFails++;
          await page.mouse.move(t.x, t.y); await page.waitForTimeout(300);
          const popupBox = await page.evaluate((id) => { const el = document.getElementById(id); if (!el) return null;
            const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, t.describedby);
          if (popupBox) {
            await page.mouse.move(popupBox.x, popupBox.y);
            await page.waitForTimeout(200);
            const stillVisible = await page.evaluate((id) => { const el = document.getElementById(id); if (!el) return null;
              const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none'; }, t.describedby);
            if (!stillVisible) persistFails++;
          }
        }
      } catch { /* skip this trigger */ }
    }
    if (checked > 0) {
      add('1.4.13', 'hover-focus:dismiss', dismissFails === 0 ? 'pass' : 'fail',
        `${dismissFails}/${checked} hover/focus popup(s) did not dismiss on Escape.`);
      add('1.4.13', 'hover-focus:persist', persistFails === 0 ? 'pass' : 'fail',
        `${persistFails}/${checked} hover/focus popup(s) disappeared when the pointer moved onto them (not hoverable).`);
    }
    if (unscriptable > 0) {
      add('1.4.13', 'hover-focus:unscriptable', 'warn',
        `${unscriptable} additional hover/focus trigger(s) found that couldn't be script-verified` +
        (unscriptable > 5 ? ` (only the first 5 were escalated as questions — the rest need a manual pass too).` : '.'));
    }
  } catch (e) { add('1.4.13', 'hover-focus', 'error', String(e)); }
}

// ---- 11. Structure basics that the a11y tree/axe under-report (title, lang, headings, skip link) ----
async function structurePass(page) {
  try {
    const s = await page.evaluate(() => {
      const h = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(e => +e.tagName[1]);
      let skips = 0; for (let i = 1; i < h.length; i++) if (h[i] > h[i - 1] + 1) skips++;
      const first = document.querySelector('a[href^="#"]');
      return {
        title: document.title.trim(), lang: document.documentElement.lang.trim(),
        h1: h.filter(x => x === 1).length, skips,
        skipLink: !!(first && /skip|sprung|zum inhalt|main/i.test(first.textContent || '')),
        landmarks: !!document.querySelector('main,[role=main]'),
      };
    });
    add('2.4.2', 'structure:title', s.title ? 'pass' : 'fail', s.title ? `Title: "${s.title}"` : 'Missing page title.');
    add('3.1.1', 'structure:lang', s.lang ? 'pass' : 'fail', s.lang ? `lang="${s.lang}"` : 'Missing html lang.');
    add('1.3.1', 'structure:headings', s.h1 === 1 && s.skips === 0 ? 'pass' : 'warn',
      `${s.h1} h1, ${s.skips} skipped level(s). ${s.landmarks ? 'main landmark present.' : 'No main landmark (best practice).'}`);
    add('2.4.1', 'structure:skip-link', s.skipLink || s.landmarks ? 'pass' : 'warn',
      s.skipLink ? 'Skip link found.' : (s.landmarks ? 'No skip link but landmarks present.' : 'No skip link or main landmark.'));
  } catch (e) { add('1.3.1', 'structure', 'error', String(e)); }
}

// ---- 12. Legal-link presence (BFSG §14 statement, feedback mechanism) — EXISTENCE only.
// This can never confirm the statement's CONTENT is complete/current (that's G23 in guided-review.md)
// — it only saves the human from manually hunting for the link, which is real but modest value: a
// found-vs-not-found signal, not a compliance verdict.
async function legalLinksPass(page) {
  try {
    const found = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a[href]')];
      const test = (re) => links.find(a => re.test(a.textContent || '') || re.test(a.getAttribute('href') || ''));
      return {
        statement: !!test(/barrierefrei|accessibility.?statement|erkl(ä|ae)rung.?zur.?barrierefreiheit/i),
        feedback: !!test(/feedback|kontakt|barriere.?melden|report.*(issue|problem|barrier)/i),
      };
    });
    add('BFSG-statement', 'legal:statement-link', found.statement ? 'pass' : 'warn',
      found.statement ? 'A link matching "accessibility statement / Barrierefreiheit" was found — verify its content against G23.'
                       : 'No link matching an accessibility statement was found on this page — check site-wide (e.g. footer on other templates) before concluding it is absent.');
    add('BFSG-feedback', 'legal:feedback-link', found.feedback ? 'pass' : 'warn',
      found.feedback ? 'A contact/feedback link was found — verify it is itself accessible (G24).'
                      : 'No obvious feedback/contact link found on this page.');
  } catch (e) { add('BFSG-statement', 'legal-links', 'error', String(e)); }
}

// ---- Carousel / auto-advancing content pause control (2.2.2 Pause, Stop, Hide) — distinct from
// reduced-motion response (preferencesPass): this checks whether genuinely auto-rotating content has
// a pause/stop control at all, independent of the prefers-reduced-motion media query. DOM markers
// alone can't prove something auto-advances, so this OBSERVES real behaviour: snapshot candidate
// carousel-like structures, wait, snapshot again, and only judge ones that actually changed on their
// own. Structures that didn't visibly change in the observation window are neither accused nor
// cleared — they're escalated, since a slower rotation interval can't be ruled out from a short watch.
async function carouselPausePass(page) {
  try {
    const candidates = await page.evaluate(() => {
      const selectors = ['[aria-roledescription="carousel"]', '.carousel', '.swiper', '.splide',
        '.slick-slider', '[data-carousel]', '[class*="carousel" i]', '[class*="slider" i]'];
      const seen = new Set(), out = [];
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach(el => {
          if (seen.has(el)) return; seen.add(el);
          const r = el.getBoundingClientRect();
          if (r.width < 40 || r.height < 40) return;
          out.push(sel);
        });
      }
      return out.slice(0, 8);
    });
    if (candidates.length === 0) {
      add('2.2.2', 'carousel-pause', 'n/a', 'No carousel/auto-advancing structure detected.');
      return;
    }
    const snapshot = async () => page.evaluate((sels) => sels.map(sel => {
      const el = document.querySelector(sel);
      return el ? el.innerHTML.slice(0, 300) : null;
    }), candidates);
    const before = await snapshot();
    await page.waitForTimeout(6000);
    const after = await snapshot();

    let autoAdvancing = 0, missingControl = 0, uncertain = [];
    for (let i = 0; i < candidates.length; i++) {
      const changed = before[i] !== null && after[i] !== null && before[i] !== after[i];
      if (!changed) { uncertain.push(candidates[i]); continue; }
      autoAdvancing++;
      const hasControl = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const scope = el.closest('section,div,article') || el;
        for (const c of scope.querySelectorAll('button,[role=button],a')) {
          const name = (c.getAttribute('aria-label') || c.textContent || c.getAttribute('title') || '').toLowerCase();
          if (/pause|stop|anhalten|pausieren|stopp/.test(name)) return true;
        }
        return false;
      }, candidates[i]);
      if (hasControl === false) missingControl++;
    }
    if (missingControl > 0) {
      add('2.2.2', 'carousel-pause', 'fail',
        `${missingControl} of ${autoAdvancing} observed auto-advancing carousel(s) have no detectable pause/stop control (6s observation window).`);
    } else if (autoAdvancing > 0) {
      add('2.2.2', 'carousel-pause', 'pass',
        `${autoAdvancing} auto-advancing carousel(s) observed; all had a detectable pause/stop control.`);
    }
    if (uncertain.length > 0) {
      ask('2.2.2', `Found ${uncertain.length} carousel/slider-like structure(s) that did not visibly change in a ` +
        `6-second observation window — could be manual-only (fine) or auto-advance on a slower interval. ` +
        `Does it auto-rotate, and if so, is there a visible pause/stop control?`,
        ['Manual only, no issue', 'Auto-advances with a pause control', 'Auto-advances with NO pause control'],
        'A 6-second window can miss slower rotation intervals — worth a manual glance on a hero carousel.',
        uncertain);
    }
  } catch (e) { add('2.2.2', 'carousel-pause', 'error', String(e)); }
}

// ---- flow action runner (shared with run-flow schema) ----
async function doAction(page, a) {
  if (a.goto) return page.goto(a.goto, { waitUntil: 'networkidle' });
  if (a.click) return page.click(a.click);
  if (a.fill) return page.fill(a.fill[0], a.fill[1]);
  if (a.select) return page.selectOption(a.select[0], a.select[1]);
  if (a.check) return page.check(a.check);
  if (a.press) return Array.isArray(a.press) ? page.press(a.press[0], a.press[1]) : page.keyboard.press(a.press);
  if (a.waitFor) return page.waitForSelector(a.waitFor, { timeout: 30000 });
  if (a.wait) return page.waitForTimeout(a.wait);
  throw new Error(`Unknown action ${JSON.stringify(a)}`);
}

async function runBattery(page, label, url) {
  console.log(`\n▶ battery @ ${label}`);
  await axePass(page, label);
  const stops = await keyboardPass(page);
  await focusPass(page, stops);
  await structurePass(page);
  await a11yTreePass(page);
  await targetSizePass(page);
  await contrastPass(page);
  await hoverFocusPass(page);
  await legalLinksPass(page);
  await carouselPausePass(page);
  await authPass(page);
  await reflowPass(page, url);        // mutates viewport last; keep near end
  await preferencesPass(page, url);   // reloads; keep last
}

// ---- main ----
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const report = { scannedAt: new Date().toISOString(), mode: arg === '--flow' ? 'flow' : 'page', results: R, humanConfirmations: CONFIRM };

try {
  if (arg === '--flow') {
    const flow = JSON.parse(readFileSync(process.argv[3], 'utf8'));
    report.flow = flow.name; report.start = flow.start;
    await page.goto(flow.start, { waitUntil: 'networkidle', timeout: 60000 });
    await runBattery(page, 'start', flow.start);
    for (const [i, step] of (flow.steps || []).entries()) {
      for (const act of step.actions || []) await doAction(page, act);
      await page.waitForLoadState('networkidle').catch(() => {});
      await runBattery(page, step.name || `step-${i + 1}`, page.url());
    }
  } else {
    report.url = arg;
    await page.goto(arg, { waitUntil: 'networkidle', timeout: 60000 });
    await runBattery(page, 'page', arg);
  }
} catch (e) {
  report.error = String(e);
  console.error(`\nAborted: ${e}\n(An unexecutable step can itself be an accessibility barrier — inspect before dismissing.)`);
}
await browser.close();

const counts = R.reduce((m, r) => (m[r.status] = (m[r.status] || 0) + 1, m), {});
report.summary = { ...counts, humanConfirmations: CONFIRM.length };
const name = (report.flow || 'page-audit').replace(/[^a-z0-9]+/gi, '-');
writeFileSync(`${OUT}/${name}.json`, JSON.stringify(report, null, 2));

console.log(`\n── Summary ──`);
console.log(`fail: ${counts.fail || 0} · warn: ${counts.warn || 0} · pass: ${counts.pass || 0} · error: ${counts.error || 0}`);
console.log(`human confirmations needed: ${CONFIRM.length}  → answer these instead of running procedures`);
console.log(`report: ${OUT}/${name}.json (+ screenshots)`);
console.log(`\nThis harness automates the objectively-decidable checks. Items in humanConfirmations require`);
console.log(`vision/judgement — an agent with screenshots can resolve most; the rest are one-tap questions.`);
console.log(`Not covered: real screen-reader announcement quality, caption accuracy, cross-origin iframes,`);
console.log(`seizure-level flashing, cognitive load. See references/automation.md for the coverage ceiling.`);
process.exit(report.error || (counts.fail || 0) > 0 ? 1 : 0);
