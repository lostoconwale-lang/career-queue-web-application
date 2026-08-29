import type { AccountStatus, Phone, RegistrationType } from "@/types/auth";

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  phone: Phone | null;
  status: AccountStatus;
  registrationType: RegistrationType;
  adminVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
