import "server-only";
import { Types } from "mongoose";

import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { cursorPage } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/password";
import { User, type UserHydrated } from "@/lib/models/user.model";
import { normalizeSearchText } from "@/lib/models/searchable";
import type {
  CreateUserBody,
  ListUsersQuery,
  UpdateUserBody,
} from "@/lib/validators/user.validator";
import type { CursorPage } from "@/types/api";
import type { UserDTO } from "@/types/user";

// Reference resource. Copy this pattern for new resources.

export function toUserDTO(u: UserHydrated): UserDTO {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    phone:
      u.phone && u.phone.number
        ? { countryCode: u.phone.countryCode, number: u.phone.number }
        : null,
    status: u.status,
    registrationType: u.registrationType,
    adminVerified: u.adminVerified,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

export async function listUsers(query: ListUsersQuery): Promise<CursorPage<UserDTO>> {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.adminVerified !== undefined) filter.adminVerified = query.adminVerified;
  // Search hits the single indexed `searchKeyword` field only (email + name + mobile),
  // normalised the same way it's stored so the regex needs no `i` flag.
  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };
  // ObjectIds sort by creation time, so `_id` descending is newest-first.
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const docs = await User.find(filter)
    .sort({ _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toUserDTO), query.limit);
}

export async function getUserById(id: string): Promise<UserDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await User.findById(id);
  return doc ? toUserDTO(doc) : null;
}

export async function createUser(body: CreateUserBody): Promise<UserDTO> {
  if (await User.exists({ email: body.email })) {
    throw new ConflictError("An account with this email already exists");
  }
  if (await User.exists({ "phone.number": body.phone.number })) {
    throw new ConflictError("An account with this mobile number already exists");
  }
  const doc = await User.create({
    name: body.name,
    email: body.email,
    phone: body.phone,
    passwordHash: await hashPassword(body.password),
    status: body.status,
    registrationType: "admin",
    adminVerified: true,
  });
  return toUserDTO(doc);
}

export async function updateUser(id: string, patch: UpdateUserBody): Promise<UserDTO> {
  const doc = await User.findById(id);
  if (!doc) throw new NotFoundError("User");

  if (patch.email && patch.email !== doc.email) {
    if (await User.exists({ email: patch.email, _id: { $ne: doc._id } })) {
      throw new ConflictError("That email is already in use");
    }
    doc.email = patch.email;
  }
  if (patch.phone && patch.phone.number !== doc.phone?.number) {
    if (await User.exists({ "phone.number": patch.phone.number, _id: { $ne: doc._id } })) {
      throw new ConflictError("That mobile number is already in use");
    }
  }
  if (patch.name !== undefined) doc.name = patch.name;
  if (patch.phone !== undefined) doc.phone = patch.phone;
  if (patch.status !== undefined) doc.status = patch.status;
  if (patch.adminVerified !== undefined) doc.adminVerified = patch.adminVerified;

  await doc.save();
  return toUserDTO(doc);
}

export async function deleteUser(id: string): Promise<UserDTO> {
  const doc = await User.findByIdAndDelete(id);
  if (!doc) throw new NotFoundError("User");
  return toUserDTO(doc);
}

export async function setUserPassword(id: string, password: string): Promise<UserDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("User");
  const doc = await User.findById(id);
  if (!doc) throw new NotFoundError("User");

  doc.passwordHash = await hashPassword(password);
  await doc.save();
  return toUserDTO(doc);
}
