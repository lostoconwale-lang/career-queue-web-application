import "server-only";
import {
  Schema,
  deleteModel,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";

import { ALERT_TYPES, type AlertType } from "@/types/alert";

export interface AlertDoc {
  _id: Types.ObjectId;
  type: AlertType;
  message: string;
  // Denormalized at write time (same pattern as ActivityLog's admin snapshot)
  // so the alert still reads correctly if the user is later renamed/deleted.
  userId?: Types.ObjectId;
  userName: string;
  userEmail: string;
  read: boolean;
  // Who marked it read, and when — cleared if it's flipped back to unread.
  readByAdminId?: Types.ObjectId;
  readByAdminName?: string;
  readByAdminEmail?: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AlertHydrated = HydratedDocument<AlertDoc>;
export type AlertModel = Model<AlertDoc>;

const alertSchema = new Schema<AlertDoc, AlertModel>(
  {
    type: { type: String, enum: ALERT_TYPES, required: true },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    read: { type: Boolean, required: true, default: false },
    readByAdminId: { type: Schema.Types.ObjectId, ref: "Admin" },
    readByAdminName: { type: String },
    readByAdminEmail: { type: String },
    readAt: { type: Date },
  },
  { timestamps: true },
);

alertSchema.index({ type: 1 });
alertSchema.index({ read: 1 });
// Cursor pagination, newest first — same shape as ActivityLog's list index.
alertSchema.index({ createdAt: -1, _id: -1 });

// In dev, drop the cached model on hot-reload so schema edits take effect
// without restarting the server. In prod the module evaluates once.
if (process.env.NODE_ENV !== "production" && models.Alert) deleteModel("Alert");

export const Alert: AlertModel =
  (models.Alert as AlertModel) ?? model<AlertDoc, AlertModel>("Alert", alertSchema);
