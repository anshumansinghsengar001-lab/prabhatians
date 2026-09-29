import { Router } from "express";
import { User, Skill, Course, Connection } from "../models";
import { asyncHandler, sendData } from "../utils/http";
const router = Router();
router.get("/", asyncHandler(async (_req, res) => {
  const [students, creators, skills, courses, activeConnections] = await Promise.all([
    User.countDocuments({ isActive: true, role: "student" }), User.countDocuments({ isActive: true, role: "creator" }), Skill.countDocuments({}), Course.countDocuments({ published: true }), Connection.countDocuments({ status: "accepted" }),
  ]);
  sendData(res, { students, creators, skills, courses, activeConnections });
}));
export default router;
