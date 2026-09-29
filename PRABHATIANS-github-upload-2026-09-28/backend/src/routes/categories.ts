import { Router } from "express";
import { Category } from "../models";
import { asyncHandler, sendData } from "../utils/http";
const router = Router();
router.get("/", asyncHandler(async (_req, res) => sendData(res, await Category.find({ isActive: true }).sort({ name: 1 }))));
export default router;
