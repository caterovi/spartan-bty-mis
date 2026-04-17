import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import productPhoto from "../assets/bty_products.png";
import spartanLogo from "../assets/spartanbtylogo.webp";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap');

  *{ box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --rose: #c24060;
    --rose-deep: #9b2d4a;
    --rose-pale: #fdf4f6;
    --rose-mid: #e8b0c0;
    --cream: #fdf8f5;
    --warm: #fff0f3;
    --ink: #1c0e14;
    --ink-mid: #5a3040;
    --ink-soft: #9a7080;
    --line: #f0dde4;
    --white: #ffffff;
  }

  html { scroll-behavior: smooth; }
  .lp { font-family: 'Jost', sans-serif; background: var(--cream); color: var(--ink); overflow-x: hidden; }

  /* NAV */
  .lp-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 3rem; height: 68px;
    background: rgba(253,248,245,0.97);
    border-bottom: 1px solid var(--line);
    position: sticky; top: 0; z-index: 200;
  }
  .lp-nav-logo { display: flex; align-items: center; gap: 11px; cursor: pointer; }
  .lp-nav-logo-name { font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 500; color: var(--ink); }
  .lp-nav-logo-sub { font-size: 8.5px; color: var(--rose); font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-top: 1px; }

  .lp-nav-center {
    display: flex; align-items: center;
    background: var(--white); border: 1px solid var(--line);
    border-radius: 100px; padding: 6px 8px; gap: 2px;
  }
  .lp-nav-center a {
    font-size: 12.5px; font-weight: 400; color: var(--ink-soft);
    text-decoration: none; padding: 6px 16px; border-radius: 100px;
    transition: all 0.2s; white-space: nowrap; cursor: pointer;
  }
  .lp-nav-center a:hover, .lp-nav-center a.active { background: var(--rose-pale); color: var(--rose); }

  .lp-nav-right { display: flex; align-items: center; }
  .lp-nav-cta {
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 600;
    letter-spacing: 0.5px; background: var(--rose); color: #fff;
    border: none; padding: 9px 22px; border-radius: 100px;
    cursor: pointer; transition: background 0.2s;
  }
  .lp-nav-cta:hover { background: var(--rose-deep); }

  .lp-hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; background: none; border: none; padding: 6px; }
  .lp-hamburger span { display: block; width: 22px; height: 1.5px; background: var(--ink); border-radius: 2px; }

  .lp-mob-menu { display: none; flex-direction: column; background: var(--white); border-bottom: 1px solid var(--line); padding: 1.5rem 2rem; }
  .lp-mob-menu.open { display: flex; }
  .lp-mob-menu a { font-size: 15px; font-weight: 400; color: var(--ink-mid); text-decoration: none; padding: 0.8rem 0; border-bottom: 1px solid var(--line); cursor: pointer; }
  .lp-mob-menu-btns { display: flex; gap: 0.75rem; margin-top: 1.2rem; }
  .lp-mob-menu-btns .lp-nav-cta { flex: 1; text-align: center; padding: 11px; border-radius: 100px; }

  /* HERO */
  .lp-hero {
    background: var(--cream);
    min-height: 88vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    overflow: hidden;
  }
  .lp-hero-left { padding: 5rem 3rem 5rem 3.5rem; }
  .lp-hero-eyebrow { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 1.4rem; }
  .lp-hero-eyebrow-line { width: 32px; height: 1px; background: var(--rose); }
  .lp-hero-eyebrow-text { font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--rose); }
  .lp-hero-title { font-family: 'Playfair Display', serif; font-size: clamp(2.4rem,4vw,3.8rem); font-weight: 500; line-height: 1.1; color: var(--ink); margin-bottom: 0.6rem; }
  .lp-hero-title em { font-style: italic; color: var(--rose); }
  .lp-hero-sub { font-size: 14.5px; font-weight: 300; line-height: 1.85; color: var(--ink-soft); margin-bottom: 2rem; max-width: 400px; }
  .lp-hero-sub strong { font-weight: 600; color: var(--rose); font-style: italic; }
  .lp-hero-btns { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }

  .lp-btn-primary {
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 600;
    letter-spacing: 1px; background: var(--ink); color: #fff;
    border: none; padding: 13px 30px; border-radius: 100px;
    cursor: pointer; transition: background 0.2s;
  }
  .lp-btn-primary:hover { background: #3a1828; }

  .lp-btn-outline {
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 500;
    letter-spacing: 1px; background: transparent; color: var(--ink);
    border: 1.5px solid var(--ink); padding: 12px 26px; border-radius: 100px;
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; gap: 8px;
  }
  .lp-btn-outline:hover { border-color: var(--rose); color: var(--rose); }
  .lp-btn-outline svg { transition: transform 0.2s; }
  .lp-btn-outline:hover svg { transform: translateY(3px); }

  /* HERO RIGHT - real product photo */
  .lp-hero-right {
    position: relative;
    height: 100%; min-height: 88vh;
    overflow: hidden;
    background: var(--warm);
    display: flex; align-items: center; justify-content: center;
  }
  .lp-hero-photo-wrap {
    position: relative; z-index: 1;
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
  }
  .lp-hero-photo {
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }
  .lp-hero-photo-wrap::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(to left, transparent 65%, var(--warm) 100%);
    pointer-events: none; z-index: 2;
  }

  /* MARQUEE */
  .lp-tagline-strip { background: var(--rose); padding: 1rem 2rem; overflow: hidden; white-space: nowrap; }
  .lp-tagline-track { display: inline-flex; gap: 3rem; animation: lp-marquee 18s linear infinite; }
  .lp-tagline-item { font-family: 'Playfair Display', serif; font-size: 13px; font-style: italic; font-weight: 400; color: rgba(255,255,255,0.85); display: flex; align-items: center; gap: 1rem; flex-shrink: 0; }
  .lp-tagline-dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.4); flex-shrink: 0; }
  @keyframes lp-marquee { 0%{ transform: translateX(0); } 100%{ transform: translateX(-50%); } }

  /* STATS */
  .lp-stats { background: var(--white); border-bottom: 1px solid var(--line); }
  .lp-stats-inner { max-width: 1140px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); }
  .lp-stat { padding: 2.2rem 1.5rem; text-align: center; border-right: 1px solid var(--line); }
  .lp-stat:last-child { border-right: none; }
  .lp-stat-num { font-family: 'Playfair Display', serif; font-size: 2.8rem; font-weight: 500; color: var(--rose); line-height: 1; }
  .lp-stat-lbl { font-size: 10px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-soft); margin-top: 6px; }

  /* STORY */
  .lp-story { background: var(--cream); padding: 7rem 3rem; }
  .lp-story-inner { max-width: 1140px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1.1fr; gap: 6rem; align-items: start; }
  .lp-s-label { font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--rose); margin-bottom: 0.9rem; display: flex; align-items: center; gap: 10px; }
  .lp-s-label::before { content: ''; display: block; width: 28px; height: 1px; background: var(--rose); }
  .lp-s-title { font-family: 'Playfair Display', serif; font-size: clamp(2rem,3.5vw,3rem); font-weight: 500; line-height: 1.18; color: var(--ink); margin-bottom: 2rem; }
  .lp-s-title em { font-style: italic; color: var(--rose); }
  .lp-s-body { font-size: 14px; line-height: 2; color: var(--ink-soft); font-weight: 300; }
  .lp-s-body p { margin-bottom: 1.1rem; }
  .lp-story-right { display: flex; flex-direction: column; }
  .lp-story-milestone { display: grid; grid-template-columns: 80px 1fr; gap: 1.5rem; padding: 1.8rem 0; border-bottom: 1px solid var(--line); align-items: start; }
  .lp-story-milestone:first-child { padding-top: 0; }
  .lp-story-milestone:last-child { border-bottom: none; }
  .lp-milestone-year { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 500; color: var(--rose-mid); line-height: 1; }
  .lp-milestone-text { font-size: 13.5px; line-height: 1.85; color: var(--ink-soft); font-weight: 300; padding-top: 0.3rem; }
  .lp-milestone-text strong { color: var(--ink); font-weight: 500; }

  /* FOOTER */
  .lp-footer { background: #120810; padding: 5rem 3rem 2.5rem; }
  .lp-footer-inner { max-width: 1140px; margin: 0 auto; }
  .lp-footer-top { display: grid; grid-template-columns: 1.8fr 1fr 1fr; gap: 4rem; padding-bottom: 3.5rem; border-bottom: 1px solid rgba(255,255,255,0.07); }
  .lp-footer-brand-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 0.9rem; }
  .lp-footer-brand-name { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 500; color: #fff; margin-bottom: 0.4rem; }
  .lp-footer-brand-tag { font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--rose); margin-bottom: 1.3rem; }
  .lp-footer-brand-desc { font-size: 13px; line-height: 1.9; color: rgba(255,255,255,0.32); font-weight: 300; }
  .lp-footer-brand-desc strong { color: rgba(255,255,255,0.6); font-weight: 500; }
  .lp-f-col-title { font-size: 9.5px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 1.5rem; }
  .lp-f-links { display: flex; flex-direction: column; gap: 0.8rem; }
  .lp-f-links a { font-size: 13.5px; color: rgba(255,255,255,0.32); text-decoration: none; font-weight: 300; display: flex; align-items: center; gap: 8px; transition: color 0.2s; cursor: pointer; }
  .lp-f-links a:hover { color: #f9c0d0; }
  .lp-footer-bottom { display: flex; align-items: center; justify-content: space-between; padding-top: 2rem; flex-wrap: wrap; gap: 0.8rem; }
  .lp-f-copy { font-size: 11px; color: rgba(255,255,255,0.18); font-weight: 300; }
  .lp-f-langs { display: flex; flex-wrap: wrap; }
  .lp-f-lang { font-size: 10.5px; color: rgba(255,255,255,0.18); background: none; border: none; cursor: pointer; font-family: 'Jost', sans-serif; padding: 2px 10px; border-right: 1px solid rgba(255,255,255,0.08); transition: color 0.2s; }
  .lp-f-lang:last-child { border-right: none; }
  .lp-f-lang:hover { color: rgba(255,255,255,0.5); }

  /* ANIMATIONS */
  @keyframes lp-fadeUp { from{ opacity:0; transform:translateY(20px); } to{ opacity:1; transform:translateY(0); } }
  .lp-hero-left  { animation: lp-fadeUp 0.7s 0.1s both; }
  .lp-hero-right { animation: lp-fadeUp 0.7s 0.25s both; }

  /* TABLET <= 960px */
  @media (max-width: 960px) {
    .lp-nav-center, .lp-nav-right { display: none; }
    .lp-hamburger { display: flex; }
    .lp-nav { padding: 0 1.5rem; }
    .lp-hero { grid-template-columns: 1fr; grid-template-rows: auto auto; min-height: auto; }
    .lp-hero-right { order: -1; min-height: 360px; height: 360px; }
    .lp-hero-photo { object-position: center top; }
    .lp-hero-left { padding: 2.5rem 2rem 3rem; text-align: center; }
    .lp-hero-eyebrow { justify-content: center; }
    .lp-hero-sub { margin-left: auto; margin-right: auto; }
    .lp-hero-btns { justify-content: center; }
    .lp-stats-inner { grid-template-columns: repeat(2,1fr); }
    .lp-stat { border-right: none; border-bottom: 1px solid var(--line); }
    .lp-stat:nth-child(odd) { border-right: 1px solid var(--line); }
    .lp-stat:nth-last-child(-n+2) { border-bottom: none; }
    .lp-story-inner { grid-template-columns: 1fr; gap: 3rem; }
    .lp-story { padding: 5rem 2rem; }
    .lp-footer-top { grid-template-columns: 1fr 1fr; gap: 2.5rem; }
    .lp-footer { padding: 4rem 2rem 2rem; }
  }

  /* MOBILE <= 540px */
  @media (max-width: 540px) {
    .lp-nav { padding: 0 1rem; height: 58px; }
    .lp-mob-menu { padding: 1rem 1.2rem; }
    .lp-hero-right { display: none; }
    .lp-hero-left { padding: 2rem 1.2rem 2.5rem; }
    .lp-hero-title { font-size: 1.9rem; }
    .lp-hero-sub { font-size: 13.5px; }
    .lp-hero-btns { flex-direction: column; align-items: stretch; gap: 0.75rem; }
    .lp-btn-primary, .lp-btn-outline { padding: 13px; text-align: center; width: 100%; justify-content: center; }
    .lp-tagline-item { font-size: 11.5px; }
    .lp-stats-inner { grid-template-columns: repeat(2,1fr); }
    .lp-stat { padding: 1.4rem 0.8rem; }
    .lp-stat-num { font-size: 2.1rem; }
    .lp-stat-lbl { font-size: 9px; letter-spacing: 1px; }
    .lp-story { padding: 3.5rem 1.2rem; }
    .lp-s-title { font-size: 1.8rem; }
    .lp-story-milestone { grid-template-columns: 56px 1fr; gap: 1rem; }
    .lp-milestone-year { font-size: 1.5rem; }
    .lp-milestone-text { font-size: 13px; }
    .lp-footer { padding: 3rem 1.2rem 2rem; }
    .lp-footer-top { grid-template-columns: 1fr; gap: 2rem; }
    .lp-footer-bottom { flex-direction: column; align-items: flex-start; gap: 1rem; }
  }

  /* SMALL MOBILE <= 380px */
  @media (max-width: 380px) {
    .lp-hero-right { min-height: 210px; height: 210px; }
    .lp-hero-title { font-size: 1.7rem; }
    .lp-nav-logo-name { font-size: 15px; }
    .lp-nav-logo-sub { font-size: 7.5px; }
  }
`;

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleAccessSystem = () => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="lp">

        {/* NAV */}
        <nav className="lp-nav">
          <div className="lp-nav-logo" onClick={() => scrollTo("hero")}>
            <img src={spartanLogo} alt="Spartan BTY Logo" width="32" height="32" style={{ borderRadius: '50%' }} />
            <div>
              <div className="lp-nav-logo-name">Spartan BTY Inc.</div>
              <div className="lp-nav-logo-sub">Management Information System</div>
            </div>
          </div>

          {/* Nav: Home | About | Story | Contact - no Reports, no search */}
          <div className="lp-nav-center">
            <a className="active" onClick={() => scrollTo("hero")}>Home</a>
            <a onClick={() => scrollTo("story")}>About</a>
            <a onClick={() => scrollTo("story")}>Story</a>
            <a onClick={() => scrollTo("contact")}>Contact</a>
          </div>

          <div className="lp-nav-right">
            {isAuthenticated() ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                  Welcome, {user?.name || user?.username}
                </span>
                <button className="lp-nav-cta" onClick={() => { logout(); navigate('/'); }}>Sign Out</button>
              </div>
            ) : (
              <button className="lp-nav-cta" onClick={() => navigate("/login")}>Sign In</button>
            )}
          </div>

          <button className="lp-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <span/><span/><span/>
          </button>
        </nav>

        {/* MOBILE MENU */}
        <div className={`lp-mob-menu${menuOpen ? " open" : ""}`}>
          <a onClick={() => scrollTo("hero")}>Home</a>
          <a onClick={() => scrollTo("story")}>About</a>
          <a onClick={() => scrollTo("story")}>Story</a>
          <a onClick={() => scrollTo("contact")}>Contact</a>
          <div className="lp-mob-menu-btns">
            {isAuthenticated() ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '12px', color: 'var(--ink-soft)' }}>
                  Welcome, {user?.name || user?.username}
                </div>
                <button className="lp-nav-cta" onClick={() => { logout(); navigate('/'); }}>Sign Out</button>
              </>
            ) : (
              <button className="lp-nav-cta" onClick={() => navigate("/login")}>Sign In</button>
            )}
          </div>
        </div>

        {/* HERO */}
        <section className="lp-hero" id="hero">
          <div className="lp-hero-left">
            <div className="lp-hero-eyebrow">
              <div className="lp-hero-eyebrow-line"/>
              <span className="lp-hero-eyebrow-text">Web-Based MIS · Est. 2025</span>
            </div>
            <h1 className="lp-hero-title">
              Because Your Team<br/>
              Deserves <em>Pure Clarity</em>
            </h1>
            <p className="lp-hero-sub">
              At Spartan BTY Inc., we are dedicated to making someone feel better
              than yesterday through exceptional service and smart operations.<br/><br/>
              <strong>We put the CARE in skincare.</strong>
            </p>
            <div className="lp-hero-btns">
              <button 
                className="lp-btn-primary" 
                onClick={handleAccessSystem}
                disabled={!isAuthenticated()}
                style={{
                  opacity: isAuthenticated() ? 1 : 0.6,
                  cursor: isAuthenticated() ? 'pointer' : 'not-allowed'
                }}
              >
                {isAuthenticated() ? 'Enter Dashboard' : 'Access the System'}
              </button>
              {/* "Our Story" - scrolls down to the story section. More purposeful than "Learn More" */}
              <button className="lp-btn-outline" onClick={() => scrollTo("story")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
                Our Story
              </button>
              {!isAuthenticated() && (
                <div style={{ 
                  fontSize: '11px', 
                  color: 'var(--ink-soft)', 
                  marginTop: '0.5rem',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  Please sign in first to access the system
                </div>
              )}
            </div>
          </div>

          {/* Real BTY Advance product photo */}
          <div className="lp-hero-right">
            <div className="lp-hero-photo-wrap">
              <img
                src={productPhoto}
                alt="BTY Advance skincare product lineup"
                className="lp-hero-photo"
              />
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="lp-tagline-strip">
          <div className="lp-tagline-track">
            {[
              "Making someone feel better than yesterday",
              "We put the CARE in skincare",
              "Established December 2018",
              "Present in 30+ countries",
              "Making someone feel better than yesterday",
              "We put the CARE in skincare",
              "Established December 2018",
              "Present in 30+ countries",
            ].map((t, i) => (
              <span className="lp-tagline-item" key={i}>
                {t}<span className="lp-tagline-dot"/>
              </span>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div className="lp-stats">
          <div className="lp-stats-inner">
            {[
              { num: "30+",  lbl: "Countries Reached" },
              { num: "2018", lbl: "Year Founded" },
              { num: "8",    lbl: "MIS Modules" },
              { num: "24/7", lbl: "Accessibility" },
            ].map((s, i) => (
              <div className="lp-stat" key={i}>
                <div className="lp-stat-num">{s.num}</div>
                <div className="lp-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* OUR STORY */}
        <section className="lp-story" id="story">
          <div className="lp-story-inner">
            <div>
              <div className="lp-s-label">Our Story</div>
              <h2 className="lp-s-title">A journey built on<br/><em>genuine care</em></h2>
              <div className="lp-s-body">
                <p>Established in December 2018, Spartan BTY Inc., originally RBAM Advertisement Marketing, embarked on its journey as a modest drop-shipping distributor in the beauty and wellness niche.</p>
                <p>With a dedicated team of just three sales agents, the company quickly demonstrated its potential - growing to 30 agents within five months and officially incorporating in April 2022.</p>
                <p>Today, Spartan BTY Inc. is a thriving global brand with a presence in 30+ countries, known not just for its products, but for meaningful experiences and lasting relationships with every customer.</p>
              </div>
            </div>
            <div className="lp-story-right">
              {[
                { year: "2018", text: <>Founded as <strong>RBAM Advertisement Marketing</strong> - 3 sales agents, a bold vision in beauty &amp; wellness.</> },
                { year: "2019", text: <>Grew to <strong>30 agents in just 5 months</strong>, moving from a 10 sq-ft office to a full two-floor apartment.</> },
                { year: "2022", text: <>Officially incorporated in April 2022, transitioning into a <strong>global international operation</strong>.</> },
                { year: "Now",  text: <>A globally recognized brand in <strong>30+ countries</strong>, dedicated to making someone feel Better Than Yesterday.</> },
              ].map((m, i) => (
                <div className="lp-story-milestone" key={i}>
                  <div className="lp-milestone-year">{m.year}</div>
                  <div className="lp-milestone-text">{m.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer" id="contact">
          <div className="lp-footer-inner">
            <div className="lp-footer-top">
              <div>
                <div className="lp-footer-brand-logo">
                  <img src={spartanLogo} alt="Spartan BTY Logo" width="28" height="28" style={{ borderRadius: '50%' }} />
                  <div className="lp-footer-brand-name">Spartan BTY Inc.</div>
                </div>
                <div className="lp-footer-brand-tag">Management Information System</div>
                <p className="lp-footer-brand-desc">
                  We are a team of passionate people whose goal is to make someone feel{" "}
                  <strong>Better Than Yesterday.</strong>
                </p>
              </div>
              <div>
                <div className="lp-f-col-title">About Us</div>
                <div className="lp-f-links">
                  <a onClick={() => scrollTo("story")}>Our Story</a>
                  <a href="#">Careers</a>
                  <a href="#">Courses</a>
                  <a href="#">Helpdesk</a>
                </div>
              </div>
              <div>
                <div className="lp-f-col-title">Connect with Us</div>
                <div className="lp-f-links">
                  <a onClick={() => scrollTo("contact")}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Contact Us
                  </a>
                  <a href="mailto:mail@spartanbty.com">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    mail@spartanbty.com
                  </a>
                  {isAuthenticated() ? (
                    <a onClick={() => { logout(); navigate('/'); }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign Out
                    </a>
                  ) : (
                    <a onClick={() => navigate("/login")}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Sign In
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="lp-footer-bottom">
              <div className="lp-f-copy">Copyright © Spartan BTY Inc.</div>
              <div className="lp-f-langs">
                {["English (US)", "Filipino", "??", "??", "Türkçe"].map((lang) => (
                  <button className="lp-f-lang" key={lang}>{lang}</button>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
