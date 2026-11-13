// Every string a visitor reads on sendtally.com and sendtally.com/pricing lives here,
// in page order. Components only read from it. Labels (eyebrows) render uppercase in
// the mono label style, so write them in natural case and keep them short.

import type { MediaKey, PhotoKey } from "./media";

export type MediaCopy = { key: MediaKey; alt: string };

export type FeatureCopy = {
  id: "log" | "train" | "plan" | "live" | "hangboard" | "stats";
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  media: [MediaCopy, MediaCopy];
  photo?: { key: PhotoKey; alt: string };
};

export type CompareCell = boolean | string;

export const COPY = {
  meta: {
    title: "sendtally - a climbing log and training app",
    description:
      "Log every climb, plan your training, run each workout on a timer and see it add up in Stats. Start with 30 days of everything, then keep logging for free.",
  },

  nav: {
    home: "sendtally home",
    sections: [
      { label: "Log", href: "#log" },
      { label: "Train", href: "#train" },
      { label: "Plan", href: "#plan" },
      { label: "Stats", href: "#stats" },
    ],
    pricing: "Pricing",
    signIn: "Sign in",
    createAccount: "Create account",
    getApp: "Get the app",
    openApp: "App →",
  },

  hero: {
    eyebrow: "Climbing log and training app",
    title: "Log your climbing. Plan your training.",
    body: "Tally a gym session as you climb, build a training block, run each workout on a timer, and watch it all add up in Stats. Start with 30 days of everything, then keep logging for free.",
    webAccount: "Or create a free account on the web",
    photoAlt: "A climber high on a streaked red sandstone wall in a narrow canyon",
    phone: {
      key: "heroLoop",
      alt: "A tour of the app: the Plan tab for this week, the Log, tallying climbs in a live session, starting a hang workout from Train, and the Stats tab",
    } as MediaCopy,
  },

  tabs: [
    { label: "Plan", title: "Your week, today first", href: "#plan" },
    { label: "Log", title: "Every climb and workout", href: "#log" },
    { label: "Train", title: "Blocks, workouts, exercises", href: "#train" },
    { label: "Stats", title: "Climbing and training over time", href: "#stats" },
  ],

  features: [
    {
      id: "log",
      eyebrow: "Log",
      title: "Count every climb as you climb it.",
      body: "Start a gym session, pick a grade, then tap Fell or Sent. Named sessions keep their climbs together, and a single climb can go in on its own.",
      points: [
        "Gym circuits by color, crags and areas outdoors",
        "A page for every climb, with notes and a Project flag",
        "Journal entries for trips and injuries",
        "V, Font, YDS and French grades",
      ],
      media: [
        {
          key: "liveTally",
          alt: "A live gym session: pick a grade, then tap Fell or Sent for each climb",
        },
        {
          key: "climbPage",
          alt: "A climb's page with the Project label, its days, tries and dated notes",
        },
      ],
      photo: {
        key: "desertCrag",
        alt: "Climbers at the base of a tall limestone crag in the desert",
      },
    },
    {
      id: "train",
      eyebrow: "Train",
      title: "Build a block, or start from the library.",
      body: "A block is weeks of workouts, with the days set for each week and the load for each week in one table.",
      points: [
        "Workouts grouped by focus, with built-ins like limit bouldering, 4x4s and ARC",
        "An exercise library, Fingers exercises included",
        "Ongoing workouts that repeat every week",
        "Save a block as a template and schedule it again",
      ],
      media: [
        {
          key: "block",
          alt: "A training block: week chips, this week's numbers and the week grid",
        },
        { key: "trainWorkouts", alt: "Train, Workouts: the library grouped by focus" },
      ],
    },
    {
      id: "plan",
      eyebrow: "Plan",
      title: "Your week, opened on today.",
      body: "Schedule a workout or a whole block. Done workouts get a check where they were planned, missed ones show, and any day can be rescheduled or skipped.",
      points: [
        "A calendar for the months ahead and behind",
        "Skip with a reason: rest, sick, sore, travel or busy",
      ],
      media: [
        {
          key: "plan",
          alt: "The Plan tab: the week strip, today's workout and the Schedule button",
        },
        {
          key: "calendar",
          alt: "The calendar: a month with a block running, done and missed days marked",
        },
      ],
      photo: { key: "pineFace", alt: "A climber on a gray face above the pines" },
    },
    {
      id: "live",
      eyebrow: "Live workouts",
      title: "Press Start and the workout runs itself.",
      body: "Sets, timers, intervals and checklists, with rests in line. Minimize it and it waits on a bar above the tabs. At the end, tick what you did and it is logged.",
      points: ["Did it without the timer? Log it", "Circuits and laps counted in moves or time"],
      media: [
        {
          key: "setsPlayer",
          alt: "The sets player: a set ticked, then the rest counting down in line",
        },
        { key: "livebar", alt: "A live workout minimized on the bar above the tabs" },
      ],
    },
    {
      id: "hangboard",
      eyebrow: "Hangboard",
      title: "A hang timer that keeps your load.",
      body: "Rep dots count every hang. Each set keeps its added weight, and each exercise gets a progress chart over time.",
      points: ["Compare exercises: best loads side by side"],
      media: [
        { key: "hangTimer", alt: "The hang timer: count-in, a hang, then the rest between sets" },
        { key: "fingersProgress", alt: "A Fingers exercise's added load over months of sessions" },
      ],
      photo: { key: "limestoneWall", alt: "A climber on a tall gray limestone wall" },
    },
    {
      id: "stats",
      eyebrow: "Stats",
      title: "See what changed.",
      body: "Climbing shows your grade pyramid, climbs by grade, average send and every day you climbed. Training shows what you trained by category or focus, the workouts you did most, and hangboard progress.",
      points: [],
      media: [
        {
          key: "statsClimbing",
          alt: "Stats, Climbing: the sends-by-grade pyramid and climbs by grade",
        },
        {
          key: "statsTraining",
          alt: "Stats, Training: effort and sessions over time, and what you trained",
        },
      ],
    },
  ] as FeatureCopy[],

  extras: [
    {
      eyebrow: "Effort",
      title: "An effort score for every session",
      body: "Rate it 1 to 10, or leave it and sendtally scores it against your own last eight weeks.",
    },
    {
      eyebrow: "Strava",
      title: "Posted to Strava, if you want",
      body: "One Rock Climbing activity per session, free for everyone.",
    },
    {
      eyebrow: "No signal",
      title: "Log at the crag",
      body: "Saves on your phone and syncs when you are back online.",
    },
  ],

  made: {
    eyebrow: "Made by",
    title: "Made by Will Cameron",
    paragraphs: [
      "I'm Will. I built sendtally because I wanted my climbing and my training in one place: what I sent, what I trained, and whether any of it is working.",
      "Questions, ideas or a bug? Write to me from the support page.",
    ],
    link: "Contact support",
    photoAlt: "Will Cameron at a desert boulder field, carrying two crash pads",
  },

  start: {
    eyebrow: "Free to start",
    title: "Start with 30 days of everything.",
    body: "Then keep logging, built-in workouts and Strava posting for free.",
    webAccount: "Or create a free account on the web",
    pricing: "See pricing ›",
  },

  pricing: {
    meta: {
      title: "Pricing - sendtally",
      description:
        "Start with 30 days of everything. Then keep logging for free, or stay a member for $23.99 a year or $2.99 a month.",
    },
    eyebrow: "Pricing",
    title: "Start with 30 days of everything.",
    body: "Then keep logging for free, or stay a member for $23.99 a year or $2.99 a month.",
    free: {
      name: "Free",
      amount: "$0",
      suffix: " forever",
      sub: "Logging, built-in training and Strava",
      points: [
        "Everything you log, live or after",
        "The built-in workouts and exercises",
        "Stats for the last 7 days",
      ],
      webAccount: "Or create a free account on the web",
    },
    member: {
      name: "Member",
      amount: "$23.99",
      suffix: "/year",
      sub: "or $2.99 a month · cancel any time",
      points: [
        "Everything in Free",
        "Your own exercises, workouts and blocks",
        "All of your climbing and training Stats",
      ],
      cta: "Start your 30 days",
      note: "Your trial starts with your account",
    },
    compare: {
      title: "Free and Member, side by side",
      columns: ["Free", "Member"] as [string, string],
      included: "Included",
      notIncluded: "Not included",
      rows: [
        { label: "Log climbs and sessions, live or after", free: true, member: true },
        { label: "Live workouts, players and the hang timer", free: true, member: true },
        { label: "The built-in workout library", free: true, member: true },
        { label: "Plan a day with built-in workouts", free: true, member: true },
        { label: "Strava posting", free: true, member: true },
        { label: "Your own exercises", free: false, member: true },
        { label: "Your own workouts", free: false, member: true },
        { label: "Blocks and templates", free: false, member: true },
        { label: "Climbing and training Stats", free: "Last 7 days", member: "All time" },
      ] as Array<{ label: string; free: CompareCell; member: CompareCell }>,
      note: "For your first 30 days you get the Member column.",
    },
    faq: {
      title: "Questions",
      items: [
        {
          q: "Do I need a card for the trial?",
          a: "No. The 30 days start when you create your account.",
        },
        {
          q: "What happens when the trial ends?",
          a: "Logging, live workouts, Plan and Strava posting stay free. Your own exercises, workouts and blocks stay in your account with a lock, and membership opens them again. Nothing is deleted.",
        },
        {
          q: "Where do I pay?",
          a: "In the App Store, on Google Play or on sendtally.com. One membership works in the app and on the web.",
        },
        {
          q: "Can I cancel?",
          a: "Any time, where you subscribed. You keep membership until the period you paid for ends.",
        },
      ],
    },
    closing: {
      title: "Start your 30 days.",
      webAccount: "Or create a free account on the web",
    },
  },

  stores: {
    lead: "Log a session from your phone:",
    ios: "Download sendtally on the App Store",
    android: "Get sendtally on Google Play",
    pending: "Coming soon",
  },

  footer: {
    line: "sendtally · not affiliated with Strava",
    trademarks:
      "Google Play and the Google Play logo are trademarks of Google LLC. Apple and the Apple logo are trademarks of Apple Inc.",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Sign in", href: "/sign-in" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Support", href: "/support" },
      { label: "AI assistants", href: "/ai-assistants" },
    ],
  },
};

export type LandingCopy = typeof COPY;
