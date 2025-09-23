import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Please provide a valid email address",
      },
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["farmer", "advisor", "viewer"],
      default: "farmer",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "pending",
      required: true,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    phoneNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (phone) {
          // Basic phone validation - adjust regex as needed
          return (
            !phone ||
            /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ""))
          );
        },
        message: "Please provide a valid phone number",
      },
    },
    profilePicture: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },
    region: {
      type: String,
      required: [true, "Region is required"],
      trim: true,
    },
    language: {
      type: String,
      default: "en",
      required: true,
      validate: {
        validator: function (lang) {
          // ISO 639-1 codes validation (basic check)
          return /^[a-z]{2}$/.test(lang);
        },
        message: "Language must be a valid ISO 639-1 code (e.g., en, es, fr)",
      },
    },
    WeatherInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WeatherForecast",
    },
    farmAssets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FarmAsset",
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    refreshTokens: {
      type: [String],
      default: [],
      required: true,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.verificationToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.verificationToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ passwordResetExpires: 1 }, { expireAfterSeconds: 0 });
userSchema.index({ verificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index(
  {
    firstName: "text",
    lastName: "text",
    email: "text",
  },
  {
    name: "user_search_index",
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("passwordHash")) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcryptjs.genSalt(
      parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
    );
    this.passwordHash = await bcryptjs.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.passwordHash);
};

// Instance method to generate verification token
userSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  // Hash the token before storing (security best practice)
  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  return token; // Return unhashed token to send in email
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  // Hash the token before storing (security best practice)
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  return token; // Return unhashed token to send in email
};

// Instance method to clear password reset fields
userSchema.methods.clearPasswordReset = function () {
  this.passwordResetToken = null;
  this.passwordResetExpires = null;
};

// Instance method to verify email
userSchema.methods.verifyEmail = function () {
  this.isVerified = true;
  this.verificationToken = null;
};

// Instance method to add refresh token
userSchema.methods.addRefreshToken = function (token) {
  this.refreshTokens.push(token);
  // Keep only last 5 refresh tokens (security measure)
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

// Instance method to remove refresh token
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((t) => t !== token);
};

// Instance method to clear all refresh tokens
userSchema.methods.clearAllRefreshTokens = function () {
  this.refreshTokens = [];
};

// Static method to find user by verification token
userSchema.statics.findByVerificationToken = async function (token) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return await this.findOne({ verificationToken: hashedToken });
};

// Static method to find user by password reset token
userSchema.statics.findByPasswordResetToken = async function (token) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return await this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });
};

// Static method to get user statistics
userSchema.statics.getUserStatistics = async function () {
  const totalUsers = await this.countDocuments();
  const activeUsers = await this.countDocuments({ status: "active" });
  const inactiveUsers = await this.countDocuments({ status: "inactive" });
  const pendingUsers = await this.countDocuments({ status: "pending" });
  const suspendedUsers = await this.countDocuments({ status: "suspended" });

  const roleStats = await this.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  const roles = {};
  roleStats.forEach((stat) => {
    roles[stat._id] = stat.count;
  });

  return {
    totalUsers,
    usersByStatus: {
      active: activeUsers,
      inactive: inactiveUsers,
      pending: pendingUsers,
      suspended: suspendedUsers,
    },
    usersByRole: roles,
  };
};

// Static method to search users with filters and pagination
userSchema.statics.searchUsers = async function (filters = {}, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    search = "",
    role = "",
    status = "",
  } = options;

  const query = {};

  // Add search functionality
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  // Add role filter
  if (role) {
    query.role = role;
  }

  // Add status filter
  if (status) {
    query.status = status;
  }

  // Add custom filters
  Object.assign(query, filters);

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [users, total] = await Promise.all([
    this.find(query)
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit,
    },
  };
};

// Instance method to approve user
userSchema.methods.approveUser = function (approvedByUserId) {
  this.status = "active";
  this.approvedBy = approvedByUserId;
  this.approvedAt = new Date();
  this.rejectedBy = null;
  this.rejectedAt = null;
  this.rejectionReason = null;
};

// Instance method to reject user
userSchema.methods.rejectUser = function (rejectedByUserId, reason = "") {
  this.status = "inactive";
  this.rejectedBy = rejectedByUserId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.approvedBy = null;
  this.approvedAt = null;
};

// Instance method to suspend user
userSchema.methods.suspendUser = function (suspendedByUserId, reason = "") {
  this.status = "suspended";
  this.rejectedBy = suspendedByUserId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
};

// Instance method to reactivate user
userSchema.methods.reactivateUser = function (reactivatedByUserId) {
  this.status = "active";
  this.approvedBy = reactivatedByUserId;
  this.approvedAt = new Date();
  this.rejectedBy = null;
  this.rejectedAt = null;
  this.rejectionReason = null;
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
};

const User = mongoose.model("User", userSchema);

export default User;
