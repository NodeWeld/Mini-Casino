/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        vegas: {
          bg: '#0a0010',
          purple: '#a855f7',
          pink: '#ec4899',
          gold: '#ffd700',
          cyan: '#22d3ee',
          felt: '#0d4d2e',
          feltDark: '#063220',
        },
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
      },
      boxShadow: {
        neonPurple: '0 0 12px #a855f7, 0 0 24px rgba(168, 85, 247, 0.5)',
        neonPink: '0 0 12px #ec4899, 0 0 24px rgba(236, 72, 153, 0.5)',
        neonGold: '0 0 12px #ffd700, 0 0 24px rgba(255, 215, 0, 0.45)',
        neonCyan: '0 0 12px #22d3ee, 0 0 20px rgba(34, 211, 238, 0.45)',
      },
      animation: {
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
        'chip-toss': 'chipToss 0.45s ease-out',
        'float-win': 'floatWin 1.2s ease-out forwards',
      },
      keyframes: {
        neonPulse: {
          '0%, 100%': { boxShadow: '0 0 8px #a855f7, 0 0 16px rgba(168, 85, 247, 0.4)' },
          '50%': { boxShadow: '0 0 16px #ec4899, 0 0 28px rgba(236, 72, 153, 0.55)' },
        },
        chipToss: {
          '0%': { transform: 'translateY(12px) scale(0.85)', opacity: '0.9' },
          '50%': { transform: 'translateY(-6px) scale(1.05)' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        floatWin: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-48px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
