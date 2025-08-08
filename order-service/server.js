const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const logger = require('./utils/logger');
const dpiConfig = require('./config/dpi');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// API Routes
// app.use('/api/auth', require('./routes/auth')); // Your existing auth routes
app.use('/api/orders', require('./routes/orders')); // New order service routes
// app.use('/api/menus', require('./routes/menus')); // Your existing menu routes
// app.use('/api/payments', require('./routes/payments')); // Your existing payment routes
// app.use('/api/nutrition', require('./routes/nutrition')); // Your existing nutrition routes
// app.use('/api/v1', require('./routes/downstream')); // Your existing downstream routes

// Mock DPI Services (for development/testing)
// app.use('/mock/sludi', require('./routes/mock-sludi'));
// app.use('/mock/ndx', require('./routes/mock-ndx'));
// app.use('/mock/paydpi', require('./routes/mock-paydpi'));

// Swagger API Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NutriConnect API',
      version: '1.0.0',
      description: 'Smart School Meals & Subsidy Platform API with Order Management',
      contact: {
        name: 'NutriConnect Team',
        email: 'team@nutriconnect.lk'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || `http://localhost:${PORT}`,
        description: 'Development server'
      },
      {
        url: 'https://api.nutriconnect.lk',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './services/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NutriConnect API Documentation'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'connected', // Update based on actual DB connection
      sludi: 'mock', // Will be 'connected' in production
      ndx: 'mock',   // Will be 'connected' in production
      paydpi: 'mock' // Will be 'connected' in production
    },
    uptime: process.uptime()
  };

  res.json(healthCheck);
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'NutriConnect Order Service API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      orders: '/api/orders',
      documentation: '/api-docs',
      health: '/health'
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'endpoint_not_found',
    message: `API endpoint ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /api/orders - Get order history',
      'POST /api/orders - Create new order',
      'GET /api-docs - API documentation'
    ]
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.code || 'server_error',
    message: isDevelopment ? err.message : 'An internal server error occurred',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 NutriConnect Order Service running on port ${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log DPI integration status
  logger.info('DPI Integration Status:', {
    sludi: dpiConfig.sludi.baseUrl,
    ndx: dpiConfig.ndx.baseUrl,
    paydpi: dpiConfig.paydpi.baseUrl
  });
});

module.exports = app;