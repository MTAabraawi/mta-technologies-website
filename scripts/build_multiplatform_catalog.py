#!/usr/bin/env python3
"""Build a metadata-only MTA catalog from public source indexes.

Never downloads application binaries. Source records always retain their original listing URL.
"""
import json, os, re, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path

UA = "MTA-Multiplatform-Catalog/1.0 (+https://www.mtahqq.dpdns.org)"
NOW = datetime.now(timezone.utc).isoformat()
OUT = Path("data/catalog.json")

def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as res:
        return json.load(res)

def clean(value, limit=1200):
    if not isinstance(value, str): return ""
    return re.sub(r"\\s+", " ", value).strip()[:limit]

def record(source, key, name, desc, platform, url, developer="", version="", category="", homepage="", license_name=""):
    if not name or not url or not url.startswith("https://"): return None
    return {
        "id": source + ":" + str(key), "name": clean(name, 180),
        "description": clean(desc), "developer": clean(developer, 180),
        "platforms": [platform], "categories": [clean(category, 80)] if category else [],
        "source_id": source, "source_listing_url": url,
        "publisher_homepage": homepage if isinstance(homepage, str) and homepage.startswith("https://") else "",
        "version": clean(version, 80), "license": clean(license_name, 100),
        "last_checked_at": NOW, "record_status": "active"
    }

items, errors = [], []

# F-Droid's public v2 index is the bulk metadata source; this does not fetch APKs.
try:
    fd = get_json("https://f-droid.org/repo/index-v2.json")
    apps = fd.get("apps", {})
    if isinstance(apps, dict):
        for app_id, app in apps.items():
            meta = app.get("metadata", app) if isinstance(app, dict) else {}
            name = meta.get("name") or meta.get("localized", {}).get("en-US", {}).get("name") or app_id
            summary = meta.get("summary") or meta.get("localized", {}).get("en-US", {}).get("summary") or ""
            link = "https://f-droid.org/packages/" + app_id + "/"
            rec = record("fdroid", app_id, name, summary, "Android", link,
                         meta.get("authorName") or meta.get("author"),
                         category=(meta.get("categories") or [""])[0] if isinstance(meta.get("categories"), list) else "")
            if rec: items.append(rec)
except Exception as e:
    errors.append({"source":"fdroid","error":str(e)[:300]})

# Homebrew publishes complete JSON lists for formulae and casks.
for kind, platform in (("formula", "macOS"), ("cask", "macOS")):
    try:
        data = get_json("https://formulae.brew.sh/api/" + kind + ".json")
        if isinstance(data, list):
            for x in data:
                token = x.get("token") or x.get("name")
                if not token: continue
                homepage = x.get("homepage") or ""
                link = homepage if isinstance(homepage, str) and homepage.startswith("https://") else "https://formulae.brew.sh/" + kind + "/" + str(token)
                rec = record("homebrew-" + kind, token, x.get("name") or token,
                             x.get("desc") or x.get("description") or "", platform, link,
                             version=x.get("versions", {}).get("stable", "") if isinstance(x.get("versions"), dict) else "",
                             category=x.get("tap", ""), homepage=homepage, license_name=x.get("license") or "")
                if rec: items.append(rec)
    except Exception as e:
        errors.append({"source":"homebrew-" + kind,"error":str(e)[:300]})

# De-duplicate stable source-qualified IDs; retain separate official distribution sources.
unique = {}
for item in items: unique[item["id"]] = item
catalog = sorted(unique.values(), key=lambda x: (x["platforms"][0], x["name"].casefold(), x["id"]))
OUT.parent.mkdir(parents=True, exist_ok=True)
payload = {
    "schema_version": 1, "generated_at": NOW,
    "total_records": len(catalog),
    "platform_counts": {p: sum(p in x["platforms"] for x in catalog) for p in ["Android","iOS","Windows","macOS","Linux","Web"]},
    "sources": ["F-Droid", "Homebrew Formulae", "Homebrew Casks"],
    "errors": errors, "items": catalog
}
OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\\n", encoding="utf-8")
print(json.dumps({"total_records":len(catalog),"platform_counts":payload["platform_counts"],"errors":errors}, ensure_ascii=False))
if not catalog:
    sys.exit("No catalog records generated; refusing to publish an empty catalog.")
