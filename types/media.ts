export const MEDIA_FILE_TYPES = ["image", "video", "document"] as const;
export type MediaFileType = (typeof MEDIA_FILE_TYPES)[number];

// An image reference embedded in another model (category, …).
export interface EmbeddedMediaDTO {
  id: string;
  key: string;
  url: string;
}

export interface MediaDTO {
  id: string;
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  fileType: MediaFileType;
  tags: string[];
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}
