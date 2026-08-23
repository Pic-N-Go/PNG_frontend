const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ["dist/*", ".claude/**"],
  },
  {
    files: ["scripts/**/*.js"],
    languageOptions: { globals: globals.node },
  },
  {
    // NativeWind v4는 Pressable의 함수형 style(({pressed}) => ...)을 통째로 버린다.
    // 그 안에 넣은 height/backgroundColor/position 등이 조용히 사라져서, 버튼이 글자 높이로
    // 찌그러지거나(TimePickerSheet 확인 버튼) 터치 오버레이가 크기 0으로 접힌다(MapBanner).
    // 렌더가 깨져도 에러가 안 나고 화면에서 사라지기만 해서 원인 찾기가 매우 어렵다.
    files: ["**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXOpeningElement[name.name='Pressable'] > JSXAttribute[name.name='style'] > JSXExpressionContainer > :matches(ArrowFunctionExpression, FunctionExpression)",
          message:
            "Pressable에 함수형 style을 쓰지 마세요 — NativeWind v4가 통째로 버립니다. 레이아웃·배경은 일반 객체 style이나 바깥 View에 두고, 눌림 피드백은 android_ripple을 쓰세요.",
        },
      ],
    },
  },
]);
