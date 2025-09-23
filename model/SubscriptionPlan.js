import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    // Plan Basic Information
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      maxlength: [100, "Plan name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Plan description is required"],
      trim: true,
      maxlength: [500, "Plan description cannot exceed 500 characters"],
    },
    type: {
      type: String,
      enum: ["basic", "premium", "professional", "enterprise"],
      required: true,
      index: true,
    },

    // Pricing Information
    price: {
      type: Number,
      required: [true, "Plan price is required"],
      min: [0, "Price cannot be negative"],
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
      uppercase: true,
    },
    billingCycles: [
      {
        cycle: {
          type: String,
          enum: ["monthly", "quarterly", "yearly", "lifetime"],
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        discount: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
      },
    ],

    // Trial Information
    trialPeriod: {
      enabled: {
        type: Boolean,
        default: false,
      },
      duration: {
        type: Number,
        default: 0, // in days
      },
      features: {
        type: String,
        enum: ["limited", "full", "custom"],
        default: "limited",
      },
    },

    // Plan Features and Limits
    features: {
      maxUsers: {
        type: Number,
        default: 1,
        min: 1,
      },
      maxProjects: {
        type: Number,
        default: 1,
        min: 1,
      },
      storageLimit: {
        type: Number, // in GB
        default: 1,
        min: 0,
      },
      apiCallsLimit: {
        type: Number,
        default: 1000,
        min: 0,
      },
      supportLevel: {
        type: String,
        enum: ["basic", "standard", "premium", "enterprise"],
        default: "basic",
      },
      advancedAnalytics: {
        type: Boolean,
        default: false,
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      apiAccess: {
        type: Boolean,
        default: false,
      },
      customIntegrations: {
        type: Boolean,
        default: false,
      },
      multiUserCollaboration: {
        type: Boolean,
        default: false,
      },
      advancedSecurity: {
        type: Boolean,
        default: false,
      },
      customFeatures: [
        {
          name: {
            type: String,
            required: true,
          },
          description: String,
          enabled: {
            type: Boolean,
            default: true,
          },
          limit: {
            type: Number,
            default: null,
          },
        },
      ],
    },

    // Plan Availability
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    availableUntil: {
      type: Date,
      default: null,
    },

    // Plan Recommendations
    isRecommended: {
      type: Boolean,
      default: false,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },

    // Promotional Information
    promotionalOffer: {
      enabled: {
        type: Boolean,
        default: false,
      },
      title: String,
      description: String,
      discountPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      validFrom: Date,
      validUntil: Date,
    },

    // Plan Restrictions
    restrictions: {
      maxSubscriptionsPerUser: {
        type: Number,
        default: 1,
      },
      eligibleUserRoles: [
        {
          type: String,
          enum: ["farmer", "advisor", "viewer", "all"],
          default: "all",
        },
      ],
      geographicRestrictions: [String], // Country codes
      minimumCommitment: {
        enabled: {
          type: Boolean,
          default: false,
        },
        duration: {
          type: Number,
          default: 0, // in months
        },
      },
    },

    // Plan Comparison
    comparisonHighlights: [String],

    // Gateway Configuration
    gatewaySettings: {
      stripe: {
        productId: String,
        priceIds: {
          monthly: String,
          quarterly: String,
          yearly: String,
        },
      },
      paypal: {
        planId: String,
      },
    },

    // Admin Information
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      default: null,
    },

    // Plan Statistics (calculated fields)
    stats: {
      totalSubscribers: {
        type: Number,
        default: 0,
      },
      activeSubscribers: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
subscriptionPlanSchema.index({ type: 1, isActive: 1 });
subscriptionPlanSchema.index({ isPublic: 1, isActive: 1 });
subscriptionPlanSchema.index({ displayOrder: 1 });
subscriptionPlanSchema.index({ price: 1 });
subscriptionPlanSchema.index({ isRecommended: 1 });
subscriptionPlanSchema.index({ isPopular: 1 });

// Virtual for monthly equivalent price
subscriptionPlanSchema.virtual("monthlyEquivalent").get(function () {
  const monthlyCycle = this.billingCycles.find(
    (cycle) => cycle.cycle === "monthly"
  );
  if (monthlyCycle) return monthlyCycle.price;

  const yearlyCycle = this.billingCycles.find(
    (cycle) => cycle.cycle === "yearly"
  );
  if (yearlyCycle) return yearlyCycle.price / 12;

  return this.price;
});

// Virtual for best value cycle
subscriptionPlanSchema.virtual("bestValueCycle").get(function () {
  if (this.billingCycles.length === 0) return null;

  const cyclesWithDiscount = this.billingCycles
    .filter((cycle) => cycle.discount > 0)
    .sort((a, b) => b.discount - a.discount);

  return cyclesWithDiscount.length > 0
    ? cyclesWithDiscount[0]
    : this.billingCycles[0];
});

// Virtual for feature count
subscriptionPlanSchema.virtual("featureCount").get(function () {
  let count = 0;
  const features = this.features;

  if (features.advancedAnalytics) count++;
  if (features.customBranding) count++;
  if (features.prioritySupport) count++;
  if (features.apiAccess) count++;
  if (features.customIntegrations) count++;
  if (features.multiUserCollaboration) count++;
  if (features.advancedSecurity) count++;

  count += features.customFeatures?.length || 0;

  return count;
});

// Pre-save middleware
subscriptionPlanSchema.pre("save", function (next) {
  // Ensure only one plan can be recommended at a time
  if (this.isRecommended && this.isModified("isRecommended")) {
    this.constructor
      .updateMany({ _id: { $ne: this._id } }, { isRecommended: false })
      .exec();
  }

  next();
});

// Instance method to activate plan
subscriptionPlanSchema.methods.activate = function (adminId) {
  this.isActive = true;
  this.lastModifiedBy = adminId;
  return this.save();
};

// Instance method to deactivate plan
subscriptionPlanSchema.methods.deactivate = function (adminId) {
  this.isActive = false;
  this.lastModifiedBy = adminId;
  return this.save();
};

// Instance method to update pricing
subscriptionPlanSchema.methods.updatePricing = function (newPricing, adminId) {
  this.price = newPricing.price || this.price;
  this.billingCycles = newPricing.billingCycles || this.billingCycles;
  this.lastModifiedBy = adminId;
  return this.save();
};

// Instance method to add custom feature
subscriptionPlanSchema.methods.addCustomFeature = function (feature, adminId) {
  this.features.customFeatures.push(feature);
  this.lastModifiedBy = adminId;
  return this.save();
};

// Instance method to remove custom feature
subscriptionPlanSchema.methods.removeCustomFeature = function (
  featureName,
  adminId
) {
  this.features.customFeatures = this.features.customFeatures.filter(
    (f) => f.name !== featureName
  );
  this.lastModifiedBy = adminId;
  return this.save();
};

// Instance method to set as recommended
subscriptionPlanSchema.methods.setAsRecommended = function (adminId) {
  // First, remove recommended status from all other plans
  return this.constructor
    .updateMany({ _id: { $ne: this._id } }, { isRecommended: false })
    .then(() => {
      this.isRecommended = true;
      this.lastModifiedBy = adminId;
      return this.save();
    });
};

// Instance method to update statistics
subscriptionPlanSchema.methods.updateStats = async function () {
  const Subscription = mongoose.model("Subscription");

  const stats = await Subscription.aggregate([
    { $match: { planId: this._id } },
    {
      $group: {
        _id: null,
        totalSubscribers: { $sum: 1 },
        activeSubscribers: {
          $sum: {
            $cond: [{ $in: ["$status", ["active", "trial"]] }, 1, 0],
          },
        },
        totalRevenue: {
          $sum: {
            $cond: [{ $eq: ["$status", "active"] }, "$amount", 0],
          },
        },
      },
    },
  ]);

  if (stats.length > 0) {
    this.stats = {
      ...this.stats,
      ...stats[0],
      lastUpdated: new Date(),
    };
    return this.save();
  }

  return this;
};

// Static method to get active public plans
subscriptionPlanSchema.statics.getActivePlans = function (
  includePrivate = false
) {
  const query = { isActive: true };
  if (!includePrivate) {
    query.isPublic = true;
  }

  return this.find(query).sort({ displayOrder: 1, price: 1 });
};

// Static method to get plan comparison data
subscriptionPlanSchema.statics.getComparisonData = function () {
  return this.find({ isActive: true, isPublic: true })
    .sort({ displayOrder: 1, price: 1 })
    .select(
      "name description type price billingCycles features comparisonHighlights isRecommended isPopular"
    );
};

// Static method to search plans
subscriptionPlanSchema.statics.searchPlans = async function (
  filters = {},
  options = {}
) {
  const {
    page = 1,
    limit = 10,
    sortBy = "displayOrder",
    sortOrder = "asc",
    search = "",
    type = "",
    isActive = "",
    isPublic = "",
  } = options;

  const query = { ...filters };

  // Add search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { type: { $regex: search, $options: "i" } },
    ];
  }

  // Add filters
  if (type) query.type = type;
  if (isActive !== "") query.isActive = isActive === "true";
  if (isPublic !== "") query.isPublic = isPublic === "true";

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [plans, total] = await Promise.all([
    this.find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("lastModifiedBy", "firstName lastName email")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    plans,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit,
    },
  };
};

// Static method to get plan statistics
subscriptionPlanSchema.statics.getPlanStatistics = async function () {
  const Subscription = mongoose.model("Subscription");

  const [planStats, subscriptionsByPlan] = await Promise.all([
    this.aggregate([
      {
        $group: {
          _id: null,
          totalPlans: { $sum: 1 },
          activePlans: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          publicPlans: {
            $sum: { $cond: [{ $eq: ["$isPublic", true] }, 1, 0] },
          },
          averagePrice: { $avg: "$price" },
        },
      },
    ]),

    Subscription.aggregate([
      {
        $group: {
          _id: "$planId",
          subscribers: { $sum: 1 },
          activeSubscribers: {
            $sum: {
              $cond: [{ $in: ["$status", ["active", "trial"]] }, 1, 0],
            },
          },
          revenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, "$amount", 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "_id",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: "$plan" },
      {
        $project: {
          planName: "$plan.name",
          planType: "$plan.type",
          subscribers: 1,
          activeSubscribers: 1,
          revenue: 1,
        },
      },
    ]),
  ]);

  return {
    overview: planStats[0] || {
      totalPlans: 0,
      activePlans: 0,
      publicPlans: 0,
      averagePrice: 0,
    },
    planPerformance: subscriptionsByPlan,
  };
};

const SubscriptionPlan = mongoose.model(
  "SubscriptionPlan",
  subscriptionPlanSchema
);

export default SubscriptionPlan;
