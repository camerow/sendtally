import React from "react";
import { Link } from "react-router";
import type { Gym } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { CircuitDot } from "../../components/CircuitDot";
import { Icon } from "../../components/Icon";
import { ChevronRow } from "../../settings/components/ChevronRow";
import {
  bodyText,
  monoMuted,
  secondaryButton,
  sectionLabel,
} from "../../settings/components/styles";

export function GymsSection({ gyms }: { gyms: Gym[] }): React.ReactElement {
  return (
    <>
      <span style={sectionLabel}>{t("gyms.title")}</span>
      {gyms.length === 0 ? (
        <p style={bodyText}>{t("gyms.none")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {gyms.map((gym) => (
            <Link
              key={gym.id}
              to={`/app/settings/gyms/${encodeURIComponent(gym.id)}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                borderBottom: "1px solid var(--line-on-light-soft)",
                padding: "4px 0",
              }}
            >
              <ChevronRow>
                <span style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{gym.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                    {gym.circuits.map((c) => (
                      <CircuitDot key={c.id} colour={c.colour} size={10} />
                    ))}
                    <span style={{ ...monoMuted, marginLeft: 4, textTransform: "uppercase" }}>
                      {t("gyms.circuitCount", { count: gym.circuits.length })}
                    </span>
                  </span>
                </span>
              </ChevronRow>
            </Link>
          ))}
        </div>
      )}
      <Link
        to="/app/settings/gyms/new"
        style={{
          ...secondaryButton,
          fontSize: 14,
          textDecoration: "none",
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Icon name="plus" size={16} strokeWidth={2.2} />
        {t("gyms.addGym")}
      </Link>
    </>
  );
}
