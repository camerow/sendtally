export type ClimbResult = "flash" | "sent" | "project";

export type ClimbVM = {
  n: number;
  name: string;
  gradeLabel: string;
  grade: number;
  isTopSend: boolean;
  angleLabel: string;
  burns: number;
  restLabel: string;
  result: ClimbResult;
};

export type StatVM = { label: string; value: string; accent: boolean };

export type GradeBarVM = { gradeLabel: string; count: number; height: number; peak: boolean };

export type ClimbFilter = "all" | "sent" | "flash" | "project";

export type ClimbSort = "order" | "gradeDesc" | "gradeAsc" | "burns";

export type PostStatusKind =
  "posted" | "pending" | "failed" | "before-start" | "off" | "legacy" | "in-progress";

export type PostAction = "retry" | "post";

export type PostStatusVM = {
  kind: PostStatusKind;
  label: string;
  detail: string | null;
  alert: boolean;
  action: PostAction | null;
  actionLabel: string | null;
};

export type PostingStatus = { connected: boolean; active: boolean; since: string | null };

export type SessionDetailVM = {
  title: string;
  meta: string;
  stats: StatVM[];
  bars: GradeBarVM[];
  filterCounts: Record<ClimbFilter, number>;
  post: PostStatusVM;
  stravaUrl: string | null;
};

export const CLIMB_SORTS: Array<{ value: ClimbSort; label: string }> = [
  { value: "order", label: "Order climbed" },
  { value: "gradeDesc", label: "Grade - hardest first" },
  { value: "gradeAsc", label: "Grade - easiest first" },
  { value: "burns", label: "Most burns" },
];

export const BOARD_LABELS: Record<string, string> = {
  tension: "Tension Board",
  kilter: "Kilter Board",
  grasshopper: "Grasshopper Board",
  decoy: "Decoy Board",
  touchstone: "Touchstone Board",
  soill: "So iLL Board",
  aurora: "Aurora Board",
};
