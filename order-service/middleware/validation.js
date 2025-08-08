/**
 * Validate order request middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function validateOrderRequest(req, res, next) {
  const { mealId, scheduledDate, quantity } = req.body;
  const errors = [];

  // Required field validation
  if (!mealId) errors.push('Meal ID is required');
  if (!scheduledDate) errors.push('Scheduled date is required');
  if (!quantity || quantity < 1) errors.push('Valid quantity is required');

  // Date format validation
  if (scheduledDate && isNaN(Date.parse(scheduledDate))) {
    errors.push('Invalid date format');
  }

  // Quantity validation
  if (quantity && (quantity > 10)) {
    errors.push('Maximum 10 meals per order');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'validation_error',
      message: 'Request validation failed',
      details: errors
    });
  }

  next();
}

/**
 * Validate status update request middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function validateStatusUpdate(req, res, next) {
  const { status } = req.body;
  const validStatuses = ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'validation_error',
      message: 'Valid status is required',
      validStatuses
    });
  }

  next();
}

module.exports = {
  validateOrderRequest,
  validateStatusUpdate
};