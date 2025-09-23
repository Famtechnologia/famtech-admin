import UserAnalytics from "../model/UserAnalytics.js";
import SystemAnalytics from "../model/SystemAnalytics.js";
import User from "../model/User.js";
import Subscription from "../model/Subscription.js";
import SubscriptionPlan from "../model/SubscriptionPlan.js";
import Review from "../model/Review.js";

// Dashboard Overview - Main analytics dashboard
export const getAnalyticsDashboard = async (req, res) => {
  try {
    const { timeframe = "30" } = req.query;
    const days = timeframe === "all" ? 365 : parseInt(timeframe);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get latest system analytics
    const latestSystemData = await SystemAnalytics.findOne().sort({ date: -1 });

    // Get user engagement overview
    const userEngagementStats = await UserAnalytics.getEngagementStatistics();

    // Get subscription revenue data
    const revenueData = await SystemAnalytics.getDateRangeAnalytics(
      startDate.toISOString().split("T")[0],
      new Date().toISOString().split("T")[0]
    );

    // Get trending data for the period
    const userTrends = await SystemAnalytics.getTrendData(
      "platformMetrics.totalUsers",
      days
    );
    const revenueTrends = await SystemAnalytics.getTrendData(
      "revenueMetrics.totalRevenue",
      days
    );
    const engagementTrends = await SystemAnalytics.getTrendData(
      "engagementMetrics.totalLogins",
      days
    );

    // Calculate key performance indicators
    const kpis = {
      totalUsers: latestSystemData?.platformMetrics.totalUsers || 0,
      activeUsers: userEngagementStats.activeUsers || 0,
      totalRevenue: revenueData.totalRevenue || 0,
      averageEngagement: userEngagementStats.averageEngagement || 0,
      userGrowthRate: latestSystemData?.platformMetrics.userGrowthRate || 0,
      churnRate: latestSystemData?.revenueMetrics.churnRate || 0,
      conversionRate: latestSystemData?.revenueMetrics.conversionRate || 0,
      customerLifetimeValue:
        latestSystemData?.revenueMetrics.customerLifetimeValue || 0,
    };

    // Get alerts and important metrics
    const alerts = {
      lowEngagementUsers: await UserAnalytics.countDocuments({
        "engagementScores.overall": { $lt: 30 },
      }),
      inactiveUsers: await UserAnalytics.countDocuments({
        "loginFrequency.lastLogin": {
          $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      }),
      highChurnRisk: await UserAnalytics.countDocuments({
        "subscriptionAnalytics.churnRisk": { $gt: 70 },
      }),
    };

    res.status(200).json({
      success: true,
      data: {
        overview: kpis,
        trends: {
          users: userTrends,
          revenue: revenueTrends,
          engagement: engagementTrends,
        },
        alerts,
        timeframe: `${days} days`,
        lastUpdated: latestSystemData?.updatedAt || new Date(),
      },
    });
  } catch (error) {
    console.error("Error getting analytics dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve analytics dashboard",
      error: error.message,
    });
  }
};

// User Engagement Metrics
export const getUserEngagementMetrics = async (req, res) => {
  try {
    const {
      timeframe = "30",
      userRole,
      engagementLevel,
      page = 1,
      limit = 20,
      sortBy = "engagementScores.overall",
      sortOrder = "desc",
    } = req.query;

    const days = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build filters
    const filters = {
      "loginFrequency.lastLogin": { $gte: startDate },
    };

    if (userRole) {
      filters.userRole = userRole;
    }

    if (engagementLevel) {
      switch (engagementLevel) {
        case "high":
          filters["engagementScores.overall"] = { $gte: 70 };
          break;
        case "medium":
          filters["engagementScores.overall"] = { $gte: 40, $lt: 70 };
          break;
        case "low":
          filters["engagementScores.overall"] = { $lt: 40 };
          break;
      }
    }

    // Get user engagement data with pagination
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === "desc" ? -1 : 1;

    const [userEngagement, totalUsers, overallStats] = await Promise.all([
      UserAnalytics.find(filters)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("userId", "fullName email role status")
        .select("-monthlyStats -weeklyStats -searchBehavior.topSearchTerms"),

      UserAnalytics.countDocuments(filters),

      UserAnalytics.getEngagementStatistics(filters),
    ]);

    // Get engagement distribution
    const engagementDistribution = await UserAnalytics.aggregate([
      { $match: filters },
      {
        $bucket: {
          groupBy: "$engagementScores.overall",
          boundaries: [0, 40, 70, 100],
          default: "unknown",
          output: {
            count: { $sum: 1 },
            avgLoginFrequency: { $avg: "$loginFrequency.totalLogins" },
            avgTimeSpent: { $avg: "$timeMetrics.totalTimeSpent" },
          },
        },
      },
    ]);

    // Calculate retention metrics
    const retentionMetrics = await UserAnalytics.aggregate([
      { $match: filters },
      {
        $group: {
          _id: "$userRole",
          users: { $sum: 1 },
          avgRetentionScore: { $avg: "$engagementScores.retentionScore" },
          avgLoginStreak: { $avg: "$loginFrequency.loginStreak.current" },
          longestStreaks: { $max: "$loginFrequency.loginStreak.longest" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: userEngagement,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(totalUsers / limit),
          total: totalUsers,
          limit: parseInt(limit),
        },
        statistics: {
          overall: overallStats,
          distribution: engagementDistribution,
          retention: retentionMetrics,
        },
        filters: { timeframe, userRole, engagementLevel },
      },
    });
  } catch (error) {
    console.error("Error getting user engagement metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user engagement metrics",
      error: error.message,
    });
  }
};

// Usage Statistics and Feature Adoption
export const getUsageStatistics = async (req, res) => {
  try {
    const { timeframe = "30", featureCategory = "all" } = req.query;
    const days = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get feature usage aggregation
    const featureUsageStats = await UserAnalytics.aggregate([
      {
        $match: {
          "timeMetrics.lastActivityDate": { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          // Core Features
          totalProfileViews: { $sum: "$featureUsage.profileViews" },
          totalSearchQueries: { $sum: "$featureUsage.searchQueries" },
          totalReviewsSubmitted: { $sum: "$featureUsage.reviewsSubmitted" },
          totalMessagesSent: { $sum: "$featureUsage.messagesent" },

          // Communication Features
          totalConsultationRequests: {
            $sum: "$featureUsage.consultationRequests",
          },
          totalConsultationProvided: {
            $sum: "$featureUsage.consultationProvided",
          },

          // Platform Features
          totalDocumentsUploaded: { $sum: "$featureUsage.documentsUploaded" },
          totalDocumentsDownloaded: {
            $sum: "$featureUsage.documentsDownloaded",
          },
          totalForumsParticipation: {
            $sum: "$featureUsage.forumsParticipation",
          },
          totalHelpCenterVisits: { $sum: "$featureUsage.helpCenterVisits" },

          // Advanced Features
          totalAdvancedAnalyticsViews: {
            $sum: "$featureUsage.advancedAnalyticsViews",
          },
          totalApiCallsUsed: { $sum: "$featureUsage.apiCallsUsed" },
          totalCustomReportsGenerated: {
            $sum: "$featureUsage.customReportsGenerated",
          },
          totalIntegrationUsage: { $sum: "$featureUsage.integrationUsage" },

          // Averages
          avgProfileViews: { $avg: "$featureUsage.profileViews" },
          avgSearchQueries: { $avg: "$featureUsage.searchQueries" },
          avgReviewsSubmitted: { $avg: "$featureUsage.reviewsSubmitted" },
          avgTimeSpent: { $avg: "$timeMetrics.totalTimeSpent" },
        },
      },
    ]);

    // Get feature adoption rates by user role
    const adoptionByRole = await UserAnalytics.aggregate([
      {
        $match: {
          "timeMetrics.lastActivityDate": { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$userRole",
          totalUsers: { $sum: 1 },
          profileUsage: {
            $avg: { $cond: [{ $gt: ["$featureUsage.profileViews", 0] }, 1, 0] },
          },
          searchUsage: {
            $avg: {
              $cond: [{ $gt: ["$featureUsage.searchQueries", 0] }, 1, 0],
            },
          },
          reviewUsage: {
            $avg: {
              $cond: [{ $gt: ["$featureUsage.reviewsSubmitted", 0] }, 1, 0],
            },
          },
          messagingUsage: {
            $avg: { $cond: [{ $gt: ["$featureUsage.messagesent", 0] }, 1, 0] },
          },
          consultationUsage: {
            $avg: {
              $cond: [{ $gt: ["$featureUsage.consultationRequests", 0] }, 1, 0],
            },
          },
          documentUsage: {
            $avg: {
              $cond: [{ $gt: ["$featureUsage.documentsUploaded", 0] }, 1, 0],
            },
          },
          forumUsage: {
            $avg: {
              $cond: [{ $gt: ["$featureUsage.forumsParticipation", 0] }, 1, 0],
            },
          },
          advancedUsage: {
            $avg: {
              $cond: [
                { $gt: ["$featureUsage.advancedAnalyticsViews", 0] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Get top search terms across all users
    const topSearchTerms = await UserAnalytics.aggregate([
      { $unwind: "$searchBehavior.topSearchTerms" },
      {
        $group: {
          _id: "$searchBehavior.topSearchTerms.term",
          totalCount: { $sum: "$searchBehavior.topSearchTerms.count" },
          uniqueUsers: { $addToSet: "$userId" },
          lastSearched: { $max: "$searchBehavior.topSearchTerms.lastSearched" },
        },
      },
      {
        $project: {
          term: "$_id",
          totalCount: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
          lastSearched: 1,
          _id: 0,
        },
      },
      { $sort: { totalCount: -1 } },
      { $limit: 20 },
    ]);

    // Get platform-wide search analytics
    const searchAnalytics = await UserAnalytics.aggregate([
      {
        $match: {
          "timeMetrics.lastActivityDate": { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalSearches: { $sum: "$searchBehavior.totalSearches" },
          avgSearchSuccessRate: { $avg: "$searchBehavior.searchSuccessRate" },
          totalUniqueTerms: { $sum: "$searchBehavior.uniqueSearchTerms" },
          usersSearching: {
            $sum: {
              $cond: [{ $gt: ["$searchBehavior.totalSearches", 0] }, 1, 0],
            },
          },
        },
      },
    ]);

    const stats = featureUsageStats[0] || {};
    const search = searchAnalytics[0] || {};

    // Calculate feature adoption percentages
    const adoptionRates = {
      profileViews:
        stats.totalUsers > 0 ? (stats.totalProfileViews > 0 ? 100 : 0) : 0,
      searchQueries:
        stats.totalUsers > 0
          ? ((search.usersSearching || 0) / stats.totalUsers) * 100
          : 0,
      reviewsSubmitted:
        stats.totalUsers > 0 ? (stats.totalReviewsSubmitted > 0 ? 100 : 0) : 0,
      messaging:
        stats.totalUsers > 0 ? (stats.totalMessagesSent > 0 ? 100 : 0) : 0,
      consultations:
        stats.totalUsers > 0
          ? stats.totalConsultationRequests > 0
            ? 100
            : 0
          : 0,
      documentSharing:
        stats.totalUsers > 0 ? (stats.totalDocumentsUploaded > 0 ? 100 : 0) : 0,
      forumParticipation:
        stats.totalUsers > 0
          ? stats.totalForumsParticipation > 0
            ? 100
            : 0
          : 0,
      advancedFeatures:
        stats.totalUsers > 0
          ? stats.totalAdvancedAnalyticsViews > 0
            ? 100
            : 0
          : 0,
    };

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalActiveUsers: stats.totalUsers || 0,
          averageTimeSpent: Math.round(stats.avgTimeSpent || 0),
          totalFeatureUsage:
            (stats.totalProfileViews || 0) +
            (stats.totalSearchQueries || 0) +
            (stats.totalReviewsSubmitted || 0) +
            (stats.totalMessagesSent || 0),
        },
        featureUsage: {
          coreFeatures: {
            profileViews: stats.totalProfileViews || 0,
            searchQueries: stats.totalSearchQueries || 0,
            reviewsSubmitted: stats.totalReviewsSubmitted || 0,
            messagesSent: stats.totalMessagesSent || 0,
          },
          communicationFeatures: {
            consultationRequests: stats.totalConsultationRequests || 0,
            consultationProvided: stats.totalConsultationProvided || 0,
          },
          platformFeatures: {
            documentsUploaded: stats.totalDocumentsUploaded || 0,
            documentsDownloaded: stats.totalDocumentsDownloaded || 0,
            forumsParticipation: stats.totalForumsParticipation || 0,
            helpCenterVisits: stats.totalHelpCenterVisits || 0,
          },
          advancedFeatures: {
            advancedAnalyticsViews: stats.totalAdvancedAnalyticsViews || 0,
            apiCallsUsed: stats.totalApiCallsUsed || 0,
            customReportsGenerated: stats.totalCustomReportsGenerated || 0,
            integrationUsage: stats.totalIntegrationUsage || 0,
          },
        },
        adoptionRates,
        adoptionByRole,
        searchAnalytics: {
          overview: search,
          topSearchTerms,
        },
        timeframe: `${days} days`,
      },
    });
  } catch (error) {
    console.error("Error getting usage statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve usage statistics",
      error: error.message,
    });
  }
};

// Revenue and Sales Analytics
export const getRevenueAnalytics = async (req, res) => {
  try {
    const {
      timeframe = "30",
      planType,
      currency = "USD",
      period = "daily",
    } = req.query;

    const days = parseInt(timeframe);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get revenue trends for the period
    const revenueTrends = await SystemAnalytics.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1 })
      .select("date revenueMetrics dateString");

    // Get current subscription revenue breakdown
    const revenueBreakdown = await Subscription.aggregate([
      {
        $match: {
          status: { $in: ["active", "trial"] },
          ...(planType && { planType }),
        },
      },
      {
        $group: {
          _id: "$planType",
          totalRevenue: { $sum: "$amount" },
          subscriptionCount: { $sum: 1 },
          averageRevenue: { $avg: "$amount" },
          monthlyRecurringRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$billingCycle", "monthly"] },
                "$amount",
                {
                  $cond: [
                    { $eq: ["$billingCycle", "quarterly"] },
                    { $divide: ["$amount", 3] },
                    {
                      $cond: [
                        { $eq: ["$billingCycle", "yearly"] },
                        { $divide: ["$amount", 12] },
                        0,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Get revenue by billing cycle
    const revenueByCycle = await Subscription.aggregate([
      {
        $match: {
          status: { $in: ["active", "trial"] },
          ...(planType && { planType }),
        },
      },
      {
        $group: {
          _id: "$billingCycle",
          totalRevenue: { $sum: "$amount" },
          subscriptionCount: { $sum: 1 },
          averageAmount: { $avg: "$amount" },
        },
      },
    ]);

    // Get customer lifetime value analysis
    const lifetimeValueAnalysis = await UserAnalytics.aggregate([
      {
        $match: {
          "subscriptionAnalytics.subscriptionId": { $ne: null },
        },
      },
      {
        $group: {
          _id: "$subscriptionAnalytics.planType",
          averageLifetimeValue: {
            $avg: "$subscriptionAnalytics.lifetimeValue",
          },
          totalCustomers: { $sum: 1 },
          totalLifetimeValue: { $sum: "$subscriptionAnalytics.lifetimeValue" },
        },
      },
    ]);

    // Get churn and retention metrics
    const churnMetrics = await Subscription.aggregate([
      {
        $facet: {
          totalSubscriptions: [
            { $match: { createdAt: { $gte: startDate } } },
            { $count: "count" },
          ],
          cancelledSubscriptions: [
            {
              $match: {
                status: "cancelled",
                updatedAt: { $gte: startDate },
              },
            },
            { $count: "count" },
          ],
          newSubscriptions: [
            {
              $match: {
                status: { $in: ["active", "trial"] },
                createdAt: { $gte: startDate },
              },
            },
            { $count: "count" },
          ],
          renewedSubscriptions: [
            {
              $match: {
                status: "active",
                lastBillingDate: { $gte: startDate },
              },
            },
            { $count: "count" },
          ],
        },
      },
    ]);

    // Calculate key revenue metrics
    const totalRevenue = revenueBreakdown.reduce(
      (sum, plan) => sum + plan.totalRevenue,
      0
    );
    const totalMRR = revenueBreakdown.reduce(
      (sum, plan) => sum + plan.monthlyRecurringRevenue,
      0
    );
    const totalSubscriptions = revenueBreakdown.reduce(
      (sum, plan) => sum + plan.subscriptionCount,
      0
    );
    const averageRevenuePerUser =
      totalSubscriptions > 0 ? totalRevenue / totalSubscriptions : 0;

    const churnData = churnMetrics[0];
    const totalSubs = churnData.totalSubscriptions[0]?.count || 0;
    const cancelledSubs = churnData.cancelledSubscriptions[0]?.count || 0;
    const churnRate = totalSubs > 0 ? (cancelledSubs / totalSubs) * 100 : 0;

    // Get top performing plans
    const topPlans = await SubscriptionPlan.aggregate([
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "planId",
          as: "subscriptions",
        },
      },
      {
        $project: {
          name: 1,
          type: 1,
          price: 1,
          activeSubscriptions: {
            $size: {
              $filter: {
                input: "$subscriptions",
                cond: { $eq: ["$$this.status", "active"] },
              },
            },
          },
          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$subscriptions",
                    cond: { $eq: ["$$this.status", "active"] },
                  },
                },
                as: "sub",
                in: "$$sub.amount",
              },
            },
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          monthlyRecurringRevenue: Math.round(totalMRR * 100) / 100,
          averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
          totalSubscriptions,
          churnRate: Math.round(churnRate * 100) / 100,
          newSubscriptions: churnData.newSubscriptions[0]?.count || 0,
          renewedSubscriptions: churnData.renewedSubscriptions[0]?.count || 0,
        },
        trends: revenueTrends,
        breakdown: {
          byPlan: revenueBreakdown,
          byBillingCycle: revenueByCycle,
          topPerformingPlans: topPlans,
        },
        customerMetrics: {
          lifetimeValue: lifetimeValueAnalysis,
          churnAnalysis: churnData,
        },
        timeframe: `${days} days`,
        currency,
      },
    });
  } catch (error) {
    console.error("Error getting revenue analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve revenue analytics",
      error: error.message,
    });
  }
};

// Customer Demographics and Segmentation
export const getCustomerDemographics = async (req, res) => {
  try {
    const { segmentBy = "role", includeInactive = false } = req.query;

    // Build base filters
    const baseFilters = {};
    if (!includeInactive) {
      baseFilters["loginFrequency.lastLogin"] = {
        $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      };
    }

    // Get user demographics by role
    const demographicsByRole = await UserAnalytics.aggregate([
      { $match: baseFilters },
      {
        $group: {
          _id: "$userRole",
          totalUsers: { $sum: 1 },
          averageEngagement: { $avg: "$engagementScores.overall" },
          averageTimeSpent: { $avg: "$timeMetrics.totalTimeSpent" },
          averageLoginFrequency: { $avg: "$loginFrequency.totalLogins" },
          subscribedUsers: {
            $sum: {
              $cond: [
                { $ne: ["$subscriptionAnalytics.subscriptionId", null] },
                1,
                0,
              ],
            },
          },
          averageLifetimeValue: {
            $avg: "$subscriptionAnalytics.lifetimeValue",
          },
        },
      },
    ]);

    // Get geographic distribution
    const geographicDistribution = await UserAnalytics.aggregate([
      { $match: baseFilters },
      {
        $group: {
          _id: {
            country: "$deviceInfo.location.country",
            region: "$deviceInfo.location.region",
          },
          userCount: { $sum: 1 },
          averageEngagement: { $avg: "$engagementScores.overall" },
          subscribedUsers: {
            $sum: {
              $cond: [
                { $ne: ["$subscriptionAnalytics.subscriptionId", null] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { userCount: -1 } },
      { $limit: 20 },
    ]);

    // Get engagement-based segmentation
    const engagementSegmentation = await UserAnalytics.aggregate([
      { $match: baseFilters },
      {
        $bucket: {
          groupBy: "$engagementScores.overall",
          boundaries: [0, 30, 50, 70, 100],
          default: "unknown",
          output: {
            userCount: { $sum: 1 },
            averageTimeSpent: { $avg: "$timeMetrics.totalTimeSpent" },
            averageLoginFrequency: { $avg: "$loginFrequency.totalLogins" },
            subscribedUsers: {
              $sum: {
                $cond: [
                  { $ne: ["$subscriptionAnalytics.subscriptionId", null] },
                  1,
                  0,
                ],
              },
            },
            averageLifetimeValue: {
              $avg: "$subscriptionAnalytics.lifetimeValue",
            },
            churnRisk: { $avg: "$subscriptionAnalytics.churnRisk" },
          },
        },
      },
    ]);

    // Get subscription-based segmentation
    const subscriptionSegmentation = await UserAnalytics.aggregate([
      { $match: baseFilters },
      {
        $group: {
          _id: "$subscriptionAnalytics.planType",
          userCount: { $sum: 1 },
          averageEngagement: { $avg: "$engagementScores.overall" },
          averageTimeSpent: { $avg: "$timeMetrics.totalTimeSpent" },
          averageLifetimeValue: {
            $avg: "$subscriptionAnalytics.lifetimeValue",
          },
          averageChurnRisk: { $avg: "$subscriptionAnalytics.churnRisk" },
          totalRevenue: { $sum: "$subscriptionAnalytics.subscriptionValue" },
        },
      },
      { $sort: { userCount: -1 } },
    ]);

    // Get device and technology usage
    const deviceUsage = await UserAnalytics.aggregate([
      { $match: baseFilters },
      {
        $group: {
          _id: "$deviceInfo.primaryDevice",
          userCount: { $sum: 1 },
          averageEngagement: { $avg: "$engagementScores.overall" },
          totalDesktopAccess: { $sum: "$deviceInfo.accessFrequency.desktop" },
          totalMobileAccess: { $sum: "$deviceInfo.accessFrequency.mobile" },
          totalTabletAccess: { $sum: "$deviceInfo.accessFrequency.tablet" },
        },
      },
    ]);

    // Get user growth and progression analysis
    const userGrowthAnalysis = await UserAnalytics.aggregate([
      { $match: baseFilters },
      {
        $group: {
          _id: "$userGrowth.skillLevel",
          userCount: { $sum: 1 },
          averageAccountAge: { $avg: "$userGrowth.accountAge" },
          averageGoalsAchieved: { $avg: "$userGrowth.goalsAchieved" },
          averageBadgesEarned: { $avg: "$userGrowth.badgesEarned" },
          completedOnboarding: {
            $sum: {
              $cond: ["$userGrowth.completedOnboarding", 1, 0],
            },
          },
          averageOnboardingProgress: { $avg: "$userGrowth.onboardingProgress" },
        },
      },
    ]);

    // Calculate total metrics for percentages
    const totalUsers = await UserAnalytics.countDocuments(baseFilters);

    // Calculate segment distributions
    const roleDistribution = demographicsByRole.map((role) => ({
      ...role,
      percentage:
        totalUsers > 0
          ? Math.round((role.totalUsers / totalUsers) * 100 * 100) / 100
          : 0,
      subscriptionRate:
        role.totalUsers > 0
          ? Math.round((role.subscribedUsers / role.totalUsers) * 100 * 100) /
            100
          : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          segmentBy,
          includeInactive,
        },
        demographics: {
          byRole: roleDistribution,
          geographic: geographicDistribution,
          device: deviceUsage,
        },
        segmentation: {
          byEngagement: engagementSegmentation,
          bySubscription: subscriptionSegmentation,
          byGrowthStage: userGrowthAnalysis,
        },
        insights: {
          topUserRole: roleDistribution[0]?.name || "Unknown",
          topCountry: geographicDistribution[0]?._id?.country || "Unknown",
          primaryDevice:
            deviceUsage.find(
              (d) =>
                d.userCount === Math.max(...deviceUsage.map((d) => d.userCount))
            )?._id || "Unknown",
          averageEngagementScore:
            Math.round(
              (roleDistribution.reduce(
                (sum, role) => sum + (role.averageEngagement || 0),
                0
              ) /
                (roleDistribution.length || 1)) *
                100
            ) / 100,
        },
      },
    });
  } catch (error) {
    console.error("Error getting customer demographics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve customer demographics",
      error: error.message,
    });
  }
};

// Export analytics data
export const exportAnalyticsData = async (req, res) => {
  try {
    const {
      type = "engagement",
      format = "json",
      timeframe = "30",
      includeDetails = false,
    } = req.query;

    const days = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let data = {};

    switch (type) {
      case "engagement":
        data = await UserAnalytics.find({
          "loginFrequency.lastLogin": { $gte: startDate },
        })
          .populate("userId", "fullName email role")
          .select(
            includeDetails === "true"
              ? ""
              : "-monthlyStats -weeklyStats -searchBehavior.topSearchTerms"
          );
        break;

      case "revenue":
        data = await Subscription.find({
          createdAt: { $gte: startDate },
        })
          .populate("userId", "fullName email")
          .populate("planId", "name type price");
        break;

      case "system":
        data = await SystemAnalytics.find({
          date: { $gte: startDate },
        }).sort({ date: 1 });
        break;

      default:
        return res.status(400).json({
          success: false,
          message:
            "Invalid export type. Supported types: engagement, revenue, system",
        });
    }

    if (format === "csv") {
      // Simple CSV conversion for basic data
      const csvHeaders = Object.keys(data[0] || {}).join(",");
      const csvRows = data.map((row) =>
        Object.values(row.toObject ? row.toObject() : row).join(",")
      );
      const csvContent = [csvHeaders, ...csvRows].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${type}_analytics_${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );
      res.send(csvContent);
    } else {
      res.status(200).json({
        success: true,
        data,
        metadata: {
          type,
          timeframe: `${days} days`,
          recordCount: data.length,
          exportedAt: new Date(),
          includeDetails: includeDetails === "true",
        },
      });
    }
  } catch (error) {
    console.error("Error exporting analytics data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export analytics data",
      error: error.message,
    });
  }
};

// Update user analytics (for real-time tracking)
export const updateUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, data = {} } = req.body;

    let userAnalytics = await UserAnalytics.findOne({ userId });

    if (!userAnalytics) {
      // Create new analytics record if doesn't exist
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      userAnalytics = new UserAnalytics({
        userId,
        userEmail: user.email,
        userRole: user.role,
      });
    }

    // Update analytics based on action
    switch (action) {
      case "login":
        userAnalytics.updateLoginFrequency(data.sessionDuration || 0);
        break;

      case "timeSpent":
        userAnalytics.updateTimeSpent(data.minutes || 0);
        break;

      case "featureUsage":
        userAnalytics.updateFeatureUsage(data.feature, data.incrementBy || 1);
        break;

      case "search":
        userAnalytics.addSearchQuery(
          data.searchTerm,
          data.foundResults !== false
        );
        break;

      case "calculateScores":
        userAnalytics.calculateEngagementScores();
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action type",
        });
    }

    await userAnalytics.save();

    res.status(200).json({
      success: true,
      message: "User analytics updated successfully",
      data: {
        userId,
        action,
        engagementScore: userAnalytics.engagementScores.overall,
        activityStatus: userAnalytics.activityStatus,
      },
    });
  } catch (error) {
    console.error("Error updating user analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user analytics",
      error: error.message,
    });
  }
};
