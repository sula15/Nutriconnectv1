import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Staff Dashboard 👨‍🍳</h1>
        <p>Welcome, {user?.profile.name}!</p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2>📋 Menu Management</h2>
          <p>Manage daily menus and nutrition information.</p>
          <button className="action-btn">Update Today's Menu</button>
          <button className="action-btn">Plan Weekly Menu</button>
        </div>

        <div className="card">
          <h2>📊 Order Analytics</h2>
          <p>View meal order statistics and trends.</p>
          <div className="stats">
            <p>Today's Orders: 142</p>
            <p>Popular Meal: Rice & Curry</p>
            <p>Revenue: Rs. 8,500</p>
          </div>
        </div>

        <div className="card">
          <h2>💳 Subsidy Management</h2>
          <p>Process government subsidies and payments.</p>
          <button className="action-btn">Process Subsidies</button>
          <button className="action-btn">Generate Report</button>
        </div>
      </div>
    </div>
  );
};
