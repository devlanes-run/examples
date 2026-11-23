import { useCallback, useEffect, useState } from "react";
import { Pressable, Text } from "react-native";
import { type ApiAnswer, fetchAnswer } from "../api";
import { env } from "../env";
import { colors, ui } from "../theme";
import { Card, CardText, Row } from "./Card";

type State =
  { status: "loading" } | { status: "ok"; data: ApiAnswer } | { status: "error"; error: string };

/** Calls this lane's API and shows its lane, port and tasks, or the error. */
export function ApiCard() {
  const [state, setState] = useState<State>({ status: "loading" });
  const load = useCallback(() => {
    setState({ status: "loading" });
    fetchAnswer().then(
      (data) => setState({ status: "ok", data }),
      (error: unknown) =>
        setState({
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        }),
    );
  }, []);
  useEffect(load, [load]);

  return (
    <>
      <Card title={`GET ${env.apiUrl}/`}>
        {state.status === "loading" && <CardText>loading...</CardText>}
        {state.status === "error" && <CardText color={colors.bad}>{state.error}</CardText>}
        {state.status === "ok" && <Answer data={state.data} />}
      </Card>
      <Pressable style={ui.button} onPress={load}>
        <Text style={ui.buttonText}>Call the API again</Text>
      </Pressable>
    </>
  );
}

function Answer({ data }: { data: ApiAnswer }) {
  return (
    <>
      <Row label="lane">
        <CardText color={colors.ok}>{data.lane}</CardText>
      </Row>
      <Row label="port">
        <CardText>{data.port}</CardText>
      </Row>
      <Row label="url">
        <CardText>{data.url ?? "direct, not through the proxy"}</CardText>
      </Row>
      {data.tasks.map((task) => (
        <Row key={task.id} label={`task ${task.id}`}>
          <CardText color={task.done ? colors.ok : colors.termOut}>
            {task.done ? "[x]" : "[ ]"} {task.title}
          </CardText>
        </Row>
      ))}
    </>
  );
}
