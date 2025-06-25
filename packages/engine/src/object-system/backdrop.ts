import { Thing } from "./thing.js";
import { EntityId } from "@kycell/blueprint";

/**
 * Backdrop class - things that are present in multiple locations
 * Examples: sky, mountains, river, walls
 */
export class Backdrop extends Thing {
  public presentInRooms: Set<EntityId> = new Set();

  constructor(id: EntityId, name: string, description: string) {
    super(id, name, description);
    this.isPortable = false;
    this.isFixedInPlace = true;
  }

  // Backdrops can't contain, support, or be entered
  canContain(thing: Thing): boolean {
    return false;
  }

  canSupport(thing: Thing): boolean {
    return false;
  }

  canBeEnteredBy(thing: Thing): boolean {
    return false;
  }

  // Add room where this backdrop is present
  addToRoom(roomId: EntityId): void {
    this.presentInRooms.add(roomId);
  }

  // Remove from room
  removeFromRoom(roomId: EntityId): void {
    this.presentInRooms.delete(roomId);
  }

  // Check if backdrop is present in a room
  isPresentInRoom(roomId: EntityId): boolean {
    return this.presentInRooms.has(roomId);
  }

  // Get all rooms where this backdrop is present
  getRooms(): Set<EntityId> {
    return new Set(this.presentInRooms);
  }
}
