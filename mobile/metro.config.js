const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.transformer.transformIgnorePatterns = [
  'node_modules/(?!(react-native|@react-native|expo|@expo|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@gorhom|@rnmapbox)/)',
];

module.exports = withNativeWind(config, { input: './global.css' });
