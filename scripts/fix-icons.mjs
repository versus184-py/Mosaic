import { readFileSync, writeFileSync } from 'fs';
import { PNG } from 'pngjs';

const files = [
  'src-tauri/icons/32x32.png',
  'src-tauri/icons/128x128.png',
  'src-tauri/icons/128x128@2x.png',
];

for (const file of files) {
  const buf = readFileSync(file);
  const png = PNG.sync.read(buf);
  if (png.data.length !== png.width * png.height * 4) {
    console.error(`Unexpected data length for ${file}`);
    continue;
  }
  // Ensure RGBA — if the file was RGB, pngjs already converts to RGBA on read
  // Just write it back in RGBA format
  const fixed = PNG.sync.write(png);
  writeFileSync(file, fixed);
  console.log(`Fixed: ${file} (${png.width}x${png.height}, RGBA)`);
}
