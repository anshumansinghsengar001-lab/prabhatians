import { randomUUID } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env";

export type StoredVideo = { key: string; url: string; mimeType: string; size: number; originalName: string };
export interface VideoStorage { store(file: Express.Multer.File): Promise<StoredVideo>; remove(key: string): Promise<void>; }
export class LocalVideoStorage implements VideoStorage {
  private directory = path.resolve(env.VIDEO_STORAGE_PATH);
  async store(file: Express.Multer.File): Promise<StoredVideo> { await mkdir(this.directory, { recursive: true }); const ext = path.extname(file.originalname).slice(0, 12); const key = `${randomUUID()}${ext}`; const target = path.join(this.directory, key); const { rename } = await import("node:fs/promises"); await rename(file.path, target); return { key, url: `/api/uploads/videos/${key}`, mimeType: file.mimetype, size: file.size, originalName: path.basename(file.originalname) }; }
  async remove(key: string): Promise<void> { if (path.basename(key) !== key) throw new Error("Invalid storage key."); await unlink(path.join(this.directory, key)).catch((e: NodeJS.ErrnoException) => { if (e.code !== "ENOENT") throw e; }); }
}
export class MockVideoStorage implements VideoStorage { async store(file: Express.Multer.File): Promise<StoredVideo> { return { key: randomUUID(), url: "https://example.invalid/video/mock", mimeType: file.mimetype, size: file.size, originalName: path.basename(file.originalname) }; } async remove(_key: string): Promise<void> {} }
export const videoStorage: VideoStorage = env.VIDEO_STORAGE_PROVIDER === "mock" ? new MockVideoStorage() : new LocalVideoStorage();
