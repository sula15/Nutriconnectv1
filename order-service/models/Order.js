class Order {
  constructor() {
    // In-memory storage for demo (replace with actual database)
    this.orders = [];
    this.counter = 1000;
  }

  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async create(orderData) {
    const orderId = `ORD${this.counter++}${Date.now().toString().slice(-4)}`;
    
    const newOrder = {
      id: orderId,
      ...orderData,
      orderDate: new Date().toISOString(),
      status: 'PENDING',
      paymentStatus: orderData.finalAmount > 0 ? 'PENDING' : 'PAID',
      paymentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.orders.push(newOrder);
    return newOrder;
  }

  /**
   * Find order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object|null>} Order or null
   */
  async findById(orderId) {
    return this.orders.find(order => order.id === orderId) || null;
  }

  /**
   * Find orders by student ID
   * @param {string} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Orders array
   */
  async findByStudent(studentId, options = {}) {
    const { status, limit = 20, offset = 0 } = options;
    
    let studentOrders = this.orders.filter(order => order.studentId === studentId);
    
    if (status) {
      studentOrders = studentOrders.filter(order => order.status === status);
    }

    // Sort by order date (newest first)
    studentOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    // Pagination
    return studentOrders.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  }

  /**
   * Count orders by student
   * @param {string} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Promise<number>} Count of orders
   */
  async countByStudent(studentId, options = {}) {
    const { status } = options;
    
    let studentOrders = this.orders.filter(order => order.studentId === studentId);
    
    if (status) {
      studentOrders = studentOrders.filter(order => order.status === status);
    }

    return studentOrders.length;
  }

  /**
   * Find existing order for date
   * @param {string} studentId - Student ID
   * @param {string} scheduledDate - Scheduled date
   * @returns {Promise<Object|null>} Existing order or null
   */
  async findExistingOrder(studentId, scheduledDate) {
    return this.orders.find(order => 
      order.studentId === studentId && 
      order.scheduledDate === scheduledDate && 
      order.status !== 'CANCELLED'
    ) || null;
  }

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Updated order
   */
  async cancel(orderId, reason) {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) return null;

    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...this.orders[orderIndex].metadata,
        cancelledBy: 'student'
      }
    };

    return this.orders[orderIndex];
  }

  /**
   * Find pending orders for staff
   * @param {string} date - Optional date filter
   * @returns {Promise<Array>} Pending orders
   */
  async findPendingOrders(date) {
    let pendingOrders = this.orders.filter(order => 
      ['PENDING', 'CONFIRMED'].includes(order.status)
    );

    if (date) {
      pendingOrders = pendingOrders.filter(order => order.scheduledDate === date);
    }

    // Sort by scheduled date and order time
    pendingOrders.sort((a, b) => {
      const dateCompare = new Date(a.scheduledDate) - new Date(b.scheduledDate);
      if (dateCompare !== 0) return dateCompare;
      return new Date(a.orderDate) - new Date(b.orderDate);
    });

    return pendingOrders;
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @param {string} staffId - Staff ID
   * @param {string} notes - Staff notes
   * @returns {Promise<Object>} Updated order
   */
  async updateStatus(orderId, status, staffId, notes) {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) return null;

    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: staffId,
      staffNotes: notes,
      statusHistory: [
        ...(this.orders[orderIndex].statusHistory || []),
        {
          status,
          timestamp: new Date().toISOString(),
          staffId,
          notes
        }
      ]
    };

    return this.orders[orderIndex];
  }

  /**
   * Update payment status
   * @param {string} orderId - Order ID
   * @param {string} paymentStatus - New payment status
   * @returns {Promise<Object>} Updated order
   */
  async updatePaymentStatus(orderId, paymentStatus) {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) return null;

    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      paymentStatus,
      updatedAt: new Date().toISOString()
    };

    return this.orders[orderIndex];
  }

  /**
   * Update payment info
   * @param {string} orderId - Order ID
   * @param {Object} paymentInfo - Payment information
   * @returns {Promise<Object>} Updated order
   */
  async updatePaymentInfo(orderId, paymentInfo) {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) return null;

    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      paymentId: paymentInfo.paymentId,
      paymentStatus: paymentInfo.status,
      updatedAt: new Date().toISOString()
    };

    return this.orders[orderIndex];
  }
}

// Export singleton instance
module.exports = new Order();