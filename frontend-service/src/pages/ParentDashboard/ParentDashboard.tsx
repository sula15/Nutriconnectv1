import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Parent Dashboard 👩‍👧‍👦</h1>
        <p>Welcome, {user?.profile.name}!</p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2>👶 Children's Nutrition</h2>
          <p>Monitor your children's meal participation and nutrition intake.</p>
          <div className="children-stats">
            <div className="child-stat">
              <h3>Kasun Perera</h3>
              <p>Weekly Nutrition Score: 85/100</p>
              <p>Meals this week: 12</p>
              <p>Balance: Rs. 450</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>💰 Payment Management</h2>
          <p>Manage meal payments and subsidies.</p>
          <button className="action-btn">Add Funds</button>
          <button className="action-btn">View Transactions</button>
        </div>

        <div className="card">
          <h2>📞 School Communication</h2>
          <p>Connect with school nutrition staff.</p>
          <button className="action-btn">Contact Canteen</button>
          <button className="action-btn">Request Meeting</button>
        </div>
      </div>
    </div>
  );
};
