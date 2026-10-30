import { t } from "@sendtally/features/i18n";
import type { DetailMenuRow } from "../components/types";

/** Move and Skip, as a ··· sheet or the day sheet lists them. */
export const dayRows = (open: (kind: "move" | "skip") => void): DetailMenuRow[] => [
  { icon: "today", title: t("plan.move"), hint: t("plan.moveHint"), onPress: () => open("move") },
  { icon: "x", title: t("plan.skip"), hint: t("plan.skipHint"), onPress: () => open("skip") },
];
