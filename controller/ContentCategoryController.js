import ContentCategory from "../model/ContentCategory.js";
import Content from "../model/Content.js";
import SuperAdmin from "../model/SuperAdmin.js";

// Get all categories with hierarchy
export const getAllCategories = async (req, res) => {
  try {
    const {
      includeInactive = false,
      contentType,
      level,
      search,
      page = 1,
      limit = 50,
      sortBy = "sortOrder",
      sortOrder = "asc",
    } = req.query;

    // Build filters
    const filters = {};

    if (!includeInactive) {
      filters.isActive = true;
      filters.isVisible = true;
    }

    if (contentType) {
      filters.$or = [
        { allowedContentTypes: contentType },
        { allowedContentTypes: { $size: 0 } },
        { defaultContentType: contentType },
      ];
    }

    if (level !== undefined) {
      filters.level = parseInt(level);
    }

    // Handle search
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { path: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [categories, total] = await Promise.all([
      ContentCategory.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("parentCategory", "name slug")
        .populate("subcategories", "name slug")
        .populate("createdBy", "fullName email")
        .populate("lastModifiedBy", "fullName email"),
      ContentCategory.countDocuments(filters),
    ]);

    res.status(200).json({
      success: true,
      data: {
        categories,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
      filters: { includeInactive, contentType, level, search },
    });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve categories",
      error: error.message,
    });
  }
};

// Get category hierarchy (tree structure)
export const getCategoryHierarchy = async (req, res) => {
  try {
    const hierarchy = await ContentCategory.getCategoryHierarchy();

    res.status(200).json({
      success: true,
      data: { hierarchy },
    });
  } catch (error) {
    console.error("Error getting category hierarchy:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve category hierarchy",
      error: error.message,
    });
  }
};

// Get single category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await ContentCategory.findById(categoryId)
      .populate("parentCategory", "name slug path")
      .populate("subcategories", "name slug description stats")
      .populate("createdBy", "fullName email")
      .populate("lastModifiedBy", "fullName email")
      .populate("moderators.moderator", "fullName email");

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Get content count for this category
    const contentCount = await Content.countDocuments({
      category: category.name,
      status: "published",
    });

    res.status(200).json({
      success: true,
      data: {
        category: {
          ...category.toObject(),
          currentContentCount: contentCount,
        },
      },
    });
  } catch (error) {
    console.error("Error getting category by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve category",
      error: error.message,
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      parentCategory,
      allowedContentTypes,
      defaultContentType,
      isActive = true,
      isVisible = true,
      sortOrder = 0,
      featured = false,
      icon,
      color,
      image,
      banner,
      seo,
      permissions,
      workflow,
      rules,
      contentTemplate,
      defaultTags,
      suggestedTags,
    } = req.body;

    const adminId = req.admin.id;

    // Check if category name already exists
    const existingCategory = await ContentCategory.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Validate parent category if provided
    let parentCategoryDoc = null;
    if (parentCategory) {
      parentCategoryDoc = await ContentCategory.findById(parentCategory);
      if (!parentCategoryDoc) {
        return res.status(400).json({
          success: false,
          message: "Parent category not found",
        });
      }

      // Check depth limit (max 3 levels)
      if (parentCategoryDoc.level >= 2) {
        return res.status(400).json({
          success: false,
          message: "Maximum category depth (3 levels) exceeded",
        });
      }
    }

    const newCategory = new ContentCategory({
      name,
      description,
      parentCategory,
      allowedContentTypes,
      defaultContentType,
      isActive,
      isVisible,
      sortOrder,
      featured,
      icon,
      color,
      image,
      banner,
      seo,
      permissions,
      workflow,
      rules,
      contentTemplate,
      defaultTags,
      suggestedTags,
      createdBy: adminId,
    });

    await newCategory.save();

    // Update parent category's subcategories if applicable
    if (parentCategoryDoc) {
      await parentCategoryDoc.addSubcategory(newCategory._id);
    }

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { category: newCategory },
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

// Update existing category
export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const updateData = req.body;
    const adminId = req.admin.id;

    const category = await ContentCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if name change conflicts with existing category
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await ContentCategory.findOne({
        name: updateData.name,
        _id: { $ne: categoryId },
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        });
      }
    }

    // Handle parent category change
    if (
      updateData.parentCategory &&
      updateData.parentCategory !== category.parentCategory?.toString()
    ) {
      // Remove from old parent
      if (category.parentCategory) {
        const oldParent = await ContentCategory.findById(
          category.parentCategory
        );
        if (oldParent) {
          await oldParent.removeSubcategory(categoryId);
        }
      }

      // Add to new parent
      if (updateData.parentCategory) {
        const newParent = await ContentCategory.findById(
          updateData.parentCategory
        );
        if (!newParent) {
          return res.status(400).json({
            success: false,
            message: "New parent category not found",
          });
        }

        // Check depth limit
        if (newParent.level >= 2) {
          return res.status(400).json({
            success: false,
            message: "Maximum category depth (3 levels) exceeded",
          });
        }

        await newParent.addSubcategory(categoryId);
      }
    }

    // Update category fields
    Object.keys(updateData).forEach((key) => {
      if (
        key !== "_id" &&
        key !== "createdAt" &&
        key !== "updatedAt" &&
        key !== "createdBy"
      ) {
        category[key] = updateData[key];
      }
    });

    category.lastModifiedBy = adminId;

    await category.save();

    // Update content if category name changed
    if (updateData.name && updateData.name !== category.name) {
      await Content.updateMany(
        { category: category.name },
        { category: updateData.name }
      );
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: { category },
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { confirmDelete, moveContentTo } = req.body;

    if (!confirmDelete) {
      return res.status(400).json({
        success: false,
        message: "Please confirm deletion by setting confirmDelete to true",
      });
    }

    const category = await ContentCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check for subcategories
    if (category.subcategories.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete category with subcategories. Please delete or move subcategories first.",
      });
    }

    // Check for content in this category
    const contentCount = await Content.countDocuments({
      category: category.name,
    });

    if (contentCount > 0) {
      if (!moveContentTo) {
        return res.status(400).json({
          success: false,
          message: `Category contains ${contentCount} content items. Specify moveContentTo or delete content first.`,
        });
      }

      // Validate target category
      const targetCategory = await ContentCategory.findById(moveContentTo);
      if (!targetCategory) {
        return res.status(400).json({
          success: false,
          message: "Target category for content migration not found",
        });
      }

      // Move content to target category
      await Content.updateMany(
        { category: category.name },
        { category: targetCategory.name }
      );

      // Update target category stats
      await targetCategory.updateStats();
    }

    // Remove from parent category if applicable
    if (category.parentCategory) {
      const parentCategory = await ContentCategory.findById(
        category.parentCategory
      );
      if (parentCategory) {
        await parentCategory.removeSubcategory(categoryId);
      }
    }

    // Store category data before deletion
    const deletedCategoryData = {
      name: category.name,
      contentMoved: contentCount,
      movedTo: moveContentTo
        ? (await ContentCategory.findById(moveContentTo))?.name
        : null,
      deletedAt: new Date(),
      deletedBy: req.admin.fullName,
    };

    await ContentCategory.findByIdAndDelete(categoryId);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: deletedCategoryData,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

// Update category statistics
export const updateCategoryStats = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await ContentCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await category.updateStats();

    res.status(200).json({
      success: true,
      message: "Category statistics updated successfully",
      data: {
        category: {
          name: category.name,
          stats: category.stats,
        },
      },
    });
  } catch (error) {
    console.error("Error updating category stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category statistics",
      error: error.message,
    });
  }
};

// Get categories by content type
export const getCategoriesByContentType = async (req, res) => {
  try {
    const { contentType } = req.params;

    const validContentTypes = [
      "blog_post",
      "news",
      "announcement",
      "tutorial",
      "guide",
      "video",
      "resource",
    ];

    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid content type. Valid types: ${validContentTypes.join(
          ", "
        )}`,
      });
    }

    const categories = await ContentCategory.getCategoriesByContentType(
      contentType
    );

    res.status(200).json({
      success: true,
      data: { categories, contentType },
    });
  } catch (error) {
    console.error("Error getting categories by content type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve categories",
      error: error.message,
    });
  }
};

// Search categories
export const searchCategories = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const categories = await ContentCategory.searchCategories(query);

    res.status(200).json({
      success: true,
      data: { categories, query },
    });
  } catch (error) {
    console.error("Error searching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search categories",
      error: error.message,
    });
  }
};

// Toggle category featured status
export const toggleCategoryFeatured = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { featured } = req.body;

    const category = await ContentCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.featured = featured !== undefined ? featured : !category.featured;
    category.lastModifiedBy = req.admin.id;

    await category.save();

    res.status(200).json({
      success: true,
      message: `Category ${
        category.featured ? "featured" : "unfeatured"
      } successfully`,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          featured: category.featured,
        },
      },
    });
  } catch (error) {
    console.error("Error toggling category featured status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category featured status",
      error: error.message,
    });
  }
};

// Toggle category active status
export const toggleCategoryActive = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { isActive } = req.body;

    const category = await ContentCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if category has content before deactivating
    if (isActive === false) {
      const contentCount = await Content.countDocuments({
        category: category.name,
        status: "published",
      });

      if (contentCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot deactivate category with ${contentCount} published content items`,
        });
      }
    }

    category.isActive = isActive !== undefined ? isActive : !category.isActive;
    category.lastModifiedBy = req.admin.id;

    await category.save();

    res.status(200).json({
      success: true,
      message: `Category ${
        category.isActive ? "activated" : "deactivated"
      } successfully`,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          isActive: category.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Error toggling category active status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category active status",
      error: error.message,
    });
  }
};

// Add moderator to category
export const addCategoryModerator = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { moderatorId, role = "moderator" } = req.body;

    const category = await ContentCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Verify moderator exists
    const moderator = await SuperAdmin.findById(moderatorId);
    if (!moderator) {
      return res.status(400).json({
        success: false,
        message: "Moderator not found",
      });
    }

    // Check if already a moderator
    const existingModerator = category.moderators.find(
      (mod) => mod.moderator.toString() === moderatorId
    );

    if (existingModerator) {
      return res.status(400).json({
        success: false,
        message: "User is already a moderator for this category",
      });
    }

    category.moderators.push({
      moderator: moderatorId,
      role,
    });

    category.lastModifiedBy = req.admin.id;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Moderator added successfully",
      data: {
        category: category.name,
        moderator: {
          id: moderatorId,
          name: moderator.fullName,
          role,
        },
      },
    });
  } catch (error) {
    console.error("Error adding category moderator:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add category moderator",
      error: error.message,
    });
  }
};

// Remove moderator from category
export const removeCategoryModerator = async (req, res) => {
  try {
    const { categoryId, moderatorId } = req.params;

    const category = await ContentCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const moderatorIndex = category.moderators.findIndex(
      (mod) => mod.moderator.toString() === moderatorId
    );

    if (moderatorIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "User is not a moderator for this category",
      });
    }

    category.moderators.splice(moderatorIndex, 1);
    category.lastModifiedBy = req.admin.id;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Moderator removed successfully",
      data: {
        category: category.name,
        removedModerator: moderatorId,
      },
    });
  } catch (error) {
    console.error("Error removing category moderator:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove category moderator",
      error: error.message,
    });
  }
};

// Get Categories by Type (alias for getCategoriesByContentType for consistency with router)
export const getCategoriesByType = async (req, res) => {
  try {
    const { contentType } = req.params;

    const validContentTypes = [
      "blog_post",
      "news",
      "announcement",
      "tutorial",
      "guide",
      "video",
      "resource",
    ];

    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid content type. Valid types: ${validContentTypes.join(
          ", "
        )}`,
      });
    }

    const categories = await ContentCategory.find({
      $or: [
        { allowedContentTypes: contentType },
        { allowedContentTypes: { $size: 0 } }, // Categories that allow all content types
        { defaultContentType: contentType },
      ],
      isActive: true,
      isVisible: true,
    })
      .populate("parentCategory", "name slug")
      .populate("moderators.admin", "fullName email")
      .sort({ sortOrder: 1 });

    res.status(200).json({
      success: true,
      data: { categories, contentType },
    });
  } catch (error) {
    console.error("Error getting categories by type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve categories",
      error: error.message,
    });
  }
};

// Get Category Statistics
export const getCategoryStats = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await ContentCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Get content statistics for this category
    const contentStats = await Content.aggregate([
      { $match: { category: category._id } },
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
          archivedContent: {
            $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] },
          },
          totalViews: { $sum: "$analytics.views" },
          totalLikes: { $sum: "$analytics.likes" },
          totalShares: { $sum: "$analytics.shares" },
          averageEngagement: { $avg: "$analytics.engagementScore" },
        },
      },
    ]);

    // Get content by type within this category
    const contentByType = await Content.aggregate([
      { $match: { category: category._id } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          avgViews: { $avg: "$analytics.views" },
          avgEngagement: { $avg: "$analytics.engagementScore" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get top performing content in this category
    const topContent = await Content.find({ category: category._id })
      .sort({ "analytics.engagementScore": -1 })
      .limit(5)
      .select("title slug type analytics publishedAt")
      .populate("author.id", "fullName");

    const stats = {
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
        level: category.level,
        contentCount: category.statistics.contentCount,
        lastContentDate: category.statistics.lastContentDate,
      },
      content: contentStats[0] || {
        totalContent: 0,
        publishedContent: 0,
        draftContent: 0,
        archivedContent: 0,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        averageEngagement: 0,
      },
      contentByType,
      topContent,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting category statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve category statistics",
      error: error.message,
    });
  }
};

// Update Category Order
export const updateCategoryOrder = async (req, res) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Categories array is required",
      });
    }

    // Validate that all provided categories exist
    const categoryIds = categories.map((cat) => cat.id);
    const existingCategories = await ContentCategory.find({
      _id: { $in: categoryIds },
    });

    if (existingCategories.length !== categoryIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more categories not found",
      });
    }

    // Update sort order for each category
    const updatePromises = categories.map((cat, index) =>
      ContentCategory.findByIdAndUpdate(
        cat.id,
        {
          sortOrder: cat.sortOrder || index + 1,
          updatedAt: new Date(),
          "modificationHistory.lastModifiedBy": req.admin.id,
        },
        { new: true }
      )
    );

    const updatedCategories = await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Category order updated successfully",
      data: { categories: updatedCategories },
    });
  } catch (error) {
    console.error("Error updating category order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category order",
      error: error.message,
    });
  }
};
