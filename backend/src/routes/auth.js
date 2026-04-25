const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Public routes (no authentication required)
router.post('/login', validate('login'), authController.login);
router.post('/refresh', validate('refreshToken'), authController.refreshToken);
router.post('/register', validate('register'), authController.register);

// Protected routes (authentication required)
router.get('/users', authenticateToken, requireRole(['admin']), authController.getUsers);
router.delete('/users/:id', authenticateToken, requireRole(['admin']), authController.deleteUser);
router.put('/users/:id/password', authenticateToken, requireRole(['admin']), authController.changePassword);
router.put('/users/:id/profile', authenticateToken, authController.updateProfile);
router.put('/users/:id/change-password', authenticateToken, authController.changePasswordWithVerification);

module.exports = router;