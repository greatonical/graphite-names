import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: "var(--font-poppins)",
      },

      colors: {
        // background: "var(--background)",
        // foreground: "var(--foreground)",
        primary: "#72FB9D",
        background: "#19191A",
        "black-100": "#B8B8B8",
        "black-300": "#3D3D3F",
        "black-500": "#202023",
        "black-600": "#19191A",
        "green-900": "#627275",
        "gradient-start": "#1B262E",
        "gradient-end": "#213741",
      },

      

      animation: {
        'gradient-x': 'gradient-x 10s ease infinite',
        'gradient-y': 'gradient-y 10s ease infinite',
        'gradient-xy': 'gradient-xy 30s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: 'left center' },
          '50%': { backgroundPosition: 'right center' },
        },
        'gradient-y': {
          '0%, 100%': { backgroundPosition: 'center top' },
          '50%': { backgroundPosition: 'center bottom' },
        },
        'gradient-xy': {
           '0%, 100%': {
            'background-position': '0% 0%',
          },
          '25%': {
            'background-position': '10% 0%',
          },
          '50%': {
            'background-position': '100% 100%',
          },
          '75%': {
            'background-position': '0% 100%',
          },
        },
      },

      screens: {
        "desktop-qhd": {
          min: "2560px",
        },
        "desktop-lg": {
          min: "1920px",
          max: "2559px",
        },
        "desktop-slg": {
          max: "1911px",
          min: "1520px",
        },
        "desktop-md": {
          max: "1511px",
        },
        "desktop-sm": {
          max: "1365px",
        },
        tablet: {
          max: "1200px",
          min: "768px",
        },
        "mobile-lg": {
          max: "767px",
          min: "480px",
        },
        "mobile-sm": {
          max: "479px",
          min: "390px",
        },
        "mobile-xs": {
          max: "389px",
          min: "320px",
        },
        mobile: {
          max: "1023px",
          min: "320px",
        },
        desktop: {
          max: "4460px",
          min: "1024px",
        },
      },
    },
  },
  plugins: [],
};
export default config;
