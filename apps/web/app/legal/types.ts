import type React from "react";

export type LegalSection = {
  heading: string;
  body: React.ReactNode[];
  bullets?: React.ReactNode[];
};

export type LegalDocument = {
  title: string;
  lede: string;
  effective: string;
  sections: LegalSection[];
};
