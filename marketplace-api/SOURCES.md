# Approved source and redistribution rules

The marketplace may index applications from these ecosystems, but an upstream catalogue is not blanket permission to copy every binary.

| Source | Platform coverage | MTA handling |
|---|---|---|
| [F-Droid](https://f-droid.org/) | Android | Prefer packages in the official main repository. Check each app's current inclusion metadata, license, anti-features, and source. Mirror only after confirming the applicable license/permission and required notices; otherwise link to F-Droid. |
| [Flathub](https://flathub.org/) | Linux desktops | Use the official app page or Flatpak install reference by default. Flathub requires hosted content to permit legal redistribution; verify the app's metainfo license and any extra-data conditions before mirroring. |
| [Debian packages](https://www.debian.org/distrib/packages) | Linux | Only Debian `main` is a default candidate for redistribution review. Do not assume `contrib`, `non-free`, or `non-free-firmware` can be mirrored under the same terms. |
| [GitHub Releases](https://github.com/) | Cross-platform | A public repository or downloadable release is not a license. Check the repository license and the release asset's provenance; if there is no license or redistribution grant, link to the author's release page only. |
| Google Play / Apple App Store / Microsoft Store | Android / iOS / Windows | Link to the official store listing. Do not extract or re-host store packages or proprietary app binaries without explicit permission from the rights holder. |
| Official developer website | All platforms | Prefer the developer's own download page. Re-host only when the developer grants permission or a verified license permits redistribution. |

## Decision labels
- **Hosted by MTA**: file is stored by MTA after documented redistribution rights are verified and security review is complete.
- **Official external download**: MTA displays metadata and sends users to the publisher/store. No copy of the binary is stored.
- **Directory listing**: metadata only; no download is offered until a trusted destination is verified.

## Required evidence before hosting
1. Exact app name, publisher, version, platform, and source URL.
2. License identifier (prefer SPDX where applicable) and license text or a written redistribution grant.
3. Copyright notices, attribution, and source-code offer/notice obligations where applicable.
4. Confirmation that bundled artwork, fonts, libraries, and other assets are also cleared.
5. File hash, package signature/provenance where available, malware scan result, and reviewer identity/date.

A license for source code does not necessarily cover logos, trademarks, screenshots, fonts, or third-party assets. If the rights are unclear, do not mirror the file: use an official external link or decline the listing.


## Initial curated directory (external links only)

These starter listings are shown as **official external sources**, not MTA-hosted binaries. Their upstream pages identify the project and license; re-check the exact release package, bundled components, and notices before mirroring any binary.

| App | Platforms | License information shown by upstream | Official listing/download |
|---|---|---|---|
| F-Droid client | Android | GPL-3.0-or-later | https://f-droid.org/packages/org.fdroid.fdroid/ |
| NewPipe | Android | GPL-3.0-or-later | https://f-droid.org/packages/org.schabi.newpipe/ |
| VLC media player | Windows, macOS, Linux, Android, iOS | GPL family; package COPYING and bundled library notices govern redistribution | https://www.videolan.org/vlc/ |
| GIMP | Windows, macOS, Linux | GPL-3.0-or-later | https://www.gimp.org/downloads/ |
| Blender | Windows, macOS, Linux | GNU GPL v3 | https://www.blender.org/download/ |
| LibreOffice | Windows, macOS, Linux | MPL-2.0 primary license; additional component licenses vary | https://www.libreoffice.org/download/download-libreoffice/ |
| Nextcloud | iOS | GPL-3.0 with Apple App Store exception | https://apps.apple.com/us/app/nextcloud/id1125420102 |
| Penpot | Web | MPL-2.0 | https://design.penpot.app/ |

The directory links to upstream publishers/stores and does not mirror these binaries. For example, F-Droid recommends its client for safer update handling; its standalone APK page explains that direct APK installs do not receive F-Droid client update notifications. VideoLAN permits redistribution under GPL terms but requires accompanying source and relevant library sources/notices; its trademarks remain protected. LibreOffice's installation may contain components under additional licenses. These details are why each hosted release must be reviewed independently.

Evidence pages:
- NewPipe license and release metadata: https://f-droid.org/packages/org.schabi.newpipe/
- F-Droid repository and client license: https://f-droid.org/packages/org.fdroid.fdroid/
- VideoLAN redistribution guidance: https://images.videolan.org/legal.html
- GIMP license FAQ: https://www.gimp.org/docs/userfaq.html
- Blender license overview: https://www.blender.org/about/
- LibreOffice license overview: https://www.libreoffice.org/licenses/
- Nextcloud iOS license: https://github.com/nextcloud/ios
- Penpot source license: https://github.com/penpot/penpot
