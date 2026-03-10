import path from 'node:path';
import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(scriptsDir, '..');

const assetsToCopy = [
  { from: path.resolve(apiRoot, 'src', 'test1.png'), to: path.resolve(apiRoot, 'dist', 'test1.png') }
];

for (const asset of assetsToCopy) {
  await mkdir(path.dirname(asset.to), { recursive: true });
  try {
    await copyFile(asset.from, asset.to);
    // eslint-disable-next-line no-console
    console.log(`Copied ${path.relative(apiRoot, asset.from)} -> ${path.relative(apiRoot, asset.to)}`);
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      // eslint-disable-next-line no-console
      console.warn(`Skipped missing asset: ${path.relative(apiRoot, asset.from)}`);
      continue;
    }
    throw err;
  }
}

