import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import mongoose from "mongoose";
import { env } from "./config/env";
import authRoutes from "./routes/auth";
import userRoutes, { skillsRouter } from "./routes/users";
import courseRoutes from "./routes/courses";
import libraryRoutes, { contentCrud } from "./routes/library";
import videoRoutes, { notesRouter } from "./routes/videos";
import learningRoutes, { progressRouter } from "./routes/learning";
import socialRoutes from "./routes/social";
import adminRoutes from "./routes/admin";
import categoryRoutes from "./routes/categories";
import statsRoutes from "./routes/stats";
import { Enrollment, UserSkill, User } from "./models";
import { authenticate, optionalAuthenticate } from "./middleware/auth";
import { asyncHandler, sendData } from "./utils/http";
import { notFound, errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: (origin, callback) => { if (!origin || origin === env.CLIENT_URL || (env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin))) return callback(null, true); callback(new Error("Origin is not allowed by CORS.")); }, credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, message: "Too many requests. Try again later." } }));
  app.use("/api", (req, res, next) => { if (req.path === "/health") { next(); return; } if (mongoose.connection.readyState !== 1) { res.status(503).json({ success: false, message: "MongoDB is not connected. Start MongoDB or configure MONGODB_URI." }); return; } next(); });
  app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, message: "Too many authentication attempts. Try again later." } }), authRoutes);
  const api = express.Router();
  api.use(optionalAuthenticate);
  api.use("/users", userRoutes);
  api.use("/skills", skillsRouter);
  api.get("/matches", authenticate, asyncHandler(async (req, res) => { const wanted = await UserSkill.find({ user: req.user!.id, intent: "learn" }).distinct("skill"); const learnedBy = await UserSkill.find({ skill: { $in: wanted }, intent: "know", user: { $ne: req.user!.id } }).distinct("user"); sendData(res, await User.find({ _id: { $in: learnedBy }, isActive: true }).select("fullName branch year role").limit(30)); }));
  api.get("/users/me/courses", authenticate, asyncHandler(async (req, res) => sendData(res, await Enrollment.find({ user: req.user!.id }).populate({ path: "course", populate: [{ path: "creator", select: "fullName" }, { path: "category", select: "name" }] }).sort({ enrolledAt: -1 }))));
  api.use("/courses", courseRoutes);
  api.use("/videos", videoRoutes);
  api.use("/notes", notesRouter);
  api.use("/quizzes", learningRoutes);
  api.use("/progress", progressRouter);
  api.use("/", libraryRoutes);
  api.use("/", socialRoutes);
  api.use("/categories", categoryRoutes);
  api.use("/stats", statsRoutes);
  api.use("/admin", adminRoutes);
  api.use("/uploads/videos", express.static(path.resolve(env.VIDEO_STORAGE_PATH), { fallthrough: false, immutable: true, maxAge: "1d", dotfiles: "deny", index: false }));
  api.get("/health", (_req, res) => { const connected = mongoose.connection.readyState === 1; res.status(connected ? 200 : 503).json({ success: connected, data: { status: connected ? "ok" : "degraded", database: mongoose.connection.readyState }, message: connected ? "API and database are healthy." : "MongoDB is not connected." }); });
  app.use("/api", api);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}








