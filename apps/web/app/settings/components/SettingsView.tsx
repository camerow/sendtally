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
import {
  bodyText,
  linkAction,
  monoMuted,
  pageTitle,
  secondaryButton,
  sectionLabel,
} from "./styles";
import { t } from "@sendtally/features/i18n";
import { ChevronRow } from "./ChevronRow";
import { GradeScaleSection } from "./GradeScaleSection";
import { MembershipSection } from "./MembershipSection";
import { Section } from "./Section";
import { StatusPill } from "./StatusPill";
import { StravaPostingSection } from "./StravaPostingSection";

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
};

export function SettingsView({
  vm,
  email,
  membership,
  posting,
  scales,
  gyms,
  gymsReady,
}: SettingsViewProps): React.ReactElement {
  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 style={pageTitle}>{t("common.settings")}</h1>

      <Section>
        <span style={sectionLabel}>{t("settings.grades")}</span>
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
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusPill label={vm.stravaStatusLabel} active={vm.stravaActive} />
            {vm.stravaActive && (
              <Link to="/app/setup" style={linkAction}>
                {t("settings.relink")}
              </Link>
            )}
          </span>
        </div>
        {vm.stravaActive ? (
          <StravaPostingSection posting={posting} />
        ) : (
          <>
            <p style={bodyText}>
              {vm.stravaConnected ? t("settings.stravaLapsed") : t("settings.stravaConnectBody")}
            </p>
            <Link
              to="/app/setup"
              style={{
                ...secondaryButton,
                fontSize: 14,
                textDecoration: "none",
                alignSelf: "flex-start",
              }}
            >
              {vm.stravaConnected ? t("settings.relinkStrava") : t("sessions.connectStrava")}
            </Link>
          </>
        )}
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

      <Section>
        <MembershipSection membership={membership} />
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
    </div>
  );
}
