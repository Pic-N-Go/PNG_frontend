module.exports = {
  expo: {
    name: 'PNG',
    slug: 'png',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/logo/logo_2.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/images/logo/logo_2.png',
      resizeMode: 'contain',
      backgroundColor: '#E31B59',
    },
    scheme: [
      'png',
      process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY
        ? `kakao${process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY}`
        : null,
      process.env.EXPO_PUBLIC_KAKAO_ANDROID_NATIVE_APP_KEY
        ? `kakao${process.env.EXPO_PUBLIC_KAKAO_ANDROID_NATIVE_APP_KEY}`
        : null,
    ].filter(Boolean),
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
        foregroundImage: './assets/images/logo/logo_2.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/images/logo/logo_2.png',
    },
    plugins: [
      'expo-secure-store',
      [
        // ponytail: prebuild 시 colorPrimary가 #023c69으로 덮어써지는 문제 방지
        './plugins/withAndroidColorPrimary',
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
            extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'],
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
      '@react-native-community/datetimepicker',
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
    ],
  },
};
