import { Link } from "expo-router";
import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiCard } from "../components/ApiCard";
import { EchoInput } from "../components/EchoInput";
import { Header } from "../components/Header";
import { LaneCard } from "../components/LaneCard";
import { LaneModal } from "../components/LaneModal";
import { laneInfo } from "../lane";
import { ui } from "../theme";

/** The lane screen: the lane card, the API's answer, and the controls for window streaming tests. */
export default function LaneScreen() {
  return (
    <SafeAreaView style={ui.screen}>
      {/* Android draws apps edge to edge, so the keyboard covers the field unless the view moves. */}
      <KeyboardAvoidingView style={ui.screen} behavior="padding">
        <ScrollView contentContainerStyle={ui.main} keyboardShouldPersistTaps="handled">
          <Header />
          <Text style={ui.title}>
            This is lane {laneInfo.lane} of {laneInfo.project}.
          </Text>
          <Text style={ui.lede}>
            Served by <Text style={ui.code}>{laneInfo.service}</Text> from the worktree on{" "}
            <Text style={ui.code}>{laneInfo.branch}</Text>.
          </Text>
          <LaneCard info={laneInfo} />

          <Text style={ui.h2}>The lane's API</Text>
          <ApiCard />

          <Text style={ui.h2}>Things to click</Text>
          <EchoInput />
          <View style={ui.actions}>
            <LaneModal info={laneInfo} />
            <Link href="/rows" asChild>
              <Pressable style={ui.button}>
                <Text style={ui.buttonText}>Open a long list</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
