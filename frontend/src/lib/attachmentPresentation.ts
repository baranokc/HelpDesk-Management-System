import type { TicketAttachmentDto } from "@/src/types/ticket-attachment";

export type AttachmentKind =
  | "image"
  | "pdf"
  | "archive"
  | "word"
  | "spreadsheet"
  | "text"
  | "file";

export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex < 0 || lastDotIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

export function getAttachmentKind(
  attachment: TicketAttachmentDto,
): AttachmentKind {
  const extension = getFileExtension(attachment.fileName);

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
    return "image";
  }

  if (extension === "pdf") return "pdf";
  if (["zip", "rar", "7z"].includes(extension)) return "archive";
  if (["doc", "docx"].includes(extension)) return "word";
  if (["xls", "xlsx", "csv"].includes(extension)) return "spreadsheet";
  if (["txt", "log"].includes(extension)) return "text";

  if (attachment.contentType.startsWith("image/")) return "image";
  if (attachment.contentType === "application/pdf") return "pdf";

  return "file";
}

export function formatAttachmentFileSize(fileSize: number): string {
  if (fileSize < 1024) return `${fileSize} B`;

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

export function getPreviewContentType(
  attachment: TicketAttachmentDto,
  kind: AttachmentKind,
): string {
  if (kind === "pdf") return "application/pdf";

  const extension = getFileExtension(attachment.fileName);

  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "gif") return "image/gif";
  if (extension === "webp") return "image/webp";

  return attachment.contentType || "application/octet-stream";
}
