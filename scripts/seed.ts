// Creates a first admin account. Run: pnpm seed
import { connectToDatabase, mongoose } from "@/lib/db/mongoose";
import { Admin } from "@/lib/models/admin.model";
import { User } from "@/lib/models/user.model";
import { buildSearchKeyword } from "@/lib/models/searchable";
import { hashPassword } from "@/lib/auth/password";

const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345";
const NAME = process.env.SEED_ADMIN_NAME ?? "Platform Admin";
const MOBILE = process.env.SEED_ADMIN_MOBILE ?? "9000000000";

async function main(): Promise<void> {
  await connectToDatabase();
  // Grandfather accounts created before the verification fields existed.
  await User.updateMany({ adminVerified: { $exists: false } }, { $set: { adminVerified: true } });
  await Admin.updateMany(
    { adminApproved: { $exists: false } },
    { $set: { adminApproved: true, isActive: true } },
  );
  await Admin.findOneAndUpdate(
    { email: EMAIL.toLowerCase() },
    {
      $set: {
        name: NAME,
        phone: { countryCode: "+91", number: MOBILE },
        passwordHash: await hashPassword(PASSWORD),
        adminApproved: true,
        isActive: true,
        // findOneAndUpdate skips the pre('validate') hook, so set it here.
        searchKeyword: buildSearchKeyword([EMAIL, NAME, MOBILE]),
      },
    },
    { upsert: true },
  );

  // Rebuild searchKeyword on every doc (re-saving triggers the pre-validate hook).
  for (const doc of await User.find()) await doc.save();
  for (const doc of await Admin.find()) await doc.save();

  // Reconcile indexes last (adds the searchKeyword index; users phone index is partial).
  await User.syncIndexes();
  await Admin.syncIndexes();
  console.warn(`Seeded admin: ${EMAIL} / ${PASSWORD}`);
  await mongoose.disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
