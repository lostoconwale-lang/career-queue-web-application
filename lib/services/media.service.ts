import "server-only";
import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { ApiError, BadRequestError, NotFoundError } from "@/lib/api/errors";
import { cursorPage } from "@/lib/api/response";
import { env } from "@/config/env";
import { mediaUrl } from "@/lib/media";
import { r2 } from "@/lib/r2";
import { Media, type MediaHydrated } from "@/lib/models/media.model";
import { normalizeSearchText } from "@/lib/models/searchable";
import type { ListMediaQuery } from "@/lib/validators/media.validator";
import type { CursorPage } from "@/types/api";
import type { MediaDTO, MediaFileType } from "@/types/media";

const MAX_FILES = 5;
const MAX_SIZE = 25 * 1024 * 1024;

const ACCEPTED: Record<string, { ext: string; type: MediaFileType }> = {
  "image/jpeg": { ext: "jpg", type: "image" },
  "image/png": { ext: "png", type: "image" },
  "image/webp": { ext: "webp", type: "image" },
  "image/avif": { ext: "avif", type: "image" },
  "image/gif": { ext: "gif", type: "image" },
  "video/mp4": { ext: "mp4", type: "video" },
  "video/webm": { ext: "webm", type: "video" },
  "video/quicktime": { ext: "mov", type: "video" },
  "application/pdf": { ext: "pdf", type: "document" },
  "application/msword": { ext: "doc", type: "document" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    ext: "docx",
    type: "document",
  },
  "application/vnd.ms-excel": { ext: "xls", type: "document" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    ext: "xlsx",
    type: "document",
  },
  "text/csv": { ext: "csv", type: "document" },
};

function toMediaDTO(m: MediaHydrated): MediaDTO {
  return {
    id: m._id.toString(),
    key: m.key,
    url: mediaUrl(m.key),
    originalName: m.originalName,
    mimeType: m.mimeType,
    size: m.size,
    fileType: m.fileType,
    tags: [...m.tags],
    uploadedBy: m.uploadedBy,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

async function removeFromBucket(keys: string[]): Promise<void> {
  try {
    await Promise.all(
      keys.map((Key) => r2.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key }))),
    );
  } catch (error) {
    console.error("[media] R2 delete failed:", error);
  }
}

export async function listMedia(query: ListMediaQuery): Promise<CursorPage<MediaDTO>> {
  const filter: Record<string, unknown> = {};
  if (query.fileType) filter.fileType = query.fileType;
  if (query.tag) filter.tags = query.tag;
  const term = query.q ? normalizeSearchText(query.q) : "";
  if (term) filter.searchKeyword = { $regex: term };
  if (query.cursor) filter._id = { $lt: new Types.ObjectId(query.cursor) };

  const docs = await Media.find(filter)
    .sort({ _id: -1 })
    .limit(query.limit + 1);

  return cursorPage(docs.map(toMediaDTO), query.limit);
}

export async function updateMedia(id: string, tags: string[]): Promise<MediaDTO> {
  const doc = await Media.findById(id);
  if (!doc) throw new NotFoundError("File");
  doc.tags = tags;
  await doc.save();
  return toMediaDTO(doc);
}

export async function deleteMedia(id: string): Promise<MediaDTO> {
  const doc = await Media.findByIdAndDelete(id);
  if (!doc) throw new NotFoundError("File");
  await removeFromBucket([doc.key]);
  return toMediaDTO(doc);
}

export async function uploadFiles(
  files: File[],
  tags: string[],
  uploadedBy: string,
): Promise<MediaDTO[]> {
  if (files.length === 0) throw new BadRequestError("Attach at least one file");
  if (files.length > MAX_FILES) {
    throw new BadRequestError(`Upload at most ${MAX_FILES} files at once`);
  }

  const uploads = files.map((file) => {
    const spec = ACCEPTED[file.type];
    if (!spec) throw new BadRequestError(`Unsupported file type: ${file.type || "unknown"}`);
    if (file.size === 0) throw new BadRequestError(`"${file.name}" is empty`);
    if (file.size > MAX_SIZE) throw new BadRequestError(`"${file.name}" is larger than 25 MB`);
    return { file, type: spec.type, key: `media/${spec.type}s/${randomUUID()}.${spec.ext}` };
  });

  try {
    await Promise.all(
      uploads.map(async ({ file, key }) =>
        r2.send(
          new PutObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: key,
            Body: Buffer.from(await file.arrayBuffer()),
            ContentType: file.type,
            CacheControl: "public, max-age=31536000, immutable",
          }),
        ),
      ),
    );
  } catch (error) {
    console.error("[media] R2 upload failed:", error);
    await removeFromBucket(uploads.map((u) => u.key));
    throw new ApiError(502, "UPLOAD_FAILED", "Could not upload the files. Please try again.");
  }

  try {
    const docs = await Media.insertMany(
      uploads.map(({ file, key, type }) => ({
        key,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        fileType: type,
        tags,
        uploadedBy,
      })),
    );
    return docs.map(toMediaDTO);
  } catch (error) {
    await removeFromBucket(uploads.map((u) => u.key));
    throw error;
  }
}
