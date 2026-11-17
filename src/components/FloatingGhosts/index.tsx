import React, { useEffect, useState, useRef, useCallback } from "react";
import styles from "./styles.module.css";
import GhostReveal from "./GhostReveal";
import { GHOST_ART_STYLES } from "./ghostArt";

const GHOST_NAMES = [
    "Casper",
    "Boo",
    "Morticia",
    "Wail",
    "Spectre",
    "Phantom",
    "Grimshaw",
    "Nyx",
    "Vex",
    "Haunt",
    "Mist",
    "Shade",
    "Duskmore",
    "Gloom",
    "Spook",
    "Wraith",
    "Eerie",
    "Lurk",
    "Flicker",
    "Hollow",
    "Seraph",
    "Banshee",
    "Cobweb",
    "Omen",
];

interface Ghost {
    id: number;
    // Position + velocity in px relative to the viewport. Physics in real
    // units behaves identically across browsers, unlike % + vh math that
    // breaks whenever a scrollbar appears or a mobile URL bar collapses.
    x: number;
    y: number;
    vx: number;
    vy: number;
    // idle drift angle, advances each tick
    angle: number;
    // squish/stretch spring — the "bouncy raccoon" response
    stretchX: number;
    stretchY: number;
    svx: number; // stretch spring velocity
    svy: number;
    opacity: number;
    targetOpacity: number;
    teleportTimer: number;
    teleportPhase:
        | "moving"
        | "stopping"
        | "fading-out"
        | "teleporting"
        | "fading-in"
        | "dying";
    spinX: number;
    spinY: number;
    isDragging?: boolean;
    // pointer target the drag spring chases (viewport coords)
    ptX?: number;
    ptY?: number;
    // low-passed drag velocity in px/tick — becomes the release throw
    dvx?: number;
    dvy?: number;
    // post-throw ballistic arc: temporary gravity until it settles
    throwArc?: boolean;
    arcTicks?: number;
    dyingProgress?: number;
    dyingTargetX?: number;
    dyingTargetY?: number;
    color: string;
    artStyle: number;
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

const PARTICLE_CHARS = ["👻", "💀", "✨", "*", "·", "°", "~", "¬", "░", "▒"];
const PARTICLE_COLORS = ["#a78bfa", "#f472b6", "#67e8f9", "#fde68a", "#86efac"];
export const GHOST_COLORS = [
    "#a78bfa",
    "#f472b6",
    "#67e8f9",
    "#86efac",
    "#fbbf24",
    "#fb923c",
];

// Fixed simulation rate — physics speed is refresh-rate independent.
const TICK_HZ = 60;
const TICK_MS = 1000 / TICK_HZ;

// physics constants (per tick at 60Hz)
const DRIFT_ACCEL = 0.0035; // wander force while idling
const DRIFT_DAMP = 0.985; // idle drag
const BOUNCE_ENERGY = 0.72; // velocity kept after an idle wall hit
const ARC_BOUNCE_ENERGY = 0.6; // livelier lossy bounce while thrown
const BOUNCE_SQUISH = 0.35; // spring compression on wall hit
const STRETCH_SPRING = 0.18; // squish spring stiffness
const STRETCH_DAMP = 0.78; // squish spring damping
const STRETCH_MIN = 0.35; // keep the spring within sane visual bounds
const STRETCH_MAX = 2.4;
const WALL_MARGIN = 10; // px from viewport edges where ghosts bounce
const DRAG_CHASE = 0.55; // per-tick catch-up toward the pointer target
const DRAG_SPEED_REF = 6; // px/tick that reads as "max squish" while dragging
const THROW_GRAVITY = 0.14; // px/tick² while the throw arc lasts
const ARC_END_V = 0.9; // rebound below this = the arc is over
const ARC_MAX_TICKS = 300; // hard cap on the arc
const THROW_MAX_V = 28; // px/tick cap on throw speed
const THROW_SCALE = 0.85;

// Fallback ghost footprint until the element is measured (px)
const DEFAULT_GHOST_W = 110;
const DEFAULT_GHOST_H = 90;

const clamp = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v));

let particleIdCounter = 0;
let ghostIdCounter = 0;

export default function FloatingGhosts(): React.ReactNode {
    // Ghosts and particles are mutated in place by the rAF loop; React
    // re-renders via a tick counter so we don't copy arrays 60x a second.
    const ghostsRef = useRef<Ghost[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const sizesRef = useRef<Map<number, { w: number; h: number }>>(new Map());
    const [, setRenderTick] = useState(0);
    const [revealQueue, setRevealQueue] = useState<
        Array<{ ghost: Ghost; name: string }>
    >([]);
    const [trashHover, setTrashHover] = useState(false);
    const [trashShake, setTrashShake] = useState(false);
    const [anyDragging, setAnyDragging] = useState(false);

    const draggedGhostRef = useRef<number | null>(null); // ghost id
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const trashRef = useRef<HTMLPreElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const accumulatorRef = useRef<number>(0);

    const render = useCallback(() => setRenderTick((t) => t + 1), []);

    const ghostSize = useCallback((id: number) => sizesRef.current.get(id), []);

    // Measure each ghost's rendered footprint once (offsetWidth/Height
    // ignore transforms, so squish never corrupts the numbers). A resize
    // clears the cache so the next render re-measures under the new
    // media query.
    const measureGhost = useCallback(
        (id: number, el: HTMLPreElement | null) => {
            if (el && !sizesRef.current.has(id)) {
                const w = el.offsetWidth;
                const h = el.offsetHeight;
                if (w > 0 && h > 0) sizesRef.current.set(id, { w, h });
            }
        },
        [],
    );

    useEffect(() => {
        const onResize = () => sizesRef.current.clear();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const isOverTrash = useCallback((clientX: number, clientY: number) => {
        if (!trashRef.current) return false;
        const rect = trashRef.current.getBoundingClientRect();
        const pad = 48; // bigger hit area for fat fingers
        return (
            clientX >= rect.left - pad &&
            clientX <= rect.right + pad &&
            clientY >= rect.top - pad &&
            clientY <= rect.bottom + pad
        );
    }, []);

    const spawnParticles = useCallback(
        (clientX: number, clientY: number) => {
            const burst: Particle[] = Array.from({ length: 22 }, () => {
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.6 + Math.random() * 1.8;
                return {
                    id: particleIdCounter++,
                    x: clientX,
                    y: clientY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 0.75,
                    char: PARTICLE_CHARS[
                        Math.floor(Math.random() * PARTICLE_CHARS.length)
                    ],
                    opacity: 1,
                    color: PARTICLE_COLORS[
                        Math.floor(Math.random() * PARTICLE_COLORS.length)
                    ],
                };
            });
            particlesRef.current.push(...burst);
        },
        [],
    );

    // ── Simulation ───────────────────────────────────────────────────────────

    const tickPhysics = useCallback(() => {
        const ghosts = ghostsRef.current;
        const W = window.innerWidth;
        const H = window.innerHeight;

        for (const g of ghosts) {
            if (g.teleportPhase === "dying") {
                const prog = Math.min(1, (g.dyingProgress ?? 0) + 0.045);
                const tx = g.dyingTargetX ?? g.x;
                const ty = g.dyingTargetY ?? g.y;
                g.x += (tx - g.x) * 0.14;
                g.y += (ty - g.y) * 0.14;
                g.opacity = 1 - prog;
                g.spinX += 2.2;
                g.spinY += 3.4;
                g.dyingProgress = prog;
                continue;
            }

            if (g.isDragging) {
                // chase the pointer target with a small spring — enough lag
                // to feel jelly, tight enough to never feel sloppy
                const px = g.ptX ?? g.x;
                const py = g.ptY ?? g.y;
                const dx = (px - g.x) * DRAG_CHASE;
                const dy = (py - g.y) * DRAG_CHASE;
                g.vx = dx;
                g.vy = dy;
                g.x += dx;
                g.y += dy;

                // smoothed release velocity: if the pointer stops and waits,
                // this decays to ~0 within a few ticks — no phantom throws
                g.dvx = (g.dvx ?? 0) * 0.65 + dx * 0.35;
                g.dvy = (g.dvy ?? 0) * 0.65 + dy * 0.35;

                // squish along the dominant motion axis, around a
                // slightly-inflated "held" baseline
                const speed = Math.min(1, Math.hypot(dx, dy) / DRAG_SPEED_REF);
                const long = 1.05 + speed * 0.38;
                const short = 1.03 - speed * 0.22;
                const alongX = Math.abs(dx) >= Math.abs(dy);
                const wantX = alongX ? long : short;
                const wantY = alongX ? short : long;
                g.stretchX += (wantX - g.stretchX) * 0.35;
                g.stretchY += (wantY - g.stretchY) * 0.35;
                continue;
            }

            // squish spring always relaxes back toward 1
            g.svx += (1 - g.stretchX) * STRETCH_SPRING;
            g.svy += (1 - g.stretchY) * STRETCH_SPRING;
            g.svx *= STRETCH_DAMP;
            g.svy *= STRETCH_DAMP;
            g.stretchX = clamp(g.stretchX + g.svx, STRETCH_MIN, STRETCH_MAX);
            g.stretchY = clamp(g.stretchY + g.svy, STRETCH_MIN, STRETCH_MAX);

            g.angle += 0.015;
            g.spinX *= 0.90;
            g.spinY *= 0.90;

            switch (g.teleportPhase) {
                case "moving": {
                    const size = ghostSize(g.id) ?? {
                        w: DEFAULT_GHOST_W,
                        h: DEFAULT_GHOST_H,
                    };
                    // bounce bounds account for the ghost's own size, so it
                    // stays fully on screen instead of hanging off the edge
                    const xMin = WALL_MARGIN;
                    const xMax = Math.max(xMin + 1, W - size.w - WALL_MARGIN);
                    const yMin = WALL_MARGIN;
                    const yMax = Math.max(yMin + 1, H - size.h - WALL_MARGIN);

                    if (g.throwArc) {
                        // ballistic descent: gravity + light air drag
                        g.vy += THROW_GRAVITY;
                        g.vx *= 0.99;
                        g.vy *= 0.998;
                    } else {
                        g.vx += Math.sin(g.angle) * DRIFT_ACCEL;
                        g.vy += Math.cos(g.angle) * DRIFT_ACCEL;
                        g.vx *= DRIFT_DAMP;
                        g.vy *= DRIFT_DAMP;
                    }
                    g.x += g.vx;
                    g.y += g.vy;

                    const bounce = g.throwArc
                        ? ARC_BOUNCE_ENERGY
                        : BOUNCE_ENERGY;

                    if (g.x <= xMin) {
                        g.x = xMin;
                        g.vx = Math.abs(g.vx) * bounce;
                        g.svx -= BOUNCE_SQUISH;
                        g.svy += BOUNCE_SQUISH * 0.6;
                        g.angle += Math.PI / 4;
                    } else if (g.x >= xMax) {
                        g.x = xMax;
                        g.vx = -Math.abs(g.vx) * bounce;
                        g.svx -= BOUNCE_SQUISH;
                        g.svy += BOUNCE_SQUISH * 0.6;
                        g.angle += Math.PI / 4;
                    }
                    if (g.y <= yMin) {
                        g.y = yMin;
                        g.vy = Math.abs(g.vy) * bounce;
                        g.svy -= BOUNCE_SQUISH;
                        g.svx += BOUNCE_SQUISH * 0.6;
                        g.angle += Math.PI / 4;
                    } else if (g.y >= yMax) {
                        g.y = yMax;
                        g.vy = -Math.abs(g.vy) * bounce;
                        g.svy -= BOUNCE_SQUISH;
                        g.svx += BOUNCE_SQUISH * 0.6;
                        g.angle += Math.PI / 4;
                        // soft floor landing ends the arc
                        if (g.throwArc && Math.abs(g.vy) < ARC_END_V) {
                            g.throwArc = false;
                            g.vy = 0;
                            g.vx *= 0.5;
                        }
                    }

                    if (g.throwArc) {
                        g.arcTicks = (g.arcTicks ?? 0) + 1;
                        if (g.arcTicks >= ARC_MAX_TICKS) {
                            g.throwArc = false;
                        }
                    } else {
                        g.arcTicks = 0;
                        g.teleportTimer -= 1;
                        if (g.teleportTimer <= 0) {
                            g.teleportPhase = "stopping";
                            g.teleportTimer = 30;
                        }
                    }
                    break;
                }
                case "stopping": {
                    g.vx *= 0.85;
                    g.vy *= 0.85;
                    g.x += g.vx;
                    g.y += g.vy;
                    g.teleportTimer -= 1;
                    if (g.teleportTimer <= 0) {
                        g.teleportPhase = "fading-out";
                        g.teleportTimer = 20;
                        g.vx = 0;
                        g.vy = 0;
                        g.dvx = 0;
                        g.dvy = 0;
                        g.targetOpacity = 0;
                    }
                    break;
                }
                case "fading-out": {
                    g.teleportTimer -= 1;
                    if (g.teleportTimer <= 0) {
                        g.teleportPhase = "teleporting";
                        g.teleportTimer = 5;
                    }
                    break;
                }
                case "teleporting": {
                    g.teleportTimer -= 1;
                    if (g.teleportTimer <= 0) {
                        const size = ghostSize(g.id) ?? {
                            w: DEFAULT_GHOST_W,
                            h: DEFAULT_GHOST_H,
                        };
                        g.x = WALL_MARGIN +
                            Math.random() *
                                Math.max(W - size.w - 2 * WALL_MARGIN, 40);
                        g.y = WALL_MARGIN +
                            Math.random() *
                                Math.max(H - size.h - 2 * WALL_MARGIN, 40);
                        g.vx = (Math.random() - 0.5) * 0.5;
                        g.vy = (Math.random() - 0.5) * 0.5;
                        g.angle = Math.random() * Math.PI * 2;
                        g.throwArc = false;
                        g.svx = 0.4;
                        g.svy = 0.4;
                        g.teleportPhase = "fading-in";
                        g.teleportTimer = 20;
                        g.targetOpacity = 1;
                    }
                    break;
                }
                case "fading-in": {
                    g.teleportTimer -= 1;
                    if (g.teleportTimer <= 0) {
                        g.teleportPhase = "moving";
                        g.teleportTimer = Math.random() * 400 + 200;
                    }
                    break;
                }
            }

            // opacity eases toward target
            g.opacity += (g.targetOpacity - g.opacity) * 0.15;
        }

        // drop fully-dead ghosts
        const dead = ghosts.filter(
            (g) => g.teleportPhase === "dying" && (g.dyingProgress ?? 0) >= 1,
        );
        if (dead.length > 0) {
            for (const g of dead) sizesRef.current.delete(g.id);
            ghostsRef.current = ghosts.filter(
                (g) =>
                    !(
                        g.teleportPhase === "dying" &&
                        (g.dyingProgress ?? 0) >= 1
                    ),
            );
        }

        // particles
        const ps = particlesRef.current;
        for (const p of ps) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.09;
            p.opacity -= 0.028;
        }
        if (ps.some((p) => p.opacity <= 0)) {
            particlesRef.current = ps.filter((p) => p.opacity > 0);
        }
    }, [ghostSize]);

    useEffect(() => {
        const loop = (now: number) => {
            if (!lastTimeRef.current) lastTimeRef.current = now;
            let dt = now - lastTimeRef.current;
            lastTimeRef.current = now;
            // after a background tab pause, skip the catch-up burst
            if (dt > 250) dt = TICK_MS;
            accumulatorRef.current += dt;
            let simulated = false;
            while (accumulatorRef.current >= TICK_MS) {
                accumulatorRef.current -= TICK_MS;
                tickPhysics();
                simulated = true;
            }
            if (simulated) render();
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastTimeRef.current = 0;
        };
    }, [tickPhysics, render]);

    // ── Terminal command hooks ───────────────────────────────────────────────

    useEffect(() => {
        const handleSummon = () => {
            const color =
                GHOST_COLORS[Math.floor(Math.random() * GHOST_COLORS.length)];
            const name =
                GHOST_NAMES[Math.floor(Math.random() * GHOST_NAMES.length)];
            const artStyle = Math.floor(
                Math.random() * GHOST_ART_STYLES.length,
            );
            const W = window.innerWidth;
            const H = window.innerHeight;
            const newGhost: Ghost = {
                id: ghostIdCounter++,
                x: W * (0.1 + Math.random() * 0.5),
                y: H * (0.1 + Math.random() * 0.5),
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                angle: Math.random() * Math.PI * 2,
                stretchX: 1,
                stretchY: 1,
                svx: 0,
                svy: 0,
                opacity: 1,
                targetOpacity: 1,
                teleportTimer: 6,
                teleportPhase: "fading-in",
                spinX: 0,
                spinY: 0,
                color,
                artStyle,
            };
            setRevealQueue((prev) => [...prev, { ghost: newGhost, name }]);
        };

        const handleKillAll = () => {
            const W = window.innerWidth;
            const H = window.innerHeight;
            for (const g of ghostsRef.current) {
                if (g.teleportPhase === "dying") continue;
                g.teleportPhase = "dying";
                g.dyingProgress = 0;
                g.isDragging = false;
                g.dyingTargetX =
                    WALL_MARGIN + Math.random() * (W * 0.8 - 2 * WALL_MARGIN);
                g.dyingTargetY =
                    WALL_MARGIN + Math.random() * (H * 0.8 - 2 * WALL_MARGIN);
            }
            draggedGhostRef.current = null;
            setAnyDragging(false);
            render();
        };

        window.addEventListener("summon-ghost", handleSummon);
        window.addEventListener("kill-ghosts", handleKillAll);
        return () => {
            window.removeEventListener("summon-ghost", handleSummon);
            window.removeEventListener("kill-ghosts", handleKillAll);
        };
    }, [render]);

    // ── Shared pointer logic (mouse + touch via pointer events) ──────────────

    const startDrag = useCallback(
        (id: number, clientX: number, clientY: number) => {
            const g = ghostsRef.current.find((g) => g.id === id);
            // can't grab a ghost that's phasing out or dying
            if (
                !g ||
                g.teleportPhase === "dying" ||
                g.teleportPhase === "fading-out" ||
                g.teleportPhase === "teleporting"
            ) {
                return;
            }
            draggedGhostRef.current = id;
            // anchor in layout coordinates — immune to the squish transform,
            // so the grab point never drifts (a transformed getBoundingClientRect
            // was off by whatever the current scale was)
            dragOffsetRef.current = { x: clientX - g.x, y: clientY - g.y };
            g.isDragging = true;
            g.throwArc = false;
            g.ptX = g.x;
            g.ptY = g.y;
            g.dvx = 0;
            g.dvy = 0;
            g.vx = 0;
            g.vy = 0;
            g.opacity = 1;
            g.targetOpacity = 1;
            setAnyDragging(true);
            render();
        },
        [render],
    );

    const moveDrag = useCallback(
        (clientX: number, clientY: number) => {
            const id = draggedGhostRef.current;
            if (id === null) return;
            const g = ghostsRef.current.find((g) => g.id === id);
            if (!g || !g.isDragging) return;

            setTrashHover(isOverTrash(clientX, clientY));

            const W = window.innerWidth;
            const H = window.innerHeight;
            const size = sizesRef.current.get(id) ?? {
                w: DEFAULT_GHOST_W,
                h: DEFAULT_GHOST_H,
            };
            const pad = 2;
            // clamp the spring target, not the ghost — it can visually
            // overshoot slightly on fast flicks, which reads as jelly
            g.ptX = clamp(
                clientX - dragOffsetRef.current.x,
                pad,
                Math.max(pad, W - size.w - pad),
            );
            g.ptY = clamp(
                clientY - dragOffsetRef.current.y,
                pad,
                Math.max(pad, H - size.h - pad),
            );
        },
        [isOverTrash],
    );

    const endDrag = useCallback(
        (clientX: number, clientY: number) => {
            const id = draggedGhostRef.current;
            if (id === null) return;
            const g = ghostsRef.current.find((g) => g.id === id);
            draggedGhostRef.current = null;
            setTrashHover(false);
            setAnyDragging(false);
            if (!g) return;

            if (isOverTrash(clientX, clientY) && trashRef.current) {
                const rect = trashRef.current.getBoundingClientRect();
                const size = sizesRef.current.get(id) ?? {
                    w: DEFAULT_GHOST_W,
                    h: DEFAULT_GHOST_H,
                };
                g.isDragging = false;
                g.teleportPhase = "dying";
                g.dyingProgress = 0;
                // aim the ghost's center (transform-origin) at the trash center
                g.dyingTargetX =
                    rect.left + rect.width / 2 - size.w / 2;
                g.dyingTargetY =
                    rect.top + rect.height / 2 - size.h / 2;

                setTimeout(() => {
                    setTrashShake(true);
                    spawnParticles(
                        rect.left + rect.width / 2,
                        rect.top + rect.height / 2,
                    );
                    setTimeout(() => setTrashShake(false), 600);
                }, 400);
            } else {
                // throw! hand over the smoothed drag velocity
                const speed = Math.hypot(g.dvx ?? 0, g.dvy ?? 0);
                g.isDragging = false;
                g.vx = clamp(
                    (g.dvx ?? 0) * THROW_SCALE,
                    -THROW_MAX_V,
                    THROW_MAX_V,
                );
                g.vy = clamp(
                    (g.dvy ?? 0) * THROW_SCALE,
                    -THROW_MAX_V,
                    THROW_MAX_V,
                );
                g.dvx = 0;
                g.dvy = 0;
                // springy pop back from the drag stretch
                g.svx = 0.4;
                g.svy = 0.4;
                // a real fling gets a gravity arc with bounce landings;
                // a gentle release just drifts from where it is
                g.throwArc = speed > 2.5;
                g.arcTicks = 0;
                g.teleportPhase = "moving";
                // let the fun play out before the ghost thinks about phasing
                g.teleportTimer = Math.random() * 600 + 400;
            }
            render();
        },
        [isOverTrash, spawnParticles, render],
    );

    // Global listeners — pointer events cover mouse, touch and pen in one API.
    useEffect(() => {
        const onPointerMove = (e: PointerEvent) => {
            if (draggedGhostRef.current === null) return;
            moveDrag(e.clientX, e.clientY);
        };
        const onPointerEnd = (e: PointerEvent) => {
            if (draggedGhostRef.current === null) return;
            endDrag(e.clientX, e.clientY);
        };

        document.addEventListener("pointermove", onPointerMove, {
            passive: true,
        });
        document.addEventListener("pointerup", onPointerEnd);
        document.addEventListener("pointercancel", onPointerEnd);

        return () => {
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerEnd);
            document.removeEventListener("pointercancel", onPointerEnd);
        };
    }, [moveDrag, endDrag]);

    // Graceful keep-going if a browser drops pointer capture mid-drag.
    const handleGhostLostCapture = (id: number, e: React.PointerEvent) => {
        if (draggedGhostRef.current === id) {
            endDrag(e.clientX, e.clientY);
        }
    };

    return (
        <div
            className={styles.ghostContainer}
            ref={containerRef}
            aria-hidden={undefined}
        >
            {/* Lootbox reveal — one at a time, queue drains naturally */}
            {revealQueue.length > 0 && (
                <GhostReveal
                    key={
                        revealQueue[0].name +
                        revealQueue[0].ghost.color +
                        revealQueue[0].ghost.x
                    }
                    ghostColor={revealQueue[0].ghost.color}
                    ghostName={revealQueue[0].name}
                    artStyle={revealQueue[0].ghost.artStyle}
                    onDone={() => {
                        const entry = revealQueue[0];
                        setRevealQueue((prev) => prev.slice(1));
                        ghostsRef.current = [
                            ...ghostsRef.current,
                            entry.ghost,
                        ];
                        render();
                    }}
                />
            )}
            {/* Trash can */}
            <pre
                ref={trashRef}
                className={`${styles.trashCan} ${anyDragging ? styles.trashVisible : ""} ${trashHover ? styles.trashHover : ""} ${trashShake ? styles.trashShake : ""}`}
            >
                {trashHover ? TRASH_ART_OPEN : TRASH_ART_CLOSED}
            </pre>

            {/* Particles */}
            {particlesRef.current.map((p) => (
                <span
                    key={p.id}
                    className={styles.particle}
                    style={{
                        left: `${p.x}px`,
                        top: `${p.y}px`,
                        opacity: p.opacity,
                        color: p.color,
                    }}
                >
                    {p.char}
                </span>
            ))}

            {/* Ghosts */}
            {ghostsRef.current.map((ghost) => (
                <pre
                    key={ghost.id}
                    ref={(el) => measureGhost(ghost.id, el)}
                    className={`${styles.ghost} ${ghost.isDragging ? styles.dragging : ""} ${ghost.teleportPhase === "fading-out" || ghost.teleportPhase === "teleporting" ? styles.fadingOut : ""} ${ghost.teleportPhase === "fading-in" ? styles.fadingIn : ""} ${ghost.teleportPhase === "dying" ? styles.dying : ""}`}
                    style={{
                        left: `${ghost.x}px`,
                        top: `${ghost.y}px`,
                        transform: `perspective(900px) rotateX(${ghost.spinX}deg) rotateY(${ghost.spinY}deg) scale(${ghost.stretchX * (ghost.teleportPhase === "dying" ? Math.max(0.05, 1 - (ghost.dyingProgress ?? 0)) : 1)}, ${ghost.stretchY * (ghost.teleportPhase === "dying" ? Math.max(0.05, 1 - (ghost.dyingProgress ?? 0)) : 1)})`,
                        opacity: ghost.opacity,
                        cursor: ghost.isDragging ? "grabbing" : "grab",
                        color: `${ghost.color}99`,
                        textShadow: `0 0 10px ${ghost.color}cc`,
                    }}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        (e.currentTarget as HTMLElement).setPointerCapture?.(
                            e.pointerId,
                        );
                        startDrag(ghost.id, e.clientX, e.clientY);
                    }}
                    onLostPointerCapture={(e) =>
                        handleGhostLostCapture(ghost.id, e)
                    }
                >
                    {GHOST_ART_STYLES[ghost.artStyle]}
                </pre>
            ))}
        </div>
    );
}
