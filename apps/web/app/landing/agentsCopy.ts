import type { FeatureCopy, MediaCopy } from "./copy";

/** The Agents page and the homepage row: English only, served at /agents and on the English homepage. */
export const AGENTS = {
  meta: {
    title: "Connect your agent to your climbing log - sendtally",
    description:
      "Connect an AI agent to sendtally to import an old climbing log or spreadsheet with effort scores, and to build and change training blocks from your climbing history.",
  },
  eyebrow: "Agents",
  title: "Let your agent do the typing.",
  body: "Connect an AI agent to your sendtally account. Hand it an old climbing log and it becomes sessions with effort scores. Ask for a training block and it is in the app, ready to run.",
  copy: "Copy URL",
  copied: "Copied",
  setup: "Setup instructions ↓",
  home: {
    points: [
      "A spreadsheet, a journal or another app's export",
      "Blocks and workouts built, then changed when you ask",
      "Never edits or deletes a session you logged",
    ],
    more: "How it works ›",
    ask: {
      label: "You, to your agent",
      prompt: "Build me a winter strength plan: six weeks, around my Tuesday gym nights.",
      send: "Send",
      reply:
        "Saved “Winter strength” to your sendtally calendar: six weeks, starting Monday 26 October.",
    },
    media: { key: "block", alt: "A training block: week chips and the week grid" } as MediaCopy,
  },
  features: [
    {
      id: "import",
      eyebrow: "Import",
      title: "“Here's my climbing spreadsheet from the last four years. Put it in sendtally.”",
      body: "Hand your agent a spreadsheet, a journal or an export you downloaded from another climbing app. Every day becomes a session with its climbs, grades, sends and attempts, and each one gets an effort score, the same as a session you log yourself.",
      points: [
        "Exports from Kaya, 8a.nu, Mountain Project, Sendage and theCrag go in as they are",
        "Anything else, your agent puts in sendtally's format first",
        "Run it twice and nothing is added twice",
      ],
      media: [
        { key: "logClimbing", alt: "The Log tab with past sessions and their effort scores" },
        { key: "climbPage", alt: "A climb's page with its sessions and attempts" },
      ],
    },
    {
      id: "build",
      eyebrow: "Build",
      title: "“Build me a four-week power endurance block, three days a week.”",
      body: "Your agent reads your recent sessions and what you already have planned, picks workouts from your library or writes new ones, and puts the block on your calendar. Open the app and press Start.",
      points: [
        "Built-ins like 4x4s and ARC, or workouts written for you",
        "Or save it as a template and schedule it yourself",
      ],
      media: [
        { key: "block", alt: "A training block: week chips and the week grid" },
        { key: "plan", alt: "The Plan tab: the week strip and today's workout" },
      ],
    },
    {
      id: "change",
      eyebrow: "Change",
      title: "“Move the hangboard workout to Thursdays from week 3.”",
      body: "Ask for a change and your agent edits the block, workout or exercise in place. Before it deletes anything, it asks you first.",
      points: ["Sessions you already logged stay exactly as they are"],
      media: [
        { key: "block", alt: "A training block: week chips and the week grid" },
        { key: "calendar", alt: "The calendar: a month with a block running" },
      ],
    },
  ] as FeatureCopy[],
  connect: {
    eyebrow: "Connect",
    title: "Three steps, about a minute.",
    steps: [
      { label: "Step 1", title: "Copy the connector URL", body: "" },
      {
        label: "Step 2",
        title: "Add it to your agent",
        body: "Add it as a custom connector and paste the URL. In Claude: Settings, then Connectors, then Add custom connector.",
      },
      {
        label: "Step 3",
        title: "Sign in to sendtally",
        body: "Your agent opens sendtally's sign-in. Use the account you log with; the agent never sees how you sign in.",
      },
    ],
  },
  faq: {
    title: "Questions",
    items: [
      {
        q: "What can an agent see and change?",
        a: "It reads your sessions, your training library and your plan. It can add sessions, and save, change and delete your exercises, workouts and blocks.",
      },
      {
        q: "Can it change or delete my logged sessions?",
        a: "No. It adds sessions but never edits or deletes one already in your log. Do that in the app.",
      },
      {
        q: "Does it take my data from other apps?",
        a: "No. It works only with files you hand it. Nothing is fetched from another app or service.",
      },
      {
        q: "Is it free?",
        a: "Connecting is free, and so are reading your log and importing it. Saving exercises, workouts and blocks follows the same 30-day trial and membership as in the app.",
        link: { label: "See pricing ›", href: "/pricing" },
      },
      {
        q: "How do I disconnect?",
        a: "Remove sendtally from your agent's connectors. Access ends straight away, and what it added stays in your account until you delete it.",
      },
    ] as Array<{ q: string; a: string; link?: { label: string; href: string } }>,
  },
  closing: {
    title: "Get sendtally, then connect your agent.",
    webAccount: "Or create a free account on the web",
  },
};
