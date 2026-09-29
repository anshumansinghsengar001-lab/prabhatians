import { Router } from "express";
import { z } from "zod";
import { Course, Video, Note, Category, User, Skill, UserSkill, Enrollment, LearningProgress, SavedContent, Rating, Follow } from "../models";
import { authenticate, allowRoles } from "../middleware/auth";
import { asyncHandler, sendData, validateBody, HttpError, objectId } from "../utils/http";
import { recommendationsFor } from "../services/recommendationService";
import { notify } from "../utils/notify";
const router = Router();

export const contentCrud = (Model: typeof Video | typeof Note, kind: "Video" | "Note") => {
  const r = Router();
  r.get("/", asyncHandler(async (req, res) => { const f: Record<string, unknown> = { published: true }; if (req.query.q) f.title = new RegExp(String(req.query.q).slice(0, 100), "i"); if (req.query.category) f.category = String(req.query.category); if (req.query.difficulty && kind === "Video") f.difficulty = String(req.query.difficulty); const rows = await Model.find(f).populate("creator", "fullName").populate("category", "name slug").sort({ createdAt: -1 }).limit(Math.min(Number(req.query.limit) || 30, 100)); sendData(res, rows); }));
  const input = kind === "Video" ? z.object({ title: z.string().trim().min(3).max(160), description: z.string().max(5000).optional(), category: z.string().length(24).optional(), storageKey: z.string().optional(), url: z.string().url().optional(), mimeType: z.string().optional(), size: z.coerce.number().min(0).optional(), duration: z.coerce.number().min(0).optional(), thumbnail: z.string().url().optional().or(z.literal("")), tags: z.array(z.string().max(50)).default([]), published: z.boolean().default(false) }) : z.object({ title: z.string().trim().min(3).max(160), description: z.string().max(5000).optional(), category: z.string().length(24).optional(), resourceUrl: z.string().url().optional(), mimeType: z.string().optional(), content: z.string().max(100000).optional(), tags: z.array(z.string().max(50)).default([]), published: z.boolean().default(false) });
  r.post("/", authenticate, allowRoles("creator", "admin"), validateBody(input), asyncHandler(async (req, res) => { const body = req.body as Record<string, unknown>; const row = await Model.create({ ...body, creator: req.user!.id }); sendData(res, row, `${kind} created.`, 201); }));
  r.get("/:id", asyncHandler(async (req, res) => { const row = await Model.findById(objectId(req.params.id)).populate("creator", "fullName branch year").populate("category", "name slug"); if (!row || (!row.published && (!req.user || (String(row.creator?._id ?? row.creator) !== req.user.id && req.user.role !== "admin")))) throw new HttpError(404, `${kind} not found.`); sendData(res, row); }));
  r.put("/:id", authenticate, allowRoles("creator", "admin"), validateBody(input.partial()), asyncHandler(async (req, res) => { const row = await Model.findById(objectId(req.params.id)); if (!row) throw new HttpError(404, `${kind} not found.`); if (String(row.creator) !== req.user!.id && req.user!.role !== "admin") throw new HttpError(403, `You can only edit your own ${kind.toLowerCase()}s.`); row.set(req.body); await row.save(); sendData(res, row, `${kind} updated.`); }));
  r.delete("/:id", authenticate, allowRoles("creator", "admin"), asyncHandler(async (req, res) => { const row = await Model.findById(objectId(req.params.id)); if (!row) throw new HttpError(404, `${kind} not found.`); if (String(row.creator) !== req.user!.id && req.user!.role !== "admin") throw new HttpError(403, `You can only delete your own ${kind.toLowerCase()}s.`); await row.deleteOne(); sendData(res, {}, `${kind} deleted.`); }));
  return r;
};

router.get("/search", asyncHandler(async (req, res) => { const q = String(req.query.q || "").trim().slice(0, 100); const type = String(req.query.type || "all"); if (q.length < 2) { sendData(res, { courses: [], videos: [], notes: [], users: [], skills: [], categories: [] }); return; } const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); const jobs: Array<Promise<unknown>> = []; const queries: string[] = [];
  if (type === "all" || type === "courses" || type === "course") { queries.push("courses"); const f: Record<string, unknown> = { published: true, $or: [{ title: rx }, { description: rx }, { tags: rx }] }; if (req.query.category) f.category = String(req.query.category); if (req.query.difficulty) f.difficulty = String(req.query.difficulty); if (req.query.rating) f.averageRating = { $gte: Number(req.query.rating) }; jobs.push(Course.find(f).populate("creator", "fullName").populate("category", "name").limit(15)); }
  if (type === "all" || type === "videos" || type === "video") { queries.push("videos"); jobs.push(Video.find({ published: true, $or: [{ title: rx }, { description: rx }, { tags: rx }] }).populate("creator", "fullName").limit(15)); }
  if (type === "all" || type === "notes" || type === "note") { queries.push("notes"); jobs.push(Note.find({ published: true, $or: [{ title: rx }, { description: rx }, { tags: rx }] }).populate("creator", "fullName").limit(15)); }
  if (type === "all" || type === "users" || type === "user") { queries.push("users"); const uf: Record<string, unknown> = { isActive: true, fullName: rx }; if (req.query.branch) uf.branch = String(req.query.branch); if (req.query.year) uf.year = Number(req.query.year); jobs.push(User.find(uf).select("fullName role branch year").limit(15)); }
  if (type === "all" || type === "skills" || type === "skill") { queries.push("skills"); jobs.push(Skill.find({ name: rx }).limit(15)); }
  if (type === "all" || type === "categories" || type === "category") { queries.push("categories"); jobs.push(Category.find({ isActive: true, name: rx }).limit(15)); }
  const rows = await Promise.all(jobs); const result: Record<string, unknown> = {}; queries.forEach((key, i) => { result[key] = rows[i]; }); sendData(res, result); }));
router.get("/recommendations", authenticate, asyncHandler(async (req, res) => { sendData(res, await recommendationsFor(req.user!.id)); }));
export default router;

