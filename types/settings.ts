import type { EmbeddedMediaDTO } from "@/types/media";

// Social platforms shown in the footer and outgoing emails.
export const SOCIAL_PLATFORMS = ["youtube", "linkedin", "x", "instagram", "facebook"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  youtube: "YouTube",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  instagram: "Instagram",
  facebook: "Facebook",
};

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface SettingsSeo {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogImage: EmbeddedMediaDTO | null;
}

// GET/PUT /api/v1/settings — the single site-wide settings record.
export interface SettingsDTO {
  siteName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  logoLight: EmbeddedMediaDTO | null;
  logoDark: EmbeddedMediaDTO | null;
  notificationEmails: string[];
  seo: SettingsSeo;
  socialLinks: SocialLink[];
  updatedAt: string;
}
