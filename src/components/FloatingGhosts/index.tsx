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
  teleportPhase: 'moving' | 'stopping' | 'fading-out' | 'teleporting' | 'fading-in';
  isDragging?: boolean;
  spinX: number;
  spinY: number;
}

const GHOST_ART = `▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓
▓▓▓░▓▓░▓▓
▓▓▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓
▓ ▓ ▓ ▓ ▓`;

const TICK_MS = 50; // ~20fps physics; rendering is CSS-driven

export default function FloatingGhosts(): React.ReactNode {
  const [ghosts, setGhosts] = useState<GhostPosition[]>([
    { x: 10, y: 20, speedX: 0.08, speedY: 0.05, angle: 0, opacity: 1, teleportTimer: Math.random() * 200 + 100, teleportPhase: 'moving', spinX: 0, spinY: 0 },
    { x: 60, y: 50, speedX: -0.06, speedY: 0.09, angle: Math.PI / 3, opacity: 1, teleportTimer: Math.random() * 200 + 150, teleportPhase: 'moving', spinX: 0, spinY: 0 },
    { x: 30, y: 80, speedX: 0.05, speedY: -0.08, angle: Math.PI / 2, opacity: 1, teleportTimer: Math.random() * 200 + 200, teleportPhase: 'moving', spinX: 0, spinY: 0 },
  ]);

  const draggedGhostRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMousePosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: Date.now() });
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  const tick = useCallback(() => {
    const now = Date.now();
    if (now - lastTickRef.current >= TICK_MS) {
      lastTickRef.current = now;

      setGhosts((prevGhosts) =>
        prevGhosts.map((ghost) => {
          if (ghost.isDragging) return ghost;

          let { x, y, speedX, speedY, angle, opacity, teleportTimer, teleportPhase, spinX, spinY } = ghost;

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
            // CSS animation handles the visual fade — just advance the phase
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
            // CSS animation handles the visual fade — just advance the phase
            opacity = 1;
            if (teleportTimer <= 0) { teleportPhase = 'moving'; teleportTimer = Math.random() * 600 + 300; }
          }

          return { x, y, speedX, speedY, angle, opacity, teleportTimer, teleportPhase, spinX, spinY };
        })
      );
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tick]);

  const handleMouseDown = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    draggedGhostRef.current = idx;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    setGhosts((prev) => prev.map((g, i) => i === idx ? { ...g, isDragging: true, opacity: 1, teleportTimer: 300, teleportPhase: 'moving' } : g));
  };

  const handleGhostMouseEnter = (_idx: number, e: React.MouseEvent) => {
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handleGhostMouseMove = (idx: number, e: React.MouseEvent) => {
    if (draggedGhostRef.current !== null) return;

    const now = Date.now();
    const timeDiff = Math.max(now - lastMousePosRef.current.time, 1);
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    const speed = Math.sqrt(dx * dx + dy * dy) / timeDiff;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: now };

    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      setGhosts((prev) => prev.map((g, i) => i === idx
        ? { ...g, spinX: Math.max(-90, Math.min(90, -dy * speed * 5)), spinY: Math.max(-90, Math.min(90, dx * speed * 5)) }
        : g
      ));
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedGhostRef.current === null) return;
      const idx = draggedGhostRef.current;
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };

      setGhosts((prev) => prev.map((g, i) => i === idx ? {
        ...g,
        x: Math.max(0, Math.min(95, ((e.clientX - dragOffsetRef.current.x) / window.innerWidth) * 100)),
        y: Math.max(0, Math.min(95, ((e.clientY - dragOffsetRef.current.y) / window.innerHeight) * 100)),
        spinX: Math.max(-60, Math.min(60, dy * 3)),
        spinY: Math.max(-60, Math.min(60, dx * 3)),
      } : g));
    };

    const handleMouseUp = () => {
      if (draggedGhostRef.current === null) return;
      const idx = draggedGhostRef.current;
      setGhosts((prev) => prev.map((g, i) => i === idx
        ? { ...g, isDragging: false, speedX: (Math.random() - 0.5) * 0.15, speedY: (Math.random() - 0.5) * 0.15, teleportPhase: 'moving', teleportTimer: Math.random() * 600 + 300 }
        : g
      ));
      draggedGhostRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className={styles.ghostContainer}>
      {ghosts.map((ghost, idx) => (
        <pre
          key={idx}
          className={`${styles.ghost} ${ghost.isDragging ? styles.dragging : ''} ${ghost.teleportPhase === 'fading-out' || ghost.teleportPhase === 'teleporting' ? styles.fadingOut : ''} ${ghost.teleportPhase === 'fading-in' ? styles.fadingIn : ''}`}
          style={{
            left: `${ghost.x}%`,
            top: `${ghost.y}%`,
            transform: `perspective(1000px) rotateX(${ghost.spinX}deg) rotateY(${ghost.spinY}deg)`,
            opacity: ghost.opacity,
            cursor: ghost.isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={(e) => handleMouseDown(idx, e)}
          onMouseEnter={(e) => handleGhostMouseEnter(idx, e)}
          onMouseMove={(e) => handleGhostMouseMove(idx, e)}
        >
          {GHOST_ART}
        </pre>
      ))}
    </div>
  );
}
