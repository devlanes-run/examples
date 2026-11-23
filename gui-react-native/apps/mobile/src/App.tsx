import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { RootStackParamList } from "./navigation";
import { HomeScreen } from "./screens/HomeScreen";
import { RowsScreen } from "./screens/RowsScreen";
import { colors } from "./theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

/** The app: a native stack with the home screen and the long list. */
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.paint },
            headerTintColor: colors.ink,
            contentStyle: { backgroundColor: colors.paint },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Rows" component={RowsScreen} options={{ title: "1,000 rows" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
