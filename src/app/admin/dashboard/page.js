"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Clock,
  Download,
  Plus,
  Shield,
  AlertCircle,
  DollarSign,
  CheckSquare,
  UserPlus,
} from "lucide-react";
import { getUsers } from "@/lib/api/user";
import { useSocket } from "@/lib/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  // const { user, logout } = useAuth();
  const { customers } = useSocket();

  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingFarmers: 0,
    activeRevenue: 0,
    openComplaints: 0,
  });

  const fetchChatStats = useCallback(() => {

    const uniqueCustomers = Array.from(
        new Map(
          (customers || []).map((customer) => [customer.userId, customer]),
        ).values(),
      );

    setStats((prev) => ({
      ...prev,
      openComplaints: uniqueCustomers.length,
    }));
  }, [customers]);

  useEffect(() => {
    fetchChatStats();
  }, [fetchChatStats]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getUsers(5000, 1);
      if (!res.ok) {
        console.error("Failed to fetch users data:", res.statusText);
        return;
      }
      
      setStats((prev) => ({
        ...prev,
        totalUsers: res?.data?.farmers.length,
        pendingFarmers: res?.data?.farmers.filter((u) => u.isVerified === false).length || 0,
      }));
    }
    catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const activityLog = [
    {
      id: 1,
      user: "David Miller",
      action: "approved farmer application for",
      target: "Green Valley Coop",
      badge: "Approval",
      badgeColor: "bg-green-100 text-green-800",
      time: "2 mins ago",
    },
    {
      id: 2,
      user: "Jessica Wong",
      action: "banned account",
      target: "@agri_bot_99",
      detail: "for spam",
      badge: "Enforcement",
      badgeColor: "bg-red-100 text-red-800",
      time: "45 mins ago",
    },
    {
      id: 3,
      user: "Marcus T.",
      action: "updated the subscription tier pricing",
      badge: "System",
      badgeColor: "bg-blue-100 text-blue-800",
      time: "2 hours ago",
      detail: "Config: core_rev_v2",
    },
    {
      id: 4,
      user: "Automated Bot",
      action: "flagged 12 suspicious transactions in Content Creator module",
      badge: "Security",
      badgeColor: "bg-yellow-100 text-yellow-800",
      time: "5 hours ago",
    },
  ];

  return (
    <main className="w-full mx-auto p-6 min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Overview</h1>
            <p className="text-gray-600">Real-time performance monitoring and enterprise control.</p>
          </div>
          <div className="flex gap-3 max-sm:hidden">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <Download size={20} />
              <span>Export Report</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium" onClick={() => router.push("/admin/staffs/create")}>
              <Plus size={20} />
              <span>Create New Admin</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Users size={24} className="text-green-600" />
              </div>
              <div className="text-green-600 text-sm font-semibold flex items-center gap-1">
                <TrendingUp size={16} />
                +12%
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>

          {/* Pending Farmers */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-green-200 p-3 rounded-lg">
                <CheckCircle size={24} className="text-green-700" />
              </div>
              <p className="text-green-600 text-xs font-semibold">{Math.floor((stats?.totalUsers - stats?.pendingFarmers) * 100 / (stats?.totalUsers || 1))}% Verified</p>
            </div>
            <p className="text-gray-600 text-sm mb-1">Pending Farmers</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingFarmers}</p>
            <div className="mt-4 h-1 bg-green-500 rounded w-2/3"></div>
          </div>

          {/* Active Revenue */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign size={24} className="text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Active Revenue</p>
            <p className="text-3xl font-bold text-gray-900">{new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
}).format(stats?.activeRevenue || 0)}</p>
          </div>

          {/* Open Complaints */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertCircle size={24} className="text-orange-600" />
              </div>
              <p className="text-orange-600 text-xs font-semibold">Urgent: 4</p>
            </div>
            <p className="text-gray-600 text-sm mb-1">Open Complaints</p>
            <p className="text-3xl font-bold text-gray-900">{stats.openComplaints}</p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Activity Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Admin Activity Feed</h2>
                <p className="text-sm text-gray-600 mt-1">Recent moderation, security, and system actions.</p>
              </div>
              <Link href="/admin/logs" className="text-sm font-semibold text-green-700 hover:text-green-800 whitespace-nowrap">
                View All Logs →
              </Link>
            </div>

            <div className="space-y-4">
              {activityLog.map((item, index) => (
                <div key={item.id} className="relative rounded-lg border border-gray-100 bg-gray-50/70 p-4">
                  {index !== activityLog.length - 1 && (
                    <div className="absolute left-8 top-12 bottom-0 w-px bg-gray-200" />
                  )}

                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-600" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${item.badgeColor}`}>
                        {item.badge}
                        </span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{item.time}</span>
                      </div>

                      <div className="flex items-baseline gap-2 flex-wrap text-sm">
                        <span className="font-semibold text-gray-900">{item.user}</span>
                        <span className="text-gray-600">{item.action}</span>
                        {item.target && <span className="font-semibold text-gray-900">{item.target}</span>}
                      </div>

                      {item.detail && (
                        <p className="text-gray-600 text-sm mt-2">{item.detail}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Management */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Management</h2>

            <div className="space-y-4">
              {/* Create Admin */}
              <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition" onClick={() => router.push("/admin/staffs/create")}>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded">
                    <UserPlus size={20} className="text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Create Admin</p>
                    <p className="text-sm text-gray-600">Add new staff members</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              {/* Manage Roles */}
              <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition" onClick={() => router.push("/admin/staffs")}>
                <div className="flex items-center gap-3">
                  <div className="bg-green-200 p-2 rounded">
                    <Shield size={20} className="text-green-700" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Manage Roles</p>
                    <p className="text-sm text-gray-600">Edit permissions levels</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              {/* Review Appeals */}
              <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition" onClick={() => router.push("/admin/farmers")}>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded">
                    <CheckSquare size={20} className="text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Review Appeals</p>
                    <p className="text-sm text-gray-600">6 pending user appeals</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

