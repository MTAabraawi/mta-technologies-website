# MTA TECHNOLOGIES — Corporate Website and App Directory

**BUILDING A SMARTER TOMORROW**  
Official contact: mtatechnologies0@gmail.com

The MTA website combines a bilingual corporate site with a multi-source software directory. The full marketplace experience runs on Cloudflare Pages and uses Pages Functions, an applications-engine Worker API, and GitHub-backed catalogue snapshots.

## Main site areas

- index.html, about.html, projects.html, innovation.html, knowledge.html, gallery.html, and contact.html: corporate pages and product portfolio.
- apps.html: directory of supported software stores and catalogues.
- store.html and functions/store.js: source-specific catalogue pages with server-rendered first-page results, source descriptions, filters and pagination.
- application.html and functions/application.js: dynamic application profiles with source attribution, publisher metadata, compatibility guidance and data-quality notes.
- app-mta-net-blocker.html: first-party product information for MTA Net Blocker.
- platform-overview.html: platform architecture, catalogue methodology, coverage limits and rights transparency.
- js/ and css/: bilingual interface, directory interactions and responsive design.
- sitemap-index.xml, sitemap-pages.xml, sitemap-stores.xml, and robots.txt: crawl and indexing configuration.
- ads.txt: Google AdSense publisher declaration.

## Marketplace architecture

1. Public catalogue sources are accessed through independent source connectors.
2. Source records are normalized while retaining their source key, external ID and original listing URL.
3. Catalogue snapshots and search/browse indexes are stored in the GitHub-backed data repository.
4. The applications engine exposes catalogue statistics, search and pagination through its Worker API.
5. Cloudflare Pages Functions render store and application pages with useful HTML before browser JavaScript loads.

MTA presents catalogue metadata and links to original publisher listings. It does not host or redistribute third-party installer binaries. Coverage depends on each source's public interface, terms, regional availability and pagination limits; a listed store is not necessarily indexed in full.

## Local browser tests

The Playwright suite uses a deterministic local upstream fixture. It must not send automated pageviews to the production site or make real advertising requests.

Install dependencies with npm install --no-audit --no-fund and install Chromium with npx playwright install chromium. Start the fixture using node tests/fixtures/catalogue-upstream.js.

In a second terminal, start Pages Functions with the fixture as the engine origin:

    npx wrangler pages dev . --ip 127.0.0.1 --port 8788 --binding 'MTA_APPLICATIONS_ENGINE_ORIGIN=http://127.0.0.1:8789'

Then run:

    MTA_BASE_URL=http://127.0.0.1:8788 npm run test:e2e

The CI workflow performs the same local fixture-based verification. It does not run a scheduled production catalogue probe. Test totals are run-specific; report a count only with its workflow run, commit SHA and suite version.

## Hosting

Cloudflare Pages is required for the complete marketplace because it runs the functions/ routes. Connect the repository to the Pages project, use the repository root as the build output directory, and set:

- MTA_APPLICATIONS_ENGINE_ORIGIN: the deployed applications-engine Worker URL.
- MTA_SITE_ORIGIN: optional canonical origin override; defaults to the official website origin in the Functions.

Static HTML can be previewed separately, but GitHub Pages does not execute Cloudflare Pages Functions and therefore cannot provide the full dynamic marketplace.

## Google AdSense

The public pages use the publisher ID ca-pub-8004171697196640 with the Auto ads loader. The root ads.txt file declares:

    google.com, pub-8004171697196640, DIRECT, f08c47fec0942fa0

No manual ad-slot IDs are configured. Ad delivery remains subject to Google's site approval, account eligibility, consent requirements and policy checks; the presence of the script does not guarantee that ads will be served.

## Ownership, licensing and due diligence

- MTA does not claim ownership of third-party applications, store names, logos, publisher descriptions or upstream catalogue records.
- Each source repository's code is governed by its own published licence. Public access or a public repository must not be represented as exclusive IP unless the applicable licence and ownership evidence support that claim.
- Catalogue metadata and source links remain subject to upstream source terms. Transfer or commercial reuse rights must be reviewed source by source.
- Domain, brand assets, original MTA-authored content, hosting configuration, repository data and operational workflows are distinct assets. Their ownership and transferability should be documented separately.
- GitHub, Cloudflare, analytics and advertising accounts do not automatically transfer to a buyer; provider rules and authorized account handover apply.
- Traffic, revenue, integration coverage and test counts must be supported by dated, reproducible evidence. Do not present estimates or a single CI run as guarantees.

This repository describes the website and app directory only. It does not promise exclusive rights over third-party software or upstream catalogue content.
