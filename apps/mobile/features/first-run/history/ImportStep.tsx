import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { formatDate, t } from "@sendtally/features/i18n";
import { importSourceOf } from "@sendtally/features/import";
import {
  historyCard,
  importedInsights,
  firstRunSourceLabel,
  useDisplayScales,
} from "@sendtally/features/settings";
import { messageText } from "../../../lib/styles";
import { ExportHowTo } from "../../import/ExportHowTo";
import { ImportReview } from "../../import/ImportReview";
import { NotRecognized } from "../../import/NotRecognized";
import { SupportedApps } from "../../import/SupportedApps";
import { useImportReview, type Review } from "../../import/useImportReview";
import { Button } from "../../training/components/Button";
import { Label } from "../../training/components/Label";
import { Title } from "../../training/components/Title";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { HistoryCard } from "./components/HistoryCard";
import { WhatYouGet } from "./components/WhatYouGet";

const monthYear = (date: string): string =>
  formatDate(new Date(`${date}T00:00:00Z`), { timeZone: "UTC", month: "short", year: "numeric" });

const yearsIn = (review: Review): number => {
  const dates = review.plan.sessions.map((s) => Number(s.date.slice(0, 4)));
  return Math.max(...dates) - Math.min(...dates) + 1;
};

/**
 * H2i and H3i in one: how to get the export out, then the file read on the phone and drawn as
 * the user's climbing before anything is saved. One component, so the file survives the step.
 */
export function ImportStep({ wizard }: Parameters<StepComponent>[0]): React.ReactElement {
  const scales = useDisplayScales();
  const importer = useImportReview();
  const { review, importing } = importer;
  const answer = wizard.memory.existingLog;
  const source = answer === null ? undefined : importSourceOf(answer);

  const choose = (): void => {
    void importer.pick().then((read) => {
      if (read === null) return;
      wizard.capture("import_reviewed", {
        format: read.plan.format,
        sessions: read.plan.sessions.length,
        issues: read.plan.issues.length,
        duplicates: read.duplicates.length,
      });
      if (wizard.step === "H2i") wizard.next({ way: "import" });
    });
  };
  const byHand = (
    <Button
      variant="link"
      label={t("onboarding.history.how.byHand")}
      onPress={() => {
        wizard.setWay("by_hand");
        wizard.next({ way: "by_hand" });
      }}
    />
  );

  if (wizard.step === "H2i" || review === null) {
    const heading = (
      <>
        <View style={{ gap: 4 }}>
          {source !== undefined && (
            <Label color={colors.azureInk}>{firstRunSourceLabel(source)}</Label>
          )}
          <Title size={34}>{t("onboarding.history.how.title")}</Title>
        </View>
        <WhatYouGet />
      </>
    );
    return (
      <WizardFrame
        wizard={wizard}
        footer={
          <View style={{ gap: 6 }}>
            <Button variant="primary" label={t("import.chooseFile")} onPress={choose} />
            {byHand}
          </View>
        }
      >
        {source === undefined ? (
          <>
            {heading}
            <SupportedApps />
          </>
        ) : (
          <ExportHowTo source={source} heading={heading} />
        )}
      </WizardFrame>
    );
  }

  const usable = review.plan.sessions.length > 0;
  const count = importing.length;
  const first = review.plan.sessions[0];
  const last = review.plan.sessions.at(-1);
  return (
    <WizardFrame
      wizard={wizard}
      footer={
        usable ? (
          <>
            {review.error !== null && <Text style={messageText}>{review.error}</Text>}
            <Button
              variant="primary"
              label={review.busy ? t("import.importing") : t("import.confirm", { count })}
              onPress={() => importer.confirm(() => wizard.next())}
              disabled={review.busy || count === 0}
            />
          </>
        ) : (
          <View style={{ gap: 6 }}>
            <Button variant="primary" label={t("import.chooseAnother")} onPress={choose} />
            {byHand}
          </View>
        )
      }
    >
      {usable && first !== undefined && last !== undefined ? (
        <ImportReview
          fileName={review.fileName}
          plan={review.plan}
          duplicates={review.duplicates}
          unflagged={importer.unflagged}
          importing={importing}
          importAnyway={review.importAnyway}
          onImportAnyway={importer.setImportAnyway}
          title={t("onboarding.history.review.title", { count: yearsIn(review) })}
          meta={t("onboarding.history.review.fileSpan", {
            file: review.fileName,
            from: monthYear(first.date),
            to: monthYear(last.date),
          })}
          card={
            <HistoryCard
              vm={historyCard(importedInsights(importing), [], scales)}
              label={t("onboarding.history.card.inThisFile")}
              slim
            />
          }
        />
      ) : (
        <NotRecognized fileName={review.fileName} />
      )}
    </WizardFrame>
  );
}
