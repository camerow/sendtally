import React from "react";
import { useParams } from "react-router";
import { GripPage } from "../training/grip/GripPage";

export default function GripRoute(): React.ReactElement {
  return <GripPage id={useParams().id ?? ""} />;
}
