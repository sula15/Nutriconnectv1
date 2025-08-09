const express = require('express');
const router = express.Router();

/**
 * Mock PayDPI Government Service Endpoints
 * These simulate the actual government PayDPI service
 */

/**
 * @swagger
 * /mock/paydpi/payment:
 *   post:
 *     summary: Mock PayDPI Payment Initiation
 *     description: Simulates the government PayDPI payment initiation endpoint
 *     tags: [Mock PayDPI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               merchantId:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: LKR
 *               orderId:
 *                 type: string
 *               returnUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment session created
 */
router.post('/payment', (req, res) => {
  const { merchantId, amount, currency = 'LKR', orderId, returnUrl } = req.body;
  
  // Simulate government payment session creation
  const sessionId = `PAYDPI_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  res.status(201).json({
    success: true,
    sessionId,
    paymentUrl: `https://paydpi.gov.lk/pay/${sessionId}`,
    qrCode: `https://paydpi.gov.lk/qr/${sessionId}`,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    fees: {
      processingFee: amount * 0.01,
      govServiceCharge: 5.00
    },
    metadata: {
      govServiceId: 'SCHOOL_MEAL_SUBSIDY',
      processingBank: 'Central Bank of Sri Lanka',
      referenceNumber: `GOV_${sessionId.substring(-8)}`
    }
  });
});

/**
 * @swagger
 * /mock/paydpi/status/{sessionId}:
 *   get:
 *     summary: Check payment status
 *     description: Get current status of a payment session
 *     tags: [Mock PayDPI]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status
 */
router.get('/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  // Simulate status check
  const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  res.json({
    sessionId,
    status,
    timestamp: new Date().toISOString(),
    govReference: `GOV_${sessionId.substring(-8)}`,
    ...(status === 'COMPLETED' && {
      completedAt: new Date().toISOString(),
      bankReference: `BANK_${Math.random().toString(36).substring(7)}`
    })
  });
});

module.exports = router;