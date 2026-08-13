// Metro must be told about the monorepo: workspace packages live outside
// apps/mobile, and npm hoists their dependencies to the repo root.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the whole workspace so edits to @finance/domain hot-reload here.
config.watchFolders = [workspaceRoot];

// Resolve from the app first, then the hoisted root node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// NOTE: do NOT set `disableHierarchicalLookup = true` here.
// That advice targets pnpm/yarn-pnp layouts. npm hoists most packages to the
// root but leaves some nested (e.g. expo-modules-core under node_modules/expo),
// and disabling hierarchical lookup makes those nested deps unresolvable.

module.exports = withNativeWind(config, { input: "./global.css" });
