import { t } from "../i18n";
import type { MemberBenefit } from "./types";

export function memberBenefits(): MemberBenefit[] {
  return [
    { title: t("billing.benefitTrendsTitle"), body: t("billing.benefitTrendsBody") },
    { title: t("billing.benefitInfluenceTitle"), body: t("billing.benefitInfluenceBody") },
  ];
}

export function memberPoints(): string[] {
  return [
    t("billing.pointVolume"),
    t("billing.pointRpe"),
    t("billing.pointAvgGrade"),
    t("billing.pointFlashRate"),
  ];
}
