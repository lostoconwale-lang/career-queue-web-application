import "server-only";

import { mediaUrl } from "@/lib/media";
import {
  HowItWorks,
  HOW_IT_WORKS_KEY,
  type HowItWorksHydrated,
  type HowItWorksStep,
} from "@/lib/models/how-it-works.model";
import type { UpdateHowItWorksBody } from "@/lib/validators/how-it-works.validator";
import type { HowItWorksDTO, HowItWorksStepDTO } from "@/types/how-it-works";

function toStepDTO(s: HowItWorksStep): HowItWorksStepDTO {
  return {
    word: s.word,
    image: { id: s.image._id.toString(), key: s.image.key, url: mediaUrl(s.image.key) },
    title: s.title,
    body: s.body,
    isActive: s.isActive,
  };
}

function toHowItWorksDTO(h: HowItWorksHydrated): HowItWorksDTO {
  return {
    eyebrow: h.eyebrow,
    subtext: h.subtext,
    steps: h.steps.map(toStepDTO),
    updatedAt: h.updatedAt.toISOString(),
  };
}

// Load the singleton, creating it (with its default copy) on first access.
async function loadOrCreate(): Promise<HowItWorksHydrated> {
  // Atomic upsert so concurrent first-time reads can't race to create two rows.
  const doc = await HowItWorks.findOneAndUpdate(
    { key: HOW_IT_WORKS_KEY },
    { $setOnInsert: { key: HOW_IT_WORKS_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (!doc) throw new Error("Failed to load the how-it-works content");
  return doc;
}

export async function getHowItWorks(): Promise<HowItWorksDTO> {
  return toHowItWorksDTO(await loadOrCreate());
}

export async function updateHowItWorks(body: UpdateHowItWorksBody): Promise<HowItWorksDTO> {
  const doc = await loadOrCreate();

  doc.eyebrow = body.eyebrow;
  doc.subtext = body.subtext;
  doc.set("steps", body.steps);

  await doc.save();
  return toHowItWorksDTO(doc);
}
