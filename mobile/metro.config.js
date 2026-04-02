const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Redirect react-native-worklets to its pre-compiled lib output.
// The package.json `react-native` field points to ./src/index (TypeScript)
// which Metro's transform worker fails to process (babel-preset-expo not found
// in the jest-worker subprocess context). The compiled lib/module/ output is
// plain JS and resolves correctly.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-worklets') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(
        __dirname,
        'node_modules/react-native-worklets/lib/module/index.js'
      ),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Include react-native-worklets in transform so Metro handles ESM import/export
// syntax in the compiled lib/module/ files.
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!(react-native|@react-native|expo|@expo|react-native-worklets|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@gorhom|@rnmapbox)/)',
];

module.exports = withNativeWind(config, { input: './global.css' });
