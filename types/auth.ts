export const PRINCIPALS = ["user", "admin"] as const;
export type Principal = (typeof PRINCIPALS)[number];

export const ACCOUNT_STATUSES = ["active", "suspended"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

// How the account was created. `manual` = public sign-up, `admin` = created by an
// admin, `google` = first Google sign-in.
export const REGISTRATION_TYPES = ["manual", "admin", "google"] as const;
export type RegistrationType = (typeof REGISTRATION_TYPES)[number];

// Known dialling codes. Only these can be stored (enforced by the Mongoose enum).
export const PHONE_COUNTRY_CODES = ["+91"] as const;
export type PhoneCountryCode = (typeof PHONE_COUNTRY_CODES)[number];

// Country code + bare national number. Stored on both users and admins.
export interface Phone {
  countryCode: PhoneCountryCode;
  number: string;
}

export interface AccessClaims {
  sub: string;
  kind: Principal;
  typ: "access";
}

export interface RefreshClaims {
  sub: string;
  kind: Principal;
  typ: "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** Resolved identity for the current request. */
export interface AuthContext {
  id: string;
  kind: Principal;
  via: "bearer" | "session";
}
