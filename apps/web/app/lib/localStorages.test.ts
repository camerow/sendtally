import { describe, expect, it, vi } from "vitest";
import { localStore } from "./localStorages";

describe("localStore", () => {
  it("tells its readers when another tab writes its key, and only its key", () => {
    const store = localStore("sendtally:test");
    const heard = vi.fn();
    store.subscribe(heard);
    window.dispatchEvent(new StorageEvent("storage", { key: "sendtally:other" }));
    expect(heard).not.toHaveBeenCalled();
    window.dispatchEvent(new StorageEvent("storage", { key: "sendtally:test" }));
    expect(heard).toHaveBeenCalledOnce();
  });
});
