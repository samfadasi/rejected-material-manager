const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rejectionsController = require('../controllers/rejectionsController');
const RejectionModel = require('../models/rejection');
const { optionalAuthMiddleware } = require('../middleware/auth');
const User = require('../models/User');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('صيغة الملف غير مدعومة'));
    }
  }
});

router.post('/create', optionalAuthMiddleware, upload.array('images', 10), rejectionsController.createRejection);
router.get('/', rejectionsController.getAllRejections);
router.get('/:id', rejectionsController.getRejection);
router.delete('/:id', rejectionsController.deleteRejection);

router.get('/auth/seed-admin', (req, res) => {
  const admin = User.seedAdmin();
  res.status(200).json({
    success: true,
    message: 'Admin user created successfully',
    data: admin
  });
});

router.get('/auth/seed-user', (req, res) => {
  const user = User.create({
    name: 'John Doe',
    email: 'john@rejected-material.local',
    employeeId: 'EMP-0002',
    role: 'user'
  });
  res.status(200).json({
    success: true,
    message: 'Test user created successfully',
    data: user
  });
});

router.get('/users/all', (req, res) => {
  const allUsers = User.getAll();
  res.status(200).json({
    success: true,
    data: allUsers
  });
});

module.exports = router;
