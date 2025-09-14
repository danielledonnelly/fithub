const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/avatars');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp.extension
    const userId = req.user.sub;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${userId}_${timestamp}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

class UploadController {
  // Upload avatar image
  static async uploadAvatar(req, res) {
    try {
      console.log('Upload avatar called');
      console.log('Request file:', req.file);
      console.log('Request user:', req.user);
      
      if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      const userId = req.user.sub;
      const filePath = `/uploads/avatars/${req.file.filename}`;
      
      console.log('User ID:', userId);
      console.log('File path:', filePath);
      console.log('File saved to:', req.file.path);
      
      // Update user's avatar path in database
      const UserModel = require('../models/User');
      await UserModel.updateUser(userId, { avatar: filePath });

      console.log('Database updated successfully');

      res.json({
        message: 'Avatar uploaded successfully',
        avatarPath: filePath,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(400).json({
        error: 'Failed to upload avatar',
        message: error.message
      });
    }
  }

  // Get multer middleware for avatar uploads
  static getAvatarUpload() {
    return upload.single('avatar');
  }
}

module.exports = UploadController;
