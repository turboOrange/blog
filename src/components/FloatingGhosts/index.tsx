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
  spinX: number;
  spinY: number;
  lastMouseX?: number;
  lastMouseY?: number;
}

const GHOST_ART = `▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓
▓▓▓░▓▓░▓▓
▓▓▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓
▓ ▓ ▓ ▓ ▓`;

export default function FloatingGhosts(): React.ReactNode {
  const [ghosts, setGhosts] = useState<GhostPosition[]>([
    { x: 10, y: 20, speedX: 0.08, speedY: 0.05, rotation: 0, angle: 0, opacity: 1, teleportTimer: Math.random() * 200 + 100, teleportPhase: 'moving', spinX: 0, spinY: 0 },
    { x: 60, y: 50, speedX: -0.06, speedY: 0.09, rotation: 0, angle: Math.PI / 3, opacity: 1, teleportTimer: Math.random() * 200 + 150, teleportPhase: 'moving', spinX: 0, spinY: 0 },
    { x: 30, y: 80, speedX: 0.05, speedY: -0.08, rotation: 0, angle: Math.PI / 2, opacity: 1, teleportTimer: Math.random() * 200 + 200, teleportPhase: 'moving', spinX: 0, spinY: 0 },
  ]);

  const draggedGhostRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMousePosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: Date.now() });

  useEffect(() => {
    const animationFrame = setInterval(() => {
      setGhosts((prevGhosts) =>
        prevGhosts.map((ghost, idx) => {
          if (ghost.isDragging) {
            return ghost;
          }

          let newX = ghost.x;
          let newY = ghost.y;
          let newSpeedX = ghost.speedX;
          let newSpeedY = ghost.speedY;
          let newAngle = ghost.angle + 0.015;
          let newOpacity = ghost.opacity;
          let newTeleportTimer = ghost.teleportTimer - 1;
          let newPhase = ghost.teleportPhase;
          let newSpinX = ghost.spinX * 0.95; // Decay spin
          let newSpinY = ghost.spinY * 0.95;

          // Teleportation state machine
          if (newPhase === 'moving') {
            // Normal movement
            newSpeedX += Math.sin(newAngle) * 0.003;
            newSpeedY += Math.cos(newAngle) * 0.003;

            // Damping to keep speed reasonable
            newSpeedX *= 0.99;
            newSpeedY *= 0.99;

            newX += newSpeedX;
            newY += newSpeedY;

            // Gentle bounce off edges with curve
            if (newX <= 0 || newX >= 95) {
              newSpeedX = -newSpeedX * 0.8;
              newX = newX <= 0 ? 0 : 95;
              newAngle += Math.PI / 4;
            }
            if (newY <= 0 || newY >= 95) {
              newSpeedY = -newSpeedY * 0.8;
              newY = newY <= 0 ? 0 : 95;
              newAngle += Math.PI / 4;
            }

            // Start teleportation sequence
            if (newTeleportTimer <= 0) {
              newPhase = 'stopping';
              newTeleportTimer = 30; // Stop for 30 frames
            }
          } else if (newPhase === 'stopping') {
            // Slow down to a stop
            newSpeedX *= 0.85;
            newSpeedY *= 0.85;
            newX += newSpeedX;
            newY += newSpeedY;

            if (newTeleportTimer <= 0) {
              newPhase = 'fading-out';
              newTeleportTimer = 20; // Fade out over 20 frames
              newSpeedX = 0;
              newSpeedY = 0;
            }
          } else if (newPhase === 'fading-out') {
            // Fade out slowly
            newOpacity -= 0.05;
            if (newTeleportTimer <= 0 || newOpacity <= 0) {
              newPhase = 'teleporting';
              newOpacity = 0;
              newTeleportTimer = 5; // Instant teleport after a few frames
            }
          } else if (newPhase === 'teleporting') {
            // Teleport to new location
            if (newTeleportTimer <= 0) {
              newX = Math.random() * 90;
              newY = Math.random() * 90;
              newSpeedX = (Math.random() - 0.5) * 0.15;
              newSpeedY = (Math.random() - 0.5) * 0.15;
              newAngle = Math.random() * Math.PI * 2;
              newPhase = 'fading-in';
              newTeleportTimer = 20; // Fade in over 20 frames
            }
          } else if (newPhase === 'fading-in') {
            // Fade back in slowly
            newOpacity += 0.05;
            if (newOpacity >= 1) {
              newOpacity = 1;
              newPhase = 'moving';
              newTeleportTimer = Math.random() * 600 + 300; // Next teleport timer
            }
          }

          return {
            x: newX,
            y: newY,
            speedX: newSpeedX,
            speedY: newSpeedY,
            rotation: ghost.rotation + 0.2,
            angle: newAngle,
            opacity: Math.max(0, Math.min(1, newOpacity)),
            teleportTimer: newTeleportTimer,
            teleportPhase: newPhase,
            spinX: newSpinX,
            spinY: newSpinY,
          };
        })
      );
    }, 50);

    return () => clearInterval(animationFrame);
  }, []);

  const handleMouseDown = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    draggedGhostRef.current = idx;

    const ghostElement = e.currentTarget as HTMLElement;
    const rect = ghostElement.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };

    setGhosts((prev) =>
      prev.map((g, i) => (i === idx ? { ...g, isDragging: true, opacity: 1, teleportTimer: 300, teleportPhase: 'moving' } : g))
    );
  };

  const handleGhostMouseEnter = (idx: number, e: React.MouseEvent) => {
    // Initialize position on enter
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handleGhostMouseMove = (idx: number, e: React.MouseEvent) => {
    // Don't apply hover spin if we're dragging
    if (draggedGhostRef.current !== null) return;

    const now = Date.now();
    const timeDiff = Math.max(now - lastMousePosRef.current.time, 1);
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = distance / timeDiff;

    // Update last position
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: now };

    // Apply 3D spin based on mouse velocity and direction
    if (distance > 1) {
      const spinX = Math.max(-90, Math.min(90, -dy * speed * 5));
      const spinY = Math.max(-90, Math.min(90, dx * speed * 5));

      console.log('Speed:', speed.toFixed(2), 'Distance:', distance.toFixed(2), 'SpinX:', spinX.toFixed(2), 'SpinY:', spinY.toFixed(2));

      setGhosts((prev) =>
        prev.map((g, i) =>
          i === idx
            ? {
                ...g,
                spinX: spinX,
                spinY: spinY,
              }
            : g
        )
      );
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedGhostRef.current !== null) {
        const idx = draggedGhostRef.current;
        const now = Date.now();
        const newX = ((e.clientX - dragOffsetRef.current.x) / window.innerWidth) * 100;
        const newY = ((e.clientY - dragOffsetRef.current.y) / window.innerHeight) * 100;

        // Calculate velocity for spin
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;

        // Update last position
        lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: now };

        setGhosts((prev) =>
          prev.map((g, i) =>
            i === idx
              ? {
                  ...g,
                  x: Math.max(0, Math.min(95, newX)),
                  y: Math.max(0, Math.min(95, newY)),
                  spinX: Math.max(-60, Math.min(60, dy * 3)),
                  spinY: Math.max(-60, Math.min(60, dx * 3)),
                }
              : g
          )
        );
      }
    };

    const handleMouseUp = () => {
      if (draggedGhostRef.current !== null) {
        const idx = draggedGhostRef.current;

        setGhosts((prev) =>
          prev.map((g, i) =>
            i === idx
              ? {
                  ...g,
                  isDragging: false,
                  speedX: (Math.random() - 0.5) * 0.15,
                  speedY: (Math.random() - 0.5) * 0.15,
                  teleportPhase: 'moving',
                  teleportTimer: Math.random() * 600 + 300,
                }
              : g
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
          className={`${styles.ghost} ${ghost.isDragging ? styles.dragging : ''} ${ghost.teleportPhase === 'fading-out' || ghost.teleportPhase === 'teleporting' ? styles.fadingOut : ''} ${ghost.teleportPhase === 'fading-in' ? styles.fadingIn : ''}`}
          style={{
            left: `${ghost.x}%`,
            top: `${ghost.y}%`,
            transform: `
              perspective(1000px)
              rotateX(${ghost.spinX}deg)
              rotateY(${ghost.spinY}deg)
              rotate(${Math.sin(ghost.rotation * 0.1) * 10}deg)
            `,
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
