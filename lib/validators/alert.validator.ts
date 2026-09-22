import { z } from "zod";

import { ALERT_TYPES } from "@/types/alert";
import { listQuerySchema } from "@/lib/validators/common";

export const listAlertsQuerySchema = listQuerySchema.extend({
  type: z.enum(ALERT_TYPES).optional(),
  read: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});
export type ListAlertsQuery = z.infer<typeof listAlertsQuerySchema>;

export const updateAlertBodySchema = z.object({ read: z.boolean() });
export type UpdateAlertBody = z.infer<typeof updateAlertBodySchema>;
