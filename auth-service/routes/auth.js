const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Mock OAuth2.0 provider configuration
const OAUTH_CONFIG = {
  client_id: 'nutriconnect_app',
  client_secret: 'mock_client_secret',
  scope: 'openid profile email',
  grant_type: 'authorization_code'
};

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'mock_jwt_secret_for_development_only';

// Mock user database (in production, use actual database)
const MOCK_USERS = {
  "student123": {
    id: "std_001",
    username: "student123",
    password: "$2a$10$qF0iShMhY5NCmaNj5xcfmO8Z1ZGUQLyoT7l5rxE68qg/Hw5X1vvnS", // password123
    role: "STUDENT",
    profile: {
      name: "Kasun Perera",
      school: "Royal College",
      grade: "10A",
      email: "kasun.perera@student.royal.lk",
      dietary_restrictions: ["vegetarian"],
      subsidy_eligible: true
    }
  },
  "parent456": {
    id: "par_001",
    username: "parent456", 
    password: "$2a$10$0YIDmh6UFgdmWSRMauDZhu.80Um4kr.0gPu5RS9vyyeLkx0HUhrsO", // password456
    role: "PARENT",
    profile: {
      name: "Nimali Perera",
      email: "nimali.perera@parent.royal.lk",
      children: ["std_001"],
      phone: "+94771234567"
    }
  },
  "staff789": {
    id: "staff_001",
    username: "staff789",
    password: "$2a$10$aO2uTFfGoyZ1b1Bn2BvHWuRkLyswrsDfYNcaVKLbnBOKW3H0Av6dm", // password789
    role: "SCHOOL_STAFF", 
    profile: {
      name: "Sunil Fernando",
      email: "sunil.fernando@staff.royal.lk",
      role: "canteen_manager",
      school: "Royal College"
    }
  }
};

// Mock OAuth2.0 provider token exchange
const mockOAuthTokenExchange = async (credentials) => {
  // Simulate external OAuth2.0 provider API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock successful OAuth2.0 response
      resolve({
        access_token: `mock_oauth_token_${Date.now()}`,
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid profile email",
        id_token: `mock_id_token_${Date.now()}`
      });
    }, 100); // Simulate network delay
  });
};

// Generate JWT token
const generateJWT = (user) => {
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    profile: user.profile,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return jwt.sign(payload, JWT_SECRET);
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'unauthorized',
      message: 'Access token required'
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'invalid_token',
      message: 'Invalid or expired token'
    });
  }
};

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: User's username or email
 *           example: "student123"
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *           example: "password123"
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           description: JWT access token
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refresh_token:
 *           type: string
 *           description: OAuth2.0 refresh token
 *           example: "mock_refresh_token_123"
 *         expires_in:
 *           type: integer
 *           description: Token expiration time in seconds
 *           example: 86400
 *         user:
 *           $ref: '#/components/schemas/User'
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           example: ["read:menu", "create:order"]
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "std_001"
 *         username:
 *           type: string
 *           example: "student123"
 *         role:
 *           type: string
 *           enum: [STUDENT, PARENT, SCHOOL_STAFF, ADMIN]
 *           example: "STUDENT"
 *         profile:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Kasun Perera"
 *             email:
 *               type: string
 *               format: email
 *               example: "kasun.perera@student.royal.lk"
 *             school:
 *               type: string
 *               example: "Royal College"
 *             grade:
 *               type: string
 *               example: "10A"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error code
 *         message:
 *           type: string
 *           description: Human-readable error message
 *         details:
 *           type: object
 *           description: Additional error details
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user with OAuth2.0 flow
 *     description: |
 *       Authenticates user credentials against mock OAuth2.0 provider and returns JWT token.
 *       Simulates external identity provider integration with proper OAuth2.0 flow.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Bad request - missing or invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'invalid_request',
        message: 'Username and password are required',
        details: {
          missing_fields: []
            .concat(!username ? ['username'] : [])
            .concat(!password ? ['password'] : [])
        }
      });
    }
    
    // Find user in mock database
    const user = MOCK_USERS[username];
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid username or password'
      });
    }
    
    // Verify password (using bcrypt in production)
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials', 
        message: 'Invalid username or password'
      });
    }
    
    // Simulate OAuth2.0 provider token exchange
    console.log(`[AUTH] Initiating OAuth2.0 flow for user: ${username}`);
    const oauthResponse = await mockOAuthTokenExchange({ username, password });
    console.log(`[AUTH] OAuth2.0 token received:`, { 
      token_type: oauthResponse.token_type,
      expires_in: oauthResponse.expires_in,
      scope: oauthResponse.scope
    });
    
    // Generate internal JWT token
    const jwtToken = generateJWT(user);
    
    // Generate role-based permissions
    const permissions = generatePermissions(user.role);
    
    // Prepare user response (exclude sensitive data)
    const userResponse = {
      id: user.id,
      username: user.username,
      role: user.role,
      profile: {
        name: user.profile.name,
        email: user.profile.email,
        school: user.profile.school,
        grade: user.profile.grade,
        phone: user.profile.phone,
        children: user.profile.children,
        dietary_restrictions: user.profile.dietary_restrictions,
        subsidy_eligible: user.profile.subsidy_eligible
      }
    };
    
    console.log(`[AUTH] Login successful for user: ${username}, role: ${user.role}`);
    
    res.json({
      success: true,
      token: jwtToken,
      refresh_token: `refresh_${oauthResponse.access_token}`,
      expires_in: 86400, // 24 hours
      token_type: 'Bearer',
      user: userResponse,
      permissions,
      oauth_metadata: {
        provider: 'mock_oauth_provider',
        scope: oauthResponse.scope,
        issued_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'An internal error occurred during authentication'
    });
  }
});

// Generate role-based permissions
const generatePermissions = (role) => {
  const basePermissions = ['read:profile', 'update:profile'];
  
  switch (role) {
    case 'STUDENT':
      return [...basePermissions, 'read:menu', 'create:order', 'read:orders', 'read:nutrition'];
    case 'PARENT':
      return [...basePermissions, 'read:menu', 'create:order', 'read:orders', 'read:children', 'read:nutrition'];
    case 'SCHOOL_STAFF':
      return [...basePermissions, 'manage:menu', 'read:orders', 'update:orders', 'read:reports', 'read:nutrition'];
    case 'ADMIN':
      return [...basePermissions, 'manage:*', 'read:*', 'create:*', 'update:*', 'delete:*'];
    default:
      return basePermissions;
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user information
 *     description: |
 *       Returns the current user's profile information based on the JWT token.
 *       Requires valid Bearer token in Authorization header.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["read:menu", "create:order"]
 *                 token_info:
 *                   type: object
 *                   properties:
 *                     issued_at:
 *                       type: integer
 *                       description: Token issued timestamp
 *                     expires_at:
 *                       type: integer
 *                       description: Token expiration timestamp
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', verifyToken, (req, res) => {
  try {
    // Extract user info from verified JWT token
    const { sub, username, role, profile, iat, exp } = req.user;
    
    // Generate current permissions based on role
    const permissions = generatePermissions(role);
    
    // Prepare user response
    const userResponse = {
      id: sub,
      username,
      role,
      profile
    };
    
    console.log(`[AUTH] User info requested for: ${username}`);
    
    res.json({
      user: userResponse,
      permissions,
      token_info: {
        issued_at: iat,
        expires_at: exp,
        time_remaining: exp - Math.floor(Date.now() / 1000)
      }
    });
    
  } catch (error) {
    console.error('[AUTH] Error fetching user info:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while fetching user information'
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: |
 *       Refreshes an expired or near-expired JWT token using a refresh token.
 *       Follows OAuth2.0 refresh token flow.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: The refresh token received during login
 *                 example: "refresh_mock_oauth_token_123"
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: New JWT access token
 *                 refresh_token:
 *                   type: string
 *                   description: New refresh token
 *                 expires_in:
 *                   type: integer
 *                   example: 86400
 *       400:
 *         description: Bad request - missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'invalid_request',
        message: 'Refresh token is required'
      });
    }
    
    // Validate refresh token format (in production, verify against database)
    if (!refresh_token.startsWith('refresh_mock_oauth_token_')) {
      return res.status(401).json({
        success: false,
        error: 'invalid_grant',
        message: 'Invalid refresh token'
      });
    }
    
    // Extract user ID from refresh token (simplified for mock)
    const tokenParts = refresh_token.split('_');
    const mockUserId = tokenParts[tokenParts.length - 1];
    
    // Find user (in production, lookup by refresh token in database)
    let user = null;
    for (const [username, userData] of Object.entries(MOCK_USERS)) {
      if (userData.id.includes(mockUserId.substring(0, 3))) {
        user = userData;
        break;
      }
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'invalid_grant',
        message: 'Refresh token not found or expired'
      });
    }
    
    // Simulate OAuth2.0 provider refresh
    console.log(`[AUTH] Refreshing token for user: ${user.username}`);
    const oauthResponse = await mockOAuthTokenExchange({ refresh: true });
    
    // Generate new JWT token
    const newJwtToken = generateJWT(user);
    const newRefreshToken = `refresh_${oauthResponse.access_token}`;
    
    console.log(`[AUTH] Token refreshed successfully for user: ${user.username}`);
    
    res.json({
      success: true,
      token: newJwtToken,
      refresh_token: newRefreshToken,
      expires_in: 86400,
      token_type: 'Bearer'
    });
    
  } catch (error) {
    console.error('[AUTH] Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'An error occurred while refreshing the token'
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: |
 *       Invalidates the current session and JWT token.
 *       In production, this would revoke the token on the OAuth2.0 provider.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       401:
 *         description: Unauthorized - invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const { username } = req.user;
    
    // In production, revoke token on OAuth2.0 provider
    console.log(`[AUTH] Logging out user: ${username}`);
    
    // Simulate OAuth2.0 token revocation
    // await revokeOAuthToken(req.headers.authorization);
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'An error occurred during logout'
    });
  }
});

module.exports = router;
