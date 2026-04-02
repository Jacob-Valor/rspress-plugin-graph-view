import * as path from "path";
import { defineConfig } from "@rspress/core";
import graphView from "./src";

export default defineConfig({
  root: path.join(__dirname, "docs"),
  title: "Rspress x Graph View",
  themeDir: path.join(__dirname, "theme"),
  plugins: [graphView()],
});
