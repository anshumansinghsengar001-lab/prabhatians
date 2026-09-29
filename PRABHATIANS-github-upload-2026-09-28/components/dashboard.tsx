"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, authApi, coursesApi, getToken, isApiConfigured, type Category, type Course, type PublicUser } from "@/src/lib/api";

type Stats = { students: number; creators: number; skills: number; courses: number; activeConnections: number };
type SkillLink = { skill: { _id: string; name: string }; intent: "know" | "learn"; level: string };
type Recommendation = { courses: Course[]; videos: Array<{ _id: string; title: string }>; recommendedCreators: PublicUser[]; peopleToLearnFrom: PublicUser[] };
const emptyStats = { students: 0, creators: 0, skills: 0, courses: 0, activeConnections: 0 };
const initials = (name?: string) => (name || "P").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [matches, setMatches] = useState<PublicUser[]>([]);
  const [skills, setSkills] = useState<SkillLink[]>([]);
  const [current, setCurrent] = useState<PublicUser | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isApiConfigured) { setLoading(false); return; }
    let live = true;
    Promise.allSettled([api<Stats>("/stats"), api<Category[]>("/categories"), coursesApi.list("?limit=12"), getToken() ? authApi.me() : Promise.resolve(null), getToken() ? api<SkillLink[]>("/users/me/skills") : Promise.resolve([]), getToken() ? api<PublicUser[]>("/matches") : Promise.resolve([]), getToken() ? api<Recommendation>("/recommendations") : Promise.resolve(null)]).then((results) => {
      if (!live) return;
      const [s, c, cr, me, sk, mt, rec] = results;
      if (s.status === "fulfilled") setStats(s.value);
      if (c.status === "fulfilled") setCategories(c.value);
      if (cr.status === "fulfilled") setCourses(cr.value.items);
      if (me.status === "fulfilled" && me.value) setCurrent(me.value.user);
      if (sk.status === "fulfilled") setSkills(sk.value);
      if (mt.status === "fulfilled") setMatches(mt.value);
      if (rec.status === "fulfilled" && rec.value?.courses?.length) setCourses(rec.value.courses);
      for (const result of results) if (result.status === "rejected") setNotice(result.reason instanceof Error ? result.reason.message : "Some community data is unavailable.");
      setLoading(false);
    });
    return () => { live = false; };
  }, []);
  function search(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const value = query.trim(); if (value) router.push(`/search?q=${encodeURIComponent(value)}`); }
  const known = skills.filter((s) => s.intent === "know");
  const learning = skills.filter((s) => s.intent === "learn");
  const displayCourses = courses.slice(0, 3);
  return <div className="dash-shell">
    <aside className="dash-sidebar"><a className="dash-brand" href="/"><img src="/prabhatians-logo.svg" alt=""/><span>PRABHATIANS<small>Connect · Learn · Share</small></span></a><nav className="dash-nav" aria-label="Dashboard"><a className="dash-active" href="/">⌂ <span>Home</span></a><a href="/profile">♙ <span>My Profile</span></a><a href="/students">♧ <span>Explore Students</span></a><a href="/profile#skills">⇄ <span>Skill Exchange</span></a><a href="/profile#matches">♡ <span>Peer Matches</span>{matches.length>0&&<b>{matches.length}</b>}</a><a href="/profile#messages">✉ <span>Messages</span></a><a href="/profile#notifications">♧ <span>Notifications</span></a><a href="/courses">▣ <span>Courses</span></a><a href="/profile#settings">⚙ <span>Settings</span></a></nav><div className="dash-sidebar-bottom"><div className="college-icon">⌂</div><span>Prabhat Engineering College<small>Learn · Grow · Build Together</small></span></div></aside>
    <main className="dash-main"><header className="dash-topbar"><form className="dash-search" onSubmit={search}><span>⌕</span><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search skills, students, topics..." aria-label="Search skills, students, topics"/><button aria-label="Search">↵</button></form><div className="dash-top-actions"><a className="dash-bell" href="/profile#notifications" aria-label="Notifications">♧<i /></a>{current?<button className="dash-user" onClick={()=>router.push("/profile")}><span className="dash-user-avatar">{initials(current.fullName)}</span><span>{current.fullName}</span>⌄</button>:<a className="dash-login-link" href="/login">Sign in</a>}</div></header>
      <div className="dash-content"><div className="dash-primary"><section className="campus-banner" role="img" aria-label="Welcome to Prabhatians. Connect, learn and share at Prabhat Engineering College."/>
        <section className="stat-grid" aria-label="Community statistics"><Stat icon="♧" value={stats.students} label="Total Students" color="stat-cyan"/><Stat icon="✿" value={stats.skills} label="Skills Listed" color="stat-green"/><Stat icon="♧" value={stats.activeConnections} label="Active Connections" color="stat-purple"/><Stat icon="▣" value={stats.courses} label="Learning Courses" color="stat-amber"/></section>
        <section className="dash-panel skill-panel" id="skills"><div className="dash-panel-title"><h2>✦ Your Skill Profile</h2><a href="/profile#skills">Edit skills <span>↗</span></a></div><div className="skill-columns"><SkillColumn icon="✓" title="Skills You Know" color="green" skills={known}/><SkillColumn icon="◧" title="Currently Learning" color="blue" skills={skills.filter((s)=>s.intent==="know")}/><SkillColumn icon="◎" title="Want to Learn" color="purple" skills={learning}/></div>{!current&&<div className="dash-inline-note"><a href="/login">Sign in</a> to add your skills and get matched with peers.</div>}</section>
        <section className="dash-panel match-panel" id="matches"><div className="dash-panel-title"><div><h2>Recommended Matches</h2><p>People with skills you want to learn</p></div><a href="/students">Explore students →</a></div>{matches.length?<div className="match-grid">{matches.slice(0,3).map((person)=><article className="match-card" key={person._id}><div className="match-person"><span className="match-avatar">{initials(person.fullName)}</span><span><strong>{person.fullName}</strong><small>{person.year?`${person.year}${person.year===1?"st":person.year===2?"nd":person.year===3?"rd":"th"} Year`:"Student"} · {person.branch||"Prabhat"}</small></span></div><p>Can help you learn your selected skills.</p><button onClick={()=>api("/connections/request",{method:"POST",body:JSON.stringify({recipientId:person._id})}).then(()=>setNotice("Connection request sent.")).catch((e)=>setNotice(e.message))}>Connect <span>→</span></button></article>)}</div>:<div className="dash-empty">{current?"Add a skill you want to learn to find peer matches.":<><a href="/login">Sign in</a> to see peers matched to your learning goals.</>}</div>}</section>
        <section className="dash-callout"><div><span>✦</span><h2>Let’s build a stronger<br/>Prabhatians community!</h2><p>Share your skills, help others and grow together.</p></div><a href="/students">Explore students →</a></section></div>
        <aside className="dash-right"><section className="profile-card"><div className="profile-card-head"><span className="profile-avatar">{initials(current?.fullName)}</span><span><strong>{current?.fullName||"Welcome, learner"}</strong><small>{current?`${current.year||""}${current.year?" Year · ":""}${current.branch||"Student"}`:"Prabhat Engineering College"}</small><small>Prabhat Engineering College</small></span></div><div className="profile-quote">“Better skills. Better opportunities.<br/>A stronger Prabhatians community.”</div><div className="skill-glance"><strong>Your Skills at a Glance</strong><div><Glance value={known.length} label="Skills You Know" color="green"/><Glance value={skills.filter((s)=>s.intent==="learn").length} label="Learning" color="blue"/><Glance value={learning.length} label="Want to Learn" color="purple"/><Glance value={known.length} label="Can Help" color="amber"/></div></div>{current?<a className="profile-edit" href="/profile">✎ Edit Profile</a>:<a className="profile-edit" href="/signup">Create profile ↗</a>}</section>
          <section className="dash-panel quick-actions"><h2>✦ Quick Actions</h2><div><Quick href="/profile" icon="♙" label="Update Profile" hint="Add or edit your skills"/><Quick href="/students" icon="♧" label="Explore Students" hint="Find peers by skills"/><Quick href="/profile#matches" icon="◎" label="Find Peers" hint="Connect and learn together"/><Quick href="/profile#skills" icon="✚" label="Share a Skill" hint="Become a creator"/></div></section>
          <section className="dash-panel rec-courses"><div className="dash-panel-title"><h2>Courses to Explore</h2><a href="/courses">View all →</a></div>{displayCourses.length?displayCourses.map((course)=><a className="mini-course" href={`/courses/${course._id}`} key={course._id}><span className="mini-course-icon">▣</span><span><strong>{course.title}</strong><small>{course.difficulty} · ★ {course.averageRating||"New"}</small></span></a>):<p className="dash-empty">{loading?"Loading courses…":"Courses will appear here when creators publish them."}</p>}</section>
          <section className="dash-panel topics-panel"><div className="dash-panel-title"><h2>Explore Skills</h2><a href="/search">Search →</a></div><div className="topic-chips">{categories.slice(0,8).map((category)=><a key={category._id} href={`/search?q=${encodeURIComponent(category.name)}`}>{category.name}</a>)}</div>{!categories.length&&<p className="dash-empty">{loading?"Loading topics…":"Topics will appear as they are added."}</p>}</section>
        </aside></div>{notice&&<div className="dash-toast" role="status"><span>{notice}</span><button onClick={()=>setNotice("")}>×</button></div>}
    </main></div>;
}
function Stat({icon,value,label,color}:{icon:string;value:number;label:string;color:string}){return <article className="stat-card"><span className={`stat-icon ${color}`}>{icon}</span><span><strong>{value.toLocaleString()}</strong><small>{label}</small></span></article>}
function SkillColumn({icon,title,color,skills}:{icon:string;title:string;color:string;skills:SkillLink[]}){return <div className={`skill-column skill-${color}`}><div><span>{icon}</span><strong>{title}</strong><b>{skills.length}</b></div><div className="skill-tags">{skills.length?skills.slice(0,8).map((s)=><span key={`${s.skill._id}-${s.intent}`}>{s.skill.name}</span>):<small>Add skills from your profile</small>}</div></div>}
function Glance({value,label,color}:{value:number;label:string;color:string}){return <div><strong className={`glance-${color}`}>{value}</strong><small>{label}</small></div>}
function Quick({href,icon,label,hint}:{href:string;icon:string;label:string;hint:string}){return <a className="quick-item" href={href}><span>{icon}</span><span><strong>{label}</strong><small>{hint}</small></span><b>→</b></a>}
