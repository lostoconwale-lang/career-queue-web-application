import type { SocialLink } from "@/types/settings";

// The subset of site settings shown to visitors, e.g. the header's WhatsApp
// link, the site logo (an icon plus the site name as text), and default SEO.
export interface PublicSettingsDTO {
  siteName: string;
  tagline: string;
  whatsappNumber: string;
  whatsappMessage: string;
  whatsappEnabled: boolean;
  iconLightUrl: string | null;
  iconDarkUrl: string | null;
  faviconUrl: string | null;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
  socialLinks: SocialLink[];
}
