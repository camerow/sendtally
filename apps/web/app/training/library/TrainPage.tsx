import React from "react";
import { Logo } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import { AccountButton } from "../../components/AccountButton";
import { HangDataProvider } from "../data/HangDataProvider";
import { WorkoutLibrary } from "./WorkoutLibrary";

/** The Train tab: the workout library, until blocks and exercises join it. */
export function TrainPage(): React.ReactElement {
  return (
    <div className="train">
      <div className="train-head">
        <span className="train-head-mark">
          <Logo variant="mark" size={22} />
        </span>
        <h1 className="train-head-title">{t("training.train")}</h1>
        <AccountButton />
      </div>
      <HangDataProvider>
        <WorkoutLibrary />
      </HangDataProvider>
    </div>
  );
}
