const express = require('express');
const router = express.Router();

// payments routes - implement actual logic
router.get('/', (req, res) => {
  res.json({ message: 'payments endpoint - implement logic here' });
});

module.exports = router;
