import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Wheel from '../components/Wheel';
import ProjectCard from '../components/ProjectCard';
import Spinner from '../components/Spinner';

const HERO_SLIDES = [
  { src: '/images/installation_049.jpg', tag: 'Community Service', caption: 'Serving meals alongside the community' },
  { src: '/images/activity_010.jpg', tag: 'Environment', caption: 'Tree plantation drive — 1,550+ saplings' },
  { src: '/images/installation_025.jpg', tag: 'Health', caption: 'Arogya Rath — the clinic on wheels' },
  { src: '/images/activity_042.jpg', tag: 'Health', caption: 'Mammography camps — 590 women screened' },
  { src: '/images/activity_026.jpg', tag: 'Sports', caption: 'Subhash Sangram Fun Run — 1,800+ runners' },
];
const SLIDE_MS = 5500;

export default function Home() {
  const { user } = useAuth();
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [paused]);

  const go = (i) => setSlide((i + HERO_SLIDES.length) % HERO_SLIDES.length);

  useEffect(() => {
    supabase
      .from('projects')
      .select('*, lead_group_info:groups(id, name, slug)')
      .eq('status', 'ongoing')
      .order('created_at', { ascending: true })
      .limit(6)
      .then(({ data }) => setProjects(data ?? []));
  }, []);

  return (
    <main>
      <section
        className="hero"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-roledescription="carousel"
        aria-label="Club highlights"
      >
        {HERO_SLIDES.map((s, i) => (
          <div key={s.src} className={`hero-slide ${i === slide ? 'on' : ''}`} style={{ backgroundImage: `url(${s.src})` }} />
        ))}
        <div className="hero-scrim" />
        <Wheel className="hero-wheel" />
        <div className="container hero-inner">
          <p className="motto">Service Above Self</p>
          <h1>A community that turns goodwill into work done.</h1>
          <p className="sub">
            The Rotary Club of Bardoli has served Gujarat since 1961. This is our living platform —
            follow ongoing projects, meet the people behind them, ask for help, or lend a hand yourself.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-gold" to="/projects">See Ongoing Projects</Link>
            {user
              ? <Link className="btn btn-blue" to="/dashboard">Open My Dashboard</Link>
              : <Link className="btn btn-blue" to="/login">Join the Community</Link>}
            <Link className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,.7)', color: '#fff' }} to="/help">
              Need Help?
            </Link>
          </div>
        </div>

        <div className="hero-caption" key={slide}>
          <span className="badge badge-gold">{HERO_SLIDES[slide].tag}</span>
          <span>{HERO_SLIDES[slide].caption}</span>
        </div>

        <button className="hero-arrow prev" aria-label="Previous slide" onClick={() => go(slide - 1)}>&#8249;</button>
        <button className="hero-arrow next" aria-label="Next slide" onClick={() => go(slide + 1)}>&#8250;</button>

        <div className="hero-dots" role="tablist" aria-label="Slides">
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.src}
              className={i === slide ? 'on' : ''}
              role="tab"
              aria-selected={i === slide}
              aria-label={`Slide ${i + 1}: ${s.caption}`}
              onClick={() => go(i)}
            >
              {i === slide && !paused && <span className="dot-progress" style={{ animationDuration: `${SLIDE_MS}ms` }} />}
            </button>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="stat-row">
            <div className="card stat-box"><b>1961</b><span>Chartered</span></div>
            <div className="card stat-box"><b>3060</b><span>Rotary District</span></div>
            <div className="card stat-box"><b>38+</b><span>Active Members</span></div>
            <div className="card stat-box"><b>100+</b><span>Events Every Year</span></div>
          </div>
        </div>
      </section>

      <section className="home-section mist">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow"><Wheel />Ongoing Work</p>
              <h2>Projects on the ground right now</h2>
            </div>
            <Link className="btn btn-outline" to="/projects">All projects</Link>
          </div>
          {projects === null ? <Spinner /> : (
            <div className="grid-3">
              {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="container grid-3">
          <div className="card card-pad">
            <p className="eyebrow"><Wheel />Community</p>
            <h3 style={{ marginBottom: 8 }}>Meet the people</h3>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 18 }}>
              Browse committees, member profiles and the collaborations behind every project.
            </p>
            <Link className="btn btn-blue btn-sm" to="/community">Explore community</Link>
          </div>
          <div className="card card-pad">
            <p className="eyebrow"><Wheel />Feed</p>
            <h3 style={{ marginBottom: 8 }}>Follow the work</h3>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 18 }}>
              Photo threads and updates straight from camps, drives and events — like, comment, share.
            </p>
            <Link className="btn btn-blue btn-sm" to="/feed">Open the feed</Link>
          </div>
          <div className="card card-pad">
            <p className="eyebrow"><Wheel />Support</p>
            <h3 style={{ marginBottom: 8 }}>Give or ask</h3>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 18 }}>
              Pledge a donation to a cause you believe in — or reach out if you or someone near you needs help.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link className="btn btn-gold btn-sm" to="/donate">Donate</Link>
              <Link className="btn btn-ghost btn-sm" to="/help">Request help</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
