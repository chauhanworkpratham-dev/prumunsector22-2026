import type { Config } from "tailwindcss";

export default {
  darkMode: "class",   // light by default; .dark only for admin panels if needed
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

        navy: {
          DEFAULT: "#0B1F3A",
          mid:     "#162D4E",
          light:   "#1E3A5F",
        },
        gold: {
          DEFAULT: "#C9973A",
          light:   "#E8B84B",
          pale:    "#FDF4E3",
        },

        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
        /* legacy aliases */
        "gradient-primary": "var(--gradient-gold)",
        "gradient-deep":    "var(--gradient-hero)",
      },
      boxShadow: {
        card:     "var(--shadow-card)",
        elegant:  "var(--shadow-elegant)",
        gold:     "var(--shadow-gold)",
        sm:       "var(--shadow-sm)",
        /* legacy aliases */
        soft:     "var(--shadow-card)",
        glass:    "var(--shadow-elegant)",
        glow:     "var(--shadow-gold)",
        xs:       "var(--shadow-sm)",
      },
      borderRadius: {
        lg:  "var(--radius)",
        md:  "calc(var(--radius) - 2px)",
        sm:  "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.25rem",
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
        fadeUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)"    },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)"    },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1"    },
          "50%":       { opacity: "0.55" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fadeUp 0.40s cubic-bezier(0,0,0.2,1) both",
        "fade-in-up":     "fadeUp 0.50s cubic-bezier(0,0,0.2,1) both",
        "slide-up":       "slideUp 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
        "pulse-soft":     "pulseSoft 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
