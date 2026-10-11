import ThemeToggle from '../components/theme-toggle';
import Link from 'next/link';
import './landing.css';

function Mark() {
  return <span className="brand-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M6 7h5c3 0 5 1 5 3v16c0-3-2-4-5-4H6V7Zm20 0h-5c-3 0-5 1-5 3v16c0-3 2-4 5-4h5V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg></span>;
}
const features = [
  { number: '01', title: 'Everything has a home.', text: 'Group tasks by subject, set a deadline, and see what needs your attention. Fewer scattered notes. A clearer next step.', label: 'SUBJECTS & DEADLINES' },
  { number: '02', title: 'Make the week feel lighter.', text: 'Give your study sessions a place in your week. See upcoming requirements alongside the time you set aside to work.', label: 'WEEKLY PLANNING' },
  { number: '03', title: 'Pick up where you left off.', text: 'Your planner saves to your account. Open it on your phone or laptop, and keep your coursework together.', label: 'SAVED ACROSS DEVICES' },
];

export default function Home() {
  return <div className="landing-page">
    <a className="landing-skip" href="#main">Skip to content</a>
    <header className="landing-header">
      <Link href="/" className="landing-brand" aria-label="StudyTrack home"><Mark />StudyTrack<span className="brand-dot">.</span></Link>
      <nav aria-label="Main navigation"><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#get-started">Get started</a></nav>
      <div className="landing-header-actions"><ThemeToggle /><a href="/google-sign-in" className="nav-sign-in">Open planner <span aria-hidden="true">↗</span></a></div>
    </header>
    <main id="main">
      <section className="landing-hero">
        <div className="hero-editorial">
          <p className="landing-eyebrow"><span /> A LITTLE STRUCTURE. MORE HEADSPACE.</p>
          <h1>A clearer week.<br />A calmer mind.<br /><em>Find your own<br />study rhythm.</em></h1>
          <p className="landing-lead">Bring your subjects, deadlines, and study time into one thoughtful space. Less to juggle. More room for the things that matter.</p>
          <div className="landing-hero-actions"><a className="landing-button primary" href="/google-sign-in">Start your free planner <span aria-hidden="true">↗</span></a><a className="landing-text-link" href="#features">Take a look around <span aria-hidden="true">↓</span></a></div>
          <p className="landing-small">Free to get started. Sign in with Google.</p>
          <div className="hero-footnote"><span className="tiny-star" aria-hidden="true">✳</span><p>A little progress counts.<br /><strong>One task, one day, one week at a time.</strong></p></div>
        </div>
        <div className="preview-scene" role="img" aria-label="Sample StudyTrack planner showing three tasks, a weekly study plan, and 75 percent progress. These are illustrative sample tasks.">
          <div className="preview-label">YOUR WEEK, WITH A LITTLE MORE CLARITY <span aria-hidden="true">↘</span></div>
          <div className="planner-preview">
            <div className="preview-top"><span className="preview-logo"><Mark />StudyTrack</span><span className="preview-avatar">ST</span></div>
            <div className="preview-body"><div className="preview-workspace-heading"><div><p>OVERVIEW</p><h2>Your week in focus.</h2></div><span>+ NEW TASK</span></div><div className="preview-greeting"><p>A LITTLE PROGRESS EVERY DAY</p><h2>75<span>%</span></h2><span>Three steps closer to a lighter week.</span><div className="preview-progress"><i /></div></div>
              <div className="preview-stats"><div><span>ON YOUR LIST</span><strong>04 <small>tasks</small></strong></div><div><span>PLANNED THIS WEEK</span><strong>03 <small>study blocks</small></strong></div></div>
              <div className="preview-tasks"><div className="preview-section-heading"><strong>Your next steps</strong><span>View all ↗</span></div>
                <div className="preview-task"><span className="sample-check checked">✓</span><div><strong className="sample-done">Read chapter 3</strong><span><i className="subject-dot teal" /> Biology · Reading</span></div><small>Done</small></div>
                <div className="preview-task"><span className="sample-check" /><div><strong>Finish the problem set</strong><span><i className="subject-dot" /> Mathematics · Assignment</span></div><small className="sample-today">Today</small></div>
                <div className="preview-task"><span className="sample-check" /><div><strong>Outline the essay</strong><span><i className="subject-dot amber" /> Literature · Project</span></div><small>Tomorrow</small></div>
              </div>
              <div className="preview-week"><div className="preview-section-heading"><strong>A little time to study</strong><span>This week</span></div><div className="sample-days">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <div key={i} className={i === 2 ? 'selected' : ''}><span>{day}</span><strong>{12 + i}</strong><i className={i === 0 || i === 2 || i === 4 ? 'has-session' : ''} /></div>)}</div></div>
            </div>
          </div>
          <div className="floating-note"><span aria-hidden="true">✓</span><div><strong>Small steps. Real progress.</strong><p>You’re finding your rhythm.</p></div></div>
          <div className="preview-stamp" aria-hidden="true"><span>SAMPLE</span><strong>A WEEK<br />IN FOCUS</strong></div>
          <p className="preview-caption">A peek inside your planner · Sample workspace</p>
        </div>
      </section>
      <div className="landing-divider-strip"><span>LESS CHAOS. MORE CLARITY.</span><p>Built around your day.<span aria-hidden="true">✳</span>Room for your whole week.<span aria-hidden="true">✳</span>A pace that feels like yours.</p></div>
      <section id="features" className="landing-section features-section">
        <div className="section-intro"><div><p className="landing-eyebrow">THE EVERYDAY ESSENTIALS</p><h2>Less to keep in your head.<br />More space to focus.</h2></div><p>A home for the moving pieces of student life.<br />Simple enough to use every day.</p></div>
        <div className="landing-features">{features.map(feature => <article key={feature.number}><span className="feature-number"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{feature.number === '01' ? <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M8 2v4m8-4v4M8 10h8m-8 4h8m-8 4h5" /></> : feature.number === '02' ? <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6m10-6v6M3 11h18m-12 4h2m3 0h2m-8 3h2" /></> : <><path d="M5 18a4 4 0 0 1-1-8 7 7 0 0 1 13-2 5 5 0 0 1 2 10" /><path d="m8 15 4-4 4 4m-4-4v10" /></>}</svg><span>{feature.number}</span></span><p className="feature-label">{feature.label}</p><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
      </section>
      <section className="landing-focus"><div className="focus-illustration" aria-hidden="true"><div className="focus-orbit"><span>FOCUS SESSION</span><strong>25:00</strong><p>One thing at a time.</p><div className="focus-play">▶</div></div><span className="focus-tag">A moment for deep work.</span></div><div><p className="landing-eyebrow">A LITTLE MORE FOCUS · PREMIUM</p><h2>Find your rhythm.<br />Feel ready for exam day.</h2><p>Give each subject its own reviewer. Keep topics, formulas, and notes together, track what you’ve reviewed, and see your upcoming exam dates and times. Add a focus session, subject insights, and progress reports to your study routine.</p><a className="landing-text-link" href="#pricing">Explore premium <span aria-hidden="true">↗</span></a></div></section>
      <section id="pricing" className="landing-section pricing-section"><div className="section-intro"><div><p className="landing-eyebrow">START SIMPLE. GROW AT YOUR PACE.</p><h2>Your planner is free.<br />A little extra is optional.</h2></div><p>No subscription. No automatic renewal.<br />Choose what works for your semester.</p></div><div className="landing-pricing">
        <article className="pricing-card"><p className="feature-label">THE EVERYDAY PLANNER</p><h3>Free</h3><p className="pricing-description">Your coursework, with a little more clarity.</p><div className="landing-price">₱0 <span>to get started</span></div><ul><li>Subjects, tasks, and deadline tracking</li><li>Weekly planner and study blocks</li><li>Cloud saving across devices</li><li>Export and import planner backups</li></ul><a className="landing-button secondary" href="/google-sign-in">Start for free <span aria-hidden="true">↗</span></a></article>
        <article className="pricing-card premium"><div className="premium-card-label"><p className="feature-label">YOUR STUDY TOOLKIT</p><span>OPTIONAL EXTRA</span></div><h3>Premium</h3><p className="pricing-description">Review with a plan. Focus with a purpose.</p><div className="landing-price">₱49 <span>/ 120 days</span></div><ul><li>Everything in your free planner</li><li>Reviewer notes, colors, and progress tracking</li><li>Upcoming exam dates and times</li><li>Adjustable focus timer</li><li>Subject completion and workload insights</li><li>Downloadable progress reports</li></ul><a className="landing-button primary" href="/study#premium">Explore premium <span aria-hidden="true">↗</span></a><p className="pricing-fine">One-time GCash payment. Access begins after receipt approval.</p></article>
      </div></section>
      <section id="get-started" className="landing-start"><div><p className="landing-eyebrow">A SMALL START. A CLEARER DAY.</p><h2>Your next chapter<br />starts with<br /><em>a little plan.</em></h2><p>Make StudyTrack your space for coursework, deadlines, and the time you set aside to learn. Start simple. Find a routine that fits you.</p><a className="landing-button primary" href="/google-sign-in">Create your free planner <span aria-hidden="true">↗</span></a></div><ol><li><span>01</span><div><h3>Make yourself at home.</h3><p>Sign in with Google to create your own study space.</p></div></li><li><span>02</span><div><h3>Give your week some shape.</h3><p>Add your subjects, set your deadlines, and make a little time to study.</p></div></li><li><span>03</span><div><h3>Keep taking the next small step.</h3><p>Open your planner on your phone or laptop. Your saved work comes with you.</p></div></li></ol></section>
    </main>
    <footer className="landing-footer"><Link href="/" className="landing-brand"><Mark />StudyTrack<span className="brand-dot">.</span></Link><p>A student project. A little more headspace.</p><div><a href="/study">Open planner</a><a href="/privacy">Privacy</a></div></footer>
  </div>;
}
