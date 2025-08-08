import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/apiClient';
import './OrderManagement.css'; 

interface Order {
  id: string;
  mealId: string;
  scheduledDate: string;
  quantity: number;
  status: string;
  totalAmount: number;
  subsidyAmount: number;
  finalAmount: number;
  paymentStatus: string;
  metadata: {
    mealName: string;
    nutritionScore: number;
  };
}

export const OrderManagement: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<{
    auth: 'checking' | 'connected' | 'disconnected';
    orders: 'checking' | 'connected' | 'disconnected';
  }>({
    auth: 'checking',
    orders: 'checking'
  });

  useEffect(() => {
    if (isAuthenticated) {
      checkServicesHealth();
    } else {
      setError('Please login first');
      setLoading(false);
    }
  }, [isAuthenticated]);

  const checkServicesHealth = async () => {
    console.log('🔍 Checking services health...');
    
    // Check Auth Service
    try {
      const authResponse = await fetch('http://localhost:3001/health');
      if (authResponse.ok) {
        setServiceStatus(prev => ({ ...prev, auth: 'connected' }));
        console.log('✅ Auth Service connected');
      } else {
        setServiceStatus(prev => ({ ...prev, auth: 'disconnected' }));
        console.log('❌ Auth Service disconnected');
      }
    } catch (error) {
      setServiceStatus(prev => ({ ...prev, auth: 'disconnected' }));
      console.log('❌ Auth Service unreachable');
    }

    // Check Order Service
    try {
      const orderResponse = await fetch('http://localhost:3002/health');
      if (orderResponse.ok) {
        setServiceStatus(prev => ({ ...prev, orders: 'connected' }));
        console.log('✅ Order Service connected');
        fetchOrders();
      } else {
        setServiceStatus(prev => ({ ...prev, orders: 'disconnected' }));
        setError('Order Service is not responding (port 3002)');
        setLoading(false);
      }
    } catch (error) {
      setServiceStatus(prev => ({ ...prev, orders: 'disconnected' }));
      setError('Cannot connect to Order Service on port 3002. Make sure it\'s running.');
      setLoading(false);
    }
  };

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

  const createOrder = async (mealId: string, scheduledDate: string) => {
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
        alert(`✅ Order placed successfully! Order ID: ${response.order.id}`);
        await fetchOrders(); // Refresh list
        return { success: true };
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

  const cancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
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
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="order-management">
        <div className="auth-required">
          <p>🔐 Please login to view orders</p>
        </div>
      </div>
    );
  }

  if (serviceStatus.orders === 'disconnected') {
    return (
      <div className="order-management">
        <div className="order-header">
          <h3>📦 Order Management</h3>
        </div>
        
        <div className="service-error">
          <h4>🔧 Order Service Not Available</h4>
          
          <button onClick={checkServicesHealth} className="retry-btn">
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-management">
      <div className="order-header">
        <h3>📦 My Orders</h3>
        <div className="header-actions">
          <button onClick={fetchOrders} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={fetchOrders} className="retry-btn">Try Again</button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading orders from Order Service...</div>
      ) : orders.length === 0 ? (
        <div className="no-orders">
          <p>No orders yet. Create your first order!</p>
          <button 
            onClick={() => createOrder('meal_001', getTomorrowDate())}
            className="test-order-btn"
          >
            🧪 Create Test Order
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-item">
              <div className="order-info">
                <strong>{order.metadata?.mealName || 'Unknown Meal'}</strong>
                <p>ID: {order.id}</p>
                <p>Date: {new Date(order.scheduledDate).toLocaleDateString()}</p>
                <p>Status: <span className={`status-${order.status.toLowerCase()}`}>{order.status}</span></p>
                <p>Amount: Rs. {order.finalAmount}</p>
              </div>
              
              <div className="order-actions">
                {order.status === 'PENDING' && (
                  <button 
                    onClick={() => cancelOrder(order.id)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="quick-order">
        <h4>🚀 Quick Orders</h4>
        <div className="quick-order-buttons">
          <button 
            onClick={() => createOrder('meal_001', getTomorrowDate())}
            className="quick-order-btn"
          >
            Rice & Curry
          </button>
          <button 
            onClick={() => createOrder('meal_002', getTomorrowDate())}
            className="quick-order-btn"
          >
            Chicken Sandwich
          </button>
        </div>
      </div>
    </div>
  );
};

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};