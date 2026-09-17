import "server-only";
import { Types } from "mongoose";

import { BadRequestError } from "@/lib/api/errors";
import { mediaUrl } from "@/lib/media";
import { Hero, HERO_KEY, type HeroHydrated, type HeroJobCard } from "@/lib/models/hero.model";
import { Job } from "@/lib/models/job.model";
import type { UpdateHeroBody } from "@/lib/validators/hero.validator";
import type { HeroDTO, HeroJobCardDTO, HeroJobCardLinkedJob } from "@/types/hero";

async function resolveJobId(jobId: string | null): Promise<Types.ObjectId | null> {
  if (!jobId) return null;
  const exists = await Job.exists({ _id: jobId, isDeleted: false });
  if (!exists) throw new BadRequestError("Selected job no longer exists");
  return new Types.ObjectId(jobId);
}

// Job cards may link to a job — fetch the titles of every linked job in one
// query rather than one lookup per card.
async function loadLinkedJobs(cards: HeroJobCard[]): Promise<Map<string, HeroJobCardLinkedJob>> {
  const jobIds = cards.map((c) => c.jobId).filter((id): id is Types.ObjectId => id !== null);
  if (jobIds.length === 0) return new Map();
  const jobs = await Job.find({ _id: { $in: jobIds } }).select("title");
  return new Map(jobs.map((j) => [j._id.toString(), { id: j._id.toString(), title: j.title }]));
}

function toJobCardDTO(
  c: HeroJobCard,
  linkedJobs: Map<string, HeroJobCardLinkedJob>,
): HeroJobCardDTO {
  return {
    companyName: c.companyName,
    logo: { id: c.logo._id.toString(), key: c.logo.key, url: mediaUrl(c.logo.key) },
    jobTitle: c.jobTitle,
    tags: [...c.tags],
    salary: c.salary,
    isActive: c.isActive,
    linkedJob: c.jobId
      ? linkedJobs.get(c.jobId.toString()) ?? { id: c.jobId.toString(), title: "Deleted job" }
      : null,
  };
}

async function toHeroDTO(h: HeroHydrated): Promise<HeroDTO> {
  const linkedJobs = await loadLinkedJobs(h.jobCards);
  return {
    badgeText: h.badgeText,
    headlineLine1: h.headlineLine1,
    headlineLine2: h.headlineLine2,
    headlineLine3: h.headlineLine3,
    headlineHighlight: h.headlineHighlight,
    subtext: h.subtext,
    trustText: h.trustText,
    quickFilters: [...h.quickFilters],
    jobCards: h.jobCards.map((c) => toJobCardDTO(c, linkedJobs)),
    updatedAt: h.updatedAt.toISOString(),
  };
}

// Load the singleton, creating it (with its default copy) on first access.
async function loadOrCreate(): Promise<HeroHydrated> {
  // Atomic upsert so concurrent first-time reads can't race to create two rows.
  const doc = await Hero.findOneAndUpdate(
    { key: HERO_KEY },
    { $setOnInsert: { key: HERO_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (!doc) throw new Error("Failed to load hero content");
  return doc;
}

export async function getHero(): Promise<HeroDTO> {
  return toHeroDTO(await loadOrCreate());
}

export async function updateHero(body: UpdateHeroBody): Promise<HeroDTO> {
  const doc = await loadOrCreate();

  doc.badgeText = body.badgeText;
  doc.headlineLine1 = body.headlineLine1;
  doc.headlineLine2 = body.headlineLine2;
  doc.headlineLine3 = body.headlineLine3;
  doc.headlineHighlight = body.headlineHighlight;
  doc.subtext = body.subtext;
  doc.trustText = body.trustText;
  doc.quickFilters = body.quickFilters;

  const jobCards = await Promise.all(
    body.jobCards.map(async (c) => ({
      companyName: c.companyName,
      logo: c.logo,
      jobTitle: c.jobTitle,
      tags: c.tags,
      salary: c.salary,
      isActive: c.isActive,
      jobId: await resolveJobId(c.jobId),
    })),
  );
  doc.set("jobCards", jobCards);

  await doc.save();
  return toHeroDTO(doc);
}
