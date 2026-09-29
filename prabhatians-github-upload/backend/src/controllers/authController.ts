import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User, Profile } from "../models";
import { signToken } from "../middleware/auth";
import { sendData, HttpError } from "../utils/http";

export async function register(req: Request, res: Response): Promise<void> {
  const { fullName, email, password, branch, year } = req.body as { fullName: string; email: string; password: string; branch: string; year: number };
  if (await User.exists({ email: email.toLowerCase() })) throw new HttpError(409, "An account with this email already exists.");
  const user = await User.create({ fullName, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12), branch, year });
  await Profile.create({ user: user._id });
  const token = signToken({ sub: String(user._id), role: user.role, email: user.email });
  sendData(res, { user, token }, "Account created.", 201);
}
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new HttpError(401, "Email or password is incorrect.");
  const token = signToken({ sub: String(user._id), role: user.role, email: user.email });
  sendData(res, { user, token }, "Signed in.");
}
export async function currentUser(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id);
  if (!user || !user.isActive) throw new HttpError(401, "This account is unavailable.");
  sendData(res, { user, profile: await Profile.findOne({ user: user._id }) });
}
