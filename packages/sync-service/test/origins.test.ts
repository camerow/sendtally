import { describe, expect, it } from "vitest";
import { allowedOrigin } from "../src/lib/origins";

describe("allowedOrigin", () => {
  it("allows any local origin while the app runs locally", () => {
    expect(allowedOrigin("http://localhost:5174", "http://localhost:5175")).toBe(
      "http://localhost:5174"
    );
    expect(allowedOrigin("http://127.0.0.1:3000", "http://localhost:5175")).toBe(
      "http://127.0.0.1:3000"
    );
    expect(allowedOrigin("https://sendtally.com", "http://localhost:5175")).toBeNull();
  });

  it("pins the configured origin everywhere else", () => {
    expect(allowedOrigin("https://sendtally.com", "https://sendtally.com")).toBe(
      "https://sendtally.com"
    );
    expect(allowedOrigin("http://localhost:5174", "https://sendtally.com")).toBeNull();
    expect(allowedOrigin("https://evil.example", "https://sendtally.com")).toBeNull();
  });
});
