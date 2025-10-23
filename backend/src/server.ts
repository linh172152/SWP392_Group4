import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Import routes
import authRoutes from "./routes/auth.routes";
import googleOAuthRoutes from "./routes/google-oauth.routes";
import vnpayRoutes from "./routes/vnpay.routes";
import driverRoutes from "./routes/driver.routes";
import staffRoutes from "./routes/staff.routes";
import adminRoutes from "./routes/admin.routes";
import sharedRoutes from "./routes/shared.routes";
import testRoutes from "./routes/test.routes";

// Import new Driver API routes
import vehicleRoutes from "./routes/vehicle.routes";
import stationRoutes from "./routes/station.routes";
import bookingRoutes from "./routes/booking.routes";
import transactionRoutes from "./routes/transaction.routes";

// Import new Staff API routes
import batteryRoutes from "./routes/battery.routes";
import staffBookingRoutes from "./routes/staff-booking.routes";

// Import new Admin API routes
import adminUserRoutes from "./routes/admin-user.routes";

// Import new Shared API routes
import publicStationRoutes from "./routes/public-station.routes";
import supportRoutes from "./routes/support.routes";

// Import new Service Package routes
import servicePackageRoutes from "./routes/service-package.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import ratingRoutes from "./routes/rating.routes";
import reportRoutes from "./routes/report.routes";

// Import middlewares
import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";

// Load environment variables
dotenv.config();

// Initialize Prisma
export const prisma = new PrismaClient();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
app.use(morgan("combined"));

// Root endpoint
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "🚀 EV Battery Swap Station API",
    version: "1.0.0",
    status: "OK",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      google: "/api/google",
      payments: "/api/payments/vnpay",
      driver: "/api/driver",
      staff: "/api/staff",
      admin: "/api/admin",
      test: "/api/test"
    }
  });
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/google", googleOAuthRoutes);
app.use("/api/payments/vnpay", vnpayRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", sharedRoutes);
app.use("/api/test", testRoutes);

// New Driver API routes
app.use("/api/driver/vehicles", vehicleRoutes);
app.use("/api/driver/stations", stationRoutes);
app.use("/api/driver/bookings", bookingRoutes);
app.use("/api/driver/transactions", transactionRoutes);

// New Staff API routes
app.use("/api/staff/batteries", batteryRoutes);
app.use("/api/staff/bookings", staffBookingRoutes);

// New Admin API routes
app.use("/api/admin/users", adminUserRoutes);

// New Shared API routes
app.use("/api/stations/public", publicStationRoutes);
app.use("/api/support", supportRoutes);

// New Service Package routes
app.use("/api/packages", servicePackageRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/reports", reportRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
