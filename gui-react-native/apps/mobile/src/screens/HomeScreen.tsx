import { ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchApi, fetchMetroLane } from "../api";
import { ApiCard } from "../components/ApiCard";
import { Header } from "../components/Header";
import { LaneCard } from "../components/LaneCard";
import { Row, Tone } from "../components/Row";
import { Surfaces } from "../components/Surfaces";
import { TerminalCard } from "../components/TerminalCard";
import { devServerOrigin } from "../devServer";
import { useRequest } from "../hooks/useRequest";
import type { ScreenProps } from "../navigation";
import { colors } from "../theme";

/** The lane card, the API's answer and the streaming test surfaces. */
export function HomeScreen({ navigation }: ScreenProps<"Home">) {
  const insets = useSafeAreaInsets();
  const metro = useRequest(fetchMetroLane);
  const api = useRequest(fetchApi);

  return (
    // The top inset sits outside the scroll view, so content never scrolls under the status bar.
    <ScrollView
      style={[styles.screen, { marginTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Header />
      {metro.status === "loading" && <Text style={styles.lede}>Asking Metro for the lane...</Text>}
      {metro.status === "failed" && (
        <TerminalCard title="GET /lane" laneColor={colors.bad}>
          <Row label="metro">
            <Tone tone="bad">{metro.error}</Tone>
          </Row>
        </TerminalCard>
      )}
      {metro.status === "ok" && (
        <>
          <Text style={styles.title}>
            This is lane {metro.value.lane} of {metro.value.project}.
          </Text>
          <Text style={styles.lede}>
            The {metro.value.service} service served this app from the worktree on{" "}
            {metro.value.branch}.
          </Text>
          <LaneCard info={metro.value} origin={devServerOrigin()} />

          <Text style={styles.h2}>The lane's API</Text>
          <Text style={styles.lede}>
            The app asks the Metro server it loaded from for /api/. Metro forwards the request to
            the api service of the same lane over plain HTTP.
          </Text>
          <ApiCard answer={api} lane={metro.value.lane} />

          <Text style={styles.h2}>Surfaces to stream</Text>
          <Surfaces
            lane={metro.value.lane}
            onOpenRows={() => navigation.navigate("Rows", { lane: metro.value.lane })}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paint },
  content: { paddingHorizontal: 20 },
  title: {
    marginTop: 24,
    marginBottom: 20,
    color: colors.ink,
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1.3,
    lineHeight: 40,
    textAlign: "center",
  },
  h2: {
    marginTop: 24,
    marginBottom: 12,
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.7,
    textAlign: "center",
  },
  lede: {
    marginBottom: 24,
    color: colors.lede,
    fontSize: 17,
    lineHeight: 25,
    textAlign: "center",
  },
});
