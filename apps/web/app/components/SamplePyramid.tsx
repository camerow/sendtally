import React from "react";
import type { PyramidRow } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { displayGrade } from "@sendtally/features/sessions";
import { SAMPLE_PYRAMID, useDisplayScales } from "@sendtally/features/settings";
import { Pyramid } from "./Pyramid";

/** The pyramid drawn before the user has one, in their grade scale: a picture, so no counts. */
export function SamplePyramid({ tone }: { tone?: "light" | "dark" }): React.ReactElement {
  const scales = useDisplayScales();
  const rows: PyramidRow[] = SAMPLE_PYRAMID.map(({ value, inner, outer }) => ({
    gradeLabel: displayGrade({ scale: "v", value }, scales),
    inner,
    outer,
    countLabel: "",
  }));
  return <Pyramid label={t("trends.gradePyramid")} rows={rows} tone={tone} />;
}
