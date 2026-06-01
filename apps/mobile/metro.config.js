const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch the monorepo root for changes
config.watchFolders = [monorepoRoot]

// Resolve from both mobile and monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Follow symlinks (pnpm uses them)
config.resolver.unstable_enableSymlinks = true

// Ensure @repo/* packages resolve correctly
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@repo/shared' || moduleName.startsWith('@repo/shared/')) {
    const subpath = moduleName.replace('@repo/shared', '')
    const resolved = path.resolve(monorepoRoot, 'packages/shared/src' + (subpath || '/index.ts'))
    return { type: 'sourceFile', filePath: resolved }
  }
  return context.resolveRequest(context, moduleName, platform)
}

// Wrap with NativeWind — compiles global.css through Tailwind and wires
// the className → RN style runtime. Must be the outermost wrapper so it
// sees the fully-configured resolver above.
module.exports = withNativeWind(config, { input: './global.css' })
