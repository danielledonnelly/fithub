const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Apply authentication middleware to all routes below this point
router.use(authenticateToken);

// Protected routes (authentication required)
router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);
router.post('/logout', AuthController.logout);
router.get('/verify', AuthController.verifyToken);

module.exports = router;