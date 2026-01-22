/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        urbansense: {
          // Fond : On passe sur du Zinc (plus chaud/naturel que le bleu-noir)
          background: '#09090b', // Zinc 950
          
          // Surfaces
          'surface-0': '#18181b', // Zinc 900
          'surface-1': '#27272a', // Zinc 800
          'surface-2': '#3f3f46', // Zinc 700
          
          // Bordures : Plus subtiles
          'border-dim': '#27272a',
          'border-mid': '#3f3f46',
          'border-light': '#52525b',
          
          // Texte
          primary: '#f4f4f5',    // Zinc 100
          secondary: '#a1a1aa',  // Zinc 400
          tertiary: '#71717a',   // Zinc 500
          
          // Accent : On remplace le bleu néon par un Indigo propre
          accent: '#6366f1',     // Indigo 500
          'accent-hover': '#4f46e5', // Indigo 600
          
          success: '#10b981', // Emerald 500
          warning: '#f59e0b', // Amber 500
          error: '#ef4444',   // Red 500
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // Suppression des dégradés "Gamer/Sci-Fi"
      backgroundImage: {
        'gradient-subtle': 'linear-gradient(to bottom right, #18181b, #09090b)',
      },
      // Ombres plus douces, moins "néon"
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card': '0 0 0 1px rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.5)',
      }
    },
  },
  plugins: [],
}