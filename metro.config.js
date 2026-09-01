const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Windows 환경에서 Metro FallbackWatcher가 대용량 네이티브/기타 폴더를 순회하다 타임아웃되는 것을 방지
const defaultBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : [config.resolver.blockList].filter(Boolean);

config.resolver.blockList = [
  ...defaultBlockList,
  /.*[\\\/]android[\\\/].*/,
  /.*[\\\/]ios[\\\/].*/,
  /.*[\\\/]\.git[\\\/].*/,
  /.*[\\\/]@mozmin__png-keystore-backup[\\\/].*/,
];

module.exports = withNativeWind(config, { input: "./global.css" });
