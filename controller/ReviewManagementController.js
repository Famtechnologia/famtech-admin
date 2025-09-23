import Review from "../model/Review.js";
import User from "../model/User.js";
import SuperAdmin from "../model/SuperAdmin.js";
import mongoose from "mongoose";

class ReviewManagementController {
  // Get review statistics and dashboard data
  static async getReviewDashboard(req, res) {
    try {
      const { timeframe = "30" } = req.query;

      const dateFilter = {};
      if (timeframe !== "all") {
        const days = parseInt(timeframe);
        dateFilter.createdAt = {
          $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        };
      }

      // Get overall statistics
      const overallStats = await Review.getReviewStatistics(dateFilter);

      // Get recent reviews needing attention
      const pendingReviews = await Review.find({ status: "pending" })
        .populate("reviewerId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .limit(5);

      const flaggedReviews = await Review.find({ status: "flagged" })
        .populate("reviewerId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .limit(5);

      // Get trending insights
      const [dailyStats, topReviewers, mostReviewedTargets] = await Promise.all(
        [
          // Daily review counts for the last 7 days
          Review.aggregate([
            {
              $match: {
                createdAt: {
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                count: { $sum: 1 },
                averageRating: { $avg: "$rating" },
              },
            },
            { $sort: { _id: 1 } },
          ]),

          // Top reviewers by count
          Review.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: "$reviewerId",
                reviewCount: { $sum: 1 },
                averageRating: { $avg: "$rating" },
              },
            },
            { $sort: { reviewCount: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "reviewer",
              },
            },
            { $unwind: "$reviewer" },
            {
              $project: {
                reviewCount: 1,
                averageRating: 1,
                "reviewer.firstName": 1,
                "reviewer.lastName": 1,
                "reviewer.email": 1,
              },
            },
          ]),

          // Most reviewed targets
          Review.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: { targetType: "$targetType", targetId: "$targetId" },
                reviewCount: { $sum: 1 },
                averageRating: { $avg: "$rating" },
                targetName: { $first: "$targetName" },
              },
            },
            { $sort: { reviewCount: -1 } },
            { $limit: 5 },
          ]),
        ]
      );

      res.status(200).json({
        success: true,
        data: {
          overview: overallStats,
          pendingReviews,
          flaggedReviews,
          trends: {
            dailyStats,
            topReviewers,
            mostReviewedTargets,
          },
        },
      });
    } catch (error) {
      console.error("Review dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch review dashboard",
        error: error.message,
      });
    }
  }

  // Get all reviews with filtering and pagination
  static async getAllReviews(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
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
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        search,
        rating,
        status,
        reviewType,
        targetType,
        dateFrom,
        dateTo,
        hasAdminResponse,
      };

      const result = await Review.searchReviews({}, options);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get all reviews error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch reviews",
        error: error.message,
      });
    }
  }

  // Get single review details
  static async getReviewDetails(req, res) {
    try {
      const { reviewId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID",
        });
      }

      const review = await Review.findById(reviewId)
        .populate("reviewerId", "firstName lastName email phone userRole")
        .populate("moderatedBy", "firstName lastName email")
        .populate("adminResponse.respondedBy", "firstName lastName email");

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      res.status(200).json({
        success: true,
        data: { review },
      });
    } catch (error) {
      console.error("Get review details error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch review details",
        error: error.message,
      });
    }
  }

  // Approve review
  static async approveReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { reason = "" } = req.body;
      const adminId = req.admin.id;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID",
        });
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      review.approveReview(adminId, reason);
      await review.save();

      res.status(200).json({
        success: true,
        message: "Review approved successfully",
        data: { review },
      });
    } catch (error) {
      console.error("Approve review error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to approve review",
        error: error.message,
      });
    }
  }

  // Reject review
  static async rejectReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;
      const adminId = req.admin.id;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID",
        });
      }

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message:
            "Rejection reason is required and must be at least 5 characters",
        });
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      review.rejectReview(adminId, reason);
      await review.save();

      res.status(200).json({
        success: true,
        message: "Review rejected successfully",
        data: { review },
      });
    } catch (error) {
      console.error("Reject review error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject review",
        error: error.message,
      });
    }
  }

  // Flag review
  static async flagReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;
      const adminId = req.admin.id;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID",
        });
      }

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: "Flag reason is required and must be at least 5 characters",
        });
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      review.flagReview(adminId, reason);
      await review.save();

      res.status(200).json({
        success: true,
        message: "Review flagged successfully",
        data: { review },
      });
    } catch (error) {
      console.error("Flag review error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to flag review",
        error: error.message,
      });
    }
  }

  // Hide review
  static async hideReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;
      const adminId = req.admin.id;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID",
        });
      }

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: "Hide reason is required and must be at least 5 characters",
        });
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      review.hideReview(adminId, reason);
      await review.save();

      res.status(200).json({
        success: true,
        message: "Review hidden successfully",
        data: { review },
      });
    } catch (error) {
      console.error("Hide review error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to hide review",
        error: error.message,
      });
    }
  }

  // Add admin response to review
  static async addAdminResponse(req, res) {
    try {
      const { reviewId } = req.params;
      const { responseText, isPublic = true } = req.body;
      const adminId = req.admin.id;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID",
        });
      }

      if (!responseText || responseText.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message:
            "Response text is required and must be at least 5 characters",
        });
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      review.addAdminResponse(responseText.trim(), adminId, isPublic);
      await review.save();

      const updatedReview = await Review.findById(reviewId).populate(
        "adminResponse.respondedBy",
        "firstName lastName email"
      );

      res.status(200).json({
        success: true,
        message: "Admin response added successfully",
        data: { review: updatedReview },
      });
    } catch (error) {
      console.error("Add admin response error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add admin response",
        error: error.message,
      });
    }
  }

  // Update admin response
  static async updateAdminResponse(req, res) {
    try {
      const { reviewId } = req.params;
      const { responseText, isPublic = true } = req.body;
      const adminId = req.admin.id;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID",
        });
      }

      if (!responseText || responseText.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message:
            "Response text is required and must be at least 5 characters",
        });
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      if (!review.adminResponse?.responseText) {
        return res.status(400).json({
          success: false,
          message: "No existing admin response to update",
        });
      }

      review.updateAdminResponse(responseText.trim(), adminId, isPublic);
      await review.save();

      const updatedReview = await Review.findById(reviewId).populate(
        "adminResponse.respondedBy",
        "firstName lastName email"
      );

      res.status(200).json({
        success: true,
        message: "Admin response updated successfully",
        data: { review: updatedReview },
      });
    } catch (error) {
      console.error("Update admin response error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update admin response",
        error: error.message,
      });
    }
  }

  // Remove admin response
  static async removeAdminResponse(req, res) {
    try {
      const { reviewId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID",
        });
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      if (!review.adminResponse?.responseText) {
        return res.status(400).json({
          success: false,
          message: "No admin response to remove",
        });
      }

      review.removeAdminResponse();
      await review.save();

      res.status(200).json({
        success: true,
        message: "Admin response removed successfully",
        data: { review },
      });
    } catch (error) {
      console.error("Remove admin response error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove admin response",
        error: error.message,
      });
    }
  }

  // Bulk review actions
  static async bulkReviewActions(req, res) {
    try {
      const { action, reviewIds, reason = "" } = req.body;
      const adminId = req.admin.id;

      if (
        !action ||
        !reviewIds ||
        !Array.isArray(reviewIds) ||
        reviewIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Action and review IDs are required",
        });
      }

      const validActions = ["approve", "reject", "flag", "hide"];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid action. Must be one of: approve, reject, flag, hide",
        });
      }

      if (
        (action === "reject" || action === "flag" || action === "hide") &&
        !reason.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: `Reason is required for ${action} action`,
        });
      }

      // Validate all review IDs
      for (const id of reviewIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: `Invalid review ID: ${id}`,
          });
        }
      }

      const reviews = await Review.find({ _id: { $in: reviewIds } });

      if (reviews.length !== reviewIds.length) {
        return res.status(404).json({
          success: false,
          message: "One or more reviews not found",
        });
      }

      // Apply action to all reviews
      const results = [];
      for (const review of reviews) {
        try {
          switch (action) {
            case "approve":
              review.approveReview(adminId, reason);
              break;
            case "reject":
              review.rejectReview(adminId, reason);
              break;
            case "flag":
              review.flagReview(adminId, reason);
              break;
            case "hide":
              review.hideReview(adminId, reason);
              break;
          }
          await review.save();
          results.push({ reviewId: review._id, success: true });
        } catch (error) {
          results.push({
            reviewId: review._id,
            success: false,
            error: error.message,
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      res.status(200).json({
        success: true,
        message: `Bulk ${action} completed. ${successCount} successful, ${failureCount} failed.`,
        data: { results },
      });
    } catch (error) {
      console.error("Bulk review actions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to perform bulk action",
        error: error.message,
      });
    }
  }

  // Get reviews by target (for specific user, service, etc.)
  static async getReviewsByTarget(req, res) {
    try {
      const { targetType, targetId } = req.params;
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
        status = "",
      } = req.query;

      if (!targetType || !targetId) {
        return res.status(400).json({
          success: false,
          message: "Target type and target ID are required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid target ID",
        });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        status: status || "approved",
      };

      const result = await Review.getReviewsByTarget(
        targetType,
        targetId,
        options
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get reviews by target error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch reviews by target",
        error: error.message,
      });
    }
  }

  // Delete review (permanent)
  static async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { confirmDelete = false } = req.body;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID",
        });
      }

      if (!confirmDelete) {
        return res.status(400).json({
          success: false,
          message: "Please confirm deletion by setting confirmDelete to true",
        });
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      await Review.findByIdAndDelete(reviewId);

      res.status(200).json({
        success: true,
        message: "Review deleted permanently",
        data: { deletedReview: review },
      });
    } catch (error) {
      console.error("Delete review error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete review",
        error: error.message,
      });
    }
  }

  // Export reviews data
  static async exportReviews(req, res) {
    try {
      const {
        format = "csv",
        status = "",
        dateFrom = "",
        dateTo = "",
        includeResponses = "false",
      } = req.query;

      if (!["csv", "json"].includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Format must be either 'csv' or 'json'",
        });
      }

      const filters = {};
      if (status) filters.status = status;
      if (dateFrom || dateTo) {
        filters.createdAt = {};
        if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filters.createdAt.$lte = new Date(dateTo);
      }

      const reviews = await Review.find(filters)
        .populate("reviewerId", "firstName lastName email")
        .populate("moderatedBy", "firstName lastName email")
        .populate("adminResponse.respondedBy", "firstName lastName email")
        .sort({ createdAt: -1 });

      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=reviews.json"
        );
        return res.json({
          success: true,
          data: reviews,
          exportedAt: new Date(),
          totalRecords: reviews.length,
        });
      }

      // CSV format
      let csvData =
        "ID,Rating,Title,Comment,Reviewer Name,Reviewer Email,Target Type,Target Name,Status,Created At,Moderated By,Moderated At";

      if (includeResponses === "true") {
        csvData += ",Admin Response,Response By,Response Date";
      }

      csvData += "\n";

      reviews.forEach((review) => {
        const row = [
          review._id,
          review.rating,
          `"${(review.title || "").replace(/"/g, '""')}"`,
          `"${review.comment.replace(/"/g, '""')}"`,
          `"${review.reviewerName || ""}"`,
          review.reviewerEmail || "",
          review.targetType,
          `"${(review.targetName || "").replace(/"/g, '""')}"`,
          review.status,
          review.createdAt.toISOString(),
          review.moderatedBy
            ? `"${review.moderatedBy.firstName} ${review.moderatedBy.lastName}"`
            : "",
          review.moderatedAt ? review.moderatedAt.toISOString() : "",
        ];

        if (includeResponses === "true") {
          row.push(
            `"${(review.adminResponse?.responseText || "").replace(
              /"/g,
              '""'
            )}"`,
            review.adminResponse?.respondedBy
              ? `"${review.adminResponse.respondedBy.firstName} ${review.adminResponse.respondedBy.lastName}"`
              : "",
            review.adminResponse?.respondedAt
              ? review.adminResponse.respondedAt.toISOString()
              : ""
          );
        }

        csvData += row.join(",") + "\n";
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=reviews.csv");
      res.send(csvData);
    } catch (error) {
      console.error("Export reviews error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export reviews",
        error: error.message,
      });
    }
  }
}

export default ReviewManagementController;
