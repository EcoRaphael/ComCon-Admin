/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',

  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        display: ['Lora', 'serif'],
      },

      colors: {
        // ── Core tokens ────────────────────────────────────────────────────
        // These use plain hex. The actual dark-mode flipping is handled in
        // index.css via @layer utilities overrides that reference CSS vars.
        // Do NOT use rgb-wrapped CSS vars here — Tailwind breaks them.

        navy:    '#111111',   // overridden in @layer utilities → var(--color-text-primary)
        sub:     '#555555',   // overridden in @layer utilities → var(--color-text-secondary)
        surface: '#F5F5F5',   // overridden in @layer utilities → var(--color-bg-secondary)
        border:  '#E0E0E0',   // overridden in @layer utilities → var(--color-border)

        // ── Brand Green ───────────────────────────────────────────────────
        green: {
          DEFAULT: '#2E7D32',
          dark:    '#1B5E20',
          hover:   '#388E3C',
          light:   '#E8F5E9',
          mid:     '#C8E6C9',
          dm:      '#4CAF50',   // used in Sidebar brand text (dark mode label)
        },

        // ── CTA (orange-red) ──────────────────────────────────────────────
        cta: {
          DEFAULT: '#E84C27',
          hover:   '#C43E1F',
        },

        // ── Card backgrounds ──────────────────────────────────────────────
        card:    '#FFFFFF',
        'card-dm': '#1E1E1E',

        // ── Semantic ──────────────────────────────────────────────────────
        brand: {
          red:    '#E53935',
          amber:  '#FFC107',
          blue:   '#2196F3',
          purple: '#7c3aed',
        },
      },

      borderRadius: {
        card: '14px',
        xl2:  '20px',
      },

      boxShadow: {
        card: '0 2px 16px rgba(0,0,0,.08)',
        md:   '0 6px 28px rgba(0,0,0,.12)',
        lg:   '0 16px 48px rgba(0,0,0,.18)',
      },

      animation: {
        'fade-in':  'fadeIn .4s ease both',
        'slide-up': 'slideUp .5s cubic-bezier(.22,1,.36,1) both',
        blink:      'blink 2s infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'none' } },
        blink:   { '0%,100%': { opacity: 1 }, '50%': { opacity: .3 } },
      },
    },
  },

  // Safelist: prevent Tailwind from purging classes we override in index.css
  safelist: [
    'dark',
    'text-navy', 'text-sub', 'bg-surface', 'bg-white', 'border-border',
    'text-green', 'bg-green', 'bg-green-light', 'bg-green-dark',
    'bg-green-50', 'bg-green-100', 'bg-red-50', 'bg-red-100',
    'bg-amber-50', 'bg-amber-100', 'bg-blue-50', 'bg-blue-100',
    'bg-slate-50', 'bg-slate-100', 'bg-gray-50',
    'text-green-600', 'text-green-800',
    'text-red-500', 'text-red-600', 'text-red-800',
    'text-amber-600', 'text-amber-700', 'text-amber-800',
    'text-blue-500', 'text-blue-600', 'text-blue-800',
    'text-slate-400', 'text-slate-500', 'text-slate-600', 'text-gray-400',
  ],

  plugins: [],
}