const http = require('node:http');

const baseTotal = 405;
const baseRows = Array.from({ length: baseTotal }, (_, i) => ({
  id: i + 1,
  source: 'fdroid',
  external_id: String(i + 1),
  platform: 'android',
  name: i === 0 ? 'MTA Net Blocker' : 'Fixture Application ' + String(i).padStart(4, '0'),
  developer: i === 0 ? 'MTA TECHNOLOGIES' : 'Fixture Publisher',
  summary: 'Deterministic catalogue fixture for proxy integration tests',
  description: i === 0 ? 'MTA Net Blocker is an Android utility that manages installed applications internet access over Wi-Fi and mobile data using Android local VPN service.' : '',
  category: i % 2 === 0 ? 'utilities' : 'productivity',
  license: null,
  source_url: 'https://example.org/apps/' + (i + 1),
  app_url: 'https://example.org/apps/' + (i + 1),
  icon_url: i === 0 ? 'https://www.mtahqq.dpdns.org/images/mta-net-blocker-icon.png' : 'https://example.org/icon.png'
}));
const openVsxRows = [
  {
    id: 'open-vsx-1', source: 'open-vsx', external_id: 'ms-python.python',
    platform: 'VS Code-compatible editors', name: 'Python', developer: 'Microsoft',
    summary: 'Python language support for compatible code editors, including IntelliSense, linting, debugging and environment selection.',
    description: 'Python extension for Visual Studio Code-compatible editors. It provides language support, IntelliSense, linting, debugging integration and environment selection. Check the publisher listing for supported editor versions and current requirements.',
    category: 'Programming Languages', license: 'MIT',
    source_url: 'https://open-vsx.org/extension/ms-python/python',
    app_url: 'https://github.com/microsoft/vscode-python',
    icon_url: 'https://open-vsx.org/extension/ms-python/python/latest/file/icon',
    metadata_json: {
      namespace: 'ms-python', extension_name: 'python', version: '2026.4.0',
      download_count: 123456, average_rating: 4.5, review_count: 16,
      published_at: '2026-11-01T00:00:00Z', verified_publisher: true,
      license: 'MIT', registry: 'Open VSX'
    }
  },
  {
    id: 'open-vsx-2', source: 'open-vsx', external_id: 'esbenp.prettier-vscode',
    platform: 'VS Code-compatible editors', name: 'Prettier - Code formatter', developer: 'Prettier',
    summary: 'Code formatter extension for supported VS Code-compatible editors.',
    description: 'Prettier formats supported source files consistently. Review the extension listing for language support, configuration options and compatible editor versions.',
    category: 'Formatting', license: 'MIT',
    source_url: 'https://open-vsx.org/extension/esbenp/prettier-vscode',
    app_url: 'https://github.com/prettier/prettier-vscode',
    icon_url: 'https://open-vsx.org/extension/esbenp/prettier-vscode/latest/file/icon'
  },
  {
    id: 'open-vsx-3', source: 'open-vsx', external_id: 'dbaeumer.vscode-eslint',
    platform: 'VS Code-compatible editors', name: 'ESLint', developer: 'Dirk Baeumer',
    summary: 'ESLint integration for compatible code editors.',
    description: 'ESLint integration displays linting diagnostics and supports common configuration workflows in compatible editors.',
    category: 'Linters', license: 'MIT',
    source_url: 'https://open-vsx.org/extension/dbaeumer/vscode-eslint',
    app_url: 'https://github.com/microsoft/vscode-eslint'
  },
  {
    id: 'open-vsx-4', source: 'open-vsx', external_id: 'eamodio.gitlens',
    platform: 'VS Code-compatible editors', name: 'GitLens', developer: 'GitKraken',
    summary: 'Git history and repository insights for compatible editors.',
    description: 'GitLens adds repository history, blame annotations and source-control insights to compatible development environments.',
    category: 'Source Control', license: 'MIT',
    source_url: 'https://open-vsx.org/extension/eamodio/gitlens',
    app_url: 'https://github.com/gitkraken/vscode-gitlens'
  },
  {
    id: 'open-vsx-5', source: 'open-vsx', external_id: 'redhat.vscode-yaml',
    platform: 'VS Code-compatible editors', name: 'YAML', developer: 'Red Hat',
    summary: 'YAML language support and validation for compatible editors.',
    description: 'YAML extension from Red Hat provides language support and validation features for YAML files in compatible editors.',
    category: 'Programming Languages', license: 'MIT',
    source_url: 'https://open-vsx.org/extension/redhat/vscode-yaml',
    app_url: 'https://github.com/redhat-developer/vscode-yaml'
  }
];
const rows = [...baseRows, ...openVsxRows];
const total = rows.length;

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:8789');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  if (url.pathname === '/api/v1/catalog-stats') {
    res.end(JSON.stringify({
      total, with_icon: total, without_icon: 0,
      platforms: { android: baseTotal, 'VS Code-compatible editors': openVsxRows.length },
      sources: {
        'fdroid': baseTotal, 'izzyondroid': baseTotal, 'apple-itunes': baseTotal,
        'apple-macos': baseTotal, 'winget-run-community': baseTotal, 'flathub': baseTotal,
        'snap-store': baseTotal, 'arch-linux': baseTotal, 'debian-packages': baseTotal,
        'homebrew-cask': baseTotal, 'steam': baseTotal, 'mta-curated-web': baseTotal,
        'bluejetty': baseTotal, 'openuse': baseTotal, 'chocolatey': baseTotal,
        'open-vsx': openVsxRows.length, 'ci-fixture': total
      },
      metadata_only: true
    }));
    return;
  }
  if (url.pathname === '/api/v1/apps') {
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || 50)));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
    const requestedSource = url.searchParams.get('source');
    const query = String(url.searchParams.get('q') || '').trim().toLocaleLowerCase();
    const platform = String(url.searchParams.get('platform') || '').trim().toLocaleLowerCase();
    const sourceRows = requestedSource === 'open-vsx' ? openVsxRows : requestedSource ? baseRows : rows;
    const matched = sourceRows.filter(row => {
      const searchable = [row.name, row.developer, row.summary, row.description].join(' ').toLocaleLowerCase();
      return (!query || searchable.includes(query)) && (!platform || row.platform.toLocaleLowerCase() === platform);
    });
    const filtered = requestedSource ? matched.map(row => ({ ...row, source: requestedSource })) : matched;
    res.setHeader('x-total-count', String(filtered.length));
    res.end(JSON.stringify(filtered.slice(offset, offset + limit)));
    return;
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ detail: 'Not Found' }));
}).listen(8789, '0.0.0.0');
