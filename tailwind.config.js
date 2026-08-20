const colors = require('./src/constants/colors.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
    },
  },
  // font-weight 유틸리티는 global.css에서 Pretendard 패밀리로 재정의한다.
  corePlugins: { fontWeight: false },
  plugins: [],
};
