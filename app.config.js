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
    scheme: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY
      ? [`kakao${process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY}`]
      : [],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.picngo.app',
      infoPlist: {
        KAKAO_APP_KEY: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY,
      },
    },
    android: {
      package: 'com.picngo.app',
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
          },
        },
      ],
    ],
  },
};
