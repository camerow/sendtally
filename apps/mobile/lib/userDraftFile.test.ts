import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockFiles = new Map<string, string>();

jest.mock("expo-file-system", () => ({
  Paths: { document: "doc" },
  File: class {
    name: string;
    constructor(_dir: string, name: string) {
      this.name = name;
    }
    get exists(): boolean {
      return mockFiles.has(this.name);
    }
    create(): void {
      mockFiles.set(this.name, "");
    }
    write(value: string): void {
      mockFiles.set(this.name, value);
    }
    textSync(): string {
      return mockFiles.get(this.name) ?? "";
    }
    delete(): void {
      mockFiles.delete(this.name);
    }
    rename(next: string): void {
      mockFiles.set(next, mockFiles.get(this.name) ?? "");
      mockFiles.delete(this.name);
    }
  },
}));

import { setDraftOwner, userDraftFile } from "./userDraftFile";

beforeEach(() => {
  mockFiles.clear();
  setDraftOwner(null);
});

describe("userDraftFile", () => {
  it("keeps each account's draft to itself", () => {
    const store = userDraftFile("live-session");
    setDraftOwner("will");
    store.write("will's session");
    setDraftOwner("tester");
    expect(store.read()).toBeNull();
    setDraftOwner("will");
    expect(store.read()).toBe("will's session");
  });

  it("reads nothing and tells its readers when the account changes", () => {
    const store = userDraftFile("live-session");
    const heard = jest.fn();
    store.subscribe(heard);
    setDraftOwner("will");
    expect(heard).toHaveBeenCalledTimes(1);
    setDraftOwner(null);
    expect(store.read()).toBeNull();
    expect(store.write("x")).toBe(false);
  });

  it("gives a draft saved before accounts were kept apart to the first account to read it", () => {
    mockFiles.set("live-session.json", "old session");
    const store = userDraftFile("live-session");
    setDraftOwner("will");
    expect(store.read()).toBe("old session");
    setDraftOwner("tester");
    expect(store.read()).toBeNull();
  });
});
