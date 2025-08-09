const PayDPIClient = require('../clients/PayDPIClient'); // Adjust path as needed

class PaymentService {
  constructor() {
    // Initialize pure mock PayDPI client (no HTTP calls)
    this.paydpiClient = new PayDPIClient({
      merchantId: process.env.PAYDPI_MERCHANT_ID || 'MERCHANT_001',
      apiKey: process.env.PAYDPI_API_KEY || 'sk_test_paydpi_mock_key_123456',
      webhookSecret: process.env.PAYDPI_WEBHOOK_SECRET || 'whsec_mock_secret_789'
    });

    console.log('[PAYMENT_SERVICE] PayDPI mock client initialized (no external connections)');
  }

  /**
   * Process payment (alias for initiatePayment to match existing routes)
   * This method exists for backward compatibility with existing route handlers
   * 
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment result following OpenAPI spec
   */
  async processPayment(paymentData) {
    console.log('[PAYMENT_SERVICE] Processing payment (calling initiatePayment):', paymentData);
    
    // Simply call initiatePayment - this is an alias for backward compatibility
    return await this.initiatePayment(paymentData);
  }

  /**
   * Initiate payment with PayDPI mock
   * Pure mock implementation - no HTTP calls
   * 
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment result following OpenAPI spec
   */
  async initiatePayment(paymentData) {
    try {
      console.log('[PAYMENT_SERVICE] Initiating PayDPI payment (mock):', paymentData);

      // Validate required fields
      if (!paymentData.orderId || !paymentData.amount || !paymentData.description) {
        throw new Error('Missing required payment fields: orderId, amount, description');
      }

      // Prepare payment data for PayDPI mock client
      const paydpiPaymentData = {
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'LKR',
        description: paymentData.description,
        customerInfo: {
          name: paymentData.customerName || 'Customer',
          email: paymentData.customerEmail,
          phone: paymentData.customerPhone,
          sludiId: paymentData.sludiId // SLUDI integration
        },
        expiryMinutes: paymentData.expiryMinutes || 60,
        paymentMethods: paymentData.paymentMethods || ['CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET'],
        metadata: {
          serviceType: 'school_meal_payment',
          source: 'nutriconnect_order_service',
          merchantReference: paymentData.merchantReference,
          ...paymentData.metadata
        }
      };

      // Call PayDPI mock client (no HTTP call)
      const paydpiResponse = await this.paydpiClient.initiatePayment(paydpiPaymentData);

      console.log('[PAYMENT_SERVICE] PayDPI payment initiated successfully (mock):', paydpiResponse);

      // Return standardized response
      return {
        success: true,
        paymentId: paydpiResponse.paymentId,
        status: paydpiResponse.status,
        amount: paymentData.amount,
        currency: paydpiPaymentData.currency,
        redirectUrl: paydpiResponse.redirectUrl,
        qrCode: paydpiResponse.qrCode,
        deepLink: paydpiResponse.deepLink,
        expiresAt: paydpiResponse.expiresAt,
        fees: paydpiResponse.fees,
        paymentMethods: paydpiPaymentData.paymentMethods
      };

    } catch (error) {
      console.error('[PAYMENT_SERVICE] PayDPI payment initiation failed (mock):', error);
      
      // Return error response following consistent format
      return {
        success: false,
        error: {
          code: 'PAYMENT_INITIATION_FAILED',
          message: error.message || 'Payment initiation failed',
          details: error.error?.details || []
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check payment status with PayDPI mock
   * Pure mock implementation - no HTTP calls
   * 
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment status following OpenAPI spec
   */
  async checkPaymentStatus(paymentId) {
    try {
      console.log('[PAYMENT_SERVICE] Checking PayDPI payment status (mock):', paymentId);

      if (!paymentId) {
        throw new Error('Payment ID is required');
      }

      // Call PayDPI mock client (no HTTP call)
      const paydpiResponse = await this.paydpiClient.getPaymentStatus(paymentId);

      console.log('[PAYMENT_SERVICE] PayDPI payment status retrieved (mock):', paydpiResponse);

      // Return standardized response
      return {
        success: true,
        paymentId: paydpiResponse.paymentId,
        orderId: paydpiResponse.orderId,
        status: paydpiResponse.status,
        amount: paydpiResponse.amount,
        currency: paydpiResponse.currency,
        paymentMethod: paydpiResponse.paymentMethod,
        transactionId: paydpiResponse.transactionId,
        cardLast4: paydpiResponse.cardLast4,
        bankCode: paydpiResponse.bankCode,
        initiatedAt: paydpiResponse.initiatedAt,
        completedAt: paydpiResponse.completedAt,
        expiresAt: paydpiResponse.expiresAt,
        failureReason: paydpiResponse.failureReason,
        fees: paydpiResponse.fees
      };

    } catch (error) {
      console.error('[PAYMENT_SERVICE] PayDPI status check failed (mock):', error);
      
      return {
        success: false,
        error: {
          code: 'PAYMENT_STATUS_CHECK_FAILED',
          message: error.message || 'Payment status check failed'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cancel payment with PayDPI mock
   * Pure mock implementation - no HTTP calls
   * 
   * @param {string} paymentId - Payment ID to cancel
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelPayment(paymentId, reason = 'Customer requested cancellation') {
    try {
      console.log('[PAYMENT_SERVICE] Cancelling PayDPI payment (mock):', paymentId, reason);

      if (!paymentId) {
        throw new Error('Payment ID is required');
      }

      // Call PayDPI mock client (no HTTP call)
      const paydpiResponse = await this.paydpiClient.cancelPayment(paymentId, reason);

      console.log('[PAYMENT_SERVICE] PayDPI payment cancelled successfully (mock):', paydpiResponse);

      return {
        success: true,
        paymentId: paydpiResponse.paymentId,
        status: paydpiResponse.status,
        cancelledAt: paydpiResponse.cancelledAt,
        refundAmount: paydpiResponse.refundAmount
      };

    } catch (error) {
      console.error('[PAYMENT_SERVICE] PayDPI payment cancellation failed (mock):', error);
      
      return {
        success: false,
        error: {
          code: 'PAYMENT_CANCELLATION_FAILED',
          message: error.message || 'Payment cancellation failed'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Initiate refund with PayDPI mock
   * Pure mock implementation - no HTTP calls
   * 
   * @param {Object} refundData - Refund details
   * @returns {Promise<Object>} Refund result following OpenAPI spec
   */
  async initiateRefund(refundData) {
    try {
      console.log('[PAYMENT_SERVICE] Initiating PayDPI refund (mock):', refundData);

      // Validate required fields
      if (!refundData.paymentId || !refundData.amount || !refundData.reason) {
        throw new Error('Missing required refund fields: paymentId, amount, reason');
      }

      // Prepare refund data for PayDPI mock client
      const paydpiRefundData = {
        paymentId: refundData.paymentId,
        amount: refundData.amount,
        reason: refundData.reason,
        metadata: {
          source: 'nutriconnect_order_service',
          refundType: refundData.refundType || 'customer_request',
          ...refundData.metadata
        }
      };

      // Call PayDPI mock client (no HTTP call)
      const paydpiResponse = await this.paydpiClient.initiateRefund(paydpiRefundData);

      console.log('[PAYMENT_SERVICE] PayDPI refund initiated successfully (mock):', paydpiResponse);

      return {
        success: true,
        refundId: paydpiResponse.refundId,
        status: paydpiResponse.status,
        amount: paydpiResponse.amount,
        estimatedCompletion: paydpiResponse.estimatedCompletion
      };

    } catch (error) {
      console.error('[PAYMENT_SERVICE] PayDPI refund initiation failed (mock):', error);
      
      return {
        success: false,
        error: {
          code: 'REFUND_INITIATION_FAILED',
          message: error.message || 'Refund initiation failed'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check refund status with PayDPI mock
   * Pure mock implementation - no HTTP calls
   * 
   * @param {string} refundId - Refund ID
   * @returns {Promise<Object>} Refund status
   */
  async checkRefundStatus(refundId) {
    try {
      console.log('[PAYMENT_SERVICE] Checking PayDPI refund status (mock):', refundId);

      if (!refundId) {
        throw new Error('Refund ID is required');
      }

      // Call PayDPI mock client (no HTTP call)
      const paydpiResponse = await this.paydpiClient.getRefundStatus(refundId);

      console.log('[PAYMENT_SERVICE] PayDPI refund status retrieved (mock):', paydpiResponse);

      return {
        success: true,
        refundId: paydpiResponse.refundId,
        paymentId: paydpiResponse.paymentId,
        status: paydpiResponse.status,
        amount: paydpiResponse.amount,
        initiatedAt: paydpiResponse.initiatedAt,
        completedAt: paydpiResponse.completedAt,
        failureReason: paydpiResponse.failureReason
      };

    } catch (error) {
      console.error('[PAYMENT_SERVICE] PayDPI refund status check failed (mock):', error);
      
      return {
        success: false,
        error: {
          code: 'REFUND_STATUS_CHECK_FAILED',
          message: error.message || 'Refund status check failed'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get merchant balance from PayDPI mock
   * Pure mock implementation - no HTTP calls
   * 
   * @returns {Promise<Object>} Merchant balance
   */
  async getMerchantBalance() {
    try {
      console.log('[PAYMENT_SERVICE] Getting PayDPI merchant balance (mock)');

      // Call PayDPI mock client (no HTTP call)
      const paydpiResponse = await this.paydpiClient.getMerchantBalance();

      console.log('[PAYMENT_SERVICE] PayDPI merchant balance retrieved (mock):', paydpiResponse);

      return {
        success: true,
        availableBalance: paydpiResponse.availableBalance,
        pendingBalance: paydpiResponse.pendingBalance,
        currency: paydpiResponse.currency,
        lastUpdated: paydpiResponse.lastUpdated
      };

    } catch (error) {
      console.error('[PAYMENT_SERVICE] PayDPI balance check failed (mock):', error);
      
      return {
        success: false,
        error: {
          code: 'BALANCE_CHECK_FAILED',
          message: error.message || 'Balance check failed'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get transaction history from PayDPI mock
   * Pure mock implementation - no HTTP calls
   * 
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Transaction history
   */
  async getTransactionHistory(filters = {}) {
    try {
      console.log('[PAYMENT_SERVICE] Getting PayDPI transaction history (mock):', filters);

      // Call PayDPI mock client (no HTTP call)
      const paydpiResponse = await this.paydpiClient.getTransactionHistory(filters);

      console.log('[PAYMENT_SERVICE] PayDPI transaction history retrieved (mock):', paydpiResponse.transactions?.length || 0, 'transactions');

      return {
        success: true,
        transactions: paydpiResponse.transactions,
        pagination: paydpiResponse.pagination
      };

    } catch (error) {
      console.error('[PAYMENT_SERVICE] PayDPI transaction history failed (mock):', error);
      
      return {
        success: false,
        error: {
          code: 'TRANSACTION_HISTORY_FAILED',
          message: error.message || 'Transaction history retrieval failed'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handle PayDPI webhook verification (mock)
   * Pure mock implementation - no HTTP calls
   * 
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Webhook signature
   * @param {string} timestamp - Webhook timestamp
   * @returns {Promise<Object>} Verification result
   */
  async verifyWebhook(payload, signature, timestamp) {
    try {
      console.log('[PAYMENT_SERVICE] Verifying PayDPI webhook (mock)');

      // Call PayDPI mock client for signature verification (no HTTP call)
      const verificationResult = await this.paydpiClient.verifyWebhookSignature(payload, signature, timestamp);

      if (!verificationResult.valid) {
        throw new Error('Invalid webhook signature');
      }

      console.log('[PAYMENT_SERVICE] PayDPI webhook verified successfully (mock)');

      return {
        success: true,
        valid: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[PAYMENT_SERVICE] PayDPI webhook verification failed (mock):', error);
      
      return {
        success: false,
        valid: false,
        error: {
          code: 'WEBHOOK_VERIFICATION_FAILED',
          message: error.message || 'Webhook verification failed'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Process PayDPI webhook payload (mock)
   * Pure mock implementation - no HTTP calls
   * 
   * @param {Object} webhookData - Parsed webhook data
   * @returns {Promise<Object>} Processing result
   */
  async processWebhook(webhookData) {
    try {
      console.log('[PAYMENT_SERVICE] Processing PayDPI webhook (mock):', webhookData.event);

      switch (webhookData.event) {
        case 'payment.completed':
          await this.handlePaymentCompleted(webhookData.data);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(webhookData.data);
          break;
        case 'payment.cancelled':
          await this.handlePaymentCancelled(webhookData.data);
          break;
        case 'refund.completed':
          await this.handleRefundCompleted(webhookData.data);
          break;
        case 'refund.failed':
          await this.handleRefundFailed(webhookData.data);
          break;
        default:
          console.warn('[PAYMENT_SERVICE] Unknown webhook event (mock):', webhookData.event);
      }

      return {
        success: true,
        processed: true,
        event: webhookData.event,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[PAYMENT_SERVICE] PayDPI webhook processing failed (mock):', error);
      
      return {
        success: false,
        processed: false,
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: error.message || 'Webhook processing failed'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handle payment completed webhook (mock)
   * 
   * @param {Object} paymentData - Payment data from webhook
   */
  async handlePaymentCompleted(paymentData) {
    console.log('[PAYMENT_SERVICE] Handling payment completed (mock):', paymentData.paymentId);
    
    // Mock business logic for payment completion
    // In a real implementation, this would:
    // 1. Update order status to 'paid'
    // 2. Send confirmation email to customer
    // 3. Trigger fulfillment process
    // 4. Update analytics/reporting
    
    return {
      orderUpdated: true,
      notificationSent: true,
      fulfillmentTriggered: true
    };
  }

  /**
   * Handle payment failed webhook (mock)
   * 
   * @param {Object} paymentData - Payment data from webhook
   */
  async handlePaymentFailed(paymentData) {
    console.log('[PAYMENT_SERVICE] Handling payment failed (mock):', paymentData.paymentId);
    
    // Mock business logic for payment failure
    // In a real implementation, this would:
    // 1. Update order status to 'payment_failed'
    // 2. Send failure notification to customer
    // 3. Optionally retry payment or offer alternative methods
    
    return {
      orderUpdated: true,
      failureNotificationSent: true,
      retryOffered: false
    };
  }

  /**
   * Handle payment cancelled webhook (mock)
   * 
   * @param {Object} paymentData - Payment data from webhook
   */
  async handlePaymentCancelled(paymentData) {
    console.log('[PAYMENT_SERVICE] Handling payment cancelled (mock):', paymentData.paymentId);
    
    return {
      orderUpdated: true,
      cancellationProcessed: true
    };
  }

  /**
   * Handle refund completed webhook (mock)
   * 
   * @param {Object} refundData - Refund data from webhook
   */
  async handleRefundCompleted(refundData) {
    console.log('[PAYMENT_SERVICE] Handling refund completed (mock):', refundData.refundId);
    
    return {
      orderUpdated: true,
      refundConfirmationSent: true
    };
  }

  /**
   * Handle refund failed webhook (mock)
   * 
   * @param {Object} refundData - Refund data from webhook
   */
  async handleRefundFailed(refundData) {
    console.log('[PAYMENT_SERVICE] Handling refund failed (mock):', refundData.refundId);
    
    return {
      adminNotified: true,
      manualReviewRequested: true
    };
  }

  /**
   * Get available payment methods from PayDPI mock
   * Pure mock implementation - no HTTP calls
   * 
   * @returns {Array} Available payment methods
   */
  getAvailablePaymentMethods() {
    return this.paydpiClient.getAvailablePaymentMethods();
  }

  /**
   * Calculate fees for a payment (mock)
   * Pure mock implementation - no HTTP calls
   * 
   * @param {number} amount - Payment amount
   * @param {string} paymentMethod - Payment method
   * @returns {number} Calculated fees
   */
  calculatePaymentFees(amount, paymentMethod = 'CREDIT_CARD') {
    return this.paydpiClient.calculateFees(amount, [paymentMethod]);
  }

  /**
   * Generate payment link for external use (mock)
   * Pure mock implementation - no HTTP calls
   * 
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment link details
   */
  async generatePaymentLink(paymentData) {
    try {
      // First initiate the payment (mock)
      const paymentResult = await this.initiatePayment(paymentData);
      
      if (!paymentResult.success) {
        throw new Error('Failed to generate payment link');
      }

      return {
        success: true,
        paymentId: paymentResult.paymentId,
        paymentLink: paymentResult.redirectUrl,
        qrCode: paymentResult.qrCode,
        deepLink: paymentResult.deepLink,
        expiresAt: paymentResult.expiresAt,
        amount: paymentResult.amount,
        currency: paymentResult.currency
      };

    } catch (error) {
      console.error('[PAYMENT_SERVICE] Payment link generation failed (mock):', error);
      
      return {
        success: false,
        error: {
          code: 'PAYMENT_LINK_GENERATION_FAILED',
          message: error.message || 'Payment link generation failed'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate payment data before processing
   * Pure validation logic - no HTTP calls
   * 
   * @param {Object} paymentData - Payment data to validate
   * @returns {Object} Validation result
   */
  validatePaymentData(paymentData) {
    const errors = [];

    // Required fields validation
    if (!paymentData.orderId) {
      errors.push({ field: 'orderId', message: 'Order ID is required' });
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push({ field: 'amount', message: 'Valid amount is required' });
    }

    if (!paymentData.description) {
      errors.push({ field: 'description', message: 'Payment description is required' });
    }

    // Currency validation
    if (paymentData.currency && !['LKR', 'USD', 'EUR'].includes(paymentData.currency)) {
      errors.push({ field: 'currency', message: 'Invalid currency code' });
    }

    // Email validation
    if (paymentData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentData.customerEmail)) {
      errors.push({ field: 'customerEmail', message: 'Invalid email format' });
    }

    // Phone validation (Sri Lankan format)
    if (paymentData.customerPhone && !/^\+94[0-9]{9}$/.test(paymentData.customerPhone)) {
      errors.push({ field: 'customerPhone', message: 'Invalid phone number format (use +94XXXXXXXXX)' });
    }

    // Amount limits
    if (paymentData.amount && paymentData.amount > 1000000) {
      errors.push({ field: 'amount', message: 'Amount exceeds maximum limit (LKR 1,000,000)' });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get PayDPI service status (mock)
   * Pure mock implementation - no HTTP calls
   * 
   * @returns {Promise<Object>} Service status
   */
  async getServiceStatus() {
    // Mock service status - always operational since it's a pure mock
    return {
      success: true,
      service: 'PayDPI (Mock)',
      status: 'operational',
      version: '1.2.0',
      lastChecked: new Date().toISOString(),
      details: {
        mockImplementation: true,
        httpCallsRequired: false,
        paymentsInMemory: this.paydpiClient.payments.size,
        refundsInMemory: this.paydpiClient.refunds.size
      }
    };
  }
}

module.exports = new PaymentService();