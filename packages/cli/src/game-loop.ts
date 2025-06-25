import * as readline from "readline";
import { GameEngine } from "@kycell/engine";
import { CLISaveManager } from "./save-manager.js";
import { handleCLICommands } from "./cli-command-handler.js";

export function createGameLoop(
  engine: GameEngine,
  saveManager: CLISaveManager
) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const gameLoop = (): void => {
    if (engine.isGameOver()) {
      console.log("Game Over!");
      rl.close();
      return;
    }

    rl.question("> ", async (input) => {
      if (input.toLowerCase() === "quit" || input.toLowerCase() === "exit") {
        rl.close();
        return;
      }

      if (await handleCLICommands(input.trim(), engine, saveManager)) {
        gameLoop();
        return;
      }

      const result = await engine.processCommand(input);
      if (!result.success && result.message) {
        console.log(result.message);
      }

      gameLoop();
    });
  };

  return gameLoop;
}
