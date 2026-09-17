import type { LoaderFunctionArgs } from "react-router";
import { requireApi } from "../lib/api.server";

export async function loader(args: LoaderFunctionArgs): Promise<Response> {
  const api = await requireApi(args);
  return new Response(await api.exportCsv(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="sendtally-export.csv"',
      "cache-control": "no-store",
    },
  });
}
