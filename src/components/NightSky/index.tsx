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

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: Math.random() * 100,
    y: Math.random() * 100,
    char: STAR_CHARS[Math.floor(Math.random() * STAR_CHARS.length)],
    duration: 2 + Math.random() * 4,   // 2–6 s
    delay: -(Math.random() * 6),        // negative delay = start mid-cycle
    size: Math.random() < 0.2 ? 1.3 : 1,
  }));
}

const STARS = generateStars(42);

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
