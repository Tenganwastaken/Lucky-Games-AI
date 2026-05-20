'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import HomeFooter from '@/components/home/HomeFooter';
import HomeNavbar from '@/components/home/HomeNavbar';
import HeroOrbits from '@/components/home/HeroOrbits';
import Skeleton from '@/components/Skeleton';
import { useReveal } from '@/hooks/useReveal';
import {
  HOME_BENTO_ADVISOR_DESC,
  HOME_BENTO_ADVISOR_TITLE,
  HOME_BENTO_INDICATORS_DESC,
  HOME_BENTO_INDICATORS_TITLE,
  HOME_BENTO_LIVE_DESC,
  HOME_BENTO_LIVE_TITLE,
  HOME_BENTO_MAP_DESC,
  HOME_BENTO_MAP_TITLE,
  HOME_BENTO_PGSI_DESC,
  HOME_BENTO_PGSI_TITLE,
  HOME_HERO_CTA_ADVISOR,
  HOME_HERO_CTA_PGSI,
  HOME_HERO_LINE1,
  HOME_HERO_LINE2,
  HOME_HERO_SUBTITLE,
  HOME_HERO_TRUST,
  HOME_MAP_DESC,
  HOME_MAP_TITLE,
  HOME_SCROLL_HINT,
  HOME_SECTION_MAP_LABEL,
  HOME_VERSION_BADGE,
} from '@/lib/strings';

const WorldMap = dynamic(() => import('@/components/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="skeleton-block" aria-busy="true" aria-label="Φόρτωση χάρτη">
      <Skeleton variant="map" />
    </div>
  ),
});

function BentoCard({ href, icon, title, description, className = '' }) {
  return (
    <Link href={href} className={`bento-card ui-card ui-card--interactive ${className}`.trim()}>
      <div className="ui-card__body bento-card__body">
        <span className="bento-card__icon" aria-hidden>
          {icon}
        </span>
        <h3 className="bento-card__title">{title}</h3>
        <p className="bento-card__desc">{description}</p>
      </div>
    </Link>
  );
}

export default function HomePageClient() {
  const featuresRevealRef = useReveal();
  const mapRevealRef = useReveal();

  return (
    <main id="main-content" className="home-page">
      <HomeNavbar />

      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-container home-hero__layout">
          <div className="home-hero__copy">
            <span className="home-version-badge">{HOME_VERSION_BADGE}</span>

            <h1 id="home-hero-title" className="home-hero__title">
              <span className="home-hero__title-line">{HOME_HERO_LINE1}</span>
              <span className="home-hero__title-line home-hero__title-line--gradient">
                {HOME_HERO_LINE2}
              </span>
            </h1>

            <p className="home-hero__subtitle">{HOME_HERO_SUBTITLE}</p>

            <div className="home-hero__ctas">
              <Link href="/advisor" className="btn btn-primary btn-pill home-hero__cta-primary">
                {HOME_HERO_CTA_ADVISOR}
              </Link>
              <Link href="/screener" className="btn btn-ghost btn-pill">
                {HOME_HERO_CTA_PGSI}
              </Link>
            </div>

            <p className="home-hero__trust">{HOME_HERO_TRUST}</p>
          </div>

          <HeroOrbits />
        </div>

        <a href="#features" className="scroll-hint">
          <span>{HOME_SCROLL_HINT}</span>
          <ChevronDown className="scroll-hint__icon" size={20} strokeWidth={2} aria-hidden />
        </a>
      </section>

      <section id="features" ref={featuresRevealRef} className="home-section home-section--bento">
        <div className="home-container">
          <div className="home-bento">
            <BentoCard
              href="/advisor"
              className="bento-card--advisor"
              icon="🎯"
              title={HOME_BENTO_ADVISOR_TITLE}
              description={HOME_BENTO_ADVISOR_DESC}
            />
            <BentoCard
              href="/advisor"
              className="bento-card--indicators"
              icon="🧠"
              title={HOME_BENTO_INDICATORS_TITLE}
              description={HOME_BENTO_INDICATORS_DESC}
            />
            <BentoCard
              href="/#world-map"
              className="bento-card--live"
              icon="📊"
              title={HOME_BENTO_LIVE_TITLE}
              description={HOME_BENTO_LIVE_DESC}
            />
            <BentoCard
              href="/screener"
              className="bento-card--pgsi"
              icon="📋"
              title={HOME_BENTO_PGSI_TITLE}
              description={HOME_BENTO_PGSI_DESC}
            />
            <BentoCard
              href="/#world-map"
              className="bento-card--map"
              icon="🌍"
              title={HOME_BENTO_MAP_TITLE}
              description={HOME_BENTO_MAP_DESC}
            />
          </div>
        </div>
      </section>

      <section
        id="world-map"
        ref={mapRevealRef}
        className="home-section home-section--map"
        aria-labelledby="home-map-title"
      >
        <div className="home-container">
          <span className="section-label">{HOME_SECTION_MAP_LABEL}</span>
          <h2 id="home-map-title" className="home-section__title">
            {HOME_MAP_TITLE}
          </h2>
          <p className="section-description">{HOME_MAP_DESC}</p>
          <div className="home-map-panel">
            <WorldMap />
          </div>
        </div>
      </section>

      <HomeFooter />
    </main>
  );
}
