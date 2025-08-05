import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { login, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case 'STUDENT': navigate('/student'); break;
        case 'PARENT': navigate('/parent'); break;
        case 'SCHOOL_STAFF': navigate('/staff'); break;
        default: navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = await login(credentials);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const handleDemoLogin = (username: string, password: string) => {
    setCredentials({ username, password });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🍎 NutriConnect Login</h1>
        <p className="login-subtitle">Smart School Meals & Subsidy Platform</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="demo-accounts">
          <h3>Demo Accounts:</h3>
          <div className="demo-buttons">
            <button 
              onClick={() => handleDemoLogin('student123', 'password123')}
              className="demo-btn student"
            >
              👨‍🎓 Student Demo
            </button>
            <button 
              onClick={() => handleDemoLogin('parent456', 'password456')}
              className="demo-btn parent"
            >
              👩‍👧‍👦 Parent Demo
            </button>
            <button 
              onClick={() => handleDemoLogin('staff789', 'password789')}
              className="demo-btn staff"
            >
              👨‍🍳 Staff Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
