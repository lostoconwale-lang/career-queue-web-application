import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/nextauth";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/models/user.model";
import { PhoneStep } from "./PhoneStep";

export const runtime = "nodejs";

// Step 2 of Google sign-up. Returning users (phone already set) skip straight through.
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectToDatabase();
  const user = await User.findById(session.user.id).select("phone");
  if (!user) redirect("/login");
  if (user.phone?.number) redirect("/");

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
        One last <span className="text-brand font-light italic">step</span>
      </h1>
      <p className="text-muted mt-3">Add your mobile number to finish setting up your account.</p>

      <PhoneStep />
    </div>
  );
}
