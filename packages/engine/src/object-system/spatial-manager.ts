import { Thing, Supporter, Enterable, SpatialRelation } from "./index.js";
import { Room } from "./room.js";
import { Container } from "./container.js";
import { EntityId } from "@kycell/blueprint";

/**
 * Manages spatial relationships between objects in the game world
 */
export class SpatialManager {
  private rooms: Map<EntityId, Room> = new Map();
  private things: Map<EntityId, Thing> = new Map();

  // Register a room
  registerRoom(room: Room): void {
    this.rooms.set(room.id, room);
    this.things.set(room.id, room); // Rooms are also things
  }

  // Register a thing
  registerThing(thing: Thing): void {
    this.things.set(thing.id, thing);
  }

  // Get a room by ID
  getRoom(id: EntityId): Room | undefined {
    return this.rooms.get(id);
  }

  // Get a thing by ID
  getThing(id: EntityId): Thing | undefined {
    return this.things.get(id);
  }

  // Move a thing to a location (room or inside/on another thing)
  moveTo(
    thingId: EntityId,
    destinationId: EntityId,
    relation: SpatialRelation = SpatialRelation.IN
  ): boolean {
    const thing = this.getThing(thingId);
    const destination = this.getThing(destinationId);

    if (!thing || !destination) return false;

    // Remove from current location
    this.removeFromCurrentLocation(thing);

    // Add to new location based on spatial relation
    switch (relation) {
      case SpatialRelation.IN:
        return this.placeInside(thing, destination);

      case SpatialRelation.ON:
        return this.placeOnTop(thing, destination);

      case SpatialRelation.INSIDE:
        return this.placeInside(thing, destination);

      default:
        // For rooms or general placement
        if (destination instanceof Room) {
          destination.addChild(thing);
          thing.location = destination.id;
          return true;
        }
        return false;
    }
  }

  // Place thing inside another thing (container, enterable, room)
  private placeInside(thing: Thing, container: Thing): boolean {
    if (container instanceof Container) {
      return container.addItem(thing);
    } else if (container instanceof Enterable) {
      return container.enter(thing);
    } else if (container instanceof Room) {
      container.addChild(thing);
      thing.location = container.id;
      return true;
    } else if (container.canContain(thing)) {
      container.addChild(thing);
      return true;
    }
    return false;
  }

  // Place thing on top of another thing (supporter)
  private placeOnTop(thing: Thing, supporter: Thing): boolean {
    if (supporter instanceof Supporter) {
      return supporter.addItem(thing);
    } else if (supporter.canSupport(thing)) {
      supporter.addChild(thing);
      return true;
    }
    return false;
  }

  // Remove thing from its current location
  private removeFromCurrentLocation(thing: Thing): void {
    if (thing.parent) {
      if (thing.parent instanceof Container) {
        thing.parent.removeItem(thing);
      } else if (thing.parent instanceof Supporter) {
        thing.parent.removeItem(thing);
      } else if (thing.parent instanceof Enterable) {
        thing.parent.exit(thing);
      } else {
        thing.parent.removeChild(thing);
      }
    }
  }

  // Get the spatial relationship between two things
  getSpatialRelation(
    thingId: EntityId,
    otherId: EntityId
  ): SpatialRelation | null {
    const thing = this.getThing(thingId);
    const other = this.getThing(otherId);

    if (!thing || !other) return null;

    if (thing.parent === other) {
      if (
        other instanceof Container ||
        other instanceof Enterable ||
        other instanceof Room
      ) {
        return SpatialRelation.IN;
      } else if (other instanceof Supporter) {
        return SpatialRelation.ON;
      }
    }

    return null;
  }

  // Find all things in a room (directly and indirectly)
  getAllThingsInRoom(roomId: EntityId): Set<Thing> {
    const room = this.getRoom(roomId);
    if (!room) return new Set();

    return room.getAllContents();
  }

  // Find all things directly in a room
  getDirectThingsInRoom(roomId: EntityId): Set<Thing> {
    const room = this.getRoom(roomId);
    if (!room) return new Set();

    return room.getContents();
  }

  // Get the room that contains a thing (directly or indirectly)
  getRoomContaining(thingId: EntityId): Room | null {
    const thing = this.getThing(thingId);
    if (!thing) return null;

    // Walk up the parent chain to find a room
    let current: Thing | null = thing;
    while (current) {
      if (current instanceof Room) {
        return current;
      }
      current = current.parent;
    }

    // If no room found in parent chain, check the location property
    const topLocation = thing.getTopLevelLocation();
    if (topLocation) {
      return this.getRoom(topLocation) || null;
    }

    return null;
  }

  // Check if thing A can see thing B (same room, or in visible containers)
  canSee(observerId: EntityId, targetId: EntityId): boolean {
    const observer = this.getThing(observerId);
    const target = this.getThing(targetId);

    if (!observer || !target) return false;

    const observerRoom = this.getRoomContaining(observerId);
    const targetRoom = this.getRoomContaining(targetId);

    if (!observerRoom || !targetRoom || observerRoom !== targetRoom) {
      return false; // Not in the same room
    }

    // Check if target is in a visible container
    let current = target.parent;
    while (current && current !== observerRoom) {
      if (current instanceof Container && !current.isOpen) {
        return false; // Hidden in closed container
      }
      current = current.parent;
    }

    return true;
  }

  // Get a description of where a thing is located
  getLocationDescription(thingId: EntityId): string {
    const thing = this.getThing(thingId);
    if (!thing) return "unknown location";

    if (!thing.parent) {
      return thing.location ? `in ${thing.location}` : "nowhere";
    }

    const parent = thing.parent;
    const relation = this.getSpatialRelation(thingId, parent.id);

    switch (relation) {
      case SpatialRelation.IN:
        return `inside ${parent.name}`;
      case SpatialRelation.ON:
        return `on ${parent.name}`;
      default:
        return `with ${parent.name}`;
    }
  }

  // Export all spatial data for saving
  exportSpatialData(): any {
    const data: any = {
      rooms: {},
      things: {},
      relationships: [],
    };

    // Export rooms
    for (const [id, room] of this.rooms) {
      data.rooms[id] = {
        id: room.id,
        name: room.name,
        description: room.description,
        connections: Object.fromEntries(room.connections),
        isDark: room.isDark,
        isOutdoors: room.isOutdoors,
      };
    }

    // Export things and their relationships
    for (const [id, thing] of this.things) {
      if (thing instanceof Room) continue; // Already exported

      data.things[id] = {
        id: thing.id,
        name: thing.name,
        description: thing.description,
        type: thing.constructor.name,
        location: thing.location,
        parentId: thing.parent?.id || null,
      };
    }

    return data;
  }

  // Import spatial data from save
  importSpatialData(data: any): void {
    // This would need to be implemented based on the specific save format
    // and would reconstruct the spatial relationships
  }
}
