const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/UploadController');
const { authenticateToken } = require('../middleware/auth');

// All upload routes require authentication
router.use(authenticateToken);

// Upload avatar image
router.post('/avatar', UploadController.getAvatarUpload(), UploadController.uploadAvatar);

module.exports = router;