import sharp from 'sharp';
import path from 'path';

const inputPath = path.resolve('public/assets/logo.jpg');
const fullOutputPath = path.resolve('public/assets/logo-transparent.png');
const iconOutputPath = path.resolve('public/assets/logo-icono.png');

async function processLogos() {
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();

  // 1. Generate full transparent PNG
  const rawBuffer = await image.ensureAlpha().raw().toBuffer();

  for (let i = 0; i < rawBuffer.length; i += 4) {
    const r = rawBuffer[i];
    const g = rawBuffer[i + 1];
    const b = rawBuffer[i + 2];
    const maxVal = Math.max(r, g, b);

    if (maxVal < 25) {
      rawBuffer[i + 3] = 0;
    } else if (maxVal < 60) {
      const alpha = Math.floor(((maxVal - 25) / 35) * 255);
      rawBuffer[i + 3] = alpha;
    }
  }

  // Save full transparent logo
  await sharp(rawBuffer, {
    raw: { width, height, channels: 4 }
  })
  .png()
  .toFile(fullOutputPath);

  // 2. Crop just the top "A" emblem for the icon (top 48% height, center 50% width)
  const cropLeft = Math.floor(width * 0.30);
  const cropTop = Math.floor(height * 0.15);
  const cropWidth = Math.floor(width * 0.40);
  const cropHeight = Math.floor(height * 0.35);

  await sharp(rawBuffer, {
    raw: { width, height, channels: 4 }
  })
  .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
  .png()
  .toFile(iconOutputPath);

  console.log('✅ Generated logo-transparent.png and logo-icono.png!');
}

processLogos().catch(console.error);
