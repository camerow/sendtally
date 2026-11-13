import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { OutboxProvider, queryOutbox } from "@sendtally/features/outbox";
import { useToast } from "../components/Toast";
import { localStore } from "./localStorages";

/** Every write the shared hooks make, kept in this browser under the signed-in user until the server has it. */
export function WebOutboxProvider({
  api,
  userId,
  children,
}: {
  api: SendtallyApi;
  userId: string;
  children: React.ReactNode;
}): React.ReactElement {
  const client = useQueryClient();
  const toast = useToast();
  const outbox = React.useMemo(
    () =>
      queryOutbox(localStore(`sendtally:outbox:${userId}`), api, client, () =>
        toast.show({ message: t("common.changeRefused") })
      ),
    [api, client, userId, toast]
  );
  return <OutboxProvider outbox={outbox}>{children}</OutboxProvider>;
}
