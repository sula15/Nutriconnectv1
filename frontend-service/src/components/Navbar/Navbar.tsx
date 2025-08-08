import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'STUDENT': return '/student';
      case 'PARENT': return '/parent';
      case 'SCHOOL_STAFF': return '/staff';
      default: return '/';
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" className="brand-link">
          🍎 NutriConnect
        </Link>
      </div>
      
      {isAuthenticated && (
        <div className="nav-links">
          <Link to={getDashboardLink()} className="nav-link">Dashboard</Link>
          <Link to="/menu" className="nav-link">Menu</Link>
          <Link to="/orders" className="nav-link">Orders</Link>
          
          <div className="user-info">
            <span className="welcome">Welcome, {user?.profile.name}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      )}
    </nav>
  );
};
