import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";

import { connectToDatabase } from "@/lib/db/mongoose";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { Settings, SETTINGS_KEY } from "@/lib/models/settings.model";
import type { PublicSettingsDTO } from "@/types/public-settings";

// The settings fields shown to visitors (e.g. the WhatsApp button in the
// header). Rendered on every page but only changes when an admin edits the
// settings, so the query is wrapped in Next's data cache — `revalidatePublicSettings()`
// clears it on any settings write.
async function queryPublicSettings(): Promise<PublicSettingsDTO> {
  await connectToDatabase();
  const doc = await Settings.findOne({ key: SETTINGS_KEY }).select(
    "whatsappNumber whatsappMessage whatsappEnabled",
  );
  return {
    whatsappNumber: doc?.whatsappNumber ?? "",
    whatsappMessage: doc?.whatsappMessage ?? "",
    whatsappEnabled: doc?.whatsappEnabled ?? true,
  };
}

export const listPublicSettings = unstable_cache(queryPublicSettings, ["public-settings"], {
  tags: [CACHE_TAGS.publicSettings],
  // Fallback for out-of-band changes (seed scripts, direct DB edits) that don't
  // go through the API and so never call revalidatePublicSettings().
  revalidate: 3600,
});

export function revalidatePublicSettings(): void {
  revalidateTag(CACHE_TAGS.publicSettings, "max");
}
