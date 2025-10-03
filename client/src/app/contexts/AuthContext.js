"use client";

import { createContext, useContext, useReducer, useEffect } from "react";
import Cookies from "js-cookie";
import { adminAuthAPI } from "../lib/api";

// Auth State Types
const AUTH_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGOUT: "LOGOUT",
  UPDATE_USER: "UPDATE_USER",
  SET_ERROR: "SET_ERROR",
};

// Initial State
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    default:
      return state;
  }
};

// Create Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = Cookies.get("adminToken");
      const userData = Cookies.get("adminUser");

      if (token && userData) {
        const user = JSON.parse(userData);

        // Verify token is still valid
        try {
          await adminAuthAPI.verifyToken();

          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user, token },
          });
        } catch (error) {
          // Token is invalid, clear cookies
          logout();
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const login = async ({ token, user, tokenExpiry, rememberMe }) => {
    try {
      // Store in cookies
      const cookieOptions = {
        expires: rememberMe ? 30 : 1, // 30 days or 1 day
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      };

      Cookies.set("adminToken", token, cookieOptions);
      Cookies.set("adminUser", JSON.stringify(user), cookieOptions);

      // Set axios default authorization header
      adminAuthAPI.setAuthHeader(token);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: "Login failed",
      });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      // Clear cookies
      Cookies.remove("adminToken");
      Cookies.remove("adminUser");

      // Clear axios auth header
      adminAuthAPI.clearAuthHeader();

      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      return { success: true };
    } catch (error) {
      console.error("Logout failed:", error);
      return { success: false, error: error.message };
    }
  };

  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData,
    });

    // Update cookie
    const existingUser = JSON.parse(Cookies.get("adminUser") || "{}");
    const updatedUser = { ...existingUser, ...userData };

    const cookieOptions = {
      expires: 30,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    Cookies.set("adminUser", JSON.stringify(updatedUser), cookieOptions);
  };

  const clearError = () => {
    dispatch({
      type: AUTH_ACTIONS.SET_ERROR,
      payload: null,
    });
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Check if user is SuperAdmin
  const isSuperAdmin = () => {
    return state.user?.role === "superadmin";
  };

  // Check if user is Admin or higher
  const isAdmin = () => {
    return ["admin", "superadmin"].includes(state.user?.role);
  };

  const contextValue = {
    // State
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,

    // Actions
    login,
    logout,
    updateUser,
    clearError,

    // Utilities
    hasRole,
    isSuperAdmin,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;
