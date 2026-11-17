/** The untitled session a climb added on its own is filed in. */
export const isHolder = (s: {
  source: string;
  name: string | null;
  rpe_source: string | null;
}): boolean => s.source === "manual" && (s.name ?? "").trim() === "" && s.rpe_source === "none";
