import type { LandingCopy } from "./copy";

export const COPY_DE: LandingCopy = {
  meta: {
    title: "sendtally - a climbing log and training app", // follows en
    description:
      "Log every climb, plan your training, run each workout on a timer and see it add up in Stats. Start with 30 days of everything, then keep logging for free.", // follows en
  },
  nav: {
    home: "sendtally home", // follows en
    sections: [
      {
        label: "Log", // follows en
        href: "#log",
      },
      {
        label: "Train", // follows en
        href: "#train",
      },
      {
        label: "Plan", // follows en
        href: "#plan",
      },
      {
        label: "Stats", // follows en
        href: "#stats",
      },
    ],
    pricing: "Pricing", // follows en
    signIn: "Anmelden",
    createAccount: "Konto erstellen",
    getApp: "Get the app", // follows en
    openApp: "App →",
  },
  hero: {
    eyebrow: "Climbing log and training app", // follows en
    title: "Log your climbing. Plan your training.", // follows en
    body: "Tally a gym session as you climb, build a training block, run each workout on a timer, and watch it all add up in Stats. Start with 30 days of everything, then keep logging for free.", // follows en
    webAccount: "Or create a free account on the web", // follows en
    photoAlt: "A climber high on a streaked red sandstone wall in a narrow canyon", // follows en
    phone: {
      key: "logClimbing",
      alt: "The Log tab: this week's climbing sessions with their climbs, and a climb logged on its own", // follows en
    },
  },
  tabs: [
    {
      label: "Plan", // follows en
      title: "Your week, today first", // follows en
      href: "#plan",
    },
    {
      label: "Log", // follows en
      title: "Every climb and workout", // follows en
      href: "#log",
    },
    {
      label: "Train", // follows en
      title: "Blocks, workouts, exercises", // follows en
      href: "#train",
    },
    {
      label: "Stats", // follows en
      title: "Climbing and training over time", // follows en
      href: "#stats",
    },
  ],
  features: [
    {
      id: "log",
      eyebrow: "Log", // follows en
      title: "Count every climb as you climb it.", // follows en
      body: "Start a gym session, pick a grade, then tap Fell or Sent. Named sessions keep their climbs together, and a single climb can go in on its own.", // follows en
      points: [
        "Gym circuits by color, crags and areas outdoors", // follows en
        "A page for every climb, with notes and a Project flag", // follows en
        "Journal entries for trips and injuries", // follows en
        "V, Font, YDS and French grades", // follows en
      ],
      media: [
        {
          key: "liveTally",
          alt: "A live gym session: pick a grade, then tap Fell or Sent for each climb", // follows en
        },
        {
          key: "climbPage",
          alt: "A climb's page with the Project label, its days, tries and dated notes", // follows en
        },
      ],
      photo: {
        key: "desertCrag",
        alt: "Climbers at the base of a tall limestone crag in the desert", // follows en
      },
    },
    {
      id: "train",
      eyebrow: "Train", // follows en
      title: "Build a block, or start from the library.", // follows en
      body: "A block is weeks of workouts, with the days set for each week and the load for each week in one table.", // follows en
      points: [
        "Workouts grouped by focus, with built-ins like limit bouldering, 4x4s and ARC", // follows en
        "An exercise library, Fingers exercises included", // follows en
        "Ongoing workouts that repeat every week", // follows en
        "Save a block as a template and schedule it again", // follows en
      ],
      media: [
        {
          key: "block",
          alt: "A training block: week chips, this week's numbers and the week grid", // follows en
        },
        {
          key: "trainWorkouts",
          alt: "Train, Workouts: the library grouped by focus", // follows en
        },
      ],
    },
    {
      id: "plan",
      eyebrow: "Plan", // follows en
      title: "Your week, opened on today.", // follows en
      body: "Schedule a workout or a whole block. Done workouts get a check where they were planned, missed ones show, and any day can be rescheduled or skipped.", // follows en
      points: [
        "A calendar for the months ahead and behind", // follows en
        "Skip with a reason: rest, sick, sore, travel or busy", // follows en
      ],
      media: [
        {
          key: "plan",
          alt: "The Plan tab: the week strip, today's workout and the Schedule button", // follows en
        },
        {
          key: "calendar",
          alt: "The calendar: a month with a block running, done and missed days marked", // follows en
        },
      ],
      photo: {
        key: "pineFace",
        alt: "A climber on a gray face above the pines", // follows en
      },
    },
    {
      id: "live",
      eyebrow: "Live workouts", // follows en
      title: "Press Start and the workout runs itself.", // follows en
      body: "Sets, timers, intervals and checklists, with rests in line. Minimize it and it waits on a bar above the tabs. At the end, tick what you did and it is logged.", // follows en
      points: [
        "Did it without the timer? Log it", // follows en
        "Circuits and laps counted in moves or time", // follows en
      ],
      media: [
        {
          key: "setsPlayer",
          alt: "The sets player: a set ticked, then the rest counting down in line", // follows en
        },
        {
          key: "livebar",
          alt: "A live workout minimized on the bar above the tabs", // follows en
        },
      ],
    },
    {
      id: "hangboard",
      eyebrow: "Hangboard", // follows en
      title: "A hang timer that keeps your load.", // follows en
      body: "Rep dots count every hang. Each set keeps its added weight, and each exercise gets a progress chart over time.", // follows en
      points: [
        "Compare exercises: best loads side by side", // follows en
      ],
      media: [
        {
          key: "hangTimer",
          alt: "The hang timer: count-in, a hang, then the rest between sets", // follows en
        },
        {
          key: "fingersProgress",
          alt: "A Fingers exercise's added load over months of sessions", // follows en
        },
      ],
      photo: {
        key: "limestoneWall",
        alt: "A climber on a tall gray limestone wall", // follows en
      },
    },
    {
      id: "stats",
      eyebrow: "Stats", // follows en
      title: "See what changed.", // follows en
      body: "Climbing shows your grade pyramid, climbs by grade, average send and every day you climbed. Training shows what you trained by category or focus, the workouts you did most, and hangboard progress.", // follows en
      points: [],
      media: [
        {
          key: "statsClimbing",
          alt: "Stats, Climbing: the sends-by-grade pyramid and climbs by grade", // follows en
        },
        {
          key: "statsTraining",
          alt: "Stats, Training: effort and sessions over time, and what you trained", // follows en
        },
      ],
    },
  ],
  extras: [
    {
      eyebrow: "Anstrengung",
      title: "Eine Anstrengungswertung für jede Session",
      body: "Rate it 1 to 10, or leave it and sendtally scores it against your own last eight weeks.", // follows en
    },
    {
      eyebrow: "Strava",
      title: "Posted to Strava, if you want", // follows en
      body: "One Rock Climbing activity per session, free for everyone.", // follows en
    },
    {
      eyebrow: "No signal", // follows en
      title: "Log at the crag", // follows en
      body: "Saves on your phone and syncs when you are back online.", // follows en
    },
  ],
  made: {
    eyebrow: "Made by", // follows en
    title: "Made by Will Cameron", // follows en
    paragraphs: [
      "I'm Will. I built sendtally because I wanted my climbing and my training in one place: what I sent, what I trained, and whether any of it is working.", // follows en
      "Questions, ideas or a bug? Write to me from the support page.", // follows en
    ],
    link: "Contact support", // follows en
    photoAlt: "Will Cameron at a desert boulder field, carrying two crash pads", // follows en
  },
  start: {
    eyebrow: "Free to start", // follows en
    title: "Start with 30 days of everything.", // follows en
    body: "Then keep logging, built-in workouts and Strava posting for free.", // follows en
    webAccount: "Or create a free account on the web", // follows en
    pricing: "See pricing ›", // follows en
  },
  pricing: {
    meta: {
      title: "Pricing - sendtally", // follows en
      description:
        "Start with 30 days of everything. Then keep logging for free, or stay a member for $23.99 a year or $2.99 a month.", // follows en
    },
    eyebrow: "Pricing", // follows en
    title: "Start with 30 days of everything.", // follows en
    body: "Then keep logging for free, or stay a member for $23.99 a year or $2.99 a month.", // follows en
    free: {
      name: "Kostenlos",
      amount: "$0",
      suffix: " für immer",
      sub: "Logging, built-in training and Strava", // follows en
      points: [
        "Everything you log, live or after", // follows en
        "The built-in workouts and exercises", // follows en
        "Stats for the last 7 days", // follows en
      ],
      webAccount: "Or create a free account on the web", // follows en
    },
    member: {
      name: "Mitglied",
      amount: "$23.99", // follows en
      suffix: "/year", // follows en
      sub: "or $2.99 a month · cancel any time", // follows en
      points: [
        "Everything in Free", // follows en
        "Your own exercises, workouts and blocks", // follows en
        "All of your climbing and training Stats", // follows en
      ],
      cta: "Start your 30 days", // follows en
      note: "Your trial starts with your account", // follows en
    },
    compare: {
      title: "Free and Member, side by side", // follows en
      columns: ["Kostenlos", "Mitglied"],
      included: "Included", // follows en
      notIncluded: "Not included", // follows en
      rows: [
        {
          label: "Log climbs and sessions, live or after", // follows en
          free: true,
          member: true,
        },
        {
          label: "Live workouts, players and the hang timer", // follows en
          free: true,
          member: true,
        },
        {
          label: "The built-in workout library", // follows en
          free: true,
          member: true,
        },
        {
          label: "Plan a day with built-in workouts", // follows en
          free: true,
          member: true,
        },
        {
          label: "Strava posting", // follows en
          free: true,
          member: true,
        },
        {
          label: "Your own exercises", // follows en
          free: false,
          member: true,
        },
        {
          label: "Your own workouts", // follows en
          free: false,
          member: true,
        },
        {
          label: "Blocks and templates", // follows en
          free: false,
          member: true,
        },
        {
          label: "Climbing and training Stats", // follows en
          free: "Last 7 days", // follows en
          member: "All time", // follows en
        },
      ],
      note: "For your first 30 days you get the Member column.", // follows en
    },
    faq: {
      title: "Questions", // follows en
      items: [
        {
          q: "Do I need a card for the trial?", // follows en
          a: "No. The 30 days start when you create your account.", // follows en
        },
        {
          q: "What happens when the trial ends?", // follows en
          a: "Logging, live workouts, Plan and Strava posting stay free. Your own exercises, workouts and blocks stay in your account with a lock, and membership opens them again. Nothing is deleted.", // follows en
        },
        {
          q: "Where do I pay?", // follows en
          a: "In the App Store, on Google Play or on sendtally.com. One membership works in the app and on the web.", // follows en
        },
        {
          q: "Can I cancel?", // follows en
          a: "Any time, where you subscribed. You keep membership until the period you paid for ends.", // follows en
        },
      ],
    },
    closing: {
      title: "Start your 30 days.", // follows en
      webAccount: "Or create a free account on the web", // follows en
    },
  },
  stores: {
    lead: "Logge eine Session vom Handy:",
    ios: "sendtally im App Store laden",
    android: "sendtally bei Google Play holen",
    pending: "Bald verfügbar",
  },
  footer: {
    line: "sendtally · steht in keiner Verbindung zu Strava",
    trademarks:
      "Google Play und das Google Play-Logo sind Marken von Google LLC. Apple und das Apple-Logo sind Marken von Apple Inc.",
    links: [
      {
        label: "Pricing", // follows en
        href: "/pricing",
      },
      {
        label: "Anmelden",
        href: "/sign-in",
      },
      {
        label: "Datenschutz",
        href: "/privacy",
      },
      {
        label: "Nutzungsbedingungen",
        href: "/terms",
      },
      {
        label: "Support",
        href: "/support",
      },
    ],
  },
};
