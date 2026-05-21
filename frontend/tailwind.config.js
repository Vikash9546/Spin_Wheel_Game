/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Keep existing mapping to prevent breaking other pages
        bg:        '#11131c',
        'surface-high': '#282933',
        'surface-low':  '#191b24',
        'primary-dim': '#a4e6ff',
        'secondary-c': '#cf5cff',
        'on-bg':   '#e1e1ef',
        'on-muted':'#bbc9cf',
        // New tokens from HTML Mockup
        "secondary-fixed": "#f8d8ff",
        "on-background": "#e1e1ef",
        "primary-container": "#00d1ff",
        "inverse-on-surface": "#2e303a",
        "surface-container-lowest": "#0c0e17",
        "primary-fixed": "#b7eaff",
        "on-tertiary-container": "#5d4d00",
        "surface-container-high": "#282933",
        "surface-dim": "#11131c",
        "on-surface": "#e1e1ef",
        "tertiary": "#ffda35",
        "surface-container": "#1d1f29",
        "on-tertiary-fixed": "#221b00",
        "surface-variant": "#32343e",
        "surface-tint": "#4cd6ff",
        "on-primary-fixed-variant": "#004e60",
        "primary": "#a4e6ff",
        "tertiary-fixed-dim": "#e9c400",
        "on-secondary-fixed": "#320047",
        "tertiary-fixed": "#ffe16d",
        "secondary-fixed-dim": "#ecb2ff",
        "outline": "#859399",
        "error": "#ffb4ab",
        "outline-variant": "#3c494e",
        "on-error": "#690005",
        "primary-fixed-dim": "#4cd6ff",
        "secondary-container": "#cf5cff",
        "on-surface-variant": "#bbc9cf",
        "inverse-primary": "#00677f",
        "on-secondary": "#520071",
        "surface-container-low": "#191b24",
        "surface-bright": "#373943",
        "secondary": "#ecb2ff",
        "surface": "#11131c",
        "on-primary": "#003543",
        "on-tertiary-fixed-variant": "#544600",
        "on-primary-container": "#00566a",
        "background": "#11131c",
        "tertiary-container": "#e1be00",
        "surface-container-highest": "#32343e",
        "on-error-container": "#ffdad6",
        "on-secondary-fixed-variant": "#74009f",
        "inverse-surface": "#e1e1ef",
        "on-primary-fixed": "#001f28",
        "on-tertiary": "#3a3000",
        "on-secondary-container": "#480063",
        "error-container": "#93000a"
      },
      fontFamily: {
        sora:  ['Sora', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'monospace'],
        "body-lg": ["inter"],
        "title-md": ["sora"],
        "label-caps": ["jetbrainsMono"],
        "headline-lg": ["sora"],
        "display-lg": ["sora"],
        "numeric-data": ["jetbrainsMono"]
      },
      fontSize: {
        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "title-md": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
        "label-caps": ["12px", {"lineHeight": "16px", "letterSpacing": "0.1em", "fontWeight": "700"}],
        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
        "display-lg": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "800"}],
        "numeric-data": ["18px", {"lineHeight": "24px", "fontWeight": "500"}]
      },
      spacing: {
        "xl": "40px",
        "sm": "8px",
        "lg": "24px",
        "unit": "4px",
        "md": "16px",
        "container-margin": "24px",
        "xs": "4px",
        "gutter": "16px"
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '18px',
        xl: '24px',
      },
      keyframes: {
        'neon-pulse': {
          '0%,100%': { borderColor: 'rgba(76,214,255,0.2)', boxShadow: '0 0 10px rgba(76,214,255,0.1)' },
          '50%':     { borderColor: 'rgba(76,214,255,0.8)', boxShadow: '0 0 28px rgba(76,214,255,0.4)' },
        },
        'blink': {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.15' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'winner-glow': {
          '0%,100%': { boxShadow: '0 0 12px rgba(255,218,53,0.3)' },
          '50%':     { boxShadow: '0 0 44px rgba(255,218,53,0.8)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', filter: 'blur(12px)' },
          '50%': { opacity: '1', filter: 'blur(20px)' }
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        'elimination-flash': {
          '0%, 100%': { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)' },
          '50%': { backgroundColor: 'rgba(239, 68, 68, 0.18)', borderColor: 'rgba(239, 68, 68, 0.4)' }
        }
      },
      animation: {
        'neon-pulse':  'neon-pulse 2.2s ease-in-out infinite',
        'blink':       'blink 1s ease-in-out infinite',
        'spin-slow':   'spin-slow 12s linear infinite',
        'winner-glow': 'winner-glow 1s ease-in-out infinite',
        'slide-up':    'slide-up 0.3s ease both',
        'pulse-glow': 'pulse-glow 2s infinite',
        'scanline': 'scanline 5s linear infinite',
        'elimination-pulse': 'elimination-flash 2s infinite'
      },
      backgroundImage: {
        'grad-primary': 'linear-gradient(135deg, #4cd6ff, #00b5d8)',
        'grad-secondary': 'linear-gradient(135deg, #cf5cff, #a020d0)',
        'grad-logo': 'linear-gradient(90deg, #4cd6ff, #ecb2ff)',
      },
      boxShadow: {
        'neon-primary':   '0 0 22px rgba(76,214,255,0.3)',
        'neon-secondary': '0 0 22px rgba(207,92,255,0.3)',
        'neon-error':     '0 0 22px rgba(255,180,171,0.3)',
      },
    },
  },
  plugins: [],
};
