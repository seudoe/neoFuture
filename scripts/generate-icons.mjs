/**
 * Generates PWA icons using sharp (already installed by Next.js).
 * Run: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Build an SVG icon — green circle with white "A"
function makeSvg(size) {
  const r   = size / 2;
  const fs  = Math.round(size * 0.52);
  const cy  = Math.round(r + size * 0.03);
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <circle cx="${r}" cy="${r}" r="${r}" fill="#16a34a"/>
      <text x="${r}" y="${cy}" font-family="Arial,sans-serif" font-size="${fs}"
            font-weight="bold" fill="white" text-anchor="middle"
            dominant-baseline="middle">A</text>
    </svg>
  `);
}

for (const size of SIZES) {
  await sharp(makeSvg(size))
    .png()
    .toFile(join(OUT, `icon-${size}x${size}.png`));
  console.log(`✓ icon-${size}x${size}.png`);
}

console.log('\nAll icons generated in public/icons/');
