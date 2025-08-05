const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', (req, res) => {
  // Mock login - implement actual logic
  res.json({ 
    success: true, 
    token: 'mock-jwt-token',
    user: { id: 1, username: req.body.username, role: 'STUDENT' }
  });
});

module.exports = router;
