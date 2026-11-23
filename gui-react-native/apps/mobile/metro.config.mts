import path from "node:path";
import { getDefaultConfig, mergeConfig, type MetroConfig } from "@react-native/metro-config";
import { devServerRoutes } from "./devserver/routes.mts";

const projectRoot = import.meta.dirname;
// npm hoists the app's dependencies to the example root, outside this folder.
const workspaceRoot = path.resolve(projectRoot, "../..");

const config: MetroConfig = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.join(projectRoot, "node_modules"),
      path.join(workspaceRoot, "node_modules"),
    ],
  },
  server: {
    unstable_priorityMiddleware: devServerRoutes,
  },
};

export default mergeConfig(getDefaultConfig(projectRoot), config);
