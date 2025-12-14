"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "lucide-react";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const router = useRouter();
  const { isAuthenticated, user, loading, hasRole } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/admin/login");
      return;
    }

    if (!loading && isAuthenticated && requiredRole && !hasRole(requiredRole)) {
      // Redirect to unauthorized page or dashboard
      router.push("/admin/dashboard");
      return;
    }
  }, [isAuthenticated, loading, user, requiredRole, router, hasRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="animate-spin text-blue-600" size={32} />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
