import "server-only";
import { Resend } from "resend";

import { env } from "@/config/env";

// One client for the whole app — Resend's SDK is a thin fetch wrapper, safe
// to reuse across requests.
export const resend = new Resend(env.RESEND_API_KEY);
