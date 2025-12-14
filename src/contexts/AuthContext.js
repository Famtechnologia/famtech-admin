"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { profile } from "../lib/api/auth";
import { useRouter } from "next/navigation";

// Create Context
const AuthContext = createContext();

// Helper to get cookie by name
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

// Helper to set cookie
const setCookie = (name, value, days) => {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};

// Helper to delete cookie
const deleteCookie = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Auth from Cookie
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getCookie("famtech-token");

      if (storedToken) {
        setToken(storedToken);
        setIsAuthenticated(true);

        const res = await profile();
        console.log(res);
        setUser({
          firstName: "Admin",
          lastName: "User",
          role: "admin",
        });
      } else {
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
        router.replace("/auth/login");
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const logout = () => {
    deleteCookie("famtech-token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    router.replace("/auth/login");
    // Router redirect handled by protected routes or components
  };

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  const clearError = () => {
    setError(null);
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user is SuperAdmin
  const isSuperAdmin = () => {
    return user?.role === "superadmin";
  };

  // Check if user is Admin or higher
  const isAdmin = () => {
    return ["admin", "superadmin"].includes(user?.role);
  };

  const contextValue = {
    // State
    isAuthenticated,
    user,
    token,
    loading,
    error,

    // Actions
    logout,
    updateUser,
    clearError,

    // Utilities
    hasRole,
    isSuperAdmin,
    isAdmin,

    // Cookies
    getCookie,
    setCookie,
    deleteCookie,
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
