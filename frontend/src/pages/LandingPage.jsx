import { useState, useEffect } from "react";
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
  .lp { font-family: 'Jost', sans-serif; background: var(--cream); color: var(--ink); overflow-x: hidden; padding-top: 68px; }

  /* NAV */
  .lp-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 3rem; height: 68px;
    background: rgba(253,248,245,0.97);
    border-bottom: 1px solid var(--line);
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
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
    cursor: pointer; transition: all 0.3s ease;
  }
  .lp-nav-cta:hover { background: var(--rose-deep); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(194, 64, 96, 0.3); }

  /* USER DROPDOWN */
  .lp-user-dropdown { position: relative; }
  .lp-user-trigger {
    display: flex; align-items: center; gap: 8px; cursor: pointer;
    padding: 6px 12px; border-radius: 100px; background: var(--white);
    border: 1px solid var(--line); transition: all 0.2s;
  }
  .lp-user-trigger:hover { background: var(--rose-pale); border-color: var(--rose-mid); }
  .lp-user-avatar {
    width: 32px; height: 32px; background: var(--rose); color: #fff;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600;
  }
  .lp-user-name { font-size: 12px; font-weight: 500; color: var(--ink); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lp-user-chevron { width: 12px; height: 12px; color: var(--ink-soft); transition: transform 0.2s; }
  .lp-user-dropdown.open .lp-user-chevron { transform: rotate(180deg); }
  .lp-dropdown-menu {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: var(--white); border: 1px solid var(--line);
    border-radius: 12px; padding: 0.5rem 0; min-width: 180px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    opacity: 0; visibility: hidden; transform: translateY(-8px);
    transition: all 0.2s ease; z-index: 201;
  }
  .lp-user-dropdown.open .lp-dropdown-menu { opacity: 1; visibility: visible; transform: translateY(0); }
  .lp-dropdown-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 16px;
    font-size: 13px; font-weight: 400; color: var(--ink);
    text-decoration: none; cursor: pointer; transition: all 0.15s;
  }
  .lp-dropdown-item:hover { background: var(--rose-pale); color: var(--rose); }
  .lp-dropdown-divider { height: 1px; background: var(--line); margin: 0.5rem 0; }
  .lp-dropdown-item svg { width: 16px; height: 16px; color: var(--ink-soft); }
  .lp-dropdown-item:hover svg { color: var(--rose); }

  .lp-hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; background: none; border: none; padding: 6px; }
  .lp-hamburger span { display: block; width: 22px; height: 1.5px; background: var(--ink); border-radius: 2px; }

  .lp-mob-menu { display: none; flex-direction: column; background: var(--white); border-bottom: 1px solid var(--line); padding: 1.5rem 2rem; position: fixed; top: 68px; left: 0; right: 0; z-index: 199; max-height: calc(100vh - 68px); overflow-y: auto; }
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
    cursor: pointer; transition: all 0.3s ease;
  }
  .lp-btn-primary:hover { background: #3a1828; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(28, 14, 20, 0.3); }

  .lp-btn-outline {
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 500;
    letter-spacing: 1px; background: transparent; color: var(--ink);
    border: 1.5px solid var(--ink); padding: 12px 26px; border-radius: 100px;
    cursor: pointer; transition: all 0.3s ease;
    display: flex; align-items: center; gap: 8px;
  }
  .lp-btn-outline:hover { border-color: var(--rose); color: var(--rose); background: var(--rose-pale); transform: translateY(-2px); }
  .lp-btn-outline svg { transition: transform 0.3s ease; }
  .lp-btn-outline:hover svg { transform: translateY(4px); }

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
  .lp-stat { padding: 2.2rem 1.5rem; text-align: center; border-right: 1px solid var(--line); transition: all 0.3s ease; cursor: default; }
  .lp-stat:last-child { border-right: none; }
  .lp-stat:hover { background: var(--rose-pale); transform: translateY(-4px); }
  .lp-stat-num { font-family: 'Playfair Display', serif; font-size: 2.8rem; font-weight: 500; color: var(--rose); line-height: 1; transition: transform 0.3s ease; }
  .lp-stat:hover .lp-stat-num { transform: scale(1.1); }
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
  .lp-story-milestone { display: grid; grid-template-columns: 80px 1fr; gap: 1.5rem; padding: 1.8rem 0; border-bottom: 1px solid var(--line); align-items: start; transition: all 0.3s ease; }
  .lp-story-milestone:first-child { padding-top: 0; }
  .lp-story-milestone:last-child { border-bottom: none; }
  .lp-story-milestone:hover { padding-left: 0.5rem; background: linear-gradient(90deg, rgba(194, 64, 96, 0.05) 0%, transparent 100%); }
  .lp-milestone-year { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 500; color: var(--rose-mid); line-height: 1; transition: color 0.3s ease; }
  .lp-story-milestone:hover .lp-milestone-year { color: var(--rose); }
  .lp-milestone-text { font-size: 13.5px; line-height: 1.85; color: var(--ink-soft); font-weight: 300; padding-top: 0.3rem; }
  .lp-milestone-text strong { color: var(--ink); font-weight: 500; }

  /* QUICK START */
  .lp-quickstart { background: var(--cream); padding: 7rem 3rem; }
  .lp-quickstart-inner { max-width: 1140px; margin: 0 auto; }
  .lp-qs-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 2rem; margin-top: 2.5rem; }
  .lp-qs-step { background: var(--white); border-radius: 14px; padding: 2rem; border: 1px solid var(--line); transition: all 0.3s ease; }
  .lp-qs-step:hover { transform: translateY(-6px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); border-color: var(--rose-mid); }
  .lp-qs-num { width: 36px; height: 36px; background: var(--rose); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem; transition: transform 0.3s ease; }
  .lp-qs-step:hover .lp-qs-num { transform: scale(1.1) rotate(5deg); }
  .lp-qs-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 600; color: var(--ink); margin-bottom: 0.8rem; }
  .lp-qs-text { font-size: 13.5px; line-height: 1.8; color: var(--ink-soft); font-weight: 300; }
  .lp-qs-text strong { color: var(--ink); font-weight: 500; }

  /* FAQ */
  .lp-faq { background: var(--white); padding: 7rem 3rem; }
  .lp-faq-inner { max-width: 900px; margin: 0 auto; }
  .lp-faq-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 2.5rem; }
  .lp-faq-item { background: var(--cream); border-radius: 12px; border: 1px solid var(--line); overflow: hidden; transition: all 0.3s ease; }
  .lp-faq-item:hover { transform: translateX(8px); border-color: var(--rose-mid); }
  .lp-faq-q { padding: 1.3rem 1.5rem; font-size: 14.5px; font-weight: 600; color: var(--ink); cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 1rem; transition: background 0.3s ease; }
  .lp-faq-q:hover { background: var(--rose-pale); color: var(--rose); }
  .lp-faq-a { padding: 0 1.5rem 1.3rem; font-size: 13.5px; line-height: 1.8; color: var(--ink-soft); font-weight: 300; border-top: 1px solid var(--line); margin-top: 0; padding-top: 1rem; }

  /* FEEDBACK */
  .lp-feedback { background: var(--cream); padding: 7rem 3rem; }
  .lp-feedback-inner { max-width: 700px; margin: 0 auto; }
  .lp-feedback-form { background: var(--white); border-radius: 14px; padding: 2.5rem; border: 1px solid var(--line); margin-top: 2.5rem; transition: box-shadow 0.3s ease; }
  .lp-feedback-form:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); }
  .lp-fg-group { margin-bottom: 1.5rem; }
  .lp-fg-label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--ink-mid); margin-bottom: 0.5rem; }
  .lp-fg-input { width: 100%; padding: 12px 16px; font-family: 'Jost', sans-serif; font-size: 14px; color: var(--ink); background: var(--cream); border: 1px solid var(--line); border-radius: 8px; outline: none; transition: all 0.3s ease; }
  .lp-fg-input:focus { border-color: var(--rose); box-shadow: 0 0 0 3px rgba(194, 64, 96, 0.1); transform: translateY(-2px); }
  .lp-fg-textarea { min-height: 120px; resize: vertical; }
  .lp-fg-submit { width: 100%; padding: 14px; font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 1px; background: var(--rose); color: #fff; border: none; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; }
  .lp-fg-submit:hover { background: var(--rose-deep); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(194, 64, 96, 0.3); }

  /* FOOTER */
  .lp-footer { background: #120810; padding: 5rem 3rem 2.5rem; }
  .lp-footer-inner { max-width: 1140px; margin: 0 auto; }
  .lp-footer-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 4rem; padding-bottom: 3.5rem; border-bottom: 1px solid rgba(255,255,255,0.07); }
  .lp-footer-top > div:first-child { flex: 1; }
  .lp-footer-top > div:last-child { flex-shrink: 0; text-align: right; }
  .lp-footer-top > div:last-child .lp-f-col-title { text-align: right; }
  .lp-footer-top > div:last-child .lp-f-social { justify-content: flex-end; }
  .lp-footer-brand-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 0.9rem; }
  .lp-footer-brand-name { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 500; color: #fff; margin-bottom: 0.4rem; }
  .lp-footer-brand-tag { font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--rose); margin-bottom: 1.3rem; }
  .lp-footer-brand-desc { font-size: 13px; line-height: 1.9; color: rgba(255,255,255,0.32); font-weight: 300; }
  .lp-footer-brand-desc strong { color: rgba(255,255,255,0.6); font-weight: 500; }
  .lp-f-col-title { font-size: 9.5px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 1.5rem; }
  .lp-f-social { display: flex; gap: 1rem; align-items: center; }
  .lp-f-social-icon { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); transition: all 0.3s ease; text-decoration: none; }
  .lp-f-social-icon:hover { background: rgba(255,255,255,0.15); color: #f9c0d0; transform: translateY(-3px); }
  .lp-f-links { display: flex; flex-direction: column; gap: 0.8rem; }
  .lp-f-links a { font-size: 13.5px; color: rgba(255,255,255,0.32); text-decoration: none; font-weight: 300; display: flex; align-items: center; gap: 8px; transition: all 0.3s ease; cursor: pointer; }
  .lp-f-links a:hover { color: #f9c0d0; transform: translateX(4px); }
  .lp-footer-bottom { display: flex; align-items: center; justify-content: space-between; padding-top: 2rem; flex-wrap: wrap; gap: 0.8rem; }
  .lp-f-copy { font-size: 11px; color: rgba(255,255,255,0.18); font-weight: 300; }
  .lp-f-langs { display: flex; flex-wrap: wrap; }
  .lp-f-lang { font-size: 10.5px; color: rgba(255,255,255,0.18); background: none; border: none; cursor: pointer; font-family: 'Jost', sans-serif; padding: 2px 10px; border-right: 1px solid rgba(255,255,255,0.08); transition: all 0.3s ease; }
  .lp-f-lang:last-child { border-right: none; }
  .lp-f-lang:hover { color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.05); }

  /* ANIMATIONS */
  @keyframes lp-fadeUp { from{ opacity:0; transform:translateY(30px); } to{ opacity:1; transform:translateY(0); } }
  @keyframes lp-fadeIn { from{ opacity:0; } to{ opacity:1; } }
  @keyframes lp-slideInLeft { from{ opacity:0; transform:translateX(-40px); } to{ opacity:1; transform:translateX(0); } }
  @keyframes lp-slideInRight { from{ opacity:0; transform:translateX(40px); } to{ opacity:1; transform:translateX(0); } }
  @keyframes lp-scaleIn { from{ opacity:0; transform:scale(0.9); } to{ opacity:1; transform:scale(1); } }
  @keyframes lp-pulse { 0%, 100%{ transform:scale(1); } 50%{ transform:scale(1.05); } }

  .lp-hero-left  { animation: lp-fadeUp 0.7s 0.1s both; }
  .lp-hero-right { animation: lp-fadeUp 0.7s 0.25s both; }

  /* Scroll Animation Classes */
  .lp-animate { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
  .lp-animate.lp-visible { opacity: 1; transform: translateY(0); }
  .lp-animate-left { opacity: 0; transform: translateX(-40px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
  .lp-animate-left.lp-visible { opacity: 1; transform: translateX(0); }
  .lp-animate-right { opacity: 0; transform: translateX(40px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
  .lp-animate-right.lp-visible { opacity: 1; transform: translateX(0); }
  .lp-animate-scale { opacity: 0; transform: scale(0.9); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
  .lp-animate-scale.lp-visible { opacity: 1; transform: scale(1); }

  /* Staggered delays */
  .lp-stagger-1 { transition-delay: 0.1s; }
  .lp-stagger-2 { transition-delay: 0.2s; }
  .lp-stagger-3 { transition-delay: 0.3s; }
  .lp-stagger-4 { transition-delay: 0.4s; }
  .lp-stagger-5 { transition-delay: 0.5s; }
  .lp-stagger-6 { transition-delay: 0.6s; }
  .lp-stagger-7 { transition-delay: 0.7s; }
  .lp-stagger-8 { transition-delay: 0.8s; }

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
    .lp-qs-steps { grid-template-columns: 1fr; }
    .lp-quickstart { padding: 5rem 2rem; }
    .lp-faq { padding: 5rem 2rem; }
    .lp-feedback { padding: 5rem 2rem; }
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
    .lp-quickstart { padding: 3.5rem 1.2rem; }
    .lp-faq { padding: 3.5rem 1.2rem; }
    .lp-feedback { padding: 3.5rem 1.2rem; }
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Scroll animation observer
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('lp-visible');
        }
      });
    }, observerOptions);

    // Observe all elements with animation classes
    const animatedElements = document.querySelectorAll('.lp-animate, .lp-animate-left, .lp-animate-right, .lp-animate-scale');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest('.lp-user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

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

          {/* Nav: Home | Story | Contact */}
          <div className="lp-nav-center">
            <a className="active" onClick={() => scrollTo("hero")}>Home</a>
            <a onClick={() => scrollTo("story")}>Our Story</a>
            <a onClick={() => scrollTo("faq")}>FAQ</a>
            <a onClick={() => scrollTo("contact")}>Contact</a>
          </div>

          <div className="lp-nav-right">
            {isAuthenticated() ? (
              <div className={`lp-user-dropdown${userDropdownOpen ? " open" : ""}`}>
                <div className="lp-user-trigger" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                  <div className="lp-user-avatar">
                    {(user?.full_name || user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="lp-user-name">{user?.full_name || user?.name || user?.username}</span>
                  <svg className="lp-user-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                <div className="lp-dropdown-menu">
                  <div className="lp-dropdown-item" onClick={() => { setUserDropdownOpen(false); logout(); navigate('/'); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </div>
                </div>
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
          <a onClick={() => scrollTo("story")}>Our Story</a>
          <a onClick={() => scrollTo("faq")}>FAQ</a>
          <a onClick={() => scrollTo("contact")}>Contact</a>
          <div className="lp-mob-menu-btns">
            {isAuthenticated() ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '12px', color: 'var(--ink-soft)' }}>
                  Welcome, {user?.full_name || user?.name || user?.username}
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
                  Please sign in first to access the system!
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
        <div className="lp-tagline-strip lp-animate">
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
        <div className="lp-stats lp-animate">
          <div className="lp-stats-inner">
            {[
              { num: "30+",  lbl: "Countries Reached" },
              { num: "2018", lbl: "Year Founded" },
              { num: "8",    lbl: "MIS Modules" },
              { num: "24/7", lbl: "Accessibility" },
            ].map((s, i) => (
              <div className={`lp-stat lp-animate-scale lp-stagger-${i + 1}`} key={i}>
                <div className="lp-stat-num">{s.num}</div>
                <div className="lp-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* OUR STORY */}
        <section className="lp-story" id="story">
          <div className="lp-story-inner">
            <div className="lp-animate-left">
              <div className="lp-s-label">Our Story</div>
              <h2 className="lp-s-title">A journey built on<br/><em>genuine care</em></h2>
              <div className="lp-s-body">
                <p>Established in December 2018, Spartan BTY Inc., originally RBAM Advertisement Marketing, embarked on its journey as a modest drop-shipping distributor in the beauty and wellness niche.</p>
                <p>With a dedicated team of just three sales agents, the company quickly demonstrated its potential - growing to 30 agents within five months and officially incorporating in April 2022.</p>
                <p>Today, Spartan BTY Inc. is a thriving global brand with a presence in 30+ countries, known not just for its products, but for meaningful experiences and lasting relationships with every customer.</p>
              </div>
            </div>
            <div className="lp-story-right lp-animate-right">
              {[
                { year: "2018", text: <>Founded as <strong>RBAM Advertisement Marketing</strong> - 3 sales agents, a bold vision in beauty &amp; wellness.</> },
                { year: "2019", text: <>Grew to <strong>30 agents in just 5 months</strong>, moving from a 10 sq-ft office to a full two-floor apartment.</> },
                { year: "2022", text: <>Officially incorporated in April 2022, transitioning into a <strong>global international operation</strong>.</> },
                { year: "Now",  text: <>A globally recognized brand in <strong>30+ countries</strong>, dedicated to making someone feel Better Than Yesterday.</> },
              ].map((m, i) => (
                <div className={`lp-story-milestone lp-animate lp-stagger-${i + 1}`} key={i}>
                  <div className="lp-milestone-year">{m.year}</div>
                  <div className="lp-milestone-text">{m.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* QUICK START */}
        <section className="lp-quickstart" id="quickstart">
          <div className="lp-quickstart-inner">
            <div className="lp-m-label lp-animate">Getting Started</div>
            <h2 className="lp-m-title lp-animate">Quick Start <em>Guide</em></h2>
            <div className="lp-qs-steps">
              {[
                { num: "1", title: "Sign In", text: "Log in with your credentials to access the system. If you don't have an account, contact your administrator." },
                { num: "2", title: "Explore Dashboard", text: "Visit the Dashboard to view key metrics, recent orders, low stock alerts, and notifications." },
                { num: "3", title: "Use Modules", text: "Navigate to specific modules like Sales, Inventory, or HR based on your role and permissions." },
              ].map((step, i) => (
                <div className={`lp-qs-step lp-animate-scale lp-stagger-${i + 1}`} key={i}>
                  <div className="lp-qs-num">{step.num}</div>
                  <div className="lp-qs-title">{step.title}</div>
                  <div className="lp-qs-text">{step.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="lp-faq" id="faq">
          <div className="lp-faq-inner">
            <div className="lp-m-label lp-animate">Help & Support</div>
            <h2 className="lp-m-title lp-animate">Frequently Asked <em>Questions</em></h2>
            <div className="lp-faq-list">
              {[
                { q: "How do I reset my password?", a: "Contact your system administrator to reset your password. For security reasons, self-service password reset is not currently enabled." },
                { q: "What are the system requirements?", a: "The MIS is web-based and works on any modern browser (Chrome, Firefox, Safari, Edge) with an internet connection. No software installation required." },
                { q: "How do I request access to additional modules?", a: "Module access is based on your role. Contact your manager or administrator if you believe you need access to additional features." },
                { q: "Is the system available 24/7?", a: "Yes, the MIS is accessible 24/7 from anywhere with an internet connection. Scheduled maintenance windows will be announced in advance." },
                { q: "How do I report a bug or issue?", a: "Use the Feedback form below or contact the IT helpdesk at helpdesk@spartanbty.com with details about the issue you're experiencing." },
              ].map((item, i) => (
                <div className={`lp-faq-item lp-animate lp-stagger-${i + 1}`} key={i}>
                  <div className="lp-faq-q">{item.q}</div>
                  <div className="lp-faq-a">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEEDBACK */}
        <section className="lp-feedback" id="feedback">
          <div className="lp-feedback-inner">
            <div className="lp-m-label lp-animate">We Value Your Input</div>
            <h2 className="lp-m-title lp-animate">Send Us <em>Feedback</em></h2>
            <form className="lp-feedback-form lp-animate-scale" onSubmit={(e) => { e.preventDefault(); alert('Thank you for your feedback! This feature is coming soon.'); }}>
              <div className="lp-fg-group">
                <label className="lp-fg-label">Your Name</label>
                <input type="text" className="lp-fg-input" placeholder="Enter your name" required />
              </div>
              <div className="lp-fg-group">
                <label className="lp-fg-label">Email Address</label>
                <input type="email" className="lp-fg-input" placeholder="Enter your email" required />
              </div>
              <div className="lp-fg-group">
                <label className="lp-fg-label">Feedback Type</label>
                <select className="lp-fg-input" required>
                  <option value="">Select type...</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="improvement">Improvement Suggestion</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="lp-fg-group">
                <label className="lp-fg-label">Your Message</label>
                <textarea className="lp-fg-input lp-fg-textarea" placeholder="Describe your feedback in detail..." required />
              </div>
              <button type="submit" className="lp-fg-submit">Submit Feedback</button>
            </form>
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
                <div className="lp-footer-brand-tag"></div>
                <p className="lp-footer-brand-desc">
                  Empowering your business with real-time insights and analytics.
                </p>
              </div>
              <div>
                <div className="lp-f-col-title">Connect with Us</div>
                <div className="lp-f-social">
                  <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="lp-f-social-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                  </a>
                  <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="lp-f-social-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </a>
                  <a href="https://www.gmail.com" target="_blank" rel="noopener noreferrer" className="lp-f-social-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div className="lp-footer-bottom">
              <div className="lp-f-copy">© Spartan BTY Inc. All rights reserved.</div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
