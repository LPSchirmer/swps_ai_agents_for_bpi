/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ============================================================
      // MUTED TECH DESIGN SYSTEM - Premium Dark Mode
      // ============================================================
      colors: {
        // === BACKGROUND HIERARCHY ===
        // Usage: bg-background, bg-background-surface, bg-background-elevated
        'background': {
          DEFAULT: '#0B0F14',     // Haupthintergrund (fast schwarz, leicht blau)
          'surface': '#111827',   // Panels, Cards
          'elevated': '#151F2E',  // Hover, aktive Cards
        },
        // === TEXT HIERARCHY ===
        // Usage: text-text-primary, text-text-secondary, text-text-muted
        'text': {
          'primary': '#E5E7EB',   // Haupttext
          'secondary': '#9CA3AF', // Sekundärtext
          'muted': '#6B7280',     // Labels, Meta
        },
        // === ACCENT COLORS (sparsam!) ===
        // Usage: bg-accent, text-accent, border-accent
        'accent': {
          DEFAULT: '#3B82F6',     // Hauptakzent (Soft-Tech-Blau)
          'hover': '#2563EB',     // Hover-State
          'subtle': '#1E40AF',    // Sehr dezent
          'highlight': '#22D3EE', // Nur für Highlights (sparsam!)
        },
        // === SEMANTIC COLORS ===
        // Usage: text-semantic-success, bg-semantic-success, etc.
        'semantic': {
          'success': '#22C55E',
          'success-muted': '#166534',
          'warning': '#F59E0B',
          'warning-muted': '#92400E',
          'error': '#EF4444',
          'error-muted': '#991B1B',
        },
        // === BORDER & DIVIDER ===
        // Usage: border-border, border-border-light
        'border': {
          DEFAULT: '#1F2937',
          'light': '#374151',
          'focus': '#3B82F6',
        },
      },
      // === TYPOGRAPHY ===
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        // KPI Numbers - größer, weniger Gewicht
        'kpi': ['2.5rem', { lineHeight: '1', fontWeight: '500' }],
        'kpi-sm': ['1.75rem', { lineHeight: '1.1', fontWeight: '500' }],
        // Labels - klein + muted
        'label': ['0.75rem', { lineHeight: '1.4', fontWeight: '450', letterSpacing: '0.025em' }],
        'label-lg': ['0.875rem', { lineHeight: '1.4', fontWeight: '450' }],
      },
      fontWeight: {
        'label': '450',
      },
      // === SPACING (mehr Luft!) ===
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      // === BORDER RADIUS (konsistent 12-16px) ===
      borderRadius: {
        'card': '14px',
        'panel': '16px',
        'button': '10px',
      },
      // === BOX SHADOW (hochwertige Schatten) ===
      boxShadow: {
        'card': '0 10px 30px rgba(0, 0, 0, 0.35)',
        'card-hover': '0 15px 40px rgba(0, 0, 0, 0.45)',
        'panel': '0 20px 50px rgba(0, 0, 0, 0.4)',
        'button': '0 4px 14px rgba(0, 0, 0, 0.25)',
        'inner-subtle': 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
      },
      // === ANIMATIONS (subtil, 150-200ms) ===
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      // === TRANSITIONS ===
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      },
      transitionTimingFunction: {
        'out-smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
