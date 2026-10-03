export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const acceptedTypes = new Set<string>(ACCEPTED_IMAGE_TYPES);

export function validateImageFile(file: File): string | null {
  if (!acceptedTypes.has(file.type.toLowerCase())) {
    return "Choose a JPEG, PNG, or WEBP image.";
  }

  if (file.size === 0) {
    return "This file is empty. Choose another image.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "This image is larger than 8 MiB. Choose a smaller file.";
  }

  return null;
}

