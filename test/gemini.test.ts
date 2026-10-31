import { describe, expect, it, vi } from "vitest";
import { GeminiProductAssistant } from "../src/ai/gemini.ts";

const createAssistant = (fetchFn: typeof fetch) =>
  new GeminiProductAssistant({
    apiKey: "test-key",
    model: "gemini-test",
    fetchFn
  });

describe("GeminiProductAssistant", () => {
  it("acepta solamente una salida JSON validada", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    response_key: "PAYMENT",
                    opener: "NEUTRAL"
                  })
                }
              ]
            }
          }
        ]
      })
    );

    const result = await createAssistant(fetchFn).classify("¿Cómo pago?");
    expect(result).toEqual({ response_key: "PAYMENT", opener: "NEUTRAL" });
  });

  it("no envía más de 1000 caracteres de la pregunta", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    response_key: "SPECIFICATIONS",
                    opener: "NEUTRAL"
                  })
                }
              ]
            }
          }
        ]
      })
    );

    await createAssistant(fetchFn).classify("x".repeat(2_000));
    const request = JSON.parse(String(fetchFn.mock.calls[0]?.[1]?.body));
    const prompt = request.contents[0].parts[0].text as string;
    expect(prompt).not.toContain("x".repeat(1_001));
  });

  it("rechaza estructuras inesperadas", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ candidates: [{ content: { parts: [{ text: "{}" }] } }] }));

    await expect(createAssistant(fetchFn).classify("pregunta")).rejects.toThrow();
  });
});
