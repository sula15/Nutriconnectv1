const OrderModel = require('../models/Order');
const MealService = require('./MealService');
const StudentService = require('./StudentService');
const PaymentService = require('./PaymentService');
const NotificationService = require('./NotificationService');

class OrderService {
  
  /**
   * Create a new meal order
   * @param {string} studentId - Student ID from SLUDI
   * @param {Object} orderData - Order details
   * @returns {Promise<Object>} Created order
   */
  static async createOrder(studentId, orderData) {
    const { mealId, scheduledDate, quantity = 1, pickupTime, specialInstructions } = orderData;
    
    console.log(`[ORDER_SERVICE] Creating order for student ${studentId}, meal ${mealId}`);

    // Validate scheduled date
    const orderDate = new Date(scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (orderDate < today) {
      const error = new Error('Cannot order meals for past dates');
      error.statusCode = 400;
      error.code = 'invalid_date';
      throw error;
    }

    // Get meal info from NDX/Menu Service
    const meal = await MealService.getMealById(mealId);
    if (!meal || !meal.available) {
      const error = new Error('Selected meal is not available');
      error.statusCode = 404;
      error.code = 'meal_not_available';
      throw error;
    }

    // Get student info from SLUDI
    const student = await StudentService.getStudentById(studentId);
    if (!student) {
      const error = new Error('Student not found in system');
      error.statusCode = 401;
      error.code = 'student_not_found';
      throw error;
    }

    // Check for existing order on the same date
    const existingOrder = await OrderModel.findExistingOrder(studentId, scheduledDate);
    if (existingOrder) {
      const error = new Error('You already have an order for this date');
      error.statusCode = 409;
      error.code = 'duplicate_order';
      throw error;
    }

    // Calculate pricing with subsidies
    const totalAmount = meal.price * quantity;
    const subsidyAmount = student.subsidyEligible ? (meal.subsidyAmount * quantity) : 0;
    const finalAmount = Math.max(0, totalAmount - subsidyAmount);

    // Create order
    const orderData_processed = {
      studentId,
      mealId,
      schoolId: student.school,
      scheduledDate,
      quantity,
      totalAmount,
      subsidyAmount,
      finalAmount,
      dietaryRestrictions: student.dietaryRestrictions,
      specialInstructions,
      pickupTime,
      metadata: {
        mealName: meal.name,
        nutritionScore: meal.nutritionScore,
        orderSource: 'web_app',
        apiVersion: 'v1'
      }
    };

    const newOrder = await OrderModel.create(orderData_processed);

    // [FUTURE INTEGRATION POINT: PayDPI]
    // If payment required, initiate payment process
    if (finalAmount > 0) {
      try {
        // TODO: Uncomment when PayDPI is integrated
        // const paymentResult = await PaymentService.initiatePayment({
        //   orderId: newOrder.id,
        //   amount: finalAmount,
        //   studentId,
        //   parentId: student.parentId
        // });
        // newOrder.paymentId = paymentResult.paymentId;
        // await OrderModel.updatePaymentInfo(newOrder.id, paymentResult);
        
        console.log(`[ORDER_SERVICE] Payment required: Rs. ${finalAmount} (PayDPI integration pending)`);
      } catch (paymentError) {
        console.error('[ORDER_SERVICE] Payment initiation failed:', paymentError);
        // Handle payment failure - could mark order as payment_failed
      }
    }

    // Update meal availability (NDX integration)
    await MealService.updateAvailability(mealId, scheduledDate, quantity);

    // Send notification
    await NotificationService.sendOrderConfirmation(studentId, newOrder);

    console.log(`[ORDER_SERVICE] Order created successfully: ${newOrder.id}`);

    return {
      success: true,
      order: newOrder,
      message: 'Order placed successfully',
      nextSteps: finalAmount > 0 
        ? ['Complete payment to confirm order']
        : ['Order confirmed - fully subsidized']
    };
  }

  /**
   * Get orders by student ID
   * @param {string} studentId - Student ID
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Orders with pagination
   */
  static async getOrdersByStudent(studentId, filters = {}) {
    const { status, limit = 20, offset = 0 } = filters;
    
    console.log(`[ORDER_SERVICE] Fetching orders for student ${studentId}`);

    const orders = await OrderModel.findByStudent(studentId, { status, limit, offset });
    const total = await OrderModel.countByStudent(studentId, { status });

    return {
      success: true,
      orders: orders,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    };
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @param {string} studentId - Student ID for authorization
   * @returns {Promise<Object>} Order details
   */
  static async getOrderById(orderId, studentId) {
    const order = await OrderModel.findById(orderId);
    
    if (!order || order.studentId !== studentId) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      error.code = 'order_not_found';
      throw error;
    }

    return {
      success: true,
      order
    };
  }

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @param {string} studentId - Student ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Updated order
   */
  static async cancelOrder(orderId, studentId, reason) {
    const order = await OrderModel.findById(orderId);
    
    if (!order || order.studentId !== studentId) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      error.code = 'order_not_found';
      throw error;
    }

    // Check if order can be cancelled
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      const error = new Error('Order cannot be cancelled at this stage');
      error.statusCode = 400;
      error.code = 'cannot_cancel';
      throw error;
    }

    // Update order status
    const updatedOrder = await OrderModel.cancel(orderId, reason);

    // [FUTURE INTEGRATION POINT: PayDPI]
    // If payment was made, initiate refund
    if (order.paymentStatus === 'PAID' && order.finalAmount > 0) {
      try {
        // TODO: Uncomment when PayDPI is integrated
        // await PaymentService.initiateRefund({
        //   orderId: order.id,
        //   paymentId: order.paymentId,
        //   amount: order.finalAmount
        // });
        await OrderModel.updatePaymentStatus(orderId, 'REFUNDED');
        console.log(`[ORDER_SERVICE] Refund initiated for order ${orderId}`);
      } catch (refundError) {
        console.error('[ORDER_SERVICE] Refund failed:', refundError);
      }
    }

    // Restore meal availability
    await MealService.restoreAvailability(order.mealId, order.scheduledDate, order.quantity);

    // Send notification
    await NotificationService.sendOrderCancellation(studentId, updatedOrder);

    console.log(`[ORDER_SERVICE] Order cancelled: ${orderId}`);

    return {
      success: true,
      order: updatedOrder,
      message: 'Order cancelled successfully'
    };
  }

  /**
   * Get pending orders for staff
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Pending orders
   */
  static async getPendingOrdersForStaff(filters = {}) {
    const { date } = filters;
    
    const orders = await OrderModel.findPendingOrders(date);
    
    return {
      success: true,
      orders,
      summary: {
        total: orders.length,
        byDate: orders.reduce((acc, order) => {
          acc[order.scheduledDate] = (acc[order.scheduledDate] || 0) + 1;
          return acc;
        }, {})
      }
    };
  }

  /**
   * Update order status (staff only)
   * @param {string} orderId - Order ID
   * @param {string} staffId - Staff ID
   * @param {Object} updateData - Status update data
   * @returns {Promise<Object>} Updated order
   */
  static async updateOrderStatus(orderId, staffId, updateData) {
    const { status, notes } = updateData;

    const order = await OrderModel.findById(orderId);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      error.code = 'order_not_found';
      throw error;
    }

    const updatedOrder = await OrderModel.updateStatus(orderId, status, staffId, notes);

    // Send status update notification
    await NotificationService.sendStatusUpdate(order.studentId, updatedOrder);

    console.log(`[ORDER_SERVICE] Order ${orderId} status updated to ${status} by ${staffId}`);

    return {
      success: true,
      order: updatedOrder,
      message: 'Order status updated successfully'
    };
  }
}

module.exports = OrderService;