import type { Block } from "@sendtally/core/hang";
import { t } from "../i18n";

export const blockName = (block: Pick<Block, "name">): string => block.name || t("plan.untitled");
