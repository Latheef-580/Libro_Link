const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure upload directories exist
const imagesDir = path.join(__dirname, '../../frontend/assets/images');
const pdfsDir = path.join(__dirname, '../../frontend/assets');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
if (!fs.existsSync(pdfsDir)) fs.mkdirSync(pdfsDir, { recursive: true });

// Multer storage for images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + Date.now() + ext;
    cb(null, name);
  }
});
const imageUpload = multer({ storage: imageStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Multer storage for PDFs
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, pdfsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + Date.now() + ext;
    cb(null, name);
  }
});
const pdfUpload = multer({ storage: pdfStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/upload/image
router.post('/image', imageUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const relPath = '/assets/images/' + req.file.filename;
  res.json({ path: relPath });
});

// POST /api/upload/pdf
router.post('/pdf', pdfUpload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const relPath = '/assets/' + req.file.filename;
  res.json({ path: relPath });
});

module.exports = router; 