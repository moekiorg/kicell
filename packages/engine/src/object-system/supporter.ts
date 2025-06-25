import { Thing } from "./thing.js";
import { EntityId } from "@kicell/blueprint";

/**
 * Supporter class - things that support other things on top of them
 * Examples: table, shelf, desk, platform
 */
export class Supporter extends Thing {
  public capacity: number = Infinity; // Maximum number of items on top

  constructor(id: EntityId, name: string, description: string) {
    super(id, name, description);
  }

  // Supporters don't contain things inside them
  canContain(thing: Thing): boolean {
    return false;
  }

  // Supporters can support things on top of them
  canSupport(thing: Thing): boolean {
    return this.children.size < this.capacity;
  }

  canBeEnteredBy(thing: Thing): boolean {
    return false; // Normal supporters can't be entered (use Enterable for that)
  }

  // Add item on top of supporter
  addItem(item: Thing): boolean {
    if (!this.canSupport(item)) return false;

    // Remove from current parent
    if (item.parent) {
      if (item.parent instanceof Supporter) {
        item.parent.removeItem(item);
      } else if (
        "removeItem" in item.parent &&
        typeof item.parent.removeItem === "function"
      ) {
        (item.parent as any).removeItem(item);
      } else if (
        "exit" in item.parent &&
        typeof item.parent.exit === "function"
      ) {
        (item.parent as any).exit(item);
      } else {
        item.parent.removeChild(item);
      }
    }

    this.addChild(item);
    return true;
  }

  // Remove item from supporter
  removeItem(item: Thing): boolean {
    if (!this.contains(item)) return false;

    this.removeChild(item);
    return true;
  }

  // Get all items on the supporter
  getItemsOnTop(): Set<Thing> {
    return this.children;
  }

  // Check if supporter is empty
  isEmpty(): boolean {
    return this.children.size === 0;
  }

  // Check if supporter is full
  isFull(): boolean {
    return this.children.size >= this.capacity;
  }

  // Set supporter capacity
  setCapacity(capacity: number): void {
    this.capacity = Math.max(0, capacity);
  }
}
