import "server-only";
import { Types } from "mongoose";

import { cursorPage } from "@/lib/api/response";
import { ActivityLog, type ActivityLogHydrated } from "@/lib/models/activity-log.model";
import { Admin } from "@/lib/models/admin.model";
import { normalizeSearchText } from "@/lib/models/searchable";
import type { UpdateAdminBody } from "@/lib/validators/admin.validator";
import type { ListActivityLogsQuery } from "@/lib/validators/activity-log.validator";
import type { UpdateCategoryBody } from "@/lib/validators/category.validator";
import type { UpdateCityBody } from "@/lib/validators/city.validator";
import type { UpdateCompanyBody } from "@/lib/validators/company.validator";
import type { UpdateFaqBody } from "@/lib/validators/faq.validator";
import type { UpdateJobApplicationBody } from "@/lib/validators/job-application.validator";
import type { UpdateJobTypeBody } from "@/lib/validators/job-type.validator";
import type { UpdateJobBody } from "@/lib/validators/job.validator";
import type { UpdateStaticPageBody } from "@/lib/validators/static-pages.validator";
import type { UpdateTestimonialBody } from "@/lib/validators/testimonial.validator";
import type { UpdateUserBody } from "@/lib/validators/user.validator";
import type { ActivityLogCategory, ActivityLogDTO, ActivityLogType } from "@/types/activity-log";
import type { CursorPage } from "@/types/api";
import type { AdminDTO } from "@/types/admin";
import type { CategoryDTO } from "@/types/category";
import type { CityDTO } from "@/types/city";
import type { CompanyDTO } from "@/types/company";
import type { FaqDTO } from "@/types/faq";
import type { JobApplicationDTO } from "@/types/job-application";
import type { JobTypeDTO } from "@/types/job-type";
import type { JobDTO } from "@/types/job";
import type { MediaDTO } from "@/types/media";
import type { StaticPageDTO } from "@/types/static-page";
import type { TestimonialDTO } from "@/types/testimonial";
import type { UserDTO } from "@/types/user";

export type ActivityActor = { id: string; name: string; email: string; mobile: string };

async function write(
  type: ActivityLogType,
  category: ActivityLogCategory,
  actor: ActivityActor,
  message: string,
): Promise<void> {
  try {
    await ActivityLog.create({
      type,
      category,
      adminId: actor.id,
      adminName: actor.name,
      adminEmail: actor.email,
      adminMobile: actor.mobile,
      message,
    });
  } catch (error) {
    console.error("[activity-log] write failed:", error);
  }
}

// The acting admin's identity for a log entry, from their id.
export async function activityActor(adminId: string): Promise<ActivityActor> {
  const doc = await Admin.findById(adminId).select("name email phone");
  return {
    id: adminId,
    name: doc?.name ?? "Unknown admin",
    email: doc?.email ?? "—",
    mobile: doc?.phone ? `${doc.phone.countryCode} ${doc.phone.number}` : "—",
  };
}

const who = (p: { name: string; email: string }) => `${p.name} (${p.email})`;

const withPhone = (p: {
  name: string;
  email: string;
  phone: { countryCode: string; number: string } | null;
}) => (p.phone ? `${who(p)}, ${p.phone.countryCode} ${p.phone.number}` : who(p));

export function logAdminLogin(actor: ActivityActor): Promise<void> {
  return write("auth", "create", actor, "Logged in to the admin panel");
}

export function logAdminLogout(actor: ActivityActor): Promise<void> {
  return write("auth", "delete", actor, "Logged out of the admin panel");
}

export function logAdminCreated(actor: ActivityActor, admin: AdminDTO): Promise<void> {
  return write(
    "admin",
    "create",
    actor,
    `Created a new admin account — ${withPhone(admin)}, approved and active`,
  );
}

export function logAdminPasswordSet(actor: ActivityActor, admin: AdminDTO): Promise<void> {
  return write("admin", "update", actor, `Changed the password for admin ${who(admin)}`);
}

export function logAdminRegistered(admin: AdminDTO): Promise<void> {
  return write(
    "admin",
    "create",
    {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      mobile: `${admin.phone.countryCode} ${admin.phone.number}`,
    },
    `Registered a new admin account — ${withPhone(admin)}, pending approval`,
  );
}

export function logUserCreated(actor: ActivityActor, user: UserDTO): Promise<void> {
  return write("user", "create", actor, `Created user account — ${withPhone(user)}`);
}

export function logUserUpdated(
  actor: ActivityActor,
  user: UserDTO,
  patch: UpdateUserBody,
): Promise<void> {
  return write("user", "update", actor, userChangeMessage(user, patch));
}

export function logUserDeleted(actor: ActivityActor, user: UserDTO): Promise<void> {
  return write("user", "delete", actor, `Deleted user account — ${who(user)}`);
}

export function logUserPasswordSet(actor: ActivityActor, user: UserDTO): Promise<void> {
  return write("user", "update", actor, `Changed the password for user ${who(user)}`);
}

export function logAdminUpdated(
  actor: ActivityActor,
  admin: AdminDTO,
  patch: UpdateAdminBody,
): Promise<void> {
  return write("admin", "update", actor, adminChangeMessage(admin, patch));
}

function userChangeMessage(user: UserDTO, patch: UpdateUserBody): string {
  if (patch.adminVerified === true && patch.status === "active")
    return `Approved user ${who(user)}`;
  if (patch.adminVerified === false && patch.status === "suspended")
    return `Rejected user ${who(user)}`;
  if (patch.status === "suspended") return `Deactivated user ${who(user)}`;
  if (patch.status === "active") return `Reactivated user ${who(user)}`;
  return `Updated user ${who(user)} — changed ${Object.keys(patch).join(", ")}`;
}

function adminChangeMessage(admin: AdminDTO, patch: UpdateAdminBody): string {
  if (patch.adminApproved === true) return `Approved admin ${who(admin)}`;
  if (patch.adminApproved === false) return `Rejected admin ${who(admin)}`;
  if (patch.isActive === false) return `Deactivated admin ${who(admin)}`;
  if (patch.isActive === true) return `Reactivated admin ${who(admin)}`;
  return `Updated admin ${who(admin)}`;
}

export function logCityCreated(actor: ActivityActor, city: CityDTO): Promise<void> {
  return write("city", "create", actor, `Added the city "${city.name}"`);
}

export function logCityUpdated(
  actor: ActivityActor,
  city: CityDTO,
  patch: UpdateCityBody,
): Promise<void> {
  return write("city", "update", actor, cityChangeMessage(city, patch));
}

export function logCityDeleted(actor: ActivityActor, city: CityDTO): Promise<void> {
  return write("city", "delete", actor, `Deleted the city "${city.name}"`);
}

function cityChangeMessage(city: CityDTO, patch: UpdateCityBody): string {
  if (patch.isActive === false) return `Turned off the city "${city.name}"`;
  if (patch.isActive === true) return `Turned on the city "${city.name}"`;
  if (patch.name !== undefined) return `Renamed a city to "${city.name}"`;
  if (patch.seo !== undefined) return `Updated SEO details for the city "${city.name}"`;
  return `Updated the city "${city.name}"`;
}

export function logCategoryCreated(actor: ActivityActor, category: CategoryDTO): Promise<void> {
  return write("category", "create", actor, `Added the category "${category.name}"`);
}

export function logCategoryUpdated(
  actor: ActivityActor,
  category: CategoryDTO,
  patch: UpdateCategoryBody,
): Promise<void> {
  return write("category", "update", actor, categoryChangeMessage(category, patch));
}

export function logCategoryDeleted(actor: ActivityActor, category: CategoryDTO): Promise<void> {
  return write("category", "delete", actor, `Deleted the category "${category.name}"`);
}

function categoryChangeMessage(category: CategoryDTO, patch: UpdateCategoryBody): string {
  if (patch.isActive === false) return `Turned off the category "${category.name}"`;
  if (patch.isActive === true) return `Turned on the category "${category.name}"`;
  if (patch.name !== undefined) return `Renamed a category to "${category.name}"`;
  if (patch.description !== undefined)
    return `Updated the description for the category "${category.name}"`;
  if (patch.icon !== undefined)
    return patch.icon
      ? `Set the icon for the category "${category.name}"`
      : `Removed the icon from the category "${category.name}"`;
  if (patch.seo !== undefined) return `Updated SEO details for the category "${category.name}"`;
  return `Updated the category "${category.name}"`;
}

// Applications are created by the applicant, not an admin, so there's no
// logCreated here — only admin-initiated actions (review, soft delete) count
// as activity for this audit trail.
export function logJobApplicationUpdated(
  actor: ActivityActor,
  application: JobApplicationDTO,
  patch: UpdateJobApplicationBody,
): Promise<void> {
  const who_ = `${application.applicant.name} (${application.applicant.email})`;
  const message =
    patch.status !== undefined
      ? `Marked ${who_}'s application for "${application.job.title}" as ${patch.status}`
      : `Updated ${who_}'s application for "${application.job.title}"`;
  return write("job-application", "update", actor, message);
}

export function logJobApplicationDeleted(
  actor: ActivityActor,
  application: JobApplicationDTO,
): Promise<void> {
  return write(
    "job-application",
    "delete",
    actor,
    `Deleted ${application.applicant.name}'s application for "${application.job.title}"`,
  );
}

export function logCompanyCreated(actor: ActivityActor, company: CompanyDTO): Promise<void> {
  return write("company", "create", actor, `Added the company "${company.name}"`);
}

export function logCompanyUpdated(
  actor: ActivityActor,
  company: CompanyDTO,
  patch: UpdateCompanyBody,
): Promise<void> {
  return write("company", "update", actor, companyChangeMessage(company, patch));
}

export function logCompanyDeleted(actor: ActivityActor, company: CompanyDTO): Promise<void> {
  return write("company", "delete", actor, `Deleted the company "${company.name}"`);
}

function companyChangeMessage(company: CompanyDTO, patch: UpdateCompanyBody): string {
  if (patch.isActive === false) return `Turned off the company "${company.name}"`;
  if (patch.isActive === true) return `Turned on the company "${company.name}"`;
  if (patch.name !== undefined) return `Renamed a company to "${company.name}"`;
  if (patch.description !== undefined)
    return `Updated the description for the company "${company.name}"`;
  if (patch.website !== undefined) return `Updated the website for the company "${company.name}"`;
  if (patch.logo !== undefined)
    return patch.logo
      ? `Set the logo for the company "${company.name}"`
      : `Removed the logo from the company "${company.name}"`;
  return `Updated the company "${company.name}"`;
}

export function logJobTypeCreated(actor: ActivityActor, jobType: JobTypeDTO): Promise<void> {
  return write("job-type", "create", actor, `Added the job type "${jobType.name}"`);
}

export function logJobTypeUpdated(
  actor: ActivityActor,
  jobType: JobTypeDTO,
  patch: UpdateJobTypeBody,
): Promise<void> {
  return write("job-type", "update", actor, jobTypeChangeMessage(jobType, patch));
}

export function logJobTypeDeleted(actor: ActivityActor, jobType: JobTypeDTO): Promise<void> {
  return write("job-type", "delete", actor, `Deleted the job type "${jobType.name}"`);
}

function jobTypeChangeMessage(jobType: JobTypeDTO, patch: UpdateJobTypeBody): string {
  if (patch.isActive === false) return `Turned off the job type "${jobType.name}"`;
  if (patch.isActive === true) return `Turned on the job type "${jobType.name}"`;
  if (patch.name !== undefined) return `Renamed a job type to "${jobType.name}"`;
  if (patch.description !== undefined)
    return `Updated the description for the job type "${jobType.name}"`;
  return `Updated the job type "${jobType.name}"`;
}

export function logJobCreated(actor: ActivityActor, job: JobDTO): Promise<void> {
  return write("job", "create", actor, `Added the job "${job.title}"`);
}

export function logJobUpdated(
  actor: ActivityActor,
  job: JobDTO,
  patch: UpdateJobBody,
): Promise<void> {
  return write("job", "update", actor, jobChangeMessage(job, patch));
}

export function logJobDeleted(actor: ActivityActor, job: JobDTO): Promise<void> {
  return write("job", "delete", actor, `Deleted the job "${job.title}"`);
}

function jobChangeMessage(job: JobDTO, patch: UpdateJobBody): string {
  if (patch.isActive === false) return `Turned off the job "${job.title}"`;
  if (patch.isActive === true) return `Turned on the job "${job.title}"`;
  if (patch.title !== undefined) return `Renamed a job to "${job.title}"`;
  if (patch.description !== undefined) return `Updated the description for the job "${job.title}"`;
  if (patch.categoryIds !== undefined) return `Updated the categories for the job "${job.title}"`;
  if (patch.jobTypeIds !== undefined) return `Updated the job types for the job "${job.title}"`;
  if (patch.companyId !== undefined) return `Updated the company for the job "${job.title}"`;
  if (patch.coverImage !== undefined || patch.thumbnail !== undefined)
    return `Updated the images for the job "${job.title}"`;
  if (patch.seo !== undefined) return `Updated SEO details for the job "${job.title}"`;
  return `Updated the job "${job.title}"`;
}

export function logTestimonialCreated(
  actor: ActivityActor,
  testimonial: TestimonialDTO,
): Promise<void> {
  return write(
    "testimonial",
    "create",
    actor,
    `Added a testimonial from "${testimonial.authorName}"`,
  );
}

export function logTestimonialUpdated(
  actor: ActivityActor,
  testimonial: TestimonialDTO,
  patch: UpdateTestimonialBody,
): Promise<void> {
  return write("testimonial", "update", actor, testimonialChangeMessage(testimonial, patch));
}

export function logTestimonialDeleted(
  actor: ActivityActor,
  testimonial: TestimonialDTO,
): Promise<void> {
  return write(
    "testimonial",
    "delete",
    actor,
    `Deleted the testimonial from "${testimonial.authorName}"`,
  );
}

function testimonialChangeMessage(
  testimonial: TestimonialDTO,
  patch: UpdateTestimonialBody,
): string {
  if (patch.isActive === false)
    return `Turned off the testimonial from "${testimonial.authorName}"`;
  if (patch.isActive === true) return `Turned on the testimonial from "${testimonial.authorName}"`;
  return `Updated the testimonial from "${testimonial.authorName}"`;
}

const shortQuestion = (q: string) => (q.length > 60 ? `${q.slice(0, 57)}…` : q);

export function logFaqCreated(actor: ActivityActor, faq: FaqDTO): Promise<void> {
  return write("faq", "create", actor, `Added the FAQ "${shortQuestion(faq.question)}"`);
}

export function logFaqUpdated(
  actor: ActivityActor,
  faq: FaqDTO,
  patch: UpdateFaqBody,
): Promise<void> {
  return write("faq", "update", actor, faqChangeMessage(faq, patch));
}

export function logFaqDeleted(actor: ActivityActor, faq: FaqDTO): Promise<void> {
  return write("faq", "delete", actor, `Deleted the FAQ "${shortQuestion(faq.question)}"`);
}

function faqChangeMessage(faq: FaqDTO, patch: UpdateFaqBody): string {
  const q = shortQuestion(faq.question);
  if (patch.isActive === false) return `Turned off the FAQ "${q}"`;
  if (patch.isActive === true) return `Turned on the FAQ "${q}"`;
  if (patch.sortOrder !== undefined && patch.question === undefined && patch.answer === undefined)
    return `Reordered the FAQ "${q}"`;
  return `Updated the FAQ "${q}"`;
}

export function logStaticPageCreated(actor: ActivityActor, page: StaticPageDTO): Promise<void> {
  return write("static-page", "create", actor, `Added the page "${page.title}" (/${page.slug})`);
}

export function logStaticPageUpdated(
  actor: ActivityActor,
  page: StaticPageDTO,
  patch: UpdateStaticPageBody,
): Promise<void> {
  return write("static-page", "update", actor, staticPageChangeMessage(page, patch));
}

export function logStaticPageDeleted(actor: ActivityActor, page: StaticPageDTO): Promise<void> {
  return write("static-page", "delete", actor, `Deleted the page "${page.title}"`);
}

function staticPageChangeMessage(page: StaticPageDTO, patch: UpdateStaticPageBody): string {
  if (patch.isActive === false) return `Unpublished the page "${page.title}"`;
  if (patch.isActive === true) return `Published the page "${page.title}"`;
  if (patch.slug !== undefined)
    return `Changed the slug for the page "${page.title}" to /${page.slug}`;
  if (patch.title !== undefined) return `Renamed a page to "${page.title}"`;
  if (patch.content !== undefined) return `Updated the content of the page "${page.title}"`;
  if (patch.seo !== undefined) return `Updated SEO details for the page "${page.title}"`;
  return `Updated the page "${page.title}"`;
}

export function logSettingsUpdated(actor: ActivityActor): Promise<void> {
  return write("settings", "update", actor, "Updated the site settings");
}

export function logMediaUploaded(actor: ActivityActor, count: number): Promise<void> {
  const label = count === 1 ? "file" : "files";
  return write("media", "create", actor, `Uploaded ${count} ${label} to the media library`);
}

export function logMediaTagged(actor: ActivityActor, media: MediaDTO): Promise<void> {
  const tags = media.tags.length ? media.tags.map((t) => `"${t}"`).join(", ") : "no tags";
  return write("media", "update", actor, `Set tags on "${media.originalName}" — ${tags}`);
}

export function logMediaDeleted(actor: ActivityActor, media: MediaDTO): Promise<void> {
  return write("media", "delete", actor, `Deleted "${media.originalName}" from the media library`);
}

export function toActivityLogDTO(log: ActivityLogHydrated): ActivityLogDTO {
  return {
    id: log._id.toString(),
    type: log.type,
    category: log.category,
    adminId: log.adminId.toString(),
    adminName: log.adminName,
    adminEmail: log.adminEmail,
    adminMobile: log.adminMobile,
    message: log.message,
    createdAt: log.createdAt.toISOString(),
  };
}

export async function listActivityLogs(
  query: ListActivityLogsQuery,
): Promise<CursorPage<ActivityLogDTO>> {
  const filter: Record<string, unknown> = {};
  if (query.type) filter.type = query.type;
  if (query.category) filter.category = query.category;
  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };
  // Append-only, so `_id` order matches `createdAt` order — the id is the cursor.
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const docs = await ActivityLog.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toActivityLogDTO), query.limit);
}
