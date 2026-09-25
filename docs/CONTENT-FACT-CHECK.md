# Content fact check

**Status: BLOCKING. Nothing in this file has been verified by the site owner.**

Every claim below was written from project notes, not from a source of record.
Until each line is checked and ticked here, the site does not publish it as an
implemented fact. The code enforces that, it is not a promise in a document:

| Claim type | Current behaviour in code |
| --- | --- |
| Capability list | Every entry is `state: 'unverified'`. The UI renders `implemented`, `in-progress` and `planned` only, so unverified entries do not appear and the section hides |
| Project dates | `startDate` / `endDate` / `displayDate` are all absent. No date renders, and none reaches metadata, JSON-LD or the sitemap |
| Metrics | `metrics` is empty. The homepage metrics section does not render |
| Project `sameAs` | Emitted only from an explicit `canonicalUrl`, never from an arbitrary link |
| Case-study prose | **Still published.** This is the part that needs your eyes |

## How to use this file

1. Read a line. Decide: true, partly true, or false.
2. True → tick it, then set the real value in `src/content/projects.ts`
   (capability `state`, `startDate`, and so on).
3. Partly true → rewrite the claim to the narrower true version.
4. False or unsure → delete it. Do not soften it into something vague.

Nobody should fill these in by guessing, including a future me. If a date is
not written down somewhere, it is not a date, it is a memory.

---

## PAD System (`pad-system`)

### Status and role

- [ ] Status is `live` — meaning publicly reachable and in real use right now. Correct?
- [ ] Role reads “Founder, CEO & Developer”. Is every word of that title accurate and defensible?
- [ ] Start date: **not published.** Real month/year, or leave absent?
- [ ] End date: **not published.** Ongoing, or a real end date?

### Technologies claimed

Each of these is stated publicly as part of the build. Tick only the ones actually used in the shipped work — not ones tried, planned or used in a different project.

- [ ] Django
- [ ] DRF
- [ ] Next.js
- [ ] TypeScript
- [ ] PostgreSQL
- [ ] Redis
- [ ] Celery
- [ ] Docker
- [ ] Nginx

### Capabilities (currently hidden pending verification)

Originally written as the state in brackets. Restore a state only when true.

- [ ] Crisis map with verified reports — *originally claimed: implemented*
- [ ] Automated verified-news pipeline — *originally claimed: implemented*
- [ ] Missing-persons registry — *originally claimed: implemented*
- [ ] Aid requests and SOS action — *originally claimed: implemented*
- [ ] Installable PWA and Android package — *originally claimed: implemented*
- [ ] Biometric sign-in via WebAuthn — *originally claimed: implemented*
- [ ] Operator console for regional coordinators — *originally claimed: in-progress*

### Case-study prose — still published, needs review

- [ ] `#problem` — Problem
- [ ] `#product` — What I built
- [ ] `#engineering` — Engineering
- [ ] `#design` — Design system
- [ ] `#challenges` — Challenges
- [ ] `#lessons` — What I learned

Read each section for: architecture claims, infrastructure descriptions, migration claims, counts, security capabilities and deployment topology. Those are the sentences that age badly and that a reader can check.

### Links

- [ ] https://pad-system.ir — resolves, is public, and is genuinely this project?

---

## WebGuard (`webguard`)

### Status and role

- [ ] Status is `in-development` — meaning actively being built, not yet released. Correct?
- [ ] Role reads “Creator & Lead Engineer”. Is every word of that title accurate and defensible?
- [ ] Start date: **not published.** Real month/year, or leave absent?
- [ ] End date: **not published.** Ongoing, or a real end date?

### Technologies claimed

Each of these is stated publicly as part of the build. Tick only the ones actually used in the shipped work — not ones tried, planned or used in a different project.

- [ ] Django
- [ ] DRF
- [ ] Celery
- [ ] Redis
- [ ] PostgreSQL
- [ ] Next.js
- [ ] TypeScript
- [ ] Tailwind CSS
- [ ] Docker

### Capabilities (currently hidden pending verification)

Originally written as the state in brackets. Restore a state only when true.

- [ ] SSRF-safe request layer with pinned-IP connections — *originally claimed: implemented*
- [ ] HTTPS and TLS certificate inspection — *originally claimed: implemented*
- [ ] Security header analysis — *originally claimed: implemented*
- [ ] DNS and mail-record checks reported as information — *originally claimed: implemented*
- [ ] Weighted, explainable 0–100 score — *originally claimed: implemented*
- [ ] Results dashboard and shareable scan pages — *originally claimed: in-progress*
- [ ] Accounts, scheduled re-scans and change alerts — *originally claimed: planned*

### Case-study prose — still published, needs review

- [ ] `#goal` — Goal
- [ ] `#safety` — Security philosophy
- [ ] `#scoring` — Scoring
- [ ] `#architecture` — Architecture
- [ ] `#status` — Development status

Read each section for: architecture claims, infrastructure descriptions, migration claims, counts, security capabilities and deployment topology. Those are the sentences that age badly and that a reader can check.

### Links

- [ ] https://github.com/AR-MI2008/webguard — resolves, is public, and is genuinely this project?

---

## Melamin Layegh (`melamin-layegh`)

### Status and role

- [ ] Status is `delivered` — meaning handed over to the client and signed off. Correct?
- [ ] Role reads “Web Developer (client project)”. Is every word of that title accurate and defensible?
- [ ] Start date: **not published.** Real month/year, or leave absent?
- [ ] Delivery date: **not published.** Real handover month/year, or leave absent?

### Technologies claimed

Each of these is stated publicly as part of the build. Tick only the ones actually used in the shipped work — not ones tried, planned or used in a different project.

- [ ] WordPress
- [ ] WooCommerce
- [ ] PHP 8
- [ ] MySQL
- [ ] cPanel

### Capabilities (currently hidden pending verification)

Originally written as the state in brackets. Restore a state only when true.

- [ ] Custom WordPress theme — *originally claimed: implemented*
- [ ] 91 products across 10 categories — *originally claimed: implemented*
- [ ] WooCommerce catalogue and enquiry flow — *originally claimed: implemented*
- [ ] Domain-authenticated SMTP delivery — *originally claimed: implemented*
- [ ] Persian-first responsive layout — *originally claimed: implemented*

### Case-study prose — still published, needs review

- [ ] `#context` — Business context
- [ ] `#challenge` — The challenge
- [ ] `#implementation` — Implementation
- [ ] `#outcome` — Outcome

Read each section for: architecture claims, infrastructure descriptions, migration claims, counts, security capabilities and deployment topology. Those are the sentences that age badly and that a reader can check.

### Links

- [ ] https://melaminelayegh.ir — resolves, is public, and is genuinely this project?

---

## HyperNet (`hypernet`)

### Status and role

- [ ] Status is `live` — meaning publicly reachable and in real use right now. Correct?
- [ ] Role reads “Founder & Infrastructure Engineer”. Is every word of that title accurate and defensible?
- [ ] Start date: **not published.** Real month/year, or leave absent?
- [ ] End date: **not published.** Ongoing, or a real end date?

### Technologies claimed

Each of these is stated publicly as part of the build. Tick only the ones actually used in the shipped work — not ones tried, planned or used in a different project.

- [ ] Linux
- [ ] Python
- [ ] Telegram Bot API
- [ ] Nginx
- [ ] Docker
- [ ] PostgreSQL

### Capabilities (currently hidden pending verification)

Originally written as the state in brackets. Restore a state only when true.

- [ ] Self-serve subscription bot — *originally claimed: implemented*
- [ ] Multi-region server provisioning — *originally claimed: implemented*
- [ ] Full infrastructure migration process — *originally claimed: implemented*
- [ ] Operational dashboard for service health — *originally claimed: in-progress*

### Case-study prose — still published, needs review

- [ ] `#product` — The product
- [ ] `#infrastructure` — Infrastructure
- [ ] `#claims` — What I do not claim
- [ ] `#lessons` — Engineering lessons

Read each section for: architecture claims, infrastructure descriptions, migration claims, counts, security capabilities and deployment topology. Those are the sentences that age badly and that a reader can check.

### Links

No public link. Nothing to verify.

---

## Arc Core (`arc-core`)

### Status and role

- [ ] Status is `prototype` — meaning a working prototype only, not a product. Correct?
- [ ] Role reads “Designer & Firmware Developer”. Is every word of that title accurate and defensible?
- [ ] Start date: **not published.** Real month/year, or leave absent?
- [ ] End date: **not published.** Ongoing, or a real end date?

### Technologies claimed

Each of these is stated publicly as part of the build. Tick only the ones actually used in the shipped work — not ones tried, planned or used in a different project.

- [ ] ESP32
- [ ] Arduino
- [ ] C++
- [ ] KiCad
- [ ] 3D printing

### Capabilities (currently hidden pending verification)

Originally written as the state in brackets. Restore a state only when true.

- [ ] Core module bring-up and power path — *originally claimed: implemented*
- [ ] Sensor read loop on device firmware — *originally claimed: implemented*
- [ ] Wireless link to a companion client — *originally claimed: implemented*
- [ ] Enclosure and wearability revisions — *originally claimed: in-progress*
- [ ] Power budget and battery life work — *originally claimed: in-progress*
- [ ] Custom PCB replacing the development board — *originally claimed: planned*
- [ ] On-device interface and haptics — *originally claimed: planned*

### Case-study prose — still published, needs review

- [ ] `#concept` — Concept
- [ ] `#goals` — Design goals
- [ ] `#hardware` — Hardware architecture
- [ ] `#firmware` — Firmware
- [ ] `#state` — Current state

Read each section for: architecture claims, infrastructure descriptions, migration claims, counts, security capabilities and deployment topology. Those are the sentences that age badly and that a reader can check.

### Links

No public link. Nothing to verify.

---

## Site-wide claims

### Metrics (currently empty)

Three metrics were removed. They are recorded here so they can be restored if
they turn out to be defensible:

- [ ] **5 — products shipped and running.** Removed as inconsistent: two of the
      five are marked prototype or in-development, so “shipped and running”
      cannot be true of all five. If you want a count, it needs a definition
      that survives someone counting for themselves.
- [ ] **1 — platform founded and operated** (PAD System). Defensible, but a
      metric of one is decoration, not information.
- [ ] **91 — products migrated for a client catalogue** (Melamin Layegh).
      Verify against the live catalogue before republishing.

A metric belongs on the site only if a stranger could check it and get the
same number. Zero metrics is a fine outcome.

### Profile identity (`sameAs`)

- [x] `https://github.com/AR-MI2008` — real, public, unambiguously the same person. **Kept.**
- [ ] `https://t.me/Im_Amir_nj` — **removed from `sameAs`**, still used as a
      contact link. A Telegram username is weak entity evidence: it carries no
      verifiable identity, and a wrong `sameAs` edge is worse than none.
- [ ] LinkedIn — absent by design. Add only when a real profile exists.
- [ ] Instagram — absent by design.

### Biography

- [ ] The bio in `src/content/site.ts` calls you “founder, CEO and developer of
      PAD System” and the builder of WebGuard. Both are load-bearing identity
      claims that appear in `Person` JSON-LD. Confirm both.
- [ ] Headline: “Software Developer, AI Builder & Founder”. Is “AI Builder”
      supported by something publicly visible on this site? If not, the phrase
      is doing work the evidence does not.

### Services

- [ ] `src/content/services.ts` lists six services. Confirm you would actually
      take on each one today, at a standard you would sign your name to.

### Articles

- [ ] Both posts in `src/content/posts.ts` carry publication dates that DO
      reach the sitemap and `BlogPosting` JSON-LD. Unlike project dates these
      are published. Confirm they are real.
