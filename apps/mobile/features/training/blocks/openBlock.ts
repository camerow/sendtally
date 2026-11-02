import { router } from "expo-router";

/** A block's screen, `back` naming the screen it opens from. */
export function openBlock(id: string, back?: string): void {
  router.push({
    pathname: "/plan/block/[id]",
    params: back === undefined ? { id } : { id, back },
  });
}
