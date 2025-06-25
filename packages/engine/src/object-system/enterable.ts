import { Thing } from "./thing.js";
import { EntityId } from "@kicell/blueprint";

/**
 * Enterable class - things that can be entered by the player or other things
 * Examples: tent, car, booth, cave entrance
 */
export class Enterable extends Thing {
  public capacity: number = Infinity; // Maximum number of things inside

  constructor(id: EntityId, name: string, description: string) {
    super(id, name, description);
  }

  // Enterable things can contain other things inside them
  canContain(thing: Thing): boolean {
    return this.children.size < this.capacity;
  }

  canSupport(thing: Thing): boolean {
    return false; // Enterable things don't support things on top
  }

  canBeEnteredBy(thing: Thing): boolean {
    return this.children.size < this.capacity;
  }

  // Enter the enterable object
  enter(thing: Thing): boolean {
    if (!this.canBeEnteredBy(thing)) return false;

    // Remove from current parent
    if (thing.parent) {
      if (thing.parent instanceof Enterable) {
        thing.parent.exit(thing);
      } else if (
        "removeItem" in thing.parent &&
        typeof thing.parent.removeItem === "function"
      ) {
        (thing.parent as any).removeItem(thing);
      } else if (
        "exit" in thing.parent &&
        typeof thing.parent.exit === "function"
      ) {
        (thing.parent as any).exit(thing);
      } else {
        thing.parent.removeChild(thing);
      }
    }

    this.addChild(thing);
    return true;
  }

  // Exit the enterable object
  exit(thing: Thing): boolean {
    if (!this.contains(thing)) return false;

    this.removeChild(thing);

    // Move the thing to the same location as this enterable
    if (this.parent) {
      this.parent.addChild(thing);
    } else {
      // Move to the same room as this enterable
      thing.location = this.location;
    }

    return true;
  }

  // Get all things inside
  getContents(): Set<Thing> {
    return this.children;
  }

  // Check if enterable is empty
  isEmpty(): boolean {
    return this.children.size === 0;
  }

  // Check if enterable is full
  isFull(): boolean {
    return this.children.size >= this.capacity;
  }

  // Set enterable capacity
  setCapacity(capacity: number): void {
    this.capacity = Math.max(0, capacity);
  }
}
