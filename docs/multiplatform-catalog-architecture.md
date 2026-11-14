# MTA Multiplatform Catalog — source and ingestion plan

## Product rule
MTA is a discovery directory, not a mirror. Third-party app binaries remain at their original stores and publisher sites. Every result must link to the original listing. Do not hotlink or copy icons/screenshots unless the source terms permit it; retain source attribution and a last-checked timestamp.

## Current browser-search providers
- Android: F-Droid public search API (https://search.f-droid.org/api/search_apps) and original package pages.
- iOS: Apple iTunes Search API (entity=software) and returned App Store URL.
- macOS: Apple iTunes Search API (entity=macSoftware) and returned Mac App Store URL.
- Windows: winget.run v2 package search API; a community service indexing Microsoft's public WinGet manifest repository, not a Microsoft-operated API. Results link to package pages and offer a source search link.
- Linux: Flathub source-search link. Do not assume a stable public Flathub search API until its endpoint, terms and CORS behavior are verified.
- Web: search link for official web apps. Do not scrape search engines or claim these are verified listings.

## Candidate bulk catalog sources
- F-Droid signed repository index (https://f-droid.org/repo/index-v2.json). For bulk sync, follow the signed index/entry process and verify signatures; do not treat the display-only package API as a security verification mechanism.
- WinGet community manifests (https://github.com/microsoft/winget-pkgs) or documented winget.run paginated search API. Preserve PackageIdentifier, publisher, homepage, license, version and source link.
- Homebrew Formulae JSON API (https://formulae.brew.sh/docs/api/) for macOS and command-line packages. Treat Formulae and Casks separately and retain each package's upstream homepage.
- Flathub and Snap Store: use only supported/public endpoints or approved feeds after validating terms and availability. Prefer verified publisher metadata where provided.
- Apple App Store: use Apple's Search API for discovery and link to trackViewUrl. Respect rate limits and regional storefront differences.
- Web apps: accept publisher submissions and curate official product URLs. There is no single universal, authoritative global web-app catalog API.

## Normalized record proposal
- id (stable source-qualified key, e.g. fdroid:org.example.App)
- name, summary, description, developer
- platforms[] and categories[]
- source_id, source_name, source_listing_url
- publisher_homepage, icon_url (only where reuse/hotlink terms permit)
- version, updated_at, last_checked_at
- license, verification_status, region/storefront
- record_status (active, unavailable, needs_review)

## Scale and sync
1. Build source adapters independently; each adapter must document endpoint, pagination, attribution, rate limits, CORS/server-side requirements and reuse terms.
2. Run scheduled ingestion outside the static page (a free scheduled CI job or small serverless job only after limits and terms are checked). Never make the visitor's browser download a complete 100k-item catalog.
3. Deduplicate by package identifier first, then normalized publisher + product name + platform. Keep separate store listings when they are distinct official distribution channels.
4. Refresh metadata periodically; mark dead links as unavailable rather than silently deleting audit history.
5. Start with measured source counts. Do not advertise 10,000+ until imported, deduplicated, active records have been counted and link-checked.

## Current implementation status
The existing page is a first search interface, not yet a populated unified 10,000+ catalog. F-Droid and Apple endpoints are called from the browser and may be affected by CORS, rate limits or regional catalog settings. WinGet search uses the documented community API and may also be unavailable from some browsers. Linux and web currently provide source-search links only. macOS has Mac App Store search plus Homebrew's official catalog link.
