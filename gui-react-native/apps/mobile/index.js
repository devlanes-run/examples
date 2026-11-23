// The entry file the native builds look for by name (index.js), so it stays JavaScript.
import { AppRegistry } from "react-native";
import App from "./src/App";
import { name as appName } from "./app.json";

AppRegistry.registerComponent(appName, () => App);
