import "./storybook.setup";
import { beforeAll } from "vite-plus/test";
import { setProjectAnnotations } from "@storybook/react-vite";
import * as preview from "./preview";

const annotations = setProjectAnnotations([preview]);
beforeAll(annotations.beforeAll);
