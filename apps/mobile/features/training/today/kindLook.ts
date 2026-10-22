import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { DayItemKind } from "@sendtally/features/training";
import type { IconName } from "../../../components/Icon";

export type KindLook = {
  ink: string;
  tint: string;
  onDark: string;
  round: boolean;
  icon: IconName;
};

/** Climbing reads azure and round, hangboard petal and square, wherever a day's items show. */
export const KIND_LOOK: Record<DayItemKind, KindLook> = {
  climb: {
    ink: colors.azureInk,
    tint: "rgba(27,98,206,0.1)",
    onDark: colors.dataAzureSoft,
    round: true,
    icon: "climb",
  },
  hang: {
    ink: colors.petalInk,
    tint: "rgba(140,31,181,0.1)",
    onDark: colors.petal,
    round: false,
    icon: "hang",
  },
};

export function kindName(kind: DayItemKind): string {
  return kind === "climb" ? t("training.climbing") : t("training.hangboard");
}
