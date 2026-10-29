/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          900: '#0B0F19', // deep midnight background
          800: '#111827', // card background
          700: '#1F2937', // border / elevated surfaces
          600: '#374151'
        },
        cinematic: {
          violet: '#8B5CF6',
          violetHover: '#7C3AED',
          amber: '#F59E0B',
          amberHover: '#D97706',
          cyan: '#06B6D4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'cinema-glow': 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        'card-gradient': 'linear-gradient(180deg, rgba(31, 41, 55, 0.6) 0%, rgba(17, 24, 39, 0.9) 100%)',
      }
    },
  },
  plugins: [],
}
