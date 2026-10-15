// Pure, browser-independent helpers for the audit harness. No DOM, no I/O — unit-testable in node.
// The Playwright harness extracts raw values from the page (computed colors, bounding rects,
// accessible names) and feeds them here for the actual accessibility maths/logic.

// ---------- colour + contrast (WCAG 1.4.3 / 1.4.11) ----------

/** Parse "rgb(r,g,b)", "rgba(r,g,b,a)", or "#rrggbb"/"#rgb" into {r,g,b,a}. Returns null if unparseable. */
export function parseColor(str) {
  if (!str) return null;
  str = str.trim();
  const hex = str.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
  }
  const m = str.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const p = m[1].split(',').map(s => parseFloat(s.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
  }
  return null;
}

/** Alpha-composite a foreground colour over a background (both {r,g,b,a}). Returns opaque {r,g,b}. */
export function composite(fg, bg) {
  const a = fg.a === undefined ? 1 : fg.a;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  };
}

function channel(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of an opaque {r,g,b}. */
export function relativeLuminance({ r, g, b }) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two opaque colours. Returns a number ≥ 1. */
export function contrastRatio(c1, c2) {
  const l1 = relativeLuminance(c1), l2 = relativeLuminance(c2);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Is text "large" per WCAG? ≥ 24px, or ≥ 18.66px (14pt) bold. */
export function isLargeText(fontSizePx, bold) {
  return fontSizePx >= 24 || (bold && fontSizePx >= 18.66);
}

/** Evaluate text contrast. Returns {ratio, required, pass, large}. */
export function evaluateTextContrast(ratio, fontSizePx, bold) {
  const large = isLargeText(fontSizePx, bold);
  const required = large ? 3.0 : 4.5;
  return { ratio: Math.round(ratio * 100) / 100, required, pass: ratio >= required - 1e-9, large };
}

// ---------- target size (WCAG 2.5.8) ----------

/** rect: {width,height}. spacingPx: measured gap to nearest target. Default 0 = assume adjacent
 *  (conservative: an isolated small target only passes when the harness supplies real spacing). */
export function evaluateTargetSize(rect, spacingPx = 0) {
  const big = rect.width >= 24 && rect.height >= 24;
  if (big) return { pass: true, reason: '≥24×24' };
  if (spacingPx >= 24) return { pass: true, reason: 'small but ≥24px spacing (exception)' };
  return { pass: false, reason: `${Math.round(rect.width)}×${Math.round(rect.height)}px, spacing ${Math.round(spacingPx)}px` };
}

// ---------- label in name (WCAG 2.5.3) ----------

export function normalizeText(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Accessible name must contain the visible label text. Returns true if satisfied or N/A. */
export function nameContainsVisible(accName, visibleText) {
  const v = normalizeText(visibleText);
  if (!v) return true; // no visible text → criterion doesn't apply
  return normalizeText(accName).includes(v);
}

// ---------- focus indicator change (WCAG 2.4.7) ----------

/** Fraction of differing pixels between two equal-length RGBA buffers. */
export function pixelDiffFraction(bufA, bufB) {
  if (!bufA || !bufB || bufA.length !== bufB.length || bufA.length === 0) return 0;
  let diff = 0;
  for (let i = 0; i < bufA.length; i += 4) {
    if (bufA[i] !== bufB[i] || bufA[i + 1] !== bufB[i + 1] || bufA[i + 2] !== bufB[i + 2]) diff++;
  }
  return diff / (bufA.length / 4);
}

/** A visible focus indicator should change a meaningful fraction of the element's pixels. */
export function hasVisibleFocusChange(diffFraction, threshold = 0.02) {
  return diffFraction >= threshold;
}

// ---------- background sampling for contrast over images/gradients ----------

/** Mean + population variance (per-channel, summed) of an array of {r,g,b} samples. */
export function sampleStats(samples) {
  const n = samples.length;
  if (n === 0) return { avg: { r: 0, g: 0, b: 0 }, variance: Infinity };
  const avg = samples.reduce((a, s) => ({ r: a.r + s.r / n, g: a.g + s.g / n, b: a.b + s.b / n }), { r: 0, g: 0, b: 0 });
  const variance = samples.reduce((v, s) =>
    v + ((s.r - avg.r) ** 2 + (s.g - avg.g) ** 2 + (s.b - avg.b) ** 2) / n, 0);
  return { avg, variance };
}

export function backgroundConfidence(samples, threshold = 4800) {
  const { avg, variance } = sampleStats(samples);
  return { avg, variance, confident: variance <= threshold };
}

export function autoContrastOverRegion(textColor, bgSamples, fontSizePx, bold) {
  const { avg, variance, confident } = backgroundConfidence(bgSamples);
  if (!confident) return { escalate: true, reason: 'busy/varied background', variance };
  const ratio = contrastRatio(textColor, avg);
  const evalResult = evaluateTextContrast(ratio, fontSizePx, bold);
  const nearBoundary = Math.abs(evalResult.ratio - evalResult.required) < 0.3;
  return { escalate: nearBoundary, ...evalResult, estimatedBg: avg, variance };
}
