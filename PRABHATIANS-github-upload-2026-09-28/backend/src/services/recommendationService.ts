import { Course, Video, User, UserSkill, Skill, Enrollment, LearningProgress, SavedContent, Rating, Category, Follow } from "../models";

const words = (value: string | undefined) => (value || "").toLowerCase().split(/[\s,;|/]+/).filter((x) => x.length > 1).slice(0, 40);
function scoreText(text: string, terms: string[]): number { const lower = text.toLowerCase(); return terms.reduce((sum, term) => sum + (lower.includes(term) ? Math.min(4, 1 + term.length / 5) : 0), 0); }

export async function recommendationsFor(userId: string) {
  const [user, wanted, known, enrollments, progress, saved, ratings, following] = await Promise.all([
    User.findById(userId), UserSkill.find({ user: userId, intent: "learn" }).populate("skill", "name"), UserSkill.find({ user: userId, intent: "know" }).populate("skill", "name"), Enrollment.find({ user: userId }).populate("course", "category difficulty"),
    LearningProgress.find({ user: userId }), SavedContent.find({ user: userId }), Rating.find({ user: userId, value: { $gte: 4 } }), Follow.find({ follower: userId }).distinct("following"),
  ]);
  const learningTerms = wanted.filter((x) => x.intent === "learn").flatMap((x) => words((x.skill as unknown as {name:string})?.name));
  const knownTerms = known.filter((x) => x.intent === "know").flatMap((x) => words((x.skill as unknown as {name:string})?.name));
  const interests = words(user?.interests?.join(" "));
  const terms = [...new Set([...learningTerms, ...interests])];
  const categories = new Set<string>();
  for (const row of enrollments) { const c = row.course as unknown as {category?:unknown}; if (c?.category) categories.add(String(c.category)); }
  const highRated = ratings.filter((x) => ["Course", "Video", "Note"].includes(x.contentType));
  for (const rating of highRated) {
    const Model = rating.contentType === "Course" ? Course : rating.contentType === "Video" ? Video : (await import("../models")).Note;
    const content = await Model.findById(rating.content).select("category"); if (content?.category) categories.add(String(content.category));
  }
  for (const item of saved) {
    const Model = item.contentType === "Course" ? Course : item.contentType === "Video" ? Video : (await import("../models")).Note;
    const content = await Model.findById(item.content).select("category"); if (content?.category) categories.add(String(content.category));
  }
  const enrolledIds = enrollments.map((x) => String((x.course as unknown as {_id:unknown})?._id || x.course));
  const completedIds = progress.filter((x) => x.completed).map((x) => String(x.course));
  const allExcluded = new Set([...enrolledIds, ...completedIds]);
  const completedCount = completedIds.length;
  const nextDifficulty = completedCount >= 5 ? "advanced" : completedCount >= 2 ? "intermediate" : "beginner";
  const difficultyRank: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
  const [courses, videos, creators, peopleIds] = await Promise.all([
    Course.find({ published: true, _id: { $nin: [...allExcluded] } }).populate("creator", "fullName branch year").populate("category", "name").limit(100),
    Video.find({ published: true }).populate("creator", "fullName branch year").populate("category", "name").limit(100),
    User.find({ role: "creator", isActive: true, _id: { $ne: userId, $nin: following } }).select("fullName branch year interests").limit(100),
    UserSkill.find({ skill: { $in: wanted.filter((x) => x.intent === "learn").map((x) => x.skill) }, intent: "know", user: { $ne: userId } }).distinct("user"),
  ]);
  const categoryNames = categories.size ? await Category.find({ _id: { $in: [...categories] } }).distinct("name") : [];
  const preferenceTerms = [...terms, ...words(categoryNames.join(" "))];
  const courseScore = (course: any) => scoreText(`${course.title} ${course.description} ${(course.tags || []).join(" ")}`, preferenceTerms) + (categories.has(String(course.category?._id || course.category)) ? 4 : 0) + (course.averageRating || 0) * 0.35 - Math.abs((difficultyRank[course.difficulty] ?? 0) - (difficultyRank[nextDifficulty] ?? 0)) * 1.5;
  const videoScore = (video: any) => scoreText(`${video.title} ${video.description} ${(video.tags || []).join(" ")}`, preferenceTerms) + (categories.has(String(video.category?._id || video.category)) ? 3 : 0) + (video.averageRating || 0) * 0.25;
  const recommendedCourses = courses.sort((a, b) => courseScore(b) - courseScore(a)).slice(0, 8);
  const recommendedVideos = videos.sort((a, b) => videoScore(b) - videoScore(a)).slice(0, 6);
  const creatorIds = [...new Set(recommendedCourses.map((course: any) => String(course.creator?._id || course.creator)))];
  const recommendedCreators = creators.sort((a: any, b: any) => scoreText(`${b.fullName} ${(b.interests || []).join(" ")} ${b.branch}`, preferenceTerms) - scoreText(`${a.fullName} ${(a.interests || []).join(" ")} ${a.branch}`, preferenceTerms)).slice(0, 6);
  const creatorsByCourse = await User.find({ _id: { $in: creatorIds }, role: "creator", isActive: true }).select("fullName branch year");
  const mergedCreators = [...creatorsByCourse, ...recommendedCreators.filter((x: any) => !creatorIds.includes(String(x._id)))].slice(0, 6);
  const peopleToLearnFrom = await User.find({ _id: { $in: peopleIds }, isActive: true }).select("fullName branch year role").limit(6);
  return { courses: recommendedCourses, videos: recommendedVideos, recommendedCreators: mergedCreators, peopleToLearnFrom };
}
