"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import { Shield, Loader } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push("/admin/dashboard");
      } else {
        router.push("/admin/login");
      }
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full">
            <Shield size={40} className="text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          FamTech Admin Portal
        </h1>
        <p className="text-gray-600 mb-8">Secure Administrator Access</p>

        <div className="flex items-center justify-center space-x-2">
          <Loader className="animate-spin text-blue-600" size={20} />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    </div>
  );
}
