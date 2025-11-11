// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { createServer } from "http";
import { NotificationService } from "./services/notification.service";
import * as cron from "node-cron";
import {
  autoCancelExpiredBookings,
  autoCancelInstantBookings,
  sendBookingReminders,
} from "./services/booking-auto-cancel.service";

// Import routes
import authRoutes from "./routes/auth.routes";
import vnpayRoutes from "./routes/vnpay.routes";
import driverRoutes from "./routes/driver.routes";
import staffRoutes from "./routes/staff.routes";
import adminRoutes from "./routes/admin.routes";
import sharedRoutes from "./routes/shared.routes";

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
import adminStationRoutes from "./routes/admin-station.routes";
import adminStaffRoutes from "./routes/admin-staff.routes";

// Import new Shared API routes
import publicStationRoutes from "./routes/public-station.routes";
import supportRoutes from "./routes/support.routes";
import mapsRoutes from "./routes/maps.routes";

// Import new Service Package routes
// ❌ Removed: ServicePackage và Subscription (đã thay bằng TopUpPackage)
// import servicePackageRoutes from "./routes/service-package.routes";
// import subscriptionRoutes from "./routes/subscription.routes";
import ratingRoutes from "./routes/rating.routes";
import adminBatteryRoutes from "./routes/admin-battery.routes";
import adminBatteryTransferRoutes from "./routes/admin-battery-transfer.routes";
import adminSupportRoutes from "./routes/admin-support.routes";
import adminForecastRoutes from "./routes/admin-forecast.routes";
import packageRoutes from "./routes/package.routes";
import adminPackageRoutes from "./routes/admin-package.routes";
import driverSubscriptionRoutes from "./routes/driver-subscription.routes";
import publicPricingRoutes from "./routes/public-pricing.routes";
import staffScheduleRoutes from "./routes/staff-schedule.routes";
import adminStaffScheduleRoutes from "./routes/admin-staff-schedule.routes";

// ✅ topupPackageRoutes is already imported and mounted in admin.routes.ts
// import topupPackageRoutes from "./routes/topup-package.routes";

// Import middlewares
import { errorHandler } from "./middlewares/error.middleware";
// import { notFound } from "./middlewares/notFound.middleware";

// Initialize Prisma
export const prisma = new PrismaClient();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EV Battery Swap Station API",
      version: "1.0.0",
      description: "API for EV Battery Swap Station Management System",
      contact: {
        name: "SWP392 Group 4",
        email: "thanhldse170144@fpt.edu.vn",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://ev-battery-backend.onrender.com"
            : "http://localhost:3000",
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Create Express app
const app = express();
app.set("trust proxy", 1);
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Notification Service
export const notificationService = new NotificationService(server);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5173",
      "https://ev-battery-frontend.onrender.com",
      "https://swp392-git-main-leducthanhhs-projects.vercel.app",
      "https://swp392.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
      docs: "/api-docs",
      auth: "/api/auth",
      google: "/api/google",
      payments: "/api/payments/vnpay",
      driver: "/api/driver",
      staff: "/api/staff",
      admin: "/api/admin",
    },
  });
});

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes - Specific routes first
app.use("/api/auth", authRoutes);
app.use("/api/payments/vnpay", vnpayRoutes);

// Driver API routes - Specific routes first to avoid conflicts
app.use("/api/driver/vehicles", vehicleRoutes);
app.use("/api/driver/stations", stationRoutes);
app.use("/api/driver/bookings", bookingRoutes);
app.use("/api/driver/transactions", transactionRoutes);
app.use("/api/driver/subscriptions", driverSubscriptionRoutes);
app.use("/api/driver", driverRoutes); // Placeholder routes last

// Staff API routes - Specific routes first to avoid conflicts
app.use("/api/staff/batteries", batteryRoutes);
app.use("/api/staff/bookings", staffBookingRoutes);
app.use("/api/staff/schedules", staffScheduleRoutes);
app.use("/api/staff", staffRoutes); // Placeholder routes last

// Admin API routes - Specific routes first to avoid conflicts
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/stations", adminStationRoutes);
app.use("/api/admin/staff", adminStaffRoutes);
app.use("/api/admin/packages", adminPackageRoutes);
app.use("/api/admin/batteries", adminBatteryRoutes);
app.use("/api/admin/battery-transfers", adminBatteryTransferRoutes);
app.use("/api/admin/support", adminSupportRoutes);
app.use("/api/admin/forecast", adminForecastRoutes);
app.use("/api/admin/staff-schedules", adminStaffScheduleRoutes);
app.use("/api/admin", adminRoutes); // Contains pricing and topup-packages routes

// Public API routes
app.use("/api/stations/public", publicStationRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/pricing", publicPricingRoutes);

// Maps API routes (Track-Asia - directions, distance, duration)
app.use("/api/maps", mapsRoutes);

// User API routes
app.use("/api/support", supportRoutes);
// ❌ Removed: ServicePackage và Subscription routes (đã thay bằng TopUpPackage)
// app.use("/api/packages", servicePackageRoutes);
// app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/ratings", ratingRoutes);
// ✅ Reports routes đã mount trong admin routes: /api/admin/dashboard

// Shared routes
app.use("/api", sharedRoutes);

// Error handling middleware
// app.use(notFound);
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
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket enabled for real-time notifications`);

  // ✅ Start cron jobs ONLY if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    console.log(`✅ DATABASE_URL found, starting cron jobs...`);

    // Run every 5 minutes to check and auto-cancel expired bookings
    cron.schedule("*/5 * * * *", async () => {
      try {
        console.log("🔄 Running auto-cancel expired bookings check...");
        const result = await autoCancelExpiredBookings();
        if (result.cancelled > 0) {
          console.log(
            `✅ Auto-cancelled ${result.cancelled} expired booking(s)`
          );
        }
      } catch (error) {
        console.error("❌ Error in auto-cancel cron job:", error);
      }
    });

    // Run every 5 minutes to auto-cancel expired instant bookings
    cron.schedule("*/5 * * * *", async () => {
      try {
        console.log("🔄 Running auto-cancel instant bookings check...");
        const result = await autoCancelInstantBookings();
        if (result.cancelled > 0) {
          console.log(
            `✅ Auto-cancelled ${result.cancelled} expired instant booking(s)`
          );
        }
      } catch (error) {
        console.error(
          "❌ Error in auto-cancel instant bookings cron job:",
          error
        );
      }
    });

    // Run every 5 minutes to send booking reminders
    cron.schedule("*/5 * * * *", async () => {
      try {
        console.log("🔄 Running booking reminders check...");
        const result = await sendBookingReminders();
        if (result.remindersSent > 0 || result.finalRemindersSent > 0) {
          console.log(
            `✅ Sent ${result.remindersSent} reminders and ${result.finalRemindersSent} final reminders`
          );
        }
      } catch (error) {
        console.error("❌ Error in booking reminders cron job:", error);
      }
    });

    console.log(
      `⏰ Cron jobs started: auto-cancel (every 5 min), auto-cancel-instant (every 5 min), reminders (every 5 min)`
    );
  } else {
    console.warn(`⚠️ DATABASE_URL not found. Cron jobs will NOT be started.`);
    console.warn(`⚠️ Please ensure DATABASE_URL is set in your .env file.`);
  }
});

export default app;
