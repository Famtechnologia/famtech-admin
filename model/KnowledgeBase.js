import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const knowledgeBaseSchema = new mongoose.Schema(
  {
    // Basic information
    title: {
      type: String,
      required: [true, "Title is required"],
      maxLength: [200, "Title cannot exceed 200 characters"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    excerpt: {
      type: String,
      maxLength: [500, "Excerpt cannot exceed 500 characters"],
      trim: true,
    },

    // Content type and categorization
    type: {
      type: String,
      enum: [
        "article",
        "faq",
        "tutorial",
        "guide",
        "troubleshooting",
        "video",
        "documentation",
      ],
      default: "article",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KnowledgeBaseCategory",
      required: true,
    },
    subcategory: {
      type: String,
      trim: true,
      maxLength: [100, "Subcategory cannot exceed 100 characters"],
    },

    // FAQ specific fields
    question: {
      type: String,
      maxLength: [300, "Question cannot exceed 300 characters"],
      trim: true,
    },
    answer: {
      type: String,
      maxLength: [2000, "Answer cannot exceed 2000 characters"],
    },

    // Status and visibility
    status: {
      type: String,
      enum: ["draft", "published", "archived", "private"],
      default: "draft",
      required: true,
    },
    visibility: {
      type: String,
      enum: ["public", "members_only", "admin_only"],
      default: "public",
      required: true,
    },

    // Author and management
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
    lastEditedBy: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SuperAdmin",
      },
      name: String,
      email: String,
      editedAt: Date,
    },

    // Content organization
    tags: [
      {
        type: String,
        trim: true,
        maxLength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    relatedArticles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "KnowledgeBase",
      },
    ],

    // Display and ordering
    featured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "beginner",
    },

    // Media and attachments
    featuredImage: {
      url: String,
      alt: String,
      caption: String,
    },
    attachments: [
      {
        filename: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        size: Number,
        mimeType: String,
        description: String,
      },
    ],

    // SEO and metadata
    seo: {
      metaTitle: {
        type: String,
        maxLength: [60, "Meta title cannot exceed 60 characters"],
      },
      metaDescription: {
        type: String,
        maxLength: [160, "Meta description cannot exceed 160 characters"],
      },
      keywords: [
        {
          type: String,
          trim: true,
        },
      ],
      canonicalUrl: String,
    },

    // User interaction and analytics
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      likes: {
        type: Number,
        default: 0,
      },
      dislikes: {
        type: Number,
        default: 0,
      },
      bookmarks: {
        type: Number,
        default: 0,
      },
      shares: {
        type: Number,
        default: 0,
      },
      helpfulVotes: {
        type: Number,
        default: 0,
      },
      notHelpfulVotes: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      totalRatings: {
        type: Number,
        default: 0,
      },
      searchAppearances: {
        type: Number,
        default: 0,
      },
      clickThroughRate: {
        type: Number,
        default: 0,
      },
    },

    // User feedback and comments
    feedback: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          maxLength: [500, "Comment cannot exceed 500 characters"],
        },
        helpful: {
          type: Boolean,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        isVerified: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Version control
    version: {
      type: Number,
      default: 1,
    },
    versionHistory: [
      {
        version: Number,
        title: String,
        content: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
        },
        changeNote: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Publication and scheduling
    publishedAt: Date,
    scheduledAt: Date,
    expiresAt: Date,

    // Admin notes and moderation
    adminNotes: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        note: {
          type: String,
          required: true,
          maxLength: [1000, "Note cannot exceed 1000 characters"],
        },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
          required: true,
        },
        type: {
          type: String,
          enum: ["info", "warning", "important", "todo"],
          default: "info",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Search and indexing
    searchKeywords: [
      {
        type: String,
        trim: true,
      },
    ],
    language: {
      type: String,
      default: "en",
      maxLength: [5, "Language code cannot exceed 5 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Knowledge Base Category Schema
const knowledgeBaseCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      maxLength: [100, "Category name cannot exceed 100 characters"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxLength: [500, "Description cannot exceed 500 characters"],
      trim: true,
    },

    // Hierarchy
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KnowledgeBaseCategory",
    },
    level: {
      type: Number,
      min: 0,
      max: 3,
      default: 0,
    },

    // Display
    icon: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"],
    },
    order: {
      type: Number,
      default: 0,
    },

    // Content types allowed
    allowedContentTypes: [
      {
        type: String,
        enum: [
          "article",
          "faq",
          "tutorial",
          "guide",
          "troubleshooting",
          "video",
          "documentation",
        ],
      },
    ],

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Statistics
    statistics: {
      totalArticles: {
        type: Number,
        default: 0,
      },
      publishedArticles: {
        type: Number,
        default: 0,
      },
      totalViews: {
        type: Number,
        default: 0,
      },
      lastUpdated: Date,
    },

    // Management
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      required: true,
    },
    moderators: [
      {
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
        },
        permissions: [
          {
            type: String,
            enum: ["view", "create", "edit", "delete", "moderate"],
          },
        ],
        assignedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
knowledgeBaseSchema.index({ slug: 1 });
knowledgeBaseSchema.index({ status: 1, visibility: 1 });
knowledgeBaseSchema.index({ type: 1, category: 1 });
knowledgeBaseSchema.index({ featured: 1, order: 1 });
knowledgeBaseSchema.index({ "analytics.views": -1 });
knowledgeBaseSchema.index({ publishedAt: -1 });
knowledgeBaseSchema.index({ createdAt: -1 });

// Text search index
knowledgeBaseSchema.index({
  title: "text",
  content: "text",
  question: "text",
  answer: "text",
  tags: "text",
  searchKeywords: "text",
});

// Category indexes
knowledgeBaseCategorySchema.index({ slug: 1 });
knowledgeBaseCategorySchema.index({ parentCategory: 1, level: 1 });
knowledgeBaseCategorySchema.index({ isActive: 1, order: 1 });

// Virtual fields
knowledgeBaseSchema.virtual("helpfulnessRatio").get(function () {
  const total = this.analytics.helpfulVotes + this.analytics.notHelpfulVotes;
  if (total === 0) return 0;
  return (this.analytics.helpfulVotes / total) * 100;
});

knowledgeBaseSchema.virtual("engagementScore").get(function () {
  const views = this.analytics.views || 1;
  const interactions =
    this.analytics.likes + this.analytics.bookmarks + this.analytics.shares;
  return (interactions / views) * 100;
});

knowledgeBaseSchema.virtual("isPopular").get(function () {
  return this.analytics.views > 1000 || this.analytics.likes > 50;
});

// Pre-save middleware
knowledgeBaseSchema.pre("save", function (next) {
  // Generate slug if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Update version history
  if (this.isModified("content") && !this.isNew) {
    this.version += 1;
    this.versionHistory.push({
      version: this.version - 1,
      title: this.title,
      content: this.content,
      changedBy: this.lastEditedBy?.id,
      changeNote: `Updated version ${this.version}`,
    });
  }

  // Set published date
  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// Category pre-save middleware
knowledgeBaseCategorySchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

// Static methods
knowledgeBaseSchema.statics.getPopularArticles = async function (limit = 10) {
  return await this.find({
    status: "published",
    visibility: { $in: ["public", "members_only"] },
  })
    .sort({ "analytics.views": -1, "analytics.likes": -1 })
    .limit(limit)
    .populate("category", "name slug")
    .populate("author.id", "fullName");
};

knowledgeBaseSchema.statics.searchKnowledgeBase = async function (
  searchTerm,
  filters = {},
  options = {}
) {
  const searchQuery = {
    $text: { $search: searchTerm },
    status: "published",
    ...filters,
  };

  return await this.paginate(searchQuery, {
    ...options,
    sort: { score: { $meta: "textScore" } },
    populate: [
      { path: "category", select: "name slug" },
      { path: "author.id", select: "fullName" },
    ],
  });
};

knowledgeBaseSchema.statics.getRecentArticles = async function (limit = 10) {
  return await this.find({
    status: "published",
    visibility: { $in: ["public", "members_only"] },
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate("category", "name slug")
    .populate("author.id", "fullName");
};

knowledgeBaseSchema.statics.getFAQs = async function (category = null) {
  const query = {
    type: "faq",
    status: "published",
    visibility: { $in: ["public", "members_only"] },
  };

  if (category) {
    query.category = category;
  }

  return await this.find(query)
    .sort({ featured: -1, order: 1, "analytics.views": -1 })
    .populate("category", "name slug");
};

// Instance methods
knowledgeBaseSchema.methods.incrementView = function () {
  this.analytics.views += 1;
  this.analytics.searchAppearances += 1;
  return this.save();
};

knowledgeBaseSchema.methods.addRating = function (userId, rating, comment) {
  // Remove existing rating from same user
  this.feedback = this.feedback.filter(
    (f) => f.userId?.toString() !== userId.toString()
  );

  // Add new rating
  this.feedback.push({
    userId,
    rating,
    comment,
    submittedAt: new Date(),
  });

  // Recalculate average rating
  const ratings = this.feedback.filter((f) => f.rating);
  this.analytics.totalRatings = ratings.length;

  if (ratings.length > 0) {
    const sum = ratings.reduce((acc, f) => acc + f.rating, 0);
    this.analytics.averageRating = sum / ratings.length;
  }

  return this.save();
};

knowledgeBaseSchema.methods.markAsHelpful = function (helpful = true) {
  if (helpful) {
    this.analytics.helpfulVotes += 1;
  } else {
    this.analytics.notHelpfulVotes += 1;
  }
  return this.save();
};

knowledgeBaseSchema.methods.addAdminNote = function (
  note,
  authorId,
  type = "info"
) {
  this.adminNotes.push({
    note,
    author: authorId,
    type,
  });
  return this.save();
};

// Category static methods
knowledgeBaseCategorySchema.statics.getCategoryTree = async function () {
  const categories = await this.find({ isActive: true }).sort({ order: 1 });

  const buildTree = (parentId = null, level = 0) => {
    return categories
      .filter(
        (cat) =>
          (parentId === null && !cat.parentCategory) ||
          cat.parentCategory?.toString() === parentId?.toString()
      )
      .map((cat) => ({
        ...cat.toObject(),
        children: buildTree(cat._id, level + 1),
        level,
      }));
  };

  return buildTree();
};

knowledgeBaseCategorySchema.methods.updateStatistics = async function () {
  const KnowledgeBase = mongoose.model("KnowledgeBase");

  const stats = await KnowledgeBase.aggregate([
    { $match: { category: this._id } },
    {
      $group: {
        _id: null,
        totalArticles: { $sum: 1 },
        publishedArticles: {
          $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
        },
        totalViews: { $sum: "$analytics.views" },
      },
    },
  ]);

  if (stats[0]) {
    this.statistics = {
      ...stats[0],
      lastUpdated: new Date(),
    };
    await this.save();
  }
};

// Add pagination plugin
knowledgeBaseSchema.plugin(mongoosePaginate);
knowledgeBaseCategorySchema.plugin(mongoosePaginate);

const KnowledgeBase = mongoose.model("KnowledgeBase", knowledgeBaseSchema);
const KnowledgeBaseCategory = mongoose.model(
  "KnowledgeBaseCategory",
  knowledgeBaseCategorySchema
);

export { KnowledgeBase, KnowledgeBaseCategory };
export default KnowledgeBase;
