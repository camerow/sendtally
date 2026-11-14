import React from "react";
import { createMemoryRouter, RouterProvider } from "react-router";

// jsdom has no Request, so the data router builds Node's on every navigation, and Node's
// refuses the AbortSignal jsdom made. No test aborts a navigation, so the signal is left out.
globalThis.Request = class extends Request {
  constructor(input: RequestInfo | URL, { signal: _, ...init }: RequestInit = {}) {
    super(input, init);
  }
};

const Children = React.createContext<React.ReactNode>(null);
const routes = [{ path: "*", Component: (): React.ReactNode => React.useContext(Children) }];

export type TestRouterProps = {
  initialEntries?: string[];
  initialIndex?: number;
  children: React.ReactNode;
};

/** A test's MemoryRouter as a data router, which a page that blocks navigation needs. */
export function TestRouter({ children, ...history }: TestRouterProps): React.ReactElement {
  const [router] = React.useState(() => createMemoryRouter(routes, history));
  return (
    <Children.Provider value={children}>
      <RouterProvider router={router} />
    </Children.Provider>
  );
}
