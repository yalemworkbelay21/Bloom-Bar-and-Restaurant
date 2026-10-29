const multer = require('multer');
const path   = require('path');

// ── Memory storage ─────────────────────────────────────────────────────
// Uses memoryStorage so incoming file buffers can be uploaded directly to
// MongoDB Atlas GridFS. This guarantees files are permanently preserved
// across container restarts, deploys, and server reboots on cloud platforms.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf|webp/i;
  const ext     = path.extname(file.originalname).toLowerCase().slice(1);
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpg, png, gif, webp) and PDF files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

module.exports = upload;
