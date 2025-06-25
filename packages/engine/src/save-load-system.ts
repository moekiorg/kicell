import { GameState } from "./game-state.js";
import { InventorySystem } from "./inventory-system.js";
import fs from "fs/promises";
import path from "path";
import { homedir } from "os";

export interface SaveData {
  currentLocation: string;
  turnCount: number;
  gameOver: boolean;
  entityStates: Record<string, Record<string, any>>;
  counters: Record<string, number>;
  flags: Record<string, boolean>;
  recentActions: string[];
  conversationHistory: Record<string, any[]>;
  inventories: Record<string, string[]>;
  timestamp: number;
}

export class SaveLoadSystem {
  save(gameState: GameState, inventorySystem: InventorySystem): SaveData {
    const saveData: SaveData = {
      currentLocation: gameState.getCurrentLocation(),
      turnCount: gameState.getTurnCount(),
      gameOver: gameState.isGameOver(),
      entityStates: this.mapToObject(gameState.getAllEntityStates()),
      counters: this.mapToObject(gameState.getAllCounters()),
      flags: this.mapToObject(gameState.getAllFlags()),
      recentActions: gameState.getRecentActions(),
      conversationHistory: this.mapToObject(
        gameState.getAllConversationHistory()
      ),
      inventories: this.mapToObject(inventorySystem.getAllInventories()),
      timestamp: Date.now(),
    };

    return saveData;
  }

  load(
    saveData: SaveData,
    gameState: GameState,
    inventorySystem: InventorySystem
  ): void {
    gameState.loadFromSaveData(saveData);
    inventorySystem.loadFromSaveData(saveData);
  }

  async saveToFile(
    gameState: GameState,
    inventorySystem: InventorySystem,
    filePath: string
  ): Promise<void> {
    const saveData = this.save(gameState, inventorySystem);
    const saveDir = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(saveDir, { recursive: true });

    // Write save data to file
    await fs.writeFile(filePath, JSON.stringify(saveData, null, 2), "utf-8");
  }

  async loadFromFile(
    filePath: string,
    gameState: GameState,
    inventorySystem: InventorySystem
  ): Promise<void> {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const saveData = JSON.parse(fileContent) as SaveData;
    this.load(saveData, gameState, inventorySystem);
  }

  async getLatestSaveFile(): Promise<string | null> {
    const saveDir = path.join(homedir(), ".kicell", "saves");

    try {
      const files = await fs.readdir(saveDir);
      const saveFiles = files.filter((file) => file.endsWith(".json"));

      if (saveFiles.length === 0) {
        return null;
      }

      // Get file stats to sort by modification time
      const fileStats = await Promise.all(
        saveFiles.map(async (file) => {
          const filePath = path.join(saveDir, file);
          const stats = await fs.stat(filePath);
          return { file, mtime: stats.mtime };
        })
      );

      // Sort by modification time (newest first)
      fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      return path.join(saveDir, fileStats[0].file);
    } catch (error) {
      return null;
    }
  }

  async loadLatestSave(
    gameState: GameState,
    inventorySystem: InventorySystem
  ): Promise<boolean> {
    const latestFile = await this.getLatestSaveFile();

    if (!latestFile) {
      return false;
    }

    try {
      await this.loadFromFile(latestFile, gameState, inventorySystem);
      return true;
    } catch (error) {
      return false;
    }
  }

  private mapToObject<K, V>(map: Map<K, V>): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const [key, value] of map.entries()) {
      const keyStr = String(key);
      if (value instanceof Map) {
        obj[keyStr] = this.mapToObject(value);
      } else if (value instanceof Set) {
        obj[keyStr] = Array.from(value);
      } else {
        obj[keyStr] = value;
      }
    }
    return obj;
  }
}
