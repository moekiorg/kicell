#!/usr/bin/env node
import { GameEngine } from "@kicell/engine";
import {
  createNarrator,
  createNaturalLanguageProcessor,
  createConversationHandler,
} from "@kicell/engine/dist/ai/index.js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { CLISaveManager } from "./save-manager.js";
import { parseArguments } from "./app-config.js";
import { createUIEventHandler } from "./ui-event-handler.js";
import { createGameLoop } from "./game-loop.js";

config();

async function main() {
  const args = process.argv.slice(2);
  const config = parseArguments(args);

  const scenarioPath = resolve(config.scenarioFile);
  const blueprint = JSON.parse(readFileSync(scenarioPath, "utf-8"));

  const saveManager = new CLISaveManager();
  const handleUIEvent = createUIEventHandler();

  const engine = new GameEngine(blueprint, {
    uiEventHandler: handleUIEvent,
    narrator: createNarrator(),
    naturalLanguageProcessor: createNaturalLanguageProcessor(),
    conversationHandler: createConversationHandler(),
  });

  // Make debug function available globally
  (globalThis as any).debug = (
    message: string,
    level?: "info" | "warn" | "error"
  ) => {
    engine.debug(message, level);
  };

  if (config.continueFromSave) {
    const loaded = await saveManager.loadLatestSave(engine);
    if (loaded) {
      await engine.processCommand("look");
    } else {
      await engine.start();
    }
  } else {
    await engine.start();
  }

  const gameLoop = createGameLoop(engine, saveManager);
  gameLoop();
}

main().catch(console.error);
