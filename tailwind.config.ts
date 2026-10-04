import type { Config } from "tailwindcss";

/**
 * Bimora design tokens.
 * - ink / body / soft: warm-neutral text ramp (no pure black).
 * - paper: the off-white used for alternating sections.
 * - action: a Ditto-adjacent blue, darkened so white text passes 4.5:1.
 * - gap (amber) and ok (green) are status colours, used only for meaning.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14202B",
        body: "#47525E",
        soft: "#616B76",
        line: "#E5E3DD",
        "line-strong": "#CDCAC2",
        paper: "#F7F6F2",
        canvas: "#FFFFFF",
        night: "#10202E",
        action: { DEFAULT: "#0B6CC0", hover: "#0A5BA3", tint: "#E8F1FA", ink: "#0A4F8C" },
        gap: { DEFAULT: "#9A560A", tint: "#FDF3E2", line: "#F1D9AE" },
        ok: { DEFAULT: "#1E7449", tint: "#E7F4EC" },
        danger: { DEFAULT: "#B42318", tint: "#FDECEA" },
      },
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ['"Newsreader Variable"', "Newsreader", "Georgia", "serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.6rem, 1.6rem + 4.2vw, 4.9rem)", { lineHeight: "1.02", letterSpacing: "-0.025em" }],
        "display-lg": ["clamp(2.1rem, 1.5rem + 2.6vw, 3.6rem)", { lineHeight: "1.06", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.6rem, 1.3rem + 1.3vw, 2.3rem)", { lineHeight: "1.12", letterSpacing: "-0.015em" }],
      },
      borderRadius: { control: "12px", card: "18px", sheet: "24px" },
      boxShadow: {
        card: "0 1px 2px rgba(20,32,43,.05), 0 8px 24px -12px rgba(20,32,43,.12)",
        float: "0 1px 2px rgba(20,32,43,.06), 0 24px 56px -20px rgba(20,32,43,.24)",
      },
      maxWidth: { page: "1200px" },
      transitionTimingFunction: { out: "cubic-bezier(.2,.7,.2,1)" },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "none" } },
        wave: { "0%,100%": { transform: "scaleY(.35)" }, "50%": { transform: "scaleY(1)" } },
        pulseDot: { "0%,80%,100%": { opacity: ".25" }, "40%": { opacity: "1" } },
      },
      animation: {
        rise: "rise .32s cubic-bezier(.2,.7,.2,1) both",
        wave: "wave 1s ease-in-out infinite",
        dot: "pulseDot 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
