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

import {
  ACTIVITY_LOG_CATEGORIES,
  ACTIVITY_LOG_TYPES,
  type ActivityLogCategory,
  type ActivityLogType,
} from "@/types/activity-log";
import { buildSearchKeyword } from "@/lib/models/searchable";

const TTL_SECONDS = 60 * 60 * 24 * 365; // 12 months

export interface ActivityLogDoc {
  _id: Types.ObjectId;
  type: ActivityLogType;
  category: ActivityLogCategory;
  adminId: Types.ObjectId;
  adminName: string;
  adminEmail: string;
  adminMobile: string;
  // Human-readable summary, e.g. `updated user details of "Jane Doe"`.
  message: string;
  searchKeyword: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityLogHydrated = HydratedDocument<ActivityLogDoc>;
export type ActivityLogModel = Model<ActivityLogDoc>;

const activityLogSchema = new Schema<ActivityLogDoc, ActivityLogModel>(
  {
    type: { type: String, enum: ACTIVITY_LOG_TYPES, required: true },
    category: { type: String, enum: ACTIVITY_LOG_CATEGORIES, required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    adminName: { type: String, required: true, trim: true, maxlength: 160 },
    adminEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    adminMobile: { type: String, required: true, trim: true, maxlength: 20 },
    message: { type: String, required: true, trim: true, maxlength: 300 },
    searchKeyword: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

activityLogSchema.pre("validate", function () {
  this.searchKeyword = buildSearchKeyword([
    this.adminName,
    this.adminEmail,
    this.adminMobile,
    this.message,
  ]);
});

activityLogSchema.index({ searchKeyword: 1 });
activityLogSchema.index({ type: 1 });
activityLogSchema.index({ category: 1 });
activityLogSchema.index({ adminId: 1 });
// Newest-first list + cursor pagination (`createdAt` then `_id` as tiebreaker).
activityLogSchema.index({ createdAt: -1, _id: -1 });
// TTL — must be its own single-field index.
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: TTL_SECONDS });

if (process.env.NODE_ENV !== "production" && models.ActivityLog) deleteModel("ActivityLog");

export const ActivityLog: ActivityLogModel =
  (models.ActivityLog as ActivityLogModel) ??
  model<ActivityLogDoc, ActivityLogModel>("ActivityLog", activityLogSchema);
