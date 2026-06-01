/** @type {import('tailwindcss').Config} */
// NativeWind 4 + Expo SDK 52 Tailwind config. `content` globs every
// screen/component so the JIT picks up className usage. The nativewind
// preset maps Tailwind tokens to React Native styles. COYL brand tokens
// are extended so `bg-coyl-ink text-coyl-cream` etc. work natively.
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        coyl: {
          orange: '#ff6600',
          amber: '#ff8a3d',
          cream: '#f5efe6',
          ink: '#0e0c0a',
          muted: '#a59a87',
          hair: 'rgba(245,239,230,0.12)',
        },
      },
    },
  },
  plugins: [],
}
