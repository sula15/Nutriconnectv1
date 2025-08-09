const express = require('express');
const router = express.Router();
const PaymentService = require('../services/PaymentService');
const { authenticateToken } = require('../middleware/auth');
const { validatePaymentRequest } = require('../middleware/validation');

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Process a payment for an order
 *     description: Initiates payment processing with government subsidy calculation and PayDPI integration
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, amount]
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID to process payment for
 *               amount:
 *                 type: number
 *                 description: Total order amount
 *               subsidyAmount:
 *                 type: number
 *                 description: Government subsidy amount
 *               paymentMethod:
 *                 type: string
 *                 enum: [CARD, MOBILE_WALLET, BANK_TRANSFER]
 *                 default: CARD
 *               returnUrl:
 *                 type: string
 *                 description: URL to redirect after payment completion
 *     responses:
 *       201:
 *         description: Payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *                 paymentUrl:
 *                   type: string
 *                   description: PayDPI payment URL
 *       400:
 *         description: Invalid payment request
 *       401:
 *         description: Authentication required
 */
router.post('/process', authenticateToken, validatePaymentRequest, async (req, res) => {
  try {
    const result = await PaymentService.processPayment(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('[PAYMENT_ROUTE] Error processing payment:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'payment_error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/payments/status/{paymentId}:
 *   get:
 *     summary: Get payment status
 *     description: Check the current status of a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved
 */
router.get('/status/:paymentId', authenticateToken, async (req, res) => {
  try {
    const result = await PaymentService.getPaymentStatus(req.params.paymentId, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'status_error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Get user payment history
 *     description: Retrieve payment history for the authenticated user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Payment history retrieved
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await PaymentService.getPaymentHistory(req.user.id, req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'history_error',
      message: 'Failed to fetch payment history'
    });
  }
});

/**
 * @swagger
 * /api/payments/refund/{paymentId}:
 *   post:
 *     summary: Initiate payment refund
 *     description: Process a refund for a completed payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for refund
 *               amount:
 *                 type: number
 *                 description: Partial refund amount (optional)
 *     responses:
 *       200:
 *         description: Refund initiated successfully
 */
router.post('/refund/:paymentId', authenticateToken, async (req, res) => {
  try {
    const result = await PaymentService.initiateRefund(req.params.paymentId, req.user.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'refund_error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/payments/webhook/paydpi:
 *   post:
 *     summary: PayDPI webhook endpoint
 *     description: Receives payment status updates from PayDPI
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *               status:
 *                 type: string
 *               paymentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook/paydpi', async (req, res) => {
  try {
    await PaymentService.handlePayDPIWebhook(req.body);
    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('[WEBHOOK] PayDPI webhook error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

module.exports = router;
