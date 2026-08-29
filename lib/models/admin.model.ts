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

import { PHONE_COUNTRY_CODES, type Phone } from "@/types/auth";
import { buildSearchKeyword } from "@/lib/models/searchable";

export interface AdminDoc {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: Phone;
  passwordHash: string;
  // A registered admin can only sign in once an existing admin approves them.
  adminApproved: boolean;
  // Toggled by an admin to activate / deactivate the account.
  isActive: boolean;
  // Lowercase "email name mobile" — the only field admin list search queries.
  searchKeyword: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AdminHydrated = HydratedDocument<AdminDoc>;
export type AdminModel = Model<AdminDoc>;

const adminSchema = new Schema<AdminDoc, AdminModel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: {
      countryCode: { type: String, enum: PHONE_COUNTRY_CODES, required: true },
      number: { type: String, required: true, match: [/^[6-9]\d{9}$/, "Invalid mobile number"] },
    },
    passwordHash: { type: String, required: true, select: false },
    adminApproved: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    searchKeyword: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

// Keep `searchKeyword` derived from the searchable fields (before validation).
adminSchema.pre("validate", function () {
  this.searchKeyword = buildSearchKeyword([this.email, this.name, this.phone?.number]);
});

// One admin per email; also the login lookup.
adminSchema.index({ email: 1 }, { unique: true });
// One admin per mobile number.
adminSchema.index({ "phone.countryCode": 1, "phone.number": 1 }, { unique: true });
// Admin list search runs `{ searchKeyword: /q/ }`.
adminSchema.index({ searchKeyword: 1 });

// In dev, drop the cached model on hot-reload so schema edits take effect
// without restarting the server. In prod the module evaluates once.
if (process.env.NODE_ENV !== "production" && models.Admin) deleteModel("Admin");

export const Admin: AdminModel =
  (models.Admin as AdminModel) ?? model<AdminDoc, AdminModel>("Admin", adminSchema);
