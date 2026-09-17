// The subset of site settings shown to visitors, e.g. the header's WhatsApp link.
export interface PublicSettingsDTO {
  whatsappNumber: string;
  whatsappMessage: string;
  whatsappEnabled: boolean;
}
