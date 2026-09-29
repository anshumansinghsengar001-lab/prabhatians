import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../src/app";
import { connectDatabase, disconnectDatabase } from "../src/config/database";
import { User, Category, Course, CourseModule, Comment, Rating } from "../src/models";

const app = createApp();
const testUri = process.env.MONGODB_URI_TEST;
let connected = false;
before(async () => { if (testUri) { await connectDatabase(testUri); connected = true; } });
after(async () => { if (connected) await disconnectDatabase(); });

test("health endpoint reports the actual MongoDB connection state", async () => {
  const response = await request(app).get("/api/health");
  if (connected) { assert.equal(response.status, 200); assert.equal(response.body.data.database, 1); }
  else { assert.equal(response.status, 503); assert.equal(response.body.success, false); assert.match(response.body.message, /MongoDB is not connected/); }
});

test("database-dependent routes fail clearly while MongoDB is offline", async () => {
  if (connected) return;
  await request(app).post("/api/auth/register").send({}).expect(503).expect((res) => assert.match(res.body.message, /MongoDB is not connected/));
  await request(app).get("/api/courses").expect(503);
});

test("MongoDB-backed auth, ownership, search, comments, and ratings", { skip: !testUri, timeout: 60000 }, async () => {
  const tag = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = (prefix: string) => `${prefix}-${tag}@api-tests.local`;
  const createdUserIds: unknown[] = [];
  let courseId: string | undefined;
  try {
    const category = await Category.findOneAndUpdate({ slug: "api-tests" }, { $set: { name: "API Tests", slug: "api-tests", isActive: true } }, { upsert: true, new: true });
    const creator = await User.create({ fullName: "Test Creator", email: email("creator"), passwordHash: await bcrypt.hash("StrongPassword123!", 4), role: "creator", branch: "Computer Science", year: 3 });
    const student = await User.create({ fullName: "Test Student", email: email("student"), passwordHash: await bcrypt.hash("StrongPassword123!", 4), role: "student", branch: "Computer Science", year: 2 });
    createdUserIds.push(creator._id, student._id);
    const creatorToken = (await request(app).post("/api/auth/login").send({ email: creator.email, password: "StrongPassword123!" }).expect(200)).body.data.token as string;
    const studentToken = (await request(app).post("/api/auth/login").send({ email: student.email, password: "StrongPassword123!" }).expect(200)).body.data.token as string;

    const registrationEmail = email("new-student");
    const registered = await request(app).post("/api/auth/register").send({ fullName: "New Student", email: registrationEmail, password: "StrongPassword123!", confirmPassword: "StrongPassword123!", branch: "Electronics", year: 1 }).expect(201);
    createdUserIds.push(registered.body.data.user._id);
    assert.equal(registered.body.data.user.passwordHash, undefined);
    const savedUser = await User.findOne({ email: registrationEmail }).select("+passwordHash");
    assert.notEqual(savedUser?.passwordHash, "StrongPassword123!");
    assert.equal(await bcrypt.compare("StrongPassword123!", savedUser!.passwordHash), true);
    await request(app).get("/api/auth/me").expect(401);
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${registered.body.data.token}`).expect(200);

    await request(app).post("/api/courses").set("Authorization", `Bearer ${studentToken}`).send({ title: "Rejected Student Course", description: "A sufficiently long course description", category: String(category._id) }).expect(403);
    const course = (await request(app).post("/api/courses").set("Authorization", `Bearer ${creatorToken}`).send({ title: `Searchable React ${tag}`, description: "Learn React components with peers", category: String(category._id), tags: ["React"], published: true }).expect(201)).body.data;
    courseId = course._id;
    await request(app).get(`/api/courses/${courseId}`).expect(200);
    await request(app).get("/api/search?q=React&type=courses").expect(200).expect((res) => assert.ok(res.body.data.courses.some((row: { _id: string }) => row._id === courseId)));
    await request(app).put(`/api/courses/${courseId}`).set("Authorization", `Bearer ${studentToken}`).send({ title: "Hijack" }).expect(403);

    const comment = (await request(app).post("/api/comments").set("Authorization", `Bearer ${studentToken}`).send({ contentType: "Course", contentId: courseId, body: "Useful explanation" }).expect(201)).body.data;
    const other = await User.create({ fullName: "Other Student", email: email("other"), passwordHash: await bcrypt.hash("StrongPassword123!", 4), role: "student", branch: "Civil", year: 2 });
    createdUserIds.push(other._id);
    const otherToken = (await request(app).post("/api/auth/login").send({ email: other.email, password: "StrongPassword123!" }).expect(200)).body.data.token as string;
    await request(app).put(`/api/comments/${comment._id}`).set("Authorization", `Bearer ${otherToken}`).send({ body: "Changed" }).expect(403);
    await request(app).post("/api/ratings").set("Authorization", `Bearer ${studentToken}`).send({ contentType: "Course", contentId: courseId, value: 5 }).expect(201);
    await request(app).post("/api/ratings").set("Authorization", `Bearer ${studentToken}`).send({ contentType: "Course", contentId: courseId, value: 4 }).expect(409);
    const rating = await request(app).get(`/api/ratings/${courseId}?contentType=Course`).expect(200);
    assert.equal(rating.body.data.average, 5);
    assert.equal(rating.body.data.count, 1);
  } finally {
    if (courseId) {
      const moduleIds = await CourseModule.find({ course: courseId }).distinct("_id");
      const { Lesson } = await import("../src/models");
      await Promise.all([Comment.deleteMany({ content: courseId }), Rating.deleteMany({ content: courseId }), Lesson.deleteMany({ module: { $in: moduleIds } }), CourseModule.deleteMany({ course: courseId }), Course.deleteOne({ _id: courseId })]);
    }
    if (createdUserIds.length) await User.deleteMany({ _id: { $in: createdUserIds } });
  }
});
