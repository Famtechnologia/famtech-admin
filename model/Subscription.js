import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    // User Information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Subscription Plan Details
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: [true, "Plan ID is required"],
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    planType: {
      type: String,
      enum: ["basic", "premium", "professional", "enterprise"],
      required: true,
    },

    // Subscription Status
    status: {
      type: String,
      enum: [
        "trial",
        "active",
        "inactive",
        "cancelled",
        "expired",
        "suspended",
        "pending_payment",
        "pending_cancellation",
      ],
      default: "trial",
      required: true,
      index: true,
    },

    // Subscription Dates
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    trialStartDate: {
      type: Date,
      default: null,
    },
    trialEndDate: {
      type: Date,
      default: null,
    },
    cancelledDate: {
      type: Date,
      default: null,
    },
    suspendedDate: {
      type: Date,
      default: null,
    },

    // Billing Information
    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "lifetime"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
      uppercase: true,
    },

    // Payment Information
    paymentMethod: {
      type: String,
      enum: ["card", "paypal", "bank_transfer", "crypto", "other"],
      default: "card",
    },
    paymentGateway: {
      type: String,
      enum: ["stripe", "paypal", "razorpay", "flutterwave", "other"],
      default: "stripe",
    },
    gatewaySubscriptionId: {
      type: String,
      trim: true,
      index: true,
    },
    gatewayCustomerId: {
      type: String,
      trim: true,
    },

    // Auto-renewal Settings
    autoRenew: {
      type: Boolean,
      default: true,
    },
    nextBillingDate: {
      type: Date,
      required: true,
    },
    lastBillingDate: {
      type: Date,
      default: null,
    },

    // Discount & Promotions
    discountCode: {
      type: String,
      trim: true,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    originalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Usage Tracking
    features: {
      maxUsers: {
        type: Number,
        default: 1,
      },
      maxProjects: {
        type: Number,
        default: 1,
      },
      storageLimit: {
        type: Number, // in GB
        default: 1,
      },
      apiCallsLimit: {
        type: Number,
        default: 1000,
      },
      supportLevel: {
        type: String,
        enum: ["basic", "standard", "premium", "enterprise"],
        default: "basic",
      },
      customFeatures: [
        {
          name: String,
          enabled: Boolean,
          limit: Number,
        },
      ],
    },

    // Current Usage
    currentUsage: {
      users: {
        type: Number,
        default: 0,
      },
      projects: {
        type: Number,
        default: 0,
      },
      storageUsed: {
        type: Number, // in GB
        default: 0,
      },
      apiCallsUsed: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // Subscription History
    upgradeHistory: [
      {
        fromPlan: String,
        toPlan: String,
        date: Date,
        reason: String,
        priceDifference: Number,
      },
    ],

    // Cancellation Information
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
    cancellationFeedback: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    cancelledBy: {
      type: String,
      enum: ["user", "admin", "system", "payment_failure"],
      default: null,
    },

    // Admin Actions
    adminNotes: [
      {
        note: {
          type: String,
          required: true,
          maxlength: 500,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ["note", "warning", "action", "billing"],
          default: "note",
        },
      },
    ],

    // Metadata
    source: {
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

    // Timestamps
    lastModified: {
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
        delete ret.gatewayCustomerId;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.ipAddress;
        delete ret.userAgent;
        delete ret.gatewayCustomerId;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ planId: 1 });
subscriptionSchema.index({ status: 1, nextBillingDate: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });
subscriptionSchema.index({ gatewaySubscriptionId: 1 });
subscriptionSchema.index({ userEmail: 1 });
subscriptionSchema.index({ createdAt: -1 });
subscriptionSchema.index({ planType: 1, status: 1 });

// Compound indexes for common queries
subscriptionSchema.index({ status: 1, billingCycle: 1 });
subscriptionSchema.index({ planType: 1, amount: 1 });
subscriptionSchema.index({ autoRenew: 1, nextBillingDate: 1 });

// Virtual for subscription age
subscriptionSchema.virtual("subscriptionAge").get(function () {
  const now = new Date();
  const start = this.startDate;
  const diffTime = Math.abs(now - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for days until expiry
subscriptionSchema.virtual("daysUntilExpiry").get(function () {
  const now = new Date();
  const end = this.endDate;
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is trial
subscriptionSchema.virtual("isTrial").get(function () {
  return (
    this.status === "trial" ||
    (this.trialStartDate &&
      this.trialEndDate &&
      new Date() >= this.trialStartDate &&
      new Date() <= this.trialEndDate)
  );
});

// Virtual for is active
subscriptionSchema.virtual("isActive").get(function () {
  return (
    ["active", "trial"].includes(this.status) && new Date() <= this.endDate
  );
});

// Virtual for usage percentage
subscriptionSchema.virtual("usagePercentage").get(function () {
  const usage = this.currentUsage;
  const limits = this.features;

  const percentages = {
    users: limits.maxUsers > 0 ? (usage.users / limits.maxUsers) * 100 : 0,
    projects:
      limits.maxProjects > 0 ? (usage.projects / limits.maxProjects) * 100 : 0,
    storage:
      limits.storageLimit > 0
        ? (usage.storageUsed / limits.storageLimit) * 100
        : 0,
    apiCalls:
      limits.apiCallsLimit > 0
        ? (usage.apiCallsUsed / limits.apiCallsLimit) * 100
        : 0,
  };

  return percentages;
});

// Pre-save middleware
subscriptionSchema.pre("save", function (next) {
  this.lastModified = new Date();

  // Auto-set end date based on billing cycle if not set
  if (!this.endDate && this.startDate) {
    const start = new Date(this.startDate);
    switch (this.billingCycle) {
      case "monthly":
        this.endDate = new Date(start.setMonth(start.getMonth() + 1));
        break;
      case "quarterly":
        this.endDate = new Date(start.setMonth(start.getMonth() + 3));
        break;
      case "yearly":
        this.endDate = new Date(start.setFullYear(start.getFullYear() + 1));
        break;
      case "lifetime":
        this.endDate = new Date("2099-12-31");
        break;
    }
  }

  // Set next billing date if auto-renew is enabled
  if (this.autoRenew && !this.nextBillingDate) {
    this.nextBillingDate = this.endDate;
  }

  next();
});

// Instance method to activate subscription
subscriptionSchema.methods.activate = function (adminId = null) {
  this.status = "active";
  if (adminId) {
    this.adminNotes.push({
      note: "Subscription activated by admin",
      addedBy: adminId,
      type: "action",
    });
  }
  return this.save();
};

// Instance method to cancel subscription
subscriptionSchema.methods.cancel = function (
  reason = "",
  feedback = "",
  cancelledBy = "user",
  adminId = null
) {
  this.status = "cancelled";
  this.cancelledDate = new Date();
  this.cancellationReason = reason;
  this.cancellationFeedback = feedback;
  this.cancelledBy = cancelledBy;
  this.autoRenew = false;

  if (adminId) {
    this.adminNotes.push({
      note: `Subscription cancelled: ${reason}`,
      addedBy: adminId,
      type: "action",
    });
  }

  return this.save();
};

// Instance method to suspend subscription
subscriptionSchema.methods.suspend = function (reason = "", adminId = null) {
  this.status = "suspended";
  this.suspendedDate = new Date();

  if (adminId) {
    this.adminNotes.push({
      note: `Subscription suspended: ${reason}`,
      addedBy: adminId,
      type: "action",
    });
  }

  return this.save();
};

// Instance method to reactivate suspended subscription
subscriptionSchema.methods.reactivate = function (adminId = null) {
  this.status = "active";
  this.suspendedDate = null;

  if (adminId) {
    this.adminNotes.push({
      note: "Subscription reactivated by admin",
      addedBy: adminId,
      type: "action",
    });
  }

  return this.save();
};

// Instance method to upgrade/downgrade subscription
subscriptionSchema.methods.changePlan = function (newPlan, adminId = null) {
  const oldPlan = this.planName;
  const priceDifference = newPlan.price - this.amount;

  this.upgradeHistory.push({
    fromPlan: oldPlan,
    toPlan: newPlan.name,
    date: new Date(),
    reason: adminId ? "Admin initiated change" : "User initiated change",
    priceDifference: priceDifference,
  });

  this.planId = newPlan._id;
  this.planName = newPlan.name;
  this.planType = newPlan.type;
  this.amount = newPlan.price;
  this.features = newPlan.features;

  if (adminId) {
    this.adminNotes.push({
      note: `Plan changed from ${oldPlan} to ${newPlan.name}`,
      addedBy: adminId,
      type: "action",
    });
  }

  return this.save();
};

// Instance method to update usage
subscriptionSchema.methods.updateUsage = function (usageData) {
  this.currentUsage = {
    ...this.currentUsage,
    ...usageData,
    lastUpdated: new Date(),
  };
  return this.save();
};

// Instance method to add admin note
subscriptionSchema.methods.addAdminNote = function (
  note,
  adminId,
  type = "note"
) {
  this.adminNotes.push({
    note,
    addedBy: adminId,
    type,
    addedAt: new Date(),
  });
  return this.save();
};

// Instance method to renew subscription
subscriptionSchema.methods.renew = function (billingCycle = null) {
  const cycle = billingCycle || this.billingCycle;
  const currentEnd = new Date(this.endDate);

  switch (cycle) {
    case "monthly":
      this.endDate = new Date(currentEnd.setMonth(currentEnd.getMonth() + 1));
      break;
    case "quarterly":
      this.endDate = new Date(currentEnd.setMonth(currentEnd.getMonth() + 3));
      break;
    case "yearly":
      this.endDate = new Date(
        currentEnd.setFullYear(currentEnd.getFullYear() + 1)
      );
      break;
  }

  this.nextBillingDate = this.endDate;
  this.lastBillingDate = new Date();
  this.status = "active";

  return this.save();
};

// Static method to get subscription statistics
subscriptionSchema.statics.getSubscriptionStatistics = async function (
  filters = {}
) {
  const matchStage = { ...filters };

  const [
    totalStats,
    statusDistribution,
    planDistribution,
    billingCycleDistribution,
    revenueStats,
  ] = await Promise.all([
    // Total subscriptions and paid subscribers
    this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSubscriptions: { $sum: 1 },
          paidSubscribers: {
            $sum: {
              $cond: [{ $in: ["$status", ["active", "trial"]] }, 1, 0],
            },
          },
          averageAmount: { $avg: "$amount" },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, "$amount", 0],
            },
          },
        },
      },
    ]),

    // Status distribution
    this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
    ]),

    // Plan distribution
    this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$planType",
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
          averageAmount: { $avg: "$amount" },
        },
      },
    ]),

    // Billing cycle distribution
    this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$billingCycle",
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
    ]),

    // Revenue statistics by month
    this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          subscriptions: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]),
  ]);

  return {
    totalSubscriptions: totalStats[0]?.totalSubscriptions || 0,
    paidSubscribers: totalStats[0]?.paidSubscribers || 0,
    averageAmount: totalStats[0]?.averageAmount || 0,
    totalRevenue: totalStats[0]?.totalRevenue || 0,
    statusDistribution: statusDistribution.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        revenue: item.revenue,
      };
      return acc;
    }, {}),
    planDistribution: planDistribution.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        revenue: item.revenue,
        averageAmount: item.averageAmount,
      };
      return acc;
    }, {}),
    billingCycleDistribution: billingCycleDistribution.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        revenue: item.revenue,
      };
      return acc;
    }, {}),
    revenueByMonth: revenueStats,
  };
};

// Static method to find expiring subscriptions
subscriptionSchema.statics.findExpiringSubscriptions = async function (
  days = 7
) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    status: { $in: ["active", "trial"] },
    endDate: { $lte: futureDate },
    autoRenew: false,
  }).populate("userId", "firstName lastName email");
};

// Static method to find subscriptions due for renewal
subscriptionSchema.statics.findDueForRenewal = async function () {
  const now = new Date();

  return this.find({
    status: "active",
    autoRenew: true,
    nextBillingDate: { $lte: now },
  }).populate("userId", "firstName lastName email");
};

// Static method to search subscriptions
subscriptionSchema.statics.searchSubscriptions = async function (
  filters = {},
  options = {}
) {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    search = "",
    status = "",
    planType = "",
    billingCycle = "",
    dateFrom = "",
    dateTo = "",
  } = options;

  const query = { ...filters };

  // Add search functionality
  if (search) {
    query.$or = [
      { userEmail: { $regex: search, $options: "i" } },
      { planName: { $regex: search, $options: "i" } },
      { gatewaySubscriptionId: { $regex: search, $options: "i" } },
    ];
  }

  // Add filters
  if (status) query.status = status;
  if (planType) query.planType = planType;
  if (billingCycle) query.billingCycle = billingCycle;

  // Date range filter
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [subscriptions, total] = await Promise.all([
    this.find(query)
      .populate("userId", "firstName lastName email phone")
      .populate("planId", "name description features")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    subscriptions,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit,
    },
  };
};

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
