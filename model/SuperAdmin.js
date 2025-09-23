import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import crypto from "crypto";

const superAdminSchema = new mongoose.Schema(
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
      enum: ["superadmin", "admin"],
      default: "admin",
      required: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    phoneNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (phone) {
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
    department: {
      type: String,
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      maxlength: [20, "Employee ID cannot exceed 20 characters"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      required: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
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
    // Admin-specific permissions
    permissions: {
      userManagement: {
        type: Boolean,
        default: true,
      },
      roleManagement: {
        type: Boolean,
        default: false, // Only superadmin by default
      },
      systemSettings: {
        type: Boolean,
        default: false, // Only superadmin by default
      },
      analytics: {
        type: Boolean,
        default: true,
      },
      bulkOperations: {
        type: Boolean,
        default: true,
      },
    },
    // Audit fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      default: null,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
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
        delete ret.loginAttempts;
        delete ret.lockUntil;
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
        delete ret.loginAttempts;
        delete ret.lockUntil;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
superAdminSchema.index({ email: 1 }, { unique: true });
superAdminSchema.index({ employeeId: 1 }, { unique: true, sparse: true });
superAdminSchema.index({ role: 1 });
superAdminSchema.index({ status: 1 });
superAdminSchema.index({ createdAt: -1 });
superAdminSchema.index({ lastLogin: -1 });
superAdminSchema.index(
  {
    firstName: "text",
    lastName: "text",
    email: "text",
    employeeId: "text",
  },
  {
    name: "superadmin_search_index",
  }
);

// Virtual for full name
superAdminSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account locked status
superAdminSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
superAdminSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();

  try {
    const salt = await bcryptjs.genSalt(
      parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
    );
    this.passwordHash = await bcryptjs.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Set permissions based on role
superAdminSchema.pre("save", function (next) {
  if (this.isModified("role")) {
    if (this.role === "superadmin") {
      this.permissions = {
        userManagement: true,
        roleManagement: true,
        systemSettings: true,
        analytics: true,
        bulkOperations: true,
      };
    } else if (this.role === "admin") {
      this.permissions = {
        userManagement: true,
        roleManagement: false,
        systemSettings: false,
        analytics: true,
        bulkOperations: true,
      };
    }
  }
  next();
});

// Instance method to check password
superAdminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.passwordHash);
};

// Instance method to handle login attempts and locking
superAdminSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes

  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
superAdminSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

// Instance method to generate verification token
superAdminSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  return token;
};

// Instance method to generate password reset token
superAdminSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

// Instance method to clear password reset fields
superAdminSchema.methods.clearPasswordReset = function () {
  this.passwordResetToken = null;
  this.passwordResetExpires = null;
};

// Instance method to verify email
superAdminSchema.methods.verifyEmail = function () {
  this.isVerified = true;
  this.verificationToken = null;
};

// Instance method to add refresh token
superAdminSchema.methods.addRefreshToken = function (token) {
  this.refreshTokens.push(token);
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

// Instance method to remove refresh token
superAdminSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((t) => t !== token);
};

// Instance method to clear all refresh tokens
superAdminSchema.methods.clearAllRefreshTokens = function () {
  this.refreshTokens = [];
};

// Instance method to update last login
superAdminSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
};

// Instance method to check permission
superAdminSchema.methods.hasPermission = function (permission) {
  return this.permissions[permission] === true;
};

// Static method to find by verification token
superAdminSchema.statics.findByVerificationToken = async function (token) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return await this.findOne({ verificationToken: hashedToken });
};

// Static method to find by password reset token
superAdminSchema.statics.findByPasswordResetToken = async function (token) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return await this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });
};

// Static method to get admin statistics
superAdminSchema.statics.getAdminStatistics = async function () {
  const totalAdmins = await this.countDocuments();
  const activeAdmins = await this.countDocuments({ status: "active" });
  const inactiveAdmins = await this.countDocuments({ status: "inactive" });
  const suspendedAdmins = await this.countDocuments({ status: "suspended" });

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
    totalAdmins,
    adminsByStatus: {
      active: activeAdmins,
      inactive: inactiveAdmins,
      suspended: suspendedAdmins,
    },
    adminsByRole: roles,
  };
};

// Static method to search admins
superAdminSchema.statics.searchAdmins = async function (
  filters = {},
  options = {}
) {
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

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { employeeId: { $regex: search, $options: "i" } },
    ];
  }

  if (role) query.role = role;
  if (status) query.status = status;

  Object.assign(query, filters);

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [admins, total] = await Promise.all([
    this.find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("lastModifiedBy", "firstName lastName email")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    admins,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit,
    },
  };
};

const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);

export default SuperAdmin;
