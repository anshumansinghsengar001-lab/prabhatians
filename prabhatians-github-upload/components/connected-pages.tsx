"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api, authApi, commentsApi, coursesApi, getToken, progressApi, profileApi, ratingsApi, savedApi, searchApi, type Category, type Course, type PublicUser } from "@/src/lib/api";

type Skill = { _id: string; name: string; category?: string };
type SkillLink = { _id: string; skill: Skill; intent: "know" | "learn"; level: string };
type Notice = { _id: string; message: string; type: string; link?: string; readAt?: string; createdAt?: string };
type Comment = { _id: string; body: string; user: { fullName: string }; parent?: string | null; createdAt?: string; likes?: string[] };
const initials = (name = "P") => name.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
function Frame({ title, children, back = "Home" }: { title: string; children: React.ReactNode; back?: string }) { return <main className="content-page"><header className="content-header"><a className="auth-brand" href="/"><img src="/prabhatians-logo.svg" alt=""/><span>PRABHATIANS<small>Connect · Learn · Share</small></span></a><a href="/">← {back}</a></header><div className="content-wrap"><div className="content-card"><span className="auth-eyebrow">PRABHAT ENGINEERING COLLEGE</span><h1>{title}</h1>{children}</div></div></main>; }
function Message({ value, error = false }: { value: string; error?: boolean }) { return value ? <p className={error ? "auth-error" : "dash-inline-note"} role="status">{value}</p> : null; }
function CourseCards({ items }: { items: Course[] }) { return <div className="result-grid">{items.map((course) => <article className="result-card" key={course._id}><small>{typeof course.category === "string" ? "Course" : course.category?.name || "Course"} · {course.difficulty}</small><h3><a href={`/courses/${course._id}`}>{course.title}</a></h3><p>{course.description}</p><small>★ {course.averageRating ? course.averageRating.toFixed(1) : "New"} · {course.enrollmentCount} learners · {course.duration || 0} min</small></article>)}</div>; }

export function SearchPage() {
  const [q, setQ] = useState(""); const [type, setType] = useState("all"); const [results, setResults] = useState<Record<string, unknown>>({}); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const run = useCallback(async (query: string, kind: string) => { if (query.trim().length < 2) { setResults({}); return; } setBusy(true); setError(""); try { setResults(await searchApi(query.trim(), kind)); } catch (e) { setError(e instanceof Error ? e.message : "Search failed."); } finally { setBusy(false); } }, []);
  useEffect(() => { const initial = new URLSearchParams(window.location.search).get("q") || ""; setQ(initial); void run(initial, type); }, [run, type]);
  function submit(e: FormEvent) { e.preventDefault(); const url = new URL(window.location.href); url.searchParams.set("q", q); window.history.replaceState({}, "", url); void run(q, type); }
  const sectionLabels: Record<string, string> = { courses: "Courses", videos: "Videos", notes: "Notes", users: "Students", skills: "Skills", categories: "Categories" };
  return <Frame title="Search the learning community"><form className="connected-search" onSubmit={submit}><input className="content-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses, videos, students, skills…"/><select className="content-input" value={type} onChange={(e) => setType(e.target.value)}><option value="all">Everything</option><option value="courses">Courses</option><option value="videos">Videos</option><option value="notes">Notes</option><option value="users">Students</option><option value="skills">Skills</option></select><button className="content-btn">Search</button></form><Message value={error} error/><p className="content-muted">{busy ? "Searching…" : q.length > 1 ? `Results for “${q}”` : "Enter at least two characters to search."}</p>{Object.entries(results).map(([kind, raw]) => { const rows = Array.isArray(raw) ? raw as Array<Record<string, unknown>> : []; if (!rows.length) return null; return <section className="profile-section" key={kind}><h2 className="connected-heading">{sectionLabels[kind] || kind}</h2>{kind === "courses" ? <CourseCards items={rows as unknown as Course[]}/> : <div className="result-grid">{rows.map((row) => <article className="result-card" key={String(row._id)}><small>{String(row.role || kind)}</small><h3>{String(row.fullName || row.title || row.name || "")}</h3>{Boolean(row.description) && <p>{String(row.description)}</p>}{kind === "users" && <a className="content-btn" href="/students">Explore students</a>}</article>)}</div>}</section>; })}</Frame>;
}

export function CoursesPage() {
  const [items, setItems] = useState<Course[]>([]); const [q, setQ] = useState(""); const [difficulty, setDifficulty] = useState(""); const [category, setCategory] = useState(""); const [categories, setCategories] = useState<Category[]>([]); const [error, setError] = useState("");
  const load = useCallback(async () => { try { const p = new URLSearchParams(); if (q.trim()) p.set("q", q.trim()); if (difficulty) p.set("difficulty", difficulty); if (category) p.set("category", category); const [data, cats] = await Promise.all([coursesApi.list(p.size ? `?${p}` : ""), api<Category[]>("/categories")]); setItems(data.items); setCategories(cats); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Could not load courses."); } }, [q, difficulty, category]);
  useEffect(() => { void load(); }, [load]);
  return <Frame title="Explore courses"><form className="connected-search" onSubmit={(e) => { e.preventDefault(); void load(); }}><input className="content-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a course"/><select className="content-input" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{categories.map((x) => <option value={x._id} key={x._id}>{x.name}</option>)}</select><select className="content-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="">All levels</option>{["beginner", "intermediate", "advanced"].map((x) => <option key={x}>{x}</option>)}</select><button className="content-btn">Filter</button></form><Message value={error} error/><p className="content-muted">{items.length} published course{items.length === 1 ? "" : "s"}</p>{items.length ? <CourseCards items={items}/> : <p className="content-muted">No courses match these filters yet.</p>}</Frame>;
}

export function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<{ course: Course; modules: Array<{ _id: string; title: string; description?: string; lessons: Array<{ _id: string; title: string; content?: string; duration?: number }> }> } | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [progress, setProgress] = useState<{ started: boolean; percentage: number; completed: boolean; completedLessons: string[] }>({ started: false, percentage: 0, completed: false, completedLessons: [] });
  const [rating, setRating] = useState(0);
  const [myRatingId, setMyRatingId] = useState("");
  const [ratingSummary, setRatingSummary] = useState({ average: 0, count: 0 });
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const authenticated = Boolean(getToken());

  const load = useCallback(async () => {
    try {
      const [course, commentRows, ratings] = await Promise.all([
        coursesApi.get(id), commentsApi.list("Course", id), ratingsApi.list(id, "Course"),
      ]);
      setData(course);
      setComments(commentRows as unknown as Comment[]);
      setRatingSummary({ average: ratings.average, count: ratings.count });
      if (getToken()) {
        const me = await authApi.me();
        const mine = ratings.items.find((row) => String((row.user as { _id?: string })?._id || row.user) === me.user._id);
        if (mine) { setRating(Number(mine.value)); setMyRatingId(String(mine._id)); }
        setProgress(await progressApi.get(id));
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load this course."); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  async function enroll() {
    setBusy(true); setError("");
    try { await coursesApi.enroll(id); setMessage("You are enrolled. Your progress will be saved as you learn."); setProgress((x) => ({ ...x, started: true })); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not enroll."); }
    finally { setBusy(false); }
  }
  async function completeLesson(lessonId: string) {
    if (!authenticated) { setError("Sign in to track your learning progress."); return; }
    const completedLessons = progress.completedLessons.includes(lessonId) ? progress.completedLessons.filter((x) => x !== lessonId) : [...progress.completedLessons, lessonId];
    const total = data?.modules.reduce((n, m) => n + m.lessons.length, 0) || 0;
    const percentage = total ? Math.round(100 * completedLessons.length / total) : 0;
    try {
      const savedProgress = await progressApi.update(id, { completedLessons, percentage, completed: percentage === 100, lastWatchedLesson: lessonId });
      setProgress({ started: savedProgress.started, percentage: savedProgress.percentage, completed: savedProgress.completed, completedLessons: savedProgress.completedLessons });
      setMessage("Learning progress saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Progress could not be saved."); }
  }
  async function comment(e: FormEvent) {
    e.preventDefault(); if (!body.trim()) return;
    try { await commentsApi.add("Course", id, body); setBody(""); setMessage("Comment posted."); setComments(await commentsApi.list("Course", id) as unknown as Comment[]); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not post your comment."); }
  }
  async function rate(value: number) {
    if (!authenticated) { setError("Sign in to rate this course."); return; }
    try {
      if (myRatingId) await ratingsApi.update(myRatingId, value);
      else { const created = await ratingsApi.add("Course", id, value) as { _id: string }; setMyRatingId(created._id); }
      setRating(value);
      const current = await ratingsApi.list(id, "Course");
      setRatingSummary({ average: current.average, count: current.count });
      setMessage("Thanks for rating this course.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save rating."); }
  }
  async function save() {
    if (!authenticated) { setError("Sign in to save this course."); return; }
    try { await savedApi.add("Course", id); setMessage("Course saved to your library."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save course."); }
  }
  if (!data) return <Frame title="Course details"><Message value={error || "Loading course…"} error={Boolean(error)}/></Frame>;

  return (
    <Frame title={data.course.title} back="Courses">
      <div className="content-layout">
        <section>
          <p className="content-muted">{data.course.description}</p>
          <div className="course-meta">
            <span>{data.course.difficulty}</span><span>{data.course.duration} min</span>
            <span>★ {ratingSummary.average.toFixed(1)} ({ratingSummary.count} ratings)</span>
            <span>{data.course.enrollmentCount} learners</span>
          </div>
          <div className="content-actions">
            <button className="content-btn" disabled={busy || !authenticated} onClick={enroll}>{authenticated ? (busy ? "Enrolling…" : "Enroll in course") : "Sign in to enroll"}</button>
            <button className="content-secondary-btn" onClick={save}>Save course</button>
          </div>
          {!authenticated && <p className="content-muted"><a href="/login">Sign in</a> to enroll and track progress.</p>}
          {progress.started && <section className="profile-section"><h2 className="connected-heading">Your progress · {progress.percentage}%</h2><div className="content-progress"><span style={{ width: `${progress.percentage}%` }}/></div></section>}
          <section className="profile-section">
            <h2 className="connected-heading">Course content</h2>
            {data.modules.map((module) => (
              <article className="module-card" key={module._id}>
                <h3>{module.title}</h3>{module.description && <p className="content-muted">{module.description}</p>}
                {module.lessons.map((lesson) => (
                  <label className="lesson-row" key={lesson._id}>
                    <input type="checkbox" checked={progress.completedLessons.includes(lesson._id)} onChange={() => void completeLesson(lesson._id)}/>
                    <span><strong>{lesson.title}</strong>{lesson.content && <small>{lesson.content}</small>}</span>
                    <small>{lesson.duration ? `${lesson.duration} min` : "Lesson"}</small>
                  </label>
                ))}
              </article>
            ))}
          </section>
          <section className="profile-section">
            <h2 className="connected-heading">Comments</h2>
            {authenticated ? <form onSubmit={comment} className="comment-form"><textarea className="content-input" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share a useful comment…"/><button className="content-btn">Post comment</button></form> : <p className="content-muted"><a href="/login">Sign in</a> to comment.</p>}
            {comments.filter((x) => !x.parent).map((item) => <article className="content-comment" key={item._id}><strong>{item.user?.fullName || "Student"}</strong><p>{item.body}</p></article>)}
            {!comments.length && <p className="content-muted">No comments yet. Start the discussion.</p>}
          </section>
        </section>
        <aside className="content-side">
          <section className="content-card"><h2 className="connected-heading">Rate this course</h2><div className="rating-stars" aria-label="Rate from one to five">{[1, 2, 3, 4, 5].map((n) => <button key={n} aria-label={`${n} stars`} className={n <= rating ? "selected" : ""} onClick={() => void rate(n)}>★</button>)}</div><p className="content-muted">Your rating helps other students choose.</p></section>
          <section className="content-card"><h2 className="connected-heading">What you’ll learn</h2>{data.course.tags.map((tag) => <span className="skill-pill" key={tag}>{tag}</span>)}</section>
        </aside>
      </div>
      <Message value={message}/><Message value={error} error/>
    </Frame>
  );
}
export function ProfilePage() {
  const [user, setUser] = useState<PublicUser | null>(null); const [fullName, setFullName] = useState(""); const [branch, setBranch] = useState(""); const [year, setYear] = useState("1"); const [interests, setInterests] = useState(""); const [bio, setBio] = useState(""); const [skills, setSkills] = useState<SkillLink[]>([]); const [catalog, setCatalog] = useState<Skill[]>([]); const [chosen, setChosen] = useState(""); const [intent, setIntent] = useState<"know" | "learn">("know"); const [notifications, setNotifications] = useState<Notice[]>([]); const [saved, setSaved] = useState<Array<{ saved: { _id: string; contentType: string }; content: Course | null }>>([]); const [mine, setMine] = useState<Array<{ course: Course; status: string }>>([]); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const load = useCallback(async () => { if (!getToken()) { setError("Sign in to view and update your profile."); return; } try { const [me, sk, skillList, noteList, savedRows, enrollments] = await Promise.all([authApi.me(), api<SkillLink[]>("/users/me/skills"), api<Skill[]>("/skills"), profileApi.notifications(), savedApi.list(), coursesApi.mine()]); setUser(me.user); setFullName(me.user.fullName); setBranch(me.user.branch || ""); setYear(String(me.user.year || 1)); setInterests((me.user.interests || []).join(", ")); setBio(String(me.profile?.bio || "")); setSkills(sk); setCatalog(skillList); setNotifications(noteList as unknown as Notice[]); setSaved(savedRows as unknown as typeof saved); setMine(enrollments as unknown as typeof mine); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Could not load profile."); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function saveProfile(e: FormEvent) { e.preventDefault(); try { await profileApi.update({ fullName, branch, year: Number(year), interests: interests.split(",").map((x) => x.trim()).filter(Boolean), bio }); setMessage("Profile updated."); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Could not update profile."); } }
  async function addSkill(e: FormEvent) { e.preventDefault(); if (!chosen) return; try { await api("/users/me/skills", { method: "POST", body: JSON.stringify({ skillId: chosen, intent, level: "beginner" }) }); setChosen(""); setMessage("Skill added to your profile."); setSkills(await api<SkillLink[]>("/users/me/skills")); } catch (e) { setError(e instanceof Error ? e.message : "Could not add skill."); } }
  async function readNotice(id: string) { try { await api(`/notifications/${id}/read`, { method: "POST" }); setNotifications((rows) => rows.map((x) => x._id === id ? { ...x, readAt: new Date().toISOString() } : x)); } catch (e) { setError(e instanceof Error ? e.message : "Could not update notification."); } }
  async function removeSaved(id: string) { try { await savedApi.remove(id); setSaved((rows) => rows.filter((x) => x.saved._id !== id)); } catch (e) { setError(e instanceof Error ? e.message : "Could not remove saved item."); } }
  return <Frame title="My profile"><Message value={error} error/><Message value={message}/>{!user && !error ? <p className="content-muted">Loading profile…</p> : null}{user && <><section className="profile-section"><h2 className="connected-heading">Profile details</h2><form className="profile-form" onSubmit={saveProfile}><label className="profile-field">Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)}/></label><label className="profile-field">Branch<input value={branch} onChange={(e) => setBranch(e.target.value)}/></label><label className="profile-field">Year<select value={year} onChange={(e) => setYear(e.target.value)}>{[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n}</option>)}</select></label><label className="profile-field">Interests (comma separated)<input value={interests} onChange={(e) => setInterests(e.target.value)}/></label><label className="profile-field profile-wide">About me<textarea value={bio} onChange={(e) => setBio(e.target.value)}/></label><button className="content-btn">Save profile</button></form></section><section className="profile-section" id="skills"><h2 className="connected-heading">Skills I know and want to learn</h2><form className="connected-search" onSubmit={addSkill}><select className="content-input" value={chosen} onChange={(e) => setChosen(e.target.value)}><option value="">Choose a skill</option>{catalog.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select><select className="content-input" value={intent} onChange={(e) => setIntent(e.target.value as "know" | "learn")}><option value="know">I know this</option><option value="learn">I want to learn</option></select><button className="content-btn">Add skill</button></form><div className="skill-link-list">{skills.map((s) => <span className="skill-pill" key={s._id}>{s.skill?.name} · {s.intent} · {s.level}</span>)}</div></section><section className="profile-section"><h2 className="connected-heading">My courses</h2>{mine.length ? <CourseCards items={mine.map((x) => x.course).filter(Boolean)}/> : <p className="content-muted">Your enrolled courses will show here.</p>}</section><section className="profile-section" id="saved"><h2 className="connected-heading">Saved content</h2><div className="result-grid">{saved.filter((x) => x.content).map((x) => <article className="result-card" key={x.saved._id}><small>{x.saved.contentType}</small><h3>{x.content?.title}</h3><button className="content-secondary-btn" onClick={() => void removeSaved(x.saved._id)}>Remove</button></article>)}</div>{!saved.length && <p className="content-muted">Save courses to find them here.</p>}</section><section className="profile-section" id="notifications"><h2 className="connected-heading">Notifications</h2>{notifications.map((n) => <article className={`notification-row ${n.readAt ? "" : "unread"}`} key={n._id}><div><strong>{n.message}</strong><small>{n.type.replaceAll("_", " ")} · {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}</small></div>{!n.readAt && <button className="content-secondary-btn" onClick={() => void readNotice(n._id)}>Mark read</button>}{n.link && <a href={n.link}>Open →</a>}</article>)}{!notifications.length && <p className="content-muted">You’re all caught up.</p>}</section></>}</Frame>;
}

export function StudentsPage() {
  const [students, setStudents] = useState<PublicUser[]>([]); const [q, setQ] = useState(""); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const load = useCallback(async (query = "") => { try { const rows = query.trim().length > 1 ? await searchApi(query, "users") : await api<PublicUser[]>("/users?limit=50"); const selected = Array.isArray(rows) ? rows : (rows.users as PublicUser[] || []); setStudents(selected); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Could not load students."); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function connect(id: string) { if (!getToken()) { setError("Sign in to send a connection request."); return; } try { await api("/connections/request", { method: "POST", body: JSON.stringify({ recipientId: id }) }); setMessage("Connection request sent."); } catch (e) { setError(e instanceof Error ? e.message : "Could not send request."); } }
  return <Frame title="Explore students"><form className="connected-search" onSubmit={(e) => { e.preventDefault(); void load(q); }}><input className="content-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people by name"/><button className="content-btn">Search</button></form><Message value={error} error/><Message value={message}/><div className="students-list">{students.filter((x) => x._id !== (typeof window === "undefined" ? "" : "")).map((student) => <article className="student-card" key={student._id}><span className="match-avatar">{initials(student.fullName)}</span><strong>{student.fullName}</strong><small>{student.year ? `${student.year}${student.year === 1 ? "st" : student.year === 2 ? "nd" : student.year === 3 ? "rd" : "th"} year` : "Student"} · {student.branch || "Prabhat Engineering College"}</small><button className="content-btn" onClick={() => void connect(student._id)}>Connect →</button></article>)}</div>{!students.length && <p className="content-muted">No students found.</p>}</Frame>;
}

