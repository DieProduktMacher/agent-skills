#!/usr/bin/env python3
"""Offline structural accessibility auditor for static HTML.

Checks the machine-verifiable subset of WCAG 2.2 A/AA that can be assessed from markup alone —
no browser, no network. Intended for auditing uploaded HTML files inside a sandbox. It does NOT
evaluate colour contrast, keyboard behaviour, focus management, reading order as rendered, or the
*quality* of alt/label text — those require the manual and assistive-technology passes described in
the skill. Treat a clean run as "no structural red flags", never as "accessible".

Usage:
    python3 audit_static_html.py <file-or-dir> [more files/dirs ...] [--json] [--fail-on serious]

Exit code is non-zero if findings at/above --fail-on severity exist (useful in CI).
Dependencies: beautifulsoup4  (pip install --break-system-packages beautifulsoup4)
"""
from __future__ import annotations
import argparse, json, os, re, sys, glob
from dataclasses import dataclass, asdict, field

try:
    from bs4 import BeautifulSoup
except ImportError:
    sys.stderr.write("Missing dependency. Run: pip install --break-system-packages beautifulsoup4\n")
    sys.exit(2)

SEVERITY_ORDER = {"critical": 3, "serious": 2, "moderate": 1, "minor": 0}


@dataclass
class Finding:
    sc: str            # WCAG success criterion
    level: str         # A / AA
    severity: str      # critical / serious / moderate / minor
    rule: str          # short rule id
    message: str
    location: str      # tag + snippet
    line: int | None = None


def snip(tag, n: int = 90) -> str:
    s = " ".join(str(tag).split())
    return s[:n] + ("…" if len(s) > n else "")


def acc_name_present(tag, soup) -> bool:
    """Heuristic: does a control have a programmatic accessible name?"""
    if tag.get("aria-label", "").strip():
        return True
    lb = tag.get("aria-labelledby")
    if lb and any(soup.find(id=i) for i in lb.split()):
        return True
    if tag.get("title", "").strip():
        return True
    tid = tag.get("id")
    if tid and soup.find("label", attrs={"for": tid}):
        return True
    # wrapped in a <label>?
    if tag.find_parent("label") is not None:
        return True
    return False


def audit(html: str, path: str) -> list[Finding]:
    soup = BeautifulSoup(html, "html.parser")
    f: list[Finding] = []

    # 3.1.1 Language of Page
    html_tag = soup.find("html")
    if html_tag is None or not (html_tag.get("lang") or "").strip():
        f.append(Finding("3.1.1 Language of Page", "A", "serious", "html-lang",
                         "<html> has no lang attribute — screen readers can't pick the right voice/pronunciation.",
                         "<html>", getattr(html_tag, "sourceline", None) if html_tag else None))

    # 3.1.1 — lang present but not a plausible BCP-47 tag (e.g. lang="deutsch")
    if html_tag is not None:
        lang = (html_tag.get("lang") or "").strip()
        if lang and not re.fullmatch(r"[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*", lang):
            f.append(Finding("3.1.1 Language of Page", "A", "serious", "html-lang-invalid",
                             f'lang="{lang}" is not a valid language tag (use e.g. "de" or "de-DE").',
                             "<html>", getattr(html_tag, "sourceline", None)))

    # 2.4.2 Page Titled
    title = soup.find("title")
    if title is None or not title.get_text(strip=True):
        f.append(Finding("2.4.2 Page Titled", "A", "serious", "page-title",
                         "Missing or empty <title> — users can't distinguish pages/tabs.", "<head>",
                         getattr(title, "sourceline", None) if title else None))

    # 1.1.1 Non-text Content — images without alt attribute at all
    for img in soup.find_all("img"):
        if img.get("alt") is None and (img.get("role") != "presentation" and img.get("aria-hidden") != "true"):
            f.append(Finding("1.1.1 Non-text Content", "A", "serious", "img-alt",
                             "Image has no alt attribute. Add descriptive alt, or alt=\"\" if decorative.",
                             snip(img), img.sourceline))
    # <input type=image> and <area> need alt/name too
    for el in soup.find_all(["area"]):
        if not (el.get("alt") or el.get("aria-label")):
            f.append(Finding("1.1.1 Non-text Content", "A", "serious", "area-alt",
                             "<area> has no alt/aria-label.", snip(el), el.sourceline))
    for el in soup.find_all("input", attrs={"type": "image"}):
        if not (el.get("alt") or el.get("aria-label") or el.get("title")):
            f.append(Finding("1.1.1 Non-text Content", "A", "serious", "input-image-alt",
                             "Image button (input type=image) has no text alternative.", snip(el), el.sourceline))

    # 3.3.2 / 1.3.1 / 4.1.2 Form controls need an accessible name
    for ctrl in soup.find_all(["input", "select", "textarea"]):
        t = (ctrl.get("type") or "text").lower()
        if ctrl.name == "input" and t in ("hidden", "submit", "reset", "button", "image"):
            continue
        if not acc_name_present(ctrl, soup):
            only_placeholder = bool(ctrl.get("placeholder", "").strip())
            msg = ("Form control has no programmatic label" +
                   (" (placeholder is not a label)." if only_placeholder else "."))
            f.append(Finding("3.3.2 Labels or Instructions", "A", "serious", "control-label",
                             msg, snip(ctrl), ctrl.sourceline))

    # 4.1.2 / 2.4.4 Buttons and links need an accessible name
    for a in soup.find_all("a"):
        if a.get("href") is None:
            continue
        text = a.get_text(strip=True)
        has_img_alt = any((im.get("alt") or "").strip() for im in a.find_all("img"))
        if not text and not has_img_alt and not (a.get("aria-label") or a.get("title") or a.get("aria-labelledby")):
            f.append(Finding("2.4.4 Link Purpose", "A", "serious", "empty-link",
                             "Link has no discernible text.", snip(a), a.sourceline))
    for b in soup.find_all("button"):
        text = b.get_text(strip=True)
        has_img_alt = any((im.get("alt") or "").strip() for im in b.find_all("img"))
        if not text and not has_img_alt and not (b.get("aria-label") or b.get("title") or b.get("aria-labelledby")):
            f.append(Finding("4.1.2 Name, Role, Value", "A", "critical", "empty-button",
                             "Button has no accessible name.", snip(b), b.sourceline))

    # 1.3.1 Heading order — no skipped levels; note missing h1
    headings = [(int(h.name[1]), h) for h in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])]
    if headings:
        if not any(lvl == 1 for lvl, _ in headings):
            f.append(Finding("1.3.1 Info and Relationships", "A", "moderate", "no-h1",
                             "No <h1> found — page lacks a top-level heading.", "document", None))
        prev = None
        for lvl, h in headings:
            if prev is not None and lvl > prev + 1:
                f.append(Finding("1.3.1 Info and Relationships", "A", "moderate", "heading-skip",
                                 f"Heading level jumps from h{prev} to h{lvl} (skipped a level).",
                                 snip(h), h.sourceline))
            prev = lvl

    # 4.1.2 iframe needs a title
    for fr in soup.find_all("iframe"):
        if not (fr.get("title") or "").strip() and fr.get("aria-hidden") != "true":
            f.append(Finding("4.1.2 Name, Role, Value", "A", "moderate", "iframe-title",
                             "<iframe> has no title attribute.", snip(fr), fr.sourceline))

    # 2.4.3 Focus Order — positive tabindex is an anti-pattern
    for el in soup.find_all(attrs={"tabindex": True}):
        try:
            if int(el.get("tabindex")) > 0:
                f.append(Finding("2.4.3 Focus Order", "A", "moderate", "positive-tabindex",
                                 f"Positive tabindex ({el.get('tabindex')}) overrides natural order — avoid.",
                                 snip(el), el.sourceline))
        except ValueError:
            pass

    # 4.1.1 (robustness) Duplicate IDs — still breaks label/aria references
    seen: dict[str, int] = {}
    for el in soup.find_all(id=True):
        seen[el["id"]] = seen.get(el["id"], 0) + 1
    for _id, count in seen.items():
        if count > 1:
            f.append(Finding("Robustness (duplicate id)", "A", "moderate", "dup-id",
                             f"id=\"{_id}\" used {count} times — breaks label/aria-* references.",
                             f'id="{_id}"', None))

    # aria-labelledby / aria-describedby pointing at missing ids
    for el in soup.find_all(attrs={"aria-labelledby": True}) + soup.find_all(attrs={"aria-describedby": True}):
        for attr in ("aria-labelledby", "aria-describedby"):
            ref = el.get(attr)
            if ref:
                missing = [i for i in ref.split() if not soup.find(id=i)]
                if missing:
                    f.append(Finding("4.1.2 Name, Role, Value", "A", "serious", "broken-aria-ref",
                                     f"{attr} references missing id(s): {', '.join(missing)}.",
                                     snip(el), el.sourceline))

    # 1.3.1 Data tables without header cells
    for tbl in soup.find_all("table"):
        rows = tbl.find_all("tr")
        if len(rows) > 1 and not tbl.find("th") and tbl.get("role") not in ("presentation", "none"):
            f.append(Finding("1.3.1 Info and Relationships", "A", "moderate", "table-no-th",
                             "Table with data rows has no <th> header cells (or role=presentation).",
                             snip(tbl), tbl.sourceline))

    # 1.4.2 Audio Control / 2.2.2 — autoplaying media without controls
    for media in soup.find_all(["audio", "video"]):
        if media.has_attr("autoplay") and not media.has_attr("controls") and not media.has_attr("muted"):
            f.append(Finding("1.4.2 Audio Control", "A", "serious", "autoplay-media",
                             f"<{media.name} autoplay> without controls/muted.", snip(media), media.sourceline))

    # 1.4.4 Resize Text / 1.4.10 — viewport blocking zoom
    for meta in soup.find_all("meta", attrs={"name": "viewport"}):
        content = (meta.get("content") or "").lower()
        if "user-scalable=no" in content.replace(" ", "") or "maximum-scale=1" in content.replace(" ", ""):
            f.append(Finding("1.4.4 Resize Text", "AA", "serious", "viewport-zoom",
                             "Viewport disables zoom (user-scalable=no / maximum-scale=1).",
                             snip(meta), meta.sourceline))

    # 2.1.1 / 4.1.2 — fake interactive elements: click handler on a non-interactive tag
    for el in soup.find_all(attrs={"onclick": True}):
        if el.name in ("a", "button", "input", "select", "textarea", "option", "summary", "label", "area"):
            continue
        has_role = el.get("role") in ("button", "link", "checkbox", "radio", "tab", "menuitem",
                                      "switch", "option")
        has_tabindex = el.get("tabindex") is not None
        if not (has_role and has_tabindex):
            f.append(Finding("2.1.1 Keyboard", "A", "critical", "fake-button",
                             f"<{el.name}> with onclick is not keyboard-operable or exposed to "
                             "assistive tech (no role + tabindex + key handler). Use a real <button>/"
                             "<a>, or add role, tabindex=\"0\" and Enter/Space handling.",
                             snip(el), el.sourceline))

    # 1.1.1 — inline SVG marked as image (or standalone graphic) without an accessible name
    for svg in soup.find_all("svg"):
        if svg.get("aria-hidden") == "true" or svg.get("role") in ("presentation", "none"):
            continue
        in_named_control = svg.find_parent(["a", "button"]) is not None
        has_name = bool(svg.get("aria-label") or svg.get("aria-labelledby") or svg.find("title"))
        if svg.get("role") == "img" and not has_name:
            f.append(Finding("1.1.1 Non-text Content", "A", "serious", "svg-name",
                             'Inline <svg role="img"> has no accessible name (add <title>/aria-label) '
                             'or mark it decorative (aria-hidden="true").', snip(svg), svg.sourceline))
        elif not in_named_control and not has_name and svg.get("role") is None:
            f.append(Finding("1.1.1 Non-text Content", "A", "minor", "svg-ambiguous",
                             "Standalone inline <svg> without name or aria-hidden — if decorative, add "
                             'aria-hidden="true"; if informative, add role="img" + <title>.',
                             snip(svg), svg.sourceline))

    # 4.1.2 — focusable element hidden from the accessibility tree ("ghost focus")
    focusable = soup.find_all(["a", "button", "input", "select", "textarea"]) + \
                soup.find_all(attrs={"tabindex": True})
    for el in focusable:
        if el.get("aria-hidden") == "true":
            ti = el.get("tabindex")
            if ti is not None and ti.strip() == "-1":
                continue  # correctly removed from tab order
            if el.name == "a" and el.get("href") is None and ti is None:
                continue
            f.append(Finding("4.1.2 Name, Role, Value", "A", "serious", "aria-hidden-focusable",
                             'aria-hidden="true" on a focusable element — keyboard users land on an '
                             "element that screen readers can't see. Also set tabindex=\"-1\" or unhide.",
                             snip(el), el.sourceline))

    # 1.3.1 — radio/checkbox groups without a grouping construct
    radios: dict[str, list] = {}
    for r in soup.find_all("input", attrs={"type": "radio"}):
        radios.setdefault(r.get("name") or "", []).append(r)
    for name, group in radios.items():
        if len(group) > 1:
            grouped = any(r.find_parent("fieldset") or r.find_parent(attrs={"role": "radiogroup"})
                          for r in group)
            if not grouped:
                f.append(Finding("1.3.1 Info and Relationships", "A", "moderate", "radio-group",
                                 f'Radio group name="{name}" ({len(group)} options) has no <fieldset>/'
                                 '<legend> or role="radiogroup" — the group question is not conveyed.',
                                 snip(group[0]), group[0].sourceline))

    # 2.2.2 — deprecated moving-content elements
    for el in soup.find_all(["marquee", "blink"]):
        f.append(Finding("2.2.2 Pause, Stop, Hide", "A", "serious", "marquee",
                         f"<{el.name}> creates unstoppable moving content (and is obsolete HTML).",
                         snip(el), el.sourceline))

    # 1.3.1 / 2.4.1 — no main landmark (best-practice structural aid)
    if soup.find("body") is not None and soup.find("main") is None and \
            soup.find(attrs={"role": "main"}) is None:
        f.append(Finding("1.3.1 Info and Relationships", "A", "minor", "no-main",
                         "No <main> landmark — screen-reader users lose a primary navigation aid "
                         "(also weakens 2.4.1 Bypass Blocks).", "document", None))

    return f


def collect_files(paths: list[str]) -> list[str]:
    out: list[str] = []
    for p in paths:
        if os.path.isdir(p):
            for ext in ("*.html", "*.htm"):
                out += glob.glob(os.path.join(p, "**", ext), recursive=True)
        elif os.path.isfile(p):
            out.append(p)
    return sorted(set(out))


def main() -> int:
    ap = argparse.ArgumentParser(description="Offline static HTML accessibility auditor")
    ap.add_argument("paths", nargs="+", help="HTML files or directories")
    ap.add_argument("--json", action="store_true", help="emit JSON")
    ap.add_argument("--fail-on", choices=list(SEVERITY_ORDER), default=None,
                    help="exit non-zero if any finding is at/above this severity")
    args = ap.parse_args()

    files = collect_files(args.paths)
    if not files:
        sys.stderr.write("No .html/.htm files found.\n")
        return 2

    report: dict[str, list[dict]] = {}
    worst = -1
    for path in files:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            findings = audit(fh.read(), path)
        report[path] = [asdict(x) for x in findings]
        for x in findings:
            worst = max(worst, SEVERITY_ORDER[x.severity])

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        total = sum(len(v) for v in report.values())
        print(f"\n=== Offline HTML accessibility audit — {len(files)} file(s), {total} finding(s) ===")
        print("(structural checks only — combine with manual + assistive-technology passes)\n")
        for path, findings in report.items():
            print(f"── {path} — {len(findings)} finding(s)")
            if not findings:
                print("   no structural red flags\n")
                continue
            for x in sorted(findings, key=lambda d: -SEVERITY_ORDER[d['severity']]):
                loc = f" (line {x['line']})" if x['line'] else ""
                print(f"   [{x['severity'].upper():8}] {x['sc']} [{x['level']}]{loc}")
                print(f"              {x['message']}")
                print(f"              → {x['location']}")
            print()

    if args.fail_on and worst >= SEVERITY_ORDER[args.fail_on]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
