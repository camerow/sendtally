import { router } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { t } from "@sendtally/features/i18n";
import { columnsMatchedEvent } from "@sendtally/features/import";
import { useCapture } from "../analytics/useCapture";
import { ScreenFrame } from "../../components/ScreenFrame";
import { messageText } from "../../lib/styles";
import { Button } from "../training/components/Button";
import { Title } from "../training/components/Title";
import { ColumnMatch } from "./ColumnMatch";
import { ImportReview } from "./ImportReview";
import { NotRecognized } from "./NotRecognized";
import { SupportedApps } from "./SupportedApps";
import { useImportReview } from "./useImportReview";

/** Import a climbing history: which apps' exports it reads, the file picked, then a review to confirm. */
export function ImportScreen(): React.ReactElement {
  const importer = useImportReview();
  const { review, columns, matching, unflagged, importing, pick, confirm, setImportAnyway, clear } =
    importer;
  const capture = useCapture();
  const choose = (label: string): React.ReactElement => (
    <Button
      variant="primary"
      label={matching ? t("import.match.matching") : label}
      disabled={matching}
      onPress={() => void pick()}
    />
  );

  if (columns !== null) {
    return (
      <ScreenFrame
        backLabel={t("settings.importCsv")}
        onBack={() => {
          capture("import_columns_matched", columnsMatchedEvent(columns, "fallback"));
          clear();
        }}
        footer={
          <Button
            variant="primary"
            label={t("import.match.confirm")}
            onPress={() => {
              capture("import_columns_matched", columnsMatchedEvent(columns, "matched"));
              void importer.applyColumns();
            }}
          />
        }
      >
        <ColumnMatch review={columns} onChange={importer.setColumns} />
      </ScreenFrame>
    );
  }

  if (review === null) {
    return (
      <ScreenFrame footer={choose(t("import.chooseFile"))}>
        <Title size={34}>{t("import.title")}</Title>
        <SupportedApps />
      </ScreenFrame>
    );
  }

  const usable = review.plan.sessions.length > 0;
  const count = importing.length;
  return (
    <ScreenFrame
      backLabel={t("settings.importCsv")}
      onBack={() => !review.busy && clear()}
      footer={
        usable ? (
          <>
            {review.error !== null && <Text style={messageText}>{review.error}</Text>}
            <Button
              variant="primary"
              label={review.busy ? t("import.importing") : t("import.confirm", { count })}
              onPress={() =>
                confirm(({ imported, skipped, likely }) =>
                  router.dismissTo({
                    pathname: "/profile",
                    params: { imported, skipped, likely },
                  })
                )
              }
              disabled={review.busy || count === 0}
            />
          </>
        ) : (
          choose(t("import.chooseAnother"))
        )
      }
    >
      {usable ? (
        <ImportReview
          fileName={review.fileName}
          plan={review.plan}
          duplicates={review.duplicates}
          unflagged={unflagged}
          importing={importing}
          importAnyway={review.importAnyway}
          onImportAnyway={setImportAnyway}
        />
      ) : (
        <NotRecognized fileName={review.fileName} />
      )}
    </ScreenFrame>
  );
}
