import { z } from "zod";

import { PHONE_COUNTRY_CODES } from "@/types/auth";
import {
  emailInputSchema,
  emailSchema,
  indianMobileSchema,
  listQuerySchema,
  passwordSchema,
  phoneSchema,
} from "@/lib/validators/common";

const nameSchema = z.string().trim().min(1, "Name is required").max(120);
const formPassword = z.string().trim().min(5, "Password must be at least 5 characters");
const boolFlag = z.enum(["true", "false"]).transform((v) => v === "true");

// Stricter rules for admin accounts created from inside the panel.
const adminNameSchema = z
  .string()
  .trim()
  .min(2, "Enter the admin's full name")
  .max(120, "Name is too long")
  .regex(/\p{L}/u, "Enter a valid name");
const adminPasswordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(200)
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

const nonEmpty = (v: Record<string, unknown>) => Object.keys(v).length > 0;
const nonEmptyMsg = { message: "Provide at least one field to update" };

// POST /api/v1/admin/register — public self-registration (starts unapproved).
export const adminRegisterBodySchema = z.object({
  name: nameSchema,
  email: emailInputSchema,
  phone: phoneSchema,
  password: passwordSchema,
});
export type AdminRegisterBody = z.infer<typeof adminRegisterBodySchema>;

// POST /api/v1/admin — an admin creates another admin (auto-approved + active).
export const createAdminBodySchema = z.object({
  name: adminNameSchema,
  email: emailInputSchema,
  phone: phoneSchema,
  password: adminPasswordSchema,
});
export type CreateAdminBody = z.infer<typeof createAdminBodySchema>;

// The "New admin" modal collects flat fields and shapes them into the body.
export const createAdminFormSchema = z
  .object({
    name: adminNameSchema,
    email: emailInputSchema,
    mobile: indianMobileSchema,
    password: adminPasswordSchema,
  })
  .transform((v): CreateAdminBody => ({
    name: v.name,
    email: v.email,
    phone: { countryCode: PHONE_COUNTRY_CODES[0], number: v.mobile },
    password: v.password,
  }));

// The register form collects flat fields and shapes them into the request body.
export const adminRegisterFormSchema = z
  .object({
    name: nameSchema,
    email: emailInputSchema,
    mobile: indianMobileSchema,
    password: formPassword,
  })
  .transform((v): AdminRegisterBody => ({
    name: v.name,
    email: v.email,
    phone: { countryCode: PHONE_COUNTRY_CODES[0], number: v.mobile },
    password: v.password,
  }));

// PUT /api/v1/admin/:id/password — an admin sets a new password for an admin.
export const setAdminPasswordBodySchema = z.object({ password: adminPasswordSchema });
export type SetAdminPasswordBody = z.infer<typeof setAdminPasswordBodySchema>;

// The "Set password" modal — new password + a confirmation that must match.
export const setAdminPasswordFormSchema = z
  .object({ password: adminPasswordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  })
  .transform((v) => ({ password: v.password }));

// POST /api/v1/admin/login
export const adminLoginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type AdminLoginBody = z.infer<typeof adminLoginBodySchema>;

// PATCH /api/v1/admin/:id — approve and/or (de)activate.
export const updateAdminBodySchema = z
  .object({ adminApproved: z.boolean(), isActive: z.boolean() })
  .partial()
  .refine(nonEmpty, nonEmptyMsg);
export type UpdateAdminBody = z.infer<typeof updateAdminBodySchema>;

export const listAdminsQuerySchema = listQuerySchema.extend({
  adminApproved: boolFlag.optional(),
  isActive: boolFlag.optional(),
});
export type ListAdminsQuery = z.infer<typeof listAdminsQuerySchema>;
