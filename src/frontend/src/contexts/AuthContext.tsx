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
