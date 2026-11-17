// Spooky accent themes — switched at runtime with the `theme` terminal command.
// Accessible in both light and dark modes (accent is used by Infima via
// --ifm-color-primary, see custom.css).

export interface SpookyTheme {
    name: string;
    emoji: string;
    accent: string;
    accent2?: string;
}

export const SPOOKY_THEMES: SpookyTheme[] = [
    { name: "dracula", emoji: "🧛", accent: "#bd93f9", accent2: "#ff79c6" },
    { name: "pink", emoji: "💗", accent: "#ff79c6", accent2: "#bd93f9" },
    { name: "forest", emoji: "🌲", accent: "#50fa7b", accent2: "#8be9fd" },
    { name: "ocean", emoji: "🌊", accent: "#8be9fd", accent2: "#50fa7b" },
    { name: "blood", emoji: "🩸", accent: "#ff5555", accent2: "#ffb86c" },
    { name: "amber", emoji: "🕯️", accent: "#ffb86c", accent2: "#f1fa8c" },
    { name: "toxic", emoji: "☢️", accent: "#a3e635", accent2: "#22d3ee" },
    { name: "ghost", emoji: "👻", accent: "#e6e6fa", accent2: "#bd93f9" },
    { name: "void", emoji: "🕳️", accent: "#64748b", accent2: "#94a3b8" },
];

export const THEME_STORAGE_KEY = "spookyTheme";

export function getThemeNames(): string[] {
    return SPOOKY_THEMES.map((t) => t.name);
}

export function getTheme(name: string): SpookyTheme | undefined {
    const lower = name.toLowerCase();
    return SPOOKY_THEMES.find((t) => t.name === lower);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = hex.match(/^#?([0-9a-f]{6})$/i);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Pick black or white text for best contrast on the given accent. */
export function readableTextColor(hex: string): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return "#ffffff";
    const luminance =
        (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.6 ? "#1b1620" : "#f8f5ff";
}

/** Apply a theme to the live document and remember it in localStorage. */
export function applySpookyTheme(theme: SpookyTheme): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--spooky-accent", theme.accent);
    root.style.setProperty(
        "--spooky-accent-2",
        theme.accent2 || theme.accent,
    );
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme.name);
    } catch {
        // storage may be unavailable (private mode) — non-fatal
    }
}

export function resetSpookyTheme(): void {
    if (typeof document === "undefined") return;
    document.documentElement.style.removeProperty("--spooky-accent");
    document.documentElement.style.removeProperty("--spooky-accent-2");
    try {
        localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
        // ignore
    }
}
