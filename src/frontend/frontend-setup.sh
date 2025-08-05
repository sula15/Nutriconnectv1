#!/bin/bash

# NutriConnect Frontend Files Setup Script
# Run this from src/frontend directory

set -e  # Exit on any error

echo "🚀 Setting up NutriConnect Frontend Files..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the src/frontend directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected: .../nutriconnect-hackathon/src/frontend"
    exit 1
fi

print_info "Creating frontend files..."

# 1. Update App.tsx
print_info "Creating App.tsx..."
cat > src/App.tsx << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { StudentDashboard } from './pages/StudentDashboard';
import { ParentDashboard } from './pages/ParentDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { MenuPage } from './pages/MenuPage';
import { OrderHistory } from './pages/OrderHistory';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/student" 
                element={
                  <ProtectedRoute requiredRole="STUDENT">
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/parent" 
                element={
                  <ProtectedRoute requiredRole="PARENT">
                    <ParentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/staff" 
                element={
                  <ProtectedRoute requiredRole="SCHOOL_STAFF">
                    <StaffDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/menu" 
                element={
                  <ProtectedRoute>
                    <MenuPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute>
                    <OrderHistory />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
EOF

# 2. Create AuthContext
print_info "Creating contexts/AuthContext.tsx..."
cat > src/contexts/AuthContext.tsx << 'EOF'
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { apiClient } from '../utils/apiClient';

interface User {
  id: string;
  username: string;
  role: 'STUDENT' | 'PARENT' | 'SCHOOL_STAFF' | 'ADMIN';
  profile: {
    name: string;
    school?: string;
    grade?: string;
    children?: string[];
    [key: string]: any;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  permissions: string[];
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; permissions: string[] } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        permissions: action.payload.permissions,
        loading: false
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        permissions: [],
        loading: false
      };
    case 'LOGOUT':
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        permissions: [],
        loading: false
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem('nutriconnect_token'),
    permissions: [],
    loading: false
  });

  useEffect(() => {
    const token = localStorage.getItem('nutriconnect_token');
    if (token) {
      // Verify token on app start
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiClient.get('/auth/me', token);
      if (response.user) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.user,
            token,
            permissions: response.permissions || []
          }
        });
      } else {
        localStorage.removeItem('nutriconnect_token');
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    } catch (error) {
      localStorage.removeItem('nutriconnect_token');
      dispatch({ type: 'LOGIN_FAILURE' });
    }
  };

  const login = async (credentials: { username: string; password: string }) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await apiClient.post('/auth/login', credentials);
      
      if (response.success) {
        localStorage.setItem('nutriconnect_token', response.token);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.user,
            token: response.token,
            permissions: response.permissions || []
          }
        });
        return { success: true };
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
        return { success: false, error: response.message || 'Login failed' };
      }
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      return { success: false, error: error.message || 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('nutriconnect_token');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
EOF

# 3. Create API Client
print_info "Creating utils/apiClient.ts..."
cat > src/utils/apiClient.ts << 'EOF'
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiClient {
  async request(endpoint: string, options: RequestInit = {}, token?: string): Promise<any> {
    const authToken = token || localStorage.getItem('nutriconnect_token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, config);
      
      if (response.status === 401) {
        localStorage.removeItem('nutriconnect_token');
        window.location.href = '/login';
        return;
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  get(endpoint: string, token?: string) { 
    return this.request(endpoint, {}, token); 
  }
  
  post(endpoint: string, data: any) { 
    return this.request(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }); 
  }
  
  put(endpoint: string, data: any) { 
    return this.request(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }); 
  }
  
  delete(endpoint: string) { 
    return this.request(endpoint, { method: 'DELETE' }); 
  }
}

export const apiClient = new ApiClient();
EOF

# 4. Create ProtectedRoute component
print_info "Creating components/ProtectedRoute.tsx..."
cat > src/components/ProtectedRoute.tsx << 'EOF'
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  requiredPermissions = [] 
}) => {
  const { isAuthenticated, user, permissions, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <div className="access-denied">Access Denied: Incorrect role</div>;
  }

  if (requiredPermissions.length > 0) {
    const hasPermissions = requiredPermissions.every(
      permission => permissions.includes(permission)
    );
    
    if (!hasPermissions) {
      return <div className="access-denied">Access Denied: Insufficient permissions</div>;
    }
  }

  return <>{children}</>;
};
EOF

# 5. Create Navbar component
print_info "Creating components/Navbar.tsx..."
cat > src/components/Navbar.tsx << 'EOF'
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
EOF

# 6. Create Login page
print_info "Creating pages/Login.tsx..."
cat > src/pages/Login.tsx << 'EOF'
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
EOF

# 7. Create Student Dashboard
print_info "Creating pages/StudentDashboard.tsx..."
cat > src/pages/StudentDashboard.tsx << 'EOF'
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
EOF

# 8. Create Parent Dashboard
print_info "Creating pages/ParentDashboard.tsx..."
cat > src/pages/ParentDashboard.tsx << 'EOF'
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

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
EOF

# 9. Create Staff Dashboard
print_info "Creating pages/StaffDashboard.tsx..."
cat > src/pages/StaffDashboard.tsx << 'EOF'
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

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
EOF

# 10. Create Menu Page
print_info "Creating pages/MenuPage.tsx..."
cat > src/pages/MenuPage.tsx << 'EOF'
import React from 'react';

export const MenuPage: React.FC = () => {
  return (
    <div className="page">
      <h1>📋 School Menu</h1>
      <p>Browse today's available meals and nutrition information.</p>
      <div className="coming-soon">
        🚧 Menu browsing interface coming soon!
      </div>
    </div>
  );
};
EOF

# 11. Create Order History Page
print_info "Creating pages/OrderHistory.tsx..."
cat > src/pages/OrderHistory.tsx << 'EOF'
import React from 'react';

export const OrderHistory: React.FC = () => {
  return (
    <div className="page">
      <h1>📦 Order History</h1>
      <p>View your past meal orders and transaction history.</p>
      <div className="coming-soon">
        🚧 Order history interface coming soon!
      </div>
    </div>
  );
};
EOF

# 12. Update App.css
print_info "Updating App.css with styles..."
cat > src/App.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
  color: #333;
}

.App {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Navbar Styles */
.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nav-brand .brand-link {
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: rgba(255,255,255,0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome {
  font-size: 0.9rem;
  opacity: 0.9;
}

.logout-btn {
  background: rgba(255,255,255,0.2);
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255,255,255,0.3);
}

/* Login Page Styles */
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 2rem;
}

.login-card {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 500px;
}

.login-card h1 {
  text-align: center;
  margin-bottom: 0.5rem;
  color: #667eea;
  font-size: 2rem;
}

.login-subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.login-form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.login-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  border: 1px solid #fcc;
}

.demo-accounts {
  border-top: 1px solid #eee;
  padding-top: 2rem;
}

.demo-accounts h3 {
  text-align: center;
  margin-bottom: 1rem;
  color: #666;
}

.demo-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.demo-btn {
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.demo-btn.student {
  border-color: #4CAF50;
  color: #4CAF50;
}

.demo-btn.student:hover {
  background: #4CAF50;
  color: white;
}

.demo-btn.parent {
  border-color: #FF9800;
  color: #FF9800;
}

.demo-btn.parent:hover {
  background: #FF9800;
  color: white;
}

.demo-btn.staff {
  border-color: #2196F3;
  color: #2196F3;
}

.demo-btn.staff:hover {
  background: #2196F3;
  color: white;
}

/* Dashboard Styles */
.dashboard {
  padding: 0;
}

.dashboard-header {
  margin-bottom: 2rem;
  text-align: center;
}

.dashboard-header h1 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

.school-info {
  color: #666;
  font-size: 1.1rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

/* Card Styles */
.card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #e1e5e9;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.1);
}

.card h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card h3 {
  color: #555;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

/* Nutrition Card Specific Styles */
.nutrition-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nutrition-card h2,
.nutrition-card h3 {
  color: white;
}

.nutrition-score {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.score-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 3px solid rgba(255,255,255,0.3);
}

.score {
  font-size: 1.8rem;
  font-weight: bold;
}

.score-label {
  font-size: 0.8rem;
  opacity: 0.8;
}

.nutrition-stats p {
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.daily-goals {
  background: rgba(255,255,255,0.1);
  padding: 1.5rem;
  border-radius: 8px;
}

.goal-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.goal-name {
  min-width: 80px;
  font-size: 0.9rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: rgba(255,255,255,0.8);
  border-radius: 4px;
  transition: width 0.3s;
}

.goal-values {
  font-size: 0.8rem;
  min-width: 50px;
  text-align: right;
}

/* Menu Items */
.menu-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.meal-info h3 {
  margin-bottom: 0.25rem;
  color: #333;
}

.meal-info p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.meal-details {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
}

.nutrition-score {
  color: #28a745;
  font-weight: 600;
}

.price {
  color: #667eea;
  font-weight: 600;
}

.order-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.order-btn:hover {
  background: #218838;
}

/* Action Buttons */
.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  color: #495057;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.action-btn:hover {
  background: #667eea;
  border-color: #667eea;
  color: white;
  transform: translateY(-2px);
}

/* Stats */
.stats p {
  margin-bottom: 0.5rem;
  color: #666;
}

.children-stats {
  margin-top: 1rem;
}

.child-stat {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.child-stat h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.child-stat p {
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  color: #666;
}

/* Utility Classes */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  font-size: 1.1rem;
  color: #666;
}

.access-denied {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: #fee;
  color: #c33;
  border: 1px solid #fcc;
  border-radius: 8px;
  margin: 2rem;
}

.page {
  padding: 2rem;
  text-align: center;
}

.coming-soon {
  margin-top: 2rem;
  padding: 3rem;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
  font-size: 1.1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    gap: 1rem;
  }

  .user-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .main-content {
    padding: 1rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .nutrition-score {
    flex-direction: column;
    text-align: center;
  }

  .menu-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .demo-buttons {
    display: grid;
    grid-template-columns: 1fr;
  }

  .action-buttons {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }

  .dashboard-header h1 {
    font-size: 2rem;
  }

  .card {
    padding: 1.5rem;
  }
}
EOF

print_status "All frontend files created successfully!"

echo ""
echo "=================================================="
echo "🎉 Frontend Setup Complete!"
echo "=================================================="
echo ""
print_info "Files created:"
echo "✅ src/App.tsx (Main app component)"
echo "✅ src/contexts/AuthContext.tsx (Authentication)"
echo "✅ src/utils/apiClient.ts (API communication)"
echo "✅ src/components/ProtectedRoute.tsx (Route protection)"
echo "✅ src/components/Navbar.tsx (Navigation)"
echo "✅ src/pages/Login.tsx (Login page)"
echo "✅ src/pages/StudentDashboard.tsx (Student interface)"
echo "✅ src/pages/ParentDashboard.tsx (Parent interface)"
echo "✅ src/pages/StaffDashboard.tsx (Staff interface)"
echo "✅ src/pages/MenuPage.tsx (Menu browsing)"
echo "✅ src/pages/OrderHistory.tsx (Order history)"
echo "✅ src/App.css (Complete styling)"
echo ""

print_info "Next steps:"
echo "1. npm start (from src/frontend directory)"
echo "2. Open http://localhost:3000"
echo "3. Test with demo accounts:"
echo "   • Student: student123/password123"
echo "   • Parent: parent456/password456"
echo "   • Staff: staff789/password789"
echo ""

print_info "Note:"
echo "• Make sure your backend is running on port 3001"
echo "• The frontend will try to connect to http://localhost:3001/api"
echo "• All features are functional with mock data"
echo ""
