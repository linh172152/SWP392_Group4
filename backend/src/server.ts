// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { createServer } from "http";
import { NotificationService } from "./services/notification.service";

// Import routes
import authRoutes from "./routes/auth.routes";
import googleOAuthRoutes from "./routes/google-oauth.routes";
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
      "https://ev-battery-frontend.onrender.com"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
app.use("/api/google", googleOAuthRoutes);
app.use("/api/payments/vnpay", vnpayRoutes);

// Driver API routes - Specific routes first to avoid conflicts
app.use("/api/driver/vehicles", vehicleRoutes);
app.use("/api/driver/stations", stationRoutes);
app.use("/api/driver/bookings", bookingRoutes);
app.use("/api/driver/transactions", transactionRoutes);
app.use("/api/driver", driverRoutes); // Placeholder routes last

// Staff API routes - Specific routes first to avoid conflicts
app.use("/api/staff/batteries", batteryRoutes);
app.use("/api/staff/bookings", staffBookingRoutes);
app.use("/api/staff", staffRoutes); // Placeholder routes last

// Admin API routes - Specific routes first to avoid conflicts
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin", adminRoutes); // Placeholder routes last

// Public API routes
app.use("/api/stations/public", publicStationRoutes);

// User API routes
app.use("/api/support", supportRoutes);
app.use("/api/packages", servicePackageRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/reports", reportRoutes);

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
});

export default app;
