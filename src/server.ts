import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { connectDB } from "./config/db";
import { auth } from "./config/auth";
import { authenticateUser } from "./middleware/auth";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json";

// Route imports
import accountRouter from "./routes/accounts";
import categoryRouter from "./routes/categories";
import transactionRouter from "./routes/transactions";
import debtRouter from "./routes/debts";
import subscriptionRouter from "./routes/subscriptions";
import dailyLogRouter from "./routes/dailyLogs";
import weightLogRouter from "./routes/weightLogs";
import savedFoodRouter from "./routes/savedFoods";
import userRouter from "./routes/users";

const app = express();
const PORT = process.env.PORT || 3005;

// Basic Middlewares (helmet, morgan, cors)
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));
app.use(morgan("dev"));

// CORS configuration (allow requests from localhost ports, mobile devices, etc.)
app.use(cors({
  origin: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "http://localhost:3005"
  ],
  credentials: true
}));

// Better Auth Route Handler (MUST be mounted BEFORE express.json())
let authHandler: any = null;
app.all("/api/auth/*", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!authHandler) {
      const { toNodeHandler } = await import("better-auth/node");
      authHandler = toNodeHandler(auth);
    }
    return authHandler(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Express JSON body parser (mounted AFTER Better Auth to prevent hanging)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Protected Business Routes
app.use("/api/accounts", authenticateUser, accountRouter);
app.use("/api/categories", authenticateUser, categoryRouter);
app.use("/api/transactions", authenticateUser, transactionRouter);
app.use("/api/debts", authenticateUser, debtRouter);
app.use("/api/subscriptions", authenticateUser, subscriptionRouter);
app.use("/api/daily-logs", authenticateUser, dailyLogRouter);
app.use("/api/weight-logs", authenticateUser, weightLogRouter);
app.use("/api/saved-foods", authenticateUser, savedFoodRouter);
app.use("/api/users", authenticateUser, userRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// Database Connection & Server Startup
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running in dev mode on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server due to connection error:", error);
    process.exit(1);
  }
};

startServer();
