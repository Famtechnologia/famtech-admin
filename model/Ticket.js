import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const ticketSchema = new mongoose.Schema(
  {
    // Basic ticket information
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Ticket title is required"],
      maxLength: [200, "Title cannot exceed 200 characters"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Ticket description is required"],
      maxLength: [2000, "Description cannot exceed 2000 characters"],
    },

    // Ticket categorization
    category: {
      type: String,
      required: true,
      enum: [
        "technical_issue",
        "account_support",
        "billing_inquiry",
        "feature_request",
        "bug_report",
        "general_inquiry",
        "subscription_support",
        "content_issue",
        "user_management",
        "other",
      ],
      default: "general_inquiry",
    },
    subcategory: {
      type: String,
      trim: true,
      maxLength: [100, "Subcategory cannot exceed 100 characters"],
    },

    // Priority and severity
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent", "critical"],
      default: "normal",
      required: true,
    },
    severity: {
      type: String,
      enum: ["minor", "moderate", "major", "critical", "blocker"],
      default: "moderate",
    },

    // Status tracking
    status: {
      type: String,
      enum: [
        "open",
        "in_progress",
        "pending_customer",
        "pending_internal",
        "resolved",
        "closed",
        "cancelled",
      ],
      default: "open",
      required: true,
    },
    resolution: {
      type: String,
      enum: [
        "solved",
        "workaround_provided",
        "duplicate",
        "not_reproducible",
        "wont_fix",
        "by_design",
        "user_error",
        "cancelled_by_user",
      ],
    },

    // User information
    submitter: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
      },
      userType: {
        type: String,
        enum: ["farmer", "advisor", "viewer", "admin"],
        required: true,
      },
    },

    // Assignment and handling
    assignedTo: {
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SuperAdmin",
      },
      name: String,
      email: String,
      assignedAt: Date,
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SuperAdmin",
      },
    },
    team: {
      type: String,
      enum: ["support", "technical", "billing", "product", "management"],
      default: "support",
    },

    // Communication thread
    messages: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        content: {
          type: String,
          required: true,
          maxLength: [2000, "Message cannot exceed 2000 characters"],
        },
        sender: {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          email: {
            type: String,
            required: true,
          },
          type: {
            type: String,
            enum: ["user", "admin"],
            required: true,
          },
        },
        isInternal: {
          type: Boolean,
          default: false,
        },
        attachments: [
          {
            filename: String,
            url: String,
            size: Number,
            mimeType: String,
          },
        ],
        sentAt: {
          type: Date,
          default: Date.now,
        },
        readBy: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
            },
            readAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],

    // Timestamps and tracking
    timestamps: {
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      firstResponseAt: Date,
      resolvedAt: Date,
      closedAt: Date,
      lastActivityAt: {
        type: Date,
        default: Date.now,
      },
    },

    // SLA tracking
    sla: {
      responseTimeTarget: {
        type: Number, // hours
        default: 24,
      },
      resolutionTimeTarget: {
        type: Number, // hours
        default: 72,
      },
      firstResponseTime: Number, // actual hours taken
      resolutionTime: Number, // actual hours taken
      isResponseBreached: {
        type: Boolean,
        default: false,
      },
      isResolutionBreached: {
        type: Boolean,
        default: false,
      },
    },

    // Tags and labels
    tags: [
      {
        type: String,
        trim: true,
        maxLength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    labels: [
      {
        name: String,
        color: String,
      },
    ],

    // Related information
    relatedTickets: [
      {
        ticketId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ticket",
        },
        relationship: {
          type: String,
          enum: [
            "duplicate",
            "related",
            "blocks",
            "blocked_by",
            "parent",
            "child",
          ],
        },
      },
    ],

    // Customer feedback
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        maxLength: [500, "Feedback comment cannot exceed 500 characters"],
      },
      submittedAt: Date,
    },

    // Escalation tracking
    escalation: {
      level: {
        type: Number,
        min: 0,
        max: 3,
        default: 0,
      },
      escalatedAt: Date,
      escalatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SuperAdmin",
      },
      reason: String,
    },

    // System information
    systemInfo: {
      userAgent: String,
      ipAddress: String,
      platform: String,
      version: String,
      environment: String,
    },

    // Metrics and analytics
    metrics: {
      viewCount: {
        type: Number,
        default: 0,
      },
      responseCount: {
        type: Number,
        default: 0,
      },
      escalationCount: {
        type: Number,
        default: 0,
      },
      reopenCount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: false, // Using custom timestamps
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ "submitter.userId": 1 });
ticketSchema.index({ "assignedTo.adminId": 1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ category: 1, status: 1 });
ticketSchema.index({ "timestamps.createdAt": -1 });
ticketSchema.index({ "timestamps.lastActivityAt": -1 });
ticketSchema.index({ team: 1, status: 1 });

// Text search index
ticketSchema.index({
  title: "text",
  description: "text",
  "messages.content": "text",
});

// Virtual fields
ticketSchema.virtual("isOverdue").get(function () {
  if (this.status === "closed" || this.status === "resolved") return false;

  const now = new Date();
  const createdAt = this.timestamps.createdAt;
  const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);

  if (
    !this.timestamps.firstResponseAt &&
    hoursSinceCreated > this.sla.responseTimeTarget
  ) {
    return true;
  }

  if (hoursSinceCreated > this.sla.resolutionTimeTarget) {
    return true;
  }

  return false;
});

ticketSchema.virtual("responseTime").get(function () {
  if (!this.timestamps.firstResponseAt) return null;

  const createdAt = this.timestamps.createdAt;
  const firstResponseAt = this.timestamps.firstResponseAt;
  return (firstResponseAt - createdAt) / (1000 * 60 * 60); // hours
});

ticketSchema.virtual("resolutionTime").get(function () {
  if (!this.timestamps.resolvedAt) return null;

  const createdAt = this.timestamps.createdAt;
  const resolvedAt = this.timestamps.resolvedAt;
  return (resolvedAt - createdAt) / (1000 * 60 * 60); // hours
});

ticketSchema.virtual("unreadMessageCount").get(function () {
  const userId = this.submitter.userId;
  let unreadCount = 0;

  this.messages.forEach((message) => {
    const hasRead = message.readBy.some(
      (read) => read.userId.toString() === userId.toString()
    );
    if (!hasRead && message.sender.type === "admin") {
      unreadCount++;
    }
  });

  return unreadCount;
});

// Pre-save middleware
ticketSchema.pre("save", function (next) {
  this.timestamps.updatedAt = new Date();

  if (this.isModified("status")) {
    this.timestamps.lastActivityAt = new Date();

    if (this.status === "resolved" && !this.timestamps.resolvedAt) {
      this.timestamps.resolvedAt = new Date();
    }

    if (this.status === "closed" && !this.timestamps.closedAt) {
      this.timestamps.closedAt = new Date();
    }
  }

  // Calculate SLA breaches
  if (!this.timestamps.firstResponseAt && this.messages.length > 1) {
    this.timestamps.firstResponseAt = this.messages[1].sentAt;
    this.sla.firstResponseTime = this.responseTime;

    if (this.sla.firstResponseTime > this.sla.responseTimeTarget) {
      this.sla.isResponseBreached = true;
    }
  }

  if (this.timestamps.resolvedAt) {
    this.sla.resolutionTime = this.resolutionTime;

    if (this.sla.resolutionTime > this.sla.resolutionTimeTarget) {
      this.sla.isResolutionBreached = true;
    }
  }

  next();
});

// Static methods
ticketSchema.statics.generateTicketNumber = async function () {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");

  const prefix = `TK${year}${month}`;
  const lastTicket = await this.findOne({
    ticketNumber: { $regex: `^${prefix}` },
  }).sort({ ticketNumber: -1 });

  let sequence = 1;
  if (lastTicket) {
    const lastSequence = parseInt(lastTicket.ticketNumber.slice(-4));
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
};

ticketSchema.statics.getTicketStatistics = async function (filters = {}) {
  const stats = await this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: {
          $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
        closed: {
          $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
        },
        averageResolutionTime: { $avg: "$sla.resolutionTime" },
        averageResponseTime: { $avg: "$sla.firstResponseTime" },
        slaBreaches: {
          $sum: {
            $cond: [
              { $or: ["$sla.isResponseBreached", "$sla.isResolutionBreached"] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      averageResolutionTime: 0,
      averageResponseTime: 0,
      slaBreaches: 0,
    }
  );
};

ticketSchema.statics.searchTickets = async function (
  searchTerm,
  filters = {},
  options = {}
) {
  const searchQuery = {
    $text: { $search: searchTerm },
    ...filters,
  };

  return await this.paginate(searchQuery, {
    ...options,
    sort: { score: { $meta: "textScore" } },
    populate: [
      { path: "submitter.userId", select: "fullName email" },
      { path: "assignedTo.adminId", select: "fullName email" },
    ],
  });
};

// Instance methods
ticketSchema.methods.addMessage = function (
  content,
  sender,
  isInternal = false,
  attachments = []
) {
  const message = {
    content,
    sender: {
      id: sender.id,
      name: sender.name,
      email: sender.email,
      type: sender.type,
    },
    isInternal,
    attachments,
    sentAt: new Date(),
  };

  this.messages.push(message);
  this.metrics.responseCount += 1;
  this.timestamps.lastActivityAt = new Date();

  return message;
};

ticketSchema.methods.assignTo = function (admin, assignedBy) {
  this.assignedTo = {
    adminId: admin._id,
    name: admin.fullName,
    email: admin.email,
    assignedAt: new Date(),
    assignedBy: assignedBy._id,
  };

  this.timestamps.lastActivityAt = new Date();
};

ticketSchema.methods.escalate = function (escalatedBy, reason) {
  this.escalation.level += 1;
  this.escalation.escalatedAt = new Date();
  this.escalation.escalatedBy = escalatedBy._id;
  this.escalation.reason = reason;
  this.metrics.escalationCount += 1;

  // Update priority based on escalation level
  if (this.escalation.level >= 2 && this.priority !== "critical") {
    this.priority = "urgent";
  }
  if (this.escalation.level >= 3) {
    this.priority = "critical";
  }
};

ticketSchema.methods.markAsRead = function (userId) {
  this.messages.forEach((message) => {
    const hasRead = message.readBy.some(
      (read) => read.userId.toString() === userId.toString()
    );
    if (!hasRead) {
      message.readBy.push({ userId, readAt: new Date() });
    }
  });
};

ticketSchema.methods.addFeedback = function (rating, comment) {
  this.feedback = {
    rating,
    comment,
    submittedAt: new Date(),
  };
};

// Add pagination plugin
ticketSchema.plugin(mongoosePaginate);

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
