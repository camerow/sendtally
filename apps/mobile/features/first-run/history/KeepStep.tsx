import React from "react";
import { ActivityIndicator } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { formatDate, t } from "@sendtally/features/i18n";
import { keepCopy } from "@sendtally/features/onboarding";
import { useBilling } from "../../billing/useBilling";
import { Paywall } from "../../billing/Paywall";
import { Button } from "../../training/components/Button";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { useHistoryCard } from "./useHistoryCard";

/** H5: membership, once per wizard, offered with the user's own counts and the trial's end (T25 option A). */
export function KeepStep({ wizard, api }: Parameters<StepComponent>[0]): React.ReactElement {
  const vm = useHistoryCard(api);
  const membership = useBilling()?.membership;
  const endsAt =
    membership?.state.status === "ready" ? membership.state.data.trial.endsAt : undefined;
  const joined = membership?.active === true;
  const moved = React.useRef(false);

  React.useEffect(() => {
    if (!joined || moved.current) return;
    moved.current = true;
    wizard.next();
  }, [joined, wizard]);

  return (
    <WizardFrame
      wizard={wizard}
      skip={false}
      footer={<Button variant="link" label={t("sessions.notNow")} onPress={() => wizard.next()} />}
    >
      {vm === null ? (
        <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />
      ) : (
        <Paywall
          {...keepCopy(vm)}
          {...(endsAt === undefined
            ? {}
            : {
                eyebrow: t("billing.freeTrialEnds", {
                  date: formatDate(new Date(endsAt), { month: "short", day: "numeric" }),
                }),
              })}
        />
      )}
    </WizardFrame>
  );
}
