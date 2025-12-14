"use client";

import { useState, useEffect } from "react";
import { systemAPI } from "../../lib/api";
import {
  Server,
  Shield,
  Database,
  Clock,
  HardDrive,
  Cpu,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
  Download,
  Filter,
} from "lucide-react";

const SystemSettings = () => {
  const [systemData, setSystemData] = useState(null);
  const [securityLogs, setSecurityLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logsPage, setLogsPage] = useState(1);
  const [logFilters, setLogFilters] = useState({
    eventType: "",
    userType: "",
  });
  const [clearLogsModal, setClearLogsModal] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);

  useEffect(() => {
    fetchSystemData();
    fetchSecurityLogs();
  }, []);

  useEffect(() => {
    fetchSecurityLogs();
  }, [logsPage, logFilters]);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const response = await systemAPI.getSystemSettings();
      if (response.data.success) {
        setSystemData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching system data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await systemAPI.getSecurityLogs(
        logsPage,
        20,
        logFilters.eventType,
        logFilters.userType
      );
      if (response.data.success) {
        setSecurityLogs(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching security logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleClearLogs = async (olderThan) => {
    try {
      setClearingLogs(true);
      const response = await systemAPI.clearSecurityLogs(olderThan || null);
      if (response.data.success) {
        alert(
          `Successfully cleared ${response.data.data.deletedCount} log entries`
        );
        fetchSecurityLogs();
        setClearLogsModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error clearing logs");
    } finally {
      setClearingLogs(false);
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case "login":
        return "bg-green-100 text-green-800";
      case "login_failed":
        return "bg-red-100 text-red-800";
      case "admin_action":
        return "bg-blue-100 text-blue-800";
      case "user_action":
        return "bg-yellow-100 text-yellow-800";
      case "security_violation":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-famtech-green"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">Error: {error}</p>
            <button
              onClick={fetchSystemData}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                System Management
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor system health and security logs
              </p>
            </div>
            <button
              onClick={fetchSystemData}
              className="flex items-center bg-famtech-green text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* System Information */}
        {systemData && (
          <>
            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Server className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Platform
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {systemData.system.platform}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Uptime</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatUptime(systemData.system.uptime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Cpu className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Node Version
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {systemData.system.nodeVersion}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Database className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Environment
                    </p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {systemData.system.environment}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <HardDrive className="h-5 w-5 mr-2" />
                  Memory Usage
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      RSS (Resident Set Size)
                    </span>
                    <span className="font-medium">
                      {formatBytes(systemData.system.memoryUsage.rss)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Heap Total</span>
                    <span className="font-medium">
                      {formatBytes(systemData.system.memoryUsage.heapTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Heap Used</span>
                    <span className="font-medium">
                      {formatBytes(systemData.system.memoryUsage.heapUsed)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">External</span>
                    <span className="font-medium">
                      {formatBytes(systemData.system.memoryUsage.external)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="font-medium text-famtech-green">
                      {systemData.database.totalUsers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Super Admins</span>
                    <span className="font-medium text-blue-600">
                      {systemData.database.totalSuperAdmins.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-xs text-gray-500">
                      {new Date(systemData.system.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Security Logs Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-famtech-green mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Security Logs
                </h3>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setClearLogsModal(true)}
                  className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Logs
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-4 mt-4">
              <select
                value={logFilters.eventType}
                onChange={(e) =>
                  setLogFilters((prev) => ({
                    ...prev,
                    eventType: e.target.value,
                  }))
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-famtech-green focus:border-transparent"
              >
                <option value="">All Event Types</option>
                <option value="login">Login</option>
                <option value="login_failed">Login Failed</option>
                <option value="admin_action">Admin Action</option>
                <option value="user_action">User Action</option>
                <option value="security_violation">Security Violation</option>
              </select>

              <select
                value={logFilters.userType}
                onChange={(e) =>
                  setLogFilters((prev) => ({
                    ...prev,
                    userType: e.target.value,
                  }))
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-famtech-green focus:border-transparent"
              >
                <option value="">All User Types</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          {logsLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-famtech-green mx-auto"></div>
            </div>
          ) : securityLogs && securityLogs.logs ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {securityLogs.logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(
                              log.eventType
                            )}`}
                          >
                            {log.eventType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {log.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {log.userType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ipAddress || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {securityLogs.pagination && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {securityLogs.pagination.currentPage} of{" "}
                    {securityLogs.pagination.totalPages} (
                    {securityLogs.pagination.totalLogs} total logs)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setLogsPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={!securityLogs.pagination.hasPrevious}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setLogsPage((prev) => prev + 1)}
                      disabled={!securityLogs.pagination.hasNext}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No security logs found
            </div>
          )}
        </div>

        {/* Clear Logs Modal */}
        {clearLogsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Clear Security Logs
              </h3>
              <p className="text-gray-600 mb-6">
                Choose how many days of logs to keep, or clear all logs.
              </p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleClearLogs(30)}
                  disabled={clearingLogs}
                  className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Keep last 30 days (clear older)
                </button>
                <button
                  onClick={() => handleClearLogs(7)}
                  disabled={clearingLogs}
                  className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Keep last 7 days (clear older)
                </button>
                <button
                  onClick={() => handleClearLogs(null)}
                  disabled={clearingLogs}
                  className="w-full text-left p-3 border border-red-300 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                >
                  Clear all logs (⚠️ Cannot be undone)
                </button>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setClearLogsModal(false)}
                  disabled={clearingLogs}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;
