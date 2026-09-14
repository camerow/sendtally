import { t } from "@sendtally/features/i18n";
import React from "react";
import type { PurchasesPackage } from "react-native-purchases";
import type { Entitlements } from "@sendtally/api-client";
import {
  loadPackages,
  purchasePackage,
  restorePurchases,
  storeBillingAvailable,
  storeLabel,
} from "./store";

export type PurchaseStatus = "loading" | "ready" | "purchasing" | "restoring" | "unavailable";

export type PurchaseFeature = {
  status: PurchaseStatus;
  packages: PurchasesPackage[];
  error: string | null;
  purchase: (pkg: PurchasesPackage) => void;
  restore: () => void;
};

export function usePurchase(refresh: () => Promise<Entitlements>): PurchaseFeature {
  const [status, setStatus] = React.useState<PurchaseStatus>(
    storeBillingAvailable ? "loading" : "unavailable"
  );
  const [packages, setPackages] = React.useState<PurchasesPackage[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!storeBillingAvailable) return;
    let cancelled = false;
    loadPackages()
      .then((loaded) => {
        if (cancelled) return;
        setPackages(loaded);
        setStatus(loaded.length === 0 ? "unavailable" : "ready");
      })
      .catch((err: unknown) => {
        console.error(`offerings failed: ${err instanceof Error ? err.message : String(err)}`);
        if (!cancelled) setStatus("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const purchase = React.useCallback(
    (pkg: PurchasesPackage) => {
      setStatus("purchasing");
      setError(null);
      purchasePackage(pkg)
        .then(async (outcome) => {
          if (outcome === "cancelled") return;
          const next = await refresh();
          if (!next.membership.active)
            setError(t("mobile.billing.notEntitledAfterPurchase", { store: storeLabel() }));
        })
        .catch((err: unknown) => {
          console.error(`purchase failed: ${err instanceof Error ? err.message : String(err)}`);
          setError(t("mobile.billing.purchaseFailed"));
        })
        .finally(() => setStatus("ready"));
    },
    [refresh]
  );

  const restore = React.useCallback(() => {
    setStatus("restoring");
    setError(null);
    restorePurchases()
      .then(async () => {
        const next = await refresh();
        if (!next.membership.active)
          setError(t("mobile.billing.nothingToRestore", { store: storeLabel() }));
      })
      .catch((err: unknown) => {
        console.error(`restore failed: ${err instanceof Error ? err.message : String(err)}`);
        setError(t("mobile.billing.restoreFailed"));
      })
      .finally(() => setStatus(packages.length === 0 ? "unavailable" : "ready"));
  }, [packages.length, refresh]);

  return { status, packages, error, purchase, restore };
}
