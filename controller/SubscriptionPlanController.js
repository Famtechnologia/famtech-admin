import SubscriptionPlan from "../model/SubscriptionPlan.js";
import Subscription from "../model/Subscription.js";
import mongoose from "mongoose";

class SubscriptionPlanController {
  // Get all subscription plans with filtering and pagination
  static async getAllPlans(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "displayOrder",
        sortOrder = "asc",
        search = "",
        type = "",
        isActive = "",
        isPublic = "",
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        search,
        type,
        isActive,
        isPublic,
      };

      const result = await SubscriptionPlan.searchPlans({}, options);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get all plans error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch subscription plans",
        error: error.message,
      });
    }
  }

  // Get single plan details
  static async getPlanDetails(req, res) {
    try {
      const { planId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plan ID",
        });
      }

      const plan = await SubscriptionPlan.findById(planId)
        .populate("createdBy", "firstName lastName email")
        .populate("lastModifiedBy", "firstName lastName email");

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found",
        });
      }

      // Get subscriber statistics for this plan
      const subscriberStats = await Subscription.aggregate([
        { $match: { planId: plan._id } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            revenue: { $sum: "$amount" },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          plan,
          subscriberStats,
        },
      });
    } catch (error) {
      console.error("Get plan details error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch plan details",
        error: error.message,
      });
    }
  }

  // Create new subscription plan
  static async createPlan(req, res) {
    try {
      const {
        name,
        description,
        type,
        price,
        currency = "USD",
        billingCycles,
        trialPeriod,
        features,
        isActive = true,
        isPublic = true,
        isRecommended = false,
        isPopular = false,
        displayOrder = 0,
        promotionalOffer,
        restrictions,
        comparisonHighlights,
        gatewaySettings,
      } = req.body;

      const adminId = req.adminUser._id;

      // Check if plan name already exists
      const existingPlan = await SubscriptionPlan.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });

      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: "Plan name already exists",
        });
      }

      const planData = {
        name,
        description,
        type,
        price,
        currency,
        billingCycles: billingCycles || [],
        trialPeriod: trialPeriod || { enabled: false },
        features: features || {},
        isActive,
        isPublic,
        isRecommended,
        isPopular,
        displayOrder,
        promotionalOffer: promotionalOffer || { enabled: false },
        restrictions: restrictions || {},
        comparisonHighlights: comparisonHighlights || [],
        gatewaySettings: gatewaySettings || {},
        createdBy: adminId,
      };

      const plan = new SubscriptionPlan(planData);
      await plan.save();

      // If this plan is set as recommended, update others
      if (isRecommended) {
        await SubscriptionPlan.updateMany(
          { _id: { $ne: plan._id } },
          { isRecommended: false }
        );
      }

      const createdPlan = await SubscriptionPlan.findById(plan._id).populate(
        "createdBy",
        "firstName lastName email"
      );

      res.status(201).json({
        success: true,
        message: "Subscription plan created successfully",
        data: { plan: createdPlan },
      });
    } catch (error) {
      console.error("Create plan error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create subscription plan",
        error: error.message,
      });
    }
  }

  // Update subscription plan
  static async updatePlan(req, res) {
    try {
      const { planId } = req.params;
      const updateData = req.body;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plan ID",
        });
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found",
        });
      }

      // Check if new name conflicts with existing plans
      if (updateData.name && updateData.name !== plan.name) {
        const existingPlan = await SubscriptionPlan.findOne({
          name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
          _id: { $ne: planId },
        });

        if (existingPlan) {
          return res.status(400).json({
            success: false,
            message: "Plan name already exists",
          });
        }
      }

      // Update plan
      Object.keys(updateData).forEach((key) => {
        if (key !== "_id" && key !== "createdBy" && key !== "createdAt") {
          plan[key] = updateData[key];
        }
      });

      plan.lastModifiedBy = adminId;
      await plan.save();

      // If this plan is set as recommended, update others
      if (updateData.isRecommended) {
        await SubscriptionPlan.updateMany(
          { _id: { $ne: plan._id } },
          { isRecommended: false }
        );
      }

      const updatedPlan = await SubscriptionPlan.findById(plan._id)
        .populate("createdBy", "firstName lastName email")
        .populate("lastModifiedBy", "firstName lastName email");

      res.status(200).json({
        success: true,
        message: "Subscription plan updated successfully",
        data: { plan: updatedPlan },
      });
    } catch (error) {
      console.error("Update plan error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update subscription plan",
        error: error.message,
      });
    }
  }

  // Activate/Deactivate plan
  static async togglePlanStatus(req, res) {
    try {
      const { planId } = req.params;
      const { isActive } = req.body;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plan ID",
        });
      }

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean value",
        });
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found",
        });
      }

      // Check if deactivating a plan that has active subscriptions
      if (!isActive) {
        const activeSubscriptions = await Subscription.countDocuments({
          planId: plan._id,
          status: { $in: ["active", "trial"] },
        });

        if (activeSubscriptions > 0) {
          return res.status(400).json({
            success: false,
            message: `Cannot deactivate plan with ${activeSubscriptions} active subscriptions`,
          });
        }
      }

      if (isActive) {
        await plan.activate(adminId);
      } else {
        await plan.deactivate(adminId);
      }

      res.status(200).json({
        success: true,
        message: `Plan ${isActive ? "activated" : "deactivated"} successfully`,
        data: { plan },
      });
    } catch (error) {
      console.error("Toggle plan status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update plan status",
        error: error.message,
      });
    }
  }

  // Set plan as recommended
  static async setRecommendedPlan(req, res) {
    try {
      const { planId } = req.params;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plan ID",
        });
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found",
        });
      }

      if (!plan.isActive) {
        return res.status(400).json({
          success: false,
          message: "Cannot set inactive plan as recommended",
        });
      }

      await plan.setAsRecommended(adminId);

      res.status(200).json({
        success: true,
        message: "Plan set as recommended successfully",
        data: { plan },
      });
    } catch (error) {
      console.error("Set recommended plan error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to set recommended plan",
        error: error.message,
      });
    }
  }

  // Update plan pricing
  static async updatePlanPricing(req, res) {
    try {
      const { planId } = req.params;
      const { price, billingCycles } = req.body;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plan ID",
        });
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found",
        });
      }

      const pricingData = {};
      if (price !== undefined) pricingData.price = price;
      if (billingCycles) pricingData.billingCycles = billingCycles;

      await plan.updatePricing(pricingData, adminId);

      res.status(200).json({
        success: true,
        message: "Plan pricing updated successfully",
        data: { plan },
      });
    } catch (error) {
      console.error("Update plan pricing error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update plan pricing",
        error: error.message,
      });
    }
  }

  // Add custom feature to plan
  static async addCustomFeature(req, res) {
    try {
      const { planId } = req.params;
      const { name, description, enabled = true, limit = null } = req.body;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plan ID",
        });
      }

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Feature name is required",
        });
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found",
        });
      }

      // Check if feature already exists
      const existingFeature = plan.features.customFeatures.find(
        (f) => f.name.toLowerCase() === name.toLowerCase()
      );

      if (existingFeature) {
        return res.status(400).json({
          success: false,
          message: "Feature with this name already exists",
        });
      }

      const feature = {
        name: name.trim(),
        description: description?.trim() || "",
        enabled,
        limit,
      };

      await plan.addCustomFeature(feature, adminId);

      res.status(200).json({
        success: true,
        message: "Custom feature added successfully",
        data: { plan },
      });
    } catch (error) {
      console.error("Add custom feature error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add custom feature",
        error: error.message,
      });
    }
  }

  // Remove custom feature from plan
  static async removeCustomFeature(req, res) {
    try {
      const { planId, featureName } = req.params;
      const adminId = req.adminUser._id;

      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plan ID",
        });
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found",
        });
      }

      const featureExists = plan.features.customFeatures.find(
        (f) => f.name.toLowerCase() === featureName.toLowerCase()
      );

      if (!featureExists) {
        return res.status(404).json({
          success: false,
          message: "Feature not found",
        });
      }

      await plan.removeCustomFeature(featureName, adminId);

      res.status(200).json({
        success: true,
        message: "Custom feature removed successfully",
        data: { plan },
      });
    } catch (error) {
      console.error("Remove custom feature error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove custom feature",
        error: error.message,
      });
    }
  }

  // Get plan comparison data
  static async getPlanComparison(req, res) {
    try {
      const comparisonData = await SubscriptionPlan.getComparisonData();

      res.status(200).json({
        success: true,
        data: { plans: comparisonData },
      });
    } catch (error) {
      console.error("Get plan comparison error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch plan comparison data",
        error: error.message,
      });
    }
  }

  // Get active plans for public use
  static async getActivePlans(req, res) {
    try {
      const { includePrivate = false } = req.query;

      const plans = await SubscriptionPlan.getActivePlans(
        includePrivate === "true"
      );

      res.status(200).json({
        success: true,
        data: { plans },
      });
    } catch (error) {
      console.error("Get active plans error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch active plans",
        error: error.message,
      });
    }
  }

  // Update plan statistics
  static async updatePlanStatistics(req, res) {
    try {
      const { planId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plan ID",
        });
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found",
        });
      }

      await plan.updateStats();

      res.status(200).json({
        success: true,
        message: "Plan statistics updated successfully",
        data: { plan },
      });
    } catch (error) {
      console.error("Update plan statistics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update plan statistics",
        error: error.message,
      });
    }
  }

  // Delete subscription plan
  static async deletePlan(req, res) {
    try {
      const { planId } = req.params;
      const { confirmDelete = false } = req.body;

      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plan ID",
        });
      }

      if (!confirmDelete) {
        return res.status(400).json({
          success: false,
          message: "Please confirm deletion by setting confirmDelete to true",
        });
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found",
        });
      }

      // Check if plan has any subscriptions
      const subscriptionCount = await Subscription.countDocuments({
        planId: plan._id,
      });

      if (subscriptionCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete plan with ${subscriptionCount} existing subscriptions. Deactivate the plan instead.`,
        });
      }

      await SubscriptionPlan.findByIdAndDelete(planId);

      res.status(200).json({
        success: true,
        message: "Plan deleted successfully",
        data: { deletedPlan: plan },
      });
    } catch (error) {
      console.error("Delete plan error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete plan",
        error: error.message,
      });
    }
  }
}

export default SubscriptionPlanController;
