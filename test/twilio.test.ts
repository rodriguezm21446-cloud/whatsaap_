import { describe, expect, it } from "vitest";
import { verifyTwilioSignature } from "../src/integrations/twilio/security.ts";
import { replyToSandboxText, toTwiml } from "../src/integrations/twilio/twiml.ts";

describe("Twilio WhatsApp Sandbox", () => {
  it("accepts Twilio's published HMAC-SHA1 test vector", async () => {
    const params = new URLSearchParams({
      CallSid: "CA1234567890ABCDE",
      Caller: "+14158675310",
      Digits: "1234",
      From: "+14158675310",
      To: "+18005551212"
    });
    await expect(
      verifyTwilioSignature(
        "https://example.com/myapp.php?foo=1&bar=2",
        params,
        "L/OH5YylLD5NRKLltdqwSvS0BnU=",
        "12345"
      )
    ).resolves.toBe(true);
  });

  it("rejects an invalid signature", async () => {
    await expect(
      verifyTwilioSignature(
        "https://example.com/webhooks/twilio",
        new URLSearchParams({ Body: "hola" }),
        "firma-falsa",
        "secreto"
      )
    ).resolves.toBe(false);
  });

  it("turns WhatsApp buttons into sandbox text commands", () => {
    expect(
      replyToSandboxText({
        text: "¿Qué deseas consultar?",
        buttons: [
          { id: "show_price", title: "Costo" },
          { id: "show_specs", title: "Detalles" },
          { id: "continue_purchase", title: "Comprar" }
        ]
      })
    ).toContain("Responde: COSTO | DETALLES | COMPRAR");
  });

  it("escapes untrusted text in TwiML", () => {
    expect(toTwiml({ text: "A&B <prueba>" })).toContain("A&amp;B &lt;prueba&gt;");
  });
});
