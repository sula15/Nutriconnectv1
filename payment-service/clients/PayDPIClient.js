const crypto = require('crypto');

/**
 * Simple PayDPI Mock Client - Pure mock without HTTP calls
 * This provides mock request/response following OpenAPI 3.0 specification
 */
class PayDPIClient {
  constructor(config = {}) {
    // Configuration
    this.config = {
      merchantId: config.merchantId || process.env.PAYDPI_MERCHANT_ID || 'MERCHANT_001',
      apiKey: config.apiKey || process.env.PAYDPI_API_KEY || 'sk_test_paydpi_mock_key_123456',
      webhookSecret: config.webhookSecret || process.env.PAYDPI_WEBHOOK_SECRET || 'whsec_mock_secret_789'
    };

    // In-memory storage for mock data
    this.payments = new Map();
    this.refunds = new Map();
    this.paymentCounter = 5000;
    this.refundCounter = 1000;
  }

  /**
   * Generate mock payment ID
   */
  generatePaymentId() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `PAY_${date}_${++this.paymentCounter}`;
  }

  /**
   * Generate mock refund ID
   */
  generateRefundId() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `REF_${date}_${++this.refundCounter}`;
  }

  /**
   * Generate mock transaction ID
   */
  generateTransactionId() {
    return `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Calculate processing fees
   */
  calculateFees(amount, paymentMethods = ['CREDIT_CARD']) {
    const feeRates = {
      'CREDIT_CARD': 0.025,
      'DEBIT_CARD': 0.025,
      'BANK_TRANSFER': 0.01,
      'DIGITAL_WALLET': 0.015,
      'QR_CODE': 0.015
    };
    
    const primaryMethod = paymentMethods[0] || 'CREDIT_CARD';
    const feeRate = feeRates[primaryMethod] || 0.025;
    return Math.round(amount * feeRate * 100) / 100;
  }

  /**
   * Get random payment method for mock completion
   */
  getRandomPaymentMethod() {
    const methods = ['CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET', 'BANK_TRANSFER', 'QR_CODE'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  /**
   * Simulate network delay (optional)
   */
  async simulateDelay(min = 50, max = 200) {
    await new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));
  }

  /**
   * Mock Payment Initiation
   * Following OpenAPI 3.0 specification
   */
  async initiatePayment(paymentData) {
    console.log('[PAYDPI_MOCK] Initiating payment (no HTTP call):', paymentData);

    // Simulate processing delay
    await this.simulateDelay();

    // Validate required fields
    const requiredFields = ['orderId', 'amount', 'currency', 'description'];
    for (const field of requiredFields) {
      if (!paymentData[field]) {
        throw {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Missing required field: ${field}`,
            details: [{ field, message: `${field} is required` }]
          },
          timestamp: new Date().toISOString()
        };
      }
    }

    // Validate amount
    if (paymentData.amount <= 0) {
      throw {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid amount',
          details: [{ field: 'amount', message: 'Amount must be greater than 0' }]
        },
        timestamp: new Date().toISOString()
      };
    }

    const paymentId = this.generatePaymentId();
    const fees = this.calculateFees(paymentData.amount, paymentData.paymentMethods);
    const expiryMinutes = paymentData.expiryMinutes || 60;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Store payment data
    const payment = {
      paymentId,
      merchantId: this.config.merchantId,
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      description: paymentData.description,
      customerInfo: paymentData.customerInfo || {},
      status: 'INITIATED',
      fees,
      initiatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      paymentMethods: paymentData.paymentMethods || ['CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET']
    };

    this.payments.set(paymentId, payment);

    // Mock successful response following OpenAPI spec
    const response = {
      success: true,
      paymentId,
      status: 'INITIATED',
      redirectUrl: `https://paydpi.gov.lk/payment/${paymentId}`,
      qrCode: `https://paydpi.gov.lk/qr/${paymentId}`,
      deepLink: `paydpi://payment/${paymentId}`,
      expiresAt: payment.expiresAt,
      fees
    };

    console.log('[PAYDPI_MOCK] Payment initiated:', response);
    return response;
  }

  /**
   * Mock Payment Status Check
   */
  async getPaymentStatus(paymentId) {
    console.log('[PAYDPI_MOCK] Checking payment status (no HTTP call):', paymentId);

    // Simulate processing delay
    await this.simulateDelay();

    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment not found'
        },
        timestamp: new Date().toISOString()
      };
    }

    // Simulate payment progression based on time elapsed
    const now = new Date();
    const initiated = new Date(payment.initiatedAt);
    const elapsed = now - initiated;

    // Auto-progress payment status for demo
    if (payment.status === 'INITIATED' && elapsed > 30000) { // 30 seconds
      payment.status = 'PROCESSING';
    }
    if (payment.status === 'PROCESSING' && elapsed > 60000) { // 1 minute
      payment.status = 'COMPLETED';
      payment.paymentMethod = this.getRandomPaymentMethod();
      payment.transactionId = this.generateTransactionId();
      payment.completedAt = new Date().toISOString();
      
      if (payment.paymentMethod.includes('CARD')) {
        payment.cardLast4 = String(Math.floor(Math.random() * 9000) + 1000);
      }
    }

    // Check if expired
    if (new Date() > new Date(payment.expiresAt) && payment.status === 'INITIATED') {
      payment.status = 'EXPIRED';
    }

    const response = {
      success: true,
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      initiatedAt: payment.initiatedAt,
      fees: payment.fees
    };

    // Add completion details if completed
    if (payment.status === 'COMPLETED') {
      response.paymentMethod = payment.paymentMethod;
      response.transactionId = payment.transactionId;
      response.completedAt = payment.completedAt;
      
      if (payment.cardLast4) {
        response.cardLast4 = payment.cardLast4;
      }
    }

    // Add expiry for pending payments
    if (['INITIATED', 'PROCESSING'].includes(payment.status)) {
      response.expiresAt = payment.expiresAt;
    }

    console.log('[PAYDPI_MOCK] Payment status:', response);
    return response;
  }

  /**
   * Mock Payment Cancellation
   */
  async cancelPayment(paymentId, reason = 'Customer requested cancellation') {
    console.log('[PAYDPI_MOCK] Cancelling payment (no HTTP call):', paymentId);

    // Simulate processing delay
    await this.simulateDelay();

    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment not found'
        },
        timestamp: new Date().toISOString()
      };
    }

    // Check if payment can be cancelled
    if (!['INITIATED', 'PROCESSING'].includes(payment.status)) {
      throw {
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: `Cannot cancel payment in ${payment.status} status`
        },
        timestamp: new Date().toISOString()
      };
    }

    // Update payment status
    payment.status = 'CANCELLED';
    payment.cancelledAt = new Date().toISOString();
    payment.cancellationReason = reason;

    const response = {
      success: true,
      paymentId: payment.paymentId,
      status: 'CANCELLED',
      cancelledAt: payment.cancelledAt,
      refundAmount: payment.status === 'PROCESSING' ? payment.amount : 0
    };

    console.log('[PAYDPI_MOCK] Payment cancelled:', response);
    return response;
  }

  /**
   * Mock Refund Initiation
   */
  async initiateRefund(refundData) {
    console.log('[PAYDPI_MOCK] Initiating refund (no HTTP call):', refundData);

    // Simulate processing delay
    await this.simulateDelay();

    // Validate required fields
    const requiredFields = ['paymentId', 'amount', 'reason'];
    for (const field of requiredFields) {
      if (!refundData[field]) {
        throw {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Missing required field: ${field}`
          },
          timestamp: new Date().toISOString()
        };
      }
    }

    // Find original payment
    const originalPayment = this.payments.get(refundData.paymentId);
    if (!originalPayment) {
      throw {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Original payment not found'
        },
        timestamp: new Date().toISOString()
      };
    }

    // Validate payment status
    if (originalPayment.status !== 'COMPLETED') {
      throw {
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: 'Can only refund completed payments'
        },
        timestamp: new Date().toISOString()
      };
    }

    // Validate refund amount
    if (refundData.amount > originalPayment.amount) {
      throw {
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Refund amount cannot exceed original payment amount'
        },
        timestamp: new Date().toISOString()
      };
    }

    const refundId = this.generateRefundId();

    // Create refund object
    const refund = {
      refundId,
      paymentId: refundData.paymentId,
      amount: refundData.amount,
      reason: refundData.reason,
      status: 'INITIATED',
      metadata: refundData.metadata || {},
      initiatedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    this.refunds.set(refundId, refund);

    const response = {
      success: true,
      refundId,
      status: 'INITIATED',
      amount: refundData.amount,
      estimatedCompletion: refund.estimatedCompletion
    };

    console.log('[PAYDPI_MOCK] Refund initiated:', response);
    return response;
  }

  /**
   * Mock Refund Status Check
   */
  async getRefundStatus(refundId) {
    console.log('[PAYDPI_MOCK] Checking refund status (no HTTP call):', refundId);

    // Simulate processing delay
    await this.simulateDelay();

    const refund = this.refunds.get(refundId);
    if (!refund) {
      throw {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Refund not found'
        },
        timestamp: new Date().toISOString()
      };
    }

    // Simulate refund progression
    const now = new Date();
    const initiated = new Date(refund.initiatedAt);
    const elapsed = now - initiated;

    if (refund.status === 'INITIATED' && elapsed > 5000) { // 5 seconds
      refund.status = 'PROCESSING';
    }
    if (refund.status === 'PROCESSING' && elapsed > 30000) { // 30 seconds
      refund.status = 'COMPLETED';
      refund.completedAt = new Date().toISOString();
    }

    const response = {
      success: true,
      refundId: refund.refundId,
      paymentId: refund.paymentId,
      status: refund.status,
      amount: refund.amount,
      initiatedAt: refund.initiatedAt
    };

    if (refund.completedAt) {
      response.completedAt = refund.completedAt;
    }

    console.log('[PAYDPI_MOCK] Refund status:', response);
    return response;
  }

  /**
   * Mock Merchant Balance
   */
  async getMerchantBalance() {
    console.log('[PAYDPI_MOCK] Getting merchant balance (no HTTP call)');

    // Simulate processing delay
    await this.simulateDelay();

    // Calculate balance based on completed payments
    const completedPayments = Array.from(this.payments.values())
      .filter(p => p.status === 'COMPLETED');
    
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalFees = completedPayments.reduce((sum, p) => sum + p.fees, 0);
    const netRevenue = totalRevenue - totalFees;

    const response = {
      success: true,
      availableBalance: 125000.00 + netRevenue, // Base balance + earnings
      pendingBalance: 15000.00,
      currency: 'LKR',
      lastUpdated: new Date().toISOString()
    };

    console.log('[PAYDPI_MOCK] Merchant balance:', response);
    return response;
  }

  /**
   * Mock Transaction History
   */
  async getTransactionHistory(filters = {}) {
    console.log('[PAYDPI_MOCK] Getting transaction history (no HTTP call):', filters);

    // Simulate processing delay
    await this.simulateDelay();

    // Generate mock transactions from stored payments
    const mockTransactions = [];
    const { limit = 20, offset = 0 } = filters;

    // Convert payments to transactions
    Array.from(this.payments.values()).forEach(payment => {
      if (payment.status === 'COMPLETED') {
        mockTransactions.push({
          paymentId: payment.paymentId,
          orderId: payment.orderId,
          type: 'PAYMENT',
          status: payment.status,
          amount: payment.amount,
          fees: payment.fees,
          netAmount: payment.amount - payment.fees,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod || 'CREDIT_CARD',
          customerName: payment.customerInfo?.name || 'Customer',
          description: payment.description,
          createdAt: payment.initiatedAt,
          settledAt: payment.completedAt
        });
      }
    });

    // Convert refunds to transactions
    Array.from(this.refunds.values()).forEach(refund => {
      if (refund.status === 'COMPLETED') {
        mockTransactions.push({
          paymentId: refund.refundId,
          orderId: refund.paymentId,
          type: 'REFUND',
          status: refund.status,
          amount: -refund.amount,
          fees: 0,
          netAmount: -refund.amount,
          currency: 'LKR',
          paymentMethod: 'REFUND',
          customerName: 'Refund Transaction',
          description: refund.reason,
          createdAt: refund.initiatedAt,
          settledAt: refund.completedAt
        });
      }
    });

    // Sort by creation date (newest first)
    mockTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const total = mockTransactions.length;
    const paginatedTransactions = mockTransactions.slice(offset, offset + limit);

    const response = {
      success: true,
      transactions: paginatedTransactions,
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrevious: offset > 0
      }
    };

    console.log('[PAYDPI_MOCK] Transaction history:', response.transactions.length, 'transactions');
    return response;
  }

  /**
   * Mock Webhook Signature Verification
   */
  async verifyWebhookSignature(payload, signature, timestamp) {
    console.log('[PAYDPI_MOCK] Verifying webhook signature (no HTTP call)');

    // Simulate processing delay
    await this.simulateDelay(10, 50);

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

      const providedSignature = signature.replace('v1=', '');
      const valid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );

      const response = { valid };
      console.log('[PAYDPI_MOCK] Webhook verification:', response);
      return response;

    } catch (error) {
      const response = { valid: false };
      console.log('[PAYDPI_MOCK] Webhook verification failed:', response);
      return response;
    }
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods() {
    return [
      {
        method: 'CREDIT_CARD',
        name: 'Credit Card',
        fee: '2.5%',
        processingTime: 'Instant'
      },
      {
        method: 'DEBIT_CARD',
        name: 'Debit Card',
        fee: '2.5%',
        processingTime: 'Instant'
      },
      {
        method: 'DIGITAL_WALLET',
        name: 'Digital Wallet',
        fee: '1.5%',
        processingTime: 'Instant'
      },
      {
        method: 'BANK_TRANSFER',
        name: 'Bank Transfer',
        fee: '1.0%',
        processingTime: '1-2 business days'
      },
      {
        method: 'QR_CODE',
        name: 'QR Code Payment',
        fee: '1.5%',
        processingTime: 'Instant'
      }
    ];
  }
}

module.exports = PayDPIClient;