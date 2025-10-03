"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, AlertCircle, Loader } from "lucide-react";
import { adminAuthAPI } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminLogin() {
  const router = useRouter();
  const { login, isAuthenticated, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [formState, setFormState] = useState({
    showPassword: false,
    isLoading: false,
    error: "",
    rememberMe: false,
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push("/admin/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormState((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (formState.error) {
      setFormState((prev) => ({ ...prev, error: "" }));
    }
  };

  const togglePasswordVisibility = () => {
    setFormState((prev) => ({
      ...prev,
      showPassword: !prev.showPassword,
    }));
  };

  const validateForm = () => {
    if (!formData.email) {
      return "Email is required";
    }

    if (!formData.email.includes("@")) {
      return "Please enter a valid email address";
    }

    if (!formData.password) {
      return "Password is required";
    }

    if (formData.password.length < 8) {
      return "Password must be at least 8 characters long";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormState((prev) => ({ ...prev, error: validationError }));
      return;
    }

    setFormState((prev) => ({ ...prev, isLoading: true, error: "" }));

    try {
      const response = await adminAuthAPI.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        // Store token and admin info
        const { token, admin, tokenExpiry } = response.data;

        await login({
          token,
          user: admin,
          tokenExpiry,
          rememberMe: formState.rememberMe,
        });

        // Redirect to dashboard
        router.push("/admin/dashboard");
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);

      let errorMessage = "An error occurred during login";

      if (error.response?.status === 401) {
        errorMessage = "Invalid email or password";
      } else if (error.response?.status === 403) {
        errorMessage = "Account is locked or inactive";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many login attempts. Please try again later";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setFormState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="animate-spin text-green-600" size={32} />
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <Shield size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            FamTech Admin
          </h1>
          <p className="text-gray-600">Secure Administrator Access Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {formState.error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-600" />
              <span className="text-red-800 text-sm">{formState.error}</span>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="admin@famtech.com"
              required
              autoComplete="email"
              disabled={formState.isLoading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={formState.showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={formState.isLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                disabled={formState.isLoading}
                aria-label={
                  formState.showPassword ? "Hide password" : "Show password"
                }
              >
                {formState.showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formState.rememberMe}
                onChange={handleInputChange}
                disabled={formState.isLoading}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:cursor-not-allowed"
              />
              <span className="ml-2 text-sm text-gray-600">
                Remember me for 30 days
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={formState.isLoading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {formState.isLoading ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-4 w-4" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Protected by advanced security protocols
          </p>
        </div>
      </div>
    </div>
  );
}
