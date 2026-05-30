/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        reading: ['Newsreader', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        paper: '#F7F5F0',
        ink: '#161616',
        rule: '#E2DFD8',
        muted: '#6B6A68',
        accent: '#F0EDE5',
        primary: '#D35400',
        secondary: '#2C3E50',
        ember: '#E67E22',
        // Dark-mode tokens
        'dark-bg': '#0E1015',
        'dark-card': '#15181E',
        'dark-fg': '#EAE9E4',
        'dark-border': '#262933',
        'dark-muted': '#8F93A3',
        state: {
          silent: '#6B6A68',
          attention: '#F39C12',
          escalation: '#D35400',
          decision: '#2C3E50'
        }
      },
      letterSpacing: {
        dateline: '0.2em'
      },
      maxWidth: {
        reading: '640px'
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.4s ease-out both',
        'scan': 'scan 1.4s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
