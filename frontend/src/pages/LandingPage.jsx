import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import productPhoto from "../assets/bty_products.png";
import productPhoto2 from "../assets/bty_image2.png";
import productPhoto3 from "../assets/bty_image3.png";
import spartanLogo from "../assets/spartanbtylogo.webp";

const CAROUSEL_SLIDES = [
  { image: productPhoto },  // your existing import
  { image: productPhoto2 },
  { image: productPhoto3 },
];

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
    grid-template-columns: 44% 56%;
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

  /* HERO RIGHT */
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

    /* HERO IMAGE CAROUSEL */
  .lp-carousel-wrap {
    position: relative;
  }

  .lp-carousel-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transform: scale(1.04);
    transition: opacity 0.9s ease, transform 0.9s ease;
    pointer-events: none;
  }

  .lp-carousel-slide.active {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
  }

  .lp-carousel-slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }

  .lp-carousel-slide::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to left, transparent 65%, var(--warm) 100%);
    pointer-events: none;
    z-index: 2;
  }

  .lp-carousel-dots {
    position: absolute;
    bottom: 24px;
    right: 24px;
    display: flex;
    gap: 8px;
    z-index: 10;
  }

  .lp-carousel-dot {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    background: rgba(255,255,255,0.45);
    border: none;
    cursor: pointer;
    padding: 0;
    transition: all 0.3s ease;
  }

  .lp-carousel-dot.active {
    width: 24px;
    background: var(--rose);
    box-shadow: 0 2px 8px rgba(194,64,96,0.5);
  }

  .lp-carousel-prev,
  .lp-carousel-next {
    position: absolute;
    top: 50%;
    z-index: 10;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,0.85);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink);
    font-size: 22px;
    line-height: 1;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    opacity: 0;
  }

  .lp-carousel-wrap:hover .lp-carousel-prev,
  .lp-carousel-wrap:hover .lp-carousel-next {
    opacity: 1;
  }

  .lp-carousel-prev {
    left: 14px;
  }

  .lp-carousel-next {
    right: 14px;
  }

  .lp-carousel-prev:hover,
  .lp-carousel-next:hover {
    background: var(--rose);
    color: #fff;
    transform: translateY(-50%) scale(1.1);
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
  .lp-stat-num { font-family: 'Playfair Display', serif; font-size: 2.8rem; font-weight: 500; color: var(--rose); line-height: 1; transition: transform 0.3s ease; min-height: 3.2rem; display: flex; align-items: center; justify-content: center; }
  .lp-stat:hover .lp-stat-num { transform: scale(1.1); }
  .lp-stat-lbl { font-size: 10px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-soft); margin-top: 6px; }

  /* Skeleton shimmer for loading stats */
  .lp-stat-skeleton {
    display: inline-block; width: 80px; height: 2.8rem;
    background: linear-gradient(90deg, var(--line) 25%, var(--rose-pale) 50%, var(--line) 75%);
    background-size: 200% 100%;
    animation: lp-shimmer 1.4s infinite;
    border-radius: 6px;
  }
  @keyframes lp-shimmer { 0%{ background-position: 200% 0; } 100%{ background-position: -200% 0; } }

  /* LIVE SELLING */
  .lp-live { background: var(--cream); padding: 7rem 3rem; }
  .lp-live-inner { max-width: 1140px; margin: 0 auto; }
  .lp-live-header { margin-bottom: 2.8rem; }
  .lp-live-subtitle { font-size: 14px; font-weight: 300; color: var(--ink-soft); line-height: 1.8; max-width: 620px; margin-top: 0.8rem; }
  .lp-live-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.8rem; }

  /* Card */
  .lp-live-card {
    background: var(--white); border-radius: 16px; border: 1px solid var(--line);
    overflow: hidden; transition: all 0.3s ease; display: flex; flex-direction: column;
  }
  .lp-live-card:hover { transform: translateY(-6px); box-shadow: 0 12px 32px rgba(194,64,96,0.12); border-color: var(--rose-mid); }

  /* Thumbnail */
  .lp-live-thumb {
    width: 100%; height: 160px; object-fit: cover; display: block;
  }
  .lp-live-thumb-placeholder {
    width: 100%; height: 160px;
    background: linear-gradient(135deg, var(--rose) 0%, var(--rose-mid) 60%, var(--warm) 100%);
    display: flex; align-items: center; justify-content: center;
  }
  .lp-live-thumb-placeholder svg { width: 40px; height: 40px; color: rgba(255,255,255,0.6); }

  /* Card body */
  .lp-live-body { padding: 1.4rem; display: flex; flex-direction: column; flex: 1; }

  /* Badge row */
  .lp-live-badge-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.9rem; flex-wrap: wrap; gap: 0.5rem; }
  .lp-live-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 100px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;
  }
  .lp-live-badge.ongoing  { background: #d4edda; color: #155724; }
  .lp-live-badge.upcoming { background: #cce5ff; color: #004085; }
  .lp-live-badge.ended    { background: var(--line); color: var(--ink-soft); }
  .lp-live-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .lp-live-badge.ongoing .lp-live-badge-dot { animation: lp-pulse 1.2s infinite; }

  /* Platform pill */
  .lp-live-platform {
    font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
    padding: 3px 10px; border-radius: 100px; border: 1px solid var(--line);
    color: var(--ink-soft); background: var(--cream);
  }

  /* Card content */
  .lp-live-title { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 600; color: var(--ink); margin-bottom: 0.4rem; line-height: 1.4; }
  .lp-live-date { font-size: 11.5px; color: var(--ink-soft); font-weight: 400; margin-bottom: 0.7rem; display: flex; align-items: center; gap: 5px; }
  .lp-live-date svg { width: 12px; height: 12px; flex-shrink: 0; }
  .lp-live-desc { font-size: 13px; line-height: 1.75; color: var(--ink-soft); font-weight: 300; margin-bottom: 1.2rem; flex: 1; }

  /* Metrics */
  .lp-live-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem; margin-bottom: 1.2rem; }
  .lp-live-metric { background: var(--cream); border-radius: 8px; padding: 0.5rem 0.7rem; }
  .lp-live-metric-val { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 500; color: var(--rose); line-height: 1; }
  .lp-live-metric-lbl { font-size: 9px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; color: var(--ink-soft); margin-top: 2px; }

  /* CTA */
  .lp-live-cta {
    display: block; width: 100%; padding: 11px;
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
    text-align: center; text-decoration: none;
    border-radius: 8px; border: none; cursor: pointer; transition: all 0.3s ease;
  }
  .lp-live-cta.ongoing  { background: var(--rose); color: #fff; }
  .lp-live-cta.ongoing:hover  { background: var(--rose-deep); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(194,64,96,0.3); }
  .lp-live-cta.upcoming { background: var(--ink); color: #fff; }
  .lp-live-cta.upcoming:hover { background: #3a1828; transform: translateY(-2px); }
  .lp-live-cta.ended    { background: transparent; color: var(--ink); border: 1.5px solid var(--line); }
  .lp-live-cta.ended:hover    { border-color: var(--rose); color: var(--rose); background: var(--rose-pale); }

  /* Empty / Loading */
  .lp-live-empty { text-align: center; padding: 4rem 2rem; color: var(--ink-soft); font-size: 14px; font-weight: 300; }
  .lp-live-empty svg { width: 48px; height: 48px; color: var(--rose-mid); margin: 0 auto 1rem; display: block; }
  .lp-live-skeleton-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.8rem; }
  .lp-live-skeleton-card { background: var(--white); border-radius: 16px; border: 1px solid var(--line); overflow: hidden; }
  .lp-live-skeleton-thumb { width: 100%; height: 160px; background: linear-gradient(90deg, var(--line) 25%, var(--rose-pale) 50%, var(--line) 75%); background-size: 200% 100%; animation: lp-shimmer 1.4s infinite; }
  .lp-live-skeleton-body { padding: 1.4rem; display: flex; flex-direction: column; gap: 0.8rem; }
  .lp-live-skeleton-line { height: 12px; border-radius: 6px; background: linear-gradient(90deg, var(--line) 25%, var(--rose-pale) 50%, var(--line) 75%); background-size: 200% 100%; animation: lp-shimmer 1.4s infinite; }

  /* Responsive */
  @media (max-width: 960px) {
    .lp-live { padding: 5rem 2rem; }
    .lp-live-grid, .lp-live-skeleton-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
  }
  @media (max-width: 540px) {
    .lp-live { padding: 3.5rem 1.2rem; }
    .lp-live-grid, .lp-live-skeleton-grid { max-width: 100%; }
    .lp-live-metrics { grid-template-columns: repeat(2, 1fr); }
  }

/* FEATURED PROMOTIONS */
  .lp-offers { background: var(--white); padding: 5rem 3rem; }
  .lp-offers-inner { max-width: 1140px; margin: 0 auto; }
  .lp-offers-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.4rem; margin-top: 2rem; }
  .lp-offer-card { background: var(--cream); border-radius: 14px; border: 1px solid var(--line); padding: 1.4rem; transition: all 0.3s ease; position: relative; overflow: hidden; }
  .lp-offer-card::before { content:''; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,var(--rose),var(--rose-mid)); }
  .lp-offer-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(194,64,96,0.12); border-color: var(--rose-mid); }
  .lp-offer-code { display:inline-flex; align-items:center; gap:7px; background:var(--rose); color:#fff; padding:5px 12px; border-radius:9999px; font-size:13px; font-weight:700; letter-spacing:0.05em; margin-bottom:0.8rem; }
  .lp-offer-discount { font-family:'Playfair Display',serif; font-size:1.8rem; font-weight:600; color:var(--ink); margin-bottom:0.4rem; }
  .lp-offer-desc { font-size:13px; color:var(--ink-soft); font-weight:300; line-height:1.6; margin-bottom:0.8rem; }
  .lp-offer-meta { font-size:11px; color:var(--ink-soft); display:flex; flex-direction:column; gap:3px; }
  .lp-offer-meta strong { color:var(--ink); }
  @media (max-width: 960px) { .lp-offers { padding:4rem 2rem; } .lp-offers-grid { grid-template-columns:repeat(2,1fr); } }
  @media (max-width: 540px) { .lp-offers { padding:3rem 1.2rem; } .lp-offers-grid { grid-template-columns:1fr; } }


  /* FEATURED CAMPAIGNS */
  .lp-campaigns { background: var(--cream); padding: 7rem 3rem; }
  .lp-campaigns-inner { max-width: 1140px; margin: 0 auto; }
  .lp-campaigns-subtitle { font-size: 14px; font-weight: 300; color: var(--ink-soft); line-height: 1.8; max-width: 620px; margin-top: 0.8rem; }
  .lp-campaigns-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.8rem; margin-top: 2.4rem; }

  .lp-camp-card {
    background: var(--white); border-radius: 16px; border: 1px solid var(--line);
    padding: 1.6rem; display: flex; flex-direction: column; gap: 1rem;
    transition: all 0.3s ease; position: relative; overflow: hidden;
  }
  .lp-camp-card::before {
    content: ''; position: absolute; inset: 0 auto 0 0;
    width: 4px; background: linear-gradient(180deg, var(--rose), var(--rose-mid));
  }
  .lp-camp-card:hover { transform: translateY(-6px); box-shadow: 0 12px 32px rgba(194,64,96,0.12); border-color: var(--rose-mid); }

  .lp-camp-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
  .lp-camp-platform { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 9999px; background: var(--rose-pale); color: var(--rose); border: 1px solid var(--rose-mid); font-size: 11px; font-weight: 700; text-transform: capitalize; }
  .lp-camp-type { font-size: 10px; font-weight: 700; padding: 4px 9px; border-radius: 9999px; background: var(--warm); color: var(--ink-mid); border: 1px solid var(--line); text-transform: capitalize; }

  .lp-camp-headline { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 600; color: var(--ink); line-height: 1.35; margin-bottom: 0.2rem; }
  .lp-camp-subtitle { font-size: 13px; font-weight: 300; color: var(--ink-soft); line-height: 1.6; }
  .lp-camp-objective { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: var(--rose); }

  .lp-camp-dates { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--ink-soft); }
  .lp-camp-dates svg { width: 11px; height: 11px; flex-shrink: 0; }

  .lp-camp-featured-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 9999px;
    background: #fef9ec; color: #854d0e; border: 1px solid #ca8a04;
    font-size: 10px; font-weight: 800; align-self: flex-start;
  }

  /* LANDING MATERIALS */
  .lp-materials { background: var(--white); padding: 7rem 3rem; }
  .lp-materials-inner { max-width: 1140px; margin: 0 auto; }
  .lp-materials-subtitle { font-size: 14px; font-weight: 300; color: var(--ink-soft); line-height: 1.8; max-width: 620px; margin-top: 0.8rem; }
  .lp-materials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.6rem; margin-top: 2.4rem; }

  .lp-mat-card {
    background: var(--cream); border-radius: 14px; border: 1px solid var(--line);
    overflow: hidden; transition: all 0.3s ease;
  }
  .lp-mat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 28px rgba(194,64,96,0.1); border-color: var(--rose-mid); }

  .lp-mat-thumb {
    width: 100%; height: 180px; object-fit: cover; display: block;
  }
  .lp-mat-thumb-placeholder {
    width: 100%; height: 180px;
    background: linear-gradient(135deg, var(--rose) 0%, var(--rose-mid) 50%, var(--warm) 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  }
  .lp-mat-thumb-placeholder svg { width: 36px; height: 36px; color: rgba(255,255,255,0.6); }
  .lp-mat-thumb-placeholder span { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.7); letter-spacing: 1px; text-transform: uppercase; }

  .lp-mat-body { padding: 1.2rem; }
  .lp-mat-type-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
  .lp-mat-type { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--rose); }
  .lp-mat-platform { font-size: 10px; color: var(--ink-soft); font-weight: 600; }
  .lp-mat-title { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 600; color: var(--ink); margin-bottom: 0.4rem; line-height: 1.4; }
  .lp-mat-caption { font-size: 12px; color: var(--ink-soft); font-weight: 300; line-height: 1.6; margin-bottom: 0.8rem; font-style: italic; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .lp-mat-campaign { font-size: 11px; font-weight: 700; color: var(--ink-mid); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 5px; }
  .lp-mat-cta {
    display: inline-block; padding: 8px 16px; border-radius: 9999px;
    background: var(--rose); color: #fff;
    font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
    text-decoration: none; transition: all 0.3s ease;
  }
  .lp-mat-cta:hover { background: var(--rose-deep); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(194,64,96,0.3); }

  /* Responsive for campaign + materials sections */
  @media (max-width: 960px) {
    .lp-campaigns { padding: 5rem 2rem; }
    .lp-campaigns-grid { grid-template-columns: 1fr; max-width: 480px; margin-inline: auto; }
    .lp-materials { padding: 5rem 2rem; }
    .lp-materials-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 540px) {
    .lp-campaigns { padding: 3.5rem 1.2rem; }
    .lp-materials { padding: 3.5rem 1.2rem; }
    .lp-materials-grid { grid-template-columns: 1fr; }
  }


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
  .lp-fg-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.lp-form-message {
  margin-bottom: 1rem;
  padding: 11px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.lp-form-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.lp-form-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

  /* SUPPORT CENTER */
  .lp-support { background: var(--white); padding: 7rem 3rem; }
  .lp-support-inner { max-width: 1140px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1.2fr; gap: 4rem; }
  .lp-support-info { display: flex; flex-direction: column; gap: 2rem; }
  .lp-support-item { display: flex; align-items: start; gap: 1rem; }
  .lp-support-icon { width: 44px; height: 44px; background: var(--rose-pale); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--rose); flex-shrink: 0; transition: all 0.3s ease; }
  .lp-support-item:hover .lp-support-icon { background: var(--rose); color: #fff; transform: translateY(-3px); }
  .lp-support-icon svg { width: 20px; height: 20px; }
  .lp-support-label { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-soft); margin-bottom: 0.3rem; }
  .lp-support-value { font-size: 14px; font-weight: 500; color: var(--ink); line-height: 1.6; }
  .lp-support-value a { color: var(--rose); text-decoration: none; transition: color 0.2s; }
  .lp-support-value a:hover { color: var(--rose-deep); text-decoration: underline; }
  .lp-support-form { background: var(--cream); border-radius: 16px; padding: 2.5rem; border: 1px solid var(--line); }
  .lp-support-note { font-size: 12px; color: var(--ink-soft); font-weight: 300; margin-top: 1rem; line-height: 1.6; }
  .lp-support-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .lp-support-file { display: flex; align-items: center; gap: 0.75rem; padding: 12px 16px; background: var(--white); border: 1px solid var(--line); border-radius: 8px; cursor: pointer; transition: all 0.3s ease; }
  .lp-support-file:hover { border-color: var(--rose); background: var(--rose-pale); }
  .lp-support-file svg { width: 18px; height: 18px; color: var(--ink-soft); }
  .lp-support-file:hover svg { color: var(--rose); }
  .lp-support-file-text { font-size: 13px; color: var(--ink-soft); font-weight: 400; }
  .lp-support-status { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
  .lp-support-status.pending { background: #fff3cd; color: #856404; }
  .lp-support-status.in-progress { background: #cce5ff; color: #004085; }
  .lp-support-status.resolved { background: #d4edda; color: #155724; }

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

  .lp-animate { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
  .lp-animate.lp-visible { opacity: 1; transform: translateY(0); }
  .lp-animate-left { opacity: 0; transform: translateX(-40px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
  .lp-animate-left.lp-visible { opacity: 1; transform: translateX(0); }
  .lp-animate-right { opacity: 0; transform: translateX(40px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
  .lp-animate-right.lp-visible { opacity: 1; transform: translateX(0); }
  .lp-animate-scale { opacity: 0; transform: scale(0.9); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
  .lp-animate-scale.lp-visible { opacity: 1; transform: scale(1); }

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
    .lp-support { padding: 3.5rem 1.2rem; }
    .lp-support-inner { grid-template-columns: 1fr; gap: 3rem; }
    .lp-support-row { grid-template-columns: 1fr; }
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
  const [activeSection, setActiveSection] = useState("hero");
  
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  useEffect(() => {
    if (carouselPaused) return;

    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [carouselPaused]);

  // ── DYNAMIC STATS ──────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total_users: null,
    total_orders: null,
    avg_rating: null,
    completed_shipments: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/public/landing-stats`)
      .then((res) => {
        setStats(res.data);
        setStatsLoading(false);
      })
      .catch(() => {
        setStatsError(true);
        setStatsLoading(false);
      });
  }, []);

  const renderStatNum = (value, suffix = "") => {
    if (statsLoading) return <span className="lp-stat-skeleton" />;
    if (statsError || value === null || value === undefined)
      return <span style={{ fontSize: "1.6rem", opacity: 0.4 }}>—</span>;
    return (
      <>
        {Number(value).toLocaleString()}
        {suffix}
      </>
    );
  };
  // ───────────────────────────────────────────────────────────────────────────

// ── LIVE SELLING ────────────────────────────────────────────────────────────
const [liveSessions, setLiveSessions] = useState([]);
const [liveLoading, setLiveLoading] = useState(true);

useEffect(() => {
  axios
    .get(`${import.meta.env.VITE_API_URL}/public/live-selling`)
    .then((res) => {
      setLiveSessions(res.data?.data || []);
      setLiveLoading(false);
    })
    .catch(() => {
      setLiveSessions([]);
      setLiveLoading(false);
    });
}, []);
// ────────────────────────────────────────────────────────────────────────────
const [featuredPromos, setFeaturedPromos] = useState([]);

useEffect(() => {
  axios
    .get(`${import.meta.env.VITE_API_URL}/public/featured-promotions`)
    .then(res => setFeaturedPromos(res.data?.data || []))
    .catch(() => setFeaturedPromos([]));
}, []);

// ── FEATURED CAMPAIGNS ────────────────────────────────────────────────────────
const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
const [landingMaterials, setLandingMaterials]   = useState([]);

useEffect(() => {
  axios
    .get(`${import.meta.env.VITE_API_URL}/public/featured-campaigns`)
    .then(res => setFeaturedCampaigns(res.data?.data || []))
    .catch(() => setFeaturedCampaigns([]));
}, []);

useEffect(() => {
  axios
    .get(`${import.meta.env.VITE_API_URL}/public/landing-materials`)
    .then(res => setLandingMaterials(res.data?.data || []))
    .catch(() => setLandingMaterials([]));
}, []);
// ─────────────────────────────────────────────────────────────────────────────


  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

const [feedbackLoading, setFeedbackLoading] = useState(false);
const [supportLoading, setSupportLoading] = useState(false);

const [feedbackSuccess, setFeedbackSuccess] = useState("");
const [feedbackError, setFeedbackError] = useState("");

const [supportSuccess, setSupportSuccess] = useState("");
const [supportError, setSupportError] = useState("");

const [feedbackForm, setFeedbackForm] = useState({
  module: "",
  feedback_type: "",
  rating: "",
  message: "",
});

const [supportForm, setSupportForm] = useState({
  module: "",
  issue_type: "",
  priority: "",
  description: "",
  screenshot: null,
});

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/$/,
  ""
);

const buildApiUrl = (path) => {
  if (API_BASE.endsWith("/api")) {
    return `${API_BASE}${path.replace(/^\/api/, "")}`;
  }

  return `${API_BASE}${path}`;
};

const getToken = () => {
  return localStorage.getItem("token");
};

const handleFeedbackChange = (e) => {
  const { name, value } = e.target;

  setFeedbackForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};

const handleSupportChange = (e) => {
  const { name, value } = e.target;

  setSupportForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};

const handleFeedbackSubmit = async (e) => {
  e.preventDefault();

  setFeedbackSuccess("");
  setFeedbackError("");

  if (!isAuthenticated()) {
    setFeedbackError("Please sign in first before submitting feedback.");
    return;
  }

  if (!feedbackForm.module || !feedbackForm.feedback_type || !feedbackForm.message) {
    setFeedbackError("Please complete all required feedback fields.");
    return;
  }

  const token = getToken();

  if (!token) {
    setFeedbackError("Authentication token is missing. Please sign in again.");
    return;
  }

  try {
    setFeedbackLoading(true);

    const response = await axios.post(
      buildApiUrl("/api/internal/feedback-email"),
      feedbackForm,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setFeedbackSuccess(response.data?.message || "Feedback sent successfully.");

    setFeedbackForm({
      module: "",
      feedback_type: "",
      rating: "",
      message: "",
    });
  } catch (error) {
    setFeedbackError(
      error.response?.data?.message ||
        "Unable to send feedback. Please try again."
    );
  } finally {
    setFeedbackLoading(false);
  }
};

const handleSupportSubmit = async (e) => {
  e.preventDefault();

  setSupportSuccess("");
  setSupportError("");

  if (!isAuthenticated()) {
    setSupportError("Please sign in first before submitting a support ticket.");
    return;
  }

  if (
    !supportForm.module ||
    !supportForm.issue_type ||
    !supportForm.priority ||
    !supportForm.description
  ) {
    setSupportError("Please complete all required support ticket fields.");
    return;
  }

  const token = getToken();

  if (!token) {
    setSupportError("Authentication token is missing. Please sign in again.");
    return;
  }

  try {
    setSupportLoading(true);

    const formData = new FormData();
    formData.append("module", supportForm.module);
    formData.append("issue_type", supportForm.issue_type);
    formData.append("priority", supportForm.priority);
    formData.append("description", supportForm.description);

    if (supportForm.screenshot) {
      formData.append("screenshot", supportForm.screenshot);
    }

    const response = await axios.post(
      buildApiUrl("/api/internal/support-email"),
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setSupportSuccess(
      response.data?.message || "Support ticket sent successfully."
    );

    setSupportForm({
      module: "",
      issue_type: "",
      priority: "",
      description: "",
      screenshot: null,
    });

    const screenshotInput = document.getElementById("supportScreenshot");
    if (screenshotInput) screenshotInput.value = "";
  } catch (error) {
    setSupportError(
      error.response?.data?.message ||
        "Unable to submit support ticket. Please try again."
    );
  } finally {
    setSupportLoading(false);
  }
};

const handleScreenshotChange = (e) => {
  const file = e.target.files?.[0];

  setSupportError("");

  if (!file) {
    setSupportForm((prev) => ({
      ...prev,
      screenshot: null,
    }));
    return;
  }

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    setSupportError("Only JPG, JPEG, PNG, and WEBP screenshots are allowed.");
    e.target.value = "";
    return;
  }

  if (file.size > maxSize) {
    setSupportError("Screenshot must not exceed 5MB.");
    e.target.value = "";
    return;
  }

  setSupportForm((prev) => ({
    ...prev,
    screenshot: file,
  }));
};


  useEffect(() => {
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("lp-visible");
      });
    }, observerOptions);
    const animatedElements = document.querySelectorAll(
      ".lp-animate, .lp-animate-left, .lp-animate-right, .lp-animate-scale"
    );
    animatedElements.forEach((el) => observer.observe(el));
    return () => animatedElements.forEach((el) => observer.unobserve(el));
  }, [liveSessions, statsLoading, featuredCampaigns, landingMaterials]);

  useEffect(() => {
    const sections = ['hero', 'live-selling', 'campaigns', 'story', 'faq', 'support'];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      for (const sectionId of sections) {
        const section = document.getElementById(sectionId);
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest(".lp-user-dropdown")) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownOpen]);

  return (
    <>
      <style>{styles}</style>
      <div className="lp">

        {/* NAV */}
        <nav className="lp-nav">
          <div className="lp-nav-logo" onClick={() => scrollTo("hero")}>
            <img src={spartanLogo} alt="Spartan BTY Logo" width="32" height="32" style={{ borderRadius: "50%" }} />
            <div>
              <div className="lp-nav-logo-name">Spartan BTY Inc.</div>
              <div className="lp-nav-logo-sub">Management Information System</div>
            </div>
          </div>

          <div className="lp-nav-center">
            <a className={activeSection === "hero" ? "active" : ""} onClick={() => scrollTo("hero")}>Home</a>
            <a className={activeSection === "live-selling" ? "active" : ""} onClick={() => scrollTo("live-selling")}>Live Selling</a>
            <a className={activeSection === "campaigns" ? "active" : ""} onClick={() => scrollTo("campaigns")}>Campaigns</a>
            <a className={activeSection === "story" ? "active" : ""} onClick={() => scrollTo("story")}>Our Story</a>
            <a className={activeSection === "faq" ? "active" : ""} onClick={() => scrollTo("faq")}>FAQ</a>
            <a className={activeSection === "support" ? "active" : ""} onClick={() => scrollTo("support")}>Support</a>
          </div>

          <div className="lp-nav-right">
            {isAuthenticated() ? (
              <div className={`lp-user-dropdown${userDropdownOpen ? " open" : ""}`}>
                <div className="lp-user-trigger" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                  <div className="lp-user-avatar">
                    {(user?.full_name || user?.name || user?.username || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="lp-user-name">{user?.full_name || user?.name || user?.username}</span>
                  <svg className="lp-user-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
                <div className="lp-dropdown-menu">
                  <div className="lp-dropdown-item" onClick={() => { setUserDropdownOpen(false); logout(); navigate("/"); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
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
            <span /><span /><span />
          </button>
        </nav>

        {/* MOBILE MENU */}
        <div className={`lp-mob-menu${menuOpen ? " open" : ""}`}>
          <a onClick={() => scrollTo("hero")}>Home</a>
          <a onClick={() => scrollTo("live-selling")}>Live Selling</a>
          <a onClick={() => scrollTo("campaigns")}>Campaigns</a>
          <a onClick={() => scrollTo("story")}>Our Story</a>
          <a onClick={() => scrollTo("faq")}>FAQ</a>
          <a onClick={() => scrollTo("support")}>Support</a>
          <div className="lp-mob-menu-btns">
            {isAuthenticated() ? (
              <>
                <div style={{ textAlign: "center", marginBottom: "0.5rem", fontSize: "12px", color: "var(--ink-soft)" }}>
                  Welcome, {user?.full_name || user?.name || user?.username}
                </div>
                <button className="lp-nav-cta" onClick={() => { logout(); navigate("/"); }}>Sign Out</button>
              </>
            ) : (
              <button className="lp-nav-cta" onClick={() => navigate("/login")}>Sign In</button>
            )}
          </div>
        </div>

                {/* HERO */}
        <section className="lp-hero" id="hero">

          {/* LEFT — completely static, original text unchanged */}
          <div className="lp-hero-left">
            <div className="lp-hero-eyebrow">
              <div className="lp-hero-eyebrow-line" />
              <span className="lp-hero-eyebrow-text">Web-Based MIS · Est. 2025</span>
            </div>
            <h1 className="lp-hero-title">
              Because Your Team<br />
              Deserves <em>Pure Clarity</em>
            </h1>
            <p className="lp-hero-sub">
              At Spartan BTY Inc., we are dedicated to making someone feel better
              than yesterday through exceptional service and smart operations.<br /><br />
              <strong>We put the CARE in skincare.</strong>
            </p>
            <div className="lp-hero-btns">
              <button className="lp-btn-primary" onClick={handleAccessSystem}>
                Access System
              </button>
              <button className="lp-btn-outline" onClick={() => scrollTo("story")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
                Our Story
              </button>
            </div>
          </div>

          {/* RIGHT — image carousel only */}
          <div
            className="lp-hero-right lp-carousel-wrap"
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
          >
            {CAROUSEL_SLIDES.map((slide, i) => (
              <div
                key={i}
                className={`lp-carousel-slide${i === carouselIndex ? " active" : ""}`}
              >
                <img
                  src={slide.image}
                  alt={`Spartan BTY product ${i + 1}`}
                />
              </div>
            ))}

            <button
              type="button"
              className="lp-carousel-prev"
              onClick={() =>
                setCarouselIndex(
                  (carouselIndex - 1 + CAROUSEL_SLIDES.length) %
                    CAROUSEL_SLIDES.length
                )
              }
              aria-label="Previous slide"
            >
              ‹
            </button>

            <button
              type="button"
              className="lp-carousel-next"
              onClick={() =>
                setCarouselIndex((carouselIndex + 1) % CAROUSEL_SLIDES.length)
              }
              aria-label="Next slide"
            >
              ›
            </button>

            <div className="lp-carousel-dots">
              {CAROUSEL_SLIDES.map((_, i) => (
                <button
                  type="button"
                  key={i}
                  className={`lp-carousel-dot${i === carouselIndex ? " active" : ""}`}
                  onClick={() => setCarouselIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
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
              "BTY Advance",
              "Making someone feel better than yesterday",
              "We put the CARE in skincare",
              "Established December 2018",
              "Present in 30+ countries",
              "BTY Advance",
            ].map((t, i) => (
              <span className="lp-tagline-item" key={i}>
                {t}<span className="lp-tagline-dot" />
              </span>
            ))}
          </div>
        </div>

        {/* ── DYNAMIC STATS ─────────────────────────────────────────────────── */}
        <div className="lp-stats lp-animate">
          <div className="lp-stats-inner">
            <div className={`lp-stat lp-animate-scale lp-stagger-1`}>
              <div className="lp-stat-num">{renderStatNum(stats.total_users, "+")}</div>
              <div className="lp-stat-lbl">Registered Users</div>
            </div>
            <div className={`lp-stat lp-animate-scale lp-stagger-2`}>
              <div className="lp-stat-num">{renderStatNum(stats.avg_rating, " ★")}</div>
              <div className="lp-stat-lbl">Average Rating</div>
            </div>
            <div className={`lp-stat lp-animate-scale lp-stagger-3`}>
              <div className="lp-stat-num">{renderStatNum(stats.total_orders, "+")}</div>
              <div className="lp-stat-lbl">Total Orders</div>
            </div>
            <div className={`lp-stat lp-animate-scale lp-stagger-4`}>
              <div className="lp-stat-num">{renderStatNum(stats.completed_shipments, "+")}</div>
              <div className="lp-stat-lbl">Completed Shipments</div>
            </div>
          </div>
        </div>
        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* LIVE SELLING HIGHLIGHTS */}
        <section className="lp-live lp-animate" id="live-selling">
          <div className="lp-live-inner">
            <div className="lp-live-header">
              <div className="lp-s-label">Live Selling</div>
              <h2 className="lp-s-title">Live Selling <em>Highlights</em></h2>
              <p className="lp-live-subtitle">
                Discover upcoming and ongoing Spartan BTY live selling sessions featuring skincare products, promos, and real-time customer engagement.
              </p>
            </div>

            {liveLoading ? (
              <div className="lp-live-skeleton-grid">
                {[1, 2, 3].map((i) => (
                  <div className="lp-live-skeleton-card" key={i}>
                    <div className="lp-live-skeleton-thumb" />
                    <div className="lp-live-skeleton-body">
                      <div className="lp-live-skeleton-line" style={{ width: '40%' }} />
                      <div className="lp-live-skeleton-line" style={{ width: '80%' }} />
                      <div className="lp-live-skeleton-line" style={{ width: '60%' }} />
                      <div className="lp-live-skeleton-line" style={{ width: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : liveSessions.length === 0 ? (
              <div className="lp-live-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                <p>No live selling sessions at the moment.<br/>Check back soon for upcoming sessions!</p>
              </div>
            ) : (
              <div className="lp-live-grid">
                {liveSessions.map((session, i) => {
                  const badgeLabel   = session.status === 'ongoing' ? 'Now Live' : session.status === 'upcoming' ? 'Upcoming' : 'Ended';
                  const ctaLabel     = session.status === 'ongoing' ? 'Watch Live' : session.status === 'upcoming' ? 'View Schedule' : 'View Summary';
                  const dateStr      = session.scheduled_date
                    ? new Date(session.scheduled_date).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Date TBA';
                  const showMetrics  = session.status === 'ongoing' || session.status === 'ended';

                  return (
                    <div className={`lp-live-card lp-animate-scale lp-stagger-${i + 1}`} key={session.id}>
                      {session.thumbnail_url ? (
                        <img src={session.thumbnail_url} alt={session.title} className="lp-live-thumb" />
                      ) : (
                        <div className="lp-live-thumb-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                          </svg>
                        </div>
                      )}

                      <div className="lp-live-body">
                        <div className="lp-live-badge-row">
                          <span className={`lp-live-badge ${session.status}`}>
                            <span className="lp-live-badge-dot" />
                            {badgeLabel}
                          </span>
                          <span className="lp-live-platform">{session.platform}</span>
                        </div>

                        <div className="lp-live-title">{session.title}</div>
                        <div className="lp-live-date">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {dateStr}
                        </div>

                        {session.description && (
                          <p className="lp-live-desc">{session.description}</p>
                        )}

                        {showMetrics && (
                          <div className="lp-live-metrics">
                            <div className="lp-live-metric">
                              <div className="lp-live-metric-val">{Number(session.total_views).toLocaleString()}</div>
                              <div className="lp-live-metric-lbl">Views</div>
                            </div>
                            <div className="lp-live-metric">
                              <div className="lp-live-metric-val">{Number(session.total_clicks).toLocaleString()}</div>
                              <div className="lp-live-metric-lbl">Clicks</div>
                            </div>
                            <div className="lp-live-metric">
                              <div className="lp-live-metric-val">{Number(session.total_impressions).toLocaleString()}</div>
                              <div className="lp-live-metric-lbl">Impressions</div>
                            </div>
                            <div className="lp-live-metric">
                              <div className="lp-live-metric-val">{Number(session.engagement_rate).toFixed(1)}%</div>
                              <div className="lp-live-metric-lbl">Engagement</div>
                            </div>
                          </div>
                        )}

                        {session.live_url ? (
                          <a href={session.live_url} target="_blank" rel="noopener noreferrer" className={`lp-live-cta ${session.status}`}>
                            {ctaLabel}
                          </a>
                        ) : (
                          <span className={`lp-live-cta ${session.status}`} style={{ opacity: 0.5, cursor: 'default' }}>
                            {ctaLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* FEATURED PROMOTIONS */}
        {featuredPromos.length > 0 && (
          <section className="lp-offers lp-animate">
            <div className="lp-offers-inner">
              <div className="lp-s-label">Current Offers</div>
              <h2 className="lp-s-title">Featured <em>Promotions</em></h2>
              <div className="lp-offers-grid">
                {featuredPromos.map((p, i) => (
                  <div className={`lp-offer-card lp-animate-scale lp-stagger-${i+1}`} key={p.id}>
                    <div className="lp-offer-code">🎫 {p.promo_code}</div>
                    <div className="lp-offer-discount">
                      {p.discount_type === 'percentage'
                        ? `${p.discount_value}% OFF`
                        : `₱${Number(p.discount_value).toLocaleString()} OFF`}
                    </div>
                    <p className="lp-offer-desc">{p.description || 'Limited time offer on Spartan BTY products.'}</p>
                    <div className="lp-offer-meta">
                      <span>Min. order: <strong>₱{Number(p.min_order).toLocaleString()}</strong></span>
                      {p.max_discount_cap && <span>Max discount: <strong>₱{Number(p.max_discount_cap).toLocaleString()}</strong></span>}
                      <span>Valid until: <strong>{new Date(p.end_date).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FEATURED CAMPAIGNS ─────────────────────────────────────────────── */}
        {featuredCampaigns.length > 0 && (
          <section className="lp-campaigns lp-animate" id="campaigns">
            <div className="lp-campaigns-inner">
              <div className="lp-s-label">Active Campaigns</div>
              <h2 className="lp-s-title">Featured <em>Campaigns</em></h2>
              <p className="lp-campaigns-subtitle">
                Discover our latest marketing campaigns — seasonal promos, product launches,
                and exclusive offers from Spartan BTY Inc.
              </p>

              <div className="lp-campaigns-grid">
                {featuredCampaigns.map((c, i) => (
                  <div
                    key={c.id}
                    className={`lp-camp-card lp-animate-scale lp-stagger-${i + 1}`}
                  >
                    <div className="lp-camp-card-top">
                      <span className="lp-camp-platform">
                        {c.platform}
                      </span>
                      {c.campaign_type && (
                        <span className="lp-camp-type">{c.campaign_type}</span>
                      )}
                    </div>

                    {/* Headline — uses landing_headline if set, else title */}
                    <div>
                      <div className="lp-camp-headline">
                        {c.landing_headline || c.title}
                      </div>
                      {(c.landing_subtitle || c.description) && (
                        <p className="lp-camp-subtitle">
                          {c.landing_subtitle || c.description}
                        </p>
                      )}
                    </div>

                    {c.objective && (
                      <span className="lp-camp-objective">
                        🎯 {c.objective}
                      </span>
                    )}

                    {c.season_event && (
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: '#9a5f0f', display: 'inline-flex',
                        alignItems: 'center', gap: 5,
                      }}>
                        🌟 {c.season_event}
                      </span>
                    )}

                    <div className="lp-camp-dates">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {new Date(c.start_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      {' → '}
                      {new Date(c.end_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>

                    {c.is_featured && (
                      <span className="lp-camp-featured-badge">⭐ Featured</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* LANDING MATERIALS ──────────────────────────────────────────────── */}
        {landingMaterials.length > 0 && (
          <section className="lp-materials lp-animate">
            <div className="lp-materials-inner">
              <div className="lp-s-label">Advertising Materials</div>
              <h2 className="lp-s-title">Campaign <em>Highlights</em></h2>
              <p className="lp-materials-subtitle">
                Approved posters, banners, and promotional materials from our latest campaigns.
              </p>

              <div className="lp-materials-grid">
                {landingMaterials.map((m, i) => (
                  <div
                    key={m.id}
                    className={`lp-mat-card lp-animate-scale lp-stagger-${i + 1}`}
                  >
                    {/* Thumbnail — shows file if image URL, else gradient placeholder */}
                    {m.file_url && m.file_url.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                      <img
                        src={m.file_url}
                        alt={m.title}
                        className="lp-mat-thumb"
                      />
                    ) : (
                      <div className="lp-mat-thumb-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span>{String(m.material_type || '').replaceAll('_', ' ')}</span>
                      </div>
                    )}

                    <div className="lp-mat-body">
                      <div className="lp-mat-type-row">
                        <span className="lp-mat-type">
                          {String(m.material_type || '').replaceAll('_', ' ')}
                        </span>
                        {m.platform && (
                          <span className="lp-mat-platform">{m.platform}</span>
                        )}
                      </div>

                      <div className="lp-mat-title">{m.title}</div>

                      {m.caption && (
                        <p className="lp-mat-caption">"{m.caption}"</p>
                      )}

                      {m.campaign_title && (
                        <div className="lp-mat-campaign">
                          🎯 {m.campaign_title}
                        </div>
                      )}

                      {m.call_to_action && m.file_url && (
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lp-mat-cta"
                        >
                          {m.call_to_action}
                        </a>
                      )}
                      {m.call_to_action && !m.file_url && (
                        <span className="lp-mat-cta" style={{ cursor: 'default', opacity: 0.8 }}>
                          {m.call_to_action}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        {/* ─────────────────────────────────────────────────────────────────── */}

        {/* OUR STORY */}
        <section className="lp-story" id="story">
          <div className="lp-story-inner">
            <div className="lp-animate-left">
              <div className="lp-s-label">Our Story</div>
              <h2 className="lp-s-title">A journey built on<br /><em>genuine care</em></h2>
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
           <form className="lp-feedback-form lp-animate-scale" onSubmit={handleFeedbackSubmit}>
  {feedbackSuccess && (
    <div className="lp-form-message success">{feedbackSuccess}</div>
  )}

  {feedbackError && (
    <div className="lp-form-message error">{feedbackError}</div>
  )}

  <div className="lp-fg-group">
    <label className="lp-fg-label">Module</label>
    <select
      name="module"
      className="lp-fg-input"
      value={feedbackForm.module}
      onChange={handleFeedbackChange}
      required
    >
      <option value="">Select module...</option>
      <option value="Dashboard">Dashboard</option>
      <option value="Sales">Sales</option>
      <option value="Inventory">Inventory</option>
      <option value="Logistics">Logistics</option>
      <option value="CRM">CRM</option>
      <option value="HR">HR</option>
      <option value="Marketing">Marketing</option>
    </select>
  </div>

  <div className="lp-fg-group">
    <label className="lp-fg-label">Feedback Type</label>
    <select
      name="feedback_type"
      className="lp-fg-input"
      value={feedbackForm.feedback_type}
      onChange={handleFeedbackChange}
      required
    >
      <option value="">Select type...</option>
      <option value="Bug Report">Bug Report</option>
      <option value="Feature Request">Feature Request</option>
      <option value="Improvement Suggestion">Improvement Suggestion</option>
      <option value="Usability Concern">Usability Concern</option>
      <option value="Other">Other</option>
    </select>
  </div>

  <div className="lp-fg-group">
    <label className="lp-fg-label">Rating Optional</label>
    <select
      name="rating"
      className="lp-fg-input"
      value={feedbackForm.rating}
      onChange={handleFeedbackChange}
    >
      <option value="">No rating</option>
      <option value="5">5 - Excellent</option>
      <option value="4">4 - Good</option>
      <option value="3">3 - Average</option>
      <option value="2">2 - Needs Improvement</option>
      <option value="1">1 - Poor</option>
    </select>
  </div>

  <div className="lp-fg-group">
    <label className="lp-fg-label">Your Message</label>
    <textarea
      name="message"
      className="lp-fg-input lp-fg-textarea"
      placeholder="Describe your feedback in detail..."
      value={feedbackForm.message}
      onChange={handleFeedbackChange}
      required
    />
  </div>

  <button type="submit" className="lp-fg-submit" disabled={feedbackLoading}>
    {feedbackLoading ? "Sending..." : "Submit Feedback"}
  </button>
</form>
          </div>
        </section>

        {/* SUPPORT CENTER */}
        <section className="lp-support" id="support">
          <div className="lp-support-inner">
            <div className="lp-support-info lp-animate-left">
              <div className="lp-s-label">System Support</div>
              <h2 className="lp-s-title">Support <em>Center</em></h2>
              <div className="lp-support-item">
                <div className="lp-support-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <div className="lp-support-label">Email Support</div>
                  <div className="lp-support-value"><a href="mailto:itsupport@spartanbty.com">itsupport@spartanbty.com</a></div>
                </div>
              </div>
              <div className="lp-support-item">
                <div className="lp-support-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <div className="lp-support-label">Response Time</div>
                  <div className="lp-support-value">24-48 hours during business days</div>
                </div>
              </div>
              <div className="lp-support-item">
                <div className="lp-support-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <div className="lp-support-label">Hotline</div>
                  <div className="lp-support-value"><a href="tel:+639927956848">+63 992 795 6848</a></div>
                </div>
              </div>
              <div className="lp-support-item">
                <div className="lp-support-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div>
                  <div className="lp-support-label">Ticket Status</div>
                  <div className="lp-support-value">
                    <span className="lp-support-status pending">● Pending</span>{" "}
                    <span className="lp-support-status in-progress">● In Progress</span>{" "}
                    <span className="lp-support-status resolved">● Resolved</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-support-form lp-animate-right">
              <div className="lp-s-label">Submit a Ticket</div>
              <h2 className="lp-s-title">New <em>Request</em></h2>
             <form onSubmit={handleSupportSubmit}>
  {supportSuccess && (
    <div className="lp-form-message success">{supportSuccess}</div>
  )}

  {supportError && (
    <div className="lp-form-message error">{supportError}</div>
  )}

  <div className="lp-support-row">
    <div className="lp-fg-group">
      <label className="lp-fg-label">Module</label>
      <select
        name="module"
        className="lp-fg-input"
        value={supportForm.module}
        onChange={handleSupportChange}
        required
      >
        <option value="">Select module...</option>
        <option value="Dashboard">Dashboard</option>
        <option value="Sales">Sales</option>
        <option value="Inventory">Inventory</option>
        <option value="Logistics">Logistics</option>
        <option value="CRM">CRM</option>
        <option value="HR">HR</option>
        <option value="Marketing">Marketing</option>
      </select>
    </div>

    <div className="lp-fg-group">
      <label className="lp-fg-label">Issue Type</label>
      <select
        name="issue_type"
        className="lp-fg-input"
        value={supportForm.issue_type}
        onChange={handleSupportChange}
        required
      >
        <option value="">Select type...</option>
        <option value="Bug">Bug</option>
        <option value="Request">Request</option>
        <option value="Access Issue">Access Issue</option>
        <option value="Data Error">Data Error</option>
        <option value="Performance Issue">Performance Issue</option>
        <option value="Other">Other</option>
      </select>
    </div>
  </div>

  <div className="lp-fg-group">
    <label className="lp-fg-label">Priority</label>
    <select
      name="priority"
      className="lp-fg-input"
      value={supportForm.priority}
      onChange={handleSupportChange}
      required
    >
      <option value="">Select priority...</option>
      <option value="Low">Low</option>
      <option value="Medium">Medium</option>
      <option value="High">High</option>
      <option value="Critical">Critical</option>
    </select>
  </div>

  <div className="lp-fg-group">
    <label className="lp-fg-label">Description</label>
    <textarea
      name="description"
      className="lp-fg-input lp-fg-textarea"
      placeholder="Describe the issue in detail..."
      value={supportForm.description}
      onChange={handleSupportChange}
      required
    />
  </div>

  <div className="lp-fg-group">
    <label className="lp-fg-label">Attach Screenshot Optional</label>
    <label className="lp-support-file">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>

      <span className="lp-support-file-text">
        {supportForm.screenshot
          ? supportForm.screenshot.name
          : "Click to upload screenshot"}
      </span>

      <input
        id="supportScreenshot"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleScreenshotChange}
      />
    </label>
  </div>

  <button type="submit" className="lp-fg-submit" disabled={supportLoading}>
    {supportLoading ? "Submitting..." : "Submit Ticket"}
  </button>

  <p className="lp-support-note">
    Your support request will be sent directly to the IT support email.
  </p>
</form>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer" id="contact">
          <div className="lp-footer-inner">
            <div className="lp-footer-top">
              <div>
                <div className="lp-footer-brand-logo">
                  <img src={spartanLogo} alt="Spartan BTY Logo" width="28" height="28" style={{ borderRadius: "50%" }} />
                  <div className="lp-footer-brand-name">Spartan BTY Inc.</div>
                </div>
                <div className="lp-footer-brand-tag"></div>
                <p className="lp-footer-brand-desc">Empowering your business with real-time insights and analytics.</p>
              </div>
              <div>
                <div className="lp-f-col-title">Connect with Us</div>
                <div className="lp-f-social">
                  <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="lp-f-social-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                  <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="lp-f-social-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                  <a href="https://www.gmail.com" target="_blank" rel="noopener noreferrer" className="lp-f-social-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
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