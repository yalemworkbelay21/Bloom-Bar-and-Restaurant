const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');

const BUCKET_NAME = 'uploads';

/**
 * Returns the GridFSBucket instance bound to the current mongoose connection.
 */
function getBucket() {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Cannot access GridFS.');
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: BUCKET_NAME,
  });
}

/**
 * Uploads a buffer to MongoDB GridFS.
 *
 * @param {string} filename - Unique filename (e.g. receipt-123456.png)
 * @param {Buffer} buffer - File data buffer
 * @param {string} mimetype - Content type
 * @param {string} originalname - Original file name
 * @returns {Promise<object>} Uploaded GridFS file document
 */
function uploadToGridFS(filename, buffer, mimetype = 'application/octet-stream', originalname = '') {
  return new Promise((resolve, reject) => {
    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype,
      metadata: {
        originalname: originalname || filename,
        mimetype,
        size: buffer.length,
        uploadedAt: new Date(),
      },
    });

    uploadStream.on('finish', () => resolve({
      _id: uploadStream.id,
      filename,
      length: buffer.length,
      contentType: mimetype,
    }));
    uploadStream.on('error', (err) => reject(err));
    uploadStream.end(buffer);
  });
}

/**
 * Looks up a file by filename in GridFS.
 * Returns the most recent file doc, or null if not found.
 */
async function findFileInGridFS(filename) {
  try {
    const bucket = getBucket();
    const files = await bucket.find({ filename }).sort({ uploadDate: -1 }).limit(1).toArray();
    return files.length > 0 ? files[0] : null;
  } catch (err) {
    console.error(`[GRIDFS] Error querying ${filename}:`, err.message);
    return null;
  }
}

/**
 * Opens a download stream for a file by its filename.
 */
function openDownloadStream(filename) {
  const bucket = getBucket();
  return bucket.openDownloadStreamByName(filename);
}

/**
 * Deletes all GridFS records and chunks matching a filename.
 */
async function deleteFromGridFS(filename) {
  try {
    const bucket = getBucket();
    const files = await bucket.find({ filename }).toArray();
    for (const f of files) {
      await bucket.delete(f._id);
    }
    return files.length;
  } catch (err) {
    console.error(`[GRIDFS] Error deleting ${filename}:`, err.message);
    return 0;
  }
}

/**
 * Automatically migrates existing local files from server/uploads into GridFS
 * if they are not already stored there. Runs once on startup.
 */
async function migrateLocalUploads() {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) return;

    const files = fs.readdirSync(uploadsDir);
    if (!files || files.length === 0) return;

    const bucket = getBucket();
    let migratedCount = 0;

    for (const file of files) {
      if (file === '.gitkeep' || file.startsWith('.')) continue;

      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      // Check if already in GridFS
      const existing = await bucket.find({ filename: file }).limit(1).toArray();
      if (existing.length === 0) {
        try {
          const buffer = fs.readFileSync(filePath);
          const ext = path.extname(file).toLowerCase();
          const mimeTypes = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
          };
          const mimetype = mimeTypes[ext] || 'application/octet-stream';

          await uploadToGridFS(file, buffer, mimetype, file);
          migratedCount++;
          console.log(`[GRIDFS MIGRATION] Uploaded local file ${file} (${(buffer.length / 1024).toFixed(1)} KB) to MongoDB Atlas.`);
        } catch (uploadErr) {
          console.warn(`[GRIDFS MIGRATION] Failed to migrate ${file}:`, uploadErr.message);
        }
      }
    }

    if (migratedCount > 0) {
      console.log(`[GRIDFS MIGRATION] Successfully backed up ${migratedCount} local file(s) to MongoDB Atlas!`);
    }
  } catch (err) {
    console.warn('[GRIDFS MIGRATION] Migration check warning:', err.message);
  }
}

/**
 * Returns a clean, user-friendly SVG placeholder image when a requested receipt
 * was stored only on an older ephemeral container before the persistent storage update.
 */
function getNotFoundSvg(filename = '') {
  const safeFilename = String(filename).replace(/[<>&"]/g, '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="480" height="260">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" rx="16" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="6,4"/>
  <g transform="translate(240, 75)" text-anchor="middle">
    <!-- Document icon with exclamation mark -->
    <rect x="-24" y="-32" width="48" height="64" rx="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
    <path d="M -12 -16 L 12 -16 M -12 -6 L 12 -6 M -12 4 L 4 4" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
    <circle cx="14" cy="20" r="14" fill="#ef4444"/>
    <text x="14" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">!</text>
  </g>
  <text x="240" y="152" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#1e293b" text-anchor="middle">
    Receipt Image Unavailable
  </text>
  <text x="240" y="174" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">
    This file was uploaded on an older server session
  </text>
  <text x="240" y="196" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#2563eb" text-anchor="middle">
    Please edit the record and re-attach the receipt to save permanently
  </text>
  <text x="240" y="235" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">
    ${safeFilename}
  </text>
</svg>`;
}

module.exports = {
  getBucket,
  uploadToGridFS,
  findFileInGridFS,
  openDownloadStream,
  deleteFromGridFS,
  migrateLocalUploads,
  getNotFoundSvg,
};
