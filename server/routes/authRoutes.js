const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes (no authentication required)
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Apply authentication middleware to all routes below this point
router.use(authenticateToken);

// Protected routes (authentication required)
router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);
router.post('/avatar', upload.single('avatar'), AuthController.uploadAvatar);
router.post('/logout', AuthController.logout);
router.get('/verify', AuthController.verifyToken);

// Goal routes
router.get('/goals', AuthController.getGoals);
router.put('/goals', AuthController.updateGoals);

// Community routes
router.get('/search', AuthController.searchUsers);
router.get('/leaderboard', AuthController.getLeaderboard);

module.exports = router;