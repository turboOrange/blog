import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SpiritBoard.module.css';

interface SpiritBoardProps {
  extreme?: boolean;
  onClose: () => void;
}

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
  ['1','2','3','4','5','6','7','8','9','0'],
];

const GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?';

const BOARD_BANNER_NORMAL = `░▒▓  S P I R I T   B O A R D  ▓▒░`;
const BOARD_BANNER_EXTREME = `▓▓▓  E X T R E M E   M O D E  ▓▓▓`;

// ── Tile component ───────────────────────────────────────────────────────────

interface TileProps {
  char: string;
  extreme: boolean;
  active: boolean;
  hovered: boolean;
  progress: number; // 0–1
  onEnter: () => void;
  onLeave: () => void;
  wide?: boolean;
}

function Tile({ char, extreme, active, hovered, progress, onEnter, onLeave, wide }: TileProps) {
  const dashes = '─'.repeat(char.length <= 1 ? 3 : char.length + 2);
  return (
    <div
      className={[
        styles.tile,
        wide ? styles.tileWide : '',
        active ? styles.tileActive : styles.tileInactive,
        hovered ? styles.tileHovered : '',
        extreme ? styles.tileExtreme : '',
      ].filter(Boolean).join(' ')}
      onMouseEnter={active ? onEnter : undefined}
      onMouseLeave={active ? onLeave : undefined}
    >
      <pre className={styles.tileFrame}>
        {`┌${dashes}┐\n│ ${char.length === 1 ? ` ${char} ` : char} │\n└${dashes}┘`}
      </pre>
      {hovered && (
        <div className={styles.tileProgressTrack}>
          <div className={styles.tileProgressBar} style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}

// ── Main SpiritBoard ─────────────────────────────────────────────────────────

export default function SpiritBoard({ extreme = false, onClose }: SpiritBoardProps) {
  const [phase, setPhase] = useState<'waiting' | 'countdown' | 'active'>('waiting');
  const [countdown, setCountdown] = useState(3);
  const [countdownKey, setCountdownKey] = useState(0); // force re-animation
  const [outputText, setOutputText] = useState('');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [hoverProgress, setHoverProgress] = useState(0);
  const [glitchedChars, setGlitchedChars] = useState<Record<number, string>>({});
  const [closing, setClosing] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<'waiting' | 'countdown' | 'active'>('waiting');
  const outputTextRef = useRef('');
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hoverIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const glitchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const centerInsideRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { outputTextRef.current = outputText; }, [outputText]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (hoverIntervalRef.current) clearInterval(hoverIntervalRef.current);
      if (glitchIntervalRef.current) clearInterval(glitchIntervalRef.current);
    };
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 280);
  }, [onClose]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  // Extreme glitch on output text
  useEffect(() => {
    if (!extreme) return;
    const scheduleGlitch = () => {
      const delay = 150 + Math.random() * 400;
      glitchIntervalRef.current = setTimeout(() => {
        const text = outputTextRef.current;
        if (text.length > 0) {
          const newGlitched: Record<number, string> = {};
          const count = Math.floor(Math.random() * Math.min(3, text.length)) + 1;
          for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * text.length);
            newGlitched[idx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          }
          setGlitchedChars(newGlitched);
          setTimeout(() => setGlitchedChars({}), 60 + Math.random() * 100);
        }
        scheduleGlitch();
      }, delay) as unknown as ReturnType<typeof setInterval>;
    };
    scheduleGlitch();
    return () => {
      if (glitchIntervalRef.current) clearTimeout(glitchIntervalRef.current as unknown as ReturnType<typeof setTimeout>);
    };
  }, [extreme]);

  // ── Center hover detection ────────────────────────────────────────────────

  const startCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdown(3);
    setCountdownKey(k => k + 1);
    let c = 3;
    countdownIntervalRef.current = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
        setPhase('active');
        phaseRef.current = 'active';
      } else {
        setCountdown(c);
        setCountdownKey(k => k + 1);
      }
    }, 1000);
  }, []);

  const cancelCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setPhase('waiting');
    phaseRef.current = 'waiting';
    centerInsideRef.current = false;
  }, []);

  const handleBoardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const ph = phaseRef.current;
    if (ph === 'active') return;

    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const inCenter = relX > 0.33 && relX < 0.67 && relY > 0.3 && relY < 0.7;

    if (inCenter && !centerInsideRef.current) {
      centerInsideRef.current = true;
      if (ph === 'waiting') startCountdown();
    } else if (!inCenter && centerInsideRef.current) {
      centerInsideRef.current = false;
      if (ph === 'countdown') cancelCountdown();
    }
  }, [startCountdown, cancelCountdown]);

  const handleBoardMouseLeave = useCallback(() => {
    if (phaseRef.current === 'countdown') {
      centerInsideRef.current = false;
      cancelCountdown();
    }
  }, [cancelCountdown]);

  // ── Tile hover handling ────────────────────────────────────────────────────

  const clearHoverTimer = useCallback(() => {
    if (hoverIntervalRef.current) {
      clearInterval(hoverIntervalRef.current);
      hoverIntervalRef.current = null;
    }
    setHoveredKey(null);
    setHoverProgress(0);
  }, []);

  const handleTileEnter = useCallback((key: string) => {
    if (phaseRef.current !== 'active') return;
    clearHoverTimer();
    setHoveredKey(key);
    setHoverProgress(0);

    const duration = key === 'GOODBYE' ? 3000 : 1000;
    const interval = 40;
    const steps = duration / interval;
    let progress = 0;

    hoverIntervalRef.current = setInterval(() => {
      progress += 1 / steps;
      setHoverProgress(Math.min(progress, 1));
      if (progress >= 1) {
        clearInterval(hoverIntervalRef.current!);
        hoverIntervalRef.current = null;
        if (key === 'GOODBYE') {
          handleClose();
        } else {
          setOutputText(prev => prev + key);
        }
        setHoveredKey(null);
        setHoverProgress(0);
      }
    }, interval);
  }, [clearHoverTimer, handleClose]);

  const handleTileLeave = useCallback(() => {
    clearHoverTimer();
  }, [clearHoverTimer]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const displayText = outputText.split('').map((ch, i) =>
    glitchedChars[i] !== undefined ? glitchedChars[i] : ch
  ).join('');

  const yesNo: string[] = ['YES', 'NO'];

  return (
    <div className={`${styles.overlay} ${closing ? styles.overlayClosing : ''} ${extreme ? styles.extreme : ''}`}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className={styles.window}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            {extreme ? '⚠  E X T R E M E   S P I R I T   B O A R D  ⚠' : '✦  S P I R I T   B O A R D  ✦'}
          </div>
          <button className={styles.closeBtn} onClick={handleClose} title="Close (Esc)">✕</button>
        </div>

        {/* ── Board ── */}
        <div
          ref={boardRef}
          className={styles.board}
          onMouseMove={handleBoardMouseMove}
          onMouseLeave={handleBoardMouseLeave}
        >
          {/* Board banner */}
          <div className={styles.boardBanner}>{extreme ? BOARD_BANNER_EXTREME : BOARD_BANNER_NORMAL}</div>

          {/* YES / NO row */}
          <div className={`${styles.row} ${styles.yesNoRow}`}>
            {yesNo.map(key => (
              <Tile
                key={key}
                char={key}
                extreme={extreme}
                active={phase === 'active'}
                hovered={hoveredKey === key}
                progress={hoveredKey === key ? hoverProgress : 0}
                onEnter={() => handleTileEnter(key)}
                onLeave={handleTileLeave}
                wide
              />
            ))}
          </div>

          {/* Letter + number rows */}
          {ROWS.map((row, ri) => (
            <div key={ri} className={styles.row}>
              {row.map(key => (
                <Tile
                  key={key}
                  char={key}
                  extreme={extreme}
                  active={phase === 'active'}
                  hovered={hoveredKey === key}
                  progress={hoveredKey === key ? hoverProgress : 0}
                  onEnter={() => handleTileEnter(key)}
                  onLeave={handleTileLeave}
                />
              ))}
            </div>
          ))}

          {/* GOODBYE row — only in normal mode */}
          {!extreme && (
            <div className={`${styles.row} ${styles.goodbyeRow}`}>
              <Tile
                char="GOODBYE"
                extreme={false}
                active={phase === 'active'}
                hovered={hoveredKey === 'GOODBYE'}
                progress={hoveredKey === 'GOODBYE' ? hoverProgress : 0}
                onEnter={() => handleTileEnter('GOODBYE')}
                onLeave={handleTileLeave}
                wide
              />
            </div>
          )}

          {/* Center overlay: waiting prompt or countdown */}
          {phase === 'waiting' && (
            <div className={styles.centerOverlay} aria-hidden="true">
              <div className={styles.centerPromptText}>{'> move to center <'}</div>
            </div>
          )}
          {phase === 'countdown' && (
            <div className={styles.centerOverlay} aria-hidden="true">
              <div key={countdownKey} className={styles.countdownNum}>{countdown}</div>
            </div>
          )}

          {/* Board dim overlay when not active */}
          {phase !== 'active' && (
            <div className={styles.boardDimOverlay} aria-hidden="true" />
          )}
        </div>

        {/* ── Output ── */}
        <div className={styles.outputArea}>
          <div className={styles.outputLabel}>{'// the spirits speak'}</div>
          <div className={styles.outputText}>
            {displayText
              ? displayText.split('').map((ch, i) => (
                  <span key={i} className={glitchedChars[i] !== undefined ? styles.glitchedChar : ''}>
                    {ch}
                  </span>
                ))
              : <span className={styles.outputPlaceholder}>_ _ _</span>
            }
          </div>
        </div>

      </div>
    </div>
  );
}
