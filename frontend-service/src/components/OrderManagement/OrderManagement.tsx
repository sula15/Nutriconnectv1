import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePayment } from '../../contexts/PaymentContext';
import { apiClient } from '../../utils/apiClient';
import './OrderManagement.css';

interface Order {
  id: string;
  mealId: string;
  scheduledDate: string;
  quantity: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  subsidyAmount: number;
  finalAmount: number;
  paymentStatus: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentId?: string;
  orderDate: string;
  dietaryRestrictions?: string[];
  specialInstructions?: string;
  pickupTime?: string;
  metadata: {
    mealName: string;
    nutritionScore: number;
    orderSource?: string;
    apiVersion?: string;
  };
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    staffId?: string;
    notes?: string;
  }>;
}

interface ServiceStatus {
  auth: 'checking' | 'connected' | 'disconnected';
  orders: 'checking' | 'connected' | 'disconnected';
  payments: 'checking' | 'connected' | 'disconnected';
}

export const OrderManagement: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { openPaymentModal } = usePayment(); // Global payment context
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    auth: 'checking',
    orders: 'checking',
    payments: 'checking'
  });
  
  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      checkServicesHealth();
    } else {
      setError('Please login first');
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Listen for global payment completion events
  useEffect(() => {
    const handlePaymentCompleted = (event: CustomEvent) => {
      console.log('🔄 Payment completed globally, refreshing orders...');
      fetchOrders(); // Refresh orders when payment completes
    };

    window.addEventListener('paymentCompleted', handlePaymentCompleted as EventListener);
    
    return () => {
      window.removeEventListener('paymentCompleted', handlePaymentCompleted as EventListener);
    };
  }, []);

  /**
   * Check health of all services
   */
  const checkServicesHealth = async () => {
    console.log('🔍 Checking services health...');
    
    const serviceChecks = [
      { name: 'auth', url: 'http://localhost:3001/health' },
      { name: 'orders', url: 'http://localhost:3002/health' },
      { name: 'payments', url: 'http://localhost:3003/health' }
    ];

    for (const service of serviceChecks) {
      try {
        const response = await fetch(service.url);
        if (response.ok) {
          setServiceStatus(prev => ({ ...prev, [service.name]: 'connected' }));
          console.log(`✅ ${service.name} service connected`);
        } else {
          setServiceStatus(prev => ({ ...prev, [service.name]: 'disconnected' }));
          console.log(`❌ ${service.name} service disconnected`);
        }
      } catch (error) {
        setServiceStatus(prev => ({ ...prev, [service.name]: 'disconnected' }));
        console.log(`❌ ${service.name} service unreachable`);
      }
    }

    // Only fetch orders if order service is available
    if (serviceStatus.orders === 'connected' || serviceStatus.orders === 'checking') {
      fetchOrders();
    } else {
      setError('Order Service is not available (port 3002)');
      setLoading(false);
    }
  };

  /**
   * Fetch orders from Order Service
   */
  const fetchOrders = async () => {
    if (!isAuthenticated) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Fetching orders from Order Service (port 3002)...');
      console.log('🔑 Token present:', !!localStorage.getItem('nutriconnect_token'));
      
      const response = await apiClient.get('/orders');
      console.log('📦 Orders response:', response);
      
      if (response && response.success) {
        setOrders(response.orders || []);
        console.log(`✅ Loaded ${response.orders?.length || 0} orders`);
      } else {
        const errorMsg = response?.message || 'Failed to fetch orders from Order Service';
        setError(errorMsg);
        console.log('❌ Orders API error:', errorMsg);
      }
    } catch (err: any) {
      console.error('❌ Failed to fetch orders:', err);
      setError(`Order Service Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new order
   */
  const createOrder = async (mealId: string, scheduledDate: string, mealName?: string) => {
    if (!isAuthenticated) {
      alert('Please login first');
      return;
    }

    try {
      console.log('🛒 Creating order via Order Service...');
      const response = await apiClient.post('/orders', {
        mealId,
        scheduledDate,
        quantity: 1
      });
      
      console.log('🛒 Order creation response:', response);
      
      if (response && response.success) {
        const order = response.order;
        
        // Show success message with payment info
        if (order.finalAmount > 0) {
          alert(`✅ Order placed successfully!\nOrder ID: ${order.id}\nAmount to pay: Rs. ${order.finalAmount.toFixed(2)}`);
        } else {
          alert(`✅ Order placed successfully!\nOrder ID: ${order.id}\n🎉 Fully subsidized - no payment required!`);
        }
        
        await fetchOrders(); // Refresh list
        
        // Auto-open payment modal if payment required
        if (order.finalAmount > 0) {
          handlePayment(order);
        }
        
        return { success: true, order };
      } else {
        const errorMsg = response?.message || 'Unknown error from Order Service';
        alert(`❌ Failed to place order: ${errorMsg}`);
        return { success: false };
      }
    } catch (err: any) {
      console.error('❌ Order creation error:', err);
      alert(`❌ Order creation failed: ${err.message}`);
      return { success: false };
    }
  };

  /**
   * Cancel an order with confirmation
   */
  const cancelOrder = async (orderId: string, orderName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Order',
      message: `Are you sure you want to cancel your order for "${orderName}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          console.log('🚫 Cancelling order via Order Service:', orderId);
          const response = await apiClient.patch(`/orders/${orderId}/cancel`, { 
            reason: 'Cancelled by student' 
          });
          
          if (response && response.success) {
            alert('✅ Order cancelled successfully');
            await fetchOrders(); // Refresh list
          } else {
            alert(`❌ Failed to cancel: ${response?.message || 'Unknown error'}`);
          }
        } catch (err: any) {
          console.error('❌ Cancel order error:', err);
          alert(`❌ Cancel error: ${err.message}`);
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  /**
   * Open global payment modal for an order
   */
  const handlePayment = (order: Order) => {
    console.log('💳 Opening global payment modal for order:', order.id);
    
    // Transform order to payment format
    const paymentOrder = {
      id: order.id,
      totalAmount: order.totalAmount,
      subsidyAmount: order.subsidyAmount,
      finalAmount: order.finalAmount,
      mealName: order.metadata?.mealName || 'Unknown Meal',
      scheduledDate: order.scheduledDate,
      quantity: order.quantity,
      paymentStatus: order.paymentStatus
    };

    // Use global payment modal context
    openPaymentModal(paymentOrder);
  };

  /**
   * Get tomorrow's date in YYYY-MM-DD format
   */
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Get status badge class
   */
  const getStatusClass = (status: string, type: 'order' | 'payment' = 'order') => {
    const prefix = type === 'order' ? 'status' : 'payment';
    return `${prefix}-${status.toLowerCase()}`;
  };

  /**
   * Get order priority based on status and payment
   */
  const getOrderPriority = (order: Order): 'urgent' | 'normal' | 'completed' => {
    if (order.status === 'PENDING' && order.paymentStatus === 'PENDING' && order.finalAmount > 0) {
      return 'urgent'; // Needs payment
    }
    if (['READY', 'PREPARING'].includes(order.status)) {
      return 'normal'; // In progress
    }
    return 'completed'; // Done or cancelled
  };

  /**
   * Confirmation Dialog Component
   */
  const ConfirmDialog = () => {
    if (!confirmDialog?.isOpen) return null;

    return (
      <div className="confirm-overlay">
        <div className="confirm-dialog">
          <h3>{confirmDialog.title}</h3>
          <p>{confirmDialog.message}</p>
          <div className="confirm-actions">
            <button 
              onClick={() => setConfirmDialog(null)} 
              className="cancel-btn"
            >
              Keep Order
            </button>
            <button 
              onClick={confirmDialog.onConfirm} 
              className="confirm-btn"
            >
              Yes, Cancel Order
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="order-management">
        <div className="auth-required">
          <p>🔐 Please login to view orders</p>
        </div>
      </div>
    );
  }

  // Service unavailable state
  if (serviceStatus.orders === 'disconnected') {
    return (
      <div className="order-management">
        <div className="order-header">
          <h3>📦 Order Management</h3>
        </div>
        
        <div className="service-error">
          <h4>🔧 Order Service Not Available</h4>
          <p>The Order Service (port 3002) is not running or not reachable.</p>
          
          <div className="troubleshooting">
            <h5>Start Order Service:</h5>
            <pre>cd order-service && npm start</pre>
            
            <h5>Test Connection:</h5>
            <p>
              <a href="http://localhost:3002/health" target="_blank" rel="noopener noreferrer">
                http://localhost:3002/health
              </a>
            </p>
          </div>
          
          <button onClick={checkServicesHealth} className="retry-btn">
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Sort orders by priority and date
  const sortedOrders = [...orders].sort((a, b) => {
    const priorityOrder = { 'urgent': 0, 'normal': 1, 'completed': 2 };
    const aPriority = priorityOrder[getOrderPriority(a)];
    const bPriority = priorityOrder[getOrderPriority(b)];
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Sort by date (newest first)
    return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
  });

  return (
    <div className="order-management">
      {/* Confirmation Dialog */}
      <ConfirmDialog />

      {/* Header */}
      <div className="order-header">
        <h3>📦 My Orders</h3>
        <div className="header-actions">
          <button onClick={fetchOrders} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={fetchOrders} className="retry-btn">Try Again</button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading orders from Order Service...</p>
        </div>
      ) : (
        <>
          {/* Orders List */}
          {sortedOrders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">🍽️</div>
              <h4>No orders yet!</h4>
              <p>Start by placing your first meal order.</p>
              <button 
                onClick={() => createOrder('meal_001', getTomorrowDate(), 'Rice & Curry')}
                className="test-order-btn"
              >
                🧪 Create Test Order
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {sortedOrders.map((order) => {
                const priority = getOrderPriority(order);
                
                return (
                  <div key={order.id} className={`order-item priority-${priority}`}>
                    <div className="order-info">
                      <div className="order-main-info">
                        <strong>{order.metadata?.mealName || 'Unknown Meal'}</strong>
                        <div className="order-badges">
                          <span className="order-id">#{order.id.substring(0, 8)}</span>
                          {priority === 'urgent' && (
                            <span className="priority-badge urgent">Payment Required</span>
                          )}
                          {order.finalAmount === 0 && (
                            <span className="priority-badge subsidized">Fully Subsidized</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="order-details">
                        <p><strong>Date:</strong> {formatDate(order.scheduledDate)}</p>
                        <p><strong>Quantity:</strong> {order.quantity}</p>
                        <p><strong>Ordered:</strong> {formatDate(order.orderDate)}</p>
                        {order.pickupTime && (
                          <p><strong>Pickup:</strong> {order.pickupTime}</p>
                        )}
                        {order.specialInstructions && (
                          <p><strong>Instructions:</strong> {order.specialInstructions}</p>
                        )}
                      </div>

                      <div className="order-status-info">
                        <p>
                          <strong>Status:</strong>{' '}
                          <span className={getStatusClass(order.status, 'order')}>
                            {order.status}
                          </span>
                        </p>
                        <p>
                          <strong>Payment:</strong>{' '}
                          <span className={getStatusClass(order.paymentStatus, 'payment')}>
                            {order.paymentStatus}
                          </span>
                        </p>
                      </div>

                      <div className="order-pricing">
                        <div className="price-breakdown">
                          <p>Total: Rs. {order.totalAmount.toFixed(2)}</p>
                          <p className="subsidy">Subsidy: -Rs. {order.subsidyAmount.toFixed(2)}</p>
                          <p className="final-amount">
                            <strong>Final: Rs. {order.finalAmount.toFixed(2)}</strong>
                          </p>
                        </div>
                        
                        {order.metadata?.nutritionScore && (
                          <div className="nutrition-info">
                            <span className="nutrition-score">
                              ⭐ {order.metadata.nutritionScore}/100
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="order-actions">
                      {/* Payment Button - Highest priority */}
                      {order.status === 'PENDING' && 
                       order.paymentStatus === 'PENDING' && 
                       order.finalAmount > 0 && (
                        <button 
                          onClick={() => handlePayment(order)}
                          className="pay-btn primary"
                        >
                          💳 Pay Rs. {order.finalAmount.toFixed(2)}
                        </button>
                      )}

                      {/* Fully Subsidized Badge */}
                      {order.finalAmount === 0 && order.status === 'PENDING' && (
                        <div className="status-badge fully-subsidized">
                          🎉 No Payment Required
                        </div>
                      )}

                      {/* Payment Processing Badge */}
                      {order.paymentStatus === 'PROCESSING' && (
                        <div className="status-badge processing">
                          ⏳ Payment Processing...
                        </div>
                      )}

                      {/* Ready for Pickup Badge */}
                      {order.status === 'READY' && (
                        <div className="status-badge ready">
                          ✅ Ready for Pickup!
                        </div>
                      )}

                      {/* Delivered Badge */}
                      {order.status === 'DELIVERED' && (
                        <div className="status-badge delivered">
                          🎉 Delivered
                        </div>
                      )}

                      {/* Cancel Button */}
                      {order.status === 'PENDING' && (
                        <button 
                          onClick={() => cancelOrder(order.id, order.metadata?.mealName || 'Unknown Meal')}
                          className="cancel-btn secondary"
                        >
                          🚫 Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};