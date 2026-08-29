import type { DefaultSession } from "next-auth";

import type { Principal } from "@/types/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      kind: Principal;
      needsPhone?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    kind: Principal;
    needsPhone?: boolean;
  }
}
