import Ticket from "../model/Ticket.js";
import KnowledgeBase, {
  KnowledgeBaseCategory,
} from "../model/KnowledgeBase.js";
import User from "../model/User.js";
import SuperAdmin from "../model/SuperAdmin.js";

// ============================================
// TICKET MANAGEMENT FUNCTIONS
// ============================================

// Support Dashboard - Overview of all tickets and metrics
export const getSupportDashboard = async (req, res) => {
  try {
    const { timeframe = "30", team } = req.query;
    const days = timeframe === "all" ? 365 : parseInt(timeframe);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build filter
    const filter = { "timestamps.createdAt": { $gte: startDate } };
    if (team && team !== "all") {
      filter.team = team;
    }

    // Get ticket statistics
    const ticketStats = await Ticket.getTicketStatistics(filter);

    // Get tickets by priority
    const ticketsByPriority = await Ticket.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
          avgResolutionTime: { $avg: "$sla.resolutionTime" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get tickets by category
    const ticketsByCategory = await Ticket.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          avgResolutionTime: { $avg: "$sla.resolutionTime" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get agent performance
    const agentPerformance = await Ticket.aggregate([
      {
        $match: {
          ...filter,
          "assignedTo.adminId": { $exists: true },
        },
      },
      {
        $group: {
          _id: "$assignedTo.adminId",
          agentName: { $first: "$assignedTo.name" },
          totalTickets: { $sum: 1 },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          avgResolutionTime: { $avg: "$sla.resolutionTime" },
          avgResponseTime: { $avg: "$sla.firstResponseTime" },
          slaBreaches: {
            $sum: {
              $cond: [
                {
                  $or: ["$sla.isResponseBreached", "$sla.isResolutionBreached"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { totalTickets: -1 } },
      { $limit: 10 },
    ]);

    // Calculate resolution rate for agents
    agentPerformance.forEach((agent) => {
      agent.resolutionRate =
        agent.totalTickets > 0
          ? ((agent.resolvedTickets / agent.totalTickets) * 100).toFixed(1)
          : 0;
      agent.slaCompliance =
        agent.totalTickets > 0
          ? (
              ((agent.totalTickets - agent.slaBreaches) / agent.totalTickets) *
              100
            ).toFixed(1)
          : 100;
    });

    // Get recent activity
    const recentTickets = await Ticket.find(filter)
      .sort({ "timestamps.lastActivityAt": -1 })
      .limit(10)
      .select(
        "ticketNumber title status priority timestamps submitter assignedTo"
      )
      .populate("submitter.userId", "fullName email")
      .populate("assignedTo.adminId", "fullName email");

    // Get overdue tickets
    const overdueTickets = await Ticket.find({
      status: { $nin: ["resolved", "closed"] },
      $expr: {
        $or: [
          {
            $and: [
              { $eq: ["$timestamps.firstResponseAt", null] },
              {
                $gt: [
                  {
                    $divide: [
                      { $subtract: [new Date(), "$timestamps.createdAt"] },
                      3600000,
                    ],
                  },
                  "$sla.responseTimeTarget",
                ],
              },
            ],
          },
          {
            $gt: [
              {
                $divide: [
                  { $subtract: [new Date(), "$timestamps.createdAt"] },
                  3600000,
                ],
              },
              "$sla.resolutionTimeTarget",
            ],
          },
        ],
      },
    }).countDocuments();

    // Calculate trends
    const prevPeriodStart = new Date(startDate);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - days);
    const prevPeriodFilter = {
      "timestamps.createdAt": {
        $gte: prevPeriodStart,
        $lt: startDate,
      },
    };
    if (team && team !== "all") {
      prevPeriodFilter.team = team;
    }

    const prevPeriodStats = await Ticket.getTicketStatistics(prevPeriodFilter);

    const trends = {
      totalTickets: {
        current: ticketStats.total,
        previous: prevPeriodStats.total,
        change:
          prevPeriodStats.total > 0
            ? (
                ((ticketStats.total - prevPeriodStats.total) /
                  prevPeriodStats.total) *
                100
              ).toFixed(1)
            : 0,
      },
      resolutionTime: {
        current: ticketStats.averageResolutionTime?.toFixed(1) || 0,
        previous: prevPeriodStats.averageResolutionTime?.toFixed(1) || 0,
        change:
          prevPeriodStats.averageResolutionTime > 0
            ? (
                ((ticketStats.averageResolutionTime -
                  prevPeriodStats.averageResolutionTime) /
                  prevPeriodStats.averageResolutionTime) *
                100
              ).toFixed(1)
            : 0,
      },
    };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          ...ticketStats,
          overdueTickets,
          slaCompliance:
            ticketStats.total > 0
              ? (
                  ((ticketStats.total - ticketStats.slaBreaches) /
                    ticketStats.total) *
                  100
                ).toFixed(1)
              : 100,
        },
        trends,
        ticketsByPriority,
        ticketsByCategory,
        agentPerformance,
        recentTickets,
        timeframe: `${days} days`,
      },
    });
  } catch (error) {
    console.error("Error getting support dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve support dashboard",
      error: error.message,
    });
  }
};

// Get all tickets with filtering and pagination
export const getAllTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      team,
      assignedTo,
      submittedBy,
      sortBy = "timestamps.lastActivityAt",
      sortOrder = "desc",
      search,
    } = req.query;

    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    if (team) filters.team = team;
    if (assignedTo) filters["assignedTo.adminId"] = assignedTo;
    if (submittedBy) filters["submitter.userId"] = submittedBy;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
      populate: [
        { path: "submitter.userId", select: "fullName email" },
        { path: "assignedTo.adminId", select: "fullName email" },
      ],
      select:
        "ticketNumber title description status priority category team submitter assignedTo timestamps sla metrics",
    };

    let result;
    if (search && search.trim()) {
      result = await Ticket.searchTickets(search, filters, options);
    } else {
      result = await Ticket.paginate(filters, options);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting tickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve tickets",
      error: error.message,
    });
  }
};

// Get single ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id)
      .populate("submitter.userId", "fullName email phone")
      .populate("assignedTo.adminId", "fullName email")
      .populate("messages.sender.id", "fullName email")
      .populate("relatedTickets.ticketId", "ticketNumber title status");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Mark messages as read for the current admin
    ticket.markAsRead(req.admin.id);
    await ticket.save();

    // Increment view count
    ticket.metrics.viewCount += 1;
    await ticket.save();

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Error getting ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve ticket",
      error: error.message,
    });
  }
};

// Create new ticket (admin can create on behalf of user)
export const createTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority = "normal",
      submitterUserId,
      team = "support",
      tags = [],
      systemInfo = {},
    } = req.body;

    // Get submitter information
    let submitter;
    if (submitterUserId) {
      const user = await User.findById(submitterUserId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Submitter user not found",
        });
      }
      submitter = {
        userId: user._id,
        name: user.fullName,
        email: user.email,
        userType: user.role,
      };
    } else {
      // Admin creating ticket for general inquiry
      submitter = {
        userId: req.admin.id,
        name: req.admin.fullName,
        email: req.admin.email,
        userType: "admin",
      };
    }

    // Generate unique ticket number
    const ticketNumber = await Ticket.generateTicketNumber();

    // Create ticket
    const ticket = new Ticket({
      ticketNumber,
      title,
      description,
      category,
      priority,
      team,
      submitter,
      tags,
      systemInfo,
      messages: [
        {
          content: description,
          sender: {
            id: submitter.userId,
            name: submitter.name,
            email: submitter.email,
            type: submitter.userType === "admin" ? "admin" : "user",
          },
        },
      ],
    });

    await ticket.save();

    // Populate the ticket for response
    await ticket.populate("submitter.userId", "fullName email");

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create ticket",
      error: error.message,
    });
  }
};

// Update ticket
export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      priority,
      status,
      team,
      tags,
      resolution,
    } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Update fields
    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (category) ticket.category = category;
    if (priority) ticket.priority = priority;
    if (status) ticket.status = status;
    if (team) ticket.team = team;
    if (tags) ticket.tags = tags;
    if (resolution) ticket.resolution = resolution;

    await ticket.save();

    // Populate the ticket for response
    await ticket.populate("assignedTo.adminId", "fullName email");

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket",
      error: error.message,
    });
  }
};

// Assign ticket to admin
export const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const admin = await SuperAdmin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Assign ticket
    ticket.assignTo(admin, req.admin);

    // Update status if it's still open
    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Ticket assigned successfully",
      data: {
        ticketNumber: ticket.ticketNumber,
        assignedTo: ticket.assignedTo,
        status: ticket.status,
      },
    });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign ticket",
      error: error.message,
    });
  }
};

// Add message to ticket
export const addTicketMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isInternal = false, attachments = [] } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Add message
    const message = ticket.addMessage(
      content,
      {
        id: req.admin.id,
        name: req.admin.fullName,
        email: req.admin.email,
        type: "admin",
      },
      isInternal,
      attachments
    );

    // Update ticket status if it was pending
    if (ticket.status === "pending_customer") {
      ticket.status = "in_progress";
    }

    await ticket.save();

    res.status(201).json({
      success: true,
      message: "Message added successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error adding ticket message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add message",
      error: error.message,
    });
  }
};

// Escalate ticket
export const escalateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Escalate ticket
    ticket.escalate(req.admin, reason);
    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Ticket escalated successfully",
      data: {
        ticketNumber: ticket.ticketNumber,
        escalation: ticket.escalation,
        priority: ticket.priority,
      },
    });
  } catch (error) {
    console.error("Error escalating ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to escalate ticket",
      error: error.message,
    });
  }
};

// Close ticket
export const closeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, resolutionNote } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Close ticket
    ticket.status = "closed";
    ticket.resolution = resolution;

    if (resolutionNote) {
      ticket.addMessage(
        resolutionNote,
        {
          id: req.admin.id,
          name: req.admin.fullName,
          email: req.admin.email,
          type: "admin",
        },
        true
      );
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Ticket closed successfully",
      data: {
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        resolution: ticket.resolution,
        closedAt: ticket.timestamps.closedAt,
      },
    });
  } catch (error) {
    console.error("Error closing ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to close ticket",
      error: error.message,
    });
  }
};

// Get ticket analytics
export const getTicketAnalytics = async (req, res) => {
  try {
    const { timeframe = "30", team, category } = req.query;
    const days = timeframe === "all" ? 365 : parseInt(timeframe);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build filter
    const filter = { "timestamps.createdAt": { $gte: startDate } };
    if (team && team !== "all") filter.team = team;
    if (category && category !== "all") filter.category = category;

    // Get various analytics
    const [
      responseTimeAnalytics,
      resolutionTimeAnalytics,
      categoryAnalytics,
      priorityDistribution,
      statusDistribution,
      dailyTicketVolume,
    ] = await Promise.all([
      // Response time analytics
      Ticket.aggregate([
        { $match: { ...filter, "sla.firstResponseTime": { $exists: true } } },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: "$sla.firstResponseTime" },
            minResponseTime: { $min: "$sla.firstResponseTime" },
            maxResponseTime: { $max: "$sla.firstResponseTime" },
            breachedCount: {
              $sum: { $cond: ["$sla.isResponseBreached", 1, 0] },
            },
            totalCount: { $sum: 1 },
          },
        },
      ]),

      // Resolution time analytics
      Ticket.aggregate([
        { $match: { ...filter, "sla.resolutionTime": { $exists: true } } },
        {
          $group: {
            _id: null,
            avgResolutionTime: { $avg: "$sla.resolutionTime" },
            minResolutionTime: { $min: "$sla.resolutionTime" },
            maxResolutionTime: { $max: "$sla.resolutionTime" },
            breachedCount: {
              $sum: { $cond: ["$sla.isResolutionBreached", 1, 0] },
            },
            totalCount: { $sum: 1 },
          },
        },
      ]),

      // Category analytics
      Ticket.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
            },
            avgResolutionTime: { $avg: "$sla.resolutionTime" },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Priority distribution
      Ticket.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
            percentage: { $sum: 1 },
          },
        },
      ]),

      // Status distribution
      Ticket.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // Daily ticket volume
      Ticket.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$timestamps.createdAt",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Calculate percentages for priority distribution
    const totalTickets = priorityDistribution.reduce(
      (sum, item) => sum + item.count,
      0
    );
    priorityDistribution.forEach((item) => {
      item.percentage =
        totalTickets > 0 ? ((item.count / totalTickets) * 100).toFixed(1) : 0;
    });

    res.status(200).json({
      success: true,
      data: {
        responseTime: responseTimeAnalytics[0] || {},
        resolutionTime: resolutionTimeAnalytics[0] || {},
        categoryAnalytics,
        priorityDistribution,
        statusDistribution,
        dailyTicketVolume,
        timeframe: `${days} days`,
      },
    });
  } catch (error) {
    console.error("Error getting ticket analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve ticket analytics",
      error: error.message,
    });
  }
};

// Bulk update tickets
export const bulkUpdateTickets = async (req, res) => {
  try {
    const { ticketIds, updates } = req.body;

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Ticket IDs array is required",
      });
    }

    const allowedUpdates = ["status", "priority", "team", "assignedTo"];
    const updateFields = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        updateFields[key] = value;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid update fields provided",
      });
    }

    const result = await Ticket.updateMany(
      { _id: { $in: ticketIds } },
      {
        $set: {
          ...updateFields,
          "timestamps.updatedAt": new Date(),
          "timestamps.lastActivityAt": new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} tickets updated successfully`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error bulk updating tickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk update tickets",
      error: error.message,
    });
  }
};

// ============================================
// KNOWLEDGE BASE MANAGEMENT FUNCTIONS
// ============================================

// Get knowledge base dashboard
export const getKnowledgeBaseDashboard = async (req, res) => {
  try {
    const { timeframe = "30" } = req.query;
    const days = timeframe === "all" ? 365 : parseInt(timeframe);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get knowledge base statistics
    const [
      totalArticles,
      publishedArticles,
      totalViews,
      totalCategories,
      popularArticles,
      recentArticles,
      articlesByType,
      topSearchTerms,
    ] = await Promise.all([
      KnowledgeBase.countDocuments(),
      KnowledgeBase.countDocuments({ status: "published" }),
      KnowledgeBase.aggregate([
        { $group: { _id: null, totalViews: { $sum: "$analytics.views" } } },
      ]),
      KnowledgeBaseCategory.countDocuments({ isActive: true }),
      KnowledgeBase.getPopularArticles(5),
      KnowledgeBase.getRecentArticles(5),
      KnowledgeBase.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            published: {
              $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
            },
            totalViews: { $sum: "$analytics.views" },
          },
        },
        { $sort: { count: -1 } },
      ]),
      // Mock search terms for now - you can implement actual search tracking
      [
        { term: "password reset", count: 45 },
        { term: "billing issue", count: 32 },
        { term: "account setup", count: 28 },
        { term: "feature request", count: 24 },
        { term: "technical support", count: 19 },
      ],
    ]);

    const avgRating = await KnowledgeBase.aggregate([
      { $match: { status: "published" } },
      {
        $group: { _id: null, avgRating: { $avg: "$analytics.averageRating" } },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalArticles,
          publishedArticles,
          totalViews: totalViews[0]?.totalViews || 0,
          totalCategories,
          averageRating: avgRating[0]?.avgRating?.toFixed(1) || 0,
          publishRate:
            totalArticles > 0
              ? ((publishedArticles / totalArticles) * 100).toFixed(1)
              : 0,
        },
        popularArticles,
        recentArticles,
        articlesByType,
        topSearchTerms,
        timeframe: `${days} days`,
      },
    });
  } catch (error) {
    console.error("Error getting knowledge base dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve knowledge base dashboard",
      error: error.message,
    });
  }
};

// Get all knowledge base articles
export const getAllKnowledgeBase = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      status,
      author,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (author) filters["author.id"] = author;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
      populate: [
        { path: "category", select: "name slug" },
        { path: "author.id", select: "fullName email" },
      ],
    };

    let result;
    if (search && search.trim()) {
      result = await KnowledgeBase.searchKnowledgeBase(
        search,
        filters,
        options
      );
    } else {
      result = await KnowledgeBase.paginate(filters, options);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting knowledge base articles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve knowledge base articles",
      error: error.message,
    });
  }
};

// Get single knowledge base article
export const getKnowledgeBaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await KnowledgeBase.findById(id)
      .populate("category", "name slug")
      .populate("author.id", "fullName email")
      .populate("lastEditedBy.id", "fullName email")
      .populate("relatedArticles", "title slug type");

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Knowledge base article not found",
      });
    }

    res.status(200).json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error("Error getting knowledge base article:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve knowledge base article",
      error: error.message,
    });
  }
};

// Create knowledge base article
export const createKnowledgeBase = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      type = "article",
      category,
      question,
      answer,
      tags = [],
      visibility = "public",
      featured = false,
      seo = {},
    } = req.body;

    const article = new KnowledgeBase({
      title,
      content,
      excerpt,
      type,
      category,
      question,
      answer,
      tags,
      visibility,
      featured,
      seo,
      author: {
        id: req.admin.id,
        name: req.admin.fullName,
        email: req.admin.email,
      },
    });

    await article.save();
    await article.populate("category", "name slug");

    res.status(201).json({
      success: true,
      message: "Knowledge base article created successfully",
      data: article,
    });
  } catch (error) {
    console.error("Error creating knowledge base article:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create knowledge base article",
      error: error.message,
    });
  }
};

// Update knowledge base article
export const updateKnowledgeBase = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const article = await KnowledgeBase.findById(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Knowledge base article not found",
      });
    }

    // Update last edited by
    updateData.lastEditedBy = {
      id: req.admin.id,
      name: req.admin.fullName,
      email: req.admin.email,
      editedAt: new Date(),
    };

    Object.assign(article, updateData);
    await article.save();

    await article.populate("category", "name slug");

    res.status(200).json({
      success: true,
      message: "Knowledge base article updated successfully",
      data: article,
    });
  } catch (error) {
    console.error("Error updating knowledge base article:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update knowledge base article",
      error: error.message,
    });
  }
};

// Delete knowledge base article
export const deleteKnowledgeBase = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await KnowledgeBase.findById(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Knowledge base article not found",
      });
    }

    await KnowledgeBase.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Knowledge base article deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting knowledge base article:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete knowledge base article",
      error: error.message,
    });
  }
};

// Get FAQs
export const getFAQs = async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;

    const faqs = await KnowledgeBase.getFAQs(category);

    res.status(200).json({
      success: true,
      data: faqs.slice(0, parseInt(limit)),
    });
  } catch (error) {
    console.error("Error getting FAQs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve FAQs",
      error: error.message,
    });
  }
};

// Get knowledge base categories
export const getKnowledgeBaseCategories = async (req, res) => {
  try {
    const { includeStats = false } = req.query;

    let categories;
    if (includeStats === "true") {
      categories = await KnowledgeBaseCategory.getCategoryTree();
    } else {
      categories = await KnowledgeBaseCategory.find({ isActive: true })
        .sort({ order: 1, name: 1 })
        .select("name slug description parentCategory level icon color");
    }

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error getting knowledge base categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve knowledge base categories",
      error: error.message,
    });
  }
};

// Create knowledge base category
export const createKnowledgeBaseCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      parentCategory,
      icon,
      color,
      allowedContentTypes = ["article", "faq"],
    } = req.body;

    // Calculate level based on parent
    let level = 0;
    if (parentCategory) {
      const parent = await KnowledgeBaseCategory.findById(parentCategory);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found",
        });
      }
      level = parent.level + 1;

      if (level > 3) {
        return res.status(400).json({
          success: false,
          message: "Maximum category depth (3 levels) exceeded",
        });
      }
    }

    const category = new KnowledgeBaseCategory({
      name,
      description,
      parentCategory,
      level,
      icon,
      color,
      allowedContentTypes,
      createdBy: req.admin.id,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Knowledge base category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error creating knowledge base category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create knowledge base category",
      error: error.message,
    });
  }
};

export default {
  getSupportDashboard,
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  assignTicket,
  addTicketMessage,
  escalateTicket,
  closeTicket,
  getTicketAnalytics,
  bulkUpdateTickets,
  getKnowledgeBaseDashboard,
  getAllKnowledgeBase,
  getKnowledgeBaseById,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  getFAQs,
  getKnowledgeBaseCategories,
  createKnowledgeBaseCategory,
};
