import type React from "react";
import type { LandingPhoto } from "../landing/photos";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  topic: string;
  published: string;
  readMinutes: number;
  /** Optional hero image, shown beside the title on the index and above the article. */
  hero?: LandingPhoto;
  Body: () => React.ReactElement;
};
