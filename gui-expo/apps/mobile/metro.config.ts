import { getDefaultConfig } from "expo/metro-config";

const config = getDefaultConfig(import.meta.dirname);

// expo run:android writes thousands of files under node_modules/*/android/build and .cxx while
// this lane's dev server runs; Expo's defaults skip only android/app/build, and on Windows
// watching the rest kept Metro too busy to answer the app.
const nativeBuildOutput = /[\\/]android[\\/](?:build|\.cxx|\.gradle|app[\\/]\.cxx)[\\/]/;
const blockList = config.resolver?.blockList ?? [];

export default {
  ...config,
  resolver: {
    ...config.resolver,
    blockList: [...(Array.isArray(blockList) ? blockList : [blockList]), nativeBuildOutput],
  },
};
