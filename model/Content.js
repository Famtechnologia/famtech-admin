import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    // Basic Content Information
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: [true, "Excerpt is required"],
      trim: true,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },

    // Content Type and Category
    type: {
      type: String,
      enum: [
        "blog_post",
        "news",
        "announcement",
        "tutorial",
        "guide",
        "video",
        "resource",
      ],
      required: [true, "Content type is required"],
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Content Status and Visibility
    status: {
      type: String,
      enum: ["draft", "published", "scheduled", "archived", "private"],
      default: "draft",
      required: true,
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "members_only", "premium_only", "admin_only"],
      default: "public",
      required: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    // Publishing Information
    publishedAt: {
      type: Date,
      index: true,
    },
    scheduledAt: {
      type: Date,
    },
    archivedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },

    // Author and Editor Information
    author: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SuperAdmin",
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
    },
    editors: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
        },
        name: String,
        email: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
        changes: String,
      },
    ],
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
    },

    // Media and Resources
    featuredImage: {
      url: String,
      alt: String,
      caption: String,
      credits: String,
    },
    gallery: [
      {
        url: String,
        alt: String,
        caption: String,
        type: {
          type: String,
          enum: ["image", "video", "document", "audio"],
          default: "image",
        },
      },
    ],
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number, // in bytes
        downloadCount: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Video-specific fields
    videoData: {
      duration: Number, // in seconds
      videoUrl: String,
      thumbnailUrl: String,
      videoProvider: {
        type: String,
        enum: ["youtube", "vimeo", "direct", "other"],
      },
      videoId: String,
      resolution: String,
      fileSize: Number,
    },

    // SEO and Meta Information
    seo: {
      metaTitle: {
        type: String,
        maxlength: [60, "Meta title cannot exceed 60 characters"],
      },
      metaDescription: {
        type: String,
        maxlength: [160, "Meta description cannot exceed 160 characters"],
      },
      keywords: [
        {
          type: String,
          trim: true,
        },
      ],
      ogTitle: String,
      ogDescription: String,
      ogImage: String,
      canonicalUrl: String,
    },

    // Content Metrics and Analytics
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      uniqueViews: {
        type: Number,
        default: 0,
      },
      likes: {
        type: Number,
        default: 0,
      },
      shares: {
        type: Number,
        default: 0,
      },
      downloads: {
        type: Number,
        default: 0,
      },
      comments: {
        type: Number,
        default: 0,
      },
      averageTimeSpent: {
        type: Number, // in seconds
        default: 0,
      },
      bounceRate: {
        type: Number, // percentage
        default: 0,
      },
      engagementScore: {
        type: Number, // 0-100 scale
        default: 0,
      },
      lastViewedAt: Date,
    },

    // User Interaction Data
    userInteractions: {
      likedBy: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          likedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      sharedBy: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          platform: String,
          sharedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      bookmarkedBy: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          bookmarkedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // Content Settings and Configuration
    settings: {
      allowComments: {
        type: Boolean,
        default: true,
      },
      allowSharing: {
        type: Boolean,
        default: true,
      },
      allowDownload: {
        type: Boolean,
        default: true,
      },
      requireLogin: {
        type: Boolean,
        default: false,
      },
      ageRestriction: {
        type: Number,
        min: 0,
        max: 18,
      },
      language: {
        type: String,
        default: "en",
      },
      region: String,
    },

    // Content Organization
    series: {
      name: String,
      order: Number,
      totalParts: Number,
    },
    relatedContent: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Content",
      },
    ],
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Content",
      },
    ],

    // Workflow and Approval
    workflow: {
      currentStage: {
        type: String,
        enum: ["draft", "review", "approved", "published", "rejected"],
        default: "draft",
      },
      reviewers: [
        {
          reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SuperAdmin",
          },
          reviewedAt: Date,
          status: {
            type: String,
            enum: ["pending", "approved", "rejected", "needs_changes"],
          },
          comments: String,
        },
      ],
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SuperAdmin",
      },
      approvedAt: Date,
      rejectionReason: String,
    },

    // Version Control
    version: {
      type: Number,
      default: 1,
    },
    versionHistory: [
      {
        version: Number,
        content: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changes: String,
        reason: String,
      },
    ],

    // Content Quality and Rating
    quality: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 3,
      },
      reviews: [
        {
          reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SuperAdmin",
          },
          rating: {
            type: Number,
            min: 1,
            max: 5,
          },
          feedback: String,
          reviewedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      accuracy: {
        type: Number,
        min: 1,
        max: 5,
      },
      helpfulness: {
        type: Number,
        min: 1,
        max: 5,
      },
      upToDate: {
        type: Boolean,
        default: true,
      },
      lastFactChecked: Date,
    },

    // Admin Notes and Internal Information
    adminNotes: [
      {
        note: String,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ["info", "warning", "important", "todo"],
          default: "info",
        },
      },
    ],
    internalTags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    collection: "content",
  }
);

// Indexes for performance
contentSchema.index({ title: "text", content: "text", excerpt: "text" });
contentSchema.index({ type: 1, status: 1 });
contentSchema.index({ category: 1, type: 1 });
contentSchema.index({ publishedAt: -1, status: 1 });
contentSchema.index({ featured: 1, status: 1 });
contentSchema.index({ "author.id": 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ slug: 1 }, { unique: true });
contentSchema.index({ createdAt: -1 });
contentSchema.index({ "analytics.views": -1 });
contentSchema.index({ "analytics.engagementScore": -1 });

// Compound indexes for common queries
contentSchema.index({ type: 1, status: 1, publishedAt: -1 });
contentSchema.index({ category: 1, status: 1, featured: -1 });
contentSchema.index({ visibility: 1, status: 1, publishedAt: -1 });
contentSchema.index({ "workflow.currentStage": 1, createdAt: -1 });

// Virtual for content URL
contentSchema.virtual("url").get(function () {
  return `/${this.type}/${this.slug}`;
});

// Virtual for reading time estimation
contentSchema.virtual("readingTime").get(function () {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Virtual for content age
contentSchema.virtual("contentAge").get(function () {
  if (!this.publishedAt) return null;
  const ageInDays = Math.floor(
    (Date.now() - this.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  return ageInDays;
});

// Pre-save middleware to generate slug
contentSchema.pre("save", function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

// Pre-save middleware to update version
contentSchema.pre("save", function (next) {
  if (this.isModified("content") && !this.isNew) {
    this.version += 1;
    this.versionHistory.push({
      version: this.version - 1,
      content: this.content,
      changedBy: this.lastEditedBy,
      changes: "Content updated",
    });
  }
  next();
});

// Method to publish content
contentSchema.methods.publish = function () {
  this.status = "published";
  this.publishedAt = new Date();
  this.workflow.currentStage = "published";
  return this.save();
};

// Method to archive content
contentSchema.methods.archive = function () {
  this.status = "archived";
  this.archivedAt = new Date();
  return this.save();
};

// Method to schedule content
contentSchema.methods.schedule = function (scheduledDate) {
  this.status = "scheduled";
  this.scheduledAt = scheduledDate;
  return this.save();
};

// Method to increment view count
contentSchema.methods.incrementViews = function (isUnique = false) {
  this.analytics.views += 1;
  if (isUnique) {
    this.analytics.uniqueViews += 1;
  }
  this.analytics.lastViewedAt = new Date();
  return this.save();
};

// Method to add user interaction
contentSchema.methods.addInteraction = function (
  userId,
  interactionType,
  data = {}
) {
  switch (interactionType) {
    case "like":
      if (
        !this.userInteractions.likedBy.find(
          (like) => like.userId.toString() === userId.toString()
        )
      ) {
        this.userInteractions.likedBy.push({ userId });
        this.analytics.likes += 1;
      }
      break;
    case "share":
      this.userInteractions.sharedBy.push({ userId, platform: data.platform });
      this.analytics.shares += 1;
      break;
    case "bookmark":
      if (
        !this.userInteractions.bookmarkedBy.find(
          (bookmark) => bookmark.userId.toString() === userId.toString()
        )
      ) {
        this.userInteractions.bookmarkedBy.push({ userId });
      }
      break;
  }
  return this.save();
};

// Method to remove user interaction
contentSchema.methods.removeInteraction = function (userId, interactionType) {
  switch (interactionType) {
    case "like":
      this.userInteractions.likedBy = this.userInteractions.likedBy.filter(
        (like) => like.userId.toString() !== userId.toString()
      );
      this.analytics.likes = Math.max(0, this.analytics.likes - 1);
      break;
    case "bookmark":
      this.userInteractions.bookmarkedBy =
        this.userInteractions.bookmarkedBy.filter(
          (bookmark) => bookmark.userId.toString() !== userId.toString()
        );
      break;
  }
  return this.save();
};

// Method to calculate engagement score
contentSchema.methods.calculateEngagementScore = function () {
  const views = this.analytics.views || 1;
  const likes = this.analytics.likes || 0;
  const shares = this.analytics.shares || 0;
  const comments = this.analytics.comments || 0;
  const downloads = this.analytics.downloads || 0;

  // Engagement score calculation (0-100 scale)
  const likeRate = (likes / views) * 100;
  const shareRate = (shares / views) * 100;
  const commentRate = (comments / views) * 100;
  const downloadRate = (downloads / views) * 100;

  const engagementScore = Math.min(
    likeRate * 0.3 + shareRate * 0.3 + commentRate * 0.25 + downloadRate * 0.15,
    100
  );

  this.analytics.engagementScore = Math.round(engagementScore * 100) / 100;
  return this.save();
};

// Method to add admin note
contentSchema.methods.addAdminNote = function (note, addedBy, type = "info") {
  this.adminNotes.push({
    note,
    addedBy,
    type,
  });
  return this.save();
};

// Static method to get content statistics
contentSchema.statics.getContentStatistics = async function (filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalContent: { $sum: 1 },
        publishedContent: {
          $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
        },
        draftContent: {
          $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
        },
        featuredContent: {
          $sum: { $cond: ["$featured", 1, 0] },
        },
        totalViews: { $sum: "$analytics.views" },
        totalLikes: { $sum: "$analytics.likes" },
        totalShares: { $sum: "$analytics.shares" },
        averageEngagement: { $avg: "$analytics.engagementScore" },
        contentByType: {
          $push: {
            type: "$type",
            count: 1,
          },
        },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {};
};

// Static method to get trending content
contentSchema.statics.getTrendingContent = async function (
  days = 7,
  limit = 10
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.find({
    status: "published",
    publishedAt: { $gte: startDate },
  })
    .sort({ "analytics.engagementScore": -1, "analytics.views": -1 })
    .limit(limit)
    .populate("author.id", "fullName email")
    .select("title slug excerpt type category analytics publishedAt author");
};

// Static method to search content
contentSchema.statics.searchContent = async function (
  query,
  filters = {},
  options = {}
) {
  const searchQuery = {
    $and: [
      {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { content: { $regex: query, $options: "i" } },
          { excerpt: { $regex: query, $options: "i" } },
          { tags: { $in: [new RegExp(query, "i")] } },
        ],
      },
      filters,
    ],
  };

  const {
    page = 1,
    limit = 20,
    sortBy = "publishedAt",
    sortOrder = "desc",
  } = options;
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [content, total] = await Promise.all([
    this.find(searchQuery)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("author.id", "fullName email")
      .select(
        "title slug excerpt type category status analytics publishedAt author featured"
      ),
    this.countDocuments(searchQuery),
  ]);

  return {
    content,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit,
    },
  };
};

// Export the model
const Content = mongoose.model("Content", contentSchema);

export default Content;
