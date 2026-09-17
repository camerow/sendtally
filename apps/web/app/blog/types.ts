import type React from "react";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  topic: string;
  published: string;
  readMinutes: number;
  Body: () => React.ReactElement;
};
