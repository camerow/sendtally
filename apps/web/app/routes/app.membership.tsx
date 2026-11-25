import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import type { MembershipStatus } from "@sendtally/api-client";
import { Badge } from "@sendtally/design";
import {
  membershipSource,
  membershipVM,
  storeChipName,
  useMembersGet,
} from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import billingStyles from "../billing/billing.css?url";
import { MembersGet } from "../billing/components/MembersGet";
import { MembershipCheckout, SUBSCRIBED_PARAM } from "../billing/components/MembershipCheckout";
import { MembershipPanel } from "../billing/components/MembershipPanel";
import { StoreMembershipStrip } from "../billing/components/StoreMembershipStrip";
import {
  useWebMembershipItem,
  WebMembershipStrip,
  webMembershipStatus,
} from "../billing/components/WebMembershipStrip";
import { capture } from "../lib/analytics";
import firstRunStyles from "../first-run/first-run.css?url";
import planPathStyles from "../first-run/plan/plan-path.css?url";
import { getMembership } from "../lib/billing.server";
import { useAppApi } from "../lib/useAppApi";
import playerStyles from "../training/players/players.css?url";

type LoaderData = { membership: MembershipStatus };

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: firstRunStyles },
  { rel: "stylesheet", href: planPathStyles },
  { rel: "stylesheet", href: playerStyles },
  { rel: "stylesheet", href: billingStyles },
];

/** Fires once for the checkout redirect, then drops the marker so a reload cannot double count. */
function useSubscribedRedirect(): void {
  const [params, setParams] = useSearchParams();
  const marked = params.get(SUBSCRIBED_PARAM) !== null;

  React.useEffect(() => {
    if (!marked) return;
    capture("membership_started", { channel: "web" });
    setParams(
      (next) => {
        next.delete(SUBSCRIBED_PARAM);
        return next;
      },
      { replace: true }
    );
  }, [marked, setParams]);
}

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  return { membership: await getMembership(args) };
}

function WebMemberPanel(): React.ReactElement {
  const status = webMembershipStatus(useWebMembershipItem());
  return (
    <MembershipPanel
      eyebrow={t("billing.memberVia", { store: "sendtally.com" })}
      title={
        status.endsOn === null
          ? t("billing.trainingOpen")
          : t("billing.trainingOpenUntil", { date: status.endsOn })
      }
    >
      <WebMembershipStrip status={status} />
    </MembershipPanel>
  );
}

export default function MembershipRoute(): React.ReactElement {
  const { membership } = useLoaderData<typeof loader>();
  useSubscribedRedirect();
  const vm = membershipVM({ membership });
  const members = useMembersGet(useAppApi());
  const [params] = useSearchParams();
  const source = membershipSource(params.get("source"));
  const sent = React.useRef(false);
  React.useEffect(() => {
    if (source === null || vm.active || sent.current) return;
    sent.current = true;
    capture("paywall_shown", { source });
  }, [source, vm.active]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: "-0.03em",
          }}
        >
          {t("common.membership")}
        </h1>
        {vm.active && <Badge tone="petal">{t("common.member")}</Badge>}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: "21px",
          color: "var(--text-on-white-secondary)",
          maxWidth: "62ch",
        }}
      >
        {t("billing.intro")}
      </p>

      {!vm.active ? (
        <>
          {members !== null && <MembersGet view={members} />}
          <MembershipCheckout />
        </>
      ) : vm.managedIn === "web" ? (
        <WebMemberPanel />
      ) : (
        <MembershipPanel
          eyebrow={t("billing.memberVia", { store: storeChipName(vm.managedIn ?? "other") })}
          title={t("billing.trainingOpen")}
        >
          <StoreMembershipStrip vm={vm} />
        </MembershipPanel>
      )}
    </div>
  );
}
