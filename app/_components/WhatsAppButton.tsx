import { WhatsApp } from "@/app/_components/Icons";
import { listPublicSettings } from "@/lib/services/public-settings.service";

export default async function WhatsAppButton() {
  const { whatsappNumber, whatsappMessage, whatsappEnabled } = await listPublicSettings();
  const digits = whatsappNumber.replace(/\D/g, "");
  if (!whatsappEnabled || !digits) return null;

  const href = whatsappMessage
    ? `https://wa.me/${digits}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/${digits}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-soft transition-transform hover:-translate-y-0.5"
    >
      <WhatsApp className="h-7 w-7" />
    </a>
  );
}
