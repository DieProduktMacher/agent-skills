#!/usr/bin/env python3
"""Offline PDF accessibility auditor — the machine-checkable subset of PDF/UA (ISO 14289-1) and
WCAG 2.x-as-applied-to-documents (WCAG2ICT / EN 301 549 Ch.10).

Checks structure that can be verified from the file alone: is the PDF tagged, does it declare a
language and title, will the title show in the window, is it a scanned image-only file, are form
fields labelled, does encryption block accessibility extraction, are there bookmarks. It does NOT
judge reading-order correctness, alt-text quality, table-header correctness, or contrast — those need
a human/agent (see references/pdf-accessibility.md, stations P1–P8) or a full tool like PAC/veraPDF.
A clean run means "no structural red flags", never "accessible".

Usage:  python3 audit_pdf.py <file-or-dir> [more...] [--json] [--fail-on serious]
Dependency: pikepdf  (pip install --break-system-packages pikepdf)
"""
from __future__ import annotations
import argparse, json, os, sys, glob
from dataclasses import dataclass, asdict

try:
    import pikepdf
except ImportError:
    sys.stderr.write("Missing dependency. Run: pip install --break-system-packages pikepdf\n")
    sys.exit(2)

SEV = {"critical": 3, "serious": 2, "moderate": 1, "minor": 0}


@dataclass
class Finding:
    standard: str      # PDF/UA clause or WCAG SC
    severity: str
    rule: str
    message: str
    fix: str


def _get(obj, key):
    try:
        return obj[key] if key in obj else None
    except Exception:
        return None


def _is_true(v):
    """Robust PDF-boolean check: pikepdf may return a Python bool or a Name/String."""
    if v is True:
        return True
    return str(v).strip().lower() in ("true", "/true")


def audit(path: str) -> list[Finding]:
    f: list[Finding] = []
    try:
        pdf = pikepdf.open(path)
    except Exception as e:
        return [Finding("n/a", "critical", "open", f"Could not open PDF: {e}", "Check the file is a valid PDF.")]

    root = pdf.Root
    npages = len(pdf.pages)

    # 1. Tagged? (PDF/UA 7.1) — needs MarkInfo/Marked true AND a StructTreeRoot
    markinfo = _get(root, "/MarkInfo")
    marked = bool(markinfo is not None and _is_true(_get(markinfo, "/Marked")))
    struct = _get(root, "/StructTreeRoot")
    if not marked or struct is None:
        f.append(Finding("PDF/UA 7.1 (WCAG 1.3.1)", "critical", "not-tagged",
                         "PDF is not tagged (no marked-content/StructTreeRoot). Screen readers cannot "
                         "determine reading order or structure — the document is fundamentally inaccessible.",
                         "Add a full tag tree (Acrobat 'Autotag' then fix, or axesPDF); tagging is mandatory."))
    else:
        # tagged but structure tree may be empty
        kids = _get(struct, "/K")
        if kids is None:
            f.append(Finding("PDF/UA 7.1", "serious", "empty-structure",
                             "Marked as tagged but the structure tree appears empty.",
                             "Rebuild the tag tree with real structure elements."))

    # 2. Document language (PDF/UA 7.2, WCAG 3.1.1)
    lang = _get(root, "/Lang")
    if not lang or not str(lang).strip():
        f.append(Finding("PDF/UA 7.2 (WCAG 3.1.1)", "serious", "no-lang",
                         "No document language (/Lang) set — screen readers use the wrong pronunciation.",
                         "Set the document language (e.g. de-DE) in the PDF catalog / Acrobat properties."))

    # 3. Title in metadata (PDF/UA 7.1, WCAG 2.4.2)
    title = None
    try:
        title = str(pdf.docinfo.get("/Title", "")).strip()
    except Exception:
        pass
    if not title:
        try:
            with pdf.open_metadata() as m:
                title = (m.get("dc:title") or "").strip() if hasattr(m, "get") else ""
        except Exception:
            title = ""
    if not title:
        f.append(Finding("PDF/UA 7.1 (WCAG 2.4.2)", "moderate", "no-title",
                         "No document title in metadata.",
                         "Set a descriptive Title in document properties."))
    else:
        # many producers write a placeholder title (untitled / Microsoft Word - x / Dokument1)
        import re as _re
        placeholder = _re.match(r"^(untitled|unbenannt|dokument\d*|document\d*|microsoft word -|"
                                r"slide\d*|presentation\d*|folie\d*|\.pdf|.*\.docx?$)",
                                title.strip(), _re.IGNORECASE)
        if placeholder:
            f.append(Finding("PDF/UA 7.1 (WCAG 2.4.2)", "moderate", "placeholder-title",
                             f'Title is a placeholder ("{title[:40]}"), not a meaningful document title.',
                             "Set a descriptive Title in document properties."))
            title = ""  # treat as no real title for the DisplayDocTitle check below

    # 4. DisplayDocTitle (PDF/UA 7.1, WCAG 2.4.2) — else the window shows the filename
    vp = _get(root, "/ViewerPreferences")
    ddt = bool(vp is not None and _is_true(_get(vp, "/DisplayDocTitle")))
    if title and not ddt:
        f.append(Finding("PDF/UA 7.1 (WCAG 2.4.2)", "moderate", "no-displaydoctitle",
                         "A title is set but ViewerPreferences/DisplayDocTitle is not true — readers show "
                         "the filename instead of the title.",
                         "Set DisplayDocTitle=true (Acrobat: File > Properties > Initial View > Show: Document Title)."))

    # 5. Image-only / scanned heuristic — pages have images but no text-showing operators
    text_ops = image_pages = 0
    for page in pdf.pages:
        try:
            raw = b""
            contents = _get(page, "/Contents")
            if contents is not None:
                try:
                    raw = contents.read_bytes()
                except Exception:
                    try:
                        raw = b"".join(c.read_bytes() for c in contents)
                    except Exception:
                        raw = b""
            if b"Tj" in raw or b"TJ" in raw or b"'" in raw:
                text_ops += 1
            res = _get(page, "/Resources")
            xobj = _get(res, "/XObject") if res is not None else None
            if xobj is not None:
                for _, x in dict(xobj).items():
                    if str(_get(x, "/Subtype")) == "/Image":
                        image_pages += 1
                        break
        except Exception:
            pass
    if npages and text_ops == 0 and image_pages > 0:
        f.append(Finding("WCAG 1.4.5 / 1.1.1", "critical", "scanned-image-only",
                         f"Appears to be a scanned image-only PDF ({image_pages}/{npages} pages have "
                         "images, none have extractable text). Unreadable by screen readers.",
                         "OCR the document and add a full tag tree (Acrobat OCR + Autotag, then correct)."))

    # 6. Form fields labelled (PDF/UA 7.18, WCAG 1.3.1/4.1.2/3.3.2)
    acro = _get(root, "/AcroForm")
    if acro is not None:
        fields = _get(acro, "/Fields")
        unlabelled = 0
        try:
            for fld in list(fields or []):
                tu = _get(fld, "/TU")  # tooltip = accessible name
                if not tu or not str(tu).strip():
                    unlabelled += 1
        except Exception:
            pass
        if unlabelled:
            f.append(Finding("PDF/UA 7.18 (WCAG 3.3.2)", "serious", "unlabelled-fields",
                             f"{unlabelled} form field(s) have no tooltip (/TU) — screen readers announce no label.",
                             "Give every field a descriptive tooltip in the form properties."))

    # 7. Encryption blocking accessibility extraction (WCAG-blocking)
    try:
        if pdf.is_encrypted and hasattr(pdf, "allow"):
            allow = pdf.allow
            if getattr(allow, "extract", True) is False and getattr(allow, "accessibility", True) is False:
                f.append(Finding("EN 301 549 Ch.10", "serious", "extraction-blocked",
                                 "Encryption blocks content extraction (incl. for accessibility) — assistive "
                                 "tech cannot read the text.",
                                 "Re-save allowing text extraction for accessibility."))
    except Exception:
        pass

    # 8. Bookmarks for long documents (PDF/UA best practice, WCAG 2.4.1)
    if npages >= 21 and _get(root, "/Outlines") is None:
        f.append(Finding("WCAG 2.4.1 (best practice)", "minor", "no-bookmarks",
                         f"Long document ({npages} pages) has no bookmarks/outline for navigation.",
                         "Add bookmarks reflecting the heading structure."))

    pdf.close()
    return f


def collect(paths):
    out = []
    for p in paths:
        if os.path.isdir(p):
            out += glob.glob(os.path.join(p, "**", "*.pdf"), recursive=True)
        elif os.path.isfile(p) and p.lower().endswith(".pdf"):
            out.append(p)
    return sorted(set(out))


def main() -> int:
    ap = argparse.ArgumentParser(description="Offline PDF accessibility auditor (PDF/UA + WCAG2ICT subset)")
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--fail-on", choices=list(SEV), default=None)
    args = ap.parse_args()

    files = collect(args.paths)
    if not files:
        sys.stderr.write("No .pdf files found.\n")
        return 2

    report, worst = {}, -1
    for path in files:
        fs = audit(path)
        report[path] = [asdict(x) for x in fs]
        for x in fs:
            worst = max(worst, SEV[x.severity])

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        total = sum(len(v) for v in report.values())
        print(f"\n=== Offline PDF accessibility audit — {len(files)} file(s), {total} finding(s) ===")
        print("(structural PDF/UA subset only — reading order, alt quality, tables, contrast need "
              "PAC/veraPDF + guided review P1–P8)\n")
        for path, fs in report.items():
            print(f"── {path} — {len(fs)} finding(s)")
            if not fs:
                print("   no structural red flags\n"); continue
            for x in sorted(fs, key=lambda d: -SEV[d['severity']]):
                print(f"   [{x['severity'].upper():8}] {x['standard']} · {x['rule']}")
                print(f"              {x['message']}")
                print(f"              → fix: {x['fix']}")
            print()

    if args.fail_on and worst >= SEV[args.fail_on]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
