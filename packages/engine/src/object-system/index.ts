// Base classes
export { Thing } from "./thing.js";
export { Room } from "./room.js";
export { BasicThing } from "./basic-thing.js";

// Specialized object types
export { Container } from "./container.js";
export { Supporter } from "./supporter.js";
export { Enterable } from "./enterable.js";
export { Vehicle } from "./vehicle.js";

// Decorative object types
export { Backdrop } from "./backdrop.js";
export { Scenery } from "./scenery.js";

// Blueprint integration
export { BlueprintConverter } from "./blueprint-converter.js";
export { SpatialManager } from "./spatial-manager.js";
export { EnhancedGameEngine } from "./enhanced-game-engine.js";

// Enhanced commands
export { ObjectCommandBase } from "./object-command-base.js";
export { EnhancedLookCommand } from "./enhanced-look-command.js";
export { EnhancedTakeCommand } from "./enhanced-take-command.js";

// Imports for factory function
import { Thing } from "./thing.js";
import { BasicThing } from "./basic-thing.js";
import { Container } from "./container.js";
import { Supporter } from "./supporter.js";
import { Enterable } from "./enterable.js";
import { Vehicle } from "./vehicle.js";
import { Backdrop } from "./backdrop.js";
import { Scenery } from "./scenery.js";

// Utility types for spatial relationships
export enum SpatialRelation {
  IN = "in",
  ON = "on", 
  UNDER = "under",
  BEHIND = "behind",
  INSIDE = "inside",
  OUTSIDE = "outside"
}

// Factory function to create appropriate Thing subclass based on properties
export function createThing(
  id: string,
  name: string, 
  description: string,
  properties?: {
    container?: boolean;
    supporter?: boolean;
    enterable?: boolean;
    vehicle?: boolean;
    backdrop?: boolean;
    scenery?: boolean;
    portable?: boolean;
  }
): Thing {
  if (properties?.backdrop) {
    return new Backdrop(id, name, description);
  }
  
  if (properties?.scenery) {
    return new Scenery(id, name, description);
  }
  
  if (properties?.vehicle) {
    return new Vehicle(id, name, description);
  }
  
  if (properties?.enterable) {
    return new Enterable(id, name, description);
  }
  
  if (properties?.container) {
    return new Container(id, name, description);
  }
  
  if (properties?.supporter) {
    return new Supporter(id, name, description);
  }
  
  // Default to basic Thing
  return new BasicThing(id, name, description);
}