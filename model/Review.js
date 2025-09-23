import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // Review Content
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: function (rating) {
          return Number.isInteger(rating);
        },
        message: "Rating must be a whole number",
      },
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Review title cannot exceed 100 characters"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      maxlength: [1000, "Review comment cannot exceed 1000 characters"],
      minlength: [5, "Review comment must be at least 5 characters"],
    },

    // Review Metadata
    reviewType: {
      type: String,
      enum: ["service", "product", "platform", "advisor", "general"],
      required: true,
      default: "general",
    },

    // User Information
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer ID is required"],
    },
    reviewerName: {
      type: String,
      required: true,
      trim: true,
    },
    reviewerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Target Information (what is being reviewed)
    targetType: {
      type: String,
      enum: ["user", "service", "product", "platform"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "targetModel",
      default: null,
    },
    targetModel: {
      type: String,
      enum: ["User", "Service", "Product"],
      default: null,
    },
    targetName: {
      type: String,
      trim: true,
      maxlength: [200, "Target name cannot exceed 200 characters"],
    },

    // Review Status and Moderation
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged", "hidden"],
      default: "pending",
      required: true,
    },
    moderationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Moderation reason cannot exceed 500 characters"],
    },

    // Admin Actions
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },

    // Admin Response
    adminResponse: {
      responseText: {
        type: String,
        trim: true,
        maxlength: [1000, "Admin response cannot exceed 1000 characters"],
      },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SuperAdmin",
        default: null,
      },
      respondedAt: {
        type: Date,
        default: null,
      },
      isPublic: {
        type: Boolean,
        default: true,
      },
    },

    // Review Metrics
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Additional Data
    reviewSource: {
      type: String,
      enum: ["web", "mobile", "api", "admin"],
      default: "web",
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },

    // Timestamps for better tracking
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.ipAddress;
        delete ret.userAgent;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.ipAddress;
        delete ret.userAgent;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
reviewSchema.index({ reviewerId: 1 });
reviewSchema.index({ targetType: 1, targetId: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ moderatedAt: -1 });
reviewSchema.index({ reviewType: 1 });
reviewSchema.index(
  {
    title: "text",
    comment: "text",
    reviewerName: "text",
    targetName: "text",
  },
  {
    name: "review_search_index",
  }
);

// Compound indexes for common queries
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ rating: 1, createdAt: -1 });
reviewSchema.index({ reviewType: 1, status: 1 });
reviewSchema.index({ targetType: 1, targetId: 1, status: 1 });

// Virtual for review age
reviewSchema.virtual("reviewAge").get(function () {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for has admin response
reviewSchema.virtual("hasAdminResponse").get(function () {
  return !!(
    this.adminResponse?.responseText && this.adminResponse?.responseText.trim()
  );
});

// Middleware to update lastUpdated on save
reviewSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

// Instance method to approve review
reviewSchema.methods.approveReview = function (adminId, reason = "") {
  this.status = "approved";
  this.moderatedBy = adminId;
  this.moderatedAt = new Date();
  if (reason) this.moderationReason = reason;
};

// Instance method to reject review
reviewSchema.methods.rejectReview = function (adminId, reason = "") {
  this.status = "rejected";
  this.moderatedBy = adminId;
  this.moderatedAt = new Date();
  this.moderationReason = reason;
};

// Instance method to flag review
reviewSchema.methods.flagReview = function (adminId, reason = "") {
  this.status = "flagged";
  this.moderatedBy = adminId;
  this.moderatedAt = new Date();
  this.moderationReason = reason;
};

// Instance method to hide review
reviewSchema.methods.hideReview = function (adminId, reason = "") {
  this.status = "hidden";
  this.moderatedBy = adminId;
  this.moderatedAt = new Date();
  this.moderationReason = reason;
};

// Instance method to add admin response
reviewSchema.methods.addAdminResponse = function (
  responseText,
  adminId,
  isPublic = true
) {
  this.adminResponse = {
    responseText,
    respondedBy: adminId,
    respondedAt: new Date(),
    isPublic,
  };
};

// Instance method to update admin response
reviewSchema.methods.updateAdminResponse = function (
  responseText,
  adminId,
  isPublic = true
) {
  if (this.adminResponse) {
    this.adminResponse.responseText = responseText;
    this.adminResponse.respondedBy = adminId;
    this.adminResponse.respondedAt = new Date();
    this.adminResponse.isPublic = isPublic;
  } else {
    this.addAdminResponse(responseText, adminId, isPublic);
  }
};

// Instance method to remove admin response
reviewSchema.methods.removeAdminResponse = function () {
  this.adminResponse = {
    responseText: null,
    respondedBy: null,
    respondedAt: null,
    isPublic: false,
  };
};

// Static method to get review statistics
reviewSchema.statics.getReviewStatistics = async function (filters = {}) {
  const matchStage = { ...filters };

  const [totalStats, ratingDistribution, statusDistribution, typeDistribution] =
    await Promise.all([
      // Total reviews and average rating
      this.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: "$rating" },
            totalHelpful: { $sum: "$helpfulCount" },
            totalReports: { $sum: "$reportCount" },
          },
        },
      ]),

      // Rating distribution
      this.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Status distribution
      this.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // Review type distribution
      this.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$reviewType",
            count: { $sum: 1 },
            averageRating: { $avg: "$rating" },
          },
        },
      ]),
    ]);

  // Format rating distribution
  const ratings = {};
  for (let i = 1; i <= 5; i++) {
    ratings[i] = 0;
  }
  ratingDistribution.forEach((item) => {
    ratings[item._id] = item.count;
  });

  // Format status distribution
  const statuses = {};
  statusDistribution.forEach((item) => {
    statuses[item._id] = item.count;
  });

  // Format type distribution
  const types = {};
  typeDistribution.forEach((item) => {
    types[item._id] = {
      count: item.count,
      averageRating: item.averageRating,
    };
  });

  return {
    totalReviews: totalStats[0]?.totalReviews || 0,
    averageRating: totalStats[0]?.averageRating || 0,
    totalHelpful: totalStats[0]?.totalHelpful || 0,
    totalReports: totalStats[0]?.totalReports || 0,
    ratingDistribution: ratings,
    statusDistribution: statuses,
    typeDistribution: types,
  };
};

// Static method to search reviews with filters and pagination
reviewSchema.statics.searchReviews = async function (
  filters = {},
  options = {}
) {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    search = "",
    rating = "",
    status = "",
    reviewType = "",
    targetType = "",
    dateFrom = "",
    dateTo = "",
    hasAdminResponse = "",
  } = options;

  const query = { ...filters };

  // Add search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { comment: { $regex: search, $options: "i" } },
      { reviewerName: { $regex: search, $options: "i" } },
      { targetName: { $regex: search, $options: "i" } },
    ];
  }

  // Add filters
  if (rating) query.rating = parseInt(rating);
  if (status) query.status = status;
  if (reviewType) query.reviewType = reviewType;
  if (targetType) query.targetType = targetType;

  // Date range filter
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  // Admin response filter
  if (hasAdminResponse === "true") {
    query["adminResponse.responseText"] = { $exists: true, $ne: null, $ne: "" };
  } else if (hasAdminResponse === "false") {
    query.$or = [
      { "adminResponse.responseText": { $exists: false } },
      { "adminResponse.responseText": null },
      { "adminResponse.responseText": "" },
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [reviews, total] = await Promise.all([
    this.find(query)
      .populate("reviewerId", "firstName lastName email")
      .populate("moderatedBy", "firstName lastName email")
      .populate("adminResponse.respondedBy", "firstName lastName email")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    reviews,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit,
    },
  };
};

// Static method to get reviews by target
reviewSchema.statics.getReviewsByTarget = async function (
  targetType,
  targetId,
  options = {}
) {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    status = "approved",
  } = options;

  const query = {
    targetType,
    targetId,
    status,
  };

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [reviews, total, stats] = await Promise.all([
    this.find(query)
      .populate("reviewerId", "firstName lastName")
      .populate("adminResponse.respondedBy", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
    this.getReviewStatistics(query),
  ]);

  return {
    reviews,
    statistics: stats,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit,
    },
  };
};

const Review = mongoose.model("Review", reviewSchema);

export default Review;
