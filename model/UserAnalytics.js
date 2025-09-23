import mongoose from "mongoose";

const userAnalyticsSchema = new mongoose.Schema(
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
    userRole: {
      type: String,
      enum: ["farmer", "advisor", "viewer"],
      required: true,
    },

    // Engagement Metrics
    loginFrequency: {
      totalLogins: {
        type: Number,
        default: 0,
      },
      lastLogin: {
        type: Date,
        default: Date.now,
      },
      firstLogin: {
        type: Date,
        default: Date.now,
      },
      averageSessionDuration: {
        type: Number, // in minutes
        default: 0,
      },
      longestSession: {
        type: Number, // in minutes
        default: 0,
      },
      loginStreak: {
        current: {
          type: Number,
          default: 0,
        },
        longest: {
          type: Number,
          default: 0,
        },
        lastLoginDate: {
          type: Date,
          default: null,
        },
      },
    },

    // Time Spent on Platform
    timeMetrics: {
      totalTimeSpent: {
        type: Number, // in minutes
        default: 0,
      },
      averageTimePerSession: {
        type: Number, // in minutes
        default: 0,
      },
      timeSpentToday: {
        type: Number, // in minutes
        default: 0,
      },
      timeSpentThisWeek: {
        type: Number, // in minutes
        default: 0,
      },
      timeSpentThisMonth: {
        type: Number, // in minutes
        default: 0,
      },
      lastActivityDate: {
        type: Date,
        default: Date.now,
      },
    },

    // Feature Usage Statistics
    featureUsage: {
      // Core Features
      profileViews: {
        type: Number,
        default: 0,
      },
      reviewsSubmitted: {
        type: Number,
        default: 0,
      },
      reviewsReceived: {
        type: Number,
        default: 0,
      },
      searchQueries: {
        type: Number,
        default: 0,
      },

      // Communication Features
      messagesent: {
        type: Number,
        default: 0,
      },
      messageReceived: {
        type: Number,
        default: 0,
      },
      consultationRequests: {
        type: Number,
        default: 0,
      },
      consultationProvided: {
        type: Number,
        default: 0,
      },

      // Platform Features
      documentsUploaded: {
        type: Number,
        default: 0,
      },
      documentsDownloaded: {
        type: Number,
        default: 0,
      },
      forumsParticipation: {
        type: Number,
        default: 0,
      },
      helpCenterVisits: {
        type: Number,
        default: 0,
      },

      // Advanced Features (for premium users)
      advancedAnalyticsViews: {
        type: Number,
        default: 0,
      },
      apiCallsUsed: {
        type: Number,
        default: 0,
      },
      customReportsGenerated: {
        type: Number,
        default: 0,
      },
      integrationUsage: {
        type: Number,
        default: 0,
      },
    },

    // Search and Content Interaction
    searchBehavior: {
      totalSearches: {
        type: Number,
        default: 0,
      },
      uniqueSearchTerms: {
        type: Number,
        default: 0,
      },
      topSearchTerms: [
        {
          term: String,
          count: Number,
          lastSearched: Date,
        },
      ],
      searchSuccessRate: {
        type: Number, // percentage
        default: 0,
      },
      averageResultsClicked: {
        type: Number,
        default: 0,
      },
    },

    // Device and Access Information
    deviceInfo: {
      primaryDevice: {
        type: String,
        enum: ["desktop", "mobile", "tablet"],
        default: "desktop",
      },
      operatingSystem: {
        type: String,
        default: "unknown",
      },
      browser: {
        type: String,
        default: "unknown",
      },
      location: {
        country: String,
        region: String,
        city: String,
        timezone: String,
      },
      accessFrequency: {
        desktop: { type: Number, default: 0 },
        mobile: { type: Number, default: 0 },
        tablet: { type: Number, default: 0 },
      },
    },

    // User Engagement Scores
    engagementScores: {
      overall: {
        type: Number, // 0-100 scale
        default: 0,
      },
      activityScore: {
        type: Number, // 0-100 scale
        default: 0,
      },
      interactionScore: {
        type: Number, // 0-100 scale
        default: 0,
      },
      retentionScore: {
        type: Number, // 0-100 scale
        default: 0,
      },
      lastCalculated: {
        type: Date,
        default: Date.now,
      },
    },

    // Growth and Progression
    userGrowth: {
      accountAge: {
        type: Number, // in days
        default: 0,
      },
      skillLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
        default: "beginner",
      },
      completedOnboarding: {
        type: Boolean,
        default: false,
      },
      onboardingProgress: {
        type: Number, // percentage
        default: 0,
      },
      goalsAchieved: {
        type: Number,
        default: 0,
      },
      badgesEarned: {
        type: Number,
        default: 0,
      },
    },

    // Subscription and Revenue Analytics (for paying users)
    subscriptionAnalytics: {
      subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
        default: null,
      },
      planType: {
        type: String,
        enum: ["basic", "premium", "professional", "enterprise"],
        default: null,
      },
      subscriptionValue: {
        type: Number,
        default: 0,
      },
      lifetimeValue: {
        type: Number,
        default: 0,
      },
      upgradePotential: {
        type: Number, // 0-100 scale
        default: 0,
      },
      churnRisk: {
        type: Number, // 0-100 scale
        default: 0,
      },
    },

    // Monthly Analytics Archive
    monthlyStats: [
      {
        month: Number,
        year: Number,
        logins: Number,
        timeSpent: Number, // in minutes
        featuresUsed: Number,
        searchQueries: Number,
        engagementScore: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Weekly Analytics Archive
    weeklyStats: [
      {
        week: Number,
        year: Number,
        logins: Number,
        timeSpent: Number, // in minutes
        featuresUsed: Number,
        searchQueries: Number,
        engagementScore: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: "useranalytics",
  }
);

// Indexes for performance
userAnalyticsSchema.index({ userId: 1 });
userAnalyticsSchema.index({ userEmail: 1 });
userAnalyticsSchema.index({ userRole: 1 });
userAnalyticsSchema.index({ "loginFrequency.lastLogin": -1 });
userAnalyticsSchema.index({ "timeMetrics.lastActivityDate": -1 });
userAnalyticsSchema.index({ "engagementScores.overall": -1 });
userAnalyticsSchema.index({ "subscriptionAnalytics.planType": 1 });
userAnalyticsSchema.index({ createdAt: -1 });

// Compound indexes for complex queries
userAnalyticsSchema.index({ userRole: 1, "engagementScores.overall": -1 });
userAnalyticsSchema.index({
  "subscriptionAnalytics.planType": 1,
  "engagementScores.overall": -1,
});
userAnalyticsSchema.index({ "loginFrequency.lastLogin": -1, userRole: 1 });

// Virtual for calculating user activity status
userAnalyticsSchema.virtual("activityStatus").get(function () {
  const daysSinceLastLogin = Math.floor(
    (Date.now() - this.loginFrequency.lastLogin.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastLogin <= 1) return "very_active";
  if (daysSinceLastLogin <= 7) return "active";
  if (daysSinceLastLogin <= 30) return "moderately_active";
  if (daysSinceLastLogin <= 90) return "low_activity";
  return "inactive";
});

// Method to update login frequency
userAnalyticsSchema.methods.updateLoginFrequency = function (
  sessionDuration = 0
) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastLoginDate = this.loginFrequency.loginStreak.lastLoginDate;

  // Update basic login stats
  this.loginFrequency.totalLogins += 1;
  this.loginFrequency.lastLogin = now;

  // Update session duration
  if (sessionDuration > 0) {
    const totalSessions = this.loginFrequency.totalLogins;
    this.loginFrequency.averageSessionDuration =
      (this.loginFrequency.averageSessionDuration * (totalSessions - 1) +
        sessionDuration) /
      totalSessions;

    if (sessionDuration > this.loginFrequency.longestSession) {
      this.loginFrequency.longestSession = sessionDuration;
    }
  }

  // Update login streak
  if (lastLoginDate && lastLoginDate.toDateString() === today.toDateString()) {
    // Same day login, don't increment streak
  } else if (
    lastLoginDate &&
    Math.floor((today - new Date(lastLoginDate)) / (1000 * 60 * 60 * 24)) === 1
  ) {
    // Consecutive day login
    this.loginFrequency.loginStreak.current += 1;
    if (
      this.loginFrequency.loginStreak.current >
      this.loginFrequency.loginStreak.longest
    ) {
      this.loginFrequency.loginStreak.longest =
        this.loginFrequency.loginStreak.current;
    }
  } else {
    // Streak broken or first login
    this.loginFrequency.loginStreak.current = 1;
  }

  this.loginFrequency.loginStreak.lastLoginDate = today;
  return this;
};

// Method to update time spent
userAnalyticsSchema.methods.updateTimeSpent = function (minutes) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  this.timeMetrics.totalTimeSpent += minutes;

  // Calculate average time per session
  const totalSessions = this.loginFrequency.totalLogins || 1;
  this.timeMetrics.averageTimePerSession =
    this.timeMetrics.totalTimeSpent / totalSessions;

  // Reset daily/weekly/monthly counters if needed
  const lastActivity = this.timeMetrics.lastActivityDate;
  if (!lastActivity || lastActivity.toDateString() !== today.toDateString()) {
    this.timeMetrics.timeSpentToday = minutes;
  } else {
    this.timeMetrics.timeSpentToday += minutes;
  }

  if (!lastActivity || lastActivity < thisWeekStart) {
    this.timeMetrics.timeSpentThisWeek = minutes;
  } else {
    this.timeMetrics.timeSpentThisWeek += minutes;
  }

  if (!lastActivity || lastActivity < thisMonthStart) {
    this.timeMetrics.timeSpentThisMonth = minutes;
  } else {
    this.timeMetrics.timeSpentThisMonth += minutes;
  }

  this.timeMetrics.lastActivityDate = now;
  return this;
};

// Method to update feature usage
userAnalyticsSchema.methods.updateFeatureUsage = function (
  featureName,
  incrementBy = 1
) {
  if (this.featureUsage.hasOwnProperty(featureName)) {
    this.featureUsage[featureName] += incrementBy;
  }
  return this;
};

// Method to add search query
userAnalyticsSchema.methods.addSearchQuery = function (
  searchTerm,
  foundResults = true
) {
  this.searchBehavior.totalSearches += 1;

  // Update search success rate
  const totalSearches = this.searchBehavior.totalSearches;
  const currentSuccessRate = this.searchBehavior.searchSuccessRate;
  const newSuccessRate =
    (currentSuccessRate * (totalSearches - 1) + (foundResults ? 100 : 0)) /
    totalSearches;
  this.searchBehavior.searchSuccessRate =
    Math.round(newSuccessRate * 100) / 100;

  // Update top search terms
  const existingTerm = this.searchBehavior.topSearchTerms.find(
    (t) => t.term === searchTerm
  );
  if (existingTerm) {
    existingTerm.count += 1;
    existingTerm.lastSearched = new Date();
  } else {
    this.searchBehavior.topSearchTerms.push({
      term: searchTerm,
      count: 1,
      lastSearched: new Date(),
    });
    this.searchBehavior.uniqueSearchTerms += 1;
  }

  // Keep only top 10 search terms
  this.searchBehavior.topSearchTerms.sort((a, b) => b.count - a.count);
  if (this.searchBehavior.topSearchTerms.length > 10) {
    this.searchBehavior.topSearchTerms =
      this.searchBehavior.topSearchTerms.slice(0, 10);
  }

  return this;
};

// Method to calculate engagement scores
userAnalyticsSchema.methods.calculateEngagementScores = function () {
  const now = new Date();
  const daysSinceJoining =
    Math.floor((now - this.createdAt) / (1000 * 60 * 60 * 24)) || 1;
  const daysSinceLastLogin = Math.floor(
    (now - this.loginFrequency.lastLogin) / (1000 * 60 * 60 * 24)
  );

  // Activity Score (based on login frequency and recency)
  const loginFrequencyScore = Math.min(
    (this.loginFrequency.totalLogins / daysSinceJoining) * 100,
    100
  );
  const recencyScore = Math.max(100 - daysSinceLastLogin * 5, 0);
  this.engagementScores.activityScore = Math.round(
    (loginFrequencyScore + recencyScore) / 2
  );

  // Interaction Score (based on feature usage)
  const totalFeatureUsage = Object.values(this.featureUsage).reduce(
    (sum, count) => sum + count,
    0
  );
  const interactionScore = Math.min(
    (totalFeatureUsage / daysSinceJoining) * 10,
    100
  );
  this.engagementScores.interactionScore = Math.round(interactionScore);

  // Retention Score (based on login streak and consistency)
  const streakScore = Math.min(this.loginFrequency.loginStreak.longest * 5, 50);
  const consistencyScore = Math.min(
    (this.loginFrequency.totalLogins / daysSinceJoining) * 50,
    50
  );
  this.engagementScores.retentionScore = Math.round(
    streakScore + consistencyScore
  );

  // Overall Score (weighted average)
  this.engagementScores.overall = Math.round(
    this.engagementScores.activityScore * 0.4 +
      this.engagementScores.interactionScore * 0.3 +
      this.engagementScores.retentionScore * 0.3
  );

  this.engagementScores.lastCalculated = now;
  return this;
};

// Method to archive monthly stats
userAnalyticsSchema.methods.archiveMonthlyStats = function () {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Check if we already have stats for this month
  const existingStats = this.monthlyStats.find(
    (stat) => stat.month === currentMonth && stat.year === currentYear
  );

  if (!existingStats) {
    this.monthlyStats.push({
      month: currentMonth,
      year: currentYear,
      logins: this.loginFrequency.totalLogins,
      timeSpent: this.timeMetrics.timeSpentThisMonth,
      featuresUsed: Object.values(this.featureUsage).reduce(
        (sum, count) => sum + count,
        0
      ),
      searchQueries: this.searchBehavior.totalSearches,
      engagementScore: this.engagementScores.overall,
    });

    // Keep only last 12 months
    if (this.monthlyStats.length > 12) {
      this.monthlyStats.sort(
        (a, b) => new Date(b.year, b.month - 1) - new Date(a.year, a.month - 1)
      );
      this.monthlyStats = this.monthlyStats.slice(0, 12);
    }
  }

  return this;
};

// Static method to get analytics aggregation
userAnalyticsSchema.statics.getEngagementStatistics = async function (
  filters = {}
) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        averageEngagement: { $avg: "$engagementScores.overall" },
        averageLoginFrequency: { $avg: "$loginFrequency.totalLogins" },
        averageTimeSpent: { $avg: "$timeMetrics.totalTimeSpent" },
        totalSearchQueries: { $sum: "$searchBehavior.totalSearches" },
        activeUsers: {
          $sum: {
            $cond: [
              {
                $gte: [
                  "$loginFrequency.lastLogin",
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                ],
              },
              1,
              0,
            ],
          },
        },
        highEngagementUsers: {
          $sum: {
            $cond: [{ $gte: ["$engagementScores.overall", 70] }, 1, 0],
          },
        },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {};
};

// Export the model
const UserAnalytics = mongoose.model("UserAnalytics", userAnalyticsSchema);

export default UserAnalytics;
