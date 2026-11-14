# MTA Multiplatform Catalog — source and ingestion plan

## Product rule
MTA is a discovery directory, not a mirror. Third-party app binaries remain at their original stores and publisher sites. Every result must link to the original listing. Do not hotlink or copy icons/screenshots unless the source terms permit it; retain source attribution and a last-checked timestamp.

## Current browser-search providers
- Android: F-Droid public search API and original package pages.
- iOS: Apple iTunes Search API (entity=software) and returned App Store URL.
- macOS: Apple iTunes Search API (entity=macSoftware) and returned Mac App Store URL.
- Windows: winget.run v2 package search API; a community service indexing Microsoft's public WinGet manifest repository, not a Microsoft-operated API.
- Linux: Flathub source-search link. Do not assume a stable public Flathub search API until its endpoint, terms and CORS behavior are verified.
- Web: search link for official web apps. Do not scrape search engines or claim these are verified listings.

## Bulk ingestion sources
- F-Droid public v2 repository index (https://f-droid.org/repo/index-v2.json) for Android metadata. The builder uses it only for discovery metadata; it does not download APKs or claim binary verification. F-Droid documents the signed index and recommends signature verification for security-sensitive use.
- Homebrew Formulae JSON API (https://formulae.brew.sh/api/formula.json) and Casks JSON API (https://formulae.brew.sh/api/cask.json) for macOS and command-line software. Formulae and Casks remain distinct source records.
- Next adapters to add after endpoint, rate-limit, attribution and reuse checks: WinGet manifests, Flathub, Snap, Debian/Ubuntu repositories, Apple App Store, Microsoft Store, and curated official web apps.
- Storefronts without a supported bulk metadata feed will be represented by source search links or publisher submissions, not scraped without permission.

## Normalized record
Each generated record has a stable source-qualified ID, name, description, developer, platforms, categories, source ID, source listing URL, optional publisher homepage, version, license, last-checked timestamp, and record status. Separate official distribution listings are retained when they are genuinely distinct.

## Automated catalog refresh
- scripts/build_multiplatform_catalog.py imports metadata from the F-Droid v2 index and Homebrew Formulae/Casks JSON feeds.
- .github/workflows/refresh-multiplatform-catalog.yml supports manual runs and scheduled refreshes (Tuesday and Friday at 04:17 UTC).
- The output is data/catalog.json; it contains metadata and original listing links only, never installer files.
- The workflow runs on the selected branch and commits the generated JSON only when it changes. The first successful run must be checked before publishing any catalog size.
- This is an initial ingestion layer, not yet the complete global catalog. A source is not considered integrated until its adapter is tested and its reuse conditions are recorded.

## Scale, quality and integrity
1. Add source adapters independently; document endpoint, pagination, attribution, rate limits, CORS/server-side requirements and reuse terms.
2. Keep the complete catalog out of the visitor's browser; serve paginated/searchable static data or a small index.
3. Deduplicate by source-qualified package identifier first, then review likely cross-source duplicates using normalized publisher + product name + platform. Never merge distinct official listings blindly.
4. Refresh metadata periodically; mark dead links unavailable rather than silently deleting audit history.
5. Count only imported, deduplicated records. Report total records and per-platform totals separately; do not claim every record is a unique app because one app can have several platform/store listings.
6. Do not advertise a public count until the first successful ingestion has been run, inspected, and link-checked.

## Current implementation status
The PR contains the first multi-platform search UI and an initial metadata-only bulk importer for F-Droid and Homebrew. Apple and WinGet remain live search integrations rather than bulk imports. Linux and Web currently offer source-search links. The generated catalog has not yet been run and its real record count is therefore not yet established.
