import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.join(here, "..");
const artboards = path.join(here, "artboards");

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

// `alpha: false` flattens the alpha channel away: App Store Connect rejects an
// app icon that carries one, and the stores want opaque screenshots.
const targets = [
  { board: "icon-ios-1024", to: "assets/icon.png", alpha: false },
  { board: "icon-adaptive-foreground", to: "assets/adaptive-icon.png", alpha: true },
  { board: "splash-mark", to: "assets/splash-mark.png", alpha: true },
  { board: "icon-play-512", to: "store/out/play-icon-512.png", alpha: false },
  { board: "feature-graphic", to: "store/out/feature-graphic.png", alpha: false },
  { board: "ios-sessions", to: "store/out/ios/1-sessions.png", alpha: false },
  { board: "ios-log-session", to: "store/out/ios/2-log-session.png", alpha: false },
  { board: "ios-session-detail", to: "store/out/ios/3-session-detail.png", alpha: false },
  { board: "ios-trends", to: "store/out/ios/4-trends.png", alpha: false },
  { board: "ios-strava", to: "store/out/ios/5-strava.png", alpha: false },
  { board: "android-sessions", to: "store/out/android/1-sessions.png", alpha: false },
  { board: "android-log-session", to: "store/out/android/2-log-session.png", alpha: false },
  { board: "android-session-detail", to: "store/out/android/3-session-detail.png", alpha: false },
  { board: "android-trends", to: "store/out/android/4-trends.png", alpha: false },
  { board: "android-strava", to: "store/out/android/5-strava.png", alpha: false },
  // In-app purchase assets. Apple wants the promotional image flattened with no
  // rounded corners, and the review screenshot at one of the sizes the app
  // supports, so it is rendered at 430x932 logical, the 6.7" phone.
  { board: "iap-promo-1024", to: "store/out/ios/iap-promo-1024.png", alpha: false },
  { board: "iap-review-shot", to: "store/out/ios/iap-review-shot.png", alpha: false },
];

function chromePath() {
  const found = CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (found === undefined) {
    throw new Error(`no Chrome found. Looked in:\n  ${CHROME_CANDIDATES.join("\n  ")}`);
  }
  return found;
}

function boardSize(file) {
  const match = fs.readFileSync(file, "utf8").match(/width:\s*(\d+)px;\s*height:\s*(\d+)px/);
  if (match === null) throw new Error(`no root size in ${path.basename(file)}`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

const browser = await puppeteer.launch({
  executablePath: chromePath(),
  headless: true,
  args: ["--force-device-scale-factor=1", "--hide-scrollbars", "--font-render-hinting=none"],
});

const failures = [];

try {
  for (const { board, to, alpha } of targets) {
    const file = path.join(artboards, `${board}.html`);
    const size = boardSize(file);
    const out = path.join(mobile, to);
    fs.mkdirSync(path.dirname(out), { recursive: true });

    const page = await browser.newPage();
    try {
      await page.setViewport({ ...size, deviceScaleFactor: 1 });
      await page.goto(`file://${file}`, { waitUntil: "networkidle0" });
      // The screenshot boards pull Bricolage Grotesque and IBM Plex from Google
      // Fonts. Capturing before they land silently substitutes Helvetica.
      await page.evaluate(() => document.fonts.ready);

      const shot = await page.screenshot({
        type: "png",
        omitBackground: alpha,
        clip: { x: 0, y: 0, ...size },
      });

      const image = sharp(shot);
      const buffer = await (alpha ? image : image.removeAlpha())
        .png({ compressionLevel: 9 })
        .toBuffer();
      fs.writeFileSync(out, buffer);
    } finally {
      await page.close();
    }

    const meta = await sharp(out).metadata();
    if (meta.width !== size.width || meta.height !== size.height) {
      failures.push(`${board}: ${meta.width}x${meta.height}, wanted ${size.width}x${size.height}`);
      continue;
    }
    if (alpha === false && meta.channels !== 3) {
      failures.push(`${board}: ${meta.channels} channels after flatten, wanted 3`);
      continue;
    }
    console.log(`${to.padEnd(38)} ${meta.width}x${meta.height}  ${meta.channels}ch`);
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`\n${failures.length} artboard(s) failed:`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
