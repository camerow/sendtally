// Writes the v3 store screenshot artboards (artboards/{ios,android}-set3-*.html) from the
// captions below, in the same layout as the September set. Edit a caption here, then run
// `node store/render.mjs set3` from apps/mobile. The artboards are generated, so they are
// gitignored; render.mjs writes them before it renders.
// The screens are simulator captures in store/screens/v3-*.jpg (1206x2622).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const artboards = path.join(path.dirname(fileURLToPath(import.meta.url)), "artboards");

export const SET3 = [
  {
    slug: "01-hero-log",
    kind: "hero",
    tagline: "climbing log & training",
    title: "Log your climbing.<br />Plan your training.",
    screen: "v3-log-climbing",
  },
  {
    slug: "02-live-tally",
    eyebrow: "Gym sessions",
    title: "Count every climb as you climb it.",
    screen: "v3-live-tally",
    dark: true,
  },
  {
    slug: "03-train",
    kind: "pair",
    a: {
      eyebrow: "Training blocks",
      title: "Build a block, or start from the library.",
      screen: "v3-block",
    },
    b: {
      eyebrow: "Workouts",
      title: "Built-in workouts, plus your own.",
      screen: "v3-train-workouts",
    },
  },
  {
    slug: "04-plan",
    eyebrow: "Plan",
    title: "Your week, your month, your year.",
    screen: "v3-plan",
  },
  {
    slug: "05-live-workout",
    eyebrow: "Live workouts",
    title: "Press Start and the workout runs itself.",
    screen: "v3-sets-player",
  },
  {
    slug: "06-hangboard",
    eyebrow: "Hangboard",
    title: "A hang timer that keeps your load.",
    screen: "v3-hang-timer",
    dark: true,
  },
  { slug: "07-stats", eyebrow: "Stats", title: "See what changed.", screen: "v3-stats-climbing" },
];

const MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";
const DISPLAY = "'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif";

const logo = (tagline) => `
<div style="position:absolute;left:0;right:0;top:118px;display:flex;align-items:center;justify-content:center;gap:35px">
  <svg viewBox="0 0 32 32" width="104" height="104" style="flex:none;display:block">
    <rect width="32" height="32" rx="8" fill="#f9dc5c"></rect>
    <path d="M9.5 22.5 16 16l6.5-6.5" fill="none" stroke="#403f4c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>
    <circle cx="9.5" cy="22.5" r="3.1" fill="#403f4c"></circle><circle cx="16" cy="16" r="3.1" fill="#403f4c"></circle><circle cx="22.5" cy="9.5" r="3.1" fill="#403f4c"></circle>
  </svg>
  <div style="display:flex;flex-direction:column;gap:11px">
    <span style="font-family:${MONO};font-weight:600;font-size:62px;letter-spacing:-0.02em;color:#eed3f8;line-height:1">sendtally</span>
    <span style="font-family:${MONO};font-weight:500;font-size:22px;letter-spacing:0.16em;text-transform:uppercase;color:#eed3f8;opacity:0.72;line-height:1;white-space:nowrap">${tagline}</span>
  </div>
</div>`;

const caption = ({ eyebrow, title }, left, top) => `
<div style="position:absolute;left:${left}px;width:1290px;top:${top}px;padding:0 90px;box-sizing:border-box;display:flex;flex-direction:column;gap:26px">
  ${eyebrow === undefined ? "" : `<div style="font-family:${MONO};font-size:42px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#f9dc5c;text-align:center">${eyebrow}</div>`}
  <div style="font-family:${DISPLAY};font-size:88px;font-weight:800;letter-spacing:-0.035em;line-height:1;color:#ffffff;text-align:center;text-wrap:balance">${title}</div>
</div>`;

// Google Play frames cover the iOS status bar with an Android one.
const androidBar = (dark) => `
<div style="position:absolute;left:0;top:0;right:0;height:12.9cqw;background:${dark ? "#403f4c" : "#ffffff"};z-index:1;font-family:Roboto,system-ui,sans-serif;font-weight:500;font-size:3.4cqw;color:${dark ? "#ffffff" : "#1f1f1f"}">
  <span style="position:absolute;left:7cqw;top:50%;transform:translateY(-50%);line-height:1">9:41</span>
  <span style="position:absolute;left:50%;top:50%;width:3.4cqw;height:3.4cqw;transform:translate(-50%,-50%);border-radius:50%;background:#101014"></span>
  <span style="position:absolute;right:6.4cqw;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:1.1cqw">
    <svg viewBox="0 0 24 24" style="height:3.1cqw;display:block"><path d="M12 20.5 .5 8.2C3.6 5.3 7.6 3.5 12 3.5s8.4 1.8 11.5 4.7z" fill="currentColor" /></svg>
    <svg viewBox="0 0 24 24" style="height:3.1cqw;display:block"><path d="M2 22h20V2z" fill="currentColor" /></svg>
    <svg viewBox="0 0 24 24" style="height:3.3cqw;display:block"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" fill="currentColor" /></svg>
  </span>
</div>`;

const phone = ({ screen, dark }, { left, top, width, rotate = 0, z = 1 }, android) => {
  const inner = width - 20;
  return `
<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;box-sizing:border-box;border-radius:${Math.round(width * 0.138)}px;overflow:hidden;border:10px solid #1d1c24;background:#1d1c24;box-shadow:0 30px 80px rgba(20,19,26,0.45);z-index:${z};transform:rotate(${rotate}deg);container-type:inline-size">
  <img src="../screens/${screen}.jpg" alt="" style="display:block;width:${inner}px;height:${Math.round(inner * 2.173)}px;object-fit:cover;object-position:top" />
  ${android ? androidBar(dark === true) : ""}
</div>`;
};

// Every board is drawn on the 1290x2796 layout and scaled to the store's size. Play's
// 1080x1920 is shorter, so its phones start higher. iOS is 1290x2796, the 6.9" size: App Store
// Connect refused 1284x2778 for this set with "File dimensions are invalid".
function board(name, body, android) {
  const [w, h, sx, sy] = android ? [1080, 1920, 0.837209, 0.837209] : [1290, 2796, 1, 1];
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${name}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&amp;family=IBM+Plex+Mono:wght@400;500;600&amp;family=IBM+Plex+Sans:wght@400;500;600&amp;family=Roboto:wght@500&amp;display=swap" />
    <style>
      body { margin: 0; font-family: "IBM Plex Sans", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    </style>
  </head>
  <body>
    <div style="width: ${w}px; height: ${h}px; background: #403f4c; position: relative; overflow: hidden">
      <div style="position:absolute;left:0;top:0;width:1290px;height:2796px;transform:scale(${sx}, ${sy});transform-origin:0 0">${body}
      </div>
    </div>
  </body>
</html>
`;
}

function bodies(entry, android) {
  const lift = android ? 107 : 0;
  if (entry.kind === "hero") {
    return [
      [
        entry.slug,
        logo(entry.tagline) +
          caption(entry, 0, 268) +
          phone(entry, { left: 138, top: 580 - lift / 2, width: 1014 }, android),
      ],
    ];
  }
  if (entry.kind === "pair") {
    const spread = (offset) => `
<div style="position:absolute;left:${offset}px;top:0;width:2580px;height:2796px">
  <div style="position:absolute;left:-200px;top:${1650 - lift}px;width:3000px;height:560px;background:#f9dc5c;transform:rotate(-8deg);transform-origin:center"></div>
  ${caption(entry.a, 0, 150)}${caption(entry.b, 1290, 150)}
  ${phone(entry.a, { left: 250, top: 760 - lift, width: 1080, rotate: -5 }, android)}
  ${phone(entry.b, { left: 1250, top: 700 - lift, width: 1080, rotate: 5, z: 2 }, android)}
</div>`;
    return [
      [`${entry.slug}-a`, spread(0)],
      [`${entry.slug}-b`, spread(-1290)],
    ];
  }
  return [
    [
      entry.slug,
      caption(entry, 0, 150) + phone(entry, { left: 138, top: 580 - lift, width: 1014 }, android),
    ],
  ];
}

export const set3Boards = SET3.flatMap((entry) =>
  ["ios", "android"].flatMap((platform) =>
    bodies(entry, platform === "android").map(([slug, body]) => ({ platform, slug, body }))
  )
);

// Apple's creative assets (iOS 27 App Store): the product page header at 21:9 and the search
// results asset at 3:2. No prices, URLs or other stores' logos are allowed in them, and the
// focal point stays in the middle because the store crops the edges on some devices.
const mark = (size) => `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" style="flex:none;display:block">
  <rect width="32" height="32" rx="8" fill="#f9dc5c"></rect>
  <path d="M9.5 22.5 16 16l6.5-6.5" fill="none" stroke="#403f4c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>
  <circle cx="9.5" cy="22.5" r="3.1" fill="#403f4c"></circle><circle cx="16" cy="16" r="3.1" fill="#403f4c"></circle><circle cx="22.5" cy="9.5" r="3.1" fill="#403f4c"></circle>
</svg>`;

const lockup = (size) => `
<div style="display:flex;align-items:center;gap:${Math.round(size * 0.34)}px">${mark(size)}
  <span style="font-family:${MONO};font-weight:600;font-size:${Math.round(size * 0.6)}px;letter-spacing:-0.02em;color:#eed3f8;line-height:1">sendtally</span>
</div>`;

const headline = (size, align) =>
  `<div style="font-family:${DISPLAY};font-size:${size}px;font-weight:800;letter-spacing:-0.035em;line-height:1;color:#ffffff;text-align:${align}">${CREATIVE_TITLE}</div>`;

const band = (top, height) =>
  `<div style="position:absolute;left:-400px;top:${top}px;width:4640px;height:${height}px;background:#f9dc5c;transform:rotate(-6deg);transform-origin:center"></div>`;

export const CREATIVE_TITLE = "Log your climbing.<br />Plan your training.";

const CREATIVE = [
  {
    slug: "creative-header",
    width: 3840,
    height: 1646,
    body: `${band(1180, 420)}
<div style="position:absolute;left:800px;top:0;height:1646px;width:1180px;display:flex;flex-direction:column;justify-content:center;gap:70px">
  ${lockup(150)}${headline(146, "left")}
</div>
${phone({ screen: "v3-log-climbing" }, { left: 2010, top: 330, width: 500, rotate: -5 })}
${phone({ screen: "v3-plan" }, { left: 2400, top: 230, width: 500, z: 3 })}
${phone({ screen: "v3-hang-timer" }, { left: 2790, top: 330, width: 500, rotate: 5, z: 2 })}`,
  },
  {
    slug: "creative-search",
    width: 3840,
    height: 2560,
    body: `${band(1500, 620)}
<div style="position:absolute;left:0;right:0;top:190px;display:flex;flex-direction:column;align-items:center;gap:80px">
  ${lockup(170)}${headline(200, "center")}
</div>
${phone({ screen: "v3-log-climbing" }, { left: 690, top: 1010, width: 780, rotate: -5 })}
${phone({ screen: "v3-plan" }, { left: 1530, top: 900, width: 780, z: 3 })}
${phone({ screen: "v3-hang-timer" }, { left: 2370, top: 1010, width: 780, rotate: 5, z: 2 })}`,
  },
  {
    // Google Play's feature graphic, drawn at 3840x1875 and scaled to 1024x500.
    platform: "android",
    slug: "feature-graphic",
    width: 1024,
    height: 500,
    body: `<div style="position:absolute;left:0;top:0;width:3840px;height:1875px;transform:scale(0.266667);transform-origin:0 0">
${band(1300, 440)}
<div style="position:absolute;left:560px;top:0;height:1875px;width:1380px;display:flex;flex-direction:column;justify-content:center;gap:80px">
  ${lockup(180)}${headline(172, "left")}
</div>
${phone({ screen: "v3-log-climbing" }, { left: 2010, top: 400, width: 560, rotate: -5 })}
${phone({ screen: "v3-plan" }, { left: 2440, top: 290, width: 560, z: 3 })}
${phone({ screen: "v3-hang-timer" }, { left: 2870, top: 400, width: 560, rotate: 5, z: 2 })}
</div>`,
  },
];

export const creativeBoards = CREATIVE.map(({ platform = "ios", slug }) => ({ platform, slug }));

const creativePage = ({ platform = "ios", slug, width, height, body }) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${platform}-set3-${slug}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&amp;family=IBM+Plex+Mono:wght@600&amp;display=swap" />
    <style>
      body { margin: 0; -webkit-font-smoothing: antialiased; }
    </style>
  </head>
  <body>
    <div style="width: ${width}px; height: ${height}px; background: #403f4c; position: relative; overflow: hidden">${body}
    </div>
  </body>
</html>
`;

export function writeSet3() {
  for (const { platform, slug, body } of set3Boards) {
    const name = `${platform}-set3-${slug}`;
    fs.writeFileSync(
      path.join(artboards, `${name}.html`),
      board(name, body, platform === "android")
    );
  }
  for (const creative of CREATIVE) {
    fs.writeFileSync(
      path.join(artboards, `${creative.platform ?? "ios"}-set3-${creative.slug}.html`),
      creativePage(creative)
    );
  }
}
