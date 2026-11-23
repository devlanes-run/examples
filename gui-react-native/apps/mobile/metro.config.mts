import path from "node:path";
import { getDefaultConfig, mergeConfig, type MetroConfig } from "@react-native/metro-config";
import { devServerRoutes } from "./devserver/routes.mts";

const projectRoot = import.meta.dirname;
// npm hoists the app's dependencies to the example root, outside this folder.
const workspaceRoot = path.resolve(projectRoot, "../..");
const defaults = getDefaultConfig(projectRoot);

// The android service's Gradle build writes thousands of files under android/build, .cxx and
// .gradle, in node_modules too, while this lane's Metro runs. Metro does not need to watch them.
const nativeBuildOutput = /[\\/]android[\\/](?:app[\\/])?(?:build|\.cxx|\.gradle)[\\/]/;

const config: MetroConfig = {
  watchFolders: [workspaceRoot],
  resolver: {
    blockList: [defaults.resolver.blockList, nativeBuildOutput].flat(),
    nodeModulesPaths: [
      path.join(projectRoot, "node_modules"),
      path.join(workspaceRoot, "node_modules"),
    ],
  },
  server: {
    unstable_priorityMiddleware: devServerRoutes,
  },
};

export default mergeConfig(defaults, config);
