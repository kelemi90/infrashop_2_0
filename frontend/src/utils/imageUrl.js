const API_URL = import.meta.env.VITE_API_URL || '';

// Build a full image URL for an image path/filename stored in DB.
// Be defensive: strip common prefixes like `public/images/` or `images/` that
// sometimes end up in the DB so the frontend produces `/images/<filename>`.
export default function buildImageUrl(imagePath) {
  // fallback to no-image when falsy
  if (!imagePath) return API_URL ? `${API_URL}/images/no-image.png` : '/images/no-image.png';

  // already absolute URL -> use as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;

  // normalize common prefixes (handle both forward and back slashes):
  // - public/images/foo.jpg
  // - /public/images/foo.jpg
  // - images/foo.jpg
  // - /images/foo.jpg
  const normalized = imagePath.replace(/^[/\\]?((public[/\\])?images[/\\])/i, '');

  // If the original value started with a slash and looks like a full path
  // (e.g. `/images/foo.jpg`), the normalized value will be the filename.
  // Always construct a path under /images for filenames.
  return API_URL ? `${API_URL}/images/${normalized}` : `/images/${normalized}`;
}
