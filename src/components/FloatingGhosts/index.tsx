import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './styles.module.css';

interface GhostPosition {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  angle: number;
  opacity: number;
  teleportTimer: number;
  teleportPhase: 'moving' | 'stopping' | 'fading-out' | 'teleporting' | 'fading-in' | 'dying';
  isDragging?: boolean;
  spinX: number;
  spinY: number;
  dyingProgress?: number;
  dyingTargetX?: number;
  dyingTargetY?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  opacity: number;
  color: string;
}

const GHOST_ART = `▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓
▓▓▓░▓▓░▓▓
▓▓▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓
▓ ▓ ▓ ▓ ▓`;

const TRASH_ART_CLOSED = ` _███████_
 █████████
  ▓█▓█▓█▓
  ▓█▓█▓█▓
  ▓█▓█▓█▓`;

const TRASH_ART_OPEN = `
███████
    ▀▀▀▀▀
 ▓█▓█▓█▓
 ▓█▓█▓█▓
 ▓█▓█▓█▓ ▓`;

const PARTICLE_CHARS = ['👻', '💀', '✨', '*', '·', '°', '~', '¬', '░', '▒'];
const PARTICLE_COLORS = ['#a78bfa', '#f472b6', '#67e8f9', '#fde68a', '#86efac'];

const TICK_MS = 50;
let particleIdCounter = 0;

export default function FloatingGhosts(): React.ReactNode {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const [ghosts, setGhosts] = useState<GhostPosition[]>(() => {
    const all: GhostPosition[] = [
      { x: 10, y: 20, speedX: 0.08, speedY: 0.05, angle: 0, opacity: 1, teleportTimer: Math.random() * 200 + 100, teleportPhase: 'moving', spinX: 0, spinY: 0 },
      { x: 60, y: 50, speedX: -0.06, speedY: 0.09, angle: Math.PI / 3, opacity: 1, teleportTimer: Math.random() * 200 + 150, teleportPhase: 'moving', spinX: 0, spinY: 0 },
      { x: 30, y: 80, speedX: 0.05, speedY: -0.08, angle: Math.PI / 2, opacity: 1, teleportTimer: Math.random() * 200 + 200, teleportPhase: 'moving', spinX: 0, spinY: 0 },
    ];
    return isMobile ? [all[0]] : all;
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const [trashHover, setTrashHover] = useState(false);
  const [trashShake, setTrashShake] = useState(false);
  const [anyDragging, setAnyDragging] = useState(false);

  const draggedGhostRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPosPosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: Date.now() });
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const trashRef = useRef<HTMLPreElement | null>(null);

  const isOverTrash = useCallback((clientX: number, clientY: number) => {
    if (!trashRef.current) return false;
    const rect = trashRef.current.getBoundingClientRect();
    const pad = 40; // bigger hit area for fat fingers
    return (
      clientX >= rect.left - pad &&
      clientX <= rect.right + pad &&
      clientY >= rect.top - pad &&
      clientY <= rect.bottom + pad
    );
  }, []);

  const spawnParticles = useCallback((trashX: number, trashY: number) => {
    const burst: Particle[] = Array.from({ length: 22 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.2;
      return {
        id: particleIdCounter++,
        x: trashX,
        y: trashY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        char: PARTICLE_CHARS[Math.floor(Math.random() * PARTICLE_CHARS.length)],
        opacity: 1,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      };
    });
    setParticles((prev) => [...prev, ...burst]);
  }, []);

  const tick = useCallback(() => {
    const now = Date.now();
    if (now - lastTickRef.current >= TICK_MS) {
      lastTickRef.current = now;

      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.06, opacity: p.opacity - 0.035 }))
          .filter((p) => p.opacity > 0)
      );

      setGhosts((prevGhosts) =>
        prevGhosts
          .filter((g) => !(g.teleportPhase === 'dying' && (g.dyingProgress ?? 0) >= 1))
          .map((ghost) => {
            if (ghost.isDragging) return ghost;

            let { x, y, speedX, speedY, angle, opacity, teleportTimer, teleportPhase, spinX, spinY, dyingProgress, dyingTargetX, dyingTargetY } = ghost;

            if (teleportPhase === 'dying') {
              const prog = Math.min(1, (dyingProgress ?? 0) + 0.06);
              const tx = dyingTargetX ?? x;
              const ty = dyingTargetY ?? y;
              return {
                ...ghost,
                x: x + (tx - x) * 0.18,
                y: y + (ty - y) * 0.18,
                opacity: 1 - prog,
                spinX: ghost.spinX + 25,
                spinY: ghost.spinY + 40,
                dyingProgress: prog,
              };
            }

            angle += 0.015;
            teleportTimer -= 1;
            spinX *= 0.92;
            spinY *= 0.92;

            if (teleportPhase === 'moving') {
              speedX += Math.sin(angle) * 0.003;
              speedY += Math.cos(angle) * 0.003;
              speedX *= 0.99;
              speedY *= 0.99;
              x += speedX;
              y += speedY;

              if (x <= 0 || x >= 95) { speedX = -speedX * 0.8; x = x <= 0 ? 0 : 95; angle += Math.PI / 4; }
              if (y <= 0 || y >= 95) { speedY = -speedY * 0.8; y = y <= 0 ? 0 : 95; angle += Math.PI / 4; }

              if (teleportTimer <= 0) { teleportPhase = 'stopping'; teleportTimer = 30; }

            } else if (teleportPhase === 'stopping') {
              speedX *= 0.85;
              speedY *= 0.85;
              x += speedX;
              y += speedY;
              if (teleportTimer <= 0) { teleportPhase = 'fading-out'; teleportTimer = 20; speedX = 0; speedY = 0; }

            } else if (teleportPhase === 'fading-out') {
              opacity = 0;
              if (teleportTimer <= 0) { teleportPhase = 'teleporting'; teleportTimer = 5; }

            } else if (teleportPhase === 'teleporting') {
              if (teleportTimer <= 0) {
                x = Math.random() * 90;
                y = Math.random() * 90;
                speedX = (Math.random() - 0.5) * 0.15;
                speedY = (Math.random() - 0.5) * 0.15;
                angle = Math.random() * Math.PI * 2;
                teleportPhase = 'fading-in';
                teleportTimer = 20;
              }

            } else if (teleportPhase === 'fading-in') {
              opacity = 1;
              if (teleportTimer <= 0) { teleportPhase = 'moving'; teleportTimer = Math.random() * 600 + 300; }
            }

            return { x, y, speedX, speedY, angle, opacity, teleportTimer, teleportPhase, spinX, spinY, dyingProgress, dyingTargetX, dyingTargetY };
          })
      );
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tick]);

  // ── Shared pointer logic ──────────────────────────────────────────────────

  const startDrag = useCallback((idx: number, clientX: number, clientY: number, el: HTMLElement) => {
    draggedGhostRef.current = idx;
    const rect = el.getBoundingClientRect();
    dragOffsetRef.current = { x: clientX - rect.left, y: clientY - rect.top };
    lastPosPosRef.current = { x: clientX, y: clientY, time: Date.now() };
    setGhosts((prev) => prev.map((g, i) => i === idx ? { ...g, isDragging: true, opacity: 1, teleportTimer: 300, teleportPhase: 'moving' } : g));
    setAnyDragging(true);
  }, []);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (draggedGhostRef.current === null) return;
    const idx = draggedGhostRef.current;
    const dx = clientX - lastPosPosRef.current.x;
    const dy = clientY - lastPosPosRef.current.y;
    lastPosPosRef.current = { x: clientX, y: clientY, time: Date.now() };

    setTrashHover(isOverTrash(clientX, clientY));

    setGhosts((prev) => prev.map((g, i) => i === idx ? {
      ...g,
      x: Math.max(0, Math.min(95, ((clientX - dragOffsetRef.current.x) / window.innerWidth) * 100)),
      y: Math.max(0, Math.min(95, ((clientY - dragOffsetRef.current.y) / window.innerHeight) * 100)),
      spinX: Math.max(-60, Math.min(60, dy * 3)),
      spinY: Math.max(-60, Math.min(60, dx * 3)),
    } : g));
  }, [isOverTrash]);

  const endDrag = useCallback((clientX: number, clientY: number) => {
    if (draggedGhostRef.current === null) return;
    const idx = draggedGhostRef.current;
    draggedGhostRef.current = null;
    setTrashHover(false);
    setAnyDragging(false);

    if (isOverTrash(clientX, clientY) && trashRef.current) {
      const rect = trashRef.current.getBoundingClientRect();
      const tx = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
      const ty = ((rect.top + rect.height / 2) / window.innerHeight) * 100;

      setGhosts((prev) => prev.map((g, i) => i === idx
        ? { ...g, isDragging: false, teleportPhase: 'dying', dyingProgress: 0, dyingTargetX: tx, dyingTargetY: ty }
        : g
      ));

      setTimeout(() => {
        setTrashShake(true);
        spawnParticles(
          ((rect.left + rect.width / 2) / window.innerWidth) * 100,
          ((rect.top + rect.height / 2) / window.innerHeight) * 100,
        );
        setTimeout(() => setTrashShake(false), 600);
      }, 400);
    } else {
      setGhosts((prev) => prev.map((g, i) => i === idx
        ? { ...g, isDragging: false, speedX: (Math.random() - 0.5) * 0.15, speedY: (Math.random() - 0.5) * 0.15, teleportPhase: 'moving', teleportTimer: Math.random() * 600 + 300 }
        : g
      ));
    }
  }, [isOverTrash, spawnParticles]);

  // ── Mouse handlers ────────────────────────────────────────────────────────

  const handleMouseDown = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(idx, e.clientX, e.clientY, e.currentTarget as HTMLElement);
  };

  const handleGhostMouseEnter = (_idx: number, e: React.MouseEvent) => {
    lastPosPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handleGhostMouseMove = (idx: number, e: React.MouseEvent) => {
    if (draggedGhostRef.current !== null) return;
    const now = Date.now();
    const timeDiff = Math.max(now - lastPosPosRef.current.time, 1);
    const dx = e.clientX - lastPosPosRef.current.x;
    const dy = e.clientY - lastPosPosRef.current.y;
    const speed = Math.sqrt(dx * dx + dy * dy) / timeDiff;
    lastPosPosRef.current = { x: e.clientX, y: e.clientY, time: now };
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      setGhosts((prev) => prev.map((g, i) => i === idx
        ? { ...g, spinX: Math.max(-90, Math.min(90, -dy * speed * 5)), spinY: Math.max(-90, Math.min(90, dx * speed * 5)) }
        : g
      ));
    }
  };

  // ── Touch handlers ────────────────────────────────────────────────────────

  const handleTouchStart = (idx: number, e: React.TouchEvent) => {
    e.preventDefault(); // stops scroll from stealing the gesture
    const touch = e.changedTouches[0];
    startDrag(idx, touch.clientX, touch.clientY, e.currentTarget as HTMLElement);
  };

  // ── Global mouse + touch listeners ───────────────────────────────────────

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const onMouseUp   = (e: MouseEvent) => endDrag(e.clientX, e.clientY);

    const onTouchMove = (e: TouchEvent) => {
      if (draggedGhostRef.current === null) return;
      e.preventDefault(); // prevent scroll while dragging
      const touch = e.changedTouches[0];
      moveDrag(touch.clientX, touch.clientY);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (draggedGhostRef.current === null) return;
      const touch = e.changedTouches[0];
      endDrag(touch.clientX, touch.clientY);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [moveDrag, endDrag]);

  return (
    <div className={styles.ghostContainer}>
      {/* Trash can */}
      <pre
        ref={trashRef}
        className={`${styles.trashCan} ${anyDragging ? styles.trashVisible : ''} ${trashHover ? styles.trashHover : ''} ${trashShake ? styles.trashShake : ''}`}
      >
        {trashHover ? TRASH_ART_OPEN : TRASH_ART_CLOSED}
      </pre>

      {/* Particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className={styles.particle}
          style={{ left: `${p.x}vw`, top: `${p.y}vh`, opacity: p.opacity, color: p.color }}
        >
          {p.char}
        </span>
      ))}

      {/* Ghosts */}
      {ghosts.map((ghost, idx) => (
        <pre
          key={idx}
          className={`${styles.ghost} ${ghost.isDragging ? styles.dragging : ''} ${ghost.teleportPhase === 'fading-out' || ghost.teleportPhase === 'teleporting' ? styles.fadingOut : ''} ${ghost.teleportPhase === 'fading-in' ? styles.fadingIn : ''} ${ghost.teleportPhase === 'dying' ? styles.dying : ''}`}
          style={{
            left: `${ghost.x}%`,
            top: `${ghost.y}%`,
            transform: `perspective(1000px) rotateX(${ghost.spinX}deg) rotateY(${ghost.spinY}deg) scale(${ghost.teleportPhase === 'dying' ? Math.max(0.05, 1 - (ghost.dyingProgress ?? 0) * 0.95) : 1})`,
            opacity: ghost.opacity,
            cursor: ghost.isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={(e) => handleMouseDown(idx, e)}
          onMouseEnter={(e) => handleGhostMouseEnter(idx, e)}
          onMouseMove={(e) => handleGhostMouseMove(idx, e)}
          onTouchStart={(e) => handleTouchStart(idx, e)}
        >
          {GHOST_ART}
        </pre>
      ))}
    </div>
  );
}
