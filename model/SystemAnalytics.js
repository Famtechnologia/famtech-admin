import mongoose from "mongoose";

const systemAnalyticsSchema = new mongoose.Schema(
  {
    // Date and Time Tracking
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    dateString: {
      type: String, // YYYY-MM-DD format for easy querying
      required: true,
      index: true,
    },

    // Platform Usage Metrics
    platformMetrics: {
      totalUsers: {
        type: Number,
        default: 0,
      },
      newUsersToday: {
        type: Number,
        default: 0,
      },
      activeUsers: {
        daily: { type: Number, default: 0 },
        weekly: { type: Number, default: 0 },
        monthly: { type: Number, default: 0 },
      },
      returningUsers: {
        type: Number,
        default: 0,
      },
      userGrowthRate: {
        type: Number, // percentage
        default: 0,
      },
      usersByRole: {
        farmers: { type: Number, default: 0 },
        advisors: { type: Number, default: 0 },
        viewers: { type: Number, default: 0 },
      },
      usersByStatus: {
        active: { type: Number, default: 0 },
        inactive: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        suspended: { type: Number, default: 0 },
      },
    },

    // Engagement Metrics
    engagementMetrics: {
      totalLogins: {
        type: Number,
        default: 0,
      },
      uniqueLogins: {
        type: Number,
        default: 0,
      },
      averageSessionDuration: {
        type: Number, // in minutes
        default: 0,
      },
      totalTimeSpent: {
        type: Number, // in minutes
        default: 0,
      },
      bounceRate: {
        type: Number, // percentage
        default: 0,
      },
      userRetentionRate: {
        daily: { type: Number, default: 0 },
        weekly: { type: Number, default: 0 },
        monthly: { type: Number, default: 0 },
      },
      engagementScoreDistribution: {
        high: { type: Number, default: 0 }, // 70-100
        medium: { type: Number, default: 0 }, // 40-69
        low: { type: Number, default: 0 }, // 0-39
      },
    },

    // Feature Usage Analytics
    featureAdoption: {
      // Core Features
      profileViews: { type: Number, default: 0 },
      searchQueries: { type: Number, default: 0 },
      reviewsSubmitted: { type: Number, default: 0 },
      messagesent: { type: Number, default: 0 },

      // Advanced Features
      documentsUploaded: { type: Number, default: 0 },
      forumsParticipation: { type: Number, default: 0 },
      consultationRequests: { type: Number, default: 0 },
      helpCenterVisits: { type: Number, default: 0 },

      // Premium Features
      advancedAnalyticsViews: { type: Number, default: 0 },
      apiCallsUsed: { type: Number, default: 0 },
      customReportsGenerated: { type: Number, default: 0 },
      integrationUsage: { type: Number, default: 0 },

      // Feature Adoption Rates
      featureAdoptionRates: {
        profileCompletion: { type: Number, default: 0 }, // percentage
        searchUsage: { type: Number, default: 0 }, // percentage
        reviewParticipation: { type: Number, default: 0 }, // percentage
        messagingUsage: { type: Number, default: 0 }, // percentage
        documentSharing: { type: Number, default: 0 }, // percentage
        forumParticipation: { type: Number, default: 0 }, // percentage
      },
    },

    // Search and Content Analytics
    searchAnalytics: {
      totalSearches: {
        type: Number,
        default: 0,
      },
      uniqueSearchTerms: {
        type: Number,
        default: 0,
      },
      searchSuccessRate: {
        type: Number, // percentage
        default: 0,
      },
      topSearchTerms: [
        {
          term: String,
          count: Number,
          successRate: Number,
        },
      ],
      searchesByCategory: {
        agricultural: { type: Number, default: 0 },
        weather: { type: Number, default: 0 },
        crops: { type: Number, default: 0 },
        livestock: { type: Number, default: 0 },
        equipment: { type: Number, default: 0 },
        market: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
      },
    },

    // Revenue and Sales Data
    revenueMetrics: {
      // Subscription Revenue
      totalRevenue: {
        type: Number,
        default: 0,
      },
      revenueByPlan: {
        basic: { type: Number, default: 0 },
        premium: { type: Number, default: 0 },
        professional: { type: Number, default: 0 },
        enterprise: { type: Number, default: 0 },
      },
      newSubscriptionRevenue: {
        type: Number,
        default: 0,
      },
      renewalRevenue: {
        type: Number,
        default: 0,
      },
      upgradeRevenue: {
        type: Number,
        default: 0,
      },

      // Subscription Metrics
      totalSubscriptions: {
        type: Number,
        default: 0,
      },
      newSubscriptions: {
        type: Number,
        default: 0,
      },
      cancelledSubscriptions: {
        type: Number,
        default: 0,
      },
      renewedSubscriptions: {
        type: Number,
        default: 0,
      },
      upgradedSubscriptions: {
        type: Number,
        default: 0,
      },
      downgradedSubscriptions: {
        type: Number,
        default: 0,
      },

      // Financial KPIs
      averageRevenuePerUser: {
        type: Number,
        default: 0,
      },
      monthlyRecurringRevenue: {
        type: Number,
        default: 0,
      },
      customerLifetimeValue: {
        type: Number,
        default: 0,
      },
      churnRate: {
        type: Number, // percentage
        default: 0,
      },
      conversionRate: {
        type: Number, // percentage
        default: 0,
      },
    },

    // Customer Demographics
    customerDemographics: {
      // Geographic Distribution
      geography: {
        countries: [
          {
            name: String,
            userCount: Number,
            revenue: Number,
          },
        ],
        regions: [
          {
            name: String,
            userCount: Number,
            revenue: Number,
          },
        ],
        topCountries: [
          {
            country: String,
            count: Number,
            percentage: Number,
          },
        ],
      },

      // Age Distribution (if available)
      ageGroups: {
        under25: { type: Number, default: 0 },
        age25to34: { type: Number, default: 0 },
        age35to44: { type: Number, default: 0 },
        age45to54: { type: Number, default: 0 },
        age55to64: { type: Number, default: 0 },
        over65: { type: Number, default: 0 },
      },

      // User Type Distribution
      userTypes: {
        smallFarmers: { type: Number, default: 0 },
        largeFarmers: { type: Number, default: 0 },
        agriculturalAdvisors: { type: Number, default: 0 },
        researchers: { type: Number, default: 0 },
        students: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
      },

      // Experience Level
      experienceLevels: {
        beginner: { type: Number, default: 0 },
        intermediate: { type: Number, default: 0 },
        advanced: { type: Number, default: 0 },
        expert: { type: Number, default: 0 },
      },
    },

    // Customer Segmentation
    customerSegmentation: {
      // Value-based Segmentation
      highValue: {
        count: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
        criteria: String,
      },
      mediumValue: {
        count: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
        criteria: String,
      },
      lowValue: {
        count: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
        criteria: String,
      },

      // Engagement-based Segmentation
      champions: {
        count: { type: Number, default: 0 },
        description: String,
      },
      loyalists: {
        count: { type: Number, default: 0 },
        description: String,
      },
      potentialLoyalists: {
        count: { type: Number, default: 0 },
        description: String,
      },
      newCustomers: {
        count: { type: Number, default: 0 },
        description: String,
      },
      atRisk: {
        count: { type: Number, default: 0 },
        description: String,
      },
      cannotLoseThem: {
        count: { type: Number, default: 0 },
        description: String,
      },
      hibernating: {
        count: { type: Number, default: 0 },
        description: String,
      },
    },

    // Device and Technology Analytics
    technologyMetrics: {
      deviceUsage: {
        desktop: { type: Number, default: 0 },
        mobile: { type: Number, default: 0 },
        tablet: { type: Number, default: 0 },
      },
      operatingSystems: {
        windows: { type: Number, default: 0 },
        macos: { type: Number, default: 0 },
        linux: { type: Number, default: 0 },
        android: { type: Number, default: 0 },
        ios: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
      },
      browsers: {
        chrome: { type: Number, default: 0 },
        firefox: { type: Number, default: 0 },
        safari: { type: Number, default: 0 },
        edge: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
      },
      mobileAppUsage: {
        totalSessions: { type: Number, default: 0 },
        averageSessionLength: { type: Number, default: 0 },
        crashRate: { type: Number, default: 0 },
      },
    },

    // Performance Metrics
    performanceMetrics: {
      // System Performance
      averageResponseTime: {
        type: Number, // in milliseconds
        default: 0,
      },
      uptime: {
        type: Number, // percentage
        default: 100,
      },
      errorRate: {
        type: Number, // percentage
        default: 0,
      },

      // User Experience
      pageLoadTimes: {
        homepage: { type: Number, default: 0 },
        dashboard: { type: Number, default: 0 },
        search: { type: Number, default: 0 },
        profile: { type: Number, default: 0 },
      },
      userSatisfactionScore: {
        type: Number, // 1-10 scale
        default: 0,
      },
    },

    // Marketing and Growth Metrics
    marketingMetrics: {
      // Traffic Sources
      trafficSources: {
        organic: { type: Number, default: 0 },
        direct: { type: Number, default: 0 },
        referral: { type: Number, default: 0 },
        social: { type: Number, default: 0 },
        email: { type: Number, default: 0 },
        paid: { type: Number, default: 0 },
      },

      // Conversion Funnel
      conversionFunnel: {
        visitors: { type: Number, default: 0 },
        signups: { type: Number, default: 0 },
        activations: { type: Number, default: 0 },
        subscriptions: { type: Number, default: 0 },
        renewals: { type: Number, default: 0 },
      },

      // Campaign Performance
      campaignMetrics: [
        {
          campaignName: String,
          impressions: Number,
          clicks: Number,
          conversions: Number,
          cost: Number,
          revenue: Number,
          roi: Number,
        },
      ],
    },

    // Support and Satisfaction Metrics
    supportMetrics: {
      // Help and Support
      helpCenterViews: {
        type: Number,
        default: 0,
      },
      supportTickets: {
        total: { type: Number, default: 0 },
        resolved: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        averageResolutionTime: { type: Number, default: 0 }, // in hours
      },
      userFeedback: {
        totalFeedback: { type: Number, default: 0 },
        positivePercentage: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
      },
      npsScore: {
        type: Number, // Net Promoter Score
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    collection: "systemanalytics",
  }
);

// Indexes for performance
systemAnalyticsSchema.index({ date: -1 });
systemAnalyticsSchema.index({ dateString: 1 });
systemAnalyticsSchema.index({ "revenueMetrics.totalRevenue": -1 });
systemAnalyticsSchema.index({ "platformMetrics.totalUsers": -1 });
systemAnalyticsSchema.index({ "engagementMetrics.totalLogins": -1 });

// Static method to get date range analytics
systemAnalyticsSchema.statics.getDateRangeAnalytics = async function (
  startDate,
  endDate
) {
  const pipeline = [
    {
      $match: {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$revenueMetrics.totalRevenue" },
        totalUsers: { $max: "$platformMetrics.totalUsers" },
        totalLogins: { $sum: "$engagementMetrics.totalLogins" },
        totalSearches: { $sum: "$searchAnalytics.totalSearches" },
        averageEngagement: {
          $avg: "$engagementMetrics.averageSessionDuration",
        },
        newSubscriptions: { $sum: "$revenueMetrics.newSubscriptions" },
        cancelledSubscriptions: {
          $sum: "$revenueMetrics.cancelledSubscriptions",
        },
        averageUserSatisfaction: {
          $avg: "$supportMetrics.userFeedback.averageRating",
        },
        days: { $sum: 1 },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {};
};

// Static method to get trend data
systemAnalyticsSchema.statics.getTrendData = async function (
  metric,
  days = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const pipeline = [
    {
      $match: {
        date: { $gte: startDate },
      },
    },
    {
      $sort: { date: 1 },
    },
    {
      $project: {
        date: 1,
        dateString: 1,
        value: `$${metric}`,
      },
    },
  ];

  return await this.aggregate(pipeline);
};

// Static method to get top performing metrics
systemAnalyticsSchema.statics.getTopPerformers = async function (
  category = "revenue",
  limit = 10
) {
  let groupBy, sortBy;

  switch (category) {
    case "revenue":
      return await this.aggregate([
        { $unwind: "$revenueMetrics.revenueByPlan" },
        {
          $group: {
            _id: "$revenueMetrics.revenueByPlan",
            total: { $sum: "$revenueMetrics.revenueByPlan" },
          },
        },
        { $sort: { total: -1 } },
        { $limit: limit },
      ]);

    case "features":
      return await this.aggregate([
        { $project: { featureUsage: { $objectToArray: "$featureAdoption" } } },
        { $unwind: "$featureUsage" },
        {
          $group: {
            _id: "$featureUsage.k",
            totalUsage: { $sum: "$featureUsage.v" },
          },
        },
        { $sort: { totalUsage: -1 } },
        { $limit: limit },
      ]);

    case "countries":
      return await this.aggregate([
        { $unwind: "$customerDemographics.geography.countries" },
        {
          $group: {
            _id: "$customerDemographics.geography.countries.name",
            users: {
              $sum: "$customerDemographics.geography.countries.userCount",
            },
            revenue: {
              $sum: "$customerDemographics.geography.countries.revenue",
            },
          },
        },
        { $sort: { users: -1 } },
        { $limit: limit },
      ]);

    default:
      return [];
  }
};

// Method to calculate growth rates
systemAnalyticsSchema.methods.calculateGrowthRates = async function () {
  const yesterday = new Date(this.date);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayData = await this.constructor.findOne({ date: yesterday });

  if (yesterdayData) {
    // User growth rate
    const userGrowth =
      yesterdayData.platformMetrics.totalUsers > 0
        ? ((this.platformMetrics.totalUsers -
            yesterdayData.platformMetrics.totalUsers) /
            yesterdayData.platformMetrics.totalUsers) *
          100
        : 0;

    this.platformMetrics.userGrowthRate = Math.round(userGrowth * 100) / 100;

    // Revenue growth rate (if you want to add this field)
    // this.revenueMetrics.revenueGrowthRate = ...
  }

  return this;
};

// Export the model
const SystemAnalytics = mongoose.model(
  "SystemAnalytics",
  systemAnalyticsSchema
);

export default SystemAnalytics;
