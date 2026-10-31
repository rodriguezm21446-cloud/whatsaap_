import { describe, expect, it } from "vitest";
import { BodyTooLargeError, readTextBody } from "../src/http/body.ts";

describe("webhook body limits", () => {
  it("reads a small body", async () => {
    const request = new Request("https://example.test", { method: "POST", body: "hola" });
    await expect(readTextBody(request, 10)).resolves.toBe("hola");
  });

  it("rejects a declared oversized body", async () => {
    const request = new Request("https://example.test", {
      method: "POST",
      headers: { "content-length": "100" },
      body: "hola"
    });
    await expect(readTextBody(request, 10)).rejects.toBeInstanceOf(BodyTooLargeError);
  });

  it("rejects an oversized streamed body", async () => {
    const request = new Request("https://example.test", {
      method: "POST",
      body: "demasiado largo"
    });
    await expect(readTextBody(request, 5)).rejects.toBeInstanceOf(BodyTooLargeError);
  });
});
