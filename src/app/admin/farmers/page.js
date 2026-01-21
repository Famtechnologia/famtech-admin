"use client";

import { useEffect, useState, useCallback, use } from "react";
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
import { getUsers, deleteMultipleUser, toggleVerify } from "@/lib/api/user";
import { verifyCode } from "@/lib/api/auth";

import { useAuth } from "@/contexts/AuthContext";
import FormSelect from "@/components/FormSelect";

import Link from "next/link";

export default function UserManagement() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
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

  // Bulk action modals
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [showUnverifyConfirm, setShowUnverifyConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Selected users for bulk actions
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      // Replace with actual API calls
      const res = await getUsers(itemsPerPage, currentPage);

      if (res.ok) {
        setUsers(res?.data?.farmers || []);
        setTotalUsers(res?.data?.pagination || 0);

        return;
      }

      setUsers([]);
      setTotalUsers(0);
    } catch (error) {
      setError("Failed to fetch user data");
    } finally {
      setIsLoading(false);
    }
  }, []); // Added empty dependency array

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, currentPage]);

  const handleBulkVerify = async () => {
    try {
      setIsVerifying(true);
      setError("");
      setSuccessMessage("");

      const verifyResult = await verifyCode(verificationCode, user?.email);
      
      if (!verifyResult || verifyResult.ok === false) {
        setError(verifyResult?.message || "Invalid verification code");
        setShowVerifyConfirm(false);
        setVerificationCode("");
        setIsVerifying(false);
        return;
      }

      const userIds = Array.from(selectedUserIds);
      for (const userId of userIds) {
        await toggleVerify(userId);
      }

      setSuccessMessage(`${userIds.length} user(s) verified successfully!`);
      setShowVerifyConfirm(false);
      setVerificationCode("");
      setSelectedUserIds(new Set());
      await fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error verifying users:", error);
      setError(error.message || "Failed to verify users");
      setShowVerifyConfirm(false);
      setVerificationCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBulkUnverify = async () => {
    try {
      setIsVerifying(true);
      setError("");
      setSuccessMessage("");

      const verifyResult = await verifyCode(verificationCode, user?.email);
      
      if (!verifyResult || verifyResult.ok === false) {
        setError(verifyResult?.message || "Invalid verification code");
        setShowUnverifyConfirm(false);
        setVerificationCode("");
        setIsVerifying(false);
        return;
      }

      const userIds = Array.from(selectedUserIds);
      for (const userId of userIds) {
        await toggleVerify(userId);
      }

      setSuccessMessage(`${userIds.length} user(s) unverified successfully!`);
      setShowUnverifyConfirm(false);
      setVerificationCode("");
      setSelectedUserIds(new Set());
      await fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error unverifying users:", error);
      setError(error.message || "Failed to unverify users");
      setShowUnverifyConfirm(false);
      setVerificationCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setIsVerifying(true);
      setError("");
      setSuccessMessage("");

      const verifyResult = await verifyCode(verificationCode, user?.email);
      
      if (!verifyResult || verifyResult.ok === false) {
        setError(verifyResult?.message || "Invalid verification code");
        setShowDeleteConfirm(false);
        setVerificationCode("");
        setIsVerifying(false);
        return;
      }

      const userIds = Array.from(selectedUserIds);
      const result = await deleteMultipleUser(userIds);

      if (result && result.ok === false) {
        throw new Error(result?.message || "Failed to delete users");
      }

      setSuccessMessage(result?.message || `${userIds.length} user(s) deleted successfully!`);
      setShowDeleteConfirm(false);
      setVerificationCode("");
      setSelectedUserIds(new Set());
      await fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting users:", error);
      setError(error.message || "Failed to delete users");
      setShowDeleteConfirm(false);
      setVerificationCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  // Filter and sort users based on filters
  useEffect(() => {
    let filtered = [...users];

    // Search by email
    if (filters.search) {
      filtered = filtered.filter((user) =>
        user.email.toLowerCase().includes(filters.search.toLowerCase()),
      );
    }

    // Filter by verification status
    if (filters.status) {
      if (filters.status === "verified") {
        filtered = filtered.filter((user) => user.isVerified === true);
      } else if (filters.status === "unverified") {
        filtered = filtered.filter((user) => user.isVerified === false);
      }
    }

    // Sort users
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];

      if (filters.sortBy === "createdAt" || filters.sortBy === "updatedAt") {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return filters.sortOrder === "desc" ? aDate - bDate : bDate - aDate;
      }

      // For string fields
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue
          .toLowerCase()
          .localeCompare(bValue.toLowerCase());
        return filters.sortOrder === "desc" ? comparison : -comparison;
      }

      return 0;
    });

    setFilteredUsers(filtered);
  }, [users, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const handleSelect = (userId) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (
      selectedUserIds.size === filteredUsers.length &&
      filteredUsers.length > 0
    ) {
      setSelectedUserIds(new Set());
    } else {
      const allIds = new Set(filteredUsers.map((user) => user._id));
      setSelectedUserIds(allIds);
    }
  };

  const handleDownloadUsers = () => {
    if (filteredUsers.length === 0) {
      setError("No users to download");
      return;
    }

    // Convert users data to CSV
    const headers = [
      "Email",
      "Role",
      "Country",
      "State",
      "LGA",
      "Verified",
      "Joined Date",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredUsers.map((user) =>
        [
          user.email || "",
          user.role || "",
          user.country || "",
          user.state || "",
          user.lga || "",
          user.isVerified ? "Yes" : "No",
          new Date(user.createdAt).toLocaleDateString(),
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `farmers_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(totalUsers?.total / itemsPerPage);

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-green-800">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Filter size={20} className="mr-2 text-green-600" />
                Filters & Search
              </h3>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchUsers}
                className="flex items-center px-4 py-2 bg-transparent text-green-600 rounded-lg border border-green-600 hover:border-green-700 transition-colors"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
              <button
                onClick={handleDownloadUsers}
                disabled={users.length === 0}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download size={16} className="mr-2" />
                Download CSV
              </button>
            </div>
          </div>

          <hr className="my-6 border-b border-gray-200" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search by name, email..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500 transition-colors"
                />
              </div>
            </div>

            {/* Status Filter */}
            <FormSelect
              label="Status"
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              placeholder="All Statuses"
              options={[
                { value: "", label: "All Statuses" },
                { value: "verified", label: "Verified" },
                { value: "unverified", label: "Unverified" },
              ]}
            />

            {/* Sort By Filter */}
            <FormSelect
              label="Sort By"
              value={filters.sortBy}
              onChange={(value) => handleFilterChange("sortBy", value)}
              placeholder="Select field"
              options={[
                { value: "createdAt", label: "Created Date" },
                { value: "email", label: "Email" },
                { value: "country", label: "Country" },
                { value: "state", label: "State" },
              ]}
            />

            {/* Order Filter */}
            <FormSelect
              label="Order"
              value={filters.sortOrder}
              onChange={(value) => handleFilterChange("sortOrder", value)}
              placeholder="Select order"
              options={[
                { value: "desc", label: "Newest First" },
                { value: "asc", label: "Oldest First" },
              ]}
            />
          </div>
        </div>

        {/* Bulk Actions Bar - Only shows when checkboxes are selected */}
        {selectedUserIds.size > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  {selectedUserIds.size} user
                  {selectedUserIds.size > 1 ? "s" : ""} selected
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowVerifyConfirm(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Verify
                </button>

                <button
                  onClick={() => setShowUnverifyConfirm(true)}
                  className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                >
                  <XCircle size={16} className="mr-2" />
                  Unverify
                </button>

                <button
                  onClick={() =>
                    console.log("Send mail to:", Array.from(selectedUserIds))
                  }
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <AlertTriangle size={16} className="mr-2" />
                  Send Mail
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedUserIds.size === filteredUsers.length &&
                        filteredUsers.length > 0
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 cursor-pointer accent-green-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user._id)}
                        onChange={() => handleSelect(user._id)}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 cursor-pointer accent-green-600"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/farmers/${user._id}`}>
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-800 uppercase">
                              {user.email?.[0]}
                              {user.email?.[1]}
                            </span>
                          </div>

                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500 capitalize">
                              {user.role}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <ProfileBadge status={user?.farmProfile ? true : false} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                      {user.country}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                      {user.state}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user?.isVerified ? true : false} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {filteredUsers.length} of {totalUsers?.total} users
                {filters.search || filters.status ? " (filtered)" : ""}
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
        </div>
      </div>

      {/* Verify Confirmation Modal */}
      {showVerifyConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Verify Users</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to verify {selectedUserIds.size} user(s)?
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 4-digit verification code
                </label>
                <input
                  type="text"
                  maxLength="4"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 text-center text-lg tracking-widest"
                  placeholder="0000"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowVerifyConfirm(false);
                    setVerificationCode("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkVerify}
                  disabled={verificationCode.length !== 4 || isVerifying}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? "Verifying..." : "Verify"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unverify Confirmation Modal */}
      {showUnverifyConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Unverify Users</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to unverify {selectedUserIds.size} user(s)?
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 4-digit verification code
                </label>
                <input
                  type="text"
                  maxLength="4"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 text-center text-lg tracking-widest"
                  placeholder="0000"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowUnverifyConfirm(false);
                    setVerificationCode("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUnverify}
                  disabled={verificationCode.length !== 4 || isVerifying}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? "Verifying..." : "Unverify"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Delete Users</h3>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete {selectedUserIds.size} user(s)? This action cannot be undone.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 4-digit verification code
                </label>
                <input
                  type="text"
                  maxLength="4"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 text-center text-lg tracking-widest"
                  placeholder="0000"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setVerificationCode("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={verificationCode.length !== 4 || isVerifying}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? "Verifying..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
     
    </div>
  );
}

function StatusBadge({ status }) {
  const statusClasses = {
    true: "bg-green-100 text-green-800",
    false: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
        statusClasses[status] || statusClasses.pending
      }`}
    >
      {status ? "Verified" : "Unverified"}
    </span>
  );
}
function ProfileBadge({ status }) {
  const statusClasses = {
    true: "bg-green-100 text-green-800",
    false: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
        statusClasses[status] || statusClasses.pending
      }`}
    >
      {status ? "Complete" : "Incomplete"}
    </span>
  );
}
