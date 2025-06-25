import { Blueprint, EntityId } from "@kycell/blueprint";
import { GameState } from "../game-state.js";
import { UIEventHandler } from "../ui-events.js";
import { InventorySystem } from "../inventory-system.js";
import { CommandMetadata } from "../command-registry.js";
import { SpatialManager } from "../object-system/spatial-manager.js";
import { Thing } from "../object-system/thing.js";
import { Room } from "../object-system/room.js";

export interface CommandResult {
  success: boolean;
  message?: string;
}

export abstract class BaseCommand {
  protected blueprint: Blueprint;
  protected gameState: GameState;
  protected uiEventHandler: UIEventHandler;
  protected inventorySystem: InventorySystem;
  protected spatialManager?: SpatialManager; // Injected by CommandProcessor

  constructor(
    blueprint: Blueprint,
    gameState: GameState,
    uiEventHandler: UIEventHandler,
    inventorySystem: InventorySystem
  ) {
    this.blueprint = blueprint;
    this.gameState = gameState;
    this.uiEventHandler = uiEventHandler;
    this.inventorySystem = inventorySystem;
  }

  abstract execute(
    target?: string,
    secondary?: string
  ): Promise<CommandResult> | CommandResult;

  // コマンドのメタデータを提供（サブクラスでオーバーライド）
  getMetadata(): CommandMetadata {
    return {
      name: "unknown",
      description: "不明なコマンド",
      naturalLanguagePatterns: [],
      parameters: [],
      examples: [],
    };
  }

  protected emitMessage(
    message: string,
    category: "info" | "error" | "success" | "warning" = "info"
  ): void {
    this.uiEventHandler({
      type: "message_display",
      timestamp: Date.now(),
      data: { message, category },
    });
  }

  protected emitLocationDisplay(): void {
    if (this.spatialManager) {
      // Use enhanced object system
      this.emitEnhancedLocationDisplay();
    } else {
      // Fallback to legacy implementation
      this.emitLegacyLocationDisplay();
    }
  }

  private emitEnhancedLocationDisplay(): void {
    const currentLocationId = this.gameState.getCurrentLocation();
    const room = this.spatialManager!.getRoom(currentLocationId);

    if (!room) {
      this.emitMessage("現在の場所が見つかりません。", "error");
      return;
    }

    const directContents = room.getContents();
    const objects: Array<{ id: string; name: string }> = [];
    const characters: Array<{ id: string; name: string }> = [];

    for (const thing of directContents) {
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

  private emitLegacyLocationDisplay(): void {
    const locationId = this.gameState.getCurrentLocation();
    const location = this.blueprint.entities.locations.find(
      (loc) => loc.id === locationId
    );

    if (!location) return;

    const objectsHere = this.blueprint.entities.objects
      .filter((obj) => obj.initial_location === locationId)
      .map((obj) => ({ id: obj.id, name: obj.name }));

    const charactersHere = this.blueprint.entities.characters
      .filter((char) => char.initial_location === locationId)
      .map((char) => ({ id: char.id, name: char.name }));

    const exits = location.connections.map((conn) => conn.direction);

    this.uiEventHandler({
      type: "location_display",
      timestamp: Date.now(),
      data: {
        name: location.name,
        description: location.description,
        objects: objectsHere,
        characters: charactersHere,
        exits,
      },
    });
  }

  // Helper methods for object system
  protected getCurrentRoom(): Room | null {
    if (!this.spatialManager) return null;
    const currentLocationId = this.gameState.getCurrentLocation();
    return this.spatialManager.getRoom(currentLocationId) || null;
  }

  protected findThingInCurrentRoom(nameOrId: string): Thing | null {
    const room = this.getCurrentRoom();
    if (!room) return null;

    const things = room.getAllContents();

    // First try exact ID match
    for (const thing of things) {
      if (thing.id === nameOrId) {
        return thing;
      }
    }

    // Then try name match (case insensitive)
    for (const thing of things) {
      if (thing.name.toLowerCase().includes(nameOrId.toLowerCase())) {
        return thing;
      }
    }

    return null;
  }

  protected canPlayerSee(thingId: EntityId): boolean {
    if (!this.spatialManager) return false;

    const currentRoom = this.getCurrentRoom();
    if (!currentRoom) return false;

    const thing = this.spatialManager.getThing(thingId);
    if (!thing) return false;

    const thingRoom = this.spatialManager.getRoomContaining(thingId);
    return (
      thingRoom === currentRoom &&
      this.spatialManager.canSee(currentRoom.id, thingId)
    );
  }
}
