import type { MemberBenefit } from "./types";

export const MEMBER_BENEFITS: MemberBenefit[] = [
  {
    title: "Volume, effort, average grade and flash rate",
    body: "Every session you log feeds the trend screens - how much you climbed, how hard it felt, where your average send grade is drifting, and how often you read a problem first go.",
  },
  {
    title: "Direct influence on what gets built",
    body: "Members say what comes next. One person builds this, and the people paying for the server set the order.",
  },
];

export const MEMBER_POINTS: string[] = [
  "Volume - how much you actually climbed, week by week",
  "RPE - how hard your sessions have been feeling over time",
  "Average send grade - the drift a logbook can never show you",
  "Flash rate - the first thing to move when your reading improves",
];

export type MembershipPanelRow = {
  eyebrow: string;
  line: string;
  bars: number[];
  peak: number;
};

/** The in-app membership panel: the marketing price panel, aimed at someone already logging. */
export const MEMBERSHIP_PANEL = {
  eyebrow: "MEMBERSHIP",
  title: "Join to see your long-term trends.",
  body: "Two dollars a month, billed yearly, opens every range from a month to all-time on every screen here - built from the sessions you already logged.",
  cta: "Become a member",
  footnote: "$2/MO BILLED YEARLY · OR $3 MONTH TO MONTH · CANCEL ANY TIME",
  rows: [
    {
      eyebrow: "VOLUME",
      line: "How much you climbed, week by week",
      bars: [40, 55, 45, 70, 60, 100],
      peak: 5,
    },
    {
      eyebrow: "GRADE PYRAMID",
      line: "Where your sends actually sit",
      bars: [30, 60, 100, 80, 45, 20],
      peak: 2,
    },
    {
      eyebrow: "HARDEST SEND",
      line: "Your ceiling by period, with the climb that set it",
      bars: [50, 50, 65, 65, 80, 100],
      peak: 5,
    },
    {
      eyebrow: "FLASH RATE",
      line: "Sends on the first try, tracked over time",
      bars: [35, 45, 40, 70, 100, 85],
      peak: 4,
    },
  ] satisfies MembershipPanelRow[],
} as const;
