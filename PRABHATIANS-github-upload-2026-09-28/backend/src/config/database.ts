import mongoose from "mongoose";
import { env } from "./env";

export async function connectDatabase(uri = env.MONGODB_URI): Promise<typeof mongoose> {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 7000, connectTimeoutMS: 7000 });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown connection error";
    throw new Error(`MongoDB connection failed for ${uri}. Start MongoDB locally or set MONGODB_URI to a reachable MongoDB Atlas URI. Details: ${reason}`);
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
