import React from "react";
import { Text, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { disciplineLabel } from "@sendtally/features/log-session";
import { cardMeta, nextUnlock, type HistoryCardVM } from "@sendtally/features/settings";
import { Pyramid } from "../../../../components/Pyramid";
import { DarkCard } from "../../components/DarkCard";
import { DarkTile } from "./DarkTile";
import { HardestSend } from "./HardestSend";
import { YearBars } from "./YearBars";

export type HistoryCardProps = {
  vm: HistoryCardVM;
  label: string;
  /** Only the pyramid: no tiles, hardest send or years. */
  slim?: boolean;
  /** At most this many grades, the rest counted under them. */
  max?: number;
  /** The foot line saying what the next climbs add, for climbs added by hand. */
  next?: boolean;
  /** Days climbed in place of sends, for a file whose sends the reveal already counts. */
  days?: boolean;
  raised?: boolean;
  grow?: Readonly<SharedValue<number>>;
};

function Ghost(): React.ReactElement {
  return (
    <View style={{ alignItems: "center", gap: 8, paddingVertical: 6 }}>
      {["26%", "48%", "74%"].map((width) => (
        <View
          key={width}
          style={{
            width: width as `${number}%`,
            height: 12,
            borderRadius: 3,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: "rgba(255,255,255,0.3)",
          }}
        />
      ))}
    </View>
  );
}

function Unlock({ climbs }: { climbs: number }): React.ReactElement {
  const next = nextUnlock(climbs);
  if ("text" in next) return <>{next.text}</>;
  return (
    <>
      {next.before}
      <Text style={{ fontFamily: fonts.monoSemiBold, color: colors.gold }}>{next.more}</Text>
      {next.after}
    </>
  );
}

/** The history path's payoff card: the user's climbing as Stats draws it, on the dark ground. */
export function HistoryCard({
  vm,
  label,
  slim = false,
  max,
  next = false,
  days = false,
  raised = false,
  grow,
}: HistoryCardProps): React.ReactElement {
  const { stats } = vm;
  const rows = max === undefined ? stats.pyramid : stats.pyramid.slice(0, max);
  const hidden = stats.pyramid.length - rows.length;
  const showYears = !slim && (!next || vm.climbs >= 5) && vm.byYear.length >= 2;
  return (
    <DarkCard
      label={label}
      meta={cardMeta(vm)}
      raised={raised}
      {...(next ? { note: <Unlock climbs={vm.climbs} /> } : {})}
    >
      {rows.length === 0 ? (
        <Ghost />
      ) : (
        <View>
          <Pyramid
            tone="dark"
            rows={rows}
            label={rows.map((r) => `${r.gradeLabel}: ${r.countLabel}`).join(". ")}
            {...(grow === undefined ? {} : { grow })}
          />
          {hidden > 0 && (
            <Text
              style={{
                paddingTop: 4,
                fontFamily: fonts.mono,
                fontSize: 12,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              {t("onboarding.history.card.moreGrades", { count: hidden })}
            </Text>
          )}
        </View>
      )}
      {!slim && vm.climbs > 0 && (
        <>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <DarkTile value={stats.avgSend} label={t("climbs.avgSendWord")} />
            {days ? (
              <DarkTile
                value={vm.days}
                label={t("onboarding.history.card.daysWord", { count: vm.days })}
              />
            ) : (
              <DarkTile value={stats.sends} label={t("climbs.sendsWord", { count: stats.sends })} />
            )}
            <DarkTile value={stats.flashed} label={t("climbs.flashedWord")} />
            <DarkTile
              value={stats.projects}
              label={t("climbs.projectsWord", { count: stats.projects })}
            />
          </View>
          {stats.hardest !== null && (
            <HardestSend
              gradeLabel={stats.hardest.gradeLabel}
              name={stats.hardest.name ?? disciplineLabel(vm.discipline)}
              year={vm.hardestYear}
            />
          )}
        </>
      )}
      {showYears && <YearBars years={vm.byYear} />}
    </DarkCard>
  );
}
