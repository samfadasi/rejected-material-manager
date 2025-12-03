const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ncrController = require('../controllers/ncrController');
const { verifyToken, requireRole } = require('../middleware/ncrAuth');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ncr-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || 
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, PNG, GIF) and documents (PDF, DOC, DOCX) are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

router.get('/summary', verifyToken, ncrController.getSummary);
router.get('/export/csv', verifyToken, ncrController.exportToCsv);
router.get('/export/excel', verifyToken, ncrController.exportToExcel);

router.post('/', verifyToken, upload.single('attachment'), ncrController.createNcr);
router.get('/', verifyToken, ncrController.getAllNcrs);
router.get('/:id', verifyToken, ncrController.getNcrById);
router.put('/:id', verifyToken, upload.single('attachment'), ncrController.updateNcr);
router.patch('/:id/status', verifyToken, requireRole('ENGINEER', 'MANAGER', 'ADMIN'), ncrController.updateNcrStatus);
router.delete('/:id', verifyToken, requireRole('ADMIN'), ncrController.deleteNcr);

module.exports = router;
