import { z } from "zod";

export const telegramUpdateSchema = z.object({
  callback_query: z
    .object({
      id: z.string(),
      from: z.object({ id: z.number() }),
      data: z.string().optional()
    })
    .optional()
});

