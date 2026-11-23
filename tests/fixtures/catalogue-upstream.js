const http = require('node:http');
const total = 405;
const rows = Array.from({ length: total }, (_, i) => ({
  id: i + 1,
  source: 'ci-fixture',
  external_id: String(i + 1),
  platform: 'android',
  name: i === 0 ? 'MTA Net Blocker' : 'Fixture Application ' + String(i).padStart(4, '0'),
  developer: i === 0 ? 'MTA TECHNOLOGIES' : 'Fixture Publisher',
  summary: i === 1 ? '' : 'Deterministic catalogue fixture for proxy integration tests',
  description: '',
  category: i % 2 === 0 ? 'utilities' : 'productivity',
  license: null,
  source_url: 'https://example.org/apps/' + (i + 1),
  app_url: 'https://example.org/apps/' + (i + 1),
  icon_url: i === 0 ? 'https://www.mtahqq.dpdns.org/images/mta-net-blocker-icon.png' : (i === 1 ? null : 'https://example.org/icon.png'),
  metadata_json: i === 0 ? { versionString: '1.0.1', minSdkVersion: '26' } : {}
}));
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:8789');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  if (url.pathname === '/api/v1/catalog-stats') {
    res.end(JSON.stringify({ total, with_icon: total, without_icon: 0, platforms: { android: total }, sources: { 'fdroid': total, 'izzyondroid': total, 'apple-itunes': total, 'apple-macos': total, 'winget-run-community': total, 'flathub': total, 'snap-store': total, 'arch-linux': total, 'debian-packages': total, 'homebrew-cask': total, 'steam': total, 'mta-curated-web': total, 'bluejetty': total, 'openuse': total, 'chocolatey': total, 'ci-fixture': total }, metadata_only: true }));
    return;
  }
  if (url.pathname === '/api/v1/apps') {
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || 50)));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
    const requestedSource = url.searchParams.get('source');
    const externalId = url.searchParams.get('external_id');
    const query = String(url.searchParams.get('q') || '').trim().toLocaleLowerCase();
    const platform = String(url.searchParams.get('platform') || '').trim().toLocaleLowerCase();
    const matched = rows.filter(row => {
      const searchable = [row.name, row.developer, row.summary, row.description].join(' ').toLocaleLowerCase();
      return (!query || searchable.includes(query)) && (!platform || row.platform.toLocaleLowerCase() === platform) && (!externalId || row.external_id === externalId);
    });
    const filtered = requestedSource ? matched.map(row => ({ ...row, source: requestedSource })) : matched;
    res.setHeader('x-total-count', String(filtered.length));
    res.end(JSON.stringify(filtered.slice(offset, offset + limit)));
    return;
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ detail: 'Not Found' }));
}).listen(8789, '0.0.0.0');
