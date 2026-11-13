// Composites the raw simulator takes from capture.sh into the ad cuts and a contact sheet.
// Usage: node store/video/edit.mjs [takes dir] [out dir]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const badges = path.join(here, "../../../web/public/images/badges");
const takes = path.resolve(
  process.argv[2] ?? path.join(os.homedir(), "Movies/sendtally-app-demo/takes")
);
const out = path.resolve(process.argv[3] ?? path.join(takes, ".."));
const work = fs.mkdtempSync(path.join(os.tmpdir(), "sendtally-video-"));

const BG = "#403f4c";
const FRAME = "#1d1c24";
const YELLOW = "#f9dc5c";
const LILAC = "#eed3f8";
const FPS = 30;
const XFADE = 0.35;

// Each beat plays a window of its take, [from, to] in seconds, sped up to fit its hold.
// `shorts` is the longer hold for the Shorts cut, which has time to let a beat breathe.
const BEATS = [
  {
    take: "train",
    kicker: "Train",
    headline: "Build training blocks to match your goals.",
    from: 10,
    to: 31,
    hold: 5.5,
    shorts: 9,
  },
  {
    take: "trip",
    kicker: "Journal",
    headline: "Group climbs under a trip.",
    from: 3,
    to: 19,
    hold: 4.5,
    shorts: 8,
  },
  {
    take: "live",
    kicker: "Log",
    headline: "Count every climb as you climb it.",
    from: 6,
    to: 21,
    hold: 4.5,
    shorts: 8,
  },
  {
    take: "hang",
    kicker: "Hangboard",
    headline: "A hang timer that keeps your load.",
    from: 2,
    to: 13,
    hold: 4.5,
    shorts: 8,
  },
  {
    take: "stats",
    kicker: "Stats",
    headline: "See what changed.",
    from: 0,
    to: 3.5,
    hold: 3.5,
    shorts: 6,
  },
];
const END_HOLD = 3.2;

const FORMATS = {
  "16x9": { w: 1920, h: 1080 },
  "1x1": { w: 1080, h: 1080 },
  "9x16": { w: 1080, h: 1920 },
};

const SCREEN_RATIO = 1206 / 2622;

// Phone and text boxes per format, all inside the centre 80% Google keeps clear of its own UI.
function layout({ w, h }) {
  const safe = { x: w * 0.1, y: h * 0.1, w: w * 0.8, h: h * 0.8 };
  if (w > h) {
    const outerH = safe.h;
    const phone = phoneBox(outerH, w * 0.72, safe.y);
    return {
      safe,
      phone,
      text: {
        x: safe.x,
        y: safe.y,
        w: phone.x - safe.x - 120,
        h: safe.h,
        size: 84,
        align: "center",
      },
    };
  }
  if (w === h) {
    const phone = phoneBox(safe.h, safe.x + safe.w, safe.y, "right");
    return {
      safe,
      phone,
      text: {
        x: safe.x,
        y: safe.y,
        w: phone.x - safe.x - 56,
        h: safe.h,
        size: 60,
        align: "center",
      },
    };
  }
  const textH = 300;
  const phone = phoneBox(safe.h - textH, w / 2, safe.y + textH);
  return {
    safe,
    phone,
    text: { x: safe.x, y: safe.y, w: safe.w, h: textH - 40, size: 68, align: "top", centred: true },
  };
}

function phoneBox(outerH, anchorX, y, anchor = "centre") {
  const bezel = Math.round(outerH * 0.018);
  const screenH = outerH - bezel * 2;
  const screenW = Math.round((screenH * SCREEN_RATIO) / 2) * 2;
  const outerW = screenW + bezel * 2;
  const x = Math.round(anchor === "right" ? anchorX - outerW : anchorX - outerW / 2);
  return {
    x,
    y: Math.round(y),
    w: outerW,
    h: Math.round(outerH),
    bezel,
    screen: { x: x + bezel, y: Math.round(y) + bezel, w: screenW, h: Math.round(screenH / 2) * 2 },
  };
}

const roundRect = (x, y, w, h, r) =>
  `M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 -${r},${r}` +
  `h-${w - 2 * r}a${r},${r} 0 0 1 -${r},-${r}v-${h - 2 * r}a${r},${r} 0 0 1 ${r},-${r}z`;

// Headless Chrome can sit for minutes on Google Fonts, so Node fetches them once and the
// pages carry them inline.
async function inlineFonts() {
  const css = await (
    await fetch(
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=IBM+Plex+Mono:wght@500;600&display=block",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36",
        },
      }
    )
  ).text();
  const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com[^)]+/g))];
  let inlined = css;
  for (const url of urls) {
    const bytes = Buffer.from(await (await fetch(url)).arrayBuffer()).toString("base64");
    inlined = inlined.replaceAll(url, `data:font/woff2;base64,${bytes}`);
  }
  return `<style>${inlined}</style>`;
}
const FONTS = await inlineFonts();

const LOGO_MARK = (
  size
) => `<svg viewBox="0 0 32 32" width="${size}" height="${size}" style="flex:none">
  <rect width="32" height="32" rx="8" fill="${YELLOW}"/>
  <path d="M9.5 22.5 16 16l6.5-6.5" fill="none" stroke="${BG}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="9.5" cy="22.5" r="3.1" fill="${BG}"/><circle cx="16" cy="16" r="3.1" fill="${BG}"/><circle cx="22.5" cy="9.5" r="3.1" fill="${BG}"/></svg>`;

const lockup = (
  size
) => `<div style="display:inline-flex;align-items:center;gap:${Math.round(size * 0.375)}px">${LOGO_MARK(size)}
  <span style="font-family:'IBM Plex Mono';font-weight:600;font-size:${Math.round(size * 0.59375)}px;letter-spacing:-0.02em;color:${LILAC};line-height:1">sendtally</span></div>`;

function beatHtml(format, beat, index) {
  const { w, h } = format;
  const { phone, text } = layout(format);
  const s = phone.screen;
  const screenR = Math.round(s.w * 0.135);
  const outerR = screenR + phone.bezel;
  const justify = text.align === "center" ? "center" : "flex-start";
  const textAlign = text.centred ? "center" : "left";
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
    html,body{margin:0;background:transparent}
    .kicker{font-family:'IBM Plex Mono';font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${YELLOW}}
    .headline{font-family:'Bricolage Grotesque';font-weight:800;letter-spacing:-0.035em;line-height:1.02;color:#fff;text-wrap:balance}
  </style></head><body><div style="position:relative;width:${w}px;height:${h}px;overflow:hidden">
    <svg width="${w}" height="${h}" style="position:absolute;inset:0">
      <path fill-rule="evenodd" fill="${BG}" d="M0,0H${w}V${h}H0Z${roundRect(phone.x, phone.y, phone.w, phone.h, outerR)}"/>
      <path fill-rule="evenodd" fill="${FRAME}" d="${roundRect(phone.x, phone.y, phone.w, phone.h, outerR)}${roundRect(s.x, s.y, s.w, s.h, screenR)}"/>
    </svg>
    <div style="position:absolute;left:${text.x}px;top:${text.y}px;width:${text.w}px;height:${text.h}px;display:flex;flex-direction:column;justify-content:${justify};text-align:${textAlign}">
      <div class="kicker" style="font-size:${Math.max(26, Math.round(text.size * 0.34))}px">${String(index + 1).padStart(2, "0")} · ${beat.kicker}</div>
      <div class="headline" style="font-size:${text.size}px;margin-top:${Math.round(text.size * 0.3)}px">${beat.headline}</div>
    </div>
  </div></body></html>`;
}

function endHtml({ w, h }) {
  const scale = Math.min(w, h) / 1080;
  const px = (n) => Math.round(n * scale);
  const img = (file) =>
    `data:${file.endsWith(".svg") ? "image/svg+xml" : "image/png"};base64,${fs.readFileSync(path.join(badges, file)).toString("base64")}`;
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}</head>
  <body style="margin:0"><div style="width:${w}px;height:${h}px;background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${px(56)}px;text-align:center">
    ${lockup(px(84))}
    <div style="font-family:'Bricolage Grotesque';font-weight:800;font-size:${px(w > h ? 96 : 84)}px;letter-spacing:-0.035em;line-height:1.02;color:#fff;max-width:${w * 0.8}px;text-wrap:balance">Log your climbing. Plan your training.</div>
    <div style="display:flex;gap:${px(28)}px;align-items:center">
      <img src="${img("app-store.svg")}" style="height:${px(88)}px;width:auto">
      <img src="${img("google-play.png")}" style="height:${px(88)}px;width:auto">
    </div>
    <div style="font-family:'IBM Plex Mono';font-weight:600;font-size:${px(36)}px;letter-spacing:0.04em;color:${YELLOW}">sendtally.com</div>
  </div></body></html>`;
}

const CHROME = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].find((p) => fs.existsSync(p));

async function renderPngs() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--force-device-scale-factor=1", "--hide-scrollbars", "--font-render-hinting=none"],
  });
  try {
    for (const [name, format] of Object.entries(FORMATS)) {
      const pages = [
        ...BEATS.map((b, i) => [`${name}-beat${i}`, beatHtml(format, b, i), true]),
        [`${name}-end`, endHtml(format), false],
      ];
      for (const [file, html, alpha] of pages) {
        const page = await browser.newPage();
        await page.setViewport({ width: format.w, height: format.h, deviceScaleFactor: 1 });
        await page.setContent(html, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({
          path: path.join(work, `${file}.png`),
          omitBackground: alpha,
          clip: { x: 0, y: 0, width: format.w, height: format.h },
        });
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

const ffmpeg = (args) =>
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    stdio: "inherit",
  });

function takeFile(name) {
  const file = path.join(takes, `${name}.mp4`);
  if (!fs.existsSync(file)) throw new Error(`missing take ${file}; run capture.sh first`);
  return file;
}

// One beat: the take scaled into the phone's screen, under the overlay with the screen cut out.
function beatClip(name, format, beat, i, seconds) {
  const s = layout(format).phone.screen;
  const file = path.join(work, `${name}-beat${i}-${seconds}.mp4`);
  ffmpeg([
    "-ss",
    String(beat.from),
    "-t",
    String(beat.to - beat.from),
    "-i",
    takeFile(beat.take),
    "-loop",
    "1",
    "-i",
    path.join(work, `${name}-beat${i}.png`),
    "-filter_complex",
    `color=c=${BG}:s=${format.w}x${format.h}:r=${FPS}[bg];` +
      `[0:v]setpts=PTS*${(seconds / (beat.to - beat.from)).toFixed(4)},fps=${FPS},scale=${s.w}:${s.h}:flags=lanczos,tpad=stop_mode=clone:stop_duration=${seconds}[app];` +
      `[bg][app]overlay=${s.x}:${s.y}[under];[under][1:v]overlay=0:0,format=yuv420p`,
    "-t",
    String(seconds),
    "-r",
    String(FPS),
    "-an",
    "-c:v",
    "libx264",
    "-crf",
    "16",
    "-preset",
    "medium",
    file,
  ]);
  return file;
}

function endClip(name) {
  const file = path.join(work, `${name}-end.mp4`);
  ffmpeg([
    "-loop",
    "1",
    "-i",
    path.join(work, `${name}-end.png`),
    "-vf",
    `fps=${FPS},format=yuv420p`,
    "-t",
    String(END_HOLD),
    "-an",
    "-c:v",
    "libx264",
    "-crf",
    "16",
    file,
  ]);
  return file;
}

// Crossfades the clips together and adds a silent stereo track, which some placements expect.
function cut(clips, durations, file) {
  const inputs = clips.flatMap((c) => ["-i", c]);
  let chain = "";
  let label = "[0:v]";
  let offset = 0;
  for (let i = 1; i < clips.length; i++) {
    offset += durations[i - 1] - XFADE;
    const next = i === clips.length - 1 ? "[v]" : `[x${i}]`;
    chain += `${label}[${i}:v]xfade=transition=fade:duration=${XFADE}:offset=${offset.toFixed(3)}${next};`;
    label = next;
  }
  ffmpeg([
    ...inputs,
    "-f",
    "lavfi",
    "-i",
    "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-filter_complex",
    chain.slice(0, -1),
    "-map",
    "[v]",
    "-map",
    `${clips.length}:a`,
    "-shortest",
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "18",
    "-preset",
    "slow",
    "-movflags",
    "+faststart",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-r",
    String(FPS),
    file,
  ]);
}

const duration = (file) =>
  Number(
    execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
      { encoding: "utf8" }
    )
  );

// One still per beat and one of the end card for every cut, taken late in each beat so it
// shows where the beat lands.
function contactSheet(cuts, file) {
  const stills = [];
  for (const { video, durations } of cuts) {
    let start = 0;
    for (const d of durations) {
      const still = path.join(work, `still-${stills.length}.png`);
      ffmpeg([
        "-ss",
        (start + d * 0.7).toFixed(2),
        "-i",
        video,
        "-frames:v",
        "1",
        "-vf",
        "scale=-2:540,pad=960:540:(ow-iw)/2:0:color=0x1d1c24",
        still,
      ]);
      stills.push(still);
      start += d - XFADE;
    }
  }
  ffmpeg([
    "-framerate",
    "1",
    "-i",
    path.join(work, "still-%d.png"),
    "-vf",
    `tile=${BEATS.length + 1}x${cuts.length}:padding=12:margin=12:color=0x1d1c24`,
    "-frames:v",
    "1",
    "-q:v",
    "3",
    file,
  ]);
}

await renderPngs();
fs.mkdirSync(out, { recursive: true });
const made = [];
const cuts = [
  ...Object.keys(FORMATS).map((name) => ({
    name,
    file: `sendtally-demo-${name}.mp4`,
    hold: (b) => b.hold,
  })),
  { name: "9x16", file: "sendtally-demo-shorts-9x16.mp4", hold: (b) => b.shorts },
];
for (const { name, file, hold } of cuts) {
  const format = FORMATS[name];
  const durations = [...BEATS.map(hold), END_HOLD];
  const clips = [...BEATS.map((b, i) => beatClip(name, format, b, i, hold(b))), endClip(name)];
  const target = path.join(out, file);
  cut(clips, durations, target);
  made.push({ video: target, durations });
  console.log(`${file.padEnd(34)} ${duration(target).toFixed(1)}s`);
}
contactSheet(made, path.join(out, "contact-sheet.jpg"));
fs.rmSync(work, { recursive: true, force: true });
console.log(`wrote ${out}`);
