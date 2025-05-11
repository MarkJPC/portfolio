import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Tech theme specific colors
        tech: {
          blue: "#0CFFE1",     // Electric blue
          purple: "#9D4EDD",   // Purple
          orange: "#FF5C00",   // Warning orange
          dark: "#121212",     // Background dark
          darker: "#0A0A0A",   // Darker shade
          lighter: "#1E1E1E",  // Lighter shade
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Tech theme animations
        "glow": {
          "0%, 100%": { boxShadow: "0 0 2px #0CFFE1, 0 0 4px #0CFFE1" },
          "50%": { boxShadow: "0 0 6px #0CFFE1, 0 0 12px #0CFFE1" },
        },
        "pulse-tech": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow": "glow 2s ease-in-out infinite",
        "pulse-tech": "pulse-tech 1.5s ease-in-out infinite",
      },
      boxShadow: {
        'tech': '0 0 5px #0CFFE1',
        'tech-lg': '0 0 10px #0CFFE1',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;