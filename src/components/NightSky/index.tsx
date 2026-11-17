import React, { useMemo } from 'react';
import styles from './styles.module.css';

const STAR_CHARS = ['✦', '·', '✧', '*', '⋆', '˚', '°', '·', '✦', '⋆', '✧'];

interface Star {
  id: number;
  x: number;
  y: number;
  char: string;
  duration: number;
  delay: number;
  size: number;
}

// Deterministic pseudo-random (mulberry32) — stars must be identical on
// the server-rendered HTML and the client, or React hydration mismatch
// warnings appear and every browser "renders the site differently".
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateStars(count: number): Star[] {
  const rand = mulberry32(1337);
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: rand() * 100,
    y: rand() * 100,
    char: STAR_CHARS[Math.floor(rand() * STAR_CHARS.length)],
    duration: 2 + rand() * 4,   // 2–6 s
    delay: -(rand() * 6),        // negative delay = start mid-cycle
    size: rand() < 0.2 ? 1.3 : 1,
  }));
}

const STAR_COUNT = 42;
const STARS = generateStars(STAR_COUNT);

export default function NightSky(): React.ReactNode {
  // Stars are static — generated once at module load, rendered via pure CSS.
  return (
    <div className={styles.nightSky} aria-hidden="true">
      {STARS.map((star) => (
        <span
          key={star.id}
          className={styles.star}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            fontSize: `${star.size}em`,
            '--twinkle-duration': `${star.duration}s`,
            '--twinkle-delay': `${star.delay}s`,
          } as React.CSSProperties}
        >
          {star.char}
        </span>
      ))}
    </div>
  );
}
