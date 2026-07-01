import type { Config } from "tailwindcss";

export default {
  darkMode: "selector",   // always dark — body never gets .light
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
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        /* Brand tokens — referenced from CSS vars */
        navy: {
          DEFAULT:    "var(--navy)",
          mid:        "var(--navy-mid)",
          light:      "var(--navy-light)",
          foreground: "var(--navy-foreground)",
        },
        gold: {
          DEFAULT:    "var(--gold)",
          muted:      "var(--gold-muted)",
          foreground: "var(--gold-foreground)",
        },

        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover:      "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT:    "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT:    "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar-background))",
          foreground:           "hsl(var(--sidebar-foreground))",
          primary:              "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:               "hsl(var(--sidebar-border))",
          ring:                 "hsl(var(--sidebar-ring))",
        },
      },
      backgroundImage: {
        "gradient-hero":    "var(--gradient-hero)",
        "gradient-gold":    "var(--gradient-gold)",
        "gradient-subtle":  "var(--gradient-subtle)",
        "gradient-card":    "var(--gradient-card)",
        /* Legacy aliases kept so existing JSX doesn't break */
        "gradient-primary": "var(--gradient-gold)",
        "gradient-deep":    "var(--gradient-hero)",
        "gradient-glass":   "linear-gradient(135deg, oklch(0.28 0.07 263 / 0.85) 0%, oklch(0.26 0.08 263 / 0.70) 100%)",
        "gradient-surface": "linear-gradient(180deg, oklch(0.24 0.08 263) 0%, oklch(0.22 0.09 263) 100%)",
      },
      boxShadow: {
        elegant:  "var(--shadow-elegant)",
        card:     "var(--shadow-card)",
        gold:     "var(--shadow-gold)",
        glass:    "var(--shadow-glass)",
        xs:       "var(--shadow-xs)",
        /* Legacy aliases */
        soft:     "var(--shadow-xs)",
        glow:     "var(--shadow-gold)",
      },
      borderRadius: {
        lg:  "var(--radius)",
        md:  "calc(var(--radius) - 4px)",
        sm:  "calc(var(--radius) - 8px)",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)"    },
          "50%":       { transform: "translateY(-9px)" },
        },
        fadeInUp:  {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)"    },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)"    },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-14px)" },
          to:   { opacity: "1", transform: "translateX(0)"     },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px oklch(0.78 0.13 80 / 0.15)" },
          "50%":       { boxShadow: "0 0 48px oklch(0.78 0.13 80 / 0.40)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1"    },
          "50%":       { opacity: "0.55" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "float":          "float 7s ease-in-out infinite",
        "fade-in":        "fadeInUp 0.45s cubic-bezier(0,0,0.2,1) both",
        "fade-in-up":     "fadeInUp 0.50s cubic-bezier(0,0,0.2,1) both",
        "slide-up":       "slideUp 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
        "slide-in":       "slideIn 0.40s cubic-bezier(0,0,0.2,1) both",
        "shimmer":        "shimmer 2.5s linear infinite",
        "glow-pulse":     "glowPulse 3.5s ease-in-out infinite",
        "pulse-soft":     "pulseSoft 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
