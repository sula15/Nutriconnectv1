const express = require('express');
const router = express.Router();

// mock-paydpi routes - implement actual logic
router.get('/', (req, res) => {
  res.json({ message: 'mock-paydpi endpoint - implement logic here' });
});

module.exports = router;
