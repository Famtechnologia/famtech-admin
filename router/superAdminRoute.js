import express from "express";
import {
  adminGetAllUsers,
  getUserStatistics,
  searchUsers,
  getUserById,
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
  updateUserRole,
  getPendingUsers,
  getUsersByRole,
  bulkApproveUsers,
  deleteUser,
} from "../controller/SuperAdminContoller.js";
import {
  validateObjectId,
  validateRoleUpdate,
  validateBulkApprove,
  validateSearchParams,
  validateReason,
  requireAdminRole,
  requireSuperAdminRole,
  rateLimitBulkOperations,
} from "../middleware/validation.js";

const adminRouter = express.Router();

// Apply admin role requirement to all routes
adminRouter.use(requireAdminRole);

// User Statistics Routes
// @route   GET /admin/stats
// @desc    Get comprehensive user statistics
// @access  SuperAdmin/Admin
adminRouter.get("/stats", getUserStatistics);

// User Listing and Search Routes
// @route   GET /admin/users
// @desc    Get all users with optional search and filters
// @access  SuperAdmin/Admin
adminRouter.get("/users", validateSearchParams, searchUsers);

// @route   GET /admin/users/all
// @desc    Get all users (original endpoint)
// @access  SuperAdmin/Admin
adminRouter.get("/users/all", adminGetAllUsers);

// @route   GET /admin/users/pending
// @desc    Get all pending user registrations
// @access  SuperAdmin/Admin
adminRouter.get("/users/pending", validateSearchParams, getPendingUsers);

// @route   GET /admin/users/role/:role
// @desc    Get users by specific role
// @access  SuperAdmin/Admin
adminRouter.get("/users/role/:role", validateSearchParams, getUsersByRole);

// @route   GET /admin/users/:userId
// @desc    Get specific user by ID
// @access  SuperAdmin/Admin
adminRouter.get("/users/:userId", validateObjectId, getUserById);

// User Management Routes
// @route   POST /admin/users/:userId/approve
// @desc    Approve a pending user registration
// @access  SuperAdmin/Admin
adminRouter.post("/users/:userId/approve", validateObjectId, approveUser);

// @route   POST /admin/users/:userId/reject
// @desc    Reject a user registration
// @access  SuperAdmin/Admin
adminRouter.post(
  "/users/:userId/reject",
  validateObjectId,
  validateReason,
  rejectUser
);

// @route   POST /admin/users/:userId/suspend
// @desc    Suspend a user account
// @access  SuperAdmin/Admin
adminRouter.post(
  "/users/:userId/suspend",
  validateObjectId,
  validateReason,
  suspendUser
);

// @route   POST /admin/users/:userId/reactivate
// @desc    Reactivate a suspended/inactive user
// @access  SuperAdmin/Admin
adminRouter.post("/users/:userId/reactivate", validateObjectId, reactivateUser);

// @route   PUT /admin/users/:userId/role
// @desc    Update user role (SuperAdmin only for sensitive role changes)
// @access  SuperAdmin/Admin
adminRouter.put(
  "/users/:userId/role",
  validateObjectId,
  validateRoleUpdate,
  updateUserRole
);

// @route   DELETE /admin/users/:userId
// @desc    Delete user account (soft delete)
// @access  SuperAdmin/Admin
adminRouter.delete("/users/:userId", validateObjectId, deleteUser);

// Bulk Operations Routes
// @route   POST /admin/users/bulk/approve
// @desc    Bulk approve multiple pending users
// @access  SuperAdmin/Admin
adminRouter.post(
  "/users/bulk/approve",
  validateBulkApprove,
  rateLimitBulkOperations,
  bulkApproveUsers
);

export default adminRouter;
