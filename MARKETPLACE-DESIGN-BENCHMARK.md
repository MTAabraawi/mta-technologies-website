# MTA TECHNOLOGIES — Marketplace Design Benchmark

**Purpose:** Internal design and product benchmark for the MTA multi-platform application directory. This compares publicly documented product patterns; it does not claim MTA has the same scale, editorial staff, or distribution capabilities as the referenced stores.

## Reference products reviewed

| Reference | Strong pattern observed | What MTA adopts | MTA's intended distinction |
|---|---|---|---|
| [F-Droid](https://f-droid.org/en/packages/) | Searchable catalogue, focused categories, package-level information, source and licence transparency | Clear store/source separation, search, categories, metadata and missing-artwork fallback | One discovery layer across Android, iOS, Windows, macOS, Linux and web instead of one Android repository |
| [Apple App Store](https://www.apple.com/app-store/) | Curated discovery, topical collections, editorial stories and clear product presentation | Better editorial context and a readable application profile, not just a raw result row | Cross-store comparison and direct attribution to the original catalogue; MTA does not claim to provide Apple's editorial curation |
| [Flathub](https://flathub.org/) | Platform-specific app catalogue, consistent package metadata and app-author guidance | Structured platform, category, publisher and source metadata | A single directory spanning multiple package ecosystems and operating systems |
| [Microsoft Store](https://apps.microsoft.com/) | Dedicated Apps/Gaming discovery and category-led navigation | Separate browsing paths by platform and store | Users can discover listings from multiple ecosystems without assuming MTA installs or updates the software |

## Design decisions for MTA

1. **Availability before promotion:** stores with verified indexed records appear first and are sorted by their live record counts. Stores without a verified feed are moved into a separate “نعمل على توفيرها قريباً” section.
2. **No invented counts:** counts come from the catalogue statistics endpoint. A failed statistics request must not leave old numbers presented as live.
3. **Source identity:** a record stays attached to its actual source. Partial feeds, such as a limited Steam integration, are labelled partial rather than described as complete.
4. **Application profile:** each indexed result opens a dedicated MTA detail page. The original publisher/store link remains the explicit next step for checking current availability or obtaining the application.
5. **Icon resilience:** use source artwork first, then metadata artwork, publisher favicons and finally a generated initials tile. A missing remote image must never leave a blank icon space.
6. **Readable interface:** higher-contrast shared text tokens, visible keyboard focus, responsive grids and bilingual RTL/LTR presentation.
7. **Honest SEO:** only connected store pages with records may become indexable. Unconnected store profiles remain noindex until they contain meaningful, verified catalogue content.

## What would make MTA meaningfully better for its intended audience

- **Cross-platform scope:** compare Android, iOS, Windows, macOS, Linux and web listings in one discovery experience.
- **Transparent provenance:** show which catalogue supplied a record and link to that exact original listing.
- **Availability clarity:** separate live catalogues, partial feeds and upcoming integrations instead of displaying empty or fabricated store inventories.
- **One consistent application profile:** normalize fields that sources actually provide while preserving source-specific details and limitations.
- **Bilingual access:** maintain Arabic RTL and English LTR across navigation, filters, metadata and editorial guidance.

These are product goals and implementation criteria. They do not mean MTA currently exceeds the referenced platforms in catalogue size, ranking quality, curation, installation, update delivery or trust infrastructure.

## AdSense and search readiness

Google's AdSense guidance emphasizes unique, relevant content, clear navigation and a useful visitor experience. Store descriptions alone are not enough: MTA should keep building original platform explainers, app comparisons, compatibility notes and independently written reviews, while clearly distinguishing editorial content from imported source metadata.

For indexing, the sitemap must list canonical, indexable URLs only. The production check should verify the exact sitemap.xml URL returns HTTP 200 with XML content, that robots.txt declares that same absolute URL, and that every listed URL resolves directly to its canonical page. Search Console submission is a separate account action and cannot be confirmed from a local test.

## Official reference material

- F-Droid package catalogue: https://f-droid.org/en/packages/
- Apple App Store: https://www.apple.com/app-store/
- Apple developer featuring and collections: https://developer.apple.com/app-store/getting-featured/
- Flathub documentation: https://docs.flathub.org/
- Microsoft Store app discovery: https://apps.microsoft.com/
- Google AdSense site readiness: https://support.google.com/adsense/answer/7299563
- Google sitemap creation and submission: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google canonical URL guidance: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
