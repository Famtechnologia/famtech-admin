import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  SecurityEvent,
  DataPrivacyConsent,
  ComplianceAudit,
  EncryptionKey,
} from "../model/Security.js";
import User from "../model/User.js";
import SuperAdmin from "../model/SuperAdmin.js";

// Security Dashboard and Monitoring
export const getSecurityDashboard = async (req, res) => {
  try {
    const timeframe = parseInt(req.query.timeframe) || 30; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    // Get security metrics
    const securityMetrics = await SecurityEvent.getSecurityMetrics(timeframe);

    // Get recent high-risk events
    const recentHighRiskEvents = await SecurityEvent.find({
      timestamp: { $gte: startDate },
      $or: [
        { severity: { $in: ["high", "critical"] } },
        { riskScore: { $gte: 70 } },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate("userId", "name email")
      .populate("adminId", "name email");

    // Get compliance status
    const complianceStatus = await ComplianceAudit.aggregate([
      {
        $group: {
          _id: "$regulation",
          totalAudits: { $sum: 1 },
          completedAudits: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          openFindings: {
            $sum: {
              $size: {
                $filter: {
                  input: "$findings",
                  cond: { $eq: ["$$this.status", "open"] },
                },
              },
            },
          },
          criticalFindings: {
            $sum: {
              $size: {
                $filter: {
                  input: "$findings",
                  as: "finding",
                  cond: { $eq: ["$$finding.category", "critical"] },
                },
              },
            },
          },
          avgComplianceScore: { $avg: "$complianceScore.overall" },
        },
      },
    ]);

    // Get active encryption keys
    const activeKeys = await EncryptionKey.countDocuments({ status: "active" });
    const keysNearExpiry = await EncryptionKey.countDocuments({
      status: "active",
      expiresAt: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30 days
    });

    // Get data privacy metrics
    const privacyMetrics = await DataPrivacyConsent.aggregate([
      {
        $group: {
          _id: null,
          totalConsents: { $sum: 1 },
          pendingRequests: {
            $sum: {
              $size: {
                $filter: {
                  input: "$dataSubjectRights",
                  cond: { $eq: ["$$this.status", "pending"] },
                },
              },
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        securityMetrics,
        recentHighRiskEvents,
        complianceStatus,
        encryptionStatus: {
          activeKeys,
          keysNearExpiry,
        },
        privacyMetrics: privacyMetrics[0] || {
          totalConsents: 0,
          pendingRequests: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error getting security dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve security dashboard",
      error: error.message,
    });
  }
};

// Security Event Management
export const getSecurityEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const eventType = req.query.eventType;
    const severity = req.query.severity;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const investigated = req.query.investigated;

    const filter = {};

    if (eventType) filter.eventType = eventType;
    if (severity) filter.severity = severity;
    if (investigated !== undefined)
      filter.investigated = investigated === "true";

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const options = {
      page,
      limit,
      sort: { timestamp: -1 },
      populate: [
        { path: "userId", select: "name email" },
        { path: "adminId", select: "name email" },
        { path: "investigatedBy", select: "name email" },
      ],
    };

    const events = await SecurityEvent.paginate(filter, options);

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error getting security events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve security events",
      error: error.message,
    });
  }
};

export const investigateSecurityEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { investigationNotes, resolved, resolution } = req.body;

    const event = await SecurityEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Security event not found",
      });
    }

    event.investigated = true;
    event.investigatedBy = req.admin.id;
    event.investigatedAt = new Date();
    if (investigationNotes) event.investigationNotes = investigationNotes;

    if (resolved !== undefined) {
      event.resolved = resolved;
      if (resolved && resolution) {
        event.resolution = resolution;
      }
    }

    await event.save();

    // Log the investigation activity
    await SecurityEvent.logEvent({
      eventType: "audit_log_access",
      adminId: req.admin.id,
      userType: "admin",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      resource: `security_event_${eventId}`,
      action: "investigate",
      description: `Security event investigated by ${req.admin.name}`,
      metadata: { originalEventId: eventId },
    });

    res.status(200).json({
      success: true,
      message: "Security event investigation updated",
      data: event,
    });
  } catch (error) {
    console.error("Error investigating security event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update investigation",
      error: error.message,
    });
  }
};

// Authentication and Authorization Management
export const updatePasswordPolicy = async (req, res) => {
  try {
    const {
      minLength,
      requireUppercase,
      requireLowercase,
      requireNumbers,
      requireSpecialChars,
      maxAge,
      preventReuse,
      lockoutThreshold,
      lockoutDuration,
    } = req.body;

    // In a real application, this would update system configuration
    const passwordPolicy = {
      minLength: minLength || 8,
      requireUppercase: requireUppercase || true,
      requireLowercase: requireLowercase || true,
      requireNumbers: requireNumbers || true,
      requireSpecialChars: requireSpecialChars || true,
      maxAge: maxAge || 90, // days
      preventReuse: preventReuse || 5, // last N passwords
      lockoutThreshold: lockoutThreshold || 5, // failed attempts
      lockoutDuration: lockoutDuration || 30, // minutes
    };

    // Log the policy change
    await SecurityEvent.logEvent({
      eventType: "system_configuration_change",
      adminId: req.admin.id,
      userType: "admin",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      resource: "password_policy",
      action: "update",
      description: "Password policy updated",
      metadata: { newPolicy: passwordPolicy },
    });

    res.status(200).json({
      success: true,
      message: "Password policy updated successfully",
      data: passwordPolicy,
    });
  } catch (error) {
    console.error("Error updating password policy:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update password policy",
      error: error.message,
    });
  }
};

export const forcePasswordReset = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User IDs array is required",
      });
    }

    const updatePromises = userIds.map(async (userId) => {
      // Update both User and SuperAdmin collections
      const userUpdate = User.findByIdAndUpdate(userId, {
        mustChangePassword: true,
        passwordChangeRequired: true,
        passwordResetToken: crypto.randomBytes(32).toString("hex"),
        passwordResetExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      const adminUpdate = SuperAdmin.findByIdAndUpdate(userId, {
        mustChangePassword: true,
        passwordChangeRequired: true,
        passwordResetToken: crypto.randomBytes(32).toString("hex"),
        passwordResetExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await Promise.allSettled([userUpdate, adminUpdate]);

      // Log the forced reset
      await SecurityEvent.logEvent({
        eventType: "password_reset_request",
        adminId: req.admin.id,
        userId: userId,
        userType: "admin",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        resource: `user_${userId}`,
        action: "force_password_reset",
        description: `Forced password reset by admin ${req.admin.name}`,
      });
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Forced password reset for ${userIds.length} users`,
      data: { affectedUsers: userIds.length },
    });
  } catch (error) {
    console.error("Error forcing password reset:", error);
    res.status(500).json({
      success: false,
      message: "Failed to force password reset",
      error: error.message,
    });
  }
};

// Data Privacy and Consent Management
export const getDataPrivacyOverview = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const options = {
      page,
      limit,
      sort: { updatedAt: -1 },
      populate: { path: "userId", select: "name email" },
    };

    const consents = await DataPrivacyConsent.paginate({}, options);

    // Get summary statistics
    const stats = await DataPrivacyConsent.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          pendingRequests: {
            $sum: {
              $size: {
                $filter: {
                  input: "$dataSubjectRights",
                  cond: { $eq: ["$$this.status", "pending"] },
                },
              },
            },
          },
          completedRequests: {
            $sum: {
              $size: {
                $filter: {
                  input: "$dataSubjectRights",
                  cond: { $eq: ["$$this.status", "completed"] },
                },
              },
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        consents,
        statistics: stats[0] || {
          totalUsers: 0,
          pendingRequests: 0,
          completedRequests: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error getting data privacy overview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve data privacy overview",
      error: error.message,
    });
  }
};

export const processDataSubjectRequest = async (req, res) => {
  try {
    const { userId, requestType } = req.params;
    const { notes, attachments } = req.body;

    const consent = await DataPrivacyConsent.findOne({ userId });
    if (!consent) {
      return res.status(404).json({
        success: false,
        message: "Data privacy consent record not found",
      });
    }

    const request = consent.dataSubjectRights.find(
      (r) => r.requestType === requestType && r.status === "pending"
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Pending request not found",
      });
    }

    request.status = "completed";
    request.handledBy = req.admin.id;
    request.completedAt = new Date();
    if (notes) request.notes = notes;
    if (attachments) request.attachments = attachments;

    await consent.save();

    // Log the processing
    await SecurityEvent.logEvent({
      eventType: "data_access",
      adminId: req.admin.id,
      userId: userId,
      userType: "admin",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      resource: `data_subject_request_${requestType}`,
      action: "process_request",
      description: `Data subject request processed: ${requestType}`,
      metadata: { requestType, handledBy: req.admin.name },
    });

    res.status(200).json({
      success: true,
      message: "Data subject request processed successfully",
      data: request,
    });
  } catch (error) {
    console.error("Error processing data subject request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process data subject request",
      error: error.message,
    });
  }
};

export const exportUserData = async (req, res) => {
  try {
    const { userId } = req.params;
    const { format } = req.query; // json, csv, pdf

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Collect all user data from various collections
    const userData = {
      profile: user,
      consents: await DataPrivacyConsent.findOne({ userId }),
      // Add other user-related data from other collections
      // tickets, reviews, subscriptions, etc.
    };

    // Remove sensitive data
    delete userData.profile.password;
    delete userData.profile.resetToken;

    // Log the data export
    await SecurityEvent.logEvent({
      eventType: "export_data",
      adminId: req.admin.id,
      userId: userId,
      userType: "admin",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      resource: `user_data_${userId}`,
      action: "export",
      description: `User data exported by admin ${req.admin.name}`,
      metadata: { format: format || "json", exportedBy: req.admin.name },
    });

    res.status(200).json({
      success: true,
      message: "User data exported successfully",
      data: userData,
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export user data",
      error: error.message,
    });
  }
};

// Compliance Audit Management
export const createComplianceAudit = async (req, res) => {
  try {
    const {
      auditType,
      regulation,
      scope,
      startDate,
      endDate,
      auditTeam,
      externalAuditor,
    } = req.body;

    const audit = new ComplianceAudit({
      auditType,
      regulation,
      scope,
      startDate,
      endDate,
      auditTeam: auditTeam || [
        {
          adminId: req.admin.id,
          role: "lead_auditor",
        },
      ],
      externalAuditor,
      status: "planned",
    });

    await audit.save();

    // Log audit creation
    await SecurityEvent.logEvent({
      eventType: "compliance_violation", // Using existing enum value
      adminId: req.admin.id,
      userType: "admin",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      resource: `compliance_audit_${audit._id}`,
      action: "create_audit",
      description: `Compliance audit created for ${regulation}`,
      metadata: { auditId: audit.auditId, regulation, scope },
    });

    res.status(201).json({
      success: true,
      message: "Compliance audit created successfully",
      data: audit,
    });
  } catch (error) {
    console.error("Error creating compliance audit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create compliance audit",
      error: error.message,
    });
  }
};

export const getComplianceAudits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const regulation = req.query.regulation;
    const status = req.query.status;

    const filter = {};
    if (regulation) filter.regulation = regulation;
    if (status) filter.status = status;

    const options = {
      page,
      limit,
      sort: { startDate: -1 },
      populate: [
        { path: "auditTeam.adminId", select: "name email" },
        { path: "findings.assignedTo", select: "name email" },
      ],
    };

    const audits = await ComplianceAudit.paginate(filter, options);

    res.status(200).json({
      success: true,
      data: audits,
    });
  } catch (error) {
    console.error("Error getting compliance audits:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve compliance audits",
      error: error.message,
    });
  }
};

export const addAuditFinding = async (req, res) => {
  try {
    const { auditId } = req.params;
    const {
      category,
      area,
      description,
      evidence,
      riskLevel,
      recommendation,
      assignedTo,
      dueDate,
    } = req.body;

    const audit = await ComplianceAudit.findById(auditId);
    if (!audit) {
      return res.status(404).json({
        success: false,
        message: "Compliance audit not found",
      });
    }

    await audit.addFinding({
      category,
      area,
      description,
      evidence,
      riskLevel,
      recommendation,
      assignedTo,
      dueDate,
    });

    res.status(201).json({
      success: true,
      message: "Audit finding added successfully",
      data: audit,
    });
  } catch (error) {
    console.error("Error adding audit finding:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add audit finding",
      error: error.message,
    });
  }
};

// Encryption Key Management
export const getEncryptionKeys = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const keyType = req.query.keyType;
    const status = req.query.status;

    const filter = {};
    if (keyType) filter.keyType = keyType;
    if (status) filter.status = status;

    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: "authorizedUsers.userId" },
        { path: "rotationHistory.rotatedBy", select: "name email" },
      ],
    };

    const keys = await EncryptionKey.paginate(filter, options);

    res.status(200).json({
      success: true,
      data: keys,
    });
  } catch (error) {
    console.error("Error getting encryption keys:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve encryption keys",
      error: error.message,
    });
  }
};

export const rotateEncryptionKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { reason } = req.body;

    const oldKey = await EncryptionKey.findById(keyId);
    if (!oldKey) {
      return res.status(404).json({
        success: false,
        message: "Encryption key not found",
      });
    }

    // Create new key
    const newKey = new EncryptionKey({
      keyType: oldKey.keyType,
      algorithm: oldKey.algorithm,
      purpose: oldKey.purpose,
      keyReference: crypto.randomUUID(), // In production, generate actual key
      keyVersion: oldKey.keyVersion + 1,
      authorizedUsers: oldKey.authorizedUsers,
    });

    // Update old key status
    oldKey.status = "inactive";
    oldKey.rotationHistory.push({
      previousKeyId: oldKey.keyId,
      rotatedAt: new Date(),
      rotatedBy: req.admin.id,
      reason: reason || "Manual rotation",
    });

    await Promise.all([newKey.save(), oldKey.save()]);

    // Log key rotation
    await SecurityEvent.logEvent({
      eventType: "system_configuration_change",
      adminId: req.admin.id,
      userType: "admin",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      resource: `encryption_key_${keyId}`,
      action: "rotate_key",
      description: `Encryption key rotated`,
      metadata: { oldKeyId: oldKey.keyId, newKeyId: newKey.keyId, reason },
    });

    res.status(200).json({
      success: true,
      message: "Encryption key rotated successfully",
      data: { oldKey, newKey },
    });
  } catch (error) {
    console.error("Error rotating encryption key:", error);
    res.status(500).json({
      success: false,
      message: "Failed to rotate encryption key",
      error: error.message,
    });
  }
};

// Compliance Reporting
export const generateComplianceReport = async (req, res) => {
  try {
    const { regulation, startDate, endDate, format } = req.query;

    const filter = {};
    if (regulation) filter.regulation = regulation;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const audits = await ComplianceAudit.find(filter)
      .populate("auditTeam.adminId", "name email")
      .populate("findings.assignedTo", "name email");

    // Generate compliance report data
    const reportData = {
      period: {
        startDate: startDate || "All time",
        endDate: endDate || new Date().toISOString(),
      },
      regulation: regulation || "All regulations",
      summary: {
        totalAudits: audits.length,
        completedAudits: audits.filter((a) => a.status === "completed").length,
        totalFindings: audits.reduce(
          (sum, audit) => sum + audit.findings.length,
          0
        ),
        criticalFindings: audits.reduce(
          (sum, audit) =>
            sum +
            audit.findings.filter((f) => f.category === "critical").length,
          0
        ),
        openFindings: audits.reduce(
          (sum, audit) =>
            sum + audit.findings.filter((f) => f.status === "open").length,
          0
        ),
      },
      audits: audits.map((audit) => ({
        auditId: audit.auditId,
        regulation: audit.regulation,
        status: audit.status,
        complianceScore: audit.complianceScore,
        findingsCount: audit.findings.length,
        criticalFindings: audit.criticalFindings,
        openFindings: audit.openFindings,
      })),
      generatedAt: new Date(),
      generatedBy: req.admin.name,
    };

    // Log report generation
    await SecurityEvent.logEvent({
      eventType: "audit_log_access",
      adminId: req.admin.id,
      userType: "admin",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      resource: "compliance_report",
      action: "generate_report",
      description: `Compliance report generated for ${
        regulation || "all regulations"
      }`,
      metadata: { regulation, format: format || "json" },
    });

    res.status(200).json({
      success: true,
      message: "Compliance report generated successfully",
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating compliance report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate compliance report",
      error: error.message,
    });
  }
};
