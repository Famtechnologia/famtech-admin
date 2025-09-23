import Subscription from "../model/Subscription.js";
import SubscriptionPlan from "../model/SubscriptionPlan.js";
import User from "../model/User.js";
import SuperAdmin from "../model/SuperAdmin.js";
import mongoose from "mongoose";

class SubscriptionManagementController {
  // Get subscription dashboard and statistics
  static async getSubscriptionDashboard(req, res) {
    try {
      const { timeframe = "30" } = req.query;

      const dateFilter = {};
      if (timeframe !== "all") {
        const days = parseInt(timeframe);
        dateFilter.createdAt = {
          $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        };
      }

      // Get subscription statistics
      const subscriptionStats = await Subscription.getSubscriptionStatistics(
        dateFilter
      );

      // Get plan statistics
      const planStats = await SubscriptionPlan.getPlanStatistics();

      // Get expiring subscriptions (next 7 days)
      const expiringSubscriptions =
        await Subscription.findExpiringSubscriptions(7);

      // Get subscriptions due for renewal
      const dueForRenewal = await Subscription.findDueForRenewal();

      // Get recent subscription activities
      const recentActivities = await Subscription.find({})
        .populate("userId", "firstName lastName email")
        .populate("planId", "name type")
        .sort({ updatedAt: -1 })
        .limit(10);

      // Get revenue trends (last 12 months)
      const revenueTrends = await Subscription.aggregate([
        {
          $match: {
            status: "active",
            createdAt: {
              $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: "$amount" },
            subscriptions: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Get subscription growth metrics
      const currentMonth = new Date();
      const lastMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      );

      const [currentMonthStats, lastMonthStats] = await Promise.all([
        Subscription.countDocuments({
          status: { $in: ["active", "trial"] },
          createdAt: {
            $gte: new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth(),
              1
            ),
          },
        }),
        Subscription.countDocuments({
          status: { $in: ["active", "trial"] },
          createdAt: { $gte: lastMonth, $lt: currentMonth },
        }),
      ]);

      const growthRate =
        lastMonthStats > 0
          ? (
              ((currentMonthStats - lastMonthStats) / lastMonthStats) *
              100
            ).toFixed(2)
          : 0;

      res.status(200).json({
        success: true,
        data: {
          overview: {
            ...subscriptionStats,
            subscriptionGrowthRate: parseFloat(growthRate),
            currentMonthSubscriptions: currentMonthStats,
            lastMonthSubscriptions: lastMonthStats,
          },
          planStatistics: planStats,
          alerts: {
            expiringSubscriptions: expiringSubscriptions.length,
            dueForRenewal: dueForRenewal.length,
            expiringList: expiringSubscriptions.slice(0, 5),
            renewalList: dueForRenewal.slice(0, 5),
          },
          recentActivities,
          trends: {
            revenue: revenueTrends,
            growth: {
              currentMonth: currentMonthStats,
              lastMonth: lastMonthStats,
              growthRate: parseFloat(growthRate),
            },
          },
        },
      });
    } catch (error) {
      console.error("Subscription dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch subscription dashboard",
        error: error.message,
      });
    }
  }

  // Get all subscriptions with filtering and pagination
  static async getAllSubscriptions(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
        search = "",
        status = "",
        planType = "",
        billingCycle = "",
        dateFrom = "",
        dateTo = "",
        autoRenew = "",
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        search,
        status,
        planType,
        billingCycle,
        dateFrom,
        dateTo,
      };

      // Add auto-renew filter
      const filters = {};
      if (autoRenew !== "") {
        filters.autoRenew = autoRenew === "true";
      }

      const result = await Subscription.searchSubscriptions(filters, options);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get all subscriptions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch subscriptions",
        error: error.message,
      });
    }
  }

  // Get single subscription details
  static async getSubscriptionDetails(req, res) {
    try {
      const { subscriptionId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription ID",
        });
      }

      const subscription = await Subscription.findById(subscriptionId)
        .populate(
          "userId",
          "firstName lastName email phone userRole registrationDate"
        )
        .populate("planId", "name description type features")
        .populate("adminNotes.addedBy", "firstName lastName email");

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      // Get usage statistics for this subscription
      const usageStats = {
        usagePercentage: subscription.usagePercentage,
        remainingDays: subscription.daysUntilExpiry,
        subscriptionAge: subscription.subscriptionAge,
        isActive: subscription.isActive,
        isTrial: subscription.isTrial,
      };

      res.status(200).json({
        success: true,
        data: {
          subscription,
          usageStats,
        },
      });
    } catch (error) {
      console.error("Get subscription details error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch subscription details",
        error: error.message,
      });
    }
  }

  // Activate subscription
  static async activateSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription ID",
        });
      }

      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      await subscription.activate(adminId);

      res.status(200).json({
        success: true,
        message: "Subscription activated successfully",
        data: { subscription },
      });
    } catch (error) {
      console.error("Activate subscription error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to activate subscription",
        error: error.message,
      });
    }
  }

  // Cancel subscription
  static async cancelSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { reason, feedback, cancelledBy = "admin" } = req.body;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription ID",
        });
      }

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message:
            "Cancellation reason is required and must be at least 5 characters",
        });
      }

      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      await subscription.cancel(reason, feedback || "", cancelledBy, adminId);

      res.status(200).json({
        success: true,
        message: "Subscription cancelled successfully",
        data: { subscription },
      });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel subscription",
        error: error.message,
      });
    }
  }

  // Suspend subscription
  static async suspendSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { reason } = req.body;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription ID",
        });
      }

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message:
            "Suspension reason is required and must be at least 5 characters",
        });
      }

      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      await subscription.suspend(reason, adminId);

      res.status(200).json({
        success: true,
        message: "Subscription suspended successfully",
        data: { subscription },
      });
    } catch (error) {
      console.error("Suspend subscription error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to suspend subscription",
        error: error.message,
      });
    }
  }

  // Reactivate suspended subscription
  static async reactivateSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription ID",
        });
      }

      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      if (subscription.status !== "suspended") {
        return res.status(400).json({
          success: false,
          message: "Only suspended subscriptions can be reactivated",
        });
      }

      await subscription.reactivate(adminId);

      res.status(200).json({
        success: true,
        message: "Subscription reactivated successfully",
        data: { subscription },
      });
    } catch (error) {
      console.error("Reactivate subscription error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reactivate subscription",
        error: error.message,
      });
    }
  }

  // Change subscription plan
  static async changeSubscriptionPlan(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { newPlanId, reason = "" } = req.body;
      const adminId = req.adminUser._id;

      if (
        !mongoose.Types.ObjectId.isValid(subscriptionId) ||
        !mongoose.Types.ObjectId.isValid(newPlanId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription ID or plan ID",
        });
      }

      const [subscription, newPlan] = await Promise.all([
        Subscription.findById(subscriptionId),
        SubscriptionPlan.findById(newPlanId),
      ]);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      if (!newPlan) {
        return res.status(404).json({
          success: false,
          message: "New plan not found",
        });
      }

      if (!newPlan.isActive) {
        return res.status(400).json({
          success: false,
          message: "Selected plan is not active",
        });
      }

      await subscription.changePlan(newPlan, adminId);

      // Add admin note about the plan change
      if (reason) {
        await subscription.addAdminNote(
          `Plan changed: ${reason}`,
          adminId,
          "action"
        );
      }

      res.status(200).json({
        success: true,
        message: "Subscription plan changed successfully",
        data: { subscription },
      });
    } catch (error) {
      console.error("Change subscription plan error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to change subscription plan",
        error: error.message,
      });
    }
  }

  // Update subscription auto-renewal settings
  static async updateAutoRenewal(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { autoRenew, reason = "" } = req.body;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription ID",
        });
      }

      if (typeof autoRenew !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "autoRenew must be a boolean value",
        });
      }

      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      subscription.autoRenew = autoRenew;

      // Update next billing date if turning off auto-renewal
      if (!autoRenew) {
        subscription.nextBillingDate = subscription.endDate;
      }

      await subscription.save();

      // Add admin note
      await subscription.addAdminNote(
        `Auto-renewal ${autoRenew ? "enabled" : "disabled"}: ${reason}`,
        adminId,
        "action"
      );

      res.status(200).json({
        success: true,
        message: `Auto-renewal ${
          autoRenew ? "enabled" : "disabled"
        } successfully`,
        data: { subscription },
      });
    } catch (error) {
      console.error("Update auto-renewal error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update auto-renewal settings",
        error: error.message,
      });
    }
  }

  // Add admin note to subscription
  static async addAdminNote(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { note, type = "note" } = req.body;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription ID",
        });
      }

      if (!note || note.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: "Note is required and must be at least 5 characters",
        });
      }

      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      await subscription.addAdminNote(note.trim(), adminId, type);

      const updatedSubscription = await Subscription.findById(
        subscriptionId
      ).populate("adminNotes.addedBy", "firstName lastName email");

      res.status(200).json({
        success: true,
        message: "Admin note added successfully",
        data: { subscription: updatedSubscription },
      });
    } catch (error) {
      console.error("Add admin note error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add admin note",
        error: error.message,
      });
    }
  }

  // Update subscription usage
  static async updateSubscriptionUsage(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { usageData } = req.body;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription ID",
        });
      }

      if (!usageData || typeof usageData !== "object") {
        return res.status(400).json({
          success: false,
          message: "Usage data is required and must be an object",
        });
      }

      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      await subscription.updateUsage(usageData);

      // Add admin note
      await subscription.addAdminNote(
        `Usage updated by admin: ${JSON.stringify(usageData)}`,
        adminId,
        "action"
      );

      res.status(200).json({
        success: true,
        message: "Subscription usage updated successfully",
        data: {
          subscription,
          usagePercentage: subscription.usagePercentage,
        },
      });
    } catch (error) {
      console.error("Update subscription usage error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update subscription usage",
        error: error.message,
      });
    }
  }

  // Get expiring subscriptions
  static async getExpiringSubscriptions(req, res) {
    try {
      const { days = 7 } = req.query;

      const expiringSubscriptions =
        await Subscription.findExpiringSubscriptions(parseInt(days));

      res.status(200).json({
        success: true,
        data: {
          count: expiringSubscriptions.length,
          subscriptions: expiringSubscriptions,
        },
      });
    } catch (error) {
      console.error("Get expiring subscriptions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch expiring subscriptions",
        error: error.message,
      });
    }
  }

  // Get subscriptions due for renewal
  static async getDueForRenewal(req, res) {
    try {
      const dueForRenewal = await Subscription.findDueForRenewal();

      res.status(200).json({
        success: true,
        data: {
          count: dueForRenewal.length,
          subscriptions: dueForRenewal,
        },
      });
    } catch (error) {
      console.error("Get due for renewal error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch subscriptions due for renewal",
        error: error.message,
      });
    }
  }

  // Renew subscription manually
  static async renewSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { billingCycle } = req.body;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription ID",
        });
      }

      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      await subscription.renew(billingCycle);

      // Add admin note
      await subscription.addAdminNote(
        `Subscription renewed manually by admin`,
        adminId,
        "action"
      );

      res.status(200).json({
        success: true,
        message: "Subscription renewed successfully",
        data: { subscription },
      });
    } catch (error) {
      console.error("Renew subscription error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to renew subscription",
        error: error.message,
      });
    }
  }

  // Export subscription data
  static async exportSubscriptions(req, res) {
    try {
      const {
        format = "csv",
        status = "",
        planType = "",
        dateFrom = "",
        dateTo = "",
        includeUsage = "false",
      } = req.query;

      if (!["csv", "json"].includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Format must be either 'csv' or 'json'",
        });
      }

      const filters = {};
      if (status) filters.status = status;
      if (planType) filters.planType = planType;
      if (dateFrom || dateTo) {
        filters.createdAt = {};
        if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filters.createdAt.$lte = new Date(dateTo);
      }

      const subscriptions = await Subscription.find(filters)
        .populate("userId", "firstName lastName email")
        .populate("planId", "name type")
        .sort({ createdAt: -1 });

      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=subscriptions.json"
        );
        return res.json({
          success: true,
          data: subscriptions,
          exportedAt: new Date(),
          totalRecords: subscriptions.length,
        });
      }

      // CSV format
      let csvData =
        "ID,User Email,Plan Name,Plan Type,Status,Amount,Currency,Billing Cycle,Start Date,End Date,Auto Renew,Created At";

      if (includeUsage === "true") {
        csvData += ",Users Used,Projects Used,Storage Used,API Calls Used";
      }

      csvData += "\n";

      subscriptions.forEach((subscription) => {
        const row = [
          subscription._id,
          subscription.userEmail,
          `"${subscription.planName}"`,
          subscription.planType,
          subscription.status,
          subscription.amount,
          subscription.currency,
          subscription.billingCycle,
          subscription.startDate.toISOString().split("T")[0],
          subscription.endDate.toISOString().split("T")[0],
          subscription.autoRenew,
          subscription.createdAt.toISOString(),
        ];

        if (includeUsage === "true") {
          row.push(
            subscription.currentUsage?.users || 0,
            subscription.currentUsage?.projects || 0,
            subscription.currentUsage?.storageUsed || 0,
            subscription.currentUsage?.apiCallsUsed || 0
          );
        }

        csvData += row.join(",") + "\n";
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=subscriptions.csv"
      );
      res.send(csvData);
    } catch (error) {
      console.error("Export subscriptions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export subscriptions",
        error: error.message,
      });
    }
  }

  // Get subscription analytics
  static async getSubscriptionAnalytics(req, res) {
    try {
      const { period = "12" } = req.query; // months

      const monthsBack = parseInt(period);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsBack);

      const [
        subscriptionTrends,
        revenueTrends,
        churnAnalysis,
        planPerformance,
      ] = await Promise.all([
        // Subscription trends
        Subscription.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                status: "$status",
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),

        // Revenue trends
        Subscription.aggregate([
          {
            $match: {
              status: "active",
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
              },
              revenue: { $sum: "$amount" },
              subscriptions: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),

        // Churn analysis
        Subscription.aggregate([
          {
            $match: {
              status: { $in: ["cancelled", "expired"] },
              updatedAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$updatedAt" },
                month: { $month: "$updatedAt" },
                reason: "$cancellationReason",
              },
              count: { $sum: 1 },
            },
          },
        ]),

        // Plan performance
        Subscription.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: "$planType",
              totalSubscriptions: { $sum: 1 },
              activeSubscriptions: {
                $sum: {
                  $cond: [{ $in: ["$status", ["active", "trial"]] }, 1, 0],
                },
              },
              totalRevenue: {
                $sum: {
                  $cond: [{ $eq: ["$status", "active"] }, "$amount", 0],
                },
              },
              averageAmount: { $avg: "$amount" },
            },
          },
        ]),
      ]);

      res.status(200).json({
        success: true,
        data: {
          subscriptionTrends,
          revenueTrends,
          churnAnalysis,
          planPerformance,
          period: `${monthsBack} months`,
        },
      });
    } catch (error) {
      console.error("Get subscription analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch subscription analytics",
        error: error.message,
      });
    }
  }
}

export default SubscriptionManagementController;
