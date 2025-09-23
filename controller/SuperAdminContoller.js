import User from "../model/User.js";
import SuperAdmin from "../model/SuperAdmin.js";

// Get all users with enhanced information
export const adminGetAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("WeatherInfo");
    res.status(200).json({
      message: "All users retrieved successfully",
      users,
      count: users.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving users",
      error: error.message,
    });
  }
};

// Get user statistics dashboard
export const getUserStatistics = async (req, res) => {
  try {
    const stats = await User.getUserStatistics();
    res.status(200).json({
      message: "User statistics retrieved successfully",
      statistics: stats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving user statistics",
      error: error.message,
    });
  }
};

// Search and filter users with pagination
export const searchUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
      role = "",
      status = "",
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      search,
      role,
      status,
    };

    const result = await User.searchUsers({}, options);

    res.status(200).json({
      message: "Users search completed successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error searching users",
      error: error.message,
    });
  }
};

// Get user by ID with full details
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email")
      .populate("WeatherInfo")
      .populate("farmAssets");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving user",
      error: error.message,
    });
  }
};

// Approve a user registration
export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id; // Assuming you have authentication middleware

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.status === "active") {
      return res.status(400).json({
        message: "User is already approved",
      });
    }

    user.approveUser(adminId);
    await user.save();

    res.status(200).json({
      message: "User approved successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error approving user",
      error: error.message,
    });
  }
};

// Reject a user registration
export const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = "" } = req.body;
    const adminId = req.user?.id; // Assuming you have authentication middleware

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.rejectUser(adminId, reason);
    await user.save();

    res.status(200).json({
      message: "User rejected successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error rejecting user",
      error: error.message,
    });
  }
};

// Suspend a user
export const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = "" } = req.body;
    const adminId = req.user?.id; // Assuming you have authentication middleware

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role === "superadmin") {
      return res.status(403).json({
        message: "Cannot suspend a super admin user",
      });
    }

    user.suspendUser(adminId, reason);
    await user.save();

    res.status(200).json({
      message: "User suspended successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error suspending user",
      error: error.message,
    });
  }
};

// Reactivate a user
export const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id; // Assuming you have authentication middleware

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.status === "active") {
      return res.status(400).json({
        message: "User is already active",
      });
    }

    user.reactivateUser(adminId);
    await user.save();

    res.status(200).json({
      message: "User reactivated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reactivating user",
      error: error.message,
    });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.user?.id; // Assuming you have authentication middleware

    if (
      !role ||
      !["farmer", "admin", "viewer", "superadmin", "advisor"].includes(role)
    ) {
      return res.status(400).json({
        message: "Invalid role specified",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prevent changing superadmin role unless you're a superadmin
    const adminUser = await User.findById(adminId);
    if (user.role === "superadmin" && adminUser?.role !== "superadmin") {
      return res.status(403).json({
        message: "Only super admins can modify super admin roles",
      });
    }

    if (role === "superadmin" && adminUser?.role !== "superadmin") {
      return res.status(403).json({
        message: "Only super admins can assign super admin role",
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    res.status(200).json({
      message: `User role updated from ${oldRole} to ${role}`,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating user role",
      error: error.message,
    });
  }
};

// Get pending user registrations
export const getPendingUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
    };

    const result = await User.searchUsers({ status: "pending" }, options);

    res.status(200).json({
      message: "Pending users retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving pending users",
      error: error.message,
    });
  }
};

// Get users by role
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    if (
      !["farmer", "admin", "viewer", "superadmin", "advisor"].includes(role)
    ) {
      return res.status(400).json({
        message: "Invalid role specified",
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
    };

    const result = await User.searchUsers({ role }, options);

    res.status(200).json({
      message: `Users with role '${role}' retrieved successfully`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving users by role",
      error: error.message,
    });
  }
};

// Bulk approve users
export const bulkApproveUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    const adminId = req.user?.id; // Assuming you have authentication middleware

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        message: "Please provide an array of user IDs",
      });
    }

    const users = await User.find({ _id: { $in: userIds }, status: "pending" });

    if (users.length === 0) {
      return res.status(404).json({
        message: "No pending users found with provided IDs",
      });
    }

    const approvedUsers = [];
    for (const user of users) {
      user.approveUser(adminId);
      await user.save();
      approvedUsers.push(user);
    }

    res.status(200).json({
      message: `${approvedUsers.length} users approved successfully`,
      approvedUsers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error bulk approving users",
      error: error.message,
    });
  }
};

// Delete user (soft delete by setting status to inactive)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id; // Assuming you have authentication middleware

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role === "superadmin") {
      return res.status(403).json({
        message: "Cannot delete a super admin user",
      });
    }

    // Soft delete by setting status to inactive
    user.rejectUser(adminId, "Account deleted by admin");
    await user.save();

    res.status(200).json({
      message: "User deleted successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting user",
      error: error.message,
    });
  }
};
