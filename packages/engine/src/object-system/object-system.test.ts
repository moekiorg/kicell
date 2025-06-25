import { describe, it, expect, beforeEach } from 'vitest';
import { Thing, Room, Container, Supporter, Enterable, Vehicle, Backdrop, Scenery, SpatialRelation, createThing } from './index.js';
import { SpatialManager } from './spatial-manager.js';

describe('Object System', () => {
  let spatialManager: SpatialManager;
  let room: Room;
  let chest: Container;
  let table: Supporter;
  let tent: Enterable;
  let key: Thing;

  beforeEach(() => {
    spatialManager = new SpatialManager();
    
    // Create test objects
    room = new Room('room1', 'Test Room', 'A simple test room');
    chest = new Container('chest1', 'Wooden Chest', 'A sturdy wooden chest');
    table = new Supporter('table1', 'Oak Table', 'A solid oak table');
    tent = new Enterable('tent1', 'Small Tent', 'A camping tent');
    key = createThing('key1', 'Brass Key', 'A small brass key');

    // Register objects
    spatialManager.registerRoom(room);
    spatialManager.registerThing(chest);
    spatialManager.registerThing(table);
    spatialManager.registerThing(tent);
    spatialManager.registerThing(key);
  });

  describe('Thing Base Class', () => {
    it('should create a thing with basic properties', () => {
      expect(key.id).toBe('key1');
      expect(key.name).toBe('Brass Key');
      expect(key.description).toBe('A small brass key');
      expect(key.isPortable).toBe(true);
      expect(key.isFixedInPlace).toBe(false);
    });

    it('should track parent-child relationships', () => {
      expect(key.parent).toBeNull();
      expect(key.children.size).toBe(0);
    });
  });

  describe('Room', () => {
    it('should create a room with proper properties', () => {
      expect(room.isPortable).toBe(false);
      expect(room.isFixedInPlace).toBe(true);
      expect(room.canContain(key)).toBe(true);
      expect(room.canSupport(key)).toBe(false);
      expect(room.canBeEnteredBy(key)).toBe(true);
    });

    it('should manage connections', () => {
      room.addConnection('north', 'room2');
      expect(room.hasExit('north')).toBe(true);
      expect(room.getConnection('north')).toBe('room2');
      expect(room.getExits()).toContain('north');
    });
  });

  describe('Container', () => {
    it('should start closed and openable', () => {
      expect(chest.isOpenable).toBe(true);
      expect(chest.isOpen).toBe(false);
    });

    it('should open and close', () => {
      expect(chest.open()).toBe(true);
      expect(chest.isOpen).toBe(true);
      expect(chest.close()).toBe(true);
      expect(chest.isOpen).toBe(false);
    });

    it('should not allow items when closed', () => {
      expect(chest.canContain(key)).toBe(false);
      chest.open();
      expect(chest.canContain(key)).toBe(true);
    });

    it('should add and remove items', () => {
      chest.open();
      expect(chest.addItem(key)).toBe(true);
      expect(chest.contains(key)).toBe(true);
      expect(key.parent).toBe(chest);
      
      expect(chest.removeItem(key)).toBe(true);
      expect(chest.contains(key)).toBe(false);
      expect(key.parent).toBeNull();
    });
  });

  describe('Supporter', () => {
    it('should support items on top', () => {
      expect(table.canSupport(key)).toBe(true);
      expect(table.addItem(key)).toBe(true);
      expect(table.contains(key)).toBe(true);
      expect(key.parent).toBe(table);
    });

    it('should respect capacity', () => {
      table.setCapacity(1);
      const key2 = createThing('key2', 'Silver Key', 'A silver key');
      spatialManager.registerThing(key2);
      
      expect(table.addItem(key)).toBe(true);
      expect(table.addItem(key2)).toBe(false);
      expect(table.isFull()).toBe(true);
    });
  });

  describe('Enterable', () => {
    it('should allow things to enter and exit', () => {
      expect(tent.enter(key)).toBe(true);
      expect(tent.contains(key)).toBe(true);
      expect(key.parent).toBe(tent);
      
      expect(tent.exit(key)).toBe(true);
      expect(tent.contains(key)).toBe(false);
    });
  });

  describe('SpatialManager', () => {
    it('should move things between locations', () => {
      // Place key in room
      expect(spatialManager.moveTo(key.id, room.id)).toBe(true);
      expect(key.parent).toBe(room);
      expect(key.location).toBe(room.id);
      
      // Move key to chest
      chest.open();
      expect(spatialManager.moveTo(key.id, chest.id, SpatialRelation.IN)).toBe(true);
      expect(key.parent).toBe(chest);
    });

    it('should track spatial relationships', () => {
      chest.open();
      spatialManager.moveTo(key.id, chest.id, SpatialRelation.IN);
      
      const relation = spatialManager.getSpatialRelation(key.id, chest.id);
      expect(relation).toBe(SpatialRelation.IN);
    });

    it('should find room containing a thing', () => {
      spatialManager.moveTo(chest.id, room.id);
      chest.open();
      spatialManager.moveTo(key.id, chest.id, SpatialRelation.IN);
      
      const containingRoom = spatialManager.getRoomContaining(key.id);
      expect(containingRoom).toBe(room);
    });

    it('should check visibility', () => {
      const observer = createThing('observer', 'Observer', 'An observer');
      spatialManager.registerThing(observer);
      
      // Both in same room
      spatialManager.moveTo(observer.id, room.id);
      spatialManager.moveTo(key.id, room.id);
      expect(spatialManager.canSee(observer.id, key.id)).toBe(true);
      
      // Key in closed chest
      spatialManager.moveTo(chest.id, room.id);
      chest.open(); // Open chest to add key
      spatialManager.moveTo(key.id, chest.id, SpatialRelation.IN);
      chest.close(); // Then close chest
      expect(spatialManager.canSee(observer.id, key.id)).toBe(false);
      
      // Key in open chest
      chest.open();
      expect(spatialManager.canSee(observer.id, key.id)).toBe(true);
    });
  });

  describe('Factory Function', () => {
    it('should create appropriate object types', () => {
      const container = createThing('box', 'Box', 'A box', { container: true });
      expect(container).toBeInstanceOf(Container);
      
      const supporter = createThing('shelf', 'Shelf', 'A shelf', { supporter: true });
      expect(supporter).toBeInstanceOf(Supporter);
      
      const backdrop = createThing('sky', 'Sky', 'The sky', { backdrop: true });
      expect(backdrop).toBeInstanceOf(Backdrop);
    });
  });
});