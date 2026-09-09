import React from "react";

export const CONTACT_EMAIL = "hello@sendtally.com";

export const TERMS_PATH = "/terms";
export const PRIVACY_PATH = "/privacy";

export const GOVERNING_STATE = "[STATE]";

export function ContactLink(): React.ReactElement {
  return <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
}
