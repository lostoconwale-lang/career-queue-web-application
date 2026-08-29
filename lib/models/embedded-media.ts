import "server-only";
import { Schema, type Types } from "mongoose";

// A reference to an uploaded file (see media.model), embedded in other models.
// Keeps its own _id. Attach with `image: { type: embeddedMediaSchema, default: null }`.
export interface EmbeddedMedia {
  _id: Types.ObjectId;
  key: string;
}

export const embeddedMediaSchema = new Schema<EmbeddedMedia>({
  key: { type: String, required: true, trim: true },
});
