/**
 * Badstyle Photography — Sharp Image Optimization Pipeline
 * Generates lightweight WebP thumbnails (for fast gallery flow/grid)
 * and high-resolution WebP masters (for fullscreen PhotoSwipe lightbox).
 *
 * Usage: npm run optimize:images
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const PORTRAITS_DIR = path.join(ROOT, 'images', 'portraits');
const THUMBS_DIR = path.join(PORTRAITS_DIR, 'thumbs');
const FULL_DIR = path.join(PORTRAITS_DIR, 'full');
const DATA_DIR = path.join(ROOT, 'data');

async function optimizeImages() {
  fs.mkdirSync(THUMBS_DIR, { recursive: true });
  fs.mkdirSync(FULL_DIR, { recursive: true });

  const files = fs
    .readdirSync(PORTRAITS_DIR)
    .filter((f) => /\.(jpe?g|png)$/i.test(f) && fs.statSync(path.join(PORTRAITS_DIR, f)).isFile())
    .sort();

  let originalTotal = 0;
  let thumbTotal = 0;
  let fullTotal = 0;
  const dimensionsMap = {};

  console.log(`Optimizing ${files.length} portrait images with sharp...`);

  for (const file of files) {
    const srcPath = path.join(PORTRAITS_DIR, file);
    const stem = path.parse(file).name;
    const thumbPath = path.join(THUMBS_DIR, `${stem}.webp`);
    const fullPath = path.join(FULL_DIR, `${stem}.webp`);

    originalTotal += fs.statSync(srcPath).size;

    // 1. Thumbnail WebP (height <= 900px, width <= 1200px)
    await sharp(srcPath)
      .rotate()
      .resize({ width: 1200, height: 900, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toFile(thumbPath);

    // 2. Fullscreen WebP (max 2048px longest side)
    const fullInfo = await sharp(srcPath)
      .rotate()
      .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86, effort: 4 })
      .toFile(fullPath);

    thumbTotal += fs.statSync(thumbPath).size;
    fullTotal += fs.statSync(fullPath).size;

    dimensionsMap[file] = {
      thumb: `images/portraits/thumbs/${stem}.webp`,
      full: `images/portraits/full/${stem}.webp`,
      width: fullInfo.width,
      height: fullInfo.height,
      aspectRatio: (fullInfo.width / fullInfo.height).toFixed(3),
    };
  }

  // 3. Optimize About portrait if present
  const aboutSrc = path.join(ROOT, 'images', 'badstyle_about.jpg');
  const aboutOut = path.join(ROOT, 'images', 'badstyle_about.webp');
  if (fs.existsSync(aboutSrc)) {
    await sharp(aboutSrc)
      .rotate()
      .resize({ width: 1400, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86, effort: 4 })
      .toFile(aboutOut);
    console.log(
      `Optimized about photo: ${(fs.statSync(aboutSrc).size / 1024).toFixed(1)} KB -> ${(fs.statSync(aboutOut).size / 1024).toFixed(1)} KB`
    );
  }

  // 4. Sync portraits.json if present
  const portraitsJsonPath = path.join(DATA_DIR, 'portraits.json');
  if (fs.existsSync(portraitsJsonPath)) {
    const json = JSON.parse(fs.readFileSync(portraitsJsonPath, 'utf8'));
    if (Array.isArray(json.items)) {
      json.items = json.items.map((item) => {
        const baseName = path.basename(item.originalSrc || item.src || '').replace(/\.webp$/i, '.jpg');
        const info = dimensionsMap[baseName];
        if (info) {
          return {
            ...item,
            thumb: info.thumb,
            src: info.full,
            width: info.width,
            height: info.height,
            aspectRatio: info.aspectRatio,
          };
        }
        return item;
      });
      fs.writeFileSync(portraitsJsonPath, JSON.stringify(json, null, 2));
    }
  }

  const mb = (b) => (b / (1024 * 1024)).toFixed(2);
  console.log(`Original JPEGs total: ${mb(originalTotal)} MB`);
  console.log(`Thumb WebPs total:    ${mb(thumbTotal)} MB (${((1 - thumbTotal / originalTotal) * 100).toFixed(1)}% smaller!)`);
  console.log(`Full WebPs total:     ${mb(fullTotal)} MB (${((1 - fullTotal / originalTotal) * 100).toFixed(1)}% smaller!)`);
}

optimizeImages().catch((err) => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});
