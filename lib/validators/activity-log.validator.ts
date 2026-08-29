import { z } from "zod";

import { listQuerySchema } from "@/lib/validators/common";
import { ACTIVITY_LOG_CATEGORIES, ACTIVITY_LOG_TYPES } from "@/types/activity-log";

export const listActivityLogsQuerySchema = listQuerySchema.extend({
  type: z.enum(ACTIVITY_LOG_TYPES).optional(),
  category: z.enum(ACTIVITY_LOG_CATEGORIES).optional(),
});
export type ListActivityLogsQuery = z.infer<typeof listActivityLogsQuerySchema>;
