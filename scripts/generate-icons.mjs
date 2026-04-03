import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

const sourceIcon = join(publicDir, 'logo-nuevo.png');

async function generateIcons() {
  console.log('Generating PWA icons...');
  
  try {
    await sharp(sourceIcon)
      .resize(192, 192)
      .png()
      .toFile(join(iconsDir, 'icon-192.png'));
    console.log('Created: icons/icon-192.png');
    
    await sharp(sourceIcon)
      .resize(512, 512)
      .png()
      .toFile(join(iconsDir, 'icon-512.png'));
    console.log('Created: icons/icon-512.png');
    
    console.log('PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
