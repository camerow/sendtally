import React from "react";
import { Link, useNavigate } from "react-router";
import {
  useActivityPost,
  type PostTarget,
  type Stat,
  type StravaState,
} from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { MoreMenu, type MoreMenuItem } from "../../components/MoreMenu";
import { Sheet } from "../../components/Sheet";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { SummaryTiles } from "../../components/detail/SummaryTiles";
import { useAppApi } from "../../lib/useAppApi";
import { useGoBack } from "../components/useGoBack";
import { activityEditPath } from "../log/paths";
import { StravaStatusRow } from "./StravaStatusRow";

export type SummaryFrameProps = {
  kicker: string;
  kickerColor: string;
  title: string;
  tiles: readonly Stat[];
  target: PostTarget;
  onDelete: () => void;
  children: React.ReactNode;
};

const stravaLabel = (state: StravaState): string => {
  switch (state.kind) {
    case "connect":
      return t("summary.connectStrava");
    case "post":
      return t("sessionDetail.postToStrava");
    case "posting":
      return t("summary.posting");
    case "posted":
      return t("summary.viewOnStrava");
    case "failed":
      return t("summary.tryAgain");
  }
};

/** What every finished workout shares: Back, Edit and the menu, its kicker, title, its tiles and Strava. */
export function SummaryFrame({
  kicker,
  kickerColor,
  title,
  tiles,
  target,
  onDelete,
  children,
}: SummaryFrameProps): React.ReactElement {
  const navigate = useNavigate();
  const back = useGoBack("/app");
  const post = useActivityPost(useAppApi(), target);
  const [deleting, setDeleting] = React.useState(false);
  const state = post.state;
  const onStrava = (): void => {
    if (state?.kind === "posted") window.open(state.url, "_blank", "noopener");
    else if (state?.kind === "connect") void navigate("/app/setup");
    else post.run();
  };
  const menu: MoreMenuItem[] = [
    ...(state === null
      ? []
      : [{ label: stravaLabel(state), onSelect: onStrava, disabled: state.kind === "posting" }]),
    { label: t("summary.deleteWorkout"), onSelect: () => setDeleting(true), destructive: true },
  ];
  return (
    <DetailFrame
      backTo="/app"
      action={
        <span className="detail-actions">
          <Link to={activityEditPath(target.record.id)} className="edit-button">
            {t("common.edit")}
          </Link>
          <MoreMenu label={t("summary.more")} items={menu} />
        </span>
      }
    >
      <div className="intro">
        <span className="train-label" style={{ color: kickerColor }}>
          {kicker}
        </span>
        <h1 className="train-title summary-title">{title}</h1>
      </div>
      <SummaryTiles stats={tiles} />
      {state !== null && <StravaStatusRow state={state} />}
      {children}
      <Sheet
        open={deleting}
        title={t("workouts.deleteTitle", { name: title })}
        onClose={() => setDeleting(false)}
        action={{
          label: t("common.delete"),
          danger: true,
          onPress: () => {
            setDeleting(false);
            back();
            onDelete();
          },
        }}
      >
        {state?.kind === "posted" && <p className="sheet-body">{t("summary.deleteHintStrava")}</p>}
      </Sheet>
    </DetailFrame>
  );
}
