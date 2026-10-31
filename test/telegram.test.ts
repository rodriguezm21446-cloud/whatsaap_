import { afterEach, describe, expect, it, vi } from "vitest";
import { TelegramClient } from "../src/integrations/telegram/client.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("control independiente desde Telegram", () => {
  it("crea botones para pausar y reactivar una sola conversación", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const telegram = new TelegramClient("token-prueba", "chat-prueba");
    await telegram.sendChatControl("conversation-123", "Nuevo chat");

    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const buttons = request.reply_markup.inline_keyboard[0];
    expect(buttons.map((button: { callback_data: string }) => button.callback_data)).toEqual([
      "pause:conversation-123",
      "resume:conversation-123"
    ]);
    expect(request.protect_content).toBe(true);
  });
});
