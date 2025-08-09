function validatePaymentRequest(req, res, next) {
  const { orderId, amount } = req.body;
  const errors = [];

  if (!orderId) errors.push('Order ID is required');
  if (!amount || amount <= 0) errors.push('Valid amount is required');
  if (amount && amount > 10000) errors.push('Amount exceeds maximum limit');

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'validation_error',
      message: 'Payment validation failed',
      details: errors
    });
  }

  next();
}

module.exports = { validatePaymentRequest };