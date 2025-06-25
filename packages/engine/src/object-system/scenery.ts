import { Thing } from "./thing.js";
import { EntityId } from "@kycell/blueprint";

/**
 * Scenery class - things that are fixed decorative elements in rooms
 * Examples: flowers, trees, furniture that can't be moved, architectural features
 */
export class Scenery extends Thing {
  constructor(id: EntityId, name: string, description: string) {
    super(id, name, description);
    this.isPortable = false;
    this.isFixedInPlace = true;
  }

  // Scenery can't contain, support, or be entered by default
  canContain(thing: Thing): boolean {
    return false;
  }

  canSupport(thing: Thing): boolean {
    return false;
  }

  canBeEnteredBy(thing: Thing): boolean {
    return false;
  }
}
