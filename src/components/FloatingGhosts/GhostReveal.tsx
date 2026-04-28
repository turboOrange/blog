import React, { useEffect, useRef, useState } from 'react';
import styles from './GhostReveal.module.css';

// Same art as the main ghost so they match
const GHOST_ART = `▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓
▓▓▓░▓▓░▓▓
▓▓▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓
▓ ▓ ▓ ▓ ▓`;


const BOX_FULL = `  ╔═══╦═══╗  
 ╔╝░░░░░░░╚╗ 
 ║░░░░░░░░░║ 
 ╠═══════════╣ 
 ║  ░░ ? ░░  ║ 
 ║  ░░░░░░  ║ 
 ║  ░░░░░░  ║ 
 ╚═══════════╝ `;

// Pieces that fly out on explosion
const EXPLODE_PIECES: Array<{ char: string; dx: string; dy: string; rot: string }> = [
  { char: '╔═══╗',   dx: '-180px', dy: '-160px', rot: '-200deg' },
  { char: '╚═══╝',   dx:  '180px', dy:  '160px', rot:  '200deg' },
  { char: '║░░░║',   dx: '-220px', dy:   '40px', rot: '-120deg' },
  { char: '║░░░║',   dx:  '220px', dy:  '-40px', rot:  '120deg' },
  { char: '╦═══╦',   dx:    '0px', dy: '-200px', rot:  '180deg' },
  { char: '╚═══╝',   dx:  '-60px', dy:  '200px', rot: '-160deg' },
  { char: '░░░░',    dx:  '120px', dy: '-120px', rot:  '300deg' },
  { char: '░░░░',    dx: '-120px', dy:  '120px', rot: '-300deg' },
  { char: '?',       dx:    '0px', dy:  '-80px', rot:  '720deg' },
];

// Sparkles orbit positions
const SPARKLE_EMOJIS = ['✨', '💫', '⭐', '🌟', '✦', '·', '✧', '★'];
const SPARKLE_COUNT = 14;

type Phase = 'box-drop' | 'box-shake' | 'flash' | 'explode' | 'ghost-reveal' | 'fadeout';

interface Props {
  ghostColor: string;
  ghostName: string;
  onDone: () => void;
}

export default function GhostReveal({ ghostColor, ghostName, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('box-drop');
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const timings: Array<[Phase, number]> = [
      ['box-shake',    480],
      ['flash',       1680],
      ['explode',     1720],
      ['ghost-reveal',2050],
      ['fadeout',     4100],
    ];

    const ids = timings.map(([p, ms]) => window.setTimeout(() => setPhase(p), ms));
    const doneId = window.setTimeout(() => onDoneRef.current(), 5000);

    return () => { [...ids, doneId].forEach(clearTimeout); };
  }, []); // only run once per mount

  const cssVars = { '--gc': ghostColor } as React.CSSProperties;

  return (
    <div className={`${styles.overlay} ${phase === 'fadeout' ? styles.overlayFadeout : ''}`}>

      {/* Flash on explosion */}
      {phase === 'flash' && <div className={styles.flash} />}

      {/* Rotating rays — behind everything */}
      {(phase === 'ghost-reveal' || phase === 'fadeout') && (
        <div className={styles.rays} style={cssVars} />
      )}

      {/* Sparkle burst */}
      {(phase === 'ghost-reveal' || phase === 'fadeout') && (
        <div className={styles.sparkles}>
          {Array.from({ length: SPARKLE_COUNT }, (_, i) => {
            const angle = (i / SPARKLE_COUNT) * 360;
            const dist = 140 + (i % 3) * 55;
            return (
              <span
                key={i}
                className={styles.sparkle}
                style={{
                  '--i': i,
                  '--a': `${angle}deg`,
                  '--d': `${dist}px`,
                } as React.CSSProperties}
              >
                {SPARKLE_EMOJIS[i % SPARKLE_EMOJIS.length]}
              </span>
            );
          })}
        </div>
      )}

      {/* Mystery box */}
      {(phase === 'box-drop' || phase === 'box-shake') && (
        <div className={styles.boxWrap}>
          <pre
            className={`${styles.box} ${phase === 'box-drop' ? styles.boxDrop : styles.boxShake}`}
          >
            {BOX_FULL}
          </pre>
          <span className={styles.boxLabel}>mystery box</span>
        </div>
      )}

      {/* Explode shards */}
      {phase === 'explode' && (
        <div className={styles.explodeWrap} style={cssVars}>
          {EXPLODE_PIECES.map((p, i) => (
            <span
              key={i}
              className={styles.piece}
              style={{ '--dx': p.dx, '--dy': p.dy, '--rot': p.rot } as React.CSSProperties}
            >
              {p.char}
            </span>
          ))}
        </div>
      )}

      {/* Ghost reveal card */}
      {(phase === 'ghost-reveal' || phase === 'fadeout') && (
        <div className={styles.revealContent}>
          <span className={styles.rarityBadge}>👻 NEW GHOST ACQUIRED</span>
          <pre
            className={styles.bigGhost}
            style={{ color: `${ghostColor}dd`, textShadow: `0 0 20px ${ghostColor}, 0 0 50px ${ghostColor}88` }}
          >
            {GHOST_ART}
          </pre>
          <div
            className={styles.ghostName}
            style={{ color: ghostColor, textShadow: `0 0 18px ${ghostColor}, 0 0 36px ${ghostColor}66` }}
          >
            {ghostName}
          </div>
          <span className={styles.subtitle}>will now haunt you</span>
        </div>
      )}
    </div>
  );
}

