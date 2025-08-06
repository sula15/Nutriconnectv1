const express = require('express');
const router = express.Router();

// mock-ndx routes - implement actual logic
router.get('/', (req, res) => {
  res.json({ message: 'mock-ndx endpoint - implement logic here' });
});

module.exports = router;
