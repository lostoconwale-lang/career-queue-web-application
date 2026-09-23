import "server-only";
import { Types } from "mongoose";

import { NotFoundError } from "@/lib/api/errors";
import { cursorPage } from "@/lib/api/response";
import { Alert, type AlertHydrated } from "@/lib/models/alert.model";
import type { ListAlertsQuery } from "@/lib/validators/alert.validator";
import type { AlertDTO, AlertType } from "@/types/alert";
import type { CursorPage } from "@/types/api";

type AlertUser = { id: string; name: string; email: string };

function toAlertDTO(a: AlertHydrated): AlertDTO {
  return {
    id: a._id.toString(),
    type: a.type,
    message: a.message,
    userId: a.userId ? a.userId.toString() : null,
    userName: a.userName,
    userEmail: a.userEmail,
    read: a.read,
    readBy:
      a.read && a.readByAdminName
        ? { name: a.readByAdminName, email: a.readByAdminEmail ?? "—" }
        : null,
    readAt: a.readAt ? a.readAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  };
}

// Never throws — an alert failing to write must never break the flow that
// triggered it (registration, login, a password reset, a job application).
async function write(type: AlertType, message: string, user: AlertUser): Promise<void> {
  try {
    await Alert.create({ type, message, userId: user.id, userName: user.name, userEmail: user.email });
  } catch (error) {
    console.error("[alert] write failed:", error);
  }
}

export function logUserRegistered(user: AlertUser): Promise<void> {
  return write("user_registered", `${user.name} created an account`, user);
}

export function logPasswordChanged(user: AlertUser): Promise<void> {
  return write("password_changed", `${user.name} changed their password`, user);
}

export function logUserFirstLogin(user: AlertUser): Promise<void> {
  return write("user_login", `${user.name} logged in for the first time`, user);
}

export function logJobApplied(user: AlertUser, jobTitle: string): Promise<void> {
  return write("job_applied", `${user.name} applied to "${jobTitle}"`, user);
}

export async function listAlerts(query: ListAlertsQuery): Promise<CursorPage<AlertDTO>> {
  const filter: Record<string, unknown> = {};
  if (query.type) filter.type = query.type;
  if (query.read !== undefined) filter.read = query.read;
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const docs = await Alert.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toAlertDTO), query.limit);
}

// Powers the sidebar badge and the header bell.
export async function countUnreadAlerts(): Promise<number> {
  return Alert.countDocuments({ read: false });
}

// The header dropdown's preview list — most recent overall, same as most
// notification-bell UIs (not filtered to unread-only).
export async function listRecentAlerts(limit: number): Promise<AlertDTO[]> {
  const docs = await Alert.find()
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit);
  return docs.map(toAlertDTO);
}

export async function markAlertRead(
  id: string,
  read: boolean,
  admin: AlertUser,
): Promise<AlertDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Alert");
  const doc = await Alert.findById(id);
  if (!doc) throw new NotFoundError("Alert");

  doc.read = read;
  if (read) {
    doc.readByAdminId = new Types.ObjectId(admin.id);
    doc.readByAdminName = admin.name;
    doc.readByAdminEmail = admin.email;
    doc.readAt = new Date();
  } else {
    doc.readByAdminId = undefined;
    doc.readByAdminName = undefined;
    doc.readByAdminEmail = undefined;
    doc.readAt = undefined;
  }
  await doc.save();
  return toAlertDTO(doc);
}

export async function markAllAlertsRead(admin: AlertUser): Promise<void> {
  await Alert.updateMany(
    { read: false },
    {
      read: true,
      readByAdminId: new Types.ObjectId(admin.id),
      readByAdminName: admin.name,
      readByAdminEmail: admin.email,
      readAt: new Date(),
    },
  );
}
