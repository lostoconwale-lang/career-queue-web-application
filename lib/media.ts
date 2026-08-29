import { env } from "@/config/env";

// Turn a stored media key into its public URL. Safe on server and client.
export function mediaUrl(key: string | null | undefined): string {
  if (!key) return "";
  return `${env.NEXT_PUBLIC_MEDIA_BASE_URL}/${key.replace(/^\/+/, "")}`;
}
