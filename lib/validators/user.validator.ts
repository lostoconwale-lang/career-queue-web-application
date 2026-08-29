import { z } from "zod";

import { ACCOUNT_STATUSES, PHONE_COUNTRY_CODES } from "@/types/auth";
import {
  emailInputSchema,
  emailSchema,
  indianMobileSchema,
  listQuerySchema,
  phoneSchema,
} from "@/lib/validators/common";

// Copy this file as the template for a new resource.

const nonEmpty = (v: Record<string, unknown>) => Object.keys(v).length > 0;
const nonEmptyMsg = { message: "Provide at least one field to update" };

// Stricter rules for a user account an admin creates from inside the panel.
const newUserName = z
  .string()
  .trim()
  .min(2, "Enter the user's full name")
  .max(120, "Name is too long")
  .regex(/\p{L}/u, "Enter a valid name");
const newUserPassword = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(200)
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

// POST /api/v1/users — an admin creates a website user (auto-verified + active).
export const createUserBodySchema = z.object({
  name: newUserName,
  email: emailSchema,
  password: newUserPassword,
  phone: phoneSchema,
  status: z.enum(ACCOUNT_STATUSES).default("active"),
});
export type CreateUserBody = z.infer<typeof createUserBodySchema>;

// The "New user" modal collects flat fields and shapes them into the body.
export const createUserFormSchema = z
  .object({
    name: newUserName,
    email: emailInputSchema,
    mobile: indianMobileSchema,
    password: newUserPassword,
  })
  .transform((v) => ({
    name: v.name,
    email: v.email,
    phone: { countryCode: PHONE_COUNTRY_CODES[0], number: v.mobile },
    password: v.password,
  }));

// PUT /api/v1/users/:id/password — an admin sets a new password for a user.
export const setUserPasswordBodySchema = z.object({ password: newUserPassword });
export type SetUserPasswordBody = z.infer<typeof setUserPasswordBodySchema>;

// The "Set password" modal — new password + a confirmation that must match.
export const setUserPasswordFormSchema = z
  .object({ password: newUserPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  })
  .transform((v) => ({ password: v.password }));

// Fields a user may change on their own record.
const selfFields = z.object({
  name: z.string().trim().min(1).max(120),
  phone: phoneSchema,
  email: emailSchema,
});

// Superset an admin may change.
const adminFields = selfFields.extend({
  status: z.enum(ACCOUNT_STATUSES),
  adminVerified: z.boolean(),
});

export const updateSelfBodySchema = selfFields.partial().refine(nonEmpty, nonEmptyMsg);
export type UpdateSelfBody = z.infer<typeof updateSelfBodySchema>;

export const updateUserBodySchema = adminFields.partial().refine(nonEmpty, nonEmptyMsg);
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;

export const listUsersQuerySchema = listQuerySchema.extend({
  status: z.enum(ACCOUNT_STATUSES).optional(),
  adminVerified: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
