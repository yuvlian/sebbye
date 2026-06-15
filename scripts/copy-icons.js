/**
 * Post-build script to copy icons to dist folder
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const iconsDir = resolve(projectRoot, 'public/icons');
const distIconsDir = resolve(projectRoot, 'dist/icons');

if (!existsSync(distIconsDir)) {
  mkdirSync(distIconsDir, { recursive: true });
}

const iconSizes = [16, 48, 128];
iconSizes.forEach(size => {
  const source = resolve(iconsDir, `icon${size}.png`);
  const dest = resolve(distIconsDir, `icon${size}.png`);

  if (existsSync(source)) {
    copyFileSync(source, dest);
    console.log(`Copied icon${size}.png to dist/icons/`);
  } else {
    console.warn(`Warning: icon${size}.png not found in public/icons/`);
  }
});

console.log('Icons copied successfully!');
