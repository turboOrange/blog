import React, { useEffect, useRef } from 'react';
import styles from './styles.module.css';


const STAR_CHARS = ['✦', '·', '✧', '*', '⋆', '˚', '°', '·', '✦', '⋆', '✧'];

interface Star {
  x: number;
  y: number;
  char: string;
  twinklePeriod: number;
  twinkleOffset: number;
  size: number;
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    char: STAR_CHARS[Math.floor(Math.random() * STAR_CHARS.length)],
    twinklePeriod: 2000 + Math.random() * 4000,
    twinkleOffset: Math.random() * Math.PI * 2,
    size: Math.random() < 0.2 ? 1.3 : 1,
  }));
}

const STARS = generateStars(60);

export default function NightSky(): React.ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Build star elements once
    const starEls: HTMLSpanElement[] = STARS.map((star) => {
      const el = document.createElement('span');
      el.textContent = star.char;
      el.className = styles.star;
      el.style.left = `${star.x}%`;
      el.style.top = `${star.y}%`;
      el.style.fontSize = `${star.size}em`;
      container.appendChild(el);
      return el;
    });



    const animate = (time: number) => {
      // Twinkle stars
      STARS.forEach((star, i) => {
        const phase =
          Math.sin((time / star.twinklePeriod) * Math.PI * 2 + star.twinkleOffset);
        const opacity = 0.3 + 0.7 * ((phase + 1) / 2);
        starEls[i].style.opacity = `${opacity}`;
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      starEls.forEach((el) => el.remove());
    };
  }, []);

  return <div ref={containerRef} className={styles.nightSky} aria-hidden="true" />;
}
