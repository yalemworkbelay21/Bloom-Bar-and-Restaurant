const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const upload  = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadToGridFS,
  findFileInGridFS,
  openDownloadStream,
  deleteFromGridFS,
  getNotFoundSvg,
} = require('../services/gridfsService');

const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure local uploads directory exists for fallback caching
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    console.warn('[UPLOAD] Could not create local uploads folder:', err.message);
  }
}

// ── POST /api/upload — upload one or more files (stored permanently in MongoDB GridFS) ──
router.post('/', protect, upload.array('files', 5), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded.' });
  }

  // Derive public baseUrl respecting reverse proxies (Aletcloud, Render, Heroku, Cloudflare)
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : (req.secure ? 'https' : req.protocol);
  const host = req.get('host');
  const baseUrl = (process.env.PUBLIC_URL || `${protocol}://${host}`).replace(/\/+$/, '');

  const uploaded = [];

  for (const f of req.files) {
    try {
      const ext = path.extname(f.originalname).toLowerCase();
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `receipt-${uniqueSuffix}${ext}`;

      // 1. Permanently store in MongoDB Atlas GridFS
      await uploadToGridFS(filename, f.buffer, f.mimetype, f.originalname);

      // 2. Optionally write to local disk as a read-through cache
      try {
        const localPath = path.join(uploadsDir, filename);
        fs.writeFileSync(localPath, f.buffer);
      } catch (diskErr) {
        // Disk write failure is non-fatal since MongoDB is the primary source of truth
        console.warn(`[UPLOAD] Local cache write failed for ${filename}:`, diskErr.message);
      }

      uploaded.push({
        url:        `${baseUrl}/api/upload/${filename}`,
        name:       f.originalname,
        mimeType:   f.mimetype,
        size:       f.size,
        uploadedAt: new Date(),
      });
    } catch (uploadErr) {
      console.error(`[UPLOAD] Error storing file ${f.originalname}:`, uploadErr);
      return res.status(500).json({
        message: `Failed to save ${f.originalname} to database: ${uploadErr.message}`,
      });
    }
  }

  res.status(201).json({ files: uploaded });
});

// ── GET /api/upload/:filename — serve a stored file from MongoDB GridFS or local disk ──
router.get('/:filename', async (req, res) => {
  const { filename } = req.params;

  try {
    // 1. Try finding in MongoDB GridFS first (primary permanent cloud storage)
    const fileDoc = await findFileInGridFS(filename);
    if (fileDoc) {
      const mime = fileDoc.contentType || fileDoc.metadata?.mimetype || 'application/octet-stream';
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Length', fileDoc.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Accept-Ranges', 'bytes');

      const downloadStream = openDownloadStream(filename);
      downloadStream.on('error', (streamErr) => {
        console.error(`[GRIDFS] Stream error for ${filename}:`, streamErr.message);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file.' });
        }
      });
      return downloadStream.pipe(res);
    }

    // 2. Fallback to local disk (in case it was uploaded locally before or cached)
    const localFilePath = path.join(uploadsDir, filename);
    if (fs.existsSync(localFilePath)) {
      // Stream file to client
      res.sendFile(localFilePath);

      // Asynchronously upload to GridFS so it's permanently stored in MongoDB
      try {
        const buffer = fs.readFileSync(localFilePath);
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.pdf': 'application/pdf',
        };
        const mime = mimeTypes[ext] || 'application/octet-stream';
        uploadToGridFS(filename, buffer, mime, filename).catch((syncErr) => {
          console.warn(`[UPLOAD] Auto-sync to GridFS failed for ${filename}:`, syncErr.message);
        });
      } catch (readErr) {
        console.warn(`[UPLOAD] Could not read local file ${filename} for sync:`, readErr.message);
      }
      return;
    }

    // 3. File not found anywhere
    // If request accepts image or filename ends with an image extension, return SVG placeholder
    const isImageReq = /\.(png|jpe?g|gif|webp|svg)$/i.test(filename) ||
                       (req.headers.accept && req.headers.accept.includes('image/'));

    if (isImageReq && !req.headers.accept?.includes('application/json')) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(getNotFoundSvg(filename));
    }

    return res.status(404).json({
      message: 'File not found.',
      filename,
      hint: 'This file may have been uploaded on an older server session prior to persistent cloud storage. Please edit the expense and re-upload the receipt.',
    });
  } catch (err) {
    console.error(`[UPLOAD] Error retrieving ${filename}:`, err.message);
    res.status(500).json({ message: 'Error retrieving file.', error: err.message });
  }
});

// ── DELETE /api/upload/:filename — delete a stored file from GridFS and local disk ──
router.delete('/:filename', protect, async (req, res) => {
  const { filename } = req.params;
  try {
    // Delete from MongoDB GridFS
    await deleteFromGridFS(filename);

    // Also delete from local disk if present
    const localFilePath = path.join(uploadsDir, filename);
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (unlinkErr) {
        console.warn(`[UPLOAD] Could not unlink ${filename}:`, unlinkErr.message);
      }
    }

    res.json({ message: 'File deleted.' });
  } catch (err) {
    console.error(`[UPLOAD] Error deleting ${filename}:`, err.message);
    res.status(500).json({ message: 'Error deleting file.', error: err.message });
  }
});

module.exports = router;
