import express from "express";
import connectDB from "../config/databaseConfig.js";
import adminRouter from "../router/adminRoutes.js";
import { detectSuspiciousActivity } from "../middleware/securityLogger.js";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";

connectDB();
const app = express();

// Security middleware
app.use(helmet()); // Set security headers
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Suspicious activity detection
app.use(
  detectSuspiciousActivity({
    maxRequestsPerMinute: 100,
    maxFailedLoginsPerHour: 10,
    suspiciousPatterns: [
      /bot/i,
      /crawler/i,
      /scanner/i,
      /hack/i,
      /sqlmap/i,
      /nikto/i,
    ],
  })
);

app.use(express.json({ limit: "10mb" }));

// Trust proxy for accurate IP addresses in production
app.set("trust proxy", 1);

// Import and use routes
app.use("/api/admin", adminRouter);

export default app;
