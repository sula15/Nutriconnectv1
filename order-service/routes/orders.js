const express = require('express');
const router = express.Router();
const OrderService = require('../services/OrderService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateOrderRequest, validateStatusUpdate } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - id
 *         - studentId
 *         - mealId
 *         - schoolId
 *         - orderDate
 *         - quantity
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Unique order identifier
 *         studentId:
 *           type: string
 *           description: Student's unique ID from SLUDI
 *         mealId:
 *           type: string
 *           description: Meal item identifier
 *         schoolId:
 *           type: string
 *           description: School identifier
 *         orderDate:
 *           type: string
 *           format: date-time
 *           description: When the order was placed
 *         scheduledDate:
 *           type: string
 *           format: date
 *           description: Date for meal delivery/pickup
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Number of meals ordered
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED]
 *           description: Current order status
 *         totalAmount:
 *           type: number
 *           description: Total cost before subsidies
 *         subsidyAmount:
 *           type: number
 *           description: Government subsidy applied
 *         finalAmount:
 *           type: number
 *           description: Amount to be paid after subsidies
 *         paymentStatus:
 *           type: string
 *           enum: [PENDING, PROCESSING, PAID, FAILED, REFUNDED]
 *           description: Payment processing status
 *         paymentId:
 *           type: string
 *           description: Payment transaction ID
 *         dietaryRestrictions:
 *           type: array
 *           items:
 *             type: string
 *           description: Student's dietary restrictions
 *         specialInstructions:
 *           type: string
 *           description: Additional preparation instructions
 *         pickupTime:
 *           type: string
 *           description: Preferred pickup time slot
 *         metadata:
 *           type: object
 *           description: Additional order metadata
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Place a new meal order
 *     description: Creates a new meal order for a student with SLUDI/NDX/PayDPI integration
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mealId, scheduledDate, quantity]
 *             properties:
 *               mealId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               pickupTime:
 *                 type: string
 *               specialInstructions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Order conflict
 */
router.post('/', authenticateToken, validateOrderRequest, async (req, res) => {
  try {
    const result = await OrderService.createOrder(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('[ORDER_ROUTE] Error creating order:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'server_error',
      message: error.message || 'Failed to create order'
    });
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get student's order history
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
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
 *         description: Orders retrieved successfully
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log("HI");
    const result = await OrderService.getOrdersByStudent(req.user.id, req.query);
    res.json(result);
  } catch (error) {
    console.error('[ORDER_ROUTE] Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to fetch orders'
    });
  }
});

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get specific order details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const result = await OrderService.getOrderById(req.params.orderId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('[ORDER_ROUTE] Error fetching order:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'server_error',
      message: error.message || 'Failed to fetch order'
    });
  }
});

/**
 * @swagger
 * /api/orders/{orderId}/cancel:
 *   patch:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled
 *       404:
 *         description: Order not found
 */
router.patch('/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    const result = await OrderService.cancelOrder(req.params.orderId, req.user.id, req.body.reason);
    res.json(result);
  } catch (error) {
    console.error('[ORDER_ROUTE] Error cancelling order:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'server_error',
      message: error.message || 'Failed to cancel order'
    });
  }
});

/**
 * @swagger
 * /api/orders/staff/pending:
 *   get:
 *     summary: Get pending orders for staff
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Pending orders retrieved
 *       403:
 *         description: Forbidden - Staff access required
 */
router.get('/staff/pending', authenticateToken, requireRole(['SCHOOL_STAFF', 'ADMIN']), async (req, res) => {
  try {
    const result = await OrderService.getPendingOrdersForStaff(req.query);
    res.json(result);
  } catch (error) {
    console.error('[ORDER_ROUTE] Error fetching pending orders:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to fetch pending orders'
    });
  }
});

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status (Staff only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED, PREPARING, READY, DELIVERED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated
 *       403:
 *         description: Forbidden
 */
router.patch('/:orderId/status', authenticateToken, requireRole(['SCHOOL_STAFF', 'ADMIN']), validateStatusUpdate, async (req, res) => {
  try {
    const result = await OrderService.updateOrderStatus(req.params.orderId, req.user.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('[ORDER_ROUTE] Error updating order status:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'server_error',
      message: error.message || 'Failed to update order status'
    });
  }
});

module.exports = router;