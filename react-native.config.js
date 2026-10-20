module.exports = {
  project: {
    android: {},
    ios: {},
  },
  dependencies: {
    '@react-native-community/geolocation': {
      platforms: {
        android: null,
      },
    },
    '@react-native-vector-icons/common': {
      platforms: {
        android: null,
      },
    },
    'react-native-notifications': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
  assets: ['./src/assets/fonts/'],
};
