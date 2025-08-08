const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
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

/**
 * Role-based access control middleware
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Function} Middleware function
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'forbidden',
        message: 'Insufficient permissions'
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};