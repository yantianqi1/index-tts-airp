import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-fira-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-fira-code)', 'monospace'],
      },
      colors: {
        // Dopamine Color Palette
        primary: '#3B82F6',
        secondary: '#60A5FA',
        cta: '#F97316',
        // Ambient blob colors
        'blob-pink': '#fce7f3',
        'blob-yellow': '#fef9c3',
        'blob-blue': '#e0f2fe',
        'blob-violet': '#ede9fe',
        // Juicy accent colors
        'peach': '#fbbf24',
        'coral': '#f97316',
        'lime': '#84cc16',
        'candy-pink': '#ec4899',
        'candy-violet': '#8b5cf6',
      },
      animation: {
        // Breathing blob animations
        'blob': 'blob 20s infinite',
        'blob-slow': 'blob 25s infinite',
        'blob-slower': 'blob 30s infinite',
        // Bouncy interactions
        'bounce-soft': 'bounce-soft 0.5s ease-out',
        'wiggle': 'wiggle 0.3s ease-in-out',
        // Float animation
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        blob: {
          '0%, 100%': {
            transform: 'translate(0, 0) scale(1)',
          },
          '25%': {
            transform: 'translate(20px, -30px) scale(1.1)',
          },
          '50%': {
            transform: 'translate(-20px, 20px) scale(0.95)',
          },
          '75%': {
            transform: 'translate(30px, 10px) scale(1.05)',
          },
        },
        'bounce-soft': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        '3xl': '64px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.04)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.06)',
        'candy': '0 4px 20px rgba(244, 114, 182, 0.25)',
        'candy-blue': '0 4px 20px rgba(56, 189, 248, 0.25)',
        'candy-violet': '0 4px 20px rgba(139, 92, 246, 0.25)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
export default config;
