const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'unauthorized',
      message: 'Access token required'
    });
  }

  try {
    // In production: const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Mock user for demo
    req.user = { 
      id: 'student123', 
      role: 'STUDENT',
      school: 'Royal College'
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'invalid_token',
      message: 'Invalid access token'
    });
  }
}

module.exports = { authenticateToken };