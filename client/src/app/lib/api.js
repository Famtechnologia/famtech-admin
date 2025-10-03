import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("adminToken="))
            ?.split("=")[1]
        : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      if (typeof window !== "undefined") {
        document.cookie =
          "adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "adminUser=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/admin/login";
      }
    }

    return Promise.reject(error);
  }
);

// Admin Authentication API
export const adminAuthAPI = {
  // Login admin
  login: async (credentials) => {
    try {
      const response = await api.post("/api/admin/login", credentials);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Register admin (initial setup or by superadmin)
  register: async (adminData) => {
    try {
      const response = await api.post("/api/admin/register", adminData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await api.get("/api/admin/profile");
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get current admin profile
  getProfile: async () => {
    try {
      const response = await api.get("/api/admin/profile");
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update admin profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/api/admin/profile", profileData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put(
        "/api/admin/change-password",
        passwordData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get all admins (superadmin only)
  getAllAdmins: async (params = {}) => {
    try {
      const response = await api.get("/api/admin/admins", { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update admin role (superadmin only)
  updateAdminRole: async (adminId, roleData) => {
    try {
      const response = await api.put(
        `/api/admin/admins/${adminId}/role`,
        roleData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete admin (superadmin only)
  deleteAdmin: async (adminId) => {
    try {
      const response = await api.delete(`/api/admin/admins/${adminId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get admin statistics (superadmin only)
  getStatistics: async () => {
    try {
      const response = await api.get("/api/admin/statistics");
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Set auth header manually
  setAuthHeader: (token) => {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  },

  // Clear auth header
  clearAuthHeader: () => {
    delete api.defaults.headers.common["Authorization"];
  },
};

// User Management API (for admin dashboard)
export const userManagementAPI = {
  // Get all users
  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get("/api/admin/users/all", { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Search users
  searchUsers: async (params = {}) => {
    try {
      const response = await api.get("/api/admin/users/search", { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/api/admin/users/${userId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get user statistics
  getUserStatistics: async () => {
    try {
      const response = await api.get("/api/admin/users/stats");
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Approve user
  approveUser: async (userId) => {
    try {
      const response = await api.post(`/api/admin/users/${userId}/approve`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Reject user
  rejectUser: async (userId, reason) => {
    try {
      const response = await api.post(`/api/admin/users/${userId}/reject`, {
        reason,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Suspend user
  suspendUser: async (userId, reason) => {
    try {
      const response = await api.post(`/api/admin/users/${userId}/suspend`, {
        reason,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Reactivate user
  reactivateUser: async (userId) => {
    try {
      const response = await api.post(`/api/admin/users/${userId}/reactivate`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update user role
  updateUserRole: async (userId, roleData) => {
    try {
      const response = await api.put(
        `/api/admin/users/${userId}/role`,
        roleData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId, reason) => {
    try {
      const response = await api.delete(`/api/admin/users/${userId}`, {
        data: { reason },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get pending users
  getPendingUsers: async (params = {}) => {
    try {
      const response = await api.get("/api/admin/users/pending", { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get users by role
  getUsersByRole: async (role, params = {}) => {
    try {
      const response = await api.get(`/api/admin/users/role/${role}`, {
        params,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Bulk approve users
  bulkApproveUsers: async (userIds) => {
    try {
      const response = await api.post("/api/admin/users/bulk-approve", {
        userIds,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

// Analytics API
export const analyticsAPI = {
  // Get general analytics
  getAnalytics: async () => {
    try {
      const response = await api.get("/api/admin/analytics");
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get detailed analytics with filters
  getDetailedAnalytics: async (period = "30d", type = "overview") => {
    try {
      const response = await api.get(
        `/api/admin/analytics/detailed?period=${period}&type=${type}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },
};

// System Management API
export const systemAPI = {
  // Get system settings and information
  getSystemSettings: async () => {
    try {
      const response = await api.get("/api/admin/system/settings");
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get security logs
  getSecurityLogs: async (
    page = 1,
    limit = 20,
    eventType = "",
    userType = ""
  ) => {
    try {
      let url = `/api/admin/system/security-logs?page=${page}&limit=${limit}`;
      if (eventType) url += `&eventType=${eventType}`;
      if (userType) url += `&userType=${userType}`;

      const response = await api.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Clear security logs
  clearSecurityLogs: async (olderThan = null) => {
    try {
      const response = await api.delete("/api/admin/system/security-logs", {
        data: { olderThan },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
