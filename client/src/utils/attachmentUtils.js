/**
 * Utility functions for handling file attachments and receipts across
 * various deployment environments (Aletcloud, Render, localhost, custom domains).
 */

/**
 * Normalizes an attachment or receipt URL so it reliably loads everywhere:
 * - Rewrites stored absolute URLs pointing to `/api/upload/:filename` so they use
 *   the current site origin (or relative path), avoiding cross-domain / localhost / mixed-content bugs.
 * - Upgrades any http:// links to https:// when viewing over a secure HTTPS connection.
 *
 * @param {string} url - Stored URL from backend or database
 * @returns {string} Normalized accessible URL
 */
export function formatAttachmentUrl(url) {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URLs and Blobs can be used directly
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // If the URL contains /api/upload/:filename, convert to relative /api/upload/:filename
  // so the browser automatically queries the current host & protocol.
  const uploadMatch = trimmed.match(/\/api\/upload\/[^?#]+/);
  if (uploadMatch) {
    return uploadMatch[0];
  }

  // Upgrade http to https when on secure page
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && trimmed.startsWith('http://')) {
    return trimmed.replace(/^http:\/\//i, 'https://');
  }

  return trimmed;
}

/**
 * Checks whether the attachment is an image based on URL extension or mimeType.
 */
export function isImageAttachment(url = '', mimeType = '') {
  if (mimeType && mimeType.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(url);
}

/**
 * Checks whether the attachment is a PDF document based on URL extension or mimeType.
 */
export function isPdfAttachment(url = '', mimeType = '') {
  if (mimeType === 'application/pdf') return true;
  return /\.pdf(\?.*)?$/i.test(url);
}

