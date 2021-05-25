module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      container: {
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '2rem',
          xl: '4rem',
          '2xl': '6rem',
        },
      },
      colors: {
        purple: {
          DEFAULT: '#5C0FDA',
        },
      },
      fontFamily: {
        sans: "Sans Regular",
        sanssemibold: "Sans Semi Bold",
        sansbold: "Sans Bold",
        sansblack: "Sans Black"
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
