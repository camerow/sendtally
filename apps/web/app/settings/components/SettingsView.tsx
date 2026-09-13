import React from "react";
import { Link } from "react-router";
import type {
  GradeScalesFeature,
  SettingsVM,
  StravaPostingFeature,
} from "@sendtally/features/settings";
import type { MembershipVM } from "@sendtally/features/billing";
import { azureButton, bodyText, linkAction, monoMuted, pageTitle, sectionLabel } from "./styles";
import { ChevronRow } from "./ChevronRow";
import { GradeScaleSection } from "./GradeScaleSection";
import { MembershipSection } from "./MembershipSection";
import { Section } from "./Section";
import { StatusPill } from "./StatusPill";
import { StravaPostingSection } from "./StravaPostingSection";

export type SettingsViewProps = {
  vm: SettingsVM;
  email: string;
  membership: MembershipVM;
  posting: StravaPostingFeature;
  scales: GradeScalesFeature;
};

export function SettingsView({
  vm,
  email,
  membership,
  posting,
  scales,
}: SettingsViewProps): React.ReactElement {
  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 style={pageTitle}>Settings</h1>

      <Section>
        <span style={sectionLabel}>GRADES</span>
        <GradeScaleSection scales={scales} />
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
          <span style={sectionLabel}>STRAVA</span>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusPill label={vm.stravaStatusLabel} active={vm.stravaActive} />
            {vm.stravaActive && (
              <Link to="/app/setup" style={linkAction}>
                Re-link
              </Link>
            )}
          </span>
        </div>
        {vm.stravaActive ? (
          <StravaPostingSection posting={posting} />
        ) : (
          <>
            <p style={bodyText}>
              {vm.stravaConnected
                ? "Strava access has lapsed. Re-link it to start posting your sessions again."
                : "Connect Strava and your logged sessions can post to your feed as Rock Climbing activities."}
            </p>
            <Link to="/app/setup" style={{ ...azureButton, textDecoration: "none" }}>
              {vm.stravaConnected ? "Re-link Strava" : "Connect Strava"}
            </Link>
          </>
        )}
      </Section>

      <Section>
        <MembershipSection membership={membership} />
      </Section>

      <Link to="/app/account" style={{ textDecoration: "none", color: "inherit" }}>
        <Section>
          <ChevronRow>
            <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <span style={sectionLabel}>ACCOUNT</span>
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
