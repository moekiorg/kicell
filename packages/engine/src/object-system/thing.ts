import { EntityId } from "@kycell/blueprint";

/**
 * Base class for all game objects (Inform 7 Thing equivalent)
 */
export abstract class Thing {
  public readonly id: EntityId;
  public readonly name: string;
  public description: string;
  public isPortable: boolean = true;
  public isFixedInPlace: boolean = false;
  public isSystemMorph: boolean = false;

  private _location: EntityId | null = null;
  private _parent: Thing | null = null;
  private _children: Set<Thing> = new Set();

  constructor(id: EntityId, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  // Location management
  get location(): EntityId | null {
    return this._location;
  }

  set location(locationId: EntityId | null) {
    this._location = locationId;
  }

  // Parent-child relationships
  get parent(): Thing | null {
    return this._parent;
  }

  get children(): Set<Thing> {
    return new Set(this._children);
  }

  // Add child (used by Container/Supporter)
  public addChild(child: Thing): void {
    this._children.add(child);
    child._parent = this;
  }

  // Remove child
  public removeChild(child: Thing): void {
    this._children.delete(child);
    if (child._parent === this) {
      child._parent = null;
    }
  }

  // Check if this thing contains another thing
  contains(thing: Thing): boolean {
    return this._children.has(thing);
  }

  // Get all descendants recursively
  getAllDescendants(): Set<Thing> {
    const descendants = new Set<Thing>();
    for (const child of this._children) {
      descendants.add(child);
      for (const grandchild of child.getAllDescendants()) {
        descendants.add(grandchild);
      }
    }
    return descendants;
  }

  // Check if this thing is inside another thing (directly or indirectly)
  isInside(thing: Thing): boolean {
    let current: Thing | null = this._parent;
    while (current) {
      if (current === thing) return true;
      current = current._parent;
    }
    return false;
  }

  // Get the top-level location
  getTopLevelLocation(): EntityId | null {
    if (this._parent) {
      return this._parent.getTopLevelLocation();
    }
    return this._location;
  }

  // Abstract methods to be implemented by subclasses
  abstract canContain(thing: Thing): boolean;
  abstract canSupport(thing: Thing): boolean;
  abstract canBeEnteredBy(thing: Thing): boolean;
}
