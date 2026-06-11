/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
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
  plugins: [],
};
