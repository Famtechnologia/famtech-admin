import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import crypto from "crypto";

// Security Event Log Schema
const securityEventSchema = new mongoose.Schema(
  {
    // Event identification
    eventId: {
      type: String,
      unique: true,
      required: true,
      default: () => crypto.randomUUID(),
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "login_success",
        "login_failure",
        "logout",
        "password_change",
        "password_reset_request",
        "password_reset_success",
        "account_locked",
        "account_unlocked",
        "permission_denied",
        "data_access",
        "data_modification",
        "data_deletion",
        "bulk_operation",
        "export_data",
        "admin_escalation",
        "suspicious_activity",
        "security_breach_attempt",
        "compliance_violation",
        "audit_log_access",
        "system_configuration_change",
      ],
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    // User and session information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
    },
    sessionId: {
      type: String,
      index: true,
    },
    userType: {
      type: String,
      enum: ["user", "admin", "superadmin", "system"],
      required: true,
    },

    // Request details
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      maxLength: 1000,
    },
    geolocation: {
      country: String,
      region: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    // Event details
    resource: {
      type: String, // What was accessed/modified
      maxLength: 500,
    },
    action: {
      type: String, // What action was performed
      maxLength: 200,
    },
    description: {
      type: String,
      maxLength: 2000,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Additional event-specific data
    },

    // Request and response data (for audit purposes)
    requestData: {
      endpoint: String,
      method: String,
      query: mongoose.Schema.Types.Mixed,
      body: mongoose.Schema.Types.Mixed, // Sensitive data should be masked
    },
    responseStatus: {
      type: Number,
      min: 100,
      max: 599,
    },

    // Risk assessment
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    riskFactors: [
      {
        factor: String,
        score: Number,
        description: String,
      },
    ],

    // Compliance tracking
    complianceFlags: [
      {
        regulation: {
          type: String,
          enum: ["GDPR", "HIPAA", "CCPA", "SOX", "PCI_DSS", "ISO27001"],
        },
        requiresAttention: {
          type: Boolean,
          default: false,
        },
        reason: String,
      },
    ],

    // Investigation and resolution
    investigated: {
      type: Boolean,
      default: false,
    },
    investigatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
    },
    investigatedAt: Date,
    investigationNotes: String,
    resolved: {
      type: Boolean,
      default: false,
    },
    resolution: String,

    // Timestamps
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    processingTime: {
      type: Number, // milliseconds
    },
  },
  {
    timestamps: false, // Using custom timestamp
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Data Privacy and Consent Schema
const dataPrivacyConsentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Consent tracking
    consents: [
      {
        type: {
          type: String,
          enum: [
            "data_processing",
            "marketing_communications",
            "analytics_tracking",
            "third_party_sharing",
            "cookies_functional",
            "cookies_analytics",
            "cookies_advertising",
            "location_tracking",
            "biometric_data",
            "automated_decision_making",
          ],
          required: true,
        },
        granted: {
          type: Boolean,
          required: true,
        },
        grantedAt: {
          type: Date,
          default: Date.now,
        },
        revokedAt: Date,
        ipAddress: String,
        userAgent: String,
        legalBasis: {
          type: String,
          enum: [
            "consent",
            "contract",
            "legal_obligation",
            "vital_interests",
            "public_task",
            "legitimate_interests",
          ],
          default: "consent",
        },
        version: {
          type: String,
          default: "1.0",
        },
      },
    ],

    // Data subject rights
    dataSubjectRights: [
      {
        requestType: {
          type: String,
          enum: [
            "access", // Right to access
            "rectification", // Right to rectification
            "erasure", // Right to be forgotten
            "restrict_processing", // Right to restrict processing
            "data_portability", // Right to data portability
            "object_processing", // Right to object
            "automated_decision_opt_out", // Right not to be subject to automated decision-making
          ],
          required: true,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "rejected"],
          default: "pending",
        },
        handledBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
        },
        completedAt: Date,
        notes: String,
        attachments: [
          {
            filename: String,
            url: String,
            encrypted: Boolean,
          },
        ],
      },
    ],

    // Data retention
    dataRetention: {
      retentionPeriod: {
        type: Number, // days
        default: 2555, // 7 years
      },
      retentionStartDate: {
        type: Date,
        default: Date.now,
      },
      deleteAfter: Date,
      autoDeleteEnabled: {
        type: Boolean,
        default: true,
      },
    },

    // Privacy settings
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ["public", "members", "private"],
        default: "members",
      },
      dataProcessingOptOut: {
        type: Boolean,
        default: false,
      },
      marketingOptOut: {
        type: Boolean,
        default: false,
      },
      analyticsOptOut: {
        type: Boolean,
        default: false,
      },
    },

    // Breach notifications
    breachNotifications: [
      {
        breachId: String,
        notifiedAt: Date,
        method: {
          type: String,
          enum: ["email", "in_app", "postal_mail", "phone"],
        },
        acknowledged: {
          type: Boolean,
          default: false,
        },
        acknowledgedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compliance Audit Schema
const complianceAuditSchema = new mongoose.Schema(
  {
    // Audit identification
    auditId: {
      type: String,
      unique: true,
      required: true,
      default: () =>
        `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    },
    auditType: {
      type: String,
      enum: [
        "scheduled",
        "incident_response",
        "compliance_check",
        "security_review",
        "data_protection",
      ],
      required: true,
    },
    regulation: {
      type: String,
      enum: ["GDPR", "HIPAA", "CCPA", "SOX", "PCI_DSS", "ISO27001", "GENERAL"],
      required: true,
    },

    // Audit scope and timeline
    scope: {
      type: String,
      required: true,
      maxLength: 1000,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    status: {
      type: String,
      enum: ["planned", "in_progress", "completed", "suspended"],
      default: "planned",
    },

    // Audit team
    auditTeam: [
      {
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
          required: true,
        },
        role: {
          type: String,
          enum: [
            "lead_auditor",
            "auditor",
            "technical_expert",
            "compliance_officer",
          ],
          required: true,
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Audit findings
    findings: [
      {
        findingId: {
          type: String,
          default: () => crypto.randomUUID(),
        },
        category: {
          type: String,
          enum: ["critical", "major", "minor", "observation"],
          required: true,
        },
        area: String, // Which system/process area
        description: {
          type: String,
          required: true,
          maxLength: 2000,
        },
        evidence: [
          {
            type: String,
            url: String,
            description: String,
          },
        ],
        riskLevel: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          required: true,
        },
        recommendation: {
          type: String,
          maxLength: 1000,
        },
        status: {
          type: String,
          enum: ["open", "in_progress", "resolved", "accepted_risk"],
          default: "open",
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
        },
        dueDate: Date,
        resolvedAt: Date,
        resolution: String,
      },
    ],

    // Compliance scores
    complianceScore: {
      overall: {
        type: Number,
        min: 0,
        max: 100,
      },
      categories: [
        {
          name: String,
          score: Number,
          maxScore: Number,
        },
      ],
    },

    // Reports and documentation
    reports: [
      {
        reportType: {
          type: String,
          enum: ["preliminary", "draft", "final", "executive_summary"],
        },
        filename: String,
        url: String,
        generatedAt: {
          type: Date,
          default: Date.now,
        },
        generatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
        },
      },
    ],

    // External auditor information (if applicable)
    externalAuditor: {
      company: String,
      leadAuditor: String,
      contact: String,
      certification: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Encryption Key Management Schema
const encryptionKeySchema = new mongoose.Schema(
  {
    keyId: {
      type: String,
      unique: true,
      required: true,
      default: () => crypto.randomUUID(),
    },
    keyType: {
      type: String,
      enum: [
        "master",
        "data_encryption",
        "token_signing",
        "api_key",
        "temporary",
      ],
      required: true,
    },
    algorithm: {
      type: String,
      enum: [
        "AES-256-GCM",
        "RSA-2048",
        "RSA-4096",
        "ECDSA-P256",
        "HMAC-SHA256",
      ],
      required: true,
    },

    // Key lifecycle
    status: {
      type: String,
      enum: [
        "active",
        "inactive",
        "compromised",
        "expired",
        "rotation_pending",
      ],
      default: "active",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    activatedAt: Date,
    expiresAt: Date,
    rotationScheduled: Date,
    lastUsedAt: Date,

    // Key metadata (actual keys stored in secure key management system)
    keyVersion: {
      type: Number,
      default: 1,
    },
    purpose: {
      type: String,
      maxLength: 500,
    },
    keyReference: {
      type: String, // Reference to external key management system
      required: true,
    },

    // Access control
    authorizedUsers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "authorizedUsers.userType",
        },
        userType: {
          type: String,
          enum: ["User", "SuperAdmin"],
        },
        permissions: [
          {
            type: String,
            enum: ["read", "encrypt", "decrypt", "rotate", "revoke"],
          },
        ],
        grantedAt: {
          type: Date,
          default: Date.now,
        },
        grantedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
        },
      },
    ],

    // Usage tracking
    usageStats: {
      encryptionOperations: {
        type: Number,
        default: 0,
      },
      decryptionOperations: {
        type: Number,
        default: 0,
      },
      lastActivity: Date,
    },

    // Rotation history
    rotationHistory: [
      {
        previousKeyId: String,
        rotatedAt: Date,
        rotatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SuperAdmin",
        },
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance and security
securityEventSchema.index({ timestamp: -1 });
securityEventSchema.index({ eventType: 1, timestamp: -1 });
securityEventSchema.index({ userId: 1, timestamp: -1 });
securityEventSchema.index({ adminId: 1, timestamp: -1 });
securityEventSchema.index({ ipAddress: 1, timestamp: -1 });
securityEventSchema.index({ severity: 1, timestamp: -1 });
securityEventSchema.index({ investigated: 1, severity: -1 });

dataPrivacyConsentSchema.index({ userId: 1 });
dataPrivacyConsentSchema.index({ "consents.type": 1, "consents.granted": 1 });
dataPrivacyConsentSchema.index({ "dataSubjectRights.status": 1 });

complianceAuditSchema.index({ regulation: 1, status: 1 });
complianceAuditSchema.index({ startDate: -1 });
complianceAuditSchema.index({ "findings.status": 1, "findings.riskLevel": 1 });

encryptionKeySchema.index({ keyType: 1, status: 1 });
encryptionKeySchema.index({ expiresAt: 1 });
encryptionKeySchema.index({ rotationScheduled: 1 });

// Virtual fields
securityEventSchema.virtual("isHighRisk").get(function () {
  return (
    this.severity === "high" ||
    this.severity === "critical" ||
    this.riskScore > 70
  );
});

securityEventSchema.virtual("requiresInvestigation").get(function () {
  return (
    !this.investigated &&
    (this.isHighRisk ||
      this.eventType.includes("breach") ||
      this.eventType.includes("suspicious"))
  );
});

dataPrivacyConsentSchema.virtual("hasValidConsent").get(function () {
  const requiredConsents = ["data_processing"];
  return requiredConsents.every((type) =>
    this.consents.some(
      (consent) =>
        consent.type === type && consent.granted && !consent.revokedAt
    )
  );
});

complianceAuditSchema.virtual("openFindings").get(function () {
  return this.findings.filter((finding) => finding.status === "open").length;
});

complianceAuditSchema.virtual("criticalFindings").get(function () {
  return this.findings.filter(
    (finding) => finding.category === "critical"
  ).length;
});

// Static methods
securityEventSchema.statics.logEvent = async function (eventData) {
  try {
    // Calculate risk score based on event type and context
    let riskScore = 0;
    const riskFactors = [];

    // Base risk scores by event type
    const riskMap = {
      login_failure: 10,
      permission_denied: 20,
      suspicious_activity: 60,
      security_breach_attempt: 90,
      data_deletion: 40,
      bulk_operation: 30,
      export_data: 35,
    };

    riskScore = riskMap[eventData.eventType] || 5;

    // Adjust risk based on additional factors
    if (eventData.userType === "admin" || eventData.userType === "superadmin") {
      riskScore += 10;
      riskFactors.push({
        factor: "privileged_user",
        score: 10,
        description: "Event involves privileged user account",
      });
    }

    // IP-based risk (simplified - in production, use IP reputation services)
    if (eventData.ipAddress && eventData.ipAddress.startsWith("10.")) {
      riskScore -= 5; // Internal network
    } else {
      riskScore += 5; // External network
      riskFactors.push({
        factor: "external_ip",
        score: 5,
        description: "Event from external IP address",
      });
    }

    // Time-based risk (outside business hours)
    const eventHour = new Date().getHours();
    if (eventHour < 6 || eventHour > 22) {
      riskScore += 15;
      riskFactors.push({
        factor: "off_hours",
        score: 15,
        description: "Event outside business hours",
      });
    }

    const event = new this({
      ...eventData,
      riskScore: Math.min(riskScore, 100),
      riskFactors,
      timestamp: new Date(),
    });

    await event.save();

    // Trigger alerts for high-risk events
    if (event.isHighRisk) {
      // In production, send alerts to security team
      console.log(
        `HIGH RISK SECURITY EVENT: ${event.eventType} - Risk Score: ${event.riskScore}`
      );
    }

    return event;
  } catch (error) {
    console.error("Error logging security event:", error);
    throw error;
  }
};

securityEventSchema.statics.getSecurityMetrics = async function (
  timeframe = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);

  const metrics = await this.aggregate([
    { $match: { timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        highRiskEvents: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $eq: ["$severity", "high"] },
                  { $eq: ["$severity", "critical"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        loginFailures: {
          $sum: { $cond: [{ $eq: ["$eventType", "login_failure"] }, 1, 0] },
        },
        dataAccesses: {
          $sum: { $cond: [{ $eq: ["$eventType", "data_access"] }, 1, 0] },
        },
        breachAttempts: {
          $sum: {
            $cond: [{ $eq: ["$eventType", "security_breach_attempt"] }, 1, 0],
          },
        },
        avgRiskScore: { $avg: "$riskScore" },
        uninvestigatedEvents: {
          $sum: { $cond: [{ $eq: ["$investigated", false] }, 1, 0] },
        },
      },
    },
  ]);

  return (
    metrics[0] || {
      totalEvents: 0,
      highRiskEvents: 0,
      loginFailures: 0,
      dataAccesses: 0,
      breachAttempts: 0,
      avgRiskScore: 0,
      uninvestigatedEvents: 0,
    }
  );
};

// Instance methods
dataPrivacyConsentSchema.methods.grantConsent = function (
  consentType,
  ipAddress,
  userAgent,
  legalBasis = "consent"
) {
  // Revoke existing consent of same type
  this.consents.forEach((consent) => {
    if (consent.type === consentType && consent.granted && !consent.revokedAt) {
      consent.revokedAt = new Date();
    }
  });

  // Add new consent
  this.consents.push({
    type: consentType,
    granted: true,
    grantedAt: new Date(),
    ipAddress,
    userAgent,
    legalBasis,
  });

  return this.save();
};

dataPrivacyConsentSchema.methods.revokeConsent = function (consentType) {
  const consent = this.consents.find(
    (c) => c.type === consentType && c.granted && !c.revokedAt
  );
  if (consent) {
    consent.revokedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

complianceAuditSchema.methods.addFinding = function (findingData) {
  this.findings.push({
    ...findingData,
    findingId: crypto.randomUUID(),
  });
  return this.save();
};

// Add pagination plugin
securityEventSchema.plugin(mongoosePaginate);
dataPrivacyConsentSchema.plugin(mongoosePaginate);
complianceAuditSchema.plugin(mongoosePaginate);
encryptionKeySchema.plugin(mongoosePaginate);

const SecurityEvent = mongoose.model("SecurityEvent", securityEventSchema);
const DataPrivacyConsent = mongoose.model(
  "DataPrivacyConsent",
  dataPrivacyConsentSchema
);
const ComplianceAudit = mongoose.model(
  "ComplianceAudit",
  complianceAuditSchema
);
const EncryptionKey = mongoose.model("EncryptionKey", encryptionKeySchema);

export { SecurityEvent, DataPrivacyConsent, ComplianceAudit, EncryptionKey };

export default SecurityEvent;
