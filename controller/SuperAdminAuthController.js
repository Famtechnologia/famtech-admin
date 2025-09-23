import SuperAdmin from "../model/SuperAdmin.js";
import crypto from "crypto";

// Register a new SuperAdmin (only accessible by existing superadmin)
export const registerSuperAdmin = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      department,
      employeeId,
      role = "admin", // Default to admin, superadmin must be explicitly set
      notes,
    } = req.body;

    // Check if the requester is a superadmin (for creating other superadmins)
    const requesterAdmin = req.adminUser;
    if (role === "superadmin" && requesterAdmin?.role !== "superadmin") {
      return res.status(403).json({
        message: "Only superadmins can create other superadmins",
      });
    }

    // Check if admin already exists
    const existingAdmin = await SuperAdmin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin with this email already exists",
      });
    }

    // Check if employee ID already exists (if provided)
    if (employeeId) {
      const existingEmployeeId = await SuperAdmin.findOne({ employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({
          message: "Admin with this employee ID already exists",
        });
      }
    }

    // Create new admin
    const newAdmin = new SuperAdmin({
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
      firstName,
      lastName,
      phoneNumber,
      department,
      employeeId,
      role,
      notes,
      createdBy: requesterAdmin?._id,
      status: "active", // Admins are active by default
      isVerified: true, // Admins are verified by default
    });

    await newAdmin.save();

    res.status(201).json({
      message: "SuperAdmin registered successfully",
      admin: newAdmin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error registering SuperAdmin",
      error: error.message,
    });
  }
};

// Login SuperAdmin
export const loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find admin by email
    const admin = await SuperAdmin.findOne({ email }).select(
      "+passwordHash +loginAttempts +lockUntil"
    );
    if (!admin) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({
        message:
          "Account is temporarily locked due to too many failed login attempts",
      });
    }

    // Check if account is active
    if (admin.status !== "active") {
      return res.status(401).json({
        message: "Account is not active",
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      await admin.incLoginAttempts();
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Reset login attempts on successful login
    if (admin.loginAttempts > 0) {
      await admin.resetLoginAttempts();
    }

    // Update last login
    admin.updateLastLogin();
    await admin.save();

    // Here you would typically generate JWT tokens
    // For now, just return success with admin info
    res.status(200).json({
      message: "Login successful",
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
      },
      // TODO: Add JWT tokens here
      // accessToken: generateAccessToken(admin),
      // refreshToken: generateRefreshToken(admin)
    });
  } catch (error) {
    res.status(500).json({
      message: "Error during login",
      error: error.message,
    });
  }
};

// Get current SuperAdmin profile
export const getSuperAdminProfile = async (req, res) => {
  try {
    const adminId = req.adminUser?._id;

    const admin = await SuperAdmin.findById(adminId)
      .populate("createdBy", "firstName lastName email")
      .populate("lastModifiedBy", "firstName lastName email");

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    res.status(200).json({
      message: "Profile retrieved successfully",
      admin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving profile",
      error: error.message,
    });
  }
};

// Update SuperAdmin profile
export const updateSuperAdminProfile = async (req, res) => {
  try {
    const adminId = req.adminUser?._id;
    const {
      firstName,
      lastName,
      phoneNumber,
      department,
      profilePicture,
      notes,
    } = req.body;

    const admin = await SuperAdmin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    // Update allowed fields
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phoneNumber) admin.phoneNumber = phoneNumber;
    if (department) admin.department = department;
    if (profilePicture) admin.profilePicture = profilePicture;
    if (notes) admin.notes = notes;

    admin.lastModifiedBy = adminId;
    await admin.save();

    res.status(200).json({
      message: "Profile updated successfully",
      admin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// Change SuperAdmin password
export const changeSuperAdminPassword = async (req, res) => {
  try {
    const adminId = req.adminUser?._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    const admin = await SuperAdmin.findById(adminId).select("+passwordHash");
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    // Update password
    admin.passwordHash = newPassword; // Will be hashed by pre-save middleware
    admin.lastModifiedBy = adminId;
    await admin.save();

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error changing password",
      error: error.message,
    });
  }
};

// Get all SuperAdmins (superadmin only)
export const getAllSuperAdmins = async (req, res) => {
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

    const result = await SuperAdmin.searchAdmins({}, options);

    res.status(200).json({
      message: "SuperAdmins retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving SuperAdmins",
      error: error.message,
    });
  }
};

// Update SuperAdmin role/status (superadmin only)
export const updateSuperAdminRole = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { role, status } = req.body;
    const requesterAdmin = req.adminUser;

    if (!role && !status) {
      return res.status(400).json({
        message: "Role or status is required",
      });
    }

    const admin = await SuperAdmin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    // Prevent self-modification of critical fields
    if (adminId === requesterAdmin._id.toString()) {
      if (role && role !== admin.role) {
        return res.status(400).json({
          message: "Cannot change your own role",
        });
      }
      if (status && status !== admin.status) {
        return res.status(400).json({
          message: "Cannot change your own status",
        });
      }
    }

    // Update fields
    if (role) admin.role = role;
    if (status) admin.status = status;
    admin.lastModifiedBy = requesterAdmin._id;

    await admin.save();

    res.status(200).json({
      message: "SuperAdmin updated successfully",
      admin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating SuperAdmin",
      error: error.message,
    });
  }
};

// Delete SuperAdmin (superadmin only)
export const deleteSuperAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const requesterAdmin = req.adminUser;

    if (adminId === requesterAdmin._id.toString()) {
      return res.status(400).json({
        message: "Cannot delete your own account",
      });
    }

    const admin = await SuperAdmin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    await SuperAdmin.findByIdAndDelete(adminId);

    res.status(200).json({
      message: "SuperAdmin deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting SuperAdmin",
      error: error.message,
    });
  }
};

// Get SuperAdmin statistics
export const getSuperAdminStatistics = async (req, res) => {
  try {
    const stats = await SuperAdmin.getAdminStatistics();
    res.status(200).json({
      message: "SuperAdmin statistics retrieved successfully",
      statistics: stats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving SuperAdmin statistics",
      error: error.message,
    });
  }
};
