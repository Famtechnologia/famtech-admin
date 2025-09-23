import express from "express";
// User Management Controllers
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

// SuperAdmin Management Controllers
import {
  registerSuperAdmin,
  loginSuperAdmin,
  getSuperAdminProfile,
  updateSuperAdminProfile,
  changeSuperAdminPassword,
  getAllSuperAdmins,
  updateSuperAdminRole,
  deleteSuperAdmin,
  getSuperAdminStatistics,
} from "../controller/SuperAdminAuthController.js";

// Review Management Controllers
import ReviewManagementController from "../controller/ReviewManagementController.js";

// Subscription Management Controllers
import SubscriptionManagementController from "../controller/SubscriptionManagementController.js";
import SubscriptionPlanController from "../controller/SubscriptionPlanController.js";

// Analytics and Insights Controllers
import {
  getAnalyticsDashboard,
  getUserEngagementMetrics,
  getUsageStatistics,
  getRevenueAnalytics,
  getCustomerDemographics,
  exportAnalyticsData,
  updateUserAnalytics,
} from "../controller/AnalyticsController.js";

import {
  validateObjectId,
  validateRoleUpdate,
  validateBulkApprove,
  validateSearchParams,
  validateReason,
  requireAdminRole,
  requireSuperAdminRole,
  rateLimitBulkOperations,
  validateReviewData,
  validateAdminResponse,
  validateBulkReviewActions,
  validateReviewFilters,
  validateReviewTarget,
  validateSubscriptionPlan,
  validateSubscriptionUpdate,
  validateSubscriptionFilters,
  validateBillingCycles,
  validatePlanFeatures,
  validateUsageData,
  validateAnalyticsTimeframe,
  validateAnalyticsExport,
  validateUserAnalyticsUpdate,
  validateCustomerSegmentation,
  validateEngagementFilters,
  validateRevenueFilters,
  validateUsageFilters,
} from "../middleware/validation.js";

const adminRouter = express.Router();

// ============================================
// SUPERADMIN AUTHENTICATION & MANAGEMENT ROUTES
// ============================================

// SuperAdmin Authentication
// @route   POST /admin/auth/register
// @desc    Register a new SuperAdmin (requires existing superadmin)
// @access  SuperAdmin only
adminRouter.post("/auth/register", requireSuperAdminRole, registerSuperAdmin);

// @route   POST /admin/auth/login
// @desc    Login SuperAdmin
// @access  Public
adminRouter.post("/auth/login", loginSuperAdmin);

// SuperAdmin Profile Management
// @route   GET /admin/auth/profile
// @desc    Get current SuperAdmin profile
// @access  SuperAdmin/Admin
adminRouter.get("/auth/profile", requireAdminRole, getSuperAdminProfile);

// @route   PUT /admin/auth/profile
// @desc    Update current SuperAdmin profile
// @access  SuperAdmin/Admin
adminRouter.put("/auth/profile", requireAdminRole, updateSuperAdminProfile);

// @route   PUT /admin/auth/password
// @desc    Change SuperAdmin password
// @access  SuperAdmin/Admin
adminRouter.put("/auth/password", requireAdminRole, changeSuperAdminPassword);

// SuperAdmin Management (SuperAdmin only)
// @route   GET /admin/admins
// @desc    Get all SuperAdmins
// @access  SuperAdmin only
adminRouter.get(
  "/admins",
  requireSuperAdminRole,
  validateSearchParams,
  getAllSuperAdmins
);

// @route   GET /admin/admins/stats
// @desc    Get SuperAdmin statistics
// @access  SuperAdmin only
adminRouter.get(
  "/admins/stats",
  requireSuperAdminRole,
  getSuperAdminStatistics
);

// @route   PUT /admin/admins/:adminId
// @desc    Update SuperAdmin role/status
// @access  SuperAdmin only
adminRouter.put(
  "/admins/:adminId",
  requireSuperAdminRole,
  validateObjectId,
  updateSuperAdminRole
);

// @route   DELETE /admin/admins/:adminId
// @desc    Delete SuperAdmin
// @access  SuperAdmin only
adminRouter.delete(
  "/admins/:adminId",
  requireSuperAdminRole,
  validateObjectId,
  deleteSuperAdmin
);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

// User Statistics Routes
// @route   GET /admin/users/stats
// @desc    Get comprehensive user statistics
// @access  SuperAdmin/Admin
adminRouter.get("/users/stats", requireAdminRole, getUserStatistics);

// User Listing and Search Routes
// @route   GET /admin/users/search
// @desc    Search users with filters and pagination
// @access  SuperAdmin/Admin
adminRouter.get(
  "/users/search",
  requireAdminRole,
  validateSearchParams,
  searchUsers
);

// @route   GET /admin/users/all
// @desc    Get all users (backward compatibility)
// @access  SuperAdmin/Admin
adminRouter.get("/users/all", requireAdminRole, adminGetAllUsers);

// @route   GET /admin/users/pending
// @desc    Get all pending user registrations
// @access  SuperAdmin/Admin
adminRouter.get(
  "/users/pending",
  requireAdminRole,
  validateSearchParams,
  getPendingUsers
);

// @route   GET /admin/users/role/:role
// @desc    Get users by specific role
// @access  SuperAdmin/Admin
adminRouter.get(
  "/users/role/:role",
  requireAdminRole,
  validateSearchParams,
  getUsersByRole
);

// @route   GET /admin/users/:userId
// @desc    Get specific user by ID
// @access  SuperAdmin/Admin
adminRouter.get(
  "/users/:userId",
  requireAdminRole,
  validateObjectId,
  getUserById
);

// User Management Routes
// @route   POST /admin/users/:userId/approve
// @desc    Approve a pending user registration
// @access  SuperAdmin/Admin
adminRouter.post(
  "/users/:userId/approve",
  requireAdminRole,
  validateObjectId,
  approveUser
);

// @route   POST /admin/users/:userId/reject
// @desc    Reject a user registration
// @access  SuperAdmin/Admin
adminRouter.post(
  "/users/:userId/reject",
  requireAdminRole,
  validateObjectId,
  validateReason,
  rejectUser
);

// @route   POST /admin/users/:userId/suspend
// @desc    Suspend a user account
// @access  SuperAdmin/Admin
adminRouter.post(
  "/users/:userId/suspend",
  requireAdminRole,
  validateObjectId,
  validateReason,
  suspendUser
);

// @route   POST /admin/users/:userId/reactivate
// @desc    Reactivate a suspended/inactive user
// @access  SuperAdmin/Admin
adminRouter.post(
  "/users/:userId/reactivate",
  requireAdminRole,
  validateObjectId,
  reactivateUser
);

// @route   PUT /admin/users/:userId/role
// @desc    Update user role
// @access  SuperAdmin/Admin
adminRouter.put(
  "/users/:userId/role",
  requireAdminRole,
  validateObjectId,
  validateRoleUpdate,
  updateUserRole
);

// @route   DELETE /admin/users/:userId
// @desc    Delete user account (soft delete)
// @access  SuperAdmin/Admin
adminRouter.delete(
  "/users/:userId",
  requireAdminRole,
  validateObjectId,
  deleteUser
);

// Bulk Operations Routes
// @route   POST /admin/users/bulk/approve
// @desc    Bulk approve multiple pending users
// @access  SuperAdmin/Admin
adminRouter.post(
  "/users/bulk/approve",
  requireAdminRole,
  validateBulkApprove,
  rateLimitBulkOperations,
  bulkApproveUsers
);

// ============================================
// REVIEW AND RATING MANAGEMENT ROUTES
// ============================================

// Review Dashboard and Statistics
// @route   GET /admin/reviews/dashboard
// @desc    Get review statistics and dashboard data
// @access  SuperAdmin/Admin
adminRouter.get(
  "/reviews/dashboard",
  requireAdminRole,
  ReviewManagementController.getReviewDashboard
);

// Review Listing and Search
// @route   GET /admin/reviews
// @desc    Get all reviews with filtering and pagination
// @access  SuperAdmin/Admin
adminRouter.get(
  "/reviews",
  requireAdminRole,
  validateReviewFilters,
  ReviewManagementController.getAllReviews
);

// @route   GET /admin/reviews/:reviewId
// @desc    Get single review details
// @access  SuperAdmin/Admin
adminRouter.get(
  "/reviews/:reviewId",
  requireAdminRole,
  validateObjectId,
  ReviewManagementController.getReviewDetails
);

// Review Moderation Actions
// @route   PUT /admin/reviews/:reviewId/approve
// @desc    Approve a review
// @access  SuperAdmin/Admin
adminRouter.put(
  "/reviews/:reviewId/approve",
  requireAdminRole,
  validateObjectId,
  ReviewManagementController.approveReview
);

// @route   PUT /admin/reviews/:reviewId/reject
// @desc    Reject a review
// @access  SuperAdmin/Admin
adminRouter.put(
  "/reviews/:reviewId/reject",
  requireAdminRole,
  validateObjectId,
  validateReason,
  ReviewManagementController.rejectReview
);

// @route   PUT /admin/reviews/:reviewId/flag
// @desc    Flag a review for further review
// @access  SuperAdmin/Admin
adminRouter.put(
  "/reviews/:reviewId/flag",
  requireAdminRole,
  validateObjectId,
  validateReason,
  ReviewManagementController.flagReview
);

// @route   PUT /admin/reviews/:reviewId/hide
// @desc    Hide a review from public view
// @access  SuperAdmin/Admin
adminRouter.put(
  "/reviews/:reviewId/hide",
  requireAdminRole,
  validateObjectId,
  validateReason,
  ReviewManagementController.hideReview
);

// Admin Response Management
// @route   POST /admin/reviews/:reviewId/response
// @desc    Add admin response to a review
// @access  SuperAdmin/Admin
adminRouter.post(
  "/reviews/:reviewId/response",
  requireAdminRole,
  validateObjectId,
  validateAdminResponse,
  ReviewManagementController.addAdminResponse
);

// @route   PUT /admin/reviews/:reviewId/response
// @desc    Update admin response to a review
// @access  SuperAdmin/Admin
adminRouter.put(
  "/reviews/:reviewId/response",
  requireAdminRole,
  validateObjectId,
  validateAdminResponse,
  ReviewManagementController.updateAdminResponse
);

// @route   DELETE /admin/reviews/:reviewId/response
// @desc    Remove admin response from a review
// @access  SuperAdmin/Admin
adminRouter.delete(
  "/reviews/:reviewId/response",
  requireAdminRole,
  validateObjectId,
  ReviewManagementController.removeAdminResponse
);

// Bulk Review Operations
// @route   POST /admin/reviews/bulk/actions
// @desc    Perform bulk actions on multiple reviews
// @access  SuperAdmin/Admin
adminRouter.post(
  "/reviews/bulk/actions",
  requireAdminRole,
  validateBulkReviewActions,
  rateLimitBulkOperations,
  ReviewManagementController.bulkReviewActions
);

// Reviews by Target
// @route   GET /admin/reviews/target/:targetType/:targetId
// @desc    Get reviews for a specific target (user, service, etc.)
// @access  SuperAdmin/Admin
adminRouter.get(
  "/reviews/target/:targetType/:targetId",
  requireAdminRole,
  validateReviewTarget,
  ReviewManagementController.getReviewsByTarget
);

// Review Deletion (Permanent)
// @route   DELETE /admin/reviews/:reviewId
// @desc    Permanently delete a review
// @access  SuperAdmin only
adminRouter.delete(
  "/reviews/:reviewId",
  requireSuperAdminRole,
  validateObjectId,
  ReviewManagementController.deleteReview
);

// Data Export
// @route   GET /admin/reviews/export
// @desc    Export reviews data in CSV or JSON format
// @access  SuperAdmin/Admin
adminRouter.get(
  "/reviews/export",
  requireAdminRole,
  ReviewManagementController.exportReviews
);

// ============================================
// SUBSCRIPTION MANAGEMENT ROUTES
// ============================================

// Subscription Dashboard and Analytics
// @route   GET /admin/subscriptions/dashboard
// @desc    Get subscription statistics and dashboard data
// @access  SuperAdmin/Admin
adminRouter.get(
  "/subscriptions/dashboard",
  requireAdminRole,
  SubscriptionManagementController.getSubscriptionDashboard
);

// @route   GET /admin/subscriptions/analytics
// @desc    Get subscription analytics and trends
// @access  SuperAdmin/Admin
adminRouter.get(
  "/subscriptions/analytics",
  requireAdminRole,
  SubscriptionManagementController.getSubscriptionAnalytics
);

// Subscription Listing and Management
// @route   GET /admin/subscriptions
// @desc    Get all subscriptions with filtering and pagination
// @access  SuperAdmin/Admin
adminRouter.get(
  "/subscriptions",
  requireAdminRole,
  validateSubscriptionFilters,
  SubscriptionManagementController.getAllSubscriptions
);

// @route   GET /admin/subscriptions/:subscriptionId
// @desc    Get single subscription details
// @access  SuperAdmin/Admin
adminRouter.get(
  "/subscriptions/:subscriptionId",
  requireAdminRole,
  validateObjectId,
  SubscriptionManagementController.getSubscriptionDetails
);

// Subscription Status Management
// @route   PUT /admin/subscriptions/:subscriptionId/activate
// @desc    Activate a subscription
// @access  SuperAdmin/Admin
adminRouter.put(
  "/subscriptions/:subscriptionId/activate",
  requireAdminRole,
  validateObjectId,
  SubscriptionManagementController.activateSubscription
);

// @route   PUT /admin/subscriptions/:subscriptionId/cancel
// @desc    Cancel a subscription
// @access  SuperAdmin/Admin
adminRouter.put(
  "/subscriptions/:subscriptionId/cancel",
  requireAdminRole,
  validateObjectId,
  validateReason,
  SubscriptionManagementController.cancelSubscription
);

// @route   PUT /admin/subscriptions/:subscriptionId/suspend
// @desc    Suspend a subscription
// @access  SuperAdmin/Admin
adminRouter.put(
  "/subscriptions/:subscriptionId/suspend",
  requireAdminRole,
  validateObjectId,
  validateReason,
  SubscriptionManagementController.suspendSubscription
);

// @route   PUT /admin/subscriptions/:subscriptionId/reactivate
// @desc    Reactivate a suspended subscription
// @access  SuperAdmin/Admin
adminRouter.put(
  "/subscriptions/:subscriptionId/reactivate",
  requireAdminRole,
  validateObjectId,
  SubscriptionManagementController.reactivateSubscription
);

// Subscription Plan Management
// @route   PUT /admin/subscriptions/:subscriptionId/change-plan
// @desc    Change subscription plan
// @access  SuperAdmin/Admin
adminRouter.put(
  "/subscriptions/:subscriptionId/change-plan",
  requireAdminRole,
  validateObjectId,
  SubscriptionManagementController.changeSubscriptionPlan
);

// @route   PUT /admin/subscriptions/:subscriptionId/auto-renewal
// @desc    Update auto-renewal settings
// @access  SuperAdmin/Admin
adminRouter.put(
  "/subscriptions/:subscriptionId/auto-renewal",
  requireAdminRole,
  validateObjectId,
  SubscriptionManagementController.updateAutoRenewal
);

// @route   POST /admin/subscriptions/:subscriptionId/renew
// @desc    Manually renew a subscription
// @access  SuperAdmin/Admin
adminRouter.post(
  "/subscriptions/:subscriptionId/renew",
  requireAdminRole,
  validateObjectId,
  SubscriptionManagementController.renewSubscription
);

// Subscription Notes and Usage
// @route   POST /admin/subscriptions/:subscriptionId/notes
// @desc    Add admin note to subscription
// @access  SuperAdmin/Admin
adminRouter.post(
  "/subscriptions/:subscriptionId/notes",
  requireAdminRole,
  validateObjectId,
  SubscriptionManagementController.addAdminNote
);

// @route   PUT /admin/subscriptions/:subscriptionId/usage
// @desc    Update subscription usage data
// @access  SuperAdmin/Admin
adminRouter.put(
  "/subscriptions/:subscriptionId/usage",
  requireAdminRole,
  validateObjectId,
  validateUsageData,
  SubscriptionManagementController.updateSubscriptionUsage
);

// Subscription Alerts and Monitoring
// @route   GET /admin/subscriptions/expiring
// @desc    Get expiring subscriptions
// @access  SuperAdmin/Admin
adminRouter.get(
  "/subscriptions/expiring",
  requireAdminRole,
  SubscriptionManagementController.getExpiringSubscriptions
);

// @route   GET /admin/subscriptions/due-renewal
// @desc    Get subscriptions due for renewal
// @access  SuperAdmin/Admin
adminRouter.get(
  "/subscriptions/due-renewal",
  requireAdminRole,
  SubscriptionManagementController.getDueForRenewal
);

// Data Export
// @route   GET /admin/subscriptions/export
// @desc    Export subscription data in CSV or JSON format
// @access  SuperAdmin/Admin
adminRouter.get(
  "/subscriptions/export",
  requireAdminRole,
  SubscriptionManagementController.exportSubscriptions
);

// ============================================
// SUBSCRIPTION PLAN MANAGEMENT ROUTES
// ============================================

// Plan Listing and Management
// @route   GET /admin/plans
// @desc    Get all subscription plans with filtering
// @access  SuperAdmin/Admin
adminRouter.get(
  "/plans",
  requireAdminRole,
  SubscriptionPlanController.getAllPlans
);

// @route   GET /admin/plans/active
// @desc    Get active subscription plans for public use
// @access  SuperAdmin/Admin
adminRouter.get(
  "/plans/active",
  requireAdminRole,
  SubscriptionPlanController.getActivePlans
);

// @route   GET /admin/plans/comparison
// @desc    Get plan comparison data
// @access  SuperAdmin/Admin
adminRouter.get(
  "/plans/comparison",
  requireAdminRole,
  SubscriptionPlanController.getPlanComparison
);

// @route   GET /admin/plans/:planId
// @desc    Get single plan details
// @access  SuperAdmin/Admin
adminRouter.get(
  "/plans/:planId",
  requireAdminRole,
  validateObjectId,
  SubscriptionPlanController.getPlanDetails
);

// Plan Creation and Updates
// @route   POST /admin/plans
// @desc    Create new subscription plan
// @access  SuperAdmin/Admin
adminRouter.post(
  "/plans",
  requireAdminRole,
  validateSubscriptionPlan,
  validateBillingCycles,
  validatePlanFeatures,
  SubscriptionPlanController.createPlan
);

// @route   PUT /admin/plans/:planId
// @desc    Update subscription plan
// @access  SuperAdmin/Admin
adminRouter.put(
  "/plans/:planId",
  requireAdminRole,
  validateObjectId,
  validateBillingCycles,
  validatePlanFeatures,
  SubscriptionPlanController.updatePlan
);

// Plan Status Management
// @route   PUT /admin/plans/:planId/status
// @desc    Activate or deactivate a plan
// @access  SuperAdmin/Admin
adminRouter.put(
  "/plans/:planId/status",
  requireAdminRole,
  validateObjectId,
  SubscriptionPlanController.togglePlanStatus
);

// @route   PUT /admin/plans/:planId/recommended
// @desc    Set plan as recommended
// @access  SuperAdmin/Admin
adminRouter.put(
  "/plans/:planId/recommended",
  requireAdminRole,
  validateObjectId,
  SubscriptionPlanController.setRecommendedPlan
);

// Plan Features and Pricing
// @route   PUT /admin/plans/:planId/pricing
// @desc    Update plan pricing
// @access  SuperAdmin/Admin
adminRouter.put(
  "/plans/:planId/pricing",
  requireAdminRole,
  validateObjectId,
  validateBillingCycles,
  SubscriptionPlanController.updatePlanPricing
);

// @route   POST /admin/plans/:planId/features
// @desc    Add custom feature to plan
// @access  SuperAdmin/Admin
adminRouter.post(
  "/plans/:planId/features",
  requireAdminRole,
  validateObjectId,
  SubscriptionPlanController.addCustomFeature
);

// @route   DELETE /admin/plans/:planId/features/:featureName
// @desc    Remove custom feature from plan
// @access  SuperAdmin/Admin
adminRouter.delete(
  "/plans/:planId/features/:featureName",
  requireAdminRole,
  validateObjectId,
  SubscriptionPlanController.removeCustomFeature
);

// Plan Statistics and Analytics
// @route   PUT /admin/plans/:planId/statistics
// @desc    Update plan statistics
// @access  SuperAdmin/Admin
adminRouter.put(
  "/plans/:planId/statistics",
  requireAdminRole,
  validateObjectId,
  SubscriptionPlanController.updatePlanStatistics
);

// Plan Deletion
// @route   DELETE /admin/plans/:planId
// @desc    Delete subscription plan (SuperAdmin only)
// @access  SuperAdmin only
adminRouter.delete(
  "/plans/:planId",
  requireSuperAdminRole,
  validateObjectId,
  SubscriptionPlanController.deletePlan
);

// ===================================
// ANALYTICS AND INSIGHTS ROUTES
// ===================================

// Analytics Dashboard
// @route   GET /admin/analytics/dashboard
// @desc    Get main analytics dashboard with KPIs and trends
// @access  SuperAdmin/Admin
adminRouter.get(
  "/analytics/dashboard",
  requireAdminRole,
  validateAnalyticsTimeframe,
  getAnalyticsDashboard
);

// User Engagement Metrics
// @route   GET /admin/analytics/engagement
// @desc    Get user engagement metrics and analytics
// @access  SuperAdmin/Admin
adminRouter.get(
  "/analytics/engagement",
  requireAdminRole,
  validateAnalyticsTimeframe,
  validateEngagementFilters,
  getUserEngagementMetrics
);

// Usage Statistics and Feature Adoption
// @route   GET /admin/analytics/usage
// @desc    Get platform usage statistics and feature adoption rates
// @access  SuperAdmin/Admin
adminRouter.get(
  "/analytics/usage",
  requireAdminRole,
  validateAnalyticsTimeframe,
  validateUsageFilters,
  getUsageStatistics
);

// Revenue and Sales Analytics
// @route   GET /admin/analytics/revenue
// @desc    Get revenue analytics, subscription metrics, and financial KPIs
// @access  SuperAdmin/Admin
adminRouter.get(
  "/analytics/revenue",
  requireAdminRole,
  validateAnalyticsTimeframe,
  validateRevenueFilters,
  getRevenueAnalytics
);

// Customer Demographics and Segmentation
// @route   GET /admin/analytics/demographics
// @desc    Get customer demographics and segmentation analysis
// @access  SuperAdmin/Admin
adminRouter.get(
  "/analytics/demographics",
  requireAdminRole,
  validateCustomerSegmentation,
  getCustomerDemographics
);

// Analytics Data Export
// @route   GET /admin/analytics/export
// @desc    Export analytics data in JSON or CSV format
// @access  SuperAdmin/Admin
adminRouter.get(
  "/analytics/export",
  requireAdminRole,
  validateAnalyticsTimeframe,
  validateAnalyticsExport,
  exportAnalyticsData
);

// User Analytics Update (for real-time tracking)
// @route   POST /admin/analytics/users/:userId/update
// @desc    Update user analytics data (login, feature usage, etc.)
// @access  SuperAdmin/Admin
adminRouter.post(
  "/analytics/users/:userId/update",
  requireAdminRole,
  validateObjectId,
  validateUserAnalyticsUpdate,
  updateUserAnalytics
);

// ============================================
// CONTENT MANAGEMENT ROUTES
// ============================================

// Content Management Controllers
import {
  getContentDashboard,
  getAllContent,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
  publishContent,
  scheduleContent,
  archiveContent,
  bulkContentActions,
  getContentAnalytics,
  getTrendingContent,
  searchContent,
  addAdminNote,
  removeAdminNote,
} from "../controller/ContentManagementController.js";

import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryHierarchy,
  addCategoryModerator,
  removeCategoryModerator,
  updateCategoryOrder,
  getCategoryStats,
  searchCategories,
  getCategoriesByType,
} from "../controller/ContentCategoryController.js";

// Content Dashboard
// @route   GET /admin/content/dashboard
// @desc    Get content management dashboard with statistics
// @access  SuperAdmin/Admin
adminRouter.get("/content/dashboard", requireAdminRole, getContentDashboard);

// Content CRUD Operations
// @route   GET /admin/content
// @desc    Get all content with filtering and pagination
// @access  SuperAdmin/Admin
adminRouter.get("/content", requireAdminRole, getAllContent);

// @route   GET /admin/content/search
// @desc    Search content by title, excerpt, tags, etc.
// @access  SuperAdmin/Admin
adminRouter.get("/content/search", requireAdminRole, searchContent);

// @route   GET /admin/content/trending
// @desc    Get trending content based on analytics
// @access  SuperAdmin/Admin
adminRouter.get("/content/trending", requireAdminRole, getTrendingContent);

// @route   GET /admin/content/:id
// @desc    Get single content item by ID
// @access  SuperAdmin/Admin
adminRouter.get(
  "/content/:id",
  requireAdminRole,
  validateObjectId,
  getContentById
);

// @route   GET /admin/content/:id/analytics
// @desc    Get analytics for specific content item
// @access  SuperAdmin/Admin
adminRouter.get(
  "/content/:id/analytics",
  requireAdminRole,
  validateObjectId,
  getContentAnalytics
);

// @route   POST /admin/content
// @desc    Create new content
// @access  SuperAdmin/Admin
adminRouter.post("/content", requireAdminRole, createContent);

// @route   PUT /admin/content/:id
// @desc    Update content
// @access  SuperAdmin/Admin
adminRouter.put(
  "/content/:id",
  requireAdminRole,
  validateObjectId,
  updateContent
);

// @route   DELETE /admin/content/:id
// @desc    Delete content
// @access  SuperAdmin/Admin
adminRouter.delete(
  "/content/:id",
  requireAdminRole,
  validateObjectId,
  deleteContent
);

// Content Publishing and Scheduling
// @route   PATCH /admin/content/:id/publish
// @desc    Publish content immediately
// @access  SuperAdmin/Admin
adminRouter.patch(
  "/content/:id/publish",
  requireAdminRole,
  validateObjectId,
  publishContent
);

// @route   PATCH /admin/content/:id/schedule
// @desc    Schedule content for future publishing
// @access  SuperAdmin/Admin
adminRouter.patch(
  "/content/:id/schedule",
  requireAdminRole,
  validateObjectId,
  scheduleContent
);

// @route   PATCH /admin/content/:id/archive
// @desc    Archive content
// @access  SuperAdmin/Admin
adminRouter.patch(
  "/content/:id/archive",
  requireAdminRole,
  validateObjectId,
  archiveContent
);

// Bulk Content Operations
// @route   POST /admin/content/bulk
// @desc    Perform bulk operations on content (publish, archive, delete, etc.)
// @access  SuperAdmin/Admin
adminRouter.post(
  "/content/bulk",
  requireAdminRole,
  rateLimitBulkOperations,
  bulkContentActions
);

// Admin Notes Management
// @route   POST /admin/content/:id/notes
// @desc    Add admin note to content
// @access  SuperAdmin/Admin
adminRouter.post(
  "/content/:id/notes",
  requireAdminRole,
  validateObjectId,
  addAdminNote
);

// @route   DELETE /admin/content/:id/notes/:noteId
// @desc    Remove admin note from content
// @access  SuperAdmin/Admin
adminRouter.delete(
  "/content/:id/notes/:noteId",
  requireAdminRole,
  validateObjectId,
  removeAdminNote
);

// ============================================
// CONTENT CATEGORY MANAGEMENT ROUTES
// ============================================

// Category Management
// @route   GET /admin/categories
// @desc    Get all content categories
// @access  SuperAdmin/Admin
adminRouter.get("/categories", requireAdminRole, getAllCategories);

// @route   GET /admin/categories/hierarchy
// @desc    Get category hierarchy tree structure
// @access  SuperAdmin/Admin
adminRouter.get(
  "/categories/hierarchy",
  requireAdminRole,
  getCategoryHierarchy
);

// @route   GET /admin/categories/search
// @desc    Search categories by name or description
// @access  SuperAdmin/Admin
adminRouter.get("/categories/search", requireAdminRole, searchCategories);

// @route   GET /admin/categories/by-type/:contentType
// @desc    Get categories by content type
// @access  SuperAdmin/Admin
adminRouter.get(
  "/categories/by-type/:contentType",
  requireAdminRole,
  getCategoriesByType
);

// @route   GET /admin/categories/:id
// @desc    Get single category by ID
// @access  SuperAdmin/Admin
adminRouter.get(
  "/categories/:id",
  requireAdminRole,
  validateObjectId,
  getCategoryById
);

// @route   GET /admin/categories/:id/stats
// @desc    Get category statistics
// @access  SuperAdmin/Admin
adminRouter.get(
  "/categories/:id/stats",
  requireAdminRole,
  validateObjectId,
  getCategoryStats
);

// @route   POST /admin/categories
// @desc    Create new category
// @access  SuperAdmin/Admin
adminRouter.post("/categories", requireAdminRole, createCategory);

// @route   PUT /admin/categories/:id
// @desc    Update category
// @access  SuperAdmin/Admin
adminRouter.put(
  "/categories/:id",
  requireAdminRole,
  validateObjectId,
  updateCategory
);

// @route   DELETE /admin/categories/:id
// @desc    Delete category
// @access  SuperAdmin/Admin
adminRouter.delete(
  "/categories/:id",
  requireAdminRole,
  validateObjectId,
  deleteCategory
);

// Category Moderator Management
// @route   POST /admin/categories/:id/moderators
// @desc    Add moderator to category
// @access  SuperAdmin only
adminRouter.post(
  "/categories/:id/moderators",
  requireSuperAdminRole,
  validateObjectId,
  addCategoryModerator
);

// @route   DELETE /admin/categories/:id/moderators/:moderatorId
// @desc    Remove moderator from category
// @access  SuperAdmin only
adminRouter.delete(
  "/categories/:id/moderators/:moderatorId",
  requireSuperAdminRole,
  validateObjectId,
  removeCategoryModerator
);

// @route   PATCH /admin/categories/order
// @desc    Update category display order
// @access  SuperAdmin/Admin
adminRouter.patch("/categories/order", requireAdminRole, updateCategoryOrder);

export default adminRouter;
