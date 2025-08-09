const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const logger = require('./utils/logger');
const paymentRoutes = require('./routes/payments');
const mockPayDPIRoutes = require('./routes/mock-paydpi');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000', // React frontend
    'http://localhost:3001', // Auth service
    'http://localhost:3002'  // Order service
  ],
  credentials: true
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// API Routes
app.use('/api/payments', paymentRoutes);
app.use('/mock/paydpi', mockPayDPIRoutes);

// Swagger Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NutriConnect Payment Service API',
      version: '1.0.0',
      description: 'Payment processing service with PayDPI integration for school meal subsidies',
      contact: {
        name: 'NutriConnect Team',
        email: 'payments@nutriconnect.lk'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || `http://localhost:${PORT}`,
        description: 'Payment Service'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Payment: {
          type: 'object',
          required: ['id', 'orderId', 'amount', 'status'],
          properties: {
            id: { type: 'string', description: 'Payment ID' },
            orderId: { type: 'string', description: 'Order ID' },
            studentId: { type: 'string', description: 'Student ID' },
            amount: { type: 'number', description: 'Payment amount' },
            subsidyAmount: { type: 'number', description: 'Government subsidy amount' },
            finalAmount: { type: 'number', description: 'Final amount to pay' },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
              description: 'Payment status' 
            },
            paymentMethod: { type: 'string', description: 'Payment method used' },
            transactionId: { type: 'string', description: 'PayDPI transaction ID' },
            createdAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NutriConnect Payment Service API'
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    integrations: {
      payDPI: 'mock', // Will be 'connected' in production
      database: 'memory' // Will be 'connected' in production
    },
    uptime: process.uptime()
  });
});

// Service status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'NutriConnect Payment Service is running',
    service: 'payment-service',
    port: PORT,
    endpoints: {
      payments: '/api/payments',
      mockPayDPI: '/mock/paydpi',
      documentation: '/api-docs',
      health: '/health'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '💳 Welcome to NutriConnect Payment Service',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health'
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.code || 'server_error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Payment processing error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'endpoint_not_found',
    message: `Payment Service endpoint ${req.originalUrl} not found`
  });
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Payment Service shutting down gracefully...');
  server.close(() => {
    logger.info('Payment Service closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`💳 NutriConnect Payment Service started on port ${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;