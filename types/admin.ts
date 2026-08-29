import type { Phone } from "@/types/auth";

export interface AdminDTO {
  id: string;
  name: string;
  email: string;
  phone: Phone;
  adminApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// GET /api/v1/admin/overview — dashboard summary for the signed-in admin.
export interface AdminOverview {
  admin: { id: string; name: string; email: string };
  users: { total: number; pendingApproval: number };
  admins: { total: number; pendingApproval: number };
  categories: { total: number; inactive: number };
}
