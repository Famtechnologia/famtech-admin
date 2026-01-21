"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Clock,
} from "lucide-react";
import { getUsers } from "@/lib/api/auth";

import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(loading);
  const [error, setError] = useState({ ok: false, message: "" });

  const [users, setUsers] = useState([]);

  const fetchUStats = async () => {
    // setIsLoading(true)
    try {
      const res = await getUsers();
      setUsers(res);
    } catch (error) {
      setError({
        ok: true,
        message: error?.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUStats();
  }, [fetchUStats]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="animate-spin text-green-600" size={32} />
          <p className="text-gray-700">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full mx-auto p-6 min-h-screen bg-gray-50">
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">
          Monitor and manage your platform from here.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={users?.usersCount || 0}
          icon={<Users className="h-8 w-8" />}
          color="green"
          change="+2%"
        />

        <StatCard
          title="Verified Users"
          value={users?.verifiedCount || 0}
          icon={<CheckCircle className="h-8 w-8" />}
          color="green"
          change="+5%"
        />

        <StatCard
          title="Unverified Users"
          value={users?.unverifiedCount || 0}
          icon={<Clock className="h-8 w-8" />}
          color="green"
          change="+8%"
        />

        <StatCard
          title="Farm Profile"
          value={users?.profileCount || 0}
          icon={<TrendingUp className="h-8 w-8" />}
          color="purple"
          change="+15%"
        />
      </div>
    </main>
  );
}

function StatCard({ title, value, icon, color, change }) {
  const colorClasses = {
    green: "text-green-600 bg-green-100",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-md ${colorClasses.green}`}>{icon}</div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className="ml-2 text-sm font-medium text-green-600">{change}</p>
          )}
        </div>
      </div>
    </div>
  );
}
