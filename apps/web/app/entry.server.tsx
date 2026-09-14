import { AsyncLocalStorage } from "node:async_hooks";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { setLocaleResolver, type Locale } from "@sendtally/features/i18n";
import { requestLocale } from "./lib/locale";

const localeStore = new AsyncLocalStorage<Locale>();
setLocaleResolver(() => localeStore.getStore() ?? "en");

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
): Promise<Response> {
  return localeStore.run(requestLocale(request), () =>
    render(request, responseStatusCode, responseHeaders, routerContext)
  );
}

async function render(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
): Promise<Response> {
  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown): void {
        responseStatusCode = 500;
        if (shellRendered) console.error(error);
      },
    }
  );
  shellRendered = true;

  if ((userAgent !== null && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, { headers: responseHeaders, status: responseStatusCode });
}
