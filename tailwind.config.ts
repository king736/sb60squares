import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        seahawks: { navy: '#002244', green: '#69BE28', gray: '#A5ACAF' },
        patriots: { blue: '#002244', red: '#C60C30', silver: '#B0B7BC' },
      },
    },
  },
  plugins: [],
};
export default config;
