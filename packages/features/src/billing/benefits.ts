import { t } from "../i18n";

export function memberPoints(): string[] {
  return [
    t("billing.pointVolume"),
    t("billing.pointRpe"),
    t("billing.pointAvgGrade"),
    t("billing.pointFlashRate"),
  ];
}

export type MembershipPanelRow = {
  eyebrow: string;
  line: string;
  bars: number[];
  peak: number;
};

export type MembershipPanel = {
  eyebrow: string;
  title: string;
  pageTitle: string;
  body: string;
  cta: string;
  footnote: string;
  rows: MembershipPanelRow[];
};

/** The in-app membership panel: the marketing price panel, aimed at someone already logging. */
export function membershipPanel(): MembershipPanel {
  return {
    eyebrow: t("common.membership"),
    title: t("billing.panelTitle"),
    pageTitle: t("billing.panelPageTitle"),
    body: t("billing.panelBody"),
    cta: t("billing.becomeAMember"),
    footnote: t("billing.panelFootnote"),
    rows: [
      {
        eyebrow: t("trends.volume"),
        line: t("billing.panelVolume"),
        bars: [40, 55, 45, 70, 60, 100],
        peak: 5,
      },
      {
        eyebrow: t("trends.gradePyramid"),
        line: t("billing.panelPyramid"),
        bars: [30, 60, 100, 80, 45, 20],
        peak: 2,
      },
      {
        eyebrow: t("trends.hardestSend"),
        line: t("billing.panelHardest"),
        bars: [50, 50, 65, 65, 80, 100],
        peak: 5,
      },
      {
        eyebrow: t("trends.flashRate"),
        line: t("billing.panelFlash"),
        bars: [35, 45, 40, 70, 100, 85],
        peak: 4,
      },
    ],
  };
}
