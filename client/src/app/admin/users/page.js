"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { userManagementAPI } from "../../lib/api";

export default function UserManagement() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Filters and Search
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    role: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/admin/login");
      return;
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, loading, router, currentPage, filters]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const [usersResponse, statsResponse] = await Promise.all([
        userManagementAPI.searchUsers({
          page: currentPage,
          limit: itemsPerPage,
          search: filters.search,
          status: filters.status,
          role: filters.role,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        }),
        userManagementAPI.getUserStatistics(),
      ]);

      if (usersResponse.success) {
        setUsers(usersResponse.data.users || []);
        setTotalUsers(usersResponse.data.total || 0);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch user data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page
  };

  const handleUserAction = async (action, userId, data = {}) => {
    try {
      setError("");

      switch (action) {
        case "approve":
          await userManagementAPI.approveUser(userId);
          break;
        case "reject":
          await userManagementAPI.rejectUser(userId, data.reason);
          break;
        case "suspend":
          await userManagementAPI.suspendUser(userId, data.reason);
          break;
        case "reactivate":
          await userManagementAPI.reactivateUser(userId);
          break;
        case "delete":
          await userManagementAPI.deleteUser(userId, data.reason);
          break;
        default:
          throw new Error("Unknown action");
      }

      // Refresh data
      await fetchData();

      // Close modals
      setShowRejectModal(false);
      setShowSuspendModal(false);
      setSelectedUser(null);
      setRejectReason("");
      setSuspendReason("");
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      setError(`Failed to ${action} user: ${error.message}`);
    }
  };

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  if (loading || isLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="text-gray-600">
                Manage user accounts and permissions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchData}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="flex items-center px-4 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats.totalUsers || 0}
              icon={<Users className="h-6 w-6" />}
              color="green"
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers || 0}
              icon={<CheckCircle className="h-6 w-6" />}
              color="green"
            />
            <StatCard
              title="Pending Approval"
              value={stats.pendingUsers || 0}
              icon={<AlertTriangle className="h-6 w-6" />}
              color="green"
            />
            <StatCard
              title="Suspended Users"
              value={stats.suspendedUsers || 0}
              icon={<XCircle className="h-6 w-6" />}
              color="green"
            />
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search by name, email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="createdAt">Created Date</option>
                <option value="firstName">First Name</option>
                <option value="lastName">Last Name</option>
                <option value="email">Email</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) =>
                  handleFilterChange("sortOrder", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-800">
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                        {user.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleUserAction("approve", user._id)
                              }
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Approve"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRejectModal(true);
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}

                        {user.status === "active" && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowSuspendModal(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-800 p-1"
                            title="Suspend"
                          >
                            <AlertTriangle size={16} />
                          </button>
                        )}

                        {user.status === "suspended" && (
                          <button
                            onClick={() =>
                              handleUserAction("reactivate", user._id)
                            }
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Reactivate"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}

                        {user.status !== "active" && (
                          <button
                            onClick={() =>
                              handleUserAction("delete", user._id, {
                                reason: "Admin decision",
                              })
                            }
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalUsers)} of{" "}
                  {totalUsers} users
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUserModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showRejectModal && selectedUser && (
        <RejectModal
          user={selectedUser}
          reason={rejectReason}
          setReason={setRejectReason}
          onConfirm={() =>
            handleUserAction("reject", selectedUser._id, {
              reason: rejectReason,
            })
          }
          onClose={() => {
            setShowRejectModal(false);
            setSelectedUser(null);
            setRejectReason("");
          }}
        />
      )}

      {showSuspendModal && selectedUser && (
        <SuspendModal
          user={selectedUser}
          reason={suspendReason}
          setReason={setSuspendReason}
          onConfirm={() =>
            handleUserAction("suspend", selectedUser._id, {
              reason: suspendReason,
            })
          }
          onClose={() => {
            setShowSuspendModal(false);
            setSelectedUser(null);
            setSuspendReason("");
          }}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className="p-3 rounded-md bg-green-100 text-green-600">{icon}</div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// Status Badge Component
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

// User Detail Modal
function UserDetailModal({ user, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              User Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Name
                </label>
                <p className="text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Email
                </label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Status
                </label>
                <StatusBadge status={user.status} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Joined
                </label>
                <p className="text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reject Modal
function RejectModal({ user, reason, setReason, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reject User: {user.firstName} {user.lastName}
          </h3>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            rows={3}
          />
          <div className="flex justify-end space-x-4 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!reason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Suspend Modal
function SuspendModal({ user, reason, setReason, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Suspend User: {user.firstName} {user.lastName}
          </h3>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter suspension reason..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            rows={3}
          />
          <div className="flex justify-end space-x-4 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!reason.trim()}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suspend User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
