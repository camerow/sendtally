import type { Block } from "@sendtally/core/hang";
import { t } from "../i18n";

/** A block's name, or Untitled for a template not named yet. */
export const blockName = (block: Pick<Block, "name">): string => block.name || t("plan.untitled");
