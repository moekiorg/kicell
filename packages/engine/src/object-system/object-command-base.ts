import { Blueprint, EntityId } from "@kicell/blueprint";
import { GameState } from "../game-state.js";
import { UIEventHandler } from "../ui-events.js";
import { SpatialManager } from "./spatial-manager.js";
import { Thing } from "./index.js";
import { Room } from "./room.js";

/**
 * Base class for commands that use the object system
 */
export abstract class ObjectCommandBase {
  protected blueprint: Blueprint;
  protected gameState: GameState;
  protected uiEventHandler: UIEventHandler;
  protected spatialManager: SpatialManager;

  constructor(
    blueprint: Blueprint,
    gameState: GameState,
    uiEventHandler: UIEventHandler,
    spatialManager: SpatialManager
  ) {
    this.blueprint = blueprint;
    this.gameState = gameState;
    this.uiEventHandler = uiEventHandler;
    this.spatialManager = spatialManager;
  }

  // Helper method to get current room
  protected getCurrentRoom(): Room | null {
    const currentLocationId = this.gameState.getCurrentLocation();
    return this.spatialManager.getRoom(currentLocationId) || null;
  }

  // Helper method to get player's current location
  protected getCurrentLocationId(): EntityId {
    return this.gameState.getCurrentLocation();
  }

  // Helper method to find things in current room
  protected getThingsInCurrentRoom(): Set<Thing> {
    const currentRoom = this.getCurrentRoom();
    return currentRoom ? currentRoom.getAllContents() : new Set();
  }

  // Helper method to find thing by name or ID in current room
  protected findThingInCurrentRoom(nameOrId: string): Thing | null {
    const things = this.getThingsInCurrentRoom();

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

  // Helper method to check if player can see a thing
  protected canPlayerSee(thingId: EntityId): boolean {
    // For now, assume player is always at current location
    // In a full implementation, player would be a Thing too
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

  // Helper method to emit location display
  protected emitLocationDisplay(): void {
    const currentRoom = this.getCurrentRoom();
    if (!currentRoom) return;

    const things = currentRoom.getContents();
    const visibleThings: Array<{ id: string; name: string }> = [];
    const characters: Array<{ id: string; name: string }> = [];

    for (const thing of things) {
      if (this.canPlayerSee(thing.id)) {
        // Check if it's a character based on blueprint
        const isCharacter = this.blueprint.entities.characters.some(
          (char) => char.id === thing.id
        );

        if (isCharacter) {
          characters.push({ id: thing.id, name: thing.name });
        } else {
          visibleThings.push({ id: thing.id, name: thing.name });
        }
      }
    }

    const exits = Array.from(currentRoom.connections.keys());

    this.uiEventHandler({
      type: "location_display",
      timestamp: Date.now(),
      data: {
        name: currentRoom.name,
        description: currentRoom.description,
        objects: visibleThings,
        characters: characters,
        exits,
      },
    });
  }

  // Helper method to emit entity description
  protected emitEntityDescription(
    thing: Thing,
    type: "object" | "character" = "object"
  ): void {
    this.uiEventHandler({
      type: "entity_description",
      timestamp: Date.now(),
      data: {
        id: thing.id,
        name: thing.name,
        description: thing.description,
        type,
      },
    });
  }
}
