import { GameEngine, SaveLoadSystem } from "@kycell/engine";
import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';

export class CLISaveManager {
  private saveLoadSystem: SaveLoadSystem;
  private saveDir: string;

  constructor() {
    this.saveLoadSystem = new SaveLoadSystem();
    this.saveDir = path.join(homedir(), '.kycell', 'saves');
  }

  async saveGame(engine: GameEngine, filename?: string): Promise<string> {
    const saveFilename = filename || `save_${Date.now()}.json`;
    const savePath = path.join(this.saveDir, saveFilename);

    const gameState = engine.getGameState();
    const inventorySystem = engine.getInventorySystem();

    await this.saveLoadSystem.saveToFile(gameState, inventorySystem, savePath);
    return savePath;
  }

  async loadGame(engine: GameEngine, filename: string): Promise<void> {
    const savePath = path.join(this.saveDir, filename);
    
    const gameState = engine.getGameState();
    const inventorySystem = engine.getInventorySystem();

    await this.saveLoadSystem.loadFromFile(savePath, gameState, inventorySystem);
  }

  async getLatestSaveFile(): Promise<string | null> {
    try {
      const files = await fs.readdir(this.saveDir);
      const saveFiles = files.filter(file => file.endsWith('.json'));
      
      if (saveFiles.length === 0) {
        return null;
      }

      // Get file stats to sort by modification time
      const fileStats = await Promise.all(
        saveFiles.map(async (file) => {
          const filePath = path.join(this.saveDir, file);
          const stats = await fs.stat(filePath);
          return { file, mtime: stats.mtime };
        })
      );

      // Sort by modification time (newest first)
      fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      return fileStats[0].file;
    } catch (error) {
      return null;
    }
  }

  async loadLatestSave(engine: GameEngine): Promise<boolean> {
    const latestFile = await this.getLatestSaveFile();
    
    if (!latestFile) {
      return false;
    }

    try {
      await this.loadGame(engine, latestFile);
      return true;
    } catch (error) {
      return false;
    }
  }

  async listSaveFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.saveDir);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      return [];
    }
  }

  getSaveDirectory(): string {
    return this.saveDir;
  }
}