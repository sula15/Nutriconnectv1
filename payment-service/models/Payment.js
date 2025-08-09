class Payment {
  constructor() {
    this.payments = [];
    this.counter = 1000;
  }

  async create(paymentData) {
    const payment = {
      ...paymentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      refunds: []
    };

    this.payments.push(payment);
    return payment;
  }

  async findById(paymentId) {
    return this.payments.find(payment => payment.id === paymentId) || null;
  }

  async findByUser(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    let userPayments = this.payments.filter(payment => payment.studentId === userId);
    userPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return userPayments.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  }

  async countByUser(userId) {
    return this.payments.filter(payment => payment.studentId === userId).length;
  }

  async updateStatus(paymentId, status) {
    const paymentIndex = this.payments.findIndex(payment => payment.id === paymentId);
    if (paymentIndex !== -1) {
      this.payments[paymentIndex].status = status;
      this.payments[paymentIndex].updatedAt = new Date().toISOString();
      return this.payments[paymentIndex];
    }
    return null;
  }

  async updateTransaction(paymentId, transactionData) {
    const paymentIndex = this.payments.findIndex(payment => payment.id === paymentId);
    if (paymentIndex !== -1) {
      Object.assign(this.payments[paymentIndex], transactionData);
      this.payments[paymentIndex].updatedAt = new Date().toISOString();
      return this.payments[paymentIndex];
    }
    return null;
  }

  async setCompletedAt(paymentId, completedAt) {
    const paymentIndex = this.payments.findIndex(payment => payment.id === paymentId);
    if (paymentIndex !== -1) {
      this.payments[paymentIndex].completedAt = completedAt;
      this.payments[paymentIndex].updatedAt = new Date().toISOString();
      return this.payments[paymentIndex];
    }
    return null;
  }

  async addRefund(paymentId, refundData) {
    const paymentIndex = this.payments.findIndex(payment => payment.id === paymentId);
    if (paymentIndex !== -1) {
      this.payments[paymentIndex].refunds.push(refundData);
      this.payments[paymentIndex].updatedAt = new Date().toISOString();
      return this.payments[paymentIndex];
    }
    return null;
  }
}

module.exports = new Payment();