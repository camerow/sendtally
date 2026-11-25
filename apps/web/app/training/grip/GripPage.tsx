import React from "react";
import { libraryPictures } from "@sendtally/features/library";
import { Link, Navigate, useNavigate } from "react-router";
import { gripSeries, setupsOf, summarise, type GripSetup } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { pickedOf, workoutsWithGrip } from "@sendtally/features/exercises";
import {
  canCompareGrips,
  gripDescription,
  gripSessionRows,
  gripSetupLabel,
  gripTiles,
  insight,
  milestoneRows,
} from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { MoreMenu, type MoreMenuItem } from "../../components/MoreMenu";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { SummaryTiles } from "../../components/detail/SummaryTiles";
import { CategoryMark } from "../components/CategoryMark";
import { DeleteSheet } from "../components/DeleteSheet";
import { archiveGripFlow } from "../components/deleteFlows";
import { DashedPanel } from "../components/DashedPanel";
import { Description } from "../components/Description";
import { UsedIn } from "../components/UsedIn";
import { useGoBack } from "../../lib/useGoBack";
import { useHangData } from "../data/HangDataContext";
import { COMPARE_GRIPS_PATH, EXERCISES_VIEW } from "../exercises/paths";
import { editGripPath } from "../editor/paths";
import { useAddToWorkout } from "../editor/useAddToWorkout";
import { useLibrary } from "../library/useLibrary";
import { joinPath, useCreateGate, useLocks } from "../locks";
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
  const usedIn = library.status === "ready" ? workoutsWithGrip(library.data.workouts, id) : [];
  const addTo = useAddToWorkout({
    name,
    pick: async () =>
      grip === undefined ? { exercise: id, kind: "hangboard" as const } : pickedOf({ grip }),
    fingers: true,
    usedIn,
  });
  const gate = useCreateGate("exercise");
  const locks = useLocks();
  const menu: MoreMenuItem[] = [
    ...(addTo.item === null || grip?.hidden === true ? [] : [gate(addTo.item)]),
    ...(canCompareGrips(model.sessions)
      ? [{ label: t("hang.compareGrips"), onSelect: () => void navigate(COMPARE_GRIPS_PATH) }]
      : []),
    ...(grip !== undefined && !grip.hidden
      ? [
          {
            label: archiveGripFlow(name).item,
            onSelect: () => setArchiving(true),
            destructive: true,
          },
        ]
      : []),
  ];

  if (grip !== undefined && locks.exercise({ grip }))
    return <Navigate to={joinPath("exercise")} replace />;
  return (
    <DetailFrame
      backTo={EXERCISES_VIEW}
      hero={libraryPictures("grip", id)}
      action={
        <span className="detail-actions">
          {grip !== undefined && (
            <Link to={editGripPath(id)} className="edit-button">
              {t("common.edit")}
            </Link>
          )}
          {menu.length > 0 && <MoreMenu label={t("summary.more")} items={menu} />}
        </span>
      }
    >
      <div className="intro">
        <span className="intro-kicker">
          <CategoryMark kind="hangboard" size={28} />
          <span className="train-label">{kindLabel("hangboard")}</span>
        </span>
        <h1 className="train-title intro-title">{name}</h1>
        <Description text={gripDescription(id)} fold />
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
      {addTo.sheet}
      {grip !== undefined && archiving && (
        <DeleteSheet
          flow={archiveGripFlow(name)}
          onClose={() => setArchiving(false)}
          onDelete={() => {
            back();
            void actions.archiveGrip(grip);
          }}
        />
      )}
    </DetailFrame>
  );
}
