import mongoose, { Schema, type Model } from "mongoose";

export type Role = "student" | "creator" | "admin";
const opts = { timestamps: true, versionKey: false as const };
const ref = (model: string, required = true) => ({ type: Schema.Types.ObjectId, ref: model, required });
const base = (fields: mongoose.SchemaDefinition) => new Schema(fields, opts);
function modelOf(name: string, schema: Schema): Model<any> { return (mongoose.models[name] as Model<any>) || mongoose.model(name, schema); }

const userSchema = base({
  fullName: { type: String, required: true, trim: true, maxlength: 100 }, email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false }, role: { type: String, enum: ["student", "creator", "admin"], default: "student", index: true },
  branch: { type: String, trim: true }, year: { type: Number, min: 1, max: 8 }, interests: [String], isActive: { type: Boolean, default: true },
});
userSchema.set("toJSON", { transform: (_doc: unknown, ret: Record<string, unknown>) => { delete ret.passwordHash; return ret; } });
export const User = modelOf("User", userSchema);
export const Profile = modelOf("Profile", base({ user: { ...ref("User"), unique: true }, bio: { type: String, maxlength: 500 }, avatar: String, location: String, socialLinks: Schema.Types.Mixed, interests: [String] }));
export const Skill = modelOf("Skill", base({ name: { type: String, required: true, unique: true, trim: true }, slug: { type: String, required: true, unique: true, lowercase: true }, category: String, description: String }));
export const UserSkill = modelOf("UserSkill", base({ user: ref("User"), skill: ref("Skill"), level: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"], default: "beginner" }, intent: { type: String, enum: ["know", "learn"], required: true } }));
UserSkill.schema.index({ user: 1, skill: 1, intent: 1 }, { unique: true });
export const Category = modelOf("Category", base({ name: { type: String, required: true, unique: true }, slug: { type: String, required: true, unique: true, lowercase: true }, description: String, icon: String, isActive: { type: Boolean, default: true } }));
export const CourseModule = modelOf("CourseModule", base({ course: ref("Course"), title: { type: String, required: true }, description: String, position: { type: Number, default: 0 } }));
export const Lesson = modelOf("Lesson", base({ module: ref("CourseModule"), title: { type: String, required: true }, content: String, video: ref("Video", false), duration: Number, position: { type: Number, default: 0 } }));
export const Course = modelOf("Course", base({
  title: { type: String, required: true, trim: true, maxlength: 160, index: "text" }, description: { type: String, required: true, maxlength: 5000 }, category: ref("Category", false), subcategory: String,
  difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner", index: true }, thumbnail: String, tags: [String], objectives: [String], prerequisites: [String], duration: { type: Number, default: 0 },
  creator: ref("User"), modules: [{ type: Schema.Types.ObjectId, ref: "CourseModule" }], published: { type: Boolean, default: false, index: true }, averageRating: { type: Number, default: 0 }, ratingCount: { type: Number, default: 0 }, enrollmentCount: { type: Number, default: 0 },
}));
export const Video = modelOf("Video", base({ title: { type: String, required: true, maxlength: 160, index: "text" }, description: String, category: ref("Category", false), creator: ref("User"), storageKey: String, url: String, mimeType: String, size: Number, duration: Number, thumbnail: String, tags: [String], published: { type: Boolean, default: false, index: true }, averageRating: { type: Number, default: 0 }, ratingCount: { type: Number, default: 0 } }));
export const Note = modelOf("Note", base({ title: { type: String, required: true, maxlength: 160, index: "text" }, description: String, category: ref("Category", false), creator: ref("User"), resourceUrl: String, mimeType: String, content: String, tags: [String], published: { type: Boolean, default: false, index: true }, averageRating: { type: Number, default: 0 }, ratingCount: { type: Number, default: 0 } }));
export const QuizQuestion = modelOf("QuizQuestion", base({ quiz: ref("Quiz"), prompt: { type: String, required: true }, options: [String], correctAnswer: { type: Number, required: true }, explanation: String, marks: { type: Number, default: 1 } }));
export const Quiz = modelOf("Quiz", base({ title: { type: String, required: true }, description: String, course: ref("Course", false), creator: ref("User"), questions: [{ type: Schema.Types.ObjectId, ref: "QuizQuestion" }], passingScore: { type: Number, default: 60 }, published: { type: Boolean, default: false } }));
export const Enrollment = modelOf("Enrollment", base({ user: ref("User"), course: ref("Course"), enrolledAt: { type: Date, default: Date.now }, status: { type: String, enum: ["active", "completed"], default: "active" } }));
Enrollment.schema.index({ user: 1, course: 1 }, { unique: true });
export const LearningProgress = modelOf("LearningProgress", base({ user: ref("User"), course: ref("Course"), started: { type: Boolean, default: true }, percentage: { type: Number, min: 0, max: 100, default: 0 }, completed: { type: Boolean, default: false }, lastWatchedLesson: ref("Lesson", false), completedLessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }], quizAttempts: [Schema.Types.Mixed] }));
LearningProgress.schema.index({ user: 1, course: 1 }, { unique: true });
export const Rating = modelOf("Rating", base({ user: ref("User"), contentType: { type: String, enum: ["Course", "Video", "Note"], required: true }, content: { type: Schema.Types.ObjectId, required: true }, value: { type: Number, min: 1, max: 5, required: true } }));
Rating.schema.index({ user: 1, contentType: 1, content: 1 }, { unique: true });
export const Review = modelOf("Review", base({ user: ref("User"), contentType: { type: String, enum: ["Course", "Video", "Note"], required: true }, content: { type: Schema.Types.ObjectId, required: true }, text: { type: String, required: true, maxlength: 2000 }, rating: { type: Number, min: 1, max: 5 } }));
export const Comment = modelOf("Comment", base({ user: ref("User"), contentType: { type: String, required: true }, content: { type: Schema.Types.ObjectId, required: true }, parent: ref("Comment", false), body: { type: String, required: true, maxlength: 2000 }, likes: [{ type: Schema.Types.ObjectId, ref: "User" }], reports: [Schema.Types.Mixed] }));
export const Connection = modelOf("Connection", base({ requester: ref("User"), recipient: ref("User"), status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" } }));
Connection.schema.index({ requester: 1, recipient: 1 }, { unique: true });
export const Follow = modelOf("Follow", base({ follower: ref("User"), following: ref("User") }));
Follow.schema.index({ follower: 1, following: 1 }, { unique: true });
export const Conversation = modelOf("Conversation", base({ participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }], lastMessage: ref("Message", false) }));
export const Message = modelOf("Message", base({ conversation: ref("Conversation"), sender: ref("User"), body: { type: String, required: true, maxlength: 5000 }, readBy: [{ type: Schema.Types.ObjectId, ref: "User" }] }));
export const SavedContent = modelOf("SavedContent", base({ user: ref("User"), contentType: { type: String, enum: ["Course", "Video", "Note"], required: true }, content: { type: Schema.Types.ObjectId, required: true } }));
SavedContent.schema.index({ user: 1, contentType: 1, content: 1 }, { unique: true });
export const Notification = modelOf("Notification", base({ user: ref("User"), type: { type: String, required: true }, message: { type: String, required: true }, link: String, readAt: Date }));
export const CreatorApplication = modelOf("CreatorApplication", base({ user: ref("User"), motivation: { type: String, required: true, maxlength: 2000 }, expertise: [String], status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }, reviewedBy: ref("User", false), reviewedAt: Date, decisionNote: String }));
export const Report = modelOf("Report", base({ reporter: ref("User"), targetType: { type: String, required: true }, target: { type: Schema.Types.ObjectId, required: true }, reason: { type: String, enum: ["spam", "misleading", "inappropriate", "copyright", "harassment", "wrong information", "other"], required: true }, details: String, status: { type: String, enum: ["open", "reviewing", "resolved", "dismissed"], default: "open" }, resolution: String }));


