import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar/Navbar';
import { Login } from './pages/Login/Login';
import { StudentDashboard } from './pages/StudentDashboard/StudentDashboard';
import { ParentDashboard } from './pages/ParentDashboard/ParentDashboard';
import { StaffDashboard } from './pages/StaffDashboard/StaffDashboard';
import { MenuPage } from './pages/Menu/MenuPage';
import { OrderHistory } from './pages/OrderHistory/OrderHistory';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
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
