module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      // babel-preset-expo still drives expo-router + auto-configures
      // react-native-reanimated; jsxImportSource enables NativeWind's
      // className on every JSX element.
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  }
}
