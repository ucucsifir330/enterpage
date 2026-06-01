import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const IK_BASE = "https://ik.imagekit.io/kardoor/newrenderwebp";
const FRAME_COUNT = 103;
const CROP = { x: 1048, y: 416, width: 480, height: 588 };
const COLUMNS = 8;
const FRAME_QUALITY = 92;
const CONCURRENCY = 6;

const rootDir = path.resolve(import.meta.dirname, "..");
const outputDir = path.join(rootDir, "public");
const spriteFilename = "kardoor-door-sprite.webp";
const metadataFilename = "kardoor-door-sprite.json";
const spritePath = path.join(outputDir, spriteFilename);
const metadataPath = path.join(outputDir, metadataFilename);

const frameUrl = (frameNumber) =>
  `${IK_BASE}/${String(frameNumber).padStart(2, "0")}.webp`;

const transparentGreen = (data) => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const isRenderGreen = g > 68 && g > r * 1.22 && g > b * 1.18 && r < 120 && b < 120;

    if (isRenderGreen) {
      data[i + 3] = 0;
    }
  }

  return data;
};

const fetchFrame = async (frameNumber) => {
  const response = await fetch(frameUrl(frameNumber));

  if (!response.ok) {
    throw new Error(`Frame ${frameNumber} failed: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
};

const buildFrame = async (frameNumber) => {
  const input = await fetchFrame(frameNumber);
  const raw = await sharp(input)
    .extract({
      left: CROP.x,
      top: CROP.y,
      width: CROP.width,
      height: CROP.height
    })
    .ensureAlpha()
    .raw()
    .toBuffer();

  return sharp(transparentGreen(raw), {
    raw: {
      width: CROP.width,
      height: CROP.height,
      channels: 4
    }
  })
    .webp({ quality: FRAME_QUALITY, alphaQuality: 100, effort: 5 })
    .toBuffer();
};

const mapLimit = async (items, limit, worker) => {
  const results = new Array(items.length);
  let cursor = 0;

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await worker(items[index], index);
      }
    })
  );

  return results;
};

const main = async () => {
  await fs.mkdir(outputDir, { recursive: true });

  const frameNumbers = Array.from({ length: FRAME_COUNT }, (_, index) => index + 1);
  console.log(`Building Kardoor door sprite from ${FRAME_COUNT} ImageKit frames...`);

  const frames = await mapLimit(frameNumbers, CONCURRENCY, async (frameNumber) => {
    process.stdout.write(`.${frameNumber}`);
    return buildFrame(frameNumber);
  });

  process.stdout.write("\n");

  const rows = Math.ceil(FRAME_COUNT / COLUMNS);
  const spriteWidth = CROP.width * COLUMNS;
  const spriteHeight = CROP.height * rows;
  const metadataFrames = frameNumbers.map((frameNumber, index) => {
    const col = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);

    return {
      frame: frameNumber,
      x: col * CROP.width,
      y: row * CROP.height,
      width: CROP.width,
      height: CROP.height
    };
  });

  await sharp({
    create: {
      width: spriteWidth,
      height: spriteHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(
      frames.map((input, index) => ({
        input,
        left: metadataFrames[index].x,
        top: metadataFrames[index].y
      }))
    )
    .webp({ quality: FRAME_QUALITY, alphaQuality: 100, effort: 6 })
    .toFile(spritePath);

  const metadata = {
    sprite: `/${spriteFilename}`,
    frameWidth: CROP.width,
    frameHeight: CROP.height,
    columns: COLUMNS,
    rows,
    frames: metadataFrames
  };

  await fs.writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

  const spriteStats = await fs.stat(spritePath);
  console.log(`Sprite: public/${spriteFilename} (${(spriteStats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Metadata: public/${metadataFilename}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
