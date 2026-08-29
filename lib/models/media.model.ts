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

import { buildSearchKeyword } from "@/lib/models/searchable";
import { MEDIA_FILE_TYPES, type MediaFileType } from "@/types/media";

export interface MediaDoc {
  _id: Types.ObjectId;
  // Storage key / path in the bucket — the canonical reference to the file.
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  fileType: MediaFileType;
  // Lowercase, de-duped labels the admin attaches. Also feed searchKeyword.
  tags: string[];
  // Id of the admin or user who uploaded it.
  uploadedBy: string;
  searchKeyword: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MediaHydrated = HydratedDocument<MediaDoc>;
export type MediaModel = Model<MediaDoc>;

const mediaSchema = new Schema<MediaDoc, MediaModel>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, lowercase: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    fileType: { type: String, enum: MEDIA_FILE_TYPES, required: true },
    tags: { type: [String], default: [] },
    uploadedBy: { type: String, required: true, trim: true },
    searchKeyword: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

mediaSchema.pre("validate", function () {
  this.tags = [
    ...new Set(this.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
  ].slice(0, 15);
  this.searchKeyword = buildSearchKeyword([this.originalName, ...this.tags]);
});

mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ fileType: 1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ searchKeyword: 1 });
// Newest-first list + cursor pagination.
mediaSchema.index({ createdAt: -1, _id: -1 });

if (process.env.NODE_ENV !== "production" && models.Media) deleteModel("Media");

export const Media: MediaModel =
  (models.Media as MediaModel) ?? model<MediaDoc, MediaModel>("Media", mediaSchema);
