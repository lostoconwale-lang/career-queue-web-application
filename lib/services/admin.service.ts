import "server-only";
import { Types } from "mongoose";

import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "@/lib/api/errors";
import { cursorPage } from "@/lib/api/response";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { issueTokenPair } from "@/lib/auth/jwt";
import { Admin, type AdminHydrated } from "@/lib/models/admin.model";
import { Category } from "@/lib/models/category.model";
import { User } from "@/lib/models/user.model";
import { normalizeSearchText } from "@/lib/models/searchable";
import type {
  AdminLoginBody,
  AdminRegisterBody,
  CreateAdminBody,
  ListAdminsQuery,
  UpdateAdminBody,
} from "@/lib/validators/admin.validator";
import type { CursorPage } from "@/types/api";
import type { TokenPair } from "@/types/auth";
import type { AdminDTO, AdminOverview } from "@/types/admin";

export function toAdminDTO(a: AdminHydrated): AdminDTO {
  return {
    id: a._id.toString(),
    name: a.name,
    email: a.email,
    phone: { countryCode: a.phone.countryCode, number: a.phone.number },
    adminApproved: a.adminApproved,
    isActive: a.isActive,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

// Public sign-up. The account cannot log in until an existing admin approves it.
export async function registerAdmin(body: AdminRegisterBody): Promise<{ admin: AdminDTO }> {
  if (await Admin.exists({ email: body.email })) {
    throw new ConflictError("An admin with this email already exists");
  }
  if (await Admin.exists({ "phone.number": body.phone.number })) {
    throw new ConflictError("An admin with this mobile number already exists");
  }
  const doc = await Admin.create({
    name: body.name,
    email: body.email,
    phone: body.phone,
    passwordHash: await hashPassword(body.password),
    adminApproved: false,
    isActive: true,
  });
  return { admin: toAdminDTO(doc) };
}

// An existing admin creates another admin — ready to sign in right away.
export async function createAdmin(body: CreateAdminBody): Promise<AdminDTO> {
  if (await Admin.exists({ email: body.email })) {
    throw new ConflictError("An admin with this email already exists");
  }
  if (await Admin.exists({ "phone.number": body.phone.number })) {
    throw new ConflictError("An admin with this mobile number already exists");
  }
  const doc = await Admin.create({
    name: body.name,
    email: body.email,
    phone: body.phone,
    passwordHash: await hashPassword(body.password),
    adminApproved: true,
    isActive: true,
  });
  return toAdminDTO(doc);
}

// Admin credential check — used by /api/v1/admin/login AND the NextAuth
// "admin-login" provider. Only approved, active admins pass.
export async function verifyAdminLogin(
  body: AdminLoginBody,
): Promise<{ id: string; email: string; name: string }> {
  const admin = await Admin.findOne({ email: body.email }).select("+passwordHash");
  if (!admin) throw new UnauthorizedError("Invalid email or password");

  const ok = await verifyPassword(body.password, admin.passwordHash);
  if (!ok) throw new UnauthorizedError("Invalid email or password");
  if (!admin.adminApproved) throw new ForbiddenError("Your admin account is awaiting approval");
  if (!admin.isActive) throw new ForbiddenError("This admin account has been deactivated");

  return { id: admin._id.toString(), email: admin.email, name: admin.name };
}

export async function loginAdmin(
  body: AdminLoginBody,
): Promise<{ identity: { id: string; email: string; name: string }; tokens: TokenPair }> {
  const identity = await verifyAdminLogin(body);
  return { identity, tokens: await issueTokenPair(identity.id, "admin") };
}

// Still-valid check for refresh-token rotation.
export async function adminSessionValid(id: string): Promise<boolean> {
  const admin = await Admin.findById(id).select("adminApproved isActive");
  return !!admin && admin.adminApproved && admin.isActive;
}

// Dashboard summary for the signed-in admin.
export async function adminOverview(adminId: string): Promise<AdminOverview> {
  const [admin, userTotal, userPending, adminTotal, adminPending, categoryTotal, categoryInactive] =
    await Promise.all([
      Admin.findById(adminId).select("name email"),
      User.countDocuments({}),
      User.countDocuments({ adminVerified: false }),
      Admin.countDocuments({}),
      Admin.countDocuments({ adminApproved: false }),
      Category.countDocuments({ isDeleted: false }),
      Category.countDocuments({ isDeleted: false, isActive: false }),
    ]);
  if (!admin) throw new NotFoundError("Admin");

  return {
    admin: { id: admin._id.toString(), name: admin.name, email: admin.email },
    users: { total: userTotal, pendingApproval: userPending },
    admins: { total: adminTotal, pendingApproval: adminPending },
    categories: { total: categoryTotal, inactive: categoryInactive },
  };
}

export async function getAdminById(id: string): Promise<AdminDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Admin");
  const doc = await Admin.findById(id);
  if (!doc) throw new NotFoundError("Admin");
  return toAdminDTO(doc);
}

export async function listAdmins(query: ListAdminsQuery): Promise<CursorPage<AdminDTO>> {
  const filter: Record<string, unknown> = {};
  if (query.adminApproved !== undefined) filter.adminApproved = query.adminApproved;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  // Search hits the single indexed `searchKeyword` field only (email + name + mobile),
  // normalised the same way it's stored so the regex needs no `i` flag.
  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const docs = await Admin.find(filter)
    .sort({ _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toAdminDTO), query.limit);
}

export async function updateAdmin(id: string, patch: UpdateAdminBody): Promise<AdminDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Admin");
  const doc = await Admin.findById(id);
  if (!doc) throw new NotFoundError("Admin");

  if (patch.adminApproved !== undefined) doc.adminApproved = patch.adminApproved;
  if (patch.isActive !== undefined) doc.isActive = patch.isActive;

  await doc.save();
  return toAdminDTO(doc);
}

export async function setAdminPassword(id: string, password: string): Promise<AdminDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Admin");
  const doc = await Admin.findById(id);
  if (!doc) throw new NotFoundError("Admin");

  doc.passwordHash = await hashPassword(password);
  await doc.save();
  return toAdminDTO(doc);
}
