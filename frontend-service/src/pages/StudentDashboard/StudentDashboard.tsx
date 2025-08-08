import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/apiClient';
import { OrderManagement } from '../../components/OrderManagement/OrderManagement';

interface NutritionData {
  weeklyScore: number;
  mealsThisWeek: number;
  subsidyBalance: number;
  dailyGoals: {
    calories: { current: number; target: number };
    protein: { current: number; target: number };
    vegetables: { current: number; target: number };
  };
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [todaysMenu, setTodaysMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setTodaysMenu([
        {
          id: 'meal_001',
          name: 'Rice and Curry',
          description: 'Traditional Sri Lankan rice with mixed vegetables',
          nutritionScore: 85,
          price: 50.00,
          subsidyAmount: 30.00,
          finalPrice: 20.00
        },
        {
          id: 'meal_002',
          name: 'Chicken Sandwich',
          description: 'Grilled chicken sandwich with fresh vegetables',
          nutritionScore: 75,
          price: 80.00,
          subsidyAmount: 20.00,
          finalPrice: 60.00
        }
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const orderMeal = async (mealId: string) => {
    try {
      // Replace mock with actual API call
      const response = await apiClient.post('/orders', {
        mealId,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        quantity: 1
      });
      
      if (response.success) {
        alert(`Order placed successfully! Order ID: ${response.order.id}`);
      } else {
        alert(`Failed to place order: ${response.message}`);
      }
    } catch (error: any) {
      console.error('Failed to order meal:', error);
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.profile.name}! 👋</h1>
        <p className="school-info">{user?.profile.school} - Grade {user?.profile.grade}</p>
      </div>

      <div className="dashboard-grid">
        {/* Existing Today's Menu Card */}
        <div className="card menu-card">
          <h2>🍽️ Today's Menu</h2>
          <div className="menu-items">
            {todaysMenu.map((meal) => (
              <div key={meal.id} className="menu-item">
                <div className="meal-info">
                  <h3>{meal.name}</h3>
                  <p>{meal.description}</p>
                  <div className="meal-details">
                    <span className="nutrition-score">Score: {meal.nutritionScore}/100</span>
                    <span className="price">Rs. {meal.finalPrice} (was Rs. {meal.price})</span>
                  </div>
                </div>
                <button 
                  onClick={() => orderMeal(meal.id)}
                  className="order-btn"
                >
                  Order Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* NEW: Add Order Management Card */}
        <div className="card order-card">
          <OrderManagement />
        </div>
      </div>
    </div>
  );
};