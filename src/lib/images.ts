export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function imageProblem(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) return `${file.name}: formato não suportado (use JPEG, PNG ou WebP).`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: excede o limite de 5 MB.`;
  return null;
}
