import mongoose from "mongoose";

const contentCategorySchema = new mongoose.Schema(
  {
    // Basic Category Information
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // Category Hierarchy
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContentCategory",
      default: null,
    },
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ContentCategory",
      },
    ],
    level: {
      type: Number,
      default: 0, // 0 = root, 1 = subcategory, 2 = sub-subcategory
      min: 0,
      max: 3,
    },
    path: {
      type: String, // Full category path like "Agriculture > Crops > Vegetables"
      trim: true,
    },

    // Category Settings
    isActive: {
      type: Boolean,
      default: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },

    // Content Type Restrictions
    allowedContentTypes: [
      {
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
      },
    ],
    defaultContentType: {
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
    },

    // Visual and Branding
    icon: {
      type: String, // Icon class or URL
    },
    color: {
      type: String, // Hex color code
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    },
    image: {
      url: String,
      alt: String,
    },
    banner: {
      url: String,
      alt: String,
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
    },

    // Category Statistics
    stats: {
      totalContent: {
        type: Number,
        default: 0,
      },
      publishedContent: {
        type: Number,
        default: 0,
      },
      totalViews: {
        type: Number,
        default: 0,
      },
      averageEngagement: {
        type: Number,
        default: 0,
      },
      lastContentAdded: Date,
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // Access Control
    permissions: {
      viewLevel: {
        type: String,
        enum: ["public", "members", "premium", "admin"],
        default: "public",
      },
      createLevel: {
        type: String,
        enum: ["admin", "editor", "author"],
        default: "admin",
      },
      editLevel: {
        type: String,
        enum: ["admin", "editor", "author"],
        default: "admin",
      },
    },

    // Category Management
    moderators: [
      {
        moderator: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
        },
        role: {
          type: String,
          enum: ["moderator", "editor"],
          default: "moderator",
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Workflow Settings
    workflow: {
      requiresApproval: {
        type: Boolean,
        default: false,
      },
      autoPublish: {
        type: Boolean,
        default: false,
      },
      defaultStatus: {
        type: String,
        enum: ["draft", "published", "review"],
        default: "draft",
      },
    },

    // Category Rules and Guidelines
    rules: {
      maxContentLength: {
        type: Number,
        default: 50000, // characters
      },
      minContentLength: {
        type: Number,
        default: 100,
      },
      allowedFileTypes: [
        {
          type: String,
        },
      ],
      maxFileSize: {
        type: Number,
        default: 10485760, // 10MB in bytes
      },
      requireFeaturedImage: {
        type: Boolean,
        default: false,
      },
      allowComments: {
        type: Boolean,
        default: true,
      },
      allowSharing: {
        type: Boolean,
        default: true,
      },
    },

    // Templates and Defaults
    contentTemplate: {
      type: String, // HTML template for content in this category
    },
    defaultTags: [
      {
        type: String,
        trim: true,
      },
    ],
    suggestedTags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Admin Information
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
    },
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
      },
    ],
  },
  {
    timestamps: true,
    collection: "contentcategories",
  }
);

// Indexes
contentCategorySchema.index({ name: 1 });
contentCategorySchema.index({ slug: 1 }, { unique: true });
contentCategorySchema.index({ parentCategory: 1 });
contentCategorySchema.index({ level: 1, sortOrder: 1 });
contentCategorySchema.index({ isActive: 1, isVisible: 1 });
contentCategorySchema.index({ featured: 1, sortOrder: 1 });
contentCategorySchema.index({ "stats.totalContent": -1 });

// Pre-save middleware to generate slug
contentCategorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

// Pre-save middleware to update path and level
contentCategorySchema.pre("save", async function (next) {
  if (this.isModified("parentCategory") || this.isNew) {
    if (this.parentCategory) {
      const parent = await this.constructor.findById(this.parentCategory);
      if (parent) {
        this.level = parent.level + 1;
        this.path = parent.path ? `${parent.path} > ${this.name}` : this.name;
      }
    } else {
      this.level = 0;
      this.path = this.name;
    }
  }
  next();
});

// Method to update statistics
contentCategorySchema.methods.updateStats = async function () {
  const Content = mongoose.model("Content");

  const stats = await Content.aggregate([
    {
      $match: { category: this.name },
    },
    {
      $group: {
        _id: null,
        totalContent: { $sum: 1 },
        publishedContent: {
          $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
        },
        totalViews: { $sum: "$analytics.views" },
        averageEngagement: { $avg: "$analytics.engagementScore" },
        lastContentAdded: { $max: "$createdAt" },
      },
    },
  ]);

  if (stats.length > 0) {
    const stat = stats[0];
    this.stats.totalContent = stat.totalContent || 0;
    this.stats.publishedContent = stat.publishedContent || 0;
    this.stats.totalViews = stat.totalViews || 0;
    this.stats.averageEngagement = stat.averageEngagement || 0;
    this.stats.lastContentAdded = stat.lastContentAdded;
    this.stats.lastUpdated = new Date();
  }

  return this.save();
};

// Method to add subcategory
contentCategorySchema.methods.addSubcategory = function (subcategoryId) {
  if (!this.subcategories.includes(subcategoryId)) {
    this.subcategories.push(subcategoryId);
  }
  return this.save();
};

// Method to remove subcategory
contentCategorySchema.methods.removeSubcategory = function (subcategoryId) {
  this.subcategories = this.subcategories.filter(
    (id) => id.toString() !== subcategoryId.toString()
  );
  return this.save();
};

// Method to get full category tree
contentCategorySchema.methods.getCategoryTree = async function () {
  const populateSubcategories = async (category) => {
    await category.populate("subcategories");
    for (let subcategory of category.subcategories) {
      await populateSubcategories(subcategory);
    }
    return category;
  };

  return await populateSubcategories(this);
};

// Static method to get category hierarchy
contentCategorySchema.statics.getCategoryHierarchy = async function () {
  const rootCategories = await this.find({ parentCategory: null })
    .sort({ sortOrder: 1, name: 1 })
    .populate({
      path: "subcategories",
      populate: {
        path: "subcategories",
        populate: {
          path: "subcategories",
        },
      },
    });

  return rootCategories;
};

// Static method to get categories by content type
contentCategorySchema.statics.getCategoriesByContentType = async function (
  contentType
) {
  return await this.find({
    $or: [
      { allowedContentTypes: contentType },
      { allowedContentTypes: { $size: 0 } }, // Categories with no restrictions
      { defaultContentType: contentType },
    ],
    isActive: true,
    isVisible: true,
  }).sort({ sortOrder: 1, name: 1 });
};

// Static method to search categories
contentCategorySchema.statics.searchCategories = async function (query) {
  return await this.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { path: { $regex: query, $options: "i" } },
    ],
    isActive: true,
    isVisible: true,
  }).sort({ "stats.totalContent": -1, name: 1 });
};

// Virtual for category URL
contentCategorySchema.virtual("url").get(function () {
  return `/category/${this.slug}`;
});

// Virtual for subcategory count
contentCategorySchema.virtual("subcategoryCount").get(function () {
  return this.subcategories.length;
});

// Export the model
const ContentCategory = mongoose.model(
  "ContentCategory",
  contentCategorySchema
);

export default ContentCategory;
