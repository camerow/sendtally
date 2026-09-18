import React from "react";
import { t } from "@sendtally/features/i18n";
import {
  TREND_SETTINGS,
  settingLabel,
  type TrendGymVM,
  type TrendSetting,
} from "@sendtally/features/trends";

export function PlacePicker({
  setting,
  gymId,
  gyms,
  onChange,
}: {
  setting: TrendSetting;
  gymId: string | null;
  gyms: TrendGymVM[];
  onChange: (setting: TrendSetting, gymId: string | null) => void;
}): React.ReactElement {
  return (
    <div>
      <div role="group" aria-label={t("trends.insideOrOutside")} className="trend-switch">
        {TREND_SETTINGS.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={gymId === null && setting === s}
            onClick={() => onChange(s, null)}
          >
            {settingLabel(s)}
          </button>
        ))}
      </div>
      {gyms.length > 0 && (
        <>
          <span className="trend-small-label" style={{ margin: "16px 6px 6px" }}>
            {t("trends.gyms")}
          </span>
          {gyms.map((g) => {
            const on = gymId === g.id;
            return (
              <button
                key={g.id}
                type="button"
                className="trend-option"
                aria-pressed={on}
                onClick={() => onChange("all", on ? null : g.id)}
              >
                <span className="trend-radio" />
                <span className="trend-option-name">{g.name}</span>
                <span className="trend-option-count">
                  {t("sessions.sessionCount", { count: g.sessions })}
                </span>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
