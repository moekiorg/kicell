import { Thing } from "./thing.js";
import { EntityId } from "@kicell/blueprint";

/**
 * Container class - things that can contain other things inside them
 * Examples: box, chest, bag, drawer
 */
export class Container extends Thing {
  public isOpenable: boolean = true;
  public isOpen: boolean = false;
  public isLocked: boolean = false;
  public unlocksWithKey: EntityId | null = null;
  public capacity: number = Infinity; // Maximum number of items

  constructor(id: EntityId, name: string, description: string) {
    super(id, name, description);
  }

  // Containers can contain things if they're open and have capacity
  canContain(thing: Thing): boolean {
    if (this.isOpenable && !this.isOpen) {
      return false; // Can't put things in closed containers
    }
    return this.children.size < this.capacity;
  }

  canSupport(thing: Thing): boolean {
    return false; // Containers don't support things on top (use Supporter for that)
  }

  canBeEnteredBy(thing: Thing): boolean {
    return false; // Normal containers can't be entered (use Enterable for that)
  }

  // Container-specific methods
  open(): boolean {
    if (!this.isOpenable) return false;
    if (this.isLocked) return false;
    if (this.isOpen) return false;

    this.isOpen = true;
    return true;
  }

  close(): boolean {
    if (!this.isOpenable) return false;
    if (!this.isOpen) return false;

    this.isOpen = false;
    return true;
  }

  lock(key?: EntityId): boolean {
    if (!this.isOpenable) return false;
    if (this.isLocked) return false;
    if (this.unlocksWithKey && key !== this.unlocksWithKey) return false;

    this.isLocked = true;
    this.isOpen = false; // Locking also closes the container
    return true;
  }

  unlock(key?: EntityId): boolean {
    if (!this.isLocked) return false;
    if (this.unlocksWithKey && key !== this.unlocksWithKey) return false;

    this.isLocked = false;
    return true;
  }

  // Add item to container
  addItem(item: Thing): boolean {
    if (!this.canContain(item)) return false;

    // Remove from current parent
    if (item.parent) {
      if (item.parent instanceof Container) {
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

  // Remove item from container
  removeItem(item: Thing): boolean {
    if (!this.contains(item)) return false;

    this.removeChild(item);
    return true;
  }

  // Get visible contents (only if container is open or transparent)
  getVisibleContents(): Set<Thing> {
    if (this.isOpen || !this.isOpenable) {
      return this.children;
    }
    return new Set(); // Can't see inside closed containers
  }

  // Check if container is empty
  isEmpty(): boolean {
    return this.children.size === 0;
  }

  // Check if container is full
  isFull(): boolean {
    return this.children.size >= this.capacity;
  }

  // Set container properties
  setOpenable(openable: boolean): void {
    this.isOpenable = openable;
    if (!openable) {
      this.isOpen = true; // Non-openable containers are always "open"
      this.isLocked = false;
    }
  }

  setCapacity(capacity: number): void {
    this.capacity = Math.max(0, capacity);
  }

  setUnlocksWithKey(keyId: EntityId | null): void {
    this.unlocksWithKey = keyId;
  }
}
