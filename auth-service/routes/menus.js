const express = require('express');
const router = express.Router();

// menus routes - implement actual logic
router.get('/', (req, res) => {
  res.json({ message: 'menus endpoint - implement logic here' });
});

module.exports = router;
