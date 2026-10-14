/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        med: {
          dark: '#0B4F47',       // Primary Green (Sidebar, Main Buttons, Headings)
          lime: '#DFFF72',       // Active Sidebar Item highlight
          sec: '#16A085',        // Secondary Green (Positive indicators, Stock available)
          light: '#E8F7F1',      // Light Green (Hover, Soft Badges)
          verylight: '#F3FAF7',  // Very Light Green (Subtle section background)
          text: '#17332F',       // Primary Text
          textSec: '#6B7C78',    // Secondary Text
          muted: '#98A8A4',      // Muted Text
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        '3d-subtle': '0 10px 30px -10px rgba(11, 79, 71, 0.12), 0 4px 12px rgba(0, 0, 0, 0.03)',
        '3d-glow': '0 0 25px rgba(22, 160, 133, 0.25)',
        'active-nav': '0 4px 20px rgba(223, 255, 114, 0.35)',
        'card-soft': '0 4px 20px -2px rgba(23, 51, 47, 0.05)',
      }
    },
  },
  plugins: [],
}
