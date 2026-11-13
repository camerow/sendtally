import React from "react";
import { Link } from "react-router";
import type {
  GradeScalesFeature,
  SettingsVM,
  StravaPostingFeature,
} from "@sendtally/features/settings";
import type { MembershipVM } from "@sendtally/features/billing";
import type { Gym } from "@sendtally/features/gyms";
import { GymsSection } from "../../gyms/components/GymsSection";
import { bodyText, monoMuted, pageTitle, secondaryButton } from "./styles";
import { t } from "@sendtally/features/i18n";
import { ChevronRow } from "./ChevronRow";
import { GradeScaleSection } from "./GradeScaleSection";
import { MembershipSection } from "./MembershipSection";
import { Section } from "./Section";
import { StatusPill } from "./StatusPill";
import { StravaPostingSection } from "./StravaPostingSection";
import { WeightUnitSection } from "./WeightUnitSection";
import { sectionLabel } from "../../components/styles";

const dataButton: React.CSSProperties = {
  ...secondaryButton,
  fontSize: 13,
  padding: "9px 16px",
  textDecoration: "none",
};

export type SettingsViewProps = {
  vm: SettingsVM;
  email: string;
  membership: MembershipVM;
  posting: StravaPostingFeature;
  scales: GradeScalesFeature;
  gyms: Gym[];
  gymsReady: boolean;
  /** At 375 the tab bar has no room for Moderation, so it is a row here. */
  moderator?: boolean;
};

export function SettingsView({
  vm,
  email,
  membership,
  posting,
  scales,
  gyms,
  gymsReady,
  moderator = false,
}: SettingsViewProps): React.ReactElement {
  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 style={pageTitle}>{t("common.settings")}</h1>

      <WeightUnitSection />

      <Section>
        <span style={sectionLabel}>{t("settings.grades")}</span>
        <p style={bodyText}>{t("settings.gradesBody")}</p>
        <GradeScaleSection scales={scales} />
      </Section>

      <Section>
        <GymsSection gyms={gyms} ready={gymsReady} />
      </Section>

      <Section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={sectionLabel}>Strava</span>
          <StatusPill label={vm.stravaStatusLabel} active={vm.stravaActive} />
        </div>
        <p style={bodyText}>
          {vm.stravaActive
            ? t("settings.stravaActive")
            : vm.stravaConnected
              ? t("settings.stravaLapsed")
              : t("settings.stravaConnectBody")}
        </p>
        {vm.stravaActive ? (
          <StravaPostingSection posting={posting} />
        ) : (
          <Link
            to="/app/setup"
            style={{
              ...secondaryButton,
              fontSize: 15,
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            {vm.stravaConnected ? t("settings.relinkStrava") : t("sessions.connectStrava")}
          </Link>
        )}
      </Section>

      <Section>
        <MembershipSection membership={membership} />
      </Section>

      <Section>
        <span style={sectionLabel}>{t("settings.yourData")}</span>
        <p style={bodyText}>{t("settings.yourDataBody")}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/app/import" style={dataButton}>
            {t("settings.importCsv")}
          </Link>
          <a href="/app/export.csv" download="sendtally-export.csv" style={dataButton}>
            {t("settings.exportCsv")}
          </a>
        </div>
      </Section>

      <Link to="/app/account" style={{ textDecoration: "none", color: "inherit" }}>
        <Section>
          <ChevronRow>
            <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <span style={sectionLabel}>{t("common.account")}</span>
              <span
                style={{
                  ...monoMuted,
                  fontSize: 11,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {email}
              </span>
            </span>
          </ChevronRow>
        </Section>
      </Link>

      {moderator && (
        <Link
          to="/app/moderation"
          className="narrow-only"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Section>
            <ChevronRow>
              <span style={sectionLabel}>Moderation</span>
            </ChevronRow>
          </Section>
        </Link>
      )}
    </div>
  );
}
