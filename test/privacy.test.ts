import { describe, expect, it } from "vitest";

import { maskWhatsappId } from "../src/utils/privacy.ts";

describe("maskWhatsappId", () => {
  it("oculta la mayor parte del número", () => {
    expect(maskWhatsappId("593981234567")).toBe("+593 98 *** **67");
  });
});

