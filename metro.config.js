const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Windows 환경에서 Metro FallbackWatcher가 대용량 네이티브/기타 폴더를 순회하다 타임아웃되는 것을 방지
const defaultBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : [config.resolver.blockList].filter(Boolean);

// 프로젝트 루트 바로 아래의 android/ios/.git/키스토어 백업 폴더만 차단 (src/android/ 같은 무관한 경로 오탐 방지)
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rootDirPattern = escapeRegExp(__dirname);
const sep = "[\\\\/]";
const blockRootDir = (name) =>
  new RegExp(`^${rootDirPattern}${sep}${name}(${sep}|$)`);

config.resolver.blockList = [
  ...defaultBlockList,
  blockRootDir("android"),
  blockRootDir("ios"),
  blockRootDir("\\.git"),
  blockRootDir("@mozmin__png-keystore-backup"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
