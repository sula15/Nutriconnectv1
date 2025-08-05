import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/apiClient';

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
      // Mock data for now - replace with actual API calls
      setNutritionData({
        weeklyScore: 85,
        mealsThisWeek: 12,
        subsidyBalance: 850.00,
        dailyGoals: {
          calories: { current: 1200, target: 1800 },
          protein: { current: 45, target: 60 },
          vegetables: { current: 3, target: 5 }
        }
      });

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
      // Mock order - replace with actual API call
      alert(`Meal ordered successfully! Order ID: ${Math.random().toString(36).substr(2, 9)}`);
    } catch (error) {
      console.error('Failed to order meal:', error);
      alert('Failed to order meal. Please try again.');
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
        {/* Nutrition Overview */}
        <div className="card nutrition-card">
          <h2>📊 This Week's Nutrition</h2>
          <div className="nutrition-score">
            <div className="score-circle">
              <span className="score">{nutritionData?.weeklyScore}</span>
              <span className="score-label">Score</span>
            </div>
            <div className="nutrition-stats">
              <p>🍽️ Meals: {nutritionData?.mealsThisWeek}</p>
              <p>💰 Subsidy Balance: Rs. {nutritionData?.subsidyBalance}</p>
            </div>
          </div>

          <div className="daily-goals">
            <h3>Today's Goals</h3>
            {nutritionData && Object.entries(nutritionData.dailyGoals).map(([key, value]) => (
              <div key={key} className="goal-item">
                <span className="goal-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(value.current / value.target) * 100}%` }}
                  ></div>
                </div>
                <span className="goal-values">{value.current}/{value.target}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Menu */}
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

        {/* Quick Actions */}
        <div className="card actions-card">
          <h2>⚡ Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn">📋 View All Menus</button>
            <button className="action-btn">📈 Nutrition Report</button>
            <button className="action-btn">💳 Add Funds</button>
            <button className="action-btn">📝 Give Feedback</button>
          </div>
        </div>
      </div>
    </div>
  );
};
