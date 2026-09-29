import { Router } from "express";
import multer from "multer";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env";
import { authenticate, allowRoles } from "../middleware/auth";
import { asyncHandler, HttpError, objectId, sendData, validateBody } from "../utils/http";
import { videoStorage } from "../services/videoStorage";
import { Video, Note } from "../models";
import { contentCrud } from "./library";
import { z } from "zod";

const router = Router();
const tempDir = path.resolve(env.VIDEO_STORAGE_PATH, ".tmp");
const upload = multer({ storage: multer.diskStorage({ destination: (_req, _file, cb) => { void mkdir(tempDir, { recursive: true }).then(() => cb(null, tempDir)).catch((error) => cb(error, "")); }, filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`) }), limits: { fileSize: 500 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, cb) => { if (!file.mimetype.startsWith("video/")) cb(new HttpError(400, "Only video files are accepted.")); else cb(null, true); } });
router.get("/", asyncHandler(async (req, res) => { const f: Record<string, unknown> = { published: true }; if (req.query.q) f.title = new RegExp(String(req.query.q).slice(0, 100), "i"); if (req.query.category) f.category = String(req.query.category); const rows = await Video.find(f).populate("creator", "fullName").populate("category", "name").sort({ createdAt: -1 }).limit(Math.min(100, Number(req.query.limit) || 30)); sendData(res, rows); }));
router.post("/", authenticate, allowRoles("creator", "admin"), upload.single("file"), asyncHandler(async (req, res) => { if (req.file) await mkdir(tempDir, { recursive: true }); if (!req.body.title || String(req.body.title).trim().length < 3) throw new HttpError(400, "A video title of at least 3 characters is required."); let stored: Awaited<ReturnType<typeof videoStorage.store>> | undefined; if (req.file) stored = await videoStorage.store(req.file); else if (!req.body.url) throw new HttpError(400, "Provide a video file or a hosted video URL."); const row = await Video.create({ title: String(req.body.title).trim(), description: String(req.body.description || "").slice(0, 5000), category: req.body.category || undefined, creator: req.user!.id, ...(stored ? { storageKey: stored.key, url: stored.url, mimeType: stored.mimeType, size: stored.size } : { url: req.body.url }), duration: Number(req.body.duration) || 0, thumbnail: req.body.thumbnail || undefined, tags: String(req.body.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean).slice(0, 30), published: req.body.published === "true" }); sendData(res, row, "Video uploaded.", 201); }));
router.get("/:id", asyncHandler(async (req, res) => { const row = await Video.findById(objectId(req.params.id)).populate("creator", "fullName").populate("category", "name"); if (!row || (!row.published && (!req.user || (String(row.creator?._id ?? row.creator) !== req.user.id && req.user.role !== "admin")))) throw new HttpError(404, "Video not found."); sendData(res, row); }));
router.put("/:id", authenticate, allowRoles("creator", "admin"), validateBody(z.object({ title: z.string().trim().min(3).max(160).optional(), description: z.string().max(5000).optional(), category: z.string().length(24).optional(), duration: z.coerce.number().min(0).optional(), thumbnail: z.string().url().optional().or(z.literal("")), tags: z.array(z.string().max(50)).max(30).optional(), published: z.boolean().optional() })), asyncHandler(async (req, res) => { const row = await Video.findById(objectId(req.params.id)); if (!row) throw new HttpError(404, "Video not found."); if (String(row.creator) !== req.user!.id && req.user!.role !== "admin") throw new HttpError(403, "You can only edit your own videos."); row.set(req.body); await row.save(); sendData(res, row, "Video updated."); }));
router.delete("/:id", authenticate, allowRoles("creator", "admin"), asyncHandler(async (req, res) => { const row = await Video.findById(objectId(req.params.id)); if (!row) throw new HttpError(404, "Video not found."); if (String(row.creator) !== req.user!.id && req.user!.role !== "admin") throw new HttpError(403, "You can only delete your own videos."); if (row.storageKey && env.VIDEO_STORAGE_PROVIDER === "local") await videoStorage.remove(row.storageKey); await row.deleteOne(); sendData(res, {}, "Video deleted."); }));
export const notesRouter = contentCrud(Note, "Note");
export default router;


