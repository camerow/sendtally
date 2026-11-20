import React from "react";
import type { PyramidRow } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { SAMPLE_PYRAMID, useDisplayScales } from "@sendtally/features/settings";
import { displayGrade } from "@sendtally/features/sessions";
import { Pyramid } from "./Pyramid";

/** The pyramid drawn before the user has one, in their grade scale. */
export function SamplePyramid({
  rows = SAMPLE_PYRAMID.length,
}: {
  rows?: number;
}): React.ReactElement {
  const scales = useDisplayScales();
  const sample: PyramidRow[] = SAMPLE_PYRAMID.slice(0, rows).map(({ value, inner, outer }) => ({
    gradeLabel: displayGrade({ scale: "v", value }, scales),
    inner,
    outer,
    countLabel: `${inner}/${inner + outer}`,
  }));
  return <Pyramid label={t("trends.gradePyramid")} rows={sample} />;
}
