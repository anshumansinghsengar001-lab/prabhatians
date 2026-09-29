type SectionHeadingProps = { eyebrow: string; title: string; description: string; action: string };

export function Navbar() {
  return <header className="navbar" id="top"><div className="container nav-inner"><a href="#top" className="brand" aria-label="PRABHATIANS home"><span className="brand-mark">P<span>.</span></span><span className="brand-name">PRABHATIANS<small>STUDENT LEARNING COMMUNITY</small></span></a><nav className="desktop-nav" aria-label="Main navigation"><a className="nav-active" href="#explore">Explore</a><a href="#explore">Courses</a><a href="#creators">Creators</a><a href="#why">About us</a></nav><div className="nav-actions"><a className="nav-signin" href="#join">Sign in</a><a className="nav-join" href="#join">Join the community <span>↗</span></a></div><details className="mobile-menu"><summary aria-label="Open navigation menu"><span /><span /><span /></summary><nav><a href="#explore">Explore</a><a href="#explore">Courses</a><a href="#creators">Creators</a><a href="#why">About us</a><a href="#join">Sign in</a><a href="#join" className="mobile-join">Join the community ↗</a></nav></details></div></header>;
}

export function SectionHeading({ eyebrow, title, description, action }: SectionHeadingProps) {
  return <div className="section-heading"><div><div className="section-eyebrow">{eyebrow}</div><h2>{title}</h2><p>{description}</p></div><a href="#explore" className="text-link">{action} <span>→</span></a></div>;
}

export function CategoryCard({ icon, name, count, tone }: { icon: string; name: string; count: string; tone: string }) {
  return <a href="#explore" className="category-card"><span className={`category-icon ${tone}`}>{icon}</span><span className="category-label"><strong>{name}</strong><small>{count}</small></span><span className="card-arrow">↗</span></a>;
}

type CourseProps = { title: string; author: string; initials: string; category: string; lessons: string; duration: string; rating: string; color: string; artwork: string };
export function CourseCard({ title, author, initials, category, lessons, duration, rating, color, artwork }: CourseProps) {
  return <article className="course-card"><a href="#explore" className={`course-cover ${color}`}><span className="cover-label">{category}</span><span className="cover-art">{artwork}</span><span className="cover-sticker">✳</span></a><div className="course-body"><div className="course-meta"><span>{lessons}</span><i /><span>{duration}</span><span className="rating">★ {rating}</span></div><h3><a href="#explore">{title}</a></h3><div className="course-author"><span className="author-avatar">{initials}</span><span>By <strong>{author}</strong></span><span className="course-open">↗</span></div></div></article>;
}

type CreatorProps = { name: string; initials: string; field: string; shares: string; tone: string };
export function CreatorCard({ name, initials, field, shares, tone }: CreatorProps) {
  return <article className="creator-card"><div className={`creator-avatar ${tone}`}>{initials}<span className="creator-spark">✦</span></div><span className="creator-badge">✦ COMMUNITY CREATOR</span><h3>{name}</h3><p>{field}</p><div className="creator-foot"><span>↗ &nbsp;{shares}</span><a href="#creators" aria-label={`View ${name}'s profile`}>View profile <span>→</span></a></div></article>;
}

export function Footer() {
  return <footer className="footer" id="join"><div className="container"><div className="footer-main"><div className="footer-brand"><a href="#top" className="brand"><span className="brand-mark">P<span>.</span></span><span className="brand-name">PRABHATIANS<small>STUDENT LEARNING COMMUNITY</small></span></a><p>Learning is better when it’s shared.<br />Built with care at Prabhat Engineering College.</p><span className="footer-tagline">CONNECT <i>•</i> LEARN <i>•</i> SHARE</span></div><div className="footer-links"><div><strong>Discover</strong><a href="#explore">Explore topics</a><a href="#explore">Courses</a><a href="#creators">Creators</a></div><div><strong>Community</strong><a href="#why">Our story</a><a href="#join">Become a creator</a><a href="#join">Get in touch</a></div></div><div className="footer-note"><span className="footer-mark">✳</span><span>One campus.<br />A thousand things<br />to learn.</span></div></div><div className="footer-bottom"><span>© 2026 PRABHATIANS · Prabhat Engineering College</span><span>Made for curious minds <i>♥</i></span></div></div></footer>;
}
