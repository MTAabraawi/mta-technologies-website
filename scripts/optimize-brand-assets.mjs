import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const assets = [
  'images/mta-logo-horizontal.png',
  'images/mta-logo-square.png'
];

for (const relative of assets) {
  const input = path.join(root, relative);
  if (!fs.existsSync(input)) throw new Error('Missing source image: ' + relative);
  const image = sharp(input, { failOn: 'error' });
  const metadata = await image.metadata();
  const stem = input.replace(/\.png$/i, '');
  await image.clone().webp({ quality: 82, effort: 6, smartSubsample: true }).toFile(stem + '.webp');
  await image.clone().avif({ quality: 55, effort: 6, chromaSubsampling: '4:2:0' }).toFile(stem + '.avif');
  for (const ext of ['webp', 'avif']) {
    const output = stem + '.' + ext;
    const before = fs.statSync(input).size;
    const after = fs.statSync(output).size;
    console.log(relative + ' -> ' + path.basename(output) + ': ' + before + ' -> ' + after + ' bytes (' + metadata.width + 'x' + metadata.height + ')');
    if (after >= before) console.warn('Warning: ' + output + ' is not smaller than the PNG source.');
  }
}

const textExtensions = new Set(['.html', '.htm', '.css', '.js', '.json', '.xml', '.webmanifest', '.txt', '.md']);
const ignored = new Set(['.git', 'node_modules', '.wrangler']);
let changed = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && textExtensions.has(path.extname(entry.name).toLowerCase())) {
      const original = fs.readFileSync(full, 'utf8');
      const updated = original
        .replace(/mta-logo-horizontal\.png/gi, 'mta-logo-horizontal.webp')
        .replace(/mta-logo-square\.png/gi, 'mta-logo-square.webp');
      if (updated !== original) {
        fs.writeFileSync(full, updated);
        changed++;
      }
    }
  }
}
walk(root);
console.log('Updated logo references in ' + changed + ' text files. Original PNG files retained.');
