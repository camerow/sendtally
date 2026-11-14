import React from "react";
import { useSearchParams } from "react-router";

import { NewActivityPage } from "../training/log/NewActivityPage";

export default function Route(): React.ReactElement {
  const [params] = useSearchParams();
  return <NewActivityPage params={Object.fromEntries(params)} />;
}
