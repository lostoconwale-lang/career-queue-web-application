import { z } from "zod";

import { listQuerySchema } from "@/lib/validators/common";

const companyNameSchema = z
  .string()
  .trim()
  .min(2, "Enter the company name")
  .max(160, "Name is too long")
  .regex(/\p{L}/u, "Enter a valid company name");

const companyDescriptionSchema = z.string().trim().max(2000, "Description is too long");

const companyWebsiteSchema = z
  .string()
  .trim()
  .max(300, "Website URL is too long")
  .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), "Enter a valid website URL")
  .default("");

// An embedded logo reference — just the storage key, or null to clear it.
const logoSchema = z.object({ key: z.string().trim().min(1).max(300) }).nullable();

const boolFlag = z.enum(["true", "false"]).transform((v) => v === "true");

// POST /api/v1/companies
export const createCompanyBodySchema = z.object({
  name: companyNameSchema,
  description: companyDescriptionSchema.default(""),
  website: companyWebsiteSchema,
  logo: logoSchema.optional(),
});
export type CreateCompanyBody = z.infer<typeof createCompanyBodySchema>;

// PUT /api/v1/companies/:id — edit name, description, website, logo and/or active state.
export const updateCompanyBodySchema = z
  .object({
    name: companyNameSchema,
    description: companyDescriptionSchema,
    website: companyWebsiteSchema,
    logo: logoSchema,
    isActive: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });
export type UpdateCompanyBody = z.infer<typeof updateCompanyBodySchema>;

export const listCompaniesQuerySchema = listQuerySchema.extend({
  isActive: boolFlag.optional(),
});
export type ListCompaniesQuery = z.infer<typeof listCompaniesQuerySchema>;
