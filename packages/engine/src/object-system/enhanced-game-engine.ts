import { Blueprint, EntityId } from "@kicell/blueprint";
import { GameState } from "../game-state.js";
import { CommandProcessor } from "../command-processor.js";
import { CommandResult } from "../commands/index.js";
import { GameContext } from "../ai/index.js";
import { GameUIEvent, UIEventHandler } from "../ui-events.js";
import { GameEngineOptions } from "../game-engine.js";
import { SpatialManager } from "./spatial-manager.js";
import { BlueprintConverter } from "./blueprint-converter.js";
import { Room } from "./room.js";

/**
 * Enhanced Game Engine with Object System integration
 */
export class EnhancedGameEngine {
  private blueprint: Blueprint;
  private gameState: GameState;
  private commandProcessor: CommandProcessor;
  private uiEventHandler: UIEventHandler;
  private spatialManager: SpatialManager;
  private blueprintConverter: BlueprintConverter;

  constructor(blueprint: Blueprint, options: GameEngineOptions) {
    this.blueprint = blueprint;
    this.gameState = new GameState(blueprint);
    this.uiEventHandler = options.uiEventHandler;

    // Initialize object system
    this.blueprintConverter = new BlueprintConverter();
    this.spatialManager = this.blueprintConverter.convertBlueprint(blueprint);

    this.commandProcessor = new CommandProcessor(
      blueprint,
      this.gameState,
      this.uiEventHandler,
      options.naturalLanguageProcessor,
      options.conversationHandler
    );
  }

  // Start the game and show initial location
  async start(): Promise<void> {
    // Emit game start event
    this.uiEventHandler({
      type: "game_start",
      timestamp: Date.now(),
      data: {
        title: this.blueprint.meta.title,
        author: this.blueprint.meta.author,
      },
    });

    // Show initial location using enhanced display
    await this.processCommand("look");
  }

  // Process a player command
  async processCommand(input: string): Promise<CommandResult> {
    const result = await this.commandProcessor.processCommand(input);
    return result;
  }

  // Enhanced location display using object system
  emitEnhancedLocationDisplay(): void {
    const currentLocationId = this.gameState.getCurrentLocation();
    const room = this.spatialManager.getRoom(currentLocationId);

    if (!room) {
      this.uiEventHandler({
        type: "message_display",
        timestamp: Date.now(),
        data: { message: "現在の場所が見つかりません。" },
      });
      return;
    }

    const directContents = room.getContents();
    const objects: Array<{ id: string; name: string }> = [];
    const characters: Array<{ id: string; name: string }> = [];

    for (const thing of directContents) {
      // Check if it's a character
      const isCharacter = this.blueprint.entities.characters.some(
        (char) => char.id === thing.id
      );

      if (isCharacter) {
        characters.push({ id: thing.id, name: thing.name });
      } else {
        objects.push({ id: thing.id, name: thing.name });
      }
    }

    const exits = Array.from(room.connections.keys());

    this.uiEventHandler({
      type: "location_display",
      timestamp: Date.now(),
      data: {
        name: room.name,
        description: room.description,
        objects,
        characters,
        exits,
      },
    });
  }

  // Game state queries
  getCurrentLocation(): EntityId {
    return this.gameState.getCurrentLocation();
  }

  getTurnCount(): number {
    return this.gameState.getTurnCount();
  }

  isGameOver(): boolean {
    return this.gameState.isGameOver();
  }

  getRecentActions(): string[] {
    return this.gameState.getRecentActions();
  }

  // Force end the game (for testing)
  endGame(): void {
    this.gameState.setGameOver(true);
  }

  // Get game context for AI systems
  getGameContext(): GameContext {
    return this.gameState.getGameContext();
  }

  // Get entity state (for external systems)
  getEntityState(entityId: EntityId, key: string): any {
    return this.gameState.getEntityState(entityId, key);
  }

  // Set entity state (for external systems)
  setEntityState(entityId: EntityId, key: string, value: any): void {
    this.gameState.setEntityState(entityId, key, value);
  }

  // Counter management (for external systems)
  getCounter(key: string): number {
    return this.gameState.getCounter(key);
  }

  setCounter(key: string, value: number): void {
    this.gameState.setCounter(key, value);
  }

  // Flag management (for external systems)
  getFlag(key: string): boolean {
    return this.gameState.getFlag(key);
  }

  setFlag(key: string, value: boolean): void {
    this.gameState.setFlag(key, value);
  }

  // Get the blueprint (read-only access)
  getBlueprint(): Readonly<Blueprint> {
    return this.blueprint;
  }

  // Get game state for save/load operations (CLI only)
  getGameState(): GameState {
    return this.gameState;
  }

  // Get spatial manager (for advanced object manipulation)
  getSpatialManager(): SpatialManager {
    return this.spatialManager;
  }

  // Get inventory system from command processor for save/load operations (CLI only)
  getInventorySystem(): any {
    return (this.commandProcessor as any).inventorySystem;
  }

  // Emit UI events
  private emitUIEvent(event: GameUIEvent): void {
    this.uiEventHandler(event);
  }

  // Public method to emit debug logs
  debug(message: string, level: "info" | "warn" | "error" = "info"): void {
    this.emitUIEvent({
      type: "debug_log",
      timestamp: Date.now(),
      data: { message, level },
    });
  }

  // Move player to a new location (enhanced version)
  movePlayerTo(locationId: EntityId): boolean {
    const targetRoom = this.spatialManager.getRoom(locationId);
    if (!targetRoom) {
      return false;
    }

    this.gameState.setCurrentLocation(locationId);
    this.emitEnhancedLocationDisplay();
    return true;
  }
}
