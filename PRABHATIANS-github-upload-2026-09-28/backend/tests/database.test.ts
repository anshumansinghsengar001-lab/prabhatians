import { test } from "node:test";
import assert from "node:assert/strict";
import { connectDatabase } from "../src/config/database";

test("MongoDB startup reports unavailable database instead of claiming a connection", async () => {
  await assert.rejects(connectDatabase("mongodb://127.0.0.1:1/unavailable"), /MongoDB connection failed.*Start MongoDB locally or set MONGODB_URI/);
});
