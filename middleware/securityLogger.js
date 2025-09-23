import { SecurityEvent } from "../model/Security.js";

// Middleware to automatically log security events for sensitive operations
export const securityLogger = (eventType, options = {}) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;

    res.json = function (data) {
      // Log the security event after successful operation
      const logEvent = async () => {
        try {
          const eventData = {
            eventType,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get("User-Agent"),
            sessionId: req.sessionID,
            requestData: {
              endpoint: req.originalUrl,
              method: req.method,
              query: req.query,
              body: options.logBody ? req.body : undefined, // Only log body if explicitly allowed
            },
            responseStatus: res.statusCode,
            processingTime: Date.now() - req.startTime,
            ...options.staticData,
          };

          // Add user information based on request context
          if (req.user && req.user.id) {
            eventData.userId = req.user.id;
            eventData.userType =
              req.user.role === "superadmin" ? "admin" : "user";
          } else if (req.admin && req.admin.id) {
            eventData.adminId = req.admin.id;
            eventData.userType = req.admin.role || "admin";
          }

          // Add resource and action information
          if (options.resource) {
            eventData.resource =
              typeof options.resource === "function"
                ? options.resource(req)
                : options.resource;
          }

          if (options.action) {
            eventData.action =
              typeof options.action === "function"
                ? options.action(req)
                : options.action;
          }

          if (options.description) {
            eventData.description =
              typeof options.description === "function"
                ? options.description(req, res, data)
                : options.description;
          }

          // Add metadata
          if (options.metadata) {
            eventData.metadata =
              typeof options.metadata === "function"
                ? options.metadata(req, res, data)
                : options.metadata;
          }

          // Only log if response was successful (unless specified otherwise)
          const shouldLog =
            options.logAllResponses ||
            (res.statusCode >= 200 && res.statusCode < 300);

          if (shouldLog) {
            await SecurityEvent.logEvent(eventData);
          }
        } catch (error) {
          console.error("Error logging security event:", error);
          // Don't fail the original request due to logging errors
        }
      };

      // Execute logging asynchronously
      setImmediate(logEvent);

      // Call original response method
      return originalJson.call(this, data);
    };

    // Add start time for processing time calculation
    req.startTime = Date.now();
    next();
  };
};

// Pre-configured security loggers for common operations
export const loginLogger = securityLogger("login_success", {
  resource: (req) => `user_${req.body.email}`,
  action: "login",
  description: (req) => `User login: ${req.body.email}`,
});

export const loginFailureLogger = securityLogger("login_failure", {
  resource: (req) => `user_${req.body.email}`,
  action: "login_attempt",
  description: (req) => `Failed login attempt: ${req.body.email}`,
  logAllResponses: true, // Log failures too
});

export const dataAccessLogger = securityLogger("data_access", {
  resource: (req) => {
    if (req.params.userId) return `user_${req.params.userId}`;
    if (req.params.id) return `resource_${req.params.id}`;
    return req.originalUrl;
  },
  action: (req) => `${req.method.toLowerCase()}_data`,
});

export const dataModificationLogger = securityLogger("data_modification", {
  resource: (req) => {
    if (req.params.userId) return `user_${req.params.userId}`;
    if (req.params.id) return `resource_${req.params.id}`;
    return req.originalUrl;
  },
  action: (req) => `${req.method.toLowerCase()}_data`,
  logBody: false, // Don't log request body for privacy
});

export const dataExportLogger = securityLogger("export_data", {
  resource: (req) => {
    if (req.params.userId) return `user_data_${req.params.userId}`;
    return "system_data";
  },
  action: "export",
  description: (req) => `Data export requested by admin`,
  metadata: (req) => ({
    format: req.query.format || "json",
    exportType: req.originalUrl.includes("user") ? "user_data" : "system_data",
  }),
});

export const bulkOperationLogger = securityLogger("bulk_operation", {
  resource: (req) => req.originalUrl,
  action: (req) => `bulk_${req.method.toLowerCase()}`,
  description: (req) => `Bulk operation performed`,
  metadata: (req) => ({
    itemCount: Array.isArray(req.body.ids)
      ? req.body.ids.length
      : Array.isArray(req.body.userIds)
      ? req.body.userIds.length
      : "unknown",
  }),
});

export const adminEscalationLogger = securityLogger("admin_escalation", {
  resource: (req) => req.originalUrl,
  action: "escalate",
  description: (req) => `Admin escalation performed`,
});

export const permissionDeniedLogger = securityLogger("permission_denied", {
  resource: (req) => req.originalUrl,
  action: "access_denied",
  description: (req) => `Access denied to protected resource`,
  logAllResponses: true,
});

export const suspiciousActivityLogger = securityLogger("suspicious_activity", {
  resource: (req) => req.originalUrl,
  action: "suspicious_request",
  description: (req) => `Suspicious activity detected`,
  logAllResponses: true,
});

export const configurationChangeLogger = securityLogger(
  "system_configuration_change",
  {
    resource: (req) => req.originalUrl,
    action: "configure",
    description: (req) => `System configuration changed`,
    logBody: false, // Don't log sensitive configuration data
  }
);

// Rate limiting and security middleware
export const detectSuspiciousActivity = (options = {}) => {
  const {
    maxRequestsPerMinute = 100,
    maxFailedLoginsPerHour = 10,
    suspiciousPatterns = [],
  } = options;

  return async (req, res, next) => {
    try {
      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.get("User-Agent");
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      // Check for excessive requests from same IP
      const recentRequests = await SecurityEvent.countDocuments({
        ipAddress: clientIP,
        timestamp: { $gte: oneMinuteAgo },
      });

      if (recentRequests > maxRequestsPerMinute) {
        await SecurityEvent.logEvent({
          eventType: "suspicious_activity",
          ipAddress: clientIP,
          userAgent,
          resource: req.originalUrl,
          action: "rate_limit_exceeded",
          description: `Excessive requests from IP: ${recentRequests} requests in 1 minute`,
          metadata: { requestCount: recentRequests, timeWindow: "1_minute" },
        });

        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
        });
      }

      // Check for excessive failed logins
      if (req.originalUrl.includes("login")) {
        const failedLogins = await SecurityEvent.countDocuments({
          ipAddress: clientIP,
          eventType: "login_failure",
          timestamp: { $gte: oneHourAgo },
        });

        if (failedLogins > maxFailedLoginsPerHour) {
          await SecurityEvent.logEvent({
            eventType: "security_breach_attempt",
            ipAddress: clientIP,
            userAgent,
            resource: req.originalUrl,
            action: "brute_force_attempt",
            description: `Excessive failed login attempts: ${failedLogins} in 1 hour`,
            metadata: { failedLoginCount: failedLogins, timeWindow: "1_hour" },
          });

          return res.status(423).json({
            success: false,
            message: "Account temporarily locked due to suspicious activity.",
          });
        }
      }

      // Check for suspicious patterns in user agent or request
      const isSuspicious = suspiciousPatterns.some((pattern) => {
        if (typeof pattern === "string") {
          return (
            userAgent && userAgent.toLowerCase().includes(pattern.toLowerCase())
          );
        }
        if (pattern instanceof RegExp) {
          return pattern.test(userAgent || "");
        }
        return false;
      });

      if (isSuspicious) {
        await SecurityEvent.logEvent({
          eventType: "suspicious_activity",
          ipAddress: clientIP,
          userAgent,
          resource: req.originalUrl,
          action: "suspicious_user_agent",
          description: "Suspicious user agent detected",
          metadata: { suspiciousUserAgent: userAgent },
        });
      }

      next();
    } catch (error) {
      console.error("Error in suspicious activity detection:", error);
      // Don't block the request due to monitoring errors
      next();
    }
  };
};

// GDPR compliance middleware
export const gdprComplianceLogger = (dataType = "personal_data") => {
  return securityLogger("data_access", {
    resource: (req) => {
      if (req.params.userId) return `user_${req.params.userId}`;
      return `${dataType}_access`;
    },
    action: "gdpr_data_access",
    description: (req) => `GDPR data access: ${dataType}`,
    metadata: (req) => ({
      dataType,
      gdprCompliance: true,
      legalBasis: req.headers["x-legal-basis"] || "legitimate_interest",
    }),
  });
};

// Audit trail middleware for compliance
export const auditTrail = (auditType = "general") => {
  return securityLogger("audit_log_access", {
    resource: (req) => req.originalUrl,
    action: "audit_access",
    description: (req) => `Audit trail: ${auditType}`,
    metadata: (req) => ({
      auditType,
      complianceRequired: true,
      retentionPeriod: "7_years",
    }),
  });
};

export default securityLogger;
