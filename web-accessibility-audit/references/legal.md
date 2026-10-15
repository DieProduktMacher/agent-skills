# Legal requirements for web accessibility

> Verify dates and thresholds against a primary source before relying on them for a compliance
> decision — accessibility law is actively evolving (EN 301 549 v4.1.1 and further national
> transpositions are in progress). Primary sources are linked at the end. This skill is a rigorous
> self-assessment aid, **not legal advice**.

## The chain in one paragraph

An EU **directive** sets the obligation; each member state passes a **national law** to implement it;
a **harmonised technical standard** (EN 301 549) defines what "accessible" means and — **once it is
cited in the Official Journal of the EU (OJEU) for that specific directive** — creates a *presumption
of conformity*; and EN 301 549 in turn incorporates **WCAG** for web content. So for a
German website you reason: *WCAG → EN 301 549 → (EAA → BFSG) or (WAD → BITV 2.0)*.

---

## Germany

### BFSG — Barrierefreiheitsstärkungsgesetz (private sector)
> **If a report needs one deadline: it is 28 June 2025, already in the past as of this skill's use.**
> That is the general obligation date. 28 June 2027 and 28 June 2030 (below) are narrow exceptions for
> pre-existing contracts/products only — never cite either of those as "the deadline" for a website's
> general obligation; that is a factual error.
- Implements the EU **European Accessibility Act** (Directive (EU) 2019/882) into German law.
  Enacted 22 July 2021; **its obligations apply since 28 June 2025**.
- **Applies to** products placed on the market and **services provided to consumers (B2C)** from
  28 June 2025 onward. Covered services include, in particular: **e-commerce / online shops**,
  **consumer banking**, **e-books and reading software**, **electronic tickets and travel/transport
  information services**, **telecoms services**, and **access to audiovisual media services**.
- **Websites/apps that deliver a covered service must be accessible from day one** — there is no
  general transition period for them. (Certain physical products in use before the deadline have
  long transition windows, e.g. self-service terminals up to 2040, but that does not apply to web
  services.)
- **Micro-enterprise exemption (services only), § 3 Abs. 3 BFSG:** an undertaking with **fewer than
  10 employees AND either annual turnover ≤ €2M or annual balance-sheet total ≤ €2M** is exempt **for
  services**. The exemption does **not** apply to businesses that place covered **products** on the
  market. If size is unknown, assume in-scope.
- **Disproportionate-burden / fundamental-alteration** relief exists but must be **documented and
  justified** (assessed against BFSG Anlage 4 criteria); it is not a free pass.
- **Technical detail** is set by the **BFSGV** (Barrierefreiheitsstärkungsgesetz-Verordnung, the
  implementing ordinance), which points to the state of the art — in practice **EN 301 549 / WCAG**.
- **Enforcement:** market surveillance by the *Marktüberwachungsstelle der Länder für die
  Barrierefreiheit von Produkten und Dienstleistungen (MLBF)*, seated in Magdeburg and **operational
  since Jan 2026**; it works **primarily reactively** (complaint-driven) plus **risk-based sampling**
  of high-reach services and providers with a poor track record — not blanket automated enforcement.
  Consumers and qualified associations can file complaints. *(Status July 2026; verify current
  practice.)*
- **Penalties (§ 37 BFSG):** a two-tier fine framework — up to **€100,000** for serious violations
  (incl. offering a non-accessible covered service/website, § 37 Abs. 1 Nr. 8) and up to **€10,000**
  for lesser ones (e.g. incomplete information). Amount scales with type, severity, duration, and
  repeat risk. Authorities can also order remediation and, ultimately, prohibit offering the service.
  **No individual consumer right to sue for damages** — enforcement runs through market surveillance;
  a separate competitor/association *Abmahnung* route via § 3a UWG exists but is **legally unsettled**
  (courts have not confirmed BFSG breaches are UWG-actionable; treat as a cost risk, not settled law).
- **Required artefact:** an **accessibility statement / Erklärung zur Barrierefreiheit** describing how
  the service meets the requirements, plus an accessible **feedback/contact mechanism**.

### BITV 2.0 — Barrierefreie-Informationstechnik-Verordnung (public sector)
- Implements the EU **Web Accessibility Directive** (Directive (EU) 2016/2102) for **federal public
  bodies**; the *Länder* have parallel state laws (LBGG / state BITV equivalents) for regional/municipal
  bodies. Rooted in the *Behindertengleichstellungsgesetz (BGG)*.
- **Applies to** public-sector websites, mobile apps, intranets/extranets, and electronic documents.
- **Target:** **EN 301 549** (i.e. WCAG Level AA), plus BITV-specific requirements such as an
  **Erklärung zur Barrierefreiheit**, a **feedback mechanism**, and content in **Leichte Sprache**
  (easy-to-read) and **Deutsche Gebärdensprache (DGS / sign language)** for key information.
- **Enforcement/monitoring:** the *Überwachungsstelle des Bundes für Barrierefreiheit von
  Informationstechnik (BFIT-Bund)* monitors and handles the conciliation/complaint procedure.

**If both could apply** (e.g. a public body running a consumer-style service), treat the stricter set
of obligations as the target.

---

## European Union (frame for all member states)

### EAA — European Accessibility Act, Directive (EU) 2019/882
- Harmonises accessibility for defined **consumer products and services** across the EU. Member states
  transposed it into national law (Germany → BFSG). **Applicable from 28 June 2025.**
- Same headline scope as BFSG (e-commerce, banking, e-books, transport, telecoms, AV media access,
  computing hardware, self-service terminals). Each country's national transposition governs the
  specifics, enforcement body, and penalties — **check the country where the service is offered.**
- **Transition dates:** applies from 28 June 2025; **service contracts concluded before 28 June 2025
  may run until 28 June 2027**; products lawfully in use before June 2025 have until **28 June 2030**.
  Websites/apps offering a covered service get **no general grace period** — accessible from day one.

### WAD — Web Accessibility Directive, Directive (EU) 2016/2102
- Older directive covering **public-sector bodies'** websites and mobile apps. In force since 2016;
  websites had to conform by Sept 2020, mobile apps by June 2021. Germany → BITV 2.0.
- Requires **EN 301 549** conformance, an **accessibility statement**, a **feedback mechanism**, and
  member-state **monitoring/reporting**.

### EN 301 549 — the technical standard
- The technical yardstick for **both** the EAA and the WAD. **Current version v3.2.1 (March 2021)**
  incorporates **WCAG 2.1 Level AA verbatim** for web content (clause 9), and adds requirements beyond
  WCAG for non-web software, documents, and hardware (clauses 5–8, 10–13).
- **Critical nuance on "presumption of conformity":** a harmonised standard only confers a formal
  presumption of conformity once it is **cited in the OJEU for that directive**.
  - Under the **WAD (public sector)**, v3.2.1 **is** the cited harmonised standard → conformance
    **does** give a presumption of conformity. ✅
  - Under the **EAA (private sector) / BFSG**, **no version of EN 301 549 is cited in the OJEU yet**,
    so conformance does **not** currently create a formal presumption of conformity with the EAA. In
    practice EN 301 549 v3.2.1 / WCAG 2.1 AA is still the accepted "state of the art" that authorities
    assess against — but frame it as *the best available benchmark*, not a legal safe harbour.
- **v4.1.1** (Commission mandate M/587, incorporating **WCAG 2.2**): draft **v4.1.0 released Nov 2025**;
  **v4.1.1 expected to be cited in the OJEU ~Oct 2026**, at which point it becomes the harmonised
  standard for the EAA and *does* confer the presumption. Auditing against **WCAG 2.2 AA now** both
  future-proofs for this and exceeds today's 2.1 baseline. *(Dates per mid-2026 sources; verify.)*

---

## Other countries (for global/multi-market sites)

- **United States** — **ADA** (Title II/III; courts widely treat commercial and public-service
  websites as covered, typically expecting **WCAG 2.1 AA**) and **Section 508** (federal agencies and
  their vendors → EN-equivalent standard tied to **WCAG 2.0 AA**). April 2024 DOJ rule sets
  **WCAG 2.1 AA** for state/local government (Title II) with 2026–2027 compliance dates by entity size.
- **United Kingdom** — **Equality Act 2010** (private sector duty to make reasonable adjustments) and
  the **Public Sector Bodies Accessibility Regulations 2018** (public sector → WCAG 2.1 AA +
  accessibility statement). Post-Brexit the UK tracks WCAG but not EU directives.
- **Canada** — **ACA** (Accessible Canada Act, federal) and provincial laws, notably Ontario's
  **AODA** (WCAG 2.0 AA for many organisations).
- **Australia** — **Disability Discrimination Act 1992**; government adopts **WCAG 2.1 AA**.
- **General rule for multi-market sites:** adopt the **strictest applicable requirement** (usually
  WCAG 2.2 AA) and cross-map findings once; one well-built site can satisfy several regimes at once.

---

## The accessibility statement (required by most regimes)

Whichever regime applies, a compliant site almost always needs a published **accessibility statement**
that includes: the **conformance target and status** (fully/partially/not conformant), a list of
**known non-accessible content** with reasons (incl. any disproportionate-burden claim), the **date**
of assessment/last review, an **accessible feedback mechanism** (how users report barriers and get a
response), and — for German public bodies — links to **enforcement/conciliation** procedures. Absence
of a valid statement is itself a compliance failure, independent of the site's technical quality.

## Primary sources to verify against
- Bundesfachstelle Barrierefreiheit — BFSG overview (bundesfachstelle-barrierefreiheit.de)
- BFSG / BFSGV statute text (gesetze-im-internet.de)
- BITV 2.0 statute text (gesetze-im-internet.de) and BFIT-Bund
- EUR-Lex: Directive (EU) 2019/882 (EAA) and Directive (EU) 2016/2102 (WAD)
- ETSI EN 301 549 (etsi.org) and the EU "Shaping Europe's digital future" accessibility pages
- W3C WAI policy tracker (w3.org/WAI/policies) for per-country status
