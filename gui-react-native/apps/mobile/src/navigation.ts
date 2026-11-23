import type { NativeStackScreenProps } from "@react-navigation/native-stack";

/** The app's screens and the parameters each one takes. */
export type RootStackParamList = {
  Home: undefined;
  Rows: { lane: number };
};

/** Props of the screen registered under `name`. */
export type ScreenProps<Name extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Name
>;
