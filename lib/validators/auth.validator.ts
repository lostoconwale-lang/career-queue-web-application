import { z } from "zod";

import { PHONE_COUNTRY_CODES } from "@/types/auth";
import {
  emailInputSchema,
  emailSchema,
  indianMobileSchema,
  passwordSchema,
  phoneSchema,
} from "@/lib/validators/common";

const nameSchema = z.string().trim().min(1, "Name is required").max(120);
const formPassword = z.string().trim().min(5, "Password must be at least 5 characters");

/* ----------------------------- register ---------------------------------- */

// Body accepted by POST /api/v1/auth/register.
export const registerBodySchema = z.object({
  name: nameSchema,
  email: emailInputSchema,
  phone: phoneSchema,
  password: passwordSchema,
});
export type RegisterBody = z.infer<typeof registerBodySchema>;

// The register form collects flat fields; it validates + shapes them into the
// exact request body. Country code is fixed to +91 on the client.
export const registerFormSchema = z
  .object({
    name: nameSchema,
    email: emailInputSchema,
    mobile: indianMobileSchema,
    password: formPassword,
  })
  .transform((v): RegisterBody => ({
    name: v.name,
    email: v.email,
    phone: { countryCode: PHONE_COUNTRY_CODES[0], number: v.mobile },
    password: v.password,
  }));
export type RegisterFormPayload = z.infer<typeof registerFormSchema>;

/* ------------------------------- login ---------------------------------- */

// User login only. Admins have their own flow (/api/v1/admin/login). Sign in
// with either identifier — exactly one of `email` / `phone` must be present.
export const loginBodySchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((v) => Boolean(v.email) || Boolean(v.phone), {
    message: "Email or mobile number is required",
    path: ["email"],
  });
export type LoginBody = z.infer<typeof loginBodySchema>;

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshBody = z.infer<typeof refreshBodySchema>;

/* --------------------- google onboarding (step 2) ---------------------- */

// Body accepted by POST /api/v1/auth/complete-profile — adds the mobile number
// a Google account was created without.
export const completeProfileBodySchema = z.object({ phone: phoneSchema });
export type CompleteProfileBody = z.infer<typeof completeProfileBodySchema>;

// The onboarding form collects a bare mobile; shape it into the request body.
export const completeProfileFormSchema = z
  .object({ mobile: indianMobileSchema })
  .transform((v): CompleteProfileBody => ({
    phone: { countryCode: PHONE_COUNTRY_CODES[0], number: v.mobile },
  }));

// Login form — sign in with email OR mobile number.
export const loginFormSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("email"), email: emailInputSchema, password: formPassword }),
  z.object({ method: z.literal("mobile"), mobile: indianMobileSchema, password: formPassword }),
]);
export type LoginFormValues = z.infer<typeof loginFormSchema>;

/** Build the request body for POST /api/v1/auth/login from validated form values. */
export function buildLoginPayload(values: LoginFormValues): LoginBody {
  return values.method === "email"
    ? { email: values.email, password: values.password }
    : {
        phone: { countryCode: PHONE_COUNTRY_CODES[0], number: values.mobile },
        password: values.password,
      };
}
