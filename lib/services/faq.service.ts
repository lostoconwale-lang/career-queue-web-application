import "server-only";
import { Types } from "mongoose";

import { NotFoundError } from "@/lib/api/errors";
import { cursorPage } from "@/lib/api/response";
import { normalizeSearchText } from "@/lib/models/searchable";
import { Faq, type FaqHydrated } from "@/lib/models/faq.model";
import type { CreateFaqBody, ListFaqsQuery, UpdateFaqBody } from "@/lib/validators/faq.validator";
import type { CursorPage } from "@/types/api";
import type { FaqDTO } from "@/types/faq";

export function toFaqDTO(f: FaqHydrated): FaqDTO {
  return {
    id: f._id.toString(),
    question: f.question,
    answer: f.answer,
    sortOrder: f.sortOrder,
    isActive: f.isActive,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

export async function getFaqById(id: string): Promise<FaqDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("FAQ");
  const doc = await Faq.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("FAQ");
  return toFaqDTO(doc);
}

// FAQ lists are short, so this returns everything (in display order) rather than
// paginating — `cursorPage` still shapes the response the client expects.
export async function listFaqs(query: ListFaqsQuery): Promise<CursorPage<FaqDTO>> {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };

  const docs = await Faq.find(filter)
    .sort({ sortOrder: 1, _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toFaqDTO), query.limit);
}

export async function createFaq(body: CreateFaqBody): Promise<FaqDTO> {
  const doc = await Faq.create({
    question: body.question,
    answer: body.answer,
    sortOrder: body.sortOrder,
  });
  return toFaqDTO(doc);
}

export async function updateFaq(id: string, patch: UpdateFaqBody): Promise<FaqDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("FAQ");
  const doc = await Faq.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("FAQ");

  if (patch.question !== undefined) doc.question = patch.question;
  if (patch.answer !== undefined) doc.answer = patch.answer;
  if (patch.sortOrder !== undefined) doc.sortOrder = patch.sortOrder;
  if (patch.isActive !== undefined) doc.isActive = patch.isActive;

  await doc.save();
  return toFaqDTO(doc);
}

export async function deleteFaq(id: string): Promise<FaqDTO> {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("FAQ");
  const doc = await Faq.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new NotFoundError("FAQ");

  doc.isDeleted = true;
  doc.isActive = false;
  await doc.save();
  return toFaqDTO(doc);
}
