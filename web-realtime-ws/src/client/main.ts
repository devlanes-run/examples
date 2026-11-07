import "./styles.css";
import { startChat } from "./chat.js";
import { watchTicks } from "./events.js";

watchTicks();
startChat();
