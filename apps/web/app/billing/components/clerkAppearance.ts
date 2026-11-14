import { colors, radius } from "@sendtally/design/tokens";

/** Clerk's billing widgets in our colours and corners. */
export const clerkAppearance = {
  variables: {
    colorPrimary: colors.azureInk,
    colorBackground: colors.white,
    colorForeground: colors.gunmetal,
    borderRadius: `${radius.control}px`,
  },
} as const;
