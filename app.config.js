const naverMapClientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID || '4h3ni6emuq';

module.exports = {
  expo: {
    name: 'PNG',
    slug: 'png',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/logo/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: Array.from(
      new Set([
        'png',
        process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY
          ? `kakao${process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY}`
          : null,
        process.env.EXPO_PUBLIC_KAKAO_ANDROID_NATIVE_APP_KEY
          ? `kakao${process.env.EXPO_PUBLIC_KAKAO_ANDROID_NATIVE_APP_KEY}`
          : null,
      ].filter(Boolean))
    ),
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.picngo.app',
      googleServicesFile: './GoogleService-Info.plist',
      infoPlist: {
        KAKAO_APP_KEY: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY,
      },
    },
    android: {
      package: 'com.picngo.app',
      googleServicesFile: './google-services.json',
      permissions: ['android.permission.POST_NOTIFICATIONS'],
      adaptiveIcon: {
        // 런처 마스크가 중앙 일부만 남기므로 icon.png보다 여백을 더 넣은 전용 파일을 쓴다.
        foregroundImage: './assets/images/logo/icon-adaptive.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/images/logo/icon.png',
    },
    plugins: [
      'expo-secure-store',
      [
        // top-level splash는 SDK 52+에서 deprecated. 이 플러그인만이 Android 12+의
        // windowSplashScreenBackground/AnimatedIcon을 넣어준다 — 없으면 시스템이
        // windowBackground를 무시하고 흰 배경 + 런처 아이콘을 띄운다.
        // 아이콘은 192dp 원으로 마스킹되므로 워드마크·로딩바는 들어가지 않는다.
        // 핑크 배경에 묻히지 않게 흰색으로 채운 핀 마크를 쓴다(원본은 검정+핑크).
        'expo-splash-screen',
        {
          backgroundColor: '#E31B59',
          image: './assets/images/logo/splash-icon.png',
          imageWidth: 180,
          resizeMode: 'contain',
        },
      ],
      [
        // ponytail: prebuild 시 colorPrimary가 #023c69으로 덮어써지는 문제 방지
        './plugins/withAndroidColorPrimary',
      ],
      [
        '@mj-studio/react-native-naver-map',
        {
          client_id: naverMapClientId,
        },
      ],
      [
        '@react-native-seoul/kakao-login',
        {
          kakaoAppKey: process.env.EXPO_PUBLIC_KAKAO_ANDROID_NATIVE_APP_KEY,
          kotlinVersion: '2.0.21',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            extraMavenRepos: [
              'https://devrepo.kakao.com/nexus/content/groups/public/',
              'https://repository.map.naver.com/archive/maven',
            ],
            packagingOptions: {
              pickFirst: ['lib/**/libc++_shared.so']
            }
          },
        },
      ],
      [
        // 권한 문구는 여기서 선언해야 prebuild가 Info.plist를 덮어써도 유지된다.
        // 앨범 선택만 쓰므로 카메라·마이크는 명시적으로 끈다. false로 두지 않으면 플러그인이
        // NSCameraUsageDescription과 영문 NSMicrophoneUsageDescription을 무조건 넣고,
        // Android 매니페스트에도 CAMERA·RECORD_AUDIO가 병합돼 앱 심사에서 사유를 요구받는다.
        'expo-image-picker',
        {
          photosPermission: '리뷰에 첨부할 사진을 선택하기 위해 앨범 접근 권한이 필요해요.',
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission: '내 위치 주변의 촬영 명소를 찾고 카메라 경로를 안내하기 위해 위치 권한이 필요해요.'
        }
      ],
      '@react-native-community/datetimepicker',
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
    ],
    extra: {
      eas: {
        projectId: '317ea14c-6bb0-414c-9a26-5c056df50f93',
      },
    },
  },
};
