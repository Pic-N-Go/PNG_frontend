const colors = require('./src/constants/colors.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      fontFamily: {
        // 한글: Pretendard Variable (Android / Web fallback)
        pretendard: ["PretendardVariable"],
        // 제목 (17px 이상): SF Pro Display → Pretendard fallback
        "sf-display": ["SF Pro Display", "PretendardVariable"],
        // 본문 (16px 이하): SF Pro Text → Pretendard fallback
        "sf-text": ["SF Pro Text", "PretendardVariable"],
      },
    },
  },
  // font-weight 유틸리티는 global.css에서 Pretendard 패밀리로 재정의한다.
  corePlugins: { fontWeight: false },
  plugins: [],
};
