import React from "react";
import type { ThemeName } from "@sendtally/core/hang";
import { themeFor, type Theme } from "./themes";

const ThemeContext = React.createContext<Theme>(themeFor("moss"));

export function ThemeProvider({
  name,
  children,
}: {
  name: ThemeName;
  children: React.ReactNode;
}): React.ReactElement {
  const theme = React.useMemo(() => themeFor(name), [name]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return React.useContext(ThemeContext);
}
