import Content from "../model/Content.js";
import ContentCategory from "../model/ContentCategory.js";
import SuperAdmin from "../model/SuperAdmin.js";
import User from "../model/User.js";

// Content Dashboard - Overview of all content
export const getContentDashboard = async (req, res) => {
  try {
    const { timeframe = "30" } = req.query;
    const days = timeframe === "all" ? 365 : parseInt(timeframe);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get content statistics
    const contentStats = await Content.getContentStatistics({
      createdAt: { $gte: startDate },
    });

    // Get content by type
    const contentByType = await Content.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          draft: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
          },
          totalViews: { $sum: "$analytics.views" },
          totalLikes: { $sum: "$analytics.likes" },
          averageEngagement: { $avg: "$analytics.engagementScore" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get content by category
    const contentByCategory = await Content.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          totalViews: { $sum: "$analytics.views" },
          averageEngagement: { $avg: "$analytics.engagementScore" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get recent content activity
    const recentContent = await Content.find({
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("author.id", "fullName email")
      .select("title type status createdAt author analytics");

    // Get trending content
    const trendingContent = await Content.getTrendingContent(days, 5);

    // Get content requiring attention
    const contentNeedingAttention = await Content.find({
      $or: [
        {
          status: "draft",
          createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        { "workflow.currentStage": "review" },
        { status: "scheduled", scheduledAt: { $lt: new Date() } },
      ],
    }).countDocuments();

    // Calculate engagement metrics
    const totalContent = contentStats.totalContent || 0;
    const engagementRate =
      totalContent > 0
        ? ((contentStats.totalLikes + contentStats.totalShares) /
            contentStats.totalViews) *
          100
        : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalContent: contentStats.totalContent || 0,
          publishedContent: contentStats.publishedContent || 0,
          draftContent: contentStats.draftContent || 0,
          featuredContent: contentStats.featuredContent || 0,
          totalViews: contentStats.totalViews || 0,
          totalLikes: contentStats.totalLikes || 0,
          totalShares: contentStats.totalShares || 0,
          averageEngagement:
            Math.round((contentStats.averageEngagement || 0) * 100) / 100,
          engagementRate: Math.round(engagementRate * 100) / 100,
        },
        breakdown: {
          byType: contentByType,
          byCategory: contentByCategory,
        },
        recent: recentContent,
        trending: trendingContent,
        alerts: {
          contentNeedingAttention,
          scheduledContent: await Content.countDocuments({
            status: "scheduled",
          }),
          expiredContent: await Content.countDocuments({
            expiresAt: { $lt: new Date() },
            status: "published",
          }),
        },
        timeframe: `${days} days`,
      },
    });
  } catch (error) {
    console.error("Error getting content dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve content dashboard",
      error: error.message,
    });
  }
};

// Get all content with filtering and pagination
export const getAllContent = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      status,
      author,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      featured,
      dateFrom,
      dateTo,
    } = req.query;

    // Build filters
    const filters = {};

    if (type) filters.type = type;
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (author) filters["author.id"] = author;
    if (featured !== undefined) filters.featured = featured === "true";

    if (dateFrom || dateTo) {
      filters.createdAt = {};
      if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filters.createdAt.$lte = new Date(dateTo);
    }

    // Handle search
    let contentResult;
    if (search) {
      contentResult = await Content.searchContent(search, filters, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
      });
    } else {
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [content, total] = await Promise.all([
        Content.find(filters)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .populate("author.id", "fullName email")
          .populate("lastEditedBy", "fullName email")
          .select(
            "title slug excerpt type category status analytics publishedAt createdAt author lastEditedBy featured"
          ),
        Content.countDocuments(filters),
      ]);

      contentResult = {
        content,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      };
    }

    res.status(200).json({
      success: true,
      data: contentResult,
      filters: {
        type,
        category,
        status,
        author,
        search,
        featured,
        dateFrom,
        dateTo,
      },
    });
  } catch (error) {
    console.error("Error getting all content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve content",
      error: error.message,
    });
  }
};

// Get single content by ID
export const getContentById = async (req, res) => {
  try {
    const { contentId } = req.params;

    const content = await Content.findById(contentId)
      .populate("author.id", "fullName email role")
      .populate("lastEditedBy", "fullName email")
      .populate("relatedContent", "title slug type category")
      .populate("prerequisites", "title slug type category")
      .populate("workflow.reviewers.reviewer", "fullName email")
      .populate("workflow.approvedBy", "fullName email");

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { content },
    });
  } catch (error) {
    console.error("Error getting content by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve content",
      error: error.message,
    });
  }
};

// Create new content
export const createContent = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      type,
      category,
      subcategory,
      tags,
      status = "draft",
      visibility = "public",
      featured = false,
      priority = "normal",
      scheduledAt,
      expiresAt,
      featuredImage,
      gallery,
      attachments,
      videoData,
      seo,
      settings,
      series,
      relatedContent,
      prerequisites,
    } = req.body;

    const adminId = req.admin.id;
    const admin = await SuperAdmin.findById(adminId).select("fullName email");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Verify category exists
    if (category) {
      const categoryExists = await ContentCategory.findOne({
        name: category,
        isActive: true,
      });
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid category specified",
        });
      }
    }

    const newContent = new Content({
      title,
      excerpt,
      content,
      type,
      category,
      subcategory,
      tags,
      status,
      visibility,
      featured,
      priority,
      scheduledAt,
      expiresAt,
      author: {
        id: adminId,
        name: admin.fullName,
        email: admin.email,
      },
      featuredImage,
      gallery,
      attachments,
      videoData,
      seo,
      settings,
      series,
      relatedContent,
      prerequisites,
    });

    // Auto-publish if status is published
    if (status === "published") {
      newContent.publishedAt = new Date();
    }

    await newContent.save();

    // Update category statistics
    if (category) {
      const categoryDoc = await ContentCategory.findOne({ name: category });
      if (categoryDoc) {
        await categoryDoc.updateStats();
      }
    }

    res.status(201).json({
      success: true,
      message: "Content created successfully",
      data: { content: newContent },
    });
  } catch (error) {
    console.error("Error creating content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create content",
      error: error.message,
    });
  }
};

// Update existing content
export const updateContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const updateData = req.body;
    const adminId = req.admin.id;

    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    // Store previous content for version history
    const previousContent = content.content;

    // Update content fields
    Object.keys(updateData).forEach((key) => {
      if (key !== "_id" && key !== "createdAt" && key !== "updatedAt") {
        content[key] = updateData[key];
      }
    });

    // Update editor information
    content.lastEditedBy = adminId;
    content.editors.push({
      id: adminId,
      name: req.admin.fullName,
      email: req.admin.email,
      changes: "Content updated",
    });

    // Handle status changes
    if (updateData.status === "published" && content.status !== "published") {
      content.publishedAt = new Date();
    }

    if (updateData.status === "archived") {
      content.archivedAt = new Date();
    }

    await content.save();

    // Update category statistics if category changed
    if (updateData.category && updateData.category !== content.category) {
      const newCategory = await ContentCategory.findOne({
        name: updateData.category,
      });
      if (newCategory) {
        await newCategory.updateStats();
      }

      const oldCategory = await ContentCategory.findOne({
        name: content.category,
      });
      if (oldCategory) {
        await oldCategory.updateStats();
      }
    }

    res.status(200).json({
      success: true,
      message: "Content updated successfully",
      data: { content },
    });
  } catch (error) {
    console.error("Error updating content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update content",
      error: error.message,
    });
  }
};

// Delete content
export const deleteContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { confirmDelete } = req.body;

    if (!confirmDelete) {
      return res.status(400).json({
        success: false,
        message: "Please confirm deletion by setting confirmDelete to true",
      });
    }

    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    // Store content data before deletion
    const deletedContentData = {
      title: content.title,
      type: content.type,
      category: content.category,
      author: content.author.name,
      deletedAt: new Date(),
      deletedBy: req.admin.fullName,
    };

    await Content.findByIdAndDelete(contentId);

    // Update category statistics
    if (content.category) {
      const category = await ContentCategory.findOne({
        name: content.category,
      });
      if (category) {
        await category.updateStats();
      }
    }

    res.status(200).json({
      success: true,
      message: "Content deleted successfully",
      data: deletedContentData,
    });
  } catch (error) {
    console.error("Error deleting content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete content",
      error: error.message,
    });
  }
};

// Bulk operations on content
export const bulkContentActions = async (req, res) => {
  try {
    const { contentIds, action, data = {} } = req.body;

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Content IDs array is required",
      });
    }

    const validActions = [
      "publish",
      "unpublish",
      "archive",
      "delete",
      "feature",
      "unfeature",
      "changeCategory",
    ];

    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action. Valid actions: ${validActions.join(", ")}`,
      });
    }

    let updateQuery = {};
    let additionalUpdates = {};

    switch (action) {
      case "publish":
        updateQuery = { status: "published", publishedAt: new Date() };
        break;
      case "unpublish":
        updateQuery = { status: "draft" };
        break;
      case "archive":
        updateQuery = { status: "archived", archivedAt: new Date() };
        break;
      case "feature":
        updateQuery = { featured: true };
        break;
      case "unfeature":
        updateQuery = { featured: false };
        break;
      case "changeCategory":
        if (!data.category) {
          return res.status(400).json({
            success: false,
            message: "Category is required for changeCategory action",
          });
        }
        updateQuery = { category: data.category };
        break;
      case "delete":
        if (!data.confirmDelete) {
          return res.status(400).json({
            success: false,
            message: "Please confirm deletion by setting confirmDelete to true",
          });
        }
        // Handle deletion separately
        const deleteResult = await Content.deleteMany({
          _id: { $in: contentIds },
        });
        return res.status(200).json({
          success: true,
          message: `Successfully deleted ${deleteResult.deletedCount} content items`,
          data: { deletedCount: deleteResult.deletedCount },
        });
    }

    const result = await Content.updateMany(
      { _id: { $in: contentIds } },
      {
        $set: {
          ...updateQuery,
          lastEditedBy: req.admin.id,
          ...additionalUpdates,
        },
        $push: {
          editors: {
            id: req.admin.id,
            name: req.admin.fullName,
            email: req.admin.email,
            changes: `Bulk ${action} operation`,
          },
        },
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully performed ${action} on ${result.modifiedCount} content items`,
      data: {
        action,
        modifiedCount: result.modifiedCount,
        totalRequested: contentIds.length,
      },
    });
  } catch (error) {
    console.error("Error performing bulk content action:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform bulk action",
      error: error.message,
    });
  }
};

// Publish content
export const publishContent = async (req, res) => {
  try {
    const { contentId } = req.params;

    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    if (content.status === "published") {
      return res.status(400).json({
        success: false,
        message: "Content is already published",
      });
    }

    await content.publish();

    res.status(200).json({
      success: true,
      message: "Content published successfully",
      data: { content },
    });
  } catch (error) {
    console.error("Error publishing content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to publish content",
      error: error.message,
    });
  }
};

// Archive content
export const archiveContent = async (req, res) => {
  try {
    const { contentId } = req.params;

    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    await content.archive();

    res.status(200).json({
      success: true,
      message: "Content archived successfully",
      data: { content },
    });
  } catch (error) {
    console.error("Error archiving content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to archive content",
      error: error.message,
    });
  }
};

// Schedule content
export const scheduleContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date is required",
      });
    }

    const scheduledDate = new Date(scheduledAt);

    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date must be in the future",
      });
    }

    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    await content.schedule(scheduledDate);

    res.status(200).json({
      success: true,
      message: "Content scheduled successfully",
      data: { content },
    });
  } catch (error) {
    console.error("Error scheduling content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to schedule content",
      error: error.message,
    });
  }
};

// Get content analytics
export const getContentAnalytics = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { timeframe = "30" } = req.query;

    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    // Calculate engagement score
    await content.calculateEngagementScore();

    // Get related analytics data
    const analytics = {
      basic: {
        views: content.analytics.views,
        uniqueViews: content.analytics.uniqueViews,
        likes: content.analytics.likes,
        shares: content.analytics.shares,
        downloads: content.analytics.downloads,
        comments: content.analytics.comments,
        engagementScore: content.analytics.engagementScore,
        averageTimeSpent: content.analytics.averageTimeSpent,
        bounceRate: content.analytics.bounceRate,
      },
      interactions: {
        totalLikes: content.userInteractions.likedBy.length,
        totalShares: content.userInteractions.sharedBy.length,
        totalBookmarks: content.userInteractions.bookmarkedBy.length,
      },
      performance: {
        readingTime: content.readingTime,
        contentAge: content.contentAge,
        publishedAt: content.publishedAt,
        lastViewedAt: content.analytics.lastViewedAt,
      },
      quality: {
        rating: content.quality.rating,
        accuracy: content.quality.accuracy,
        helpfulness: content.quality.helpfulness,
        upToDate: content.quality.upToDate,
        reviewCount: content.quality.reviews.length,
      },
    };

    res.status(200).json({
      success: true,
      data: {
        analytics,
        contentInfo: {
          title: content.title,
          type: content.type,
          category: content.category,
        },
      },
    });
  } catch (error) {
    console.error("Error getting content analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve content analytics",
      error: error.message,
    });
  }
};

// Add admin note to content
export const addContentNote = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { note, type = "info" } = req.body;

    if (!note) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    await content.addAdminNote(note, req.admin.id, type);

    res.status(200).json({
      success: true,
      message: "Admin note added successfully",
      data: {
        note: {
          note,
          type,
          addedBy: req.admin.fullName,
          addedAt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error("Error adding admin note:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add admin note",
      error: error.message,
    });
  }
};

// Get trending content
export const getTrendingContent = async (req, res) => {
  try {
    const { days = 7, limit = 10, type } = req.query;

    const filters = {};
    if (type) filters.type = type;

    const trendingContent = await Content.find({
      status: "published",
      publishedAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
      ...filters,
    })
      .sort({ "analytics.engagementScore": -1, "analytics.views": -1 })
      .limit(parseInt(limit))
      .populate("author.id", "fullName email")
      .select(
        "title slug excerpt type category analytics publishedAt author featured"
      );

    res.status(200).json({
      success: true,
      data: { trendingContent, timeframe: `${days} days` },
    });
  } catch (error) {
    console.error("Error getting trending content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve trending content",
      error: error.message,
    });
  }
};

// Search Content
export const searchContent = async (req, res) => {
  try {
    const {
      search,
      type,
      category,
      status,
      author,
      page = 1,
      limit = 20,
      sortBy = "relevance",
    } = req.query;

    // Build search filters
    const filters = {};
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (author) filters["author.id"] = author;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort:
        sortBy === "relevance"
          ? { score: { $meta: "textScore" } }
          : { [sortBy]: -1 },
    };

    let contentResult;
    if (search && search.trim()) {
      // Use the static searchContent method from the model
      contentResult = await Content.searchContent(search, filters, options);
    } else {
      // Regular filter search
      contentResult = await Content.paginate(filters, {
        ...options,
        populate: [
          { path: "author.id", select: "fullName email" },
          { path: "category", select: "name slug" },
        ],
        select:
          "title slug excerpt type category status publishedAt author analytics featured",
      });
    }

    res.status(200).json({
      success: true,
      data: contentResult,
      searchQuery: search,
      filters,
    });
  } catch (error) {
    console.error("Error searching content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search content",
      error: error.message,
    });
  }
};

// Add Admin Note (alias for addContentNote for consistency with router)
export const addAdminNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, type = "info" } = req.body;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    // Add admin note using the model method
    await content.addAdminNote(note, req.admin.id, type);

    res.status(200).json({
      success: true,
      message: "Admin note added successfully",
      data: {
        note: content.adminNotes[content.adminNotes.length - 1],
      },
    });
  } catch (error) {
    console.error("Error adding admin note:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add admin note",
      error: error.message,
    });
  }
};

// Remove Admin Note
export const removeAdminNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    // Find and remove the note
    const noteIndex = content.adminNotes.findIndex(
      (note) => note._id.toString() === noteId
    );

    if (noteIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Admin note not found",
      });
    }

    // Check if the current admin can remove this note (only note creator or superadmin)
    const note = content.adminNotes[noteIndex];
    if (
      note.author.toString() !== req.admin.id &&
      req.admin.role !== "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only remove your own notes or be a superadmin",
      });
    }

    content.adminNotes.splice(noteIndex, 1);
    await content.save();

    res.status(200).json({
      success: true,
      message: "Admin note removed successfully",
    });
  } catch (error) {
    console.error("Error removing admin note:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove admin note",
      error: error.message,
    });
  }
};
