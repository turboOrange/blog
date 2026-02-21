import React, { useEffect, useState, useRef } from 'react';
import styles from './styles.module.css';

interface GhostPosition {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  rotation: number;
  angle: number;
  opacity: number;
  teleportTimer: number;
  teleportPhase: 'moving' | 'stopping' | 'fading-out' | 'teleporting' | 'fading-in';
  isDragging?: boolean;
}

const GHOST_ART = `▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓
▓▓▓░▓▓░▓▓
▓▓▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓
▓ ▓ ▓ ▓ ▓`;

// Approximate ghost size in pixels (for proximity detection)
const GHOST_W = 140; // Slightly larger width
const GHOST_H = 120; // Slightly larger height
const PROXIMITY = 150; // Larger activation area

// DEBUG: Set to true to see hit boxes
const DEBUG_HITBOX = false;

export default function FloatingGhosts(): React.ReactNode {
  const [ghosts, setGhosts] = useState<GhostPosition[]>([
    { x: 10, y: 20, speedX: 0.08, speedY: 0.05, rotation: 0, angle: 0, opacity: 1, teleportTimer: Math.random() * 200 + 100, teleportPhase: 'moving' },
    { x: 60, y: 50, speedX: -0.06, speedY: 0.09, rotation: 0, angle: Math.PI / 3, opacity: 1, teleportTimer: Math.random() * 200 + 150, teleportPhase: 'moving' },
    { x: 30, y: 80, speedX: 0.05, speedY: -0.08, rotation: 0, angle: Math.PI / 2, opacity: 1, teleportTimer: Math.random() * 200 + 200, teleportPhase: 'moving' },
  ]);

  // Keep a ref copy of ghosts positions so document mousemove can read them without stale closure
  const ghostsRef = useRef(ghosts);
  useEffect(() => {
    ghostsRef.current = ghosts;

    // Also update hit box positions if debug is on
    if (DEBUG_HITBOX && typeof window !== 'undefined') {
      const debugBox = document.getElementById('debug-hitbox-container');
      if (debugBox) {
        // This is a rough debug update, real update happens via react render cycle
      }
    }
  }, [ghosts]);

  // Spin stored in a ref so no race condition with animation loop
  const spinRef = useRef<{ x: number; y: number }[]>([
    { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 },
  ]);
  // Velocity for physics-based spin
  const velRef = useRef<{ x: number; y: number }[]>([
    { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 },
  ]);
  const [spinState, setSpinState] = useState<{ x: number; y: number }[]>([
    { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 },
  ]);

  const draggedGhostRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMousePosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: Date.now() });

  // Physics loop (spring + friction) at 60fps
  useEffect(() => {
    const spinLoop = setInterval(() => {
      const nextSpin = spinRef.current.map((s, i) => {
        const v = velRef.current[i];

        // Apply velocity
        let newX = s.x + v.x;
        let newY = s.y + v.y;

        // Spring force (pull back to 0)
        const spring = 0.05;
        const friction = 0.96; // Less damping (energy preservation)

        // Apply spring force to velocity (Hooke's Law: F = -kx)
        v.x -= newX * spring;
        v.y -= newY * spring;

        // Apply friction to velocity
        v.x *= friction;
        v.y *= friction;

        // Update velocity ref
        velRef.current[i] = v;

        return { x: newX, y: newY };
      });

      spinRef.current = nextSpin;
      setSpinState([...nextSpin]);
    }, 16);
    return () => clearInterval(spinLoop);
  }, []);

  // Ghost movement loop
  useEffect(() => {
    const animationFrame = setInterval(() => {
      setGhosts((prevGhosts) =>
        prevGhosts.map((ghost) => {
          if (ghost.isDragging) return ghost;

          let newX = ghost.x;
          let newY = ghost.y;
          let newSpeedX = ghost.speedX;
          let newSpeedY = ghost.speedY;
          let newAngle = ghost.angle + 0.015;
          let newOpacity = ghost.opacity;
          let newTeleportTimer = ghost.teleportTimer - 1;
          let newPhase = ghost.teleportPhase;

          if (newPhase === 'moving') {
            newSpeedX += Math.sin(newAngle) * 0.003;
            newSpeedY += Math.cos(newAngle) * 0.003;
            newSpeedX *= 0.99;
            newSpeedY *= 0.99;
            newX += newSpeedX;
            newY += newSpeedY;
            if (newX <= 0 || newX >= 95) { newSpeedX = -newSpeedX * 0.8; newX = newX <= 0 ? 0 : 95; newAngle += Math.PI / 4; }
            if (newY <= 0 || newY >= 95) { newSpeedY = -newSpeedY * 0.8; newY = newY <= 0 ? 0 : 95; newAngle += Math.PI / 4; }
            if (newTeleportTimer <= 0) { newPhase = 'stopping'; newTeleportTimer = 30; }
          } else if (newPhase === 'stopping') {
            newSpeedX *= 0.85; newSpeedY *= 0.85;
            newX += newSpeedX; newY += newSpeedY;
            if (newTeleportTimer <= 0) { newPhase = 'fading-out'; newTeleportTimer = 20; newSpeedX = 0; newSpeedY = 0; }
          } else if (newPhase === 'fading-out') {
            newOpacity -= 0.05;
            if (newTeleportTimer <= 0 || newOpacity <= 0) { newPhase = 'teleporting'; newOpacity = 0; newTeleportTimer = 5; }
          } else if (newPhase === 'teleporting') {
            if (newTeleportTimer <= 0) {
              newX = Math.random() * 90; newY = Math.random() * 90;
              newSpeedX = (Math.random() - 0.5) * 0.15; newSpeedY = (Math.random() - 0.5) * 0.15;
              newAngle = Math.random() * Math.PI * 2;
              newPhase = 'fading-in'; newTeleportTimer = 20;
            }
          } else if (newPhase === 'fading-in') {
            newOpacity += 0.05;
            if (newOpacity >= 1) { newOpacity = 1; newPhase = 'moving'; newTeleportTimer = Math.random() * 600 + 300; }
          }

          return {
            x: newX, y: newY, speedX: newSpeedX, speedY: newSpeedY,
            rotation: ghost.rotation + 0.2, angle: newAngle,
            opacity: Math.max(0, Math.min(1, newOpacity)),
            teleportTimer: newTeleportTimer, teleportPhase: newPhase,
          };
        })
      );
    }, 50);
    return () => clearInterval(animationFrame);
  }, []);

  const handleMouseDown = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    draggedGhostRef.current = idx;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    setGhosts((prev) =>
      prev.map((g, i) => (i === idx ? { ...g, isDragging: true, opacity: 1, teleportTimer: 300, teleportPhase: 'moving' } : g))
    );
  };

  // All mouse tracking happens at document level — reliable regardless of ghost hit area
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      const timeDiff = Math.max(now - lastMousePosRef.current.time, 1);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = distance / timeDiff; // px/ms

      if (draggedGhostRef.current !== null) {
        // Dragging: directly control rotation for responsiveness
        const idx = draggedGhostRef.current;
        const newX = ((e.clientX - dragOffsetRef.current.x) / window.innerWidth) * 100;
        const newY = ((e.clientY - dragOffsetRef.current.y) / window.innerHeight) * 100;

        // When dragging, spin based on drag velocity
        const spinX = Math.max(-60, Math.min(60, dy * 3));
        const spinY = Math.max(-60, Math.min(60, dx * 3));

        // Reset velocity while dragging to prevent explosion on release
        velRef.current[idx] = { x: 0, y: 0 };
        // Set position directly
        spinRef.current[idx] = { x: spinX, y: spinY };

        setSpinState((prev) => { const n = [...prev]; n[idx] = { x: spinX, y: spinY }; return n; });
        setGhosts((prev) =>
          prev.map((g, i) => i === idx ? { ...g, x: Math.max(0, Math.min(95, newX)), y: Math.max(0, Math.min(95, newY)) } : g)
        );
      } else if (speed > 0.01) {
        // Fast mouse movement: check proximity to each ghost
        ghostsRef.current.forEach((ghost, idx) => {
          const ghostPxX = (ghost.x / 100) * window.innerWidth;
          const ghostPxY = (ghost.y / 100) * window.innerHeight;
          const distToGhost = Math.sqrt(
            Math.pow(e.clientX - (ghostPxX + GHOST_W / 2), 2) +
            Math.pow(e.clientY - (ghostPxY + GHOST_H / 2), 2)
          );

          if (distToGhost < PROXIMITY) {
            // Apply impulse to angular velocity (The "Knock")
            // The force depends on mouse speed and direction relative to the ghost
            // We want the ghost to spin AWAY from the hit direction

            // Simplified: spin axis is perpendicular to mouse direction
            const impulseStrength = Math.min(speed * 300, 400); // Much stronger impulse (was 30)

            // dy -> rotates around X axis (tilt up/down)
            // dx -> rotates around Y axis (spin left/right)
            const impulseX = -(dy / distance) * impulseStrength;
            const impulseY = (dx / distance) * impulseStrength;

            // Add to current velocity (accumulation allows repeated hits)
            const currentVel = velRef.current[idx];
            velRef.current[idx] = {
              x: Math.max(-100, Math.min(100, currentVel.x + impulseX)),
              y: Math.max(-100, Math.min(100, currentVel.y + impulseY))
            };
          }
        });
      }

      lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: now };
    };

    const handleMouseUp = () => {
      if (draggedGhostRef.current !== null) {
        const idx = draggedGhostRef.current;
        setGhosts((prev) =>
          prev.map((g, i) =>
            i === idx ? { ...g, isDragging: false, speedX: (Math.random() - 0.5) * 0.15, speedY: (Math.random() - 0.5) * 0.15, teleportPhase: 'moving', teleportTimer: Math.random() * 600 + 300 } : g
          )
        );
        draggedGhostRef.current = null;
      }
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
          className={`${styles.ghost} ${ghost.isDragging ? styles.dragging : ''}`}
          style={{
            left: `${ghost.x}%`,
            top: `${ghost.y}%`,
            transform: `
              perspective(600px)
              rotateX(${spinState[idx].x}deg)
              rotateY(${spinState[idx].y}deg)
              rotate(${Math.sin(ghost.rotation * 0.1) * 10}deg)
            `,
            opacity: ghost.opacity,
            cursor: ghost.isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={(e) => handleMouseDown(idx, e)}
        >
          {GHOST_ART}
          {DEBUG_HITBOX && (
            <div
              style={{
                position: 'fixed',
                left: `${(ghost.x / 100) * (typeof window !== 'undefined' ? window.innerWidth : 1000) + GHOST_W / 2 - 2}px`,
                top: `${(ghost.y / 100) * (typeof window !== 'undefined' ? window.innerHeight : 1000) + GHOST_H / 2 - 2}px`,
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'red',
                pointerEvents: 'none',
              }}
            />
          )}
        </pre>
      ))}
    </div>
  );
}
