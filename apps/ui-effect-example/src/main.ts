import { BrowserHost } from "@effect/ui/html";
import { Effect, Layer } from "effect";
import { App } from "./app";
import "./styles.css";

Effect.runFork(Layer.launch(BrowserHost.mount(App, {}, document.getElementById("app")!)));
