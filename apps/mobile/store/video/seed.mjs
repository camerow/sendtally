// Resets the demo account on the local API and seeds ten weeks of believable history.
// Runs against `wrangler dev` (localhost:8787) and the Clerk development instance only.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEMO_EMAIL = "demo+clerk_test@sendtally.com";
const API = process.env.DEMO_API_URL ?? "http://localhost:8787";
const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const apiDir = path.join(repo, "packages/api");

function clerkSecret() {
  const vars = fs.readFileSync(path.join(apiDir, ".dev.vars"), "utf8");
  const key = vars.match(/^CLERK_SECRET_KEY="?([^"\n]+)"?$/m)?.[1]?.trim();
  if (!key?.startsWith("sk_test_")) throw new Error("needs the Clerk development secret key");
  return key;
}

async function clerk(secret, method, route, body) {
  const res = await fetch(`https://api.clerk.com/v1${route}`, {
    method,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`clerk ${method} ${route}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function demoUser(secret) {
  const found = await clerk(
    secret,
    "GET",
    `/users?email_address=${encodeURIComponent(DEMO_EMAIL)}`
  );
  if (found.length > 0) return found[0].id;
  const made = await clerk(secret, "POST", "/users", {
    email_address: [DEMO_EMAIL],
    first_name: "Sam",
    skip_password_requirement: true,
  });
  return made.id;
}

async function token(secret, userId) {
  const session = await clerk(secret, "POST", "/sessions", { user_id: userId });
  const { jwt } = await clerk(secret, "POST", `/sessions/${session.id}/tokens`, {
    expires_in_seconds: 600,
  });
  return jwt;
}

function d1(sql) {
  const out = execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "DB", "--local", "--json", "--command", sql],
    { cwd: apiDir, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
  );
  return JSON.parse(out)[0].results;
}

function wipe(userId) {
  const tables = d1("SELECT name, sql FROM sqlite_master WHERE type = 'table'")
    .filter((r) => /[("\s`]user_id["`\s]/.test(r.sql ?? ""))
    .map((r) => r.name);
  const quoted = userId.replace(/'/g, "''");
  d1(tables.map((t) => `DELETE FROM "${t}" WHERE user_id = '${quoted}';`).join(" "));
  return tables.length;
}

async function api(jwt, method, route, body) {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`api ${method} ${route}: ${res.status} ${await res.text()}`);
  return res.json();
}

// A fixed LCG so every run seeds the same history relative to today.
let state = 7;
const rand = () => (state = (state * 48271) % 2147483647) / 2147483647;
const pick = (xs) => xs[Math.floor(rand() * xs.length)];

const isoDay = (daysAgo) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

const GYM = "Northside Bouldering";
const INDOOR = [
  { weekday: 2, name: "Tuesday night session", start: "18:30", end: "20:30" },
  { weekday: 4, name: "Thursday volume", start: "18:00", end: "19:45" },
  { weekday: 6, name: "Saturday limit session", start: "10:00", end: "12:30" },
];
const PROBLEMS = [
  "Blue roof",
  "Corner crimps",
  "Pinch traverse",
  "Slab dyno",
  "Arete",
  "Comp block",
];

function indoorClimbs(progress) {
  const top = 4 + Math.round(progress * 2);
  const climbs = [];
  for (let v = top - 3; v <= top; v++) {
    const count = v === top ? 1 : 2 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      climbs.push({
        name: "",
        grade: { scale: "v", value: v },
        kind: "send",
        tries: 1 + Math.floor(rand() * 2),
      });
    }
  }
  climbs.push({
    name: pick(PROBLEMS),
    grade: { scale: "v", value: top + 1 },
    kind: "attempt",
    tries: 3 + Math.floor(rand() * 4),
  });
  return climbs;
}

// Three days outdoors last week, which the trip beat groups on camera.
export const TRIP = { from: 5, to: 3 };
const OUTDOOR = [
  [
    { name: "Gunsmoke", v: 3 },
    { name: "Chair Rock", v: 4 },
    { name: "Stem Gem", v: 5, attempt: true },
  ],
  [
    { name: "Pigpen", v: 4 },
    { name: "Cranny", v: 2 },
    { name: "Stem Gem", v: 5 },
  ],
  [
    { name: "Big Moe", v: 5, attempt: true },
    { name: "Planet X", v: 3 },
    { name: "Turtle Face", v: 2 },
  ],
];

function history() {
  const sessions = [];
  for (let daysAgo = 70; daysAgo >= 1; daysAgo--) {
    const date = isoDay(daysAgo);
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const outdoor = TRIP.from - daysAgo;
    if (outdoor >= 0 && outdoor < OUTDOOR.length) {
      sessions.push({
        name: `Desert day ${outdoor + 1}`,
        date,
        startTime: "09:00",
        endTime: "15:00",
        location: "outdoor",
        rpe: 7 + (outdoor % 2),
        climbs: OUTDOOR[outdoor].map((c) => ({
          name: c.name,
          grade: { scale: "v", value: c.v },
          kind: c.attempt ? "attempt" : "send",
          tries: c.attempt ? 4 : 2,
        })),
      });
      continue;
    }
    const slot = INDOOR.find((s) => s.weekday === weekday);
    if (slot === undefined || rand() < 0.12 || (daysAgo >= TRIP.to - 1 && daysAgo <= TRIP.from + 1))
      continue;
    sessions.push({
      name: slot.name,
      date,
      startTime: slot.start,
      endTime: slot.end,
      location: "indoor",
      gym: GYM,
      climbs: indoorClimbs(1 - daysAgo / 70),
    });
  }
  return sessions;
}

const secret = clerkSecret();
const userId = await demoUser(secret);
console.log(`demo user ${userId}, wiped ${wipe(userId)} tables`);
const jwt = await token(secret, userId);
await api(jwt, "POST", "/v1/gyms", {
  name: GYM,
  scale: "v",
  circuits: [],
  walls: ["Cave", "Slab", "Comp wall"],
});
const result = await api(jwt, "POST", "/v1/sessions/import", { sessions: history() });
console.log(`imported ${result.imported} sessions`);

// Max hangs a few times with the load creeping up, so the timer opens on the last one.
const LB = 0.45359237;
for (const [i, [daysAgo, lb]] of [
  [19, 15],
  [12, 17.5],
  [5, 20],
].entries()) {
  await api(jwt, "PUT", `/v1/hang/sessions/demo-max-hangs-${i}`, {
    workoutId: "max10",
    gripId: "half",
    date: isoDay(daysAgo),
    edgeMm: 20,
    loadKg: Math.round(lb * LB * 1000) / 1000,
    pct: 100,
    misses: 0,
    rpe: 8,
    protocol: {
      name: "Max hangs",
      kind: "hang",
      hangS: 10,
      restS: 0,
      reps: 1,
      sets: 5,
      setRestS: 180,
    },
  });
}
console.log("seeded 3 hang sessions");
