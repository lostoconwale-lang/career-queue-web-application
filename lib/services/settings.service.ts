import "server-only";

import { mediaUrl } from "@/lib/media";
import { Settings, SETTINGS_KEY, type SettingsHydrated } from "@/lib/models/settings.model";
import type { EmbeddedMedia } from "@/lib/models/embedded-media";
import type { UpdateSettingsBody } from "@/lib/validators/settings.validator";
import type { SettingsDTO } from "@/types/settings";

function embeddedMediaDTO(m: EmbeddedMedia | null) {
  return m ? { id: m._id.toString(), key: m.key, url: mediaUrl(m.key) } : null;
}

function toSettingsDTO(s: SettingsHydrated): SettingsDTO {
  return {
    siteName: s.siteName,
    tagline: s.tagline,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    logoLight: embeddedMediaDTO(s.logoLight),
    logoDark: embeddedMediaDTO(s.logoDark),
    notificationEmails: [...s.notificationEmails],
    seo: {
      metaTitle: s.seo.metaTitle,
      metaDescription: s.seo.metaDescription,
      metaKeywords: [...s.seo.metaKeywords],
      ogImage: embeddedMediaDTO(s.seo.ogImage),
    },
    socialLinks: s.socialLinks.map((l) => ({ platform: l.platform, url: l.url })),
    updatedAt: s.updatedAt.toISOString(),
  };
}

// Load the singleton, creating it on first access.
async function loadOrCreate(): Promise<SettingsHydrated> {
  // Atomic upsert so concurrent first-time reads can't race to create two rows.
  const doc = await Settings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $setOnInsert: { key: SETTINGS_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (!doc) throw new Error("Failed to load settings");
  return doc;
}

export async function getSettings(): Promise<SettingsDTO> {
  return toSettingsDTO(await loadOrCreate());
}

export async function updateSettings(body: UpdateSettingsBody): Promise<SettingsDTO> {
  const doc = await loadOrCreate();

  doc.siteName = body.siteName;
  doc.tagline = body.tagline;
  doc.contactEmail = body.contactEmail;
  doc.contactPhone = body.contactPhone;
  doc.set("logoLight", body.logoLight);
  doc.set("logoDark", body.logoDark);
  doc.notificationEmails = body.notificationEmails;

  doc.seo.metaTitle = body.seo.metaTitle;
  doc.seo.metaDescription = body.seo.metaDescription;
  doc.seo.metaKeywords = body.seo.metaKeywords;
  doc.set("seo.ogImage", body.seo.ogImage);

  doc.socialLinks = body.socialLinks;

  await doc.save();
  return toSettingsDTO(doc);
}
