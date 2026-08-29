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
  ACCOUNT_STATUSES,
  PHONE_COUNTRY_CODES,
  REGISTRATION_TYPES,
  type AccountStatus,
  type Phone,
  type RegistrationType,
} from "@/types/auth";
import { buildSearchKeyword } from "@/lib/models/searchable";

export interface UserDoc {
  _id: Types.ObjectId;
  name: string;
  email: string;
  // Absent for Google accounts until they finish the phone step.
  phone?: Phone;
  // Absent for Google accounts.
  passwordHash?: string;
  status: AccountStatus;
  registrationType: RegistrationType;
  // An admin must approve every account before it can sign in.
  adminVerified: boolean;
  // Lowercase "email name mobile" — the only field admin list search queries.
  searchKeyword: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserHydrated = HydratedDocument<UserDoc>;
export type UserModel = Model<UserDoc>;

const userSchema = new Schema<UserDoc, UserModel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: {
      // Optional as a whole (Google accounts start without it); when present,
      // both parts are set together by the service layer.
      countryCode: { type: String, enum: PHONE_COUNTRY_CODES },
      number: { type: String, match: [/^[6-9]\d{9}$/, "Invalid mobile number"] },
    },
    passwordHash: { type: String, select: false },
    status: { type: String, enum: ACCOUNT_STATUSES, required: true, default: "active" },
    registrationType: {
      type: String,
      enum: REGISTRATION_TYPES,
      required: true,
      default: "manual",
    },
    adminVerified: { type: Boolean, required: true, default: false },
    searchKeyword: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

// Keep `searchKeyword` derived from the searchable fields (runs before validation
// so `required` is satisfied on create).
userSchema.pre("validate", function () {
  this.searchKeyword = buildSearchKeyword([this.email, this.name, this.phone?.number]);
});

// One account per email; also the lookup used on every login.
userSchema.index({ email: 1 }, { unique: true });
// One account per mobile number — partial so phone-less Google accounts don't
// collide on a null key.
userSchema.index(
  { "phone.countryCode": 1, "phone.number": 1 },
  { unique: true, partialFilterExpression: { "phone.number": { $type: "string" } } },
);
// Admin list paginates newest-first by `_id` (cursor pagination) — the default
// `_id` index covers it, so no extra index is needed here.
// Admin list search runs `{ searchKeyword: /q/ }`.
userSchema.index({ searchKeyword: 1 });

// In dev, drop the cached model on hot-reload so schema edits take effect
// without restarting the server. In prod the module evaluates once.
if (process.env.NODE_ENV !== "production" && models.User) deleteModel("User");

export const User: UserModel =
  (models.User as UserModel) ?? model<UserDoc, UserModel>("User", userSchema);
