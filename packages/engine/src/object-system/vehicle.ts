import { Thing } from "./thing.js";
import { EntityId } from "@kicell/blueprint";

/**
 * Vehicle class - things that can be used for transportation
 * Examples: bicycle, car, boat, horse
 */
export class Vehicle extends Thing {
  public capacity: number = 1; // How many things can ride the vehicle
  public isOperational: boolean = true;
  public requiredKey: EntityId | null = null;

  constructor(id: EntityId, name: string, description: string) {
    super(id, name, description);
  }

  // Vehicles can contain passengers
  canContain(thing: Thing): boolean {
    return this.children.size < this.capacity && this.isOperational;
  }

  canSupport(thing: Thing): boolean {
    return false; // Vehicles don't support things on top
  }

  canBeEnteredBy(thing: Thing): boolean {
    return this.children.size < this.capacity && this.isOperational;
  }

  // Board the vehicle
  board(thing: Thing): boolean {
    if (!this.canBeEnteredBy(thing)) return false;

    // Remove from current parent
    if (thing.parent) {
      thing.parent.removeChild(thing);
    }

    this.addChild(thing);
    return true;
  }

  // Disembark from the vehicle
  disembark(thing: Thing): boolean {
    if (!this.contains(thing)) return false;

    this.removeChild(thing);

    // Move the thing to the same location as this vehicle
    if (this.parent) {
      this.parent.addChild(thing);
    } else {
      // Move to the same room as this vehicle
      thing.location = this.location;
    }

    return true;
  }

  // Start/operate the vehicle (requires key if specified)
  start(key?: EntityId): boolean {
    if (!this.isOperational) return false;
    if (this.requiredKey && key !== this.requiredKey) return false;

    return true;
  }

  // Get all passengers
  getPassengers(): Set<Thing> {
    return this.children;
  }

  // Check if vehicle is empty
  isEmpty(): boolean {
    return this.children.size === 0;
  }

  // Check if vehicle is full
  isFull(): boolean {
    return this.children.size >= this.capacity;
  }

  // Set vehicle properties
  setCapacity(capacity: number): void {
    this.capacity = Math.max(1, capacity);
  }

  setOperational(operational: boolean): void {
    this.isOperational = operational;
  }

  setRequiredKey(keyId: EntityId | null): void {
    this.requiredKey = keyId;
  }
}
