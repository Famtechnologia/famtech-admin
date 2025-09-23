// Validation middleware for SuperAdmin endpoints
import User from "../model/User.js";
import SuperAdmin from "../model/SuperAdmin.js";
import Review from "../model/Review.js";
import mongoose from "mongoose";

// Validate MongoDB ObjectId format
export const validateObjectId = (req, res, next) => {
  const { userId, reviewId, targetId } = req.params;
  const idToValidate = userId || reviewId || targetId;

  if (!idToValidate) {
    return res.status(400).json({
      message: "ID parameter is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(idToValidate)) {
    return res.status(400).json({
      message: "Invalid ID format",
    });
  }

  next();
};

// Validate user role update request
export const validateRoleUpdate = (req, res, next) => {
  const { role } = req.body;
  const validRoles = ["farmer", "advisor", "viewer"];

  if (!role) {
    return res.status(400).json({
      message: "Role is required",
    });
  }

  if (!validRoles.includes(role)) {
    return res.status(400).json({
      message: "Invalid role. Valid roles are: " + validRoles.join(", "),
    });
  }

  next();
};

// Validate bulk approve request
export const validateBulkApprove = (req, res, next) => {
  const { userIds } = req.body;

  if (!Array.isArray(userIds)) {
    return res.status(400).json({
      message: "userIds must be an array",
    });
  }

  if (userIds.length === 0) {
    return res.status(400).json({
      message: "At least one user ID is required",
    });
  }

  if (userIds.length > 100) {
    return res.status(400).json({
      message: "Cannot approve more than 100 users at once",
    });
  }

  // Validate each ID format
  for (const id of userIds) {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid user ID format in array: " + id,
      });
    }
  }

  next();
};

// Validate search parameters
export const validateSearchParams = (req, res, next) => {
  const { page, limit, sortBy, sortOrder, role, status } = req.query;

  // Validate page
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      message: "Page must be a positive number",
    });
  }

  // Validate limit
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      message: "Limit must be between 1 and 100",
    });
  }

  // Validate sortBy
  const validSortFields = [
    "createdAt",
    "updatedAt",
    "email",
    "firstName",
    "lastName",
    "role",
    "status",
    "lastLogin",
  ];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return res.status(400).json({
      message:
        "Invalid sortBy field. Valid fields are: " + validSortFields.join(", "),
    });
  }

  // Validate sortOrder
  if (sortOrder && !["asc", "desc"].includes(sortOrder)) {
    return res.status(400).json({
      message: "sortOrder must be 'asc' or 'desc'",
    });
  }

  // Validate role filter
  const validRoles = ["farmer", "advisor", "viewer"];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({
      message: "Invalid role filter. Valid roles are: " + validRoles.join(", "),
    });
  }

  // Validate status filter
  const validStatuses = ["active", "inactive", "pending", "suspended"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      message:
        "Invalid status filter. Valid statuses are: " +
        validStatuses.join(", "),
    });
  }

  next();
};

// Validate reject/suspend reason
export const validateReason = (req, res, next) => {
  const { reason } = req.body;

  if (reason && typeof reason !== "string") {
    return res.status(400).json({
      message: "Reason must be a string",
    });
  }

  if (reason && reason.length > 500) {
    return res.status(400).json({
      message: "Reason cannot exceed 500 characters",
    });
  }

  next();
};

// Check if user has admin privileges
export const requireAdminRole = async (req, res, next) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const admin = await SuperAdmin.findById(adminId);
    if (!admin) {
      return res.status(401).json({
        message: "Admin user not found",
      });
    }

    if (!["admin", "superadmin"].includes(admin.role)) {
      return res.status(403).json({
        message: "Admin privileges required",
      });
    }

    if (admin.status !== "active") {
      return res.status(403).json({
        message: "Admin account is not active",
      });
    }

    req.adminUser = admin;
    next();
  } catch (error) {
    res.status(500).json({
      message: "Error verifying admin privileges",
      error: error.message,
    });
  }
};

// Check if user has superadmin privileges
export const requireSuperAdminRole = async (req, res, next) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const admin = await SuperAdmin.findById(adminId);
    if (!admin) {
      return res.status(401).json({
        message: "Admin user not found",
      });
    }

    if (admin.role !== "superadmin") {
      return res.status(403).json({
        message: "Super admin privileges required",
      });
    }

    if (admin.status !== "active") {
      return res.status(403).json({
        message: "Admin account is not active",
      });
    }

    req.adminUser = admin;
    next();
  } catch (error) {
    res.status(500).json({
      message: "Error verifying super admin privileges",
      error: error.message,
    });
  }
};

// Rate limiting for bulk operations
export const rateLimitBulkOperations = (req, res, next) => {
  // This is a simple in-memory rate limiter
  // For production, use Redis or a proper rate limiting library
  const userId = req.user?.id;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5; // 5 bulk operations per minute

  if (!global.bulkOperationLimiter) {
    global.bulkOperationLimiter = new Map();
  }

  const userRequests = global.bulkOperationLimiter.get(userId) || [];
  const recentRequests = userRequests.filter((time) => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      message: "Too many bulk operations. Please wait before trying again.",
    });
  }

  recentRequests.push(now);
  global.bulkOperationLimiter.set(userId, recentRequests);

  next();
};

// ============================================
// REVIEW VALIDATION MIDDLEWARE
// ============================================

// Validate review creation data
export const validateReviewData = (req, res, next) => {
  const { rating, comment, reviewType, targetType } = req.body;
  const errors = [];

  // Validate rating
  if (!rating) {
    errors.push("Rating is required");
  } else if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push("Rating must be an integer between 1 and 5");
  }

  // Validate comment
  if (!comment || typeof comment !== "string") {
    errors.push("Comment is required and must be a string");
  } else if (comment.trim().length < 5) {
    errors.push("Comment must be at least 5 characters long");
  } else if (comment.length > 1000) {
    errors.push("Comment cannot exceed 1000 characters");
  }

  // Validate review type
  const validReviewTypes = [
    "service",
    "product",
    "platform",
    "advisor",
    "general",
  ];
  if (reviewType && !validReviewTypes.includes(reviewType)) {
    errors.push(
      `Invalid review type. Valid types are: ${validReviewTypes.join(", ")}`
    );
  }

  // Validate target type
  const validTargetTypes = ["user", "service", "product", "platform"];
  if (targetType && !validTargetTypes.includes(targetType)) {
    errors.push(
      `Invalid target type. Valid types are: ${validTargetTypes.join(", ")}`
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate admin response data
export const validateAdminResponse = (req, res, next) => {
  const { responseText, isPublic } = req.body;
  const errors = [];

  if (!responseText || typeof responseText !== "string") {
    errors.push("Response text is required and must be a string");
  } else if (responseText.trim().length < 5) {
    errors.push("Response text must be at least 5 characters long");
  } else if (responseText.length > 1000) {
    errors.push("Response text cannot exceed 1000 characters");
  }

  if (isPublic !== undefined && typeof isPublic !== "boolean") {
    errors.push("isPublic must be a boolean value");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate bulk review actions
export const validateBulkReviewActions = (req, res, next) => {
  const { action, reviewIds, reason } = req.body;
  const errors = [];

  // Validate action
  const validActions = ["approve", "reject", "flag", "hide"];
  if (!action) {
    errors.push("Action is required");
  } else if (!validActions.includes(action)) {
    errors.push(
      `Invalid action. Valid actions are: ${validActions.join(", ")}`
    );
  }

  // Validate review IDs
  if (!reviewIds || !Array.isArray(reviewIds)) {
    errors.push("Review IDs must be an array");
  } else if (reviewIds.length === 0) {
    errors.push("At least one review ID is required");
  } else if (reviewIds.length > 50) {
    errors.push("Cannot process more than 50 reviews at once");
  } else {
    // Validate each ID format
    for (const id of reviewIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        errors.push(`Invalid review ID format: ${id}`);
        break; // Stop after first invalid ID
      }
    }
  }

  // Validate reason for destructive actions
  if (action === "reject" || action === "flag" || action === "hide") {
    if (!reason || typeof reason !== "string") {
      errors.push(`Reason is required for ${action} action`);
    } else if (reason.trim().length < 5) {
      errors.push("Reason must be at least 5 characters long");
    } else if (reason.length > 500) {
      errors.push("Reason cannot exceed 500 characters");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate review search and filter parameters
export const validateReviewFilters = (req, res, next) => {
  const {
    page,
    limit,
    sortBy,
    sortOrder,
    rating,
    status,
    reviewType,
    targetType,
    hasAdminResponse,
    dateFrom,
    dateTo,
  } = req.query;

  const errors = [];

  // Validate pagination
  if (page && (!Number.isInteger(parseInt(page)) || parseInt(page) < 1)) {
    errors.push("Page must be a positive integer");
  }

  if (
    limit &&
    (!Number.isInteger(parseInt(limit)) ||
      parseInt(limit) < 1 ||
      parseInt(limit) > 100)
  ) {
    errors.push("Limit must be a positive integer between 1 and 100");
  }

  // Validate sorting
  const validSortFields = [
    "createdAt",
    "rating",
    "status",
    "reviewType",
    "helpfulCount",
  ];
  if (sortBy && !validSortFields.includes(sortBy)) {
    errors.push(
      `Invalid sort field. Valid fields are: ${validSortFields.join(", ")}`
    );
  }

  if (sortOrder && !["asc", "desc"].includes(sortOrder)) {
    errors.push("Sort order must be 'asc' or 'desc'");
  }

  // Validate filters
  if (
    rating &&
    (!Number.isInteger(parseInt(rating)) ||
      parseInt(rating) < 1 ||
      parseInt(rating) > 5)
  ) {
    errors.push("Rating filter must be an integer between 1 and 5");
  }

  const validStatuses = [
    "pending",
    "approved",
    "rejected",
    "flagged",
    "hidden",
  ];
  if (status && !validStatuses.includes(status)) {
    errors.push(
      `Invalid status filter. Valid statuses are: ${validStatuses.join(", ")}`
    );
  }

  const validReviewTypes = [
    "service",
    "product",
    "platform",
    "advisor",
    "general",
  ];
  if (reviewType && !validReviewTypes.includes(reviewType)) {
    errors.push(
      `Invalid review type filter. Valid types are: ${validReviewTypes.join(
        ", "
      )}`
    );
  }

  const validTargetTypes = ["user", "service", "product", "platform"];
  if (targetType && !validTargetTypes.includes(targetType)) {
    errors.push(
      `Invalid target type filter. Valid types are: ${validTargetTypes.join(
        ", "
      )}`
    );
  }

  if (hasAdminResponse && !["true", "false"].includes(hasAdminResponse)) {
    errors.push("hasAdminResponse filter must be 'true' or 'false'");
  }

  // Validate date filters
  if (dateFrom && isNaN(Date.parse(dateFrom))) {
    errors.push("Invalid dateFrom format. Use ISO date format");
  }

  if (dateTo && isNaN(Date.parse(dateTo))) {
    errors.push("Invalid dateTo format. Use ISO date format");
  }

  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    errors.push("dateFrom cannot be later than dateTo");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid filter parameters",
      errors,
    });
  }

  next();
};

// Validate target type and ID for review queries
export const validateReviewTarget = (req, res, next) => {
  const { targetType, targetId } = req.params;
  const errors = [];

  const validTargetTypes = ["user", "service", "product", "platform"];
  if (!targetType) {
    errors.push("Target type is required");
  } else if (!validTargetTypes.includes(targetType)) {
    errors.push(
      `Invalid target type. Valid types are: ${validTargetTypes.join(", ")}`
    );
  }

  if (!targetId) {
    errors.push("Target ID is required");
  } else if (!mongoose.Types.ObjectId.isValid(targetId)) {
    errors.push("Invalid target ID format");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid target parameters",
      errors,
    });
  }

  next();
};

// ============================================
// SUBSCRIPTION VALIDATION MIDDLEWARE
// ============================================

// Validate subscription plan creation data
export const validateSubscriptionPlan = (req, res, next) => {
  const { name, description, type, price, currency, features } = req.body;
  const errors = [];

  // Validate name
  if (!name || typeof name !== "string") {
    errors.push("Plan name is required and must be a string");
  } else if (name.trim().length < 2) {
    errors.push("Plan name must be at least 2 characters long");
  } else if (name.length > 100) {
    errors.push("Plan name cannot exceed 100 characters");
  }

  // Validate description
  if (!description || typeof description !== "string") {
    errors.push("Plan description is required and must be a string");
  } else if (description.trim().length < 10) {
    errors.push("Plan description must be at least 10 characters long");
  } else if (description.length > 500) {
    errors.push("Plan description cannot exceed 500 characters");
  }

  // Validate type
  const validPlanTypes = ["basic", "premium", "professional", "enterprise"];
  if (!type) {
    errors.push("Plan type is required");
  } else if (!validPlanTypes.includes(type)) {
    errors.push(
      `Invalid plan type. Valid types are: ${validPlanTypes.join(", ")}`
    );
  }

  // Validate price
  if (price === undefined || price === null) {
    errors.push("Plan price is required");
  } else if (typeof price !== "number" || price < 0) {
    errors.push("Plan price must be a non-negative number");
  }

  // Validate currency
  if (currency && typeof currency !== "string") {
    errors.push("Currency must be a string");
  }

  // Validate features if provided
  if (features && typeof features !== "object") {
    errors.push("Features must be an object");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate subscription update data
export const validateSubscriptionUpdate = (req, res, next) => {
  const { status, autoRenew, reason } = req.body;
  const errors = [];

  // Validate status if provided
  const validStatuses = [
    "trial",
    "active",
    "inactive",
    "cancelled",
    "expired",
    "suspended",
    "pending_payment",
    "pending_cancellation",
  ];
  if (status && !validStatuses.includes(status)) {
    errors.push(
      `Invalid status. Valid statuses are: ${validStatuses.join(", ")}`
    );
  }

  // Validate autoRenew if provided
  if (autoRenew !== undefined && typeof autoRenew !== "boolean") {
    errors.push("autoRenew must be a boolean value");
  }

  // Validate reason for certain operations
  const destructiveActions = ["cancelled", "suspended"];
  if (status && destructiveActions.includes(status)) {
    if (!reason || typeof reason !== "string") {
      errors.push(`Reason is required for ${status} status`);
    } else if (reason.trim().length < 5) {
      errors.push("Reason must be at least 5 characters long");
    } else if (reason.length > 500) {
      errors.push("Reason cannot exceed 500 characters");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate subscription filters
export const validateSubscriptionFilters = (req, res, next) => {
  const {
    page,
    limit,
    sortBy,
    sortOrder,
    status,
    planType,
    billingCycle,
    autoRenew,
    dateFrom,
    dateTo,
  } = req.query;

  const errors = [];

  // Validate pagination
  if (page && (!Number.isInteger(parseInt(page)) || parseInt(page) < 1)) {
    errors.push("Page must be a positive integer");
  }

  if (
    limit &&
    (!Number.isInteger(parseInt(limit)) ||
      parseInt(limit) < 1 ||
      parseInt(limit) > 100)
  ) {
    errors.push("Limit must be a positive integer between 1 and 100");
  }

  // Validate sorting
  const validSortFields = [
    "createdAt",
    "updatedAt",
    "startDate",
    "endDate",
    "amount",
    "status",
    "planType",
  ];
  if (sortBy && !validSortFields.includes(sortBy)) {
    errors.push(
      `Invalid sort field. Valid fields are: ${validSortFields.join(", ")}`
    );
  }

  if (sortOrder && !["asc", "desc"].includes(sortOrder)) {
    errors.push("Sort order must be 'asc' or 'desc'");
  }

  // Validate filters
  const validStatuses = [
    "trial",
    "active",
    "inactive",
    "cancelled",
    "expired",
    "suspended",
    "pending_payment",
    "pending_cancellation",
  ];
  if (status && !validStatuses.includes(status)) {
    errors.push(
      `Invalid status filter. Valid statuses are: ${validStatuses.join(", ")}`
    );
  }

  const validPlanTypes = ["basic", "premium", "professional", "enterprise"];
  if (planType && !validPlanTypes.includes(planType)) {
    errors.push(
      `Invalid plan type filter. Valid types are: ${validPlanTypes.join(", ")}`
    );
  }

  const validBillingCycles = ["monthly", "quarterly", "yearly", "lifetime"];
  if (billingCycle && !validBillingCycles.includes(billingCycle)) {
    errors.push(
      `Invalid billing cycle filter. Valid cycles are: ${validBillingCycles.join(
        ", "
      )}`
    );
  }

  if (autoRenew && !["true", "false"].includes(autoRenew)) {
    errors.push("autoRenew filter must be 'true' or 'false'");
  }

  // Validate date filters
  if (dateFrom && isNaN(Date.parse(dateFrom))) {
    errors.push("Invalid dateFrom format. Use ISO date format");
  }

  if (dateTo && isNaN(Date.parse(dateTo))) {
    errors.push("Invalid dateTo format. Use ISO date format");
  }

  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    errors.push("dateFrom cannot be later than dateTo");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid filter parameters",
      errors,
    });
  }

  next();
};

// Validate billing cycle data
export const validateBillingCycles = (req, res, next) => {
  const { billingCycles } = req.body;
  const errors = [];

  if (billingCycles && !Array.isArray(billingCycles)) {
    errors.push("Billing cycles must be an array");
  } else if (billingCycles) {
    const validCycles = ["monthly", "quarterly", "yearly", "lifetime"];

    for (let i = 0; i < billingCycles.length; i++) {
      const cycle = billingCycles[i];

      if (!cycle.cycle || !validCycles.includes(cycle.cycle)) {
        errors.push(
          `Invalid billing cycle at index ${i}. Valid cycles are: ${validCycles.join(
            ", "
          )}`
        );
      }

      if (
        cycle.price === undefined ||
        typeof cycle.price !== "number" ||
        cycle.price < 0
      ) {
        errors.push(
          `Invalid price for billing cycle at index ${i}. Price must be a non-negative number`
        );
      }

      if (
        cycle.discount !== undefined &&
        (typeof cycle.discount !== "number" ||
          cycle.discount < 0 ||
          cycle.discount > 100)
      ) {
        errors.push(
          `Invalid discount for billing cycle at index ${i}. Discount must be a number between 0 and 100`
        );
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid billing cycles data",
      errors,
    });
  }

  next();
};

// Validate plan features data
export const validatePlanFeatures = (req, res, next) => {
  const { features } = req.body;
  const errors = [];

  if (features && typeof features !== "object") {
    errors.push("Features must be an object");
  } else if (features) {
    // Validate numeric limits
    const numericFields = [
      "maxUsers",
      "maxProjects",
      "storageLimit",
      "apiCallsLimit",
    ];
    numericFields.forEach((field) => {
      if (
        features[field] !== undefined &&
        (typeof features[field] !== "number" || features[field] < 0)
      ) {
        errors.push(`${field} must be a non-negative number`);
      }
    });

    // Validate support level
    const validSupportLevels = ["basic", "standard", "premium", "enterprise"];
    if (
      features.supportLevel &&
      !validSupportLevels.includes(features.supportLevel)
    ) {
      errors.push(
        `Invalid support level. Valid levels are: ${validSupportLevels.join(
          ", "
        )}`
      );
    }

    // Validate boolean features
    const booleanFields = [
      "advancedAnalytics",
      "customBranding",
      "prioritySupport",
      "apiAccess",
      "customIntegrations",
      "multiUserCollaboration",
      "advancedSecurity",
    ];
    booleanFields.forEach((field) => {
      if (
        features[field] !== undefined &&
        typeof features[field] !== "boolean"
      ) {
        errors.push(`${field} must be a boolean value`);
      }
    });

    // Validate custom features
    if (features.customFeatures && !Array.isArray(features.customFeatures)) {
      errors.push("Custom features must be an array");
    } else if (features.customFeatures) {
      features.customFeatures.forEach((feature, index) => {
        if (!feature.name || typeof feature.name !== "string") {
          errors.push(
            `Custom feature at index ${index} must have a valid name`
          );
        }
        if (
          feature.enabled !== undefined &&
          typeof feature.enabled !== "boolean"
        ) {
          errors.push(
            `Custom feature enabled at index ${index} must be a boolean`
          );
        }
        if (
          feature.limit !== undefined &&
          feature.limit !== null &&
          typeof feature.limit !== "number"
        ) {
          errors.push(
            `Custom feature limit at index ${index} must be a number or null`
          );
        }
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid features data",
      errors,
    });
  }

  next();
};

// Validate usage data update
export const validateUsageData = (req, res, next) => {
  const { usageData } = req.body;
  const errors = [];

  if (!usageData || typeof usageData !== "object") {
    errors.push("Usage data is required and must be an object");
  } else {
    const validFields = ["users", "projects", "storageUsed", "apiCallsUsed"];
    const providedFields = Object.keys(usageData);

    // Check if at least one valid field is provided
    const hasValidField = providedFields.some((field) =>
      validFields.includes(field)
    );
    if (!hasValidField) {
      errors.push(
        `At least one valid usage field is required: ${validFields.join(", ")}`
      );
    }

    // Validate each provided field
    providedFields.forEach((field) => {
      if (validFields.includes(field)) {
        if (
          typeof usageData[field] !== "number" ||
          usageData[field] < 0 ||
          !Number.isInteger(usageData[field])
        ) {
          errors.push(`${field} must be a non-negative integer`);
        }
      } else {
        errors.push(`Invalid usage field: ${field}`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid usage data",
      errors,
    });
  }

  next();
};

// Validate analytics timeframe parameter
export const validateAnalyticsTimeframe = (req, res, next) => {
  const { timeframe } = req.query;

  if (timeframe && timeframe !== "all") {
    const days = parseInt(timeframe);
    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: "Timeframe must be 'all' or a number between 1 and 365 days",
      });
    }
  }

  next();
};

// Validate analytics export parameters
export const validateAnalyticsExport = (req, res, next) => {
  const { type, format } = req.query;
  const errors = [];

  const validTypes = ["engagement", "revenue", "system"];
  const validFormats = ["json", "csv"];

  if (type && !validTypes.includes(type)) {
    errors.push(`Invalid export type. Valid types: ${validTypes.join(", ")}`);
  }

  if (format && !validFormats.includes(format)) {
    errors.push(
      `Invalid export format. Valid formats: ${validFormats.join(", ")}`
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid export parameters",
      errors,
    });
  }

  next();
};

// Validate user analytics update request
export const validateUserAnalyticsUpdate = (req, res, next) => {
  const { action, data } = req.body;
  const errors = [];

  const validActions = [
    "login",
    "timeSpent",
    "featureUsage",
    "search",
    "calculateScores",
  ];

  if (!action) {
    errors.push("Action is required");
  } else if (!validActions.includes(action)) {
    errors.push(`Invalid action. Valid actions: ${validActions.join(", ")}`);
  }

  // Validate data based on action type
  if (action === "timeSpent") {
    if (!data || typeof data.minutes !== "number" || data.minutes < 0) {
      errors.push("Minutes must be a non-negative number for timeSpent action");
    }
  }

  if (action === "featureUsage") {
    if (!data || !data.feature || typeof data.feature !== "string") {
      errors.push("Feature name is required for featureUsage action");
    }
    if (
      data.incrementBy &&
      (typeof data.incrementBy !== "number" || data.incrementBy < 1)
    ) {
      errors.push("IncrementBy must be a positive number");
    }
  }

  if (action === "search") {
    if (!data || !data.searchTerm || typeof data.searchTerm !== "string") {
      errors.push("Search term is required for search action");
    }
  }

  if (action === "login") {
    if (
      data &&
      data.sessionDuration &&
      (typeof data.sessionDuration !== "number" || data.sessionDuration < 0)
    ) {
      errors.push("Session duration must be a non-negative number");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid analytics update request",
      errors,
    });
  }

  next();
};

// Validate customer segmentation parameters
export const validateCustomerSegmentation = (req, res, next) => {
  const { segmentBy } = req.query;
  const validSegments = [
    "role",
    "engagement",
    "subscription",
    "geographic",
    "device",
  ];

  if (segmentBy && !validSegments.includes(segmentBy)) {
    return res.status(400).json({
      success: false,
      message: `Invalid segment type. Valid segments: ${validSegments.join(
        ", "
      )}`,
    });
  }

  next();
};

// Validate engagement metrics filters
export const validateEngagementFilters = (req, res, next) => {
  const { userRole, engagementLevel, sortBy } = req.query;
  const errors = [];

  const validRoles = ["farmer", "advisor", "viewer"];
  const validEngagementLevels = ["high", "medium", "low"];
  const validSortFields = [
    "engagementScores.overall",
    "engagementScores.activityScore",
    "engagementScores.interactionScore",
    "engagementScores.retentionScore",
    "loginFrequency.totalLogins",
    "timeMetrics.totalTimeSpent",
    "createdAt",
  ];

  if (userRole && !validRoles.includes(userRole)) {
    errors.push(`Invalid user role. Valid roles: ${validRoles.join(", ")}`);
  }

  if (engagementLevel && !validEngagementLevels.includes(engagementLevel)) {
    errors.push(
      `Invalid engagement level. Valid levels: ${validEngagementLevels.join(
        ", "
      )}`
    );
  }

  if (sortBy && !validSortFields.includes(sortBy)) {
    errors.push(
      `Invalid sort field. Valid fields: ${validSortFields.join(", ")}`
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid engagement filter parameters",
      errors,
    });
  }

  next();
};

// Validate revenue analytics filters
export const validateRevenueFilters = (req, res, next) => {
  const { planType, currency, period } = req.query;
  const errors = [];

  const validPlanTypes = ["basic", "premium", "professional", "enterprise"];
  const validCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD"];
  const validPeriods = ["daily", "weekly", "monthly", "quarterly"];

  if (planType && !validPlanTypes.includes(planType)) {
    errors.push(`Invalid plan type. Valid types: ${validPlanTypes.join(", ")}`);
  }

  if (currency && !validCurrencies.includes(currency)) {
    errors.push(
      `Invalid currency. Valid currencies: ${validCurrencies.join(", ")}`
    );
  }

  if (period && !validPeriods.includes(period)) {
    errors.push(`Invalid period. Valid periods: ${validPeriods.join(", ")}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid revenue filter parameters",
      errors,
    });
  }

  next();
};

// Validate usage statistics filters
export const validateUsageFilters = (req, res, next) => {
  const { featureCategory } = req.query;
  const validCategories = [
    "all",
    "core",
    "communication",
    "platform",
    "advanced",
  ];

  if (featureCategory && !validCategories.includes(featureCategory)) {
    return res.status(400).json({
      success: false,
      message: `Invalid feature category. Valid categories: ${validCategories.join(
        ", "
      )}`,
    });
  }

  next();
};

// Validate content creation/update data
export const validateContentData = (req, res, next) => {
  const { title, excerpt, content, type, category } = req.body;
  const errors = [];

  // Required fields validation
  if (!title || title.trim().length === 0) {
    errors.push("Title is required");
  } else if (title.length > 200) {
    errors.push("Title cannot exceed 200 characters");
  }

  if (!excerpt || excerpt.trim().length === 0) {
    errors.push("Excerpt is required");
  } else if (excerpt.length > 500) {
    errors.push("Excerpt cannot exceed 500 characters");
  }

  if (!content || content.trim().length === 0) {
    errors.push("Content is required");
  }

  // Content type validation
  const validTypes = [
    "blog_post",
    "news",
    "announcement",
    "tutorial",
    "guide",
    "video",
    "resource",
  ];
  if (!type) {
    errors.push("Content type is required");
  } else if (!validTypes.includes(type)) {
    errors.push(`Invalid content type. Valid types: ${validTypes.join(", ")}`);
  }

  // Category validation
  if (!category || category.trim().length === 0) {
    errors.push("Category is required");
  }

  // Status validation
  const { status } = req.body;
  if (status) {
    const validStatuses = [
      "draft",
      "published",
      "scheduled",
      "archived",
      "private",
    ];
    if (!validStatuses.includes(status)) {
      errors.push(
        `Invalid status. Valid statuses: ${validStatuses.join(", ")}`
      );
    }
  }

  // Visibility validation
  const { visibility } = req.body;
  if (visibility) {
    const validVisibilities = [
      "public",
      "members_only",
      "premium_only",
      "admin_only",
    ];
    if (!validVisibilities.includes(visibility)) {
      errors.push(
        `Invalid visibility. Valid visibilities: ${validVisibilities.join(
          ", "
        )}`
      );
    }
  }

  // Priority validation
  const { priority } = req.body;
  if (priority) {
    const validPriorities = ["low", "normal", "high", "urgent"];
    if (!validPriorities.includes(priority)) {
      errors.push(
        `Invalid priority. Valid priorities: ${validPriorities.join(", ")}`
      );
    }
  }

  // Schedule date validation
  const { scheduledAt } = req.body;
  if (scheduledAt) {
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      errors.push("Invalid scheduled date format");
    } else if (scheduledDate <= new Date()) {
      errors.push("Scheduled date must be in the future");
    }
  }

  // Tags validation
  const { tags } = req.body;
  if (tags && Array.isArray(tags)) {
    if (tags.length > 20) {
      errors.push("Cannot have more than 20 tags");
    }
    tags.forEach((tag, index) => {
      if (typeof tag !== "string" || tag.trim().length === 0) {
        errors.push(`Tag at index ${index} must be a non-empty string`);
      } else if (tag.length > 50) {
        errors.push(`Tag at index ${index} cannot exceed 50 characters`);
      }
    });
  }

  // SEO validation
  const { seo } = req.body;
  if (seo) {
    if (seo.metaTitle && seo.metaTitle.length > 60) {
      errors.push("Meta title cannot exceed 60 characters");
    }
    if (seo.metaDescription && seo.metaDescription.length > 160) {
      errors.push("Meta description cannot exceed 160 characters");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid content data",
      errors,
    });
  }

  next();
};

// Validate content filters
export const validateContentFilters = (req, res, next) => {
  const { type, status, visibility, priority, sortBy } = req.query;
  const errors = [];

  const validTypes = [
    "blog_post",
    "news",
    "announcement",
    "tutorial",
    "guide",
    "video",
    "resource",
  ];
  const validStatuses = [
    "draft",
    "published",
    "scheduled",
    "archived",
    "private",
  ];
  const validVisibilities = [
    "public",
    "members_only",
    "premium_only",
    "admin_only",
  ];
  const validPriorities = ["low", "normal", "high", "urgent"];
  const validSortFields = [
    "createdAt",
    "updatedAt",
    "publishedAt",
    "title",
    "analytics.views",
    "analytics.likes",
    "analytics.engagementScore",
    "featured",
  ];

  if (type && !validTypes.includes(type)) {
    errors.push(`Invalid content type. Valid types: ${validTypes.join(", ")}`);
  }

  if (status && !validStatuses.includes(status)) {
    errors.push(`Invalid status. Valid statuses: ${validStatuses.join(", ")}`);
  }

  if (visibility && !validVisibilities.includes(visibility)) {
    errors.push(
      `Invalid visibility. Valid visibilities: ${validVisibilities.join(", ")}`
    );
  }

  if (priority && !validPriorities.includes(priority)) {
    errors.push(
      `Invalid priority. Valid priorities: ${validPriorities.join(", ")}`
    );
  }

  if (sortBy && !validSortFields.includes(sortBy)) {
    errors.push(
      `Invalid sort field. Valid fields: ${validSortFields.join(", ")}`
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid content filter parameters",
      errors,
    });
  }

  next();
};

// Validate bulk content actions
export const validateBulkContentActions = (req, res, next) => {
  const { contentIds, action, data } = req.body;
  const errors = [];

  // Content IDs validation
  if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
    errors.push("Content IDs array is required and cannot be empty");
  } else {
    contentIds.forEach((id, index) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        errors.push(`Invalid content ID at index ${index}`);
      }
    });

    if (contentIds.length > 100) {
      errors.push("Cannot perform bulk action on more than 100 items at once");
    }
  }

  // Action validation
  const validActions = [
    "publish",
    "unpublish",
    "archive",
    "delete",
    "feature",
    "unfeature",
    "changeCategory",
  ];
  if (!action) {
    errors.push("Action is required");
  } else if (!validActions.includes(action)) {
    errors.push(`Invalid action. Valid actions: ${validActions.join(", ")}`);
  }

  // Action-specific validation
  if (action === "changeCategory") {
    if (!data || !data.category) {
      errors.push("Category is required for changeCategory action");
    }
  }

  if (action === "delete") {
    if (!data || !data.confirmDelete) {
      errors.push("Please confirm deletion by setting confirmDelete to true");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid bulk action request",
      errors,
    });
  }

  next();
};

// Validate content category data
export const validateCategoryData = (req, res, next) => {
  const { name, description, parentCategory, level } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length === 0) {
    errors.push("Category name is required");
  } else if (name.length > 100) {
    errors.push("Category name cannot exceed 100 characters");
  }

  // Description validation
  if (description && description.length > 500) {
    errors.push("Description cannot exceed 500 characters");
  }

  // Parent category validation
  if (parentCategory && !mongoose.Types.ObjectId.isValid(parentCategory)) {
    errors.push("Invalid parent category ID format");
  }

  // Level validation
  if (level !== undefined) {
    if (typeof level !== "number" || level < 0 || level > 3) {
      errors.push("Level must be a number between 0 and 3");
    }
  }

  // Content type validation
  const { allowedContentTypes, defaultContentType } = req.body;
  const validContentTypes = [
    "blog_post",
    "news",
    "announcement",
    "tutorial",
    "guide",
    "video",
    "resource",
  ];

  if (allowedContentTypes && Array.isArray(allowedContentTypes)) {
    allowedContentTypes.forEach((type, index) => {
      if (!validContentTypes.includes(type)) {
        errors.push(`Invalid content type at index ${index}: ${type}`);
      }
    });
  }

  if (defaultContentType && !validContentTypes.includes(defaultContentType)) {
    errors.push(`Invalid default content type: ${defaultContentType}`);
  }

  // Permissions validation
  const { permissions } = req.body;
  if (permissions) {
    const validViewLevels = ["public", "members", "premium", "admin"];
    const validEditLevels = ["admin", "editor", "author"];

    if (
      permissions.viewLevel &&
      !validViewLevels.includes(permissions.viewLevel)
    ) {
      errors.push(
        `Invalid view level. Valid levels: ${validViewLevels.join(", ")}`
      );
    }

    if (
      permissions.createLevel &&
      !validEditLevels.includes(permissions.createLevel)
    ) {
      errors.push(
        `Invalid create level. Valid levels: ${validEditLevels.join(", ")}`
      );
    }

    if (
      permissions.editLevel &&
      !validEditLevels.includes(permissions.editLevel)
    ) {
      errors.push(
        `Invalid edit level. Valid levels: ${validEditLevels.join(", ")}`
      );
    }
  }

  // Color validation
  const { color } = req.body;
  if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    errors.push("Invalid color format. Use hex color codes (e.g., #FF0000)");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid category data",
      errors,
    });
  }

  next();
};

// Validate content scheduling request
export const validateContentScheduling = (req, res, next) => {
  const { scheduledAt } = req.body;
  const errors = [];

  if (!scheduledAt) {
    errors.push("Scheduled date is required");
  } else {
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      errors.push("Invalid scheduled date format");
    } else if (scheduledDate <= new Date()) {
      errors.push("Scheduled date must be in the future");
    } else if (
      scheduledDate > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    ) {
      errors.push("Scheduled date cannot be more than 1 year in the future");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid scheduling request",
      errors,
    });
  }

  next();
};

// Validate admin note request
export const validateAdminNote = (req, res, next) => {
  const { note, type } = req.body;
  const errors = [];

  if (!note || note.trim().length === 0) {
    errors.push("Note content is required");
  } else if (note.length > 1000) {
    errors.push("Note cannot exceed 1000 characters");
  }

  const validTypes = ["info", "warning", "important", "todo"];
  if (type && !validTypes.includes(type)) {
    errors.push(`Invalid note type. Valid types: ${validTypes.join(", ")}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid admin note",
      errors,
    });
  }

  next();
};

// Validate content search parameters
export const validateContentSearch = (req, res, next) => {
  const { search, page, limit } = req.query;
  const errors = [];

  if (search && search.trim().length < 2) {
    errors.push("Search query must be at least 2 characters long");
  }

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    errors.push("Page must be a positive integer");
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    errors.push("Limit must be between 1 and 100");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid search parameters",
      errors,
    });
  }

  next();
};

// ============================================
// SUPPORT AND TICKETING VALIDATION FUNCTIONS
// ============================================

// Validate ticket creation data
export const validateTicketData = (req, res, next) => {
  const { title, description, category, priority, submitterUserId } = req.body;
  const errors = [];

  // Title validation
  if (!title || title.trim().length === 0) {
    errors.push("Title is required");
  } else if (title.length > 200) {
    errors.push("Title cannot exceed 200 characters");
  }

  // Description validation
  if (!description || description.trim().length === 0) {
    errors.push("Description is required");
  } else if (description.length > 2000) {
    errors.push("Description cannot exceed 2000 characters");
  }

  // Category validation
  const validCategories = [
    "technical_issue",
    "account_support",
    "billing_inquiry",
    "feature_request",
    "bug_report",
    "general_inquiry",
    "subscription_support",
    "content_issue",
    "user_management",
    "other",
  ];
  if (!category) {
    errors.push("Category is required");
  } else if (!validCategories.includes(category)) {
    errors.push(
      `Invalid category. Valid categories: ${validCategories.join(", ")}`
    );
  }

  // Priority validation
  const validPriorities = ["low", "normal", "high", "urgent", "critical"];
  if (priority && !validPriorities.includes(priority)) {
    errors.push(
      `Invalid priority. Valid priorities: ${validPriorities.join(", ")}`
    );
  }

  // Submitter validation
  if (submitterUserId && !mongoose.Types.ObjectId.isValid(submitterUserId)) {
    errors.push("Invalid submitter user ID format");
  }

  // Team validation
  const { team } = req.body;
  const validTeams = [
    "support",
    "technical",
    "billing",
    "product",
    "management",
  ];
  if (team && !validTeams.includes(team)) {
    errors.push(`Invalid team. Valid teams: ${validTeams.join(", ")}`);
  }

  // Tags validation
  const { tags } = req.body;
  if (tags && Array.isArray(tags)) {
    if (tags.length > 10) {
      errors.push("Cannot have more than 10 tags");
    }
    tags.forEach((tag, index) => {
      if (typeof tag !== "string" || tag.trim().length === 0) {
        errors.push(`Tag at index ${index} must be a non-empty string`);
      } else if (tag.length > 50) {
        errors.push(`Tag at index ${index} cannot exceed 50 characters`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid ticket data",
      errors,
    });
  }

  next();
};

// Validate ticket update data
export const validateTicketUpdate = (req, res, next) => {
  const { title, description, category, priority, status, team, resolution } =
    req.body;
  const errors = [];

  // Title validation (if provided)
  if (title !== undefined) {
    if (title.trim().length === 0) {
      errors.push("Title cannot be empty");
    } else if (title.length > 200) {
      errors.push("Title cannot exceed 200 characters");
    }
  }

  // Description validation (if provided)
  if (description !== undefined) {
    if (description.trim().length === 0) {
      errors.push("Description cannot be empty");
    } else if (description.length > 2000) {
      errors.push("Description cannot exceed 2000 characters");
    }
  }

  // Category validation (if provided)
  const validCategories = [
    "technical_issue",
    "account_support",
    "billing_inquiry",
    "feature_request",
    "bug_report",
    "general_inquiry",
    "subscription_support",
    "content_issue",
    "user_management",
    "other",
  ];
  if (category && !validCategories.includes(category)) {
    errors.push(
      `Invalid category. Valid categories: ${validCategories.join(", ")}`
    );
  }

  // Priority validation (if provided)
  const validPriorities = ["low", "normal", "high", "urgent", "critical"];
  if (priority && !validPriorities.includes(priority)) {
    errors.push(
      `Invalid priority. Valid priorities: ${validPriorities.join(", ")}`
    );
  }

  // Status validation (if provided)
  const validStatuses = [
    "open",
    "in_progress",
    "pending_customer",
    "pending_internal",
    "resolved",
    "closed",
    "cancelled",
  ];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Invalid status. Valid statuses: ${validStatuses.join(", ")}`);
  }

  // Team validation (if provided)
  const validTeams = [
    "support",
    "technical",
    "billing",
    "product",
    "management",
  ];
  if (team && !validTeams.includes(team)) {
    errors.push(`Invalid team. Valid teams: ${validTeams.join(", ")}`);
  }

  // Resolution validation (if provided)
  const validResolutions = [
    "solved",
    "workaround_provided",
    "duplicate",
    "not_reproducible",
    "wont_fix",
    "by_design",
    "user_error",
    "cancelled_by_user",
  ];
  if (resolution && !validResolutions.includes(resolution)) {
    errors.push(
      `Invalid resolution. Valid resolutions: ${validResolutions.join(", ")}`
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid ticket update data",
      errors,
    });
  }

  next();
};

// Validate ticket filters
export const validateTicketFilters = (req, res, next) => {
  const { status, priority, category, team, sortBy } = req.query;
  const errors = [];

  const validStatuses = [
    "open",
    "in_progress",
    "pending_customer",
    "pending_internal",
    "resolved",
    "closed",
    "cancelled",
  ];
  const validPriorities = ["low", "normal", "high", "urgent", "critical"];
  const validCategories = [
    "technical_issue",
    "account_support",
    "billing_inquiry",
    "feature_request",
    "bug_report",
    "general_inquiry",
    "subscription_support",
    "content_issue",
    "user_management",
    "other",
  ];
  const validTeams = [
    "support",
    "technical",
    "billing",
    "product",
    "management",
  ];
  const validSortFields = [
    "timestamps.createdAt",
    "timestamps.updatedAt",
    "timestamps.lastActivityAt",
    "priority",
    "status",
    "title",
    "ticketNumber",
  ];

  if (status && !validStatuses.includes(status)) {
    errors.push(`Invalid status. Valid statuses: ${validStatuses.join(", ")}`);
  }

  if (priority && !validPriorities.includes(priority)) {
    errors.push(
      `Invalid priority. Valid priorities: ${validPriorities.join(", ")}`
    );
  }

  if (category && !validCategories.includes(category)) {
    errors.push(
      `Invalid category. Valid categories: ${validCategories.join(", ")}`
    );
  }

  if (team && !validTeams.includes(team)) {
    errors.push(`Invalid team. Valid teams: ${validTeams.join(", ")}`);
  }

  if (sortBy && !validSortFields.includes(sortBy)) {
    errors.push(
      `Invalid sort field. Valid fields: ${validSortFields.join(", ")}`
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid ticket filter parameters",
      errors,
    });
  }

  next();
};

// Validate ticket assignment
export const validateTicketAssignment = (req, res, next) => {
  const { adminId } = req.body;
  const errors = [];

  if (!adminId) {
    errors.push("Admin ID is required for ticket assignment");
  } else if (!mongoose.Types.ObjectId.isValid(adminId)) {
    errors.push("Invalid admin ID format");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid ticket assignment data",
      errors,
    });
  }

  next();
};

// Validate ticket message
export const validateTicketMessage = (req, res, next) => {
  const { content, isInternal, attachments } = req.body;
  const errors = [];

  // Content validation
  if (!content || content.trim().length === 0) {
    errors.push("Message content is required");
  } else if (content.length > 2000) {
    errors.push("Message content cannot exceed 2000 characters");
  }

  // Internal flag validation
  if (isInternal !== undefined && typeof isInternal !== "boolean") {
    errors.push("isInternal must be a boolean value");
  }

  // Attachments validation
  if (attachments && Array.isArray(attachments)) {
    if (attachments.length > 5) {
      errors.push("Cannot attach more than 5 files");
    }

    attachments.forEach((attachment, index) => {
      if (!attachment.filename || !attachment.url) {
        errors.push(`Attachment at index ${index} must have filename and url`);
      }
      if (attachment.size && attachment.size > 10 * 1024 * 1024) {
        // 10MB limit
        errors.push(`Attachment at index ${index} exceeds 10MB size limit`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid ticket message data",
      errors,
    });
  }

  next();
};

// Validate ticket escalation
export const validateTicketEscalation = (req, res, next) => {
  const { reason } = req.body;
  const errors = [];

  if (!reason || reason.trim().length === 0) {
    errors.push("Escalation reason is required");
  } else if (reason.length > 500) {
    errors.push("Escalation reason cannot exceed 500 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid ticket escalation data",
      errors,
    });
  }

  next();
};

// Validate ticket closure
export const validateTicketClosure = (req, res, next) => {
  const { resolution, resolutionNote } = req.body;
  const errors = [];

  const validResolutions = [
    "solved",
    "workaround_provided",
    "duplicate",
    "not_reproducible",
    "wont_fix",
    "by_design",
    "user_error",
    "cancelled_by_user",
  ];

  if (!resolution) {
    errors.push("Resolution is required for ticket closure");
  } else if (!validResolutions.includes(resolution)) {
    errors.push(
      `Invalid resolution. Valid resolutions: ${validResolutions.join(", ")}`
    );
  }

  if (resolutionNote && resolutionNote.length > 1000) {
    errors.push("Resolution note cannot exceed 1000 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid ticket closure data",
      errors,
    });
  }

  next();
};

// Validate bulk ticket operations
export const validateBulkTicketActions = (req, res, next) => {
  const { ticketIds, updates } = req.body;
  const errors = [];

  // Ticket IDs validation
  if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
    errors.push("Ticket IDs array is required and cannot be empty");
  } else {
    ticketIds.forEach((id, index) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        errors.push(`Invalid ticket ID at index ${index}`);
      }
    });

    if (ticketIds.length > 50) {
      errors.push("Cannot perform bulk action on more than 50 tickets at once");
    }
  }

  // Updates validation
  if (!updates || typeof updates !== "object") {
    errors.push("Updates object is required");
  } else {
    const allowedFields = ["status", "priority", "team", "assignedTo"];
    const updateKeys = Object.keys(updates);

    if (updateKeys.length === 0) {
      errors.push("At least one update field is required");
    }

    updateKeys.forEach((key) => {
      if (!allowedFields.includes(key)) {
        errors.push(
          `Invalid update field: ${key}. Allowed fields: ${allowedFields.join(
            ", "
          )}`
        );
      }
    });

    // Validate specific update values
    if (updates.status) {
      const validStatuses = [
        "open",
        "in_progress",
        "pending_customer",
        "pending_internal",
        "resolved",
        "closed",
        "cancelled",
      ];
      if (!validStatuses.includes(updates.status)) {
        errors.push(
          `Invalid status. Valid statuses: ${validStatuses.join(", ")}`
        );
      }
    }

    if (updates.priority) {
      const validPriorities = ["low", "normal", "high", "urgent", "critical"];
      if (!validPriorities.includes(updates.priority)) {
        errors.push(
          `Invalid priority. Valid priorities: ${validPriorities.join(", ")}`
        );
      }
    }

    if (updates.team) {
      const validTeams = [
        "support",
        "technical",
        "billing",
        "product",
        "management",
      ];
      if (!validTeams.includes(updates.team)) {
        errors.push(`Invalid team. Valid teams: ${validTeams.join(", ")}`);
      }
    }

    if (
      updates.assignedTo &&
      !mongoose.Types.ObjectId.isValid(updates.assignedTo)
    ) {
      errors.push("Invalid assignedTo admin ID format");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid bulk ticket action request",
      errors,
    });
  }

  next();
};

// Validate knowledge base article data
export const validateKnowledgeBaseData = (req, res, next) => {
  const { title, content, type, category } = req.body;
  const errors = [];

  // Title validation
  if (!title || title.trim().length === 0) {
    errors.push("Title is required");
  } else if (title.length > 200) {
    errors.push("Title cannot exceed 200 characters");
  }

  // Content validation
  if (!content || content.trim().length === 0) {
    errors.push("Content is required");
  }

  // Type validation
  const validTypes = [
    "article",
    "faq",
    "tutorial",
    "guide",
    "troubleshooting",
    "video",
    "documentation",
  ];
  if (type && !validTypes.includes(type)) {
    errors.push(`Invalid type. Valid types: ${validTypes.join(", ")}`);
  }

  // Category validation
  if (!category) {
    errors.push("Category is required");
  } else if (!mongoose.Types.ObjectId.isValid(category)) {
    errors.push("Invalid category ID format");
  }

  // Excerpt validation
  const { excerpt } = req.body;
  if (excerpt && excerpt.length > 500) {
    errors.push("Excerpt cannot exceed 500 characters");
  }

  // Question and answer validation for FAQ type
  if (type === "faq") {
    const { question, answer } = req.body;
    if (!question || question.trim().length === 0) {
      errors.push("Question is required for FAQ type");
    } else if (question.length > 300) {
      errors.push("Question cannot exceed 300 characters");
    }

    if (!answer || answer.trim().length === 0) {
      errors.push("Answer is required for FAQ type");
    } else if (answer.length > 2000) {
      errors.push("Answer cannot exceed 2000 characters");
    }
  }

  // Visibility validation
  const { visibility } = req.body;
  const validVisibilities = ["public", "members_only", "admin_only"];
  if (visibility && !validVisibilities.includes(visibility)) {
    errors.push(
      `Invalid visibility. Valid visibilities: ${validVisibilities.join(", ")}`
    );
  }

  // Tags validation
  const { tags } = req.body;
  if (tags && Array.isArray(tags)) {
    if (tags.length > 20) {
      errors.push("Cannot have more than 20 tags");
    }
    tags.forEach((tag, index) => {
      if (typeof tag !== "string" || tag.trim().length === 0) {
        errors.push(`Tag at index ${index} must be a non-empty string`);
      } else if (tag.length > 50) {
        errors.push(`Tag at index ${index} cannot exceed 50 characters`);
      }
    });
  }

  // SEO validation
  const { seo } = req.body;
  if (seo) {
    if (seo.metaTitle && seo.metaTitle.length > 60) {
      errors.push("Meta title cannot exceed 60 characters");
    }
    if (seo.metaDescription && seo.metaDescription.length > 160) {
      errors.push("Meta description cannot exceed 160 characters");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid knowledge base article data",
      errors,
    });
  }

  next();
};

// Validate knowledge base category data
export const validateKnowledgeBaseCategoryData = (req, res, next) => {
  const { name, description, parentCategory } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length === 0) {
    errors.push("Category name is required");
  } else if (name.length > 100) {
    errors.push("Category name cannot exceed 100 characters");
  }

  // Description validation
  if (description && description.length > 500) {
    errors.push("Description cannot exceed 500 characters");
  }

  // Parent category validation
  if (parentCategory && !mongoose.Types.ObjectId.isValid(parentCategory)) {
    errors.push("Invalid parent category ID format");
  }

  // Allowed content types validation
  const { allowedContentTypes } = req.body;
  if (allowedContentTypes && Array.isArray(allowedContentTypes)) {
    const validTypes = [
      "article",
      "faq",
      "tutorial",
      "guide",
      "troubleshooting",
      "video",
      "documentation",
    ];
    allowedContentTypes.forEach((type, index) => {
      if (!validTypes.includes(type)) {
        errors.push(`Invalid content type at index ${index}: ${type}`);
      }
    });
  }

  // Color validation
  const { color } = req.body;
  if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    errors.push("Invalid color format. Use hex color codes (e.g., #FF0000)");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid knowledge base category data",
      errors,
    });
  }

  next();
};

// Validate analytics timeframe
export const validateSupportAnalyticsTimeframe = (req, res, next) => {
  const { timeframe, team, category } = req.query;
  const errors = [];

  if (timeframe && !["7", "30", "90", "365", "all"].includes(timeframe)) {
    errors.push("Invalid timeframe. Valid values: 7, 30, 90, 365, all");
  }

  const validTeams = [
    "support",
    "technical",
    "billing",
    "product",
    "management",
    "all",
  ];
  if (team && !validTeams.includes(team)) {
    errors.push(`Invalid team. Valid teams: ${validTeams.join(", ")}`);
  }

  const validCategories = [
    "technical_issue",
    "account_support",
    "billing_inquiry",
    "feature_request",
    "bug_report",
    "general_inquiry",
    "subscription_support",
    "content_issue",
    "user_management",
    "other",
    "all",
  ];
  if (category && !validCategories.includes(category)) {
    errors.push(
      `Invalid category. Valid categories: ${validCategories.join(", ")}`
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid analytics parameters",
      errors,
    });
  }

  next();
};
