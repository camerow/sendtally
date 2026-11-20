import React from "react";
import { Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import type { ClimbPillKind } from "@sendtally/features/climbs";
import { formatDate, t } from "@sendtally/features/i18n";
import {
  disciplineLabel,
  disciplineOf,
  draftGrade,
  draftGradeLabel,
  gradeOptions,
  localDate,
  logClimbOnDay,
  newClimb,
  withClimbDiscipline,
  type ClimbDraft,
} from "@sendtally/features/log-session";
import { yearDate } from "@sendtally/features/onboarding";
import { useDisplayScales } from "@sendtally/features/settings";
import { DateTimeField } from "../../../components/DateTimeField";
import { GradeChips } from "../../../components/GradeChips";
import { Segmented } from "../../../components/Segmented";
import { TextInput } from "../../../components/TextInput";
import { ClimbLogRow } from "../../climbs/ClimbLogRow";
import { Button } from "../../training/components/Button";
import { Label } from "../../training/components/Label";
import { Title } from "../../training/components/Title";
import { AMBER } from "../../training/components/tints";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { HistoryCard } from "./components/HistoryCard";
import { useHistoryCard } from "./useHistoryCard";

type Outcome = "flash" | "send" | "project";

type Added = { key: string; gradeLabel: string; name: string; when: string; outcome: Outcome };

const YEARS = 12;

const PILL: Record<Outcome, ClimbPillKind> = { flash: "flash", send: "sent", project: "project" };

const outcomeLabel = (o: Outcome): string =>
  o === "flash"
    ? t("logSession.styleFlash")
    : o === "send"
      ? t("common.sent")
      : t("common.project");

const fieldLabel = {
  fontFamily: fonts.monoMedium,
  fontSize: 11,
  letterSpacing: 0.9,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

/** The climb as the log stores it: Flash and Sent are sends of one try, a Project an attempt kept as one. */
const asLogged = (climb: ClimbDraft, outcome: Outcome): Omit<ClimbDraft, "key"> => {
  const { key: _key, ...rest } = climb;
  return {
    ...rest,
    name: climb.name.trim(),
    kind: outcome === "project" ? "attempt" : "send",
    style: outcome === "flash" ? "flash" : "redpoint",
    tries: 1,
    ...(outcome === "project" ? { project: true } : {}),
  };
};

/** H2h: past climbs that mattered, each saved on its own Add, the card above growing with them. */
export function AddClimbsStep({ wizard, api }: Parameters<StepComponent>[0]): React.ReactElement {
  const scales = useDisplayScales();
  const card = useHistoryCard(api);
  const fresh = (scale: ClimbDraft["scale"]): ClimbDraft => ({
    ...newClimb("climb-1", scale),
    grade: "",
  });
  const [climb, setClimb] = React.useState<ClimbDraft>(() => fresh(scales.boulder));
  const [outcome, setOutcome] = React.useState<Outcome>("send");
  const [now] = React.useState(() => new Date());
  const [year, setYear] = React.useState(now.getFullYear());
  const [day, setDay] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [added, setAdded] = React.useState<readonly Added[]>([]);

  const discipline = disciplineOf(climb.scale);
  const ladder = gradeOptions(climb.scale);
  const at = ladder.indexOf(climb.grade);
  const needsName = outcome === "project" && climb.name.trim() === "";
  const canAdd = draftGrade(climb.grade, climb.scale) !== undefined && !needsName && !saving;
  const years = Array.from({ length: YEARS }, (_, i) => String(now.getFullYear() - i));

  const add = (): void => {
    if (!canAdd) return;
    setSaving(true);
    setFailed(false);
    logClimbOnDay(api, asLogged(climb, outcome), day ?? yearDate(year, now), []).then(
      () => {
        wizard.capture("climb_added", {
          kind: discipline,
          outcome,
          dated: day === null ? "year" : "day",
        });
        setAdded((list) => [
          {
            key: `${list.length}`,
            gradeLabel: draftGradeLabel(climb, scales),
            name: climb.name.trim() === "" ? disciplineLabel(discipline) : climb.name.trim(),
            when:
              day === null
                ? String(year)
                : formatDate(new Date(`${day}T00:00:00Z`), {
                    timeZone: "UTC",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }),
            outcome,
          },
          ...list,
        ]);
        setClimb({ ...climb, name: "", grade: "" });
        setSaving(false);
      },
      () => {
        setSaving(false);
        setFailed(true);
      }
    );
  };

  const total = card?.climbs ?? 0;
  return (
    <WizardFrame
      wizard={wizard}
      sticky={[1]}
      footer={
        <Button
          variant="primary"
          height={54}
          label={
            total === 0
              ? t("onboarding.history.add.see")
              : t("onboarding.history.add.seeCount", { count: total })
          }
          disabled={total === 0}
          onPress={() =>
            wizard.next({
              count: added.length,
              sends: added.filter((a) => a.outcome !== "project").length,
            })
          }
        />
      }
    >
      <View style={{ gap: 8 }}>
        <Title size={34}>{t("onboarding.history.add.title")}</Title>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            lineHeight: 22,
            color: colors.textSecondary,
          }}
        >
          {t("onboarding.history.add.body")}
        </Text>
      </View>
      <View style={{ backgroundColor: colors.white, paddingBottom: 4 }}>
        {card !== null && (
          <HistoryCard vm={card} label={t("onboarding.history.card.soFar")} max={5} next raised />
        )}
      </View>
      <View style={{ gap: 6 }}>
        <Text style={fieldLabel}>{t("climbs.climb")}</Text>
        <TextInput
          value={climb.name}
          onChangeText={(name) => setClimb({ ...climb, name })}
          placeholder={t("climbs.namePlaceholder")}
          placeholderTextColor={colors.textFaint}
          accessibilityLabel={t("climbs.climb")}
          autoCorrect={false}
          style={{
            height: 50,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: colors.surfaceSoft,
            fontFamily: fonts.sans,
            fontSize: 15,
            color: colors.gunmetal,
          }}
        />
      </View>
      <View style={{ gap: 8 }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Text style={fieldLabel}>{t("common.grade")}</Text>
          <View style={{ width: 180 }}>
            <Segmented
              soft
              label={t("climbs.discipline")}
              segments={(["boulder", "route"] as const).map((d) => ({
                key: d,
                label: disciplineLabel(d),
                on: d === discipline,
                onPress: () => setClimb({ ...withClimbDiscipline(climb, d, scales), grade: "" }),
              }))}
            />
          </View>
        </View>
        <View style={{ marginHorizontal: -18 }}>
          <GradeChips
            light
            chips={ladder.map((g) => ({ key: g, label: g }))}
            active={at < 0 ? null : climb.grade}
            startIndex={at < 0 ? Math.floor(ladder.length / 3) : at}
            onPick={(grade) => setClimb({ ...climb, grade })}
          />
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={fieldLabel}>{t("onboarding.history.add.howItWent")}</Text>
        <Segmented
          soft
          label={t("onboarding.history.add.howItWent")}
          segments={(["flash", "send", "project"] as const).map((o) => ({
            key: o,
            label: outcomeLabel(o),
            on: o === outcome,
            onPress: () => setOutcome(o),
          }))}
        />
        {needsName && (
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: AMBER }}>
            {t("onboarding.history.add.needsName")}
          </Text>
        )}
      </View>
      <View style={{ gap: 8 }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Text style={fieldLabel}>{t("onboarding.history.add.whenRoughly")}</Text>
          <Button
            variant="link"
            height={32}
            label={t("onboarding.history.add.pickDay")}
            onPress={() => setDay(day === null ? localDate(now) : null)}
            style={{ paddingHorizontal: 0 }}
          />
        </View>
        {day === null ? (
          <View style={{ marginHorizontal: -18 }}>
            <GradeChips
              light
              chips={years.map((y) => ({ key: y, label: y }))}
              active={String(year)}
              startIndex={0}
              onPick={(y) => setYear(Number(y))}
            />
          </View>
        ) : (
          <DateTimeField
            mode="date"
            value={day}
            max={localDate(now)}
            label={t("logSession.date")}
            onChange={setDay}
          />
        )}
      </View>
      {failed && (
        <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
          {t("climbs.saveFailed")}
        </Text>
      )}
      <Button
        variant="outline"
        icon="plus"
        label={t("climbs.addClimb")}
        disabled={!canAdd}
        onPress={add}
        style={{ borderRadius: radius.control }}
      />
      {added.length > 0 && (
        <View>
          <Label color={colors.gunmetal}>
            {t("onboarding.history.add.addedCount", { count: added.length })}
          </Label>
          {added.map((a) => (
            <ClimbLogRow
              key={a.key}
              row={{
                id: a.key,
                gradeLabel: a.gradeLabel,
                name: a.name,
                meta: a.when,
                pill: { kind: PILL[a.outcome], label: outcomeLabel(a.outcome) },
              }}
              onPress={null}
            />
          ))}
        </View>
      )}
    </WizardFrame>
  );
}
