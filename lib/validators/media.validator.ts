import { z } from "zod";

import { listQuerySchema } from "@/lib/validators/common";
import { MEDIA_FILE_TYPES } from "@/types/media";

const tagsSchema = z.array(z.string().trim().min(1).max(30)).max(15);

export const listMediaQuerySchema = listQuerySchema.extend({
  fileType: z.enum(MEDIA_FILE_TYPES).optional(),
  tag: z.string().trim().toLowerCase().min(1).max(30).optional(),
});
export type ListMediaQuery = z.infer<typeof listMediaQuerySchema>;

export const updateMediaBodySchema = z.object({ tags: tagsSchema });
export type UpdateMediaBody = z.infer<typeof updateMediaBodySchema>;
