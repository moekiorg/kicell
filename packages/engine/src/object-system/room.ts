import { Thing } from "./thing.js";
import { EntityId } from "@kicell/blueprint";

/**
 * Room class - represents a location/place in the game world
 * In Inform 7, rooms are special kinds of things that can contain other things
 */
export class Room extends Thing {
  public connections: Map<string, EntityId> = new Map();
  public isDark: boolean = false;
  public isOutdoors: boolean = false;

  constructor(id: EntityId, name: string, description: string) {
    super(id, name, description);
    this.isPortable = false;
    this.isFixedInPlace = true;
  }

  // Rooms can contain things but not be contained in other things (except other rooms)
  canContain(thing: Thing): boolean {
    return true; // Rooms can contain any thing
  }

  canSupport(thing: Thing): boolean {
    return false; // Rooms don't support things on top of them
  }

  canBeEnteredBy(thing: Thing): boolean {
    return true; // Things can enter rooms
  }

  // Add connection to another room
  addConnection(direction: string, roomId: EntityId): void {
    this.connections.set(direction, roomId);
  }

  // Remove connection
  removeConnection(direction: string): void {
    this.connections.delete(direction);
  }

  // Get connection in a direction
  getConnection(direction: string): EntityId | undefined {
    return this.connections.get(direction);
  }

  // Get all available exits
  getExits(): string[] {
    return Array.from(this.connections.keys());
  }

  // Check if there's an exit in a direction
  hasExit(direction: string): boolean {
    return this.connections.has(direction);
  }

  // Room-specific properties
  setDark(isDark: boolean): void {
    this.isDark = isDark;
  }

  setOutdoors(isOutdoors: boolean): void {
    this.isOutdoors = isOutdoors;
  }

  // Get all things in this room (direct children only)
  getContents(): Set<Thing> {
    return this.children;
  }

  // Get all things in this room recursively (including things inside containers)
  getAllContents(): Set<Thing> {
    return this.getAllDescendants();
  }
}
