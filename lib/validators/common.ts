import { z } from "zod";

import { PHONE_COUNTRY_CODES } from "@/types/auth";

export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id");

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

/** Email from a form: strips ALL whitespace, lowercases, then validates. */
export const emailInputSchema = z
  .string()
  .transform((v) => v.replace(/\s+/g, "").toLowerCase())
  .pipe(z.string().min(1, "Email is required").email("Enter a valid email address").max(254));

/**
 *  mobile number from a form. Strips spaces/dashes and any leading
 * `0` / `+91` / `91`, then requires exactly 10 digits starting 6-9.
 * Output is the bare 10 digits (prefix `+91` when building an API payload).
 */
export const indianMobileSchema = z
  .string()
  .transform((v) => {
    let d = v.replace(/\D/g, "");
    if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
    if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
    return d;
  })
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));

export const passwordSchema = z.string().min(5, "Password must be at least 5 characters").max(200);

/** Country code + bare 10-digit number, as sent by / stored for a user. */
export const phoneSchema = z.object({
  countryCode: z.enum(PHONE_COUNTRY_CODES),
  number: indianMobileSchema,
});
export type PhoneInput = z.infer<typeof phoneSchema>;

export const listQuerySchema = z.object({
  // Cursor pagination: `cursor` is the last id from the previous page.
  cursor: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(120).optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;
