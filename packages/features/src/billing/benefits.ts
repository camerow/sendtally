import { t } from "../i18n";
import type { MemberBenefit } from "./types";

export const MEMBER_BENEFITS: MemberBenefit[] = [
  {
    get title() {
      return t("billing.benefitTrendsTitle");
    },
    get body() {
      return t("billing.benefitTrendsBody");
    },
  },
  {
    get title() {
      return t("billing.benefitInfluenceTitle");
    },
    get body() {
      return t("billing.benefitInfluenceBody");
    },
  },
];

const MEMBER_POINT_KEYS = [
  "billing.pointVolume",
  "billing.pointRpe",
  "billing.pointAvgGrade",
  "billing.pointFlashRate",
] as const;

export function memberPoints(): string[] {
  return MEMBER_POINT_KEYS.map((key) => t(key));
}
