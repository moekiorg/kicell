import { Thing } from "./thing.js";

/**
 * Basic Thing implementation for simple objects that don't have special properties
 */
export class BasicThing extends Thing {
  canContain(thing: Thing): boolean { return false; }
  canSupport(thing: Thing): boolean { return false; }
  canBeEnteredBy(thing: Thing): boolean { return false; }
}