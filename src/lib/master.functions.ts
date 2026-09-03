import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MasterRateStore } from "@/services/providers/MasterRateStore";

/**
 * Returns the worker-side MasterRateMap snapshot so the browser can hydrate
 * its own localStorage cache. This is the only path the UI uses to read
 * cached/reference prices when the active provider doesn't quote a corridor.
 */
export const getMasterRateState = createServerFn({ method: "GET" }).handler(async () => {
  return {
    master: MasterRateStore.getMaster(),
    missing: MasterRateStore.getMissing(),
  };
});

const reportSchema = z.object({
  from: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/i),
  to: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/i),
});

/**
 * Append a missing corridor to the MissingCorridorsLog (crowdsourced
 * discovery). The UI calls this when the user clicks "Request this route".
 */
export const reportMissingCorridor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => reportSchema.parse(input))
  .handler(async ({ data }) => {
    const entry = MasterRateStore.logMissing(data.from, data.to);
    return { ok: true as const, entry };
  });
