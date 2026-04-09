import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        orange: {
          DEFAULT: '#ff6600',
          50: '#fff3e6',
          100: '#ffe0bf',
          200: '#ffbf80',
          300: '#ff9d40',
          400: '#ff8020',
          500: '#ff6600',
          600: '#e05c00',
          700: '#b34800',
          800: '#803400',
          900: '#4d1f00',
        },
        charcoal: '#1a1a1a',
        cream: '#f5f5f0',
        status: {
          inbox: 'var(--status-inbox)',
          open: 'var(--status-open)',
          planned: 'var(--status-planned)',
          'in-progress': 'var(--status-in-progress)',
          blocked: 'var(--status-blocked)',
          waiting: 'var(--status-waiting)',
          snoozed: 'var(--status-snoozed)',
          completed: 'var(--status-completed)',
          archived: 'var(--status-archived)',
        },
        priority: {
          critical: 'var(--priority-critical)',
          high: 'var(--priority-high)',
          medium: 'var(--priority-medium)',
          low: 'var(--priority-low)',
          someday: 'var(--priority-someday)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glass: 'var(--glass-shadow)',
        'glow-orange': 'var(--glow-orange)',
        'glow-success': 'var(--glow-success)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.12)',
        'card-hover-dark': '0 12px 40px rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 102, 0, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 102, 0, 0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        float: 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'mesh-1': 'mesh1 20s ease-in-out infinite alternate',
        'mesh-2': 'mesh2 25s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
}

export default config
