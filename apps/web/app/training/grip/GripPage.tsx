import React from "react";
import { useNavigate } from "react-router";
import { gripSeries, setupsOf, summarise, type GripSetup } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import {
  canCompareGrips,
  gripSessionRows,
  gripSetupLabel,
  gripTiles,
  insight,
  milestoneRows,
} from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { MoreMenu, type MoreMenuItem } from "../../components/MoreMenu";
import { Sheet } from "../../components/Sheet";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { SummaryTiles } from "../../components/detail/SummaryTiles";
import { CategoryMark } from "../components/CategoryMark";
import { DashedPanel } from "../components/DashedPanel";
import { UsedIn } from "../components/UsedIn";
import { useGoBack } from "../components/useGoBack";
import { useHangData } from "../data/HangDataContext";
import { COMPARE_GRIPS_PATH, EXERCISES_VIEW } from "../exercises/paths";
import { useLibrary } from "../library/useLibrary";
import { GripSessions } from "./GripSessions";
import { LoadTrendCard } from "./LoadTrendCard";
import { Milestones } from "./Milestones";
import { SetupChips } from "./SetupChips";

/**
 * One Fingers exercise across every workout: its load on a setup, its milestones, every
 * session on it and the workouts that use it. ··· compares it with the others or archives it.
 */
export function GripPage({ id }: { id: string }): React.ReactElement {
  const navigate = useNavigate();
  const back = useGoBack(EXERCISES_VIEW);
  const { model, actions, today } = useHangData();
  const library = useLibrary().state;
  const [picked, setPicked] = React.useState<GripSetup | null | undefined>(undefined);
  const [archiving, setArchiving] = React.useState(false);
  const unit = model.settings.units;
  const setups = setupsOf(model.sessions, id);
  const setup = picked === undefined ? (setups[0] ?? null) : picked;
  const series = gripSeries(model.sessions, id, setup ?? undefined);
  const summary = summarise(series, today);
  const grip = model.grips.find((g) => g.id === id);
  const name = model.gripName(id);
  const kind = series[0]?.protocol.kind ?? "hang";
  const caption = setup === null ? t("hang.mixedSetups") : gripSetupLabel(setup);
  const said =
    summary === null || setup === null
      ? ""
      : insight(summary, { workout: name, grip: caption, kind, unit });
  const usedIn =
    library.status === "ready"
      ? library.data.workouts.filter(
          (w) => w.kind === "hangboard" && w.items.some((i) => i.exercise === id)
        )
      : [];
  const menu: MoreMenuItem[] = [
    ...(canCompareGrips(model.sessions)
      ? [{ label: t("hang.compareGrips"), onSelect: () => void navigate(COMPARE_GRIPS_PATH) }]
      : []),
    ...(grip !== undefined && !grip.hidden
      ? [
          {
            label: t("workouts.archiveExercise"),
            onSelect: () => setArchiving(true),
            destructive: true,
          },
        ]
      : []),
  ];

  return (
    <DetailFrame
      backTo={EXERCISES_VIEW}
      action={menu.length > 0 && <MoreMenu label={t("summary.more")} items={menu} />}
    >
      <div className="intro">
        <span className="intro-kicker">
          <CategoryMark kind="hangboard" size={28} />
          <span className="train-label">{kindLabel("hangboard")}</span>
        </span>
        <h1 className="train-title intro-title">{name}</h1>
      </div>
      {setups.length > 1 && (
        <SetupChips setups={setups} picked={setup} onPick={setPicked} withAll />
      )}
      {summary === null ? (
        <DashedPanel body={t("workouts.exerciseNothingLogged")} />
      ) : (
        <>
          <LoadTrendCard
            name={name}
            caption={caption}
            series={series}
            summary={summary}
            kind={kind}
            unit={unit}
          />
          <SummaryTiles stats={gripTiles(series, summary, unit)} />
          {said !== "" && <p className="insight">{said}</p>}
          <Milestones rows={milestoneRows(series, unit, setup === null)} />
          <GripSessions rows={gripSessionRows(series, model.sessions, unit)} />
        </>
      )}
      <UsedIn workouts={usedIn} />
      {grip !== undefined && (
        <Sheet
          open={archiving}
          title={t("workouts.archiveExerciseTitle", { name })}
          onClose={() => setArchiving(false)}
          action={{
            label: t("workouts.archiveExercise"),
            danger: true,
            onPress: () => {
              setArchiving(false);
              back();
              void actions.archiveGrip(grip);
            },
          }}
        >
          <p className="sheet-body">{t("workouts.archiveExerciseBody")}</p>
        </Sheet>
      )}
    </DetailFrame>
  );
}
