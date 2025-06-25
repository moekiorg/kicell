import { Blueprint, GameObject, Location, Character } from "@kicell/blueprint";
import { SpatialManager } from "./spatial-manager.js";
import {
  Thing,
  Container,
  Supporter,
  Enterable,
  Vehicle,
  Backdrop,
  Scenery,
  createThing,
} from "./index.js";
import { Room } from "./room.js";

/**
 * Converts Blueprint definitions to Object System instances
 */
export class BlueprintConverter {
  private spatialManager: SpatialManager;

  constructor() {
    this.spatialManager = new SpatialManager();
  }

  /**
   * Convert a Blueprint to populated SpatialManager
   */
  convertBlueprint(blueprint: Blueprint): SpatialManager {
    // Create rooms first
    for (const location of blueprint.entities.locations) {
      const room = this.createRoomFromLocation(location);
      this.spatialManager.registerRoom(room);
    }

    // Create objects
    for (const gameObject of blueprint.entities.objects) {
      const thing = this.createThingFromGameObject(gameObject);
      this.spatialManager.registerThing(thing);

      // Place in initial location
      if (gameObject.initial_location) {
        this.spatialManager.moveTo(thing.id, gameObject.initial_location);
      }
    }

    // Create characters (as special things)
    for (const character of blueprint.entities.characters) {
      const thing = this.createThingFromCharacter(character);
      this.spatialManager.registerThing(thing);

      // Place in initial location
      if (character.initial_location) {
        this.spatialManager.moveTo(thing.id, character.initial_location);
      }
    }

    return this.spatialManager;
  }

  /**
   * Create Room from Location blueprint
   */
  private createRoomFromLocation(location: Location): Room {
    const room = new Room(location.id, location.name, location.description);

    // Set up connections
    for (const connection of location.connections) {
      room.addConnection(connection.direction, connection.to);
    }

    // Set properties
    if (location.properties?.is_dark) {
      room.setDark(true);
    }
    if (location.properties?.is_outdoors) {
      room.setOutdoors(true);
    }

    return room;
  }

  /**
   * Create Thing from GameObject blueprint
   */
  private createThingFromGameObject(gameObject: GameObject): Thing {
    const properties = gameObject.properties || {};

    // Determine object type based on properties
    const objectType = this.determineObjectType(properties);

    const thing = createThing(
      gameObject.id,
      gameObject.name,
      gameObject.description,
      objectType
    );

    // Set additional properties
    this.applyProperties(thing, properties);

    // Set text content for readable objects
    if (properties.readable && gameObject.text_content) {
      (thing as any).textContent = gameObject.text_content;
    }

    return thing;
  }

  /**
   * Create Thing from Character blueprint (characters are special things)
   */
  private createThingFromCharacter(character: Character): Thing {
    const thing = createThing(
      character.id,
      character.name,
      character.description,
      { portable: false } // Characters are not portable
    );

    // Characters are fixed in place
    thing.isFixedInPlace = true;
    thing.isPortable = false;

    // Store conversational data
    if (character.conversational) {
      (thing as any).conversational = character.conversational;
    }

    // Store initial inventory
    if (character.initial_inventory) {
      (thing as any).initialInventory = character.initial_inventory;
    }

    return thing;
  }

  /**
   * Determine object type from properties
   */
  private determineObjectType(properties: any): any {
    // Priority order for determining type
    if (properties.container) {
      return { container: true };
    }
    if (properties.supporter) {
      return { supporter: true };
    }
    if (properties.climbable) {
      return { enterable: true }; // Climbable things can be entered
    }

    return {
      portable: properties.portable !== false, // Default to portable unless explicitly false
    };
  }

  /**
   * Apply additional properties to Thing
   */
  private applyProperties(thing: Thing, properties: any): void {
    // Set portability
    if (properties.portable !== undefined) {
      thing.isPortable = properties.portable;
      thing.isFixedInPlace = !properties.portable;
    }

    // Container-specific properties
    if (thing instanceof Container) {
      if (properties.openable !== undefined) {
        thing.setOpenable(properties.openable);
      }
      if (properties.is_open !== undefined) {
        thing.isOpen = properties.is_open;
      }
      if (properties.locked !== undefined) {
        thing.isLocked = properties.locked;
      }
      if (properties.unlocks_with) {
        thing.setUnlocksWithKey(properties.unlocks_with);
      }
    }

    // Vehicle-specific properties
    if (thing instanceof Vehicle) {
      // Vehicles default to 1 capacity but can be configured
      thing.setCapacity(1);
    }

    // Store additional properties for later use
    (thing as any).blueprintProperties = properties;
  }

  /**
   * Get the populated SpatialManager
   */
  getSpatialManager(): SpatialManager {
    return this.spatialManager;
  }
}
