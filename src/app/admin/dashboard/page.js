"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Shield,
  Activity,
  TrendingUp,
  Settings,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { getUsers } from "@/lib/api/auth";

import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(loading);
  const [error, setError] = useState({ok: false, message: ""})

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  const [users, setUsers] = useState([]);

  const fetchUStats = async () => {
    // setIsLoading(true)
    try {
      const res = await getUsers();
      setUsers(res);
    } catch (error) {
      setError({
        ok: true,
        message: error?.message
      })
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUStats()
  }, [fetchUStats])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                FamTech Admin
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => console.log("hello")}
                className="flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-800 rounded-md border border-green-300 hover:bg-green-50"
                title="Manage Users"
              >
                <Users size={16} className="mr-1" />
                Users
              </button>

              <button
                onClick={() => router.push("/admin/profile")}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                title="Profile Settings"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <QuickActionCard
            title="User Management"
            description="View, approve, and manage user accounts"
            icon={<Users className="h-6 w-6" />}
            onClick={() => console.log("hello")}
            count={users?.usersCount || 0}
            countLabel="Total Users"
          />

          <QuickActionCard
            title="Pending Approvals"
            description="Review and approve pending user registrations"
            icon={<Clock className="h-6 w-6" />}
            onClick={() => console.log("hello")}
            count={users?.verifiedCount || 0}
            countLabel="Pending"
          />

          <QuickActionCard
            title="Farm Profile's"
            description="Manage farmer's profile and security settings"
            icon={<Settings className="h-6 w-6" />}
            onClick={() => console.log("hello")}
            count={users?.profileCount || 0}
            countLabel={"Total Records"}
          />

          <QuickActionCard
            title="Analytics Dashboard"
            description="View detailed statistics and system insights"
            icon={<TrendingUp className="h-6 w-6" />}
            onClick={() => console.log("hello")}
            count={0}
            countLabel="Total Records"
          />

          <QuickActionCard
            title="System Management"
            description="Monitor system health and security logs"
            icon={<Shield className="h-6 w-6" />}
            onClick={() => console.log("hello")}
            countLabel="Admin Only"
          />
        </div>

        {/* Recent Users */}
        {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Users
              </h3>
              <button
                onClick={() => router.push("/admin/users")}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View All
              </button>
            </div>
          </div>

          <div className="overflow-hidden">
            {dashboardData.recentUsers.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {dashboardData.recentUsers.map((user) => (
                  <li key={user._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-800">
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <StatusBadge status={user.status} />
                        <span className="text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent users</p>
              </div>
            )}
          </div>
        </div> */}

        {/* Error Display */}
        {error.ok && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error?.message}</span>
            </div>
          </div>
        )}
      </main>
    </div>
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

function StatusBadge({ status }) {
  const statusClasses = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    suspended: "bg-red-100 text-red-800",
    rejected: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
        statusClasses[status] || statusClasses.pending
      }`}
    >
      {status || "pending"}
    </span>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  onClick,
  count,
  countLabel,
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:border-green-300 hover:shadow-md cursor-pointer transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-md bg-green-100 text-green-600">{icon}</div>
        {count !== undefined && (
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-xs text-gray-500">{countLabel}</div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <div className="mt-4 flex items-center text-green-600">
        <span className="text-sm font-medium">Manage</span>
        <ArrowRight size={16} className="ml-2" />
      </div>
    </div>
  );
}
