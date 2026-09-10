// Every string on the landing page lives here. Edit freely; components only read from it.
// Uppercase eyebrows and footnotes render in the mono label style, so keep them short.

export type TrendCopy = {
  eyebrow: string;
  headline: string;
  meta: string;
  body: string;
  memberLine: string;
};

export type FreeFeatureCopy = {
  eyebrow: string;
  title: string;
  body: string;
  short: string;
};

export const COPY = {
  meta: {
    title: "sendtally - log your climbing sessions and see your climbing trends",
    description:
      "Logging is free for everyone - unlimited sessions, grades, sends, attempts, an effort score, tags and Strava posting. Membership adds trends and insight: volume, grade pyramid, hardest send, flash rate and average grade and more to come!",
  },

  nav: {
    sections: [
      { label: "Trends", href: "#insights" },
      { label: "Sessions", href: "#session" },
      { label: "Strava", href: "#strava" },
      { label: "Membership", href: "#price" },
    ],
    signIn: "Sign in",
    createAccount: "Create account",
    openApp: "App →",
  },

  hero: {
    eyebrow: "CLIMBING TRAINING LOG · TREND INSIGHTS",
    title: "See what six months of climbing adds up to.",
    body: "Quickly and easily log your sessions - grades, sends, attempts. Use RPE to track effort over time. Post to Strava to see your climbing with your other activities. Membership adds trends and insight: volume, grade pyramid, hardest send, flash rate and average grade.",
    cta: "Create account →",
    signIn: "Sign in",
    pills: ["Log sessions", "RPE score", "Strava posting", "Trend insights"],
    card: {
      title: "Trends",
      chartLabel: "CLIMBS PER WEEK",
    },
  },

  free: {
    title: "Most of sendtally costs nothing.",
    blurb:
      "No trial, no card, no cap on sessions. The free account is the whole logbook - the only thing it does not include is the trend screens.",
    features: [
      {
        eyebrow: "SESSIONS",
        title: "Log as much as you want",
        body: "Date, start and end, indoor or outdoor, and every climb with its grade, send or attempt, and tries.",
        short: "Unlimited sessions with every climb, grade and try",
      },
      {
        eyebrow: "EFFORT",
        title: "RPE for every session",
        body: "Each session is rated 1-10 against your own rolling eight weeks, so you can see your training load. Set it yourself or leave it on auto.",
        short: "Effort score, 1-10, against your own last eight weeks",
      },
      {
        eyebrow: "TRENDS",
        title: "Every session, climb by climb",
        body: "Time, climbs, sends, flashes, attempts, top grade and average grade, plus the full climb list, kept for every session you log.",
        short: "Session breakdown: time, sends, flashes, attempts, top and average grade",
      },
      {
        eyebrow: "TAGS",
        title: "Group and filter",
        body: "Tag sessions by gym, board or training block and filter the logbook by them. Tags carry into the trend screens for members.",
        short: "Tags to group and filter the logbook",
      },
      {
        eyebrow: "STRAVA",
        title: "Posted to Strava, never doubled",
        body: "One Rock Climbing activity per session with duration, sends, attempts and grades filled in. Optional, and never paywalled.",
        short: "Strava posting, one activity per session",
      },
      {
        eyebrow: "GRADES",
        title: "V-scale or Font, YDS or French",
        body: "Grade in either scale. Sport climbing or bouldering.",
        short: "V-scale or Font",
      },
    ] satisfies FreeFeatureCopy[],
    footnote: "Free to log · one-time code sign-in · no card on file",
    cta: "Start logging for free →",
  },

  band: {
    eyebrow: "MEMBERSHIP",
    title: "Six months from now, you will want to know what changed.",
    body: "Every session you log is already a data point. Membership is the five screens that read them back to you - and it is what pays for the server.",
    cta: "See what members see ↓",
  },

  trends: {
    title: "Five screens only members see.",
    blurb:
      "Built from the sessions you already log, over any range from a month to all-time. This is the Trends tab, exactly as it looks in the app.",
    rangeLabel: "RANGE",
    memberTag: "MEMBER",
    cards: {
      volume: {
        eyebrow: "VOLUME",
        headline: "328 climbs",
        meta: "22 SESSIONS · LAST 12 WEEKS",
        body: "One empty week in July was travel, not a slump. Volume has held near thirty climbs a week since May.",
        memberLine: "Climbs and sessions per week, month or year - and the weeks you missed.",
      },
      pyramid: {
        eyebrow: "GRADE PYRAMID",
        headline: "111 sends",
        meta: "ALL-TIME · BY GRADE",
        body: "A V4 base with 28 V5s behind it and two V7s on top. The shape says V6 volume is what feeds the next grade.",
        memberLine:
          "Every send stacked by grade, so you can see which grade is holding the next one up.",
      },
      hardest: {
        eyebrow: "HARDEST SEND",
        headline: "V7",
        meta: "JUL 30 · THREAD THE NEEDLE",
        body: "Twelve weeks from the first V6 to the first V7, and both V7s came inside three weeks of each other.",
        memberLine: "Your ceiling by period, with the climb and the date that set it.",
      },
      flash: {
        eyebrow: "FLASH RATE",
        headline: "36%",
        meta: "UP FROM 22% IN MARCH",
        body: "Are you overtraining, overreaching, or not trying hard enough? Flash rate can help you figure out if you are in the proximal zone of development.",
        memberLine:
          "The share you get first go, tracked over time - movement skill before grades move.",
      },
      avggrade: {
        eyebrow: "AVG SEND GRADE",
        headline: "V4.9 this week",
        meta: "+0.7 SINCE MID-MAY",
        body: "Average send grade has drifted up about V0.7 over twelve weeks - steady, not a spike, which tracks with the volume behind it. A logbook can tell you what you climbed on Tuesday; it can't tell you this.",
        memberLine:
          "The slow line through everything you send - the one number a logbook can never show you.",
      },
    } satisfies Record<string, TrendCopy>,
  },

  session: {
    title: "Every session, climb by climb.",
    blurb:
      "Grades, burns and results - kept for every climb so a project you have been chipping at for a month reads as one story.",
    footnote: "6 OF 12 CLIMBS SHOWN · FILTER BY SENT, FLASHED OR PROJECT IN THE APP",
  },

  strava: {
    eyebrow: "ALSO: STRAVA · FREE",
    title: "And it gives you credit for the training, too.",
    body: "Each logged session becomes one Rock Climbing activity, with duration, sends, attempts and grades already filled in. It is free for everyone and always will be - we do not charge for Strava syncing. Turn it off and sendtally is still yours for the numbers alone.",
    cta: "Create your account →",
  },

  how: {
    title: "A minute after you climb.",
    blurb:
      "No accounts to link, no importers to babysit. Log the session and the effort score and Strava post follow from it for free; the trends build themselves for members.",
    steps: [
      {
        title: "Log your session",
        body: "Date, times, indoor or outdoor, and the climbs - V-scale or Font grades, sends and attempts, tries. About a minute, right after you climb.",
      },
      {
        title: "Get an effort score",
        body: "Every session is scored 1-10 against your own last eight weeks, so a big night reads as a big night - not just a list of grades.",
      },
      {
        title: "Authorise Strava",
        body: "Standard OAuth, scoped to activities and nothing else. We never see your password, we only ever write the sessions you log, and you can revoke it from Strava at any time.",
      },
    ],
  },

  details: {
    title: "Details",
    rows: [
      {
        label: "KEPT PER CLIMB",
        body: "Grade in V-scale or Font, send or attempt, tries, and the climb's name if you give it one",
      },
      {
        label: "EFFORT",
        body: "Every session scored 1-10 against your own rolling eight weeks - set it yourself or leave it on auto",
      },
      {
        label: "TRENDS",
        body: "Volume, grade pyramid, hardest send, flash rate and average grade, weekly or all-time - the membership half",
      },
      {
        label: "STRAVA",
        body: "Optional and free for everyone. One Rock Climbing activity per session, fingerprinted so it never doubles up",
      },
      {
        label: "LEAVING",
        body: "Delete your account and every session and token goes with it the same day",
      },
    ],
  },

  price: {
    eyebrow: "MEMBERSHIP",
    title: "Logging is free. Membership gives you the trends.",
    lead: "Two dollars a month, billed yearly, turns the log into a training history - and it is what pays for the server. Everything else stays free for everyone.",
    free: {
      name: "Free",
      amount: "$0",
      suffix: " forever",
      footnote: "NO CARD · NO TRIAL · NO SESSION CAP",
      cta: "Create your account →",
    },
    member: {
      name: "Member",
      amount: "$2",
      suffix: "/mo billed yearly · or $3 month to month",
      roadmapEyebrow: "EVERYTHING IN FREE, PLUS THE ROADMAP",
      roadmapBody:
        "Members say what gets built next - the people paying for the server get first call.",
      footnote: "CANCEL ANY TIME · TRENDS STAY UNTIL THE PAID PERIOD ENDS",
      cta: "Become a member →",
    },
  },

  stores: {
    lead: "Log a session from your phone:",
    ios: "Download sendtally for iPhone",
    android: "Get sendtally on Google Play",
  },

  footer: {
    line: "sendtally · not affiliated with Strava",
    links: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Support", href: "/support" },
    ],
  },
} as const;
