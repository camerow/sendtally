import { HowEffortIsScored } from "./posts/HowEffortIsScored";
import { RoutesAndBoulders } from "./posts/RoutesAndBoulders";
import type { BlogPost } from "./types";

export const POSTS: readonly BlogPost[] = [
  {
    slug: "how-session-effort-is-scored",
    title: "How sendtally turns a session into a number out of ten",
    description:
      "Every session gets an effort score from 1 to 10. Here is exactly how it is worked out: grade points, attempts, your own recent history, and pace.",
    topic: "Effort",
    published: "2026-09-16",
    readMinutes: 5,
    Body: HowEffortIsScored,
  },
  {
    slug: "routes-and-boulders-in-one-log",
    title: "Routes and boulders in one log, without converting either",
    description:
      "V, Font, YDS and French grades all live in the same logbook. How sendtally scores them together while showing each one the way you climbed it.",
    topic: "Grades",
    published: "2026-09-09",
    readMinutes: 4,
    Body: RoutesAndBoulders,
  },
];

export function findPost(slug: string | undefined): BlogPost | undefined {
  return POSTS.find((post) => post.slug === slug);
}

export function formatPublished(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
