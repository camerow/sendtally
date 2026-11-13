import { useNavigate } from "react-router";
import { t } from "@sendtally/features/i18n";
import { useToast } from "../../components/Toast";
import type { Scheduled } from "../plan-week/AddWorkoutsSheet";
import { blockPath } from "./paths";

/** Says a block was scheduled from the Schedule sheet, with View opening it. */
export function useScheduledToast(): (made: Scheduled) => void {
  const navigate = useNavigate();
  const toast = useToast();
  return (made) =>
    toast.show({
      message: t("plan.scheduledName", { name: made.name }),
      action: { label: t("plan.viewTemplate"), onPress: () => void navigate(blockPath(made.id)) },
    });
}
