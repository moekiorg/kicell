import { describe, it, expect, beforeEach, vi } from "vitest";
import { Blueprint } from "@kycell/blueprint";
import { BlueprintConverter } from "./blueprint-converter.js";
import { EnhancedGameEngine } from "./enhanced-game-engine.js";
import { Container, Supporter } from "./index.js";
import { Room } from "./room.js";

describe("Blueprint Integration", () => {
  let blueprint: Blueprint;
  let converter: BlueprintConverter;

  beforeEach(() => {
    // Create a test blueprint
    blueprint = {
      meta: {
        title: "Test Game",
        author: "Test Author",
        version: "1.0.0",
        initial_player_location: "room1",
      },
      entities: {
        locations: [
          {
            id: "room1",
            name: "Test Room",
            description: "A simple test room",
            connections: [{ direction: "north", to: "room2" }],
            properties: {
              is_dark: false,
              is_outdoors: true,
            },
          },
          {
            id: "room2",
            name: "Second Room",
            description: "Another room",
            connections: [{ direction: "south", to: "room1" }],
          },
        ],
        objects: [
          {
            id: "chest1",
            name: "Wooden Chest",
            description: "A sturdy wooden chest",
            initial_location: "room1",
            properties: {
              container: true,
              openable: true,
              is_open: false,
              portable: false,
            },
          },
          {
            id: "table1",
            name: "Oak Table",
            description: "A solid oak table",
            initial_location: "room1",
            properties: {
              supporter: true,
              portable: false,
            },
          },
          {
            id: "key1",
            name: "Brass Key",
            description: "A small brass key",
            initial_location: "room1",
            properties: {
              portable: true,
            },
          },
          {
            id: "book1",
            name: "Old Book",
            description: "An old leather-bound book",
            initial_location: "room1",
            properties: {
              readable: true,
              portable: true,
            },
            text_content: "This book contains ancient wisdom.",
          },
        ],
        characters: [
          {
            id: "wizard1",
            name: "Old Wizard",
            description: "A wise old wizard",
            initial_location: "room2",
            conversational: {
              greeting: "Hello, traveler!",
              topics: {
                magic: "Magic is everywhere if you know how to look.",
                wisdom: "Wisdom comes with experience.",
              },
            },
          },
        ],
      },
      rules: {
        action_rules: [],
        event_rules: [],
      },
    };

    converter = new BlueprintConverter();
  });

  describe("BlueprintConverter", () => {
    it("should convert locations to rooms", () => {
      const spatialManager = converter.convertBlueprint(blueprint);

      const room1 = spatialManager.getRoom("room1");
      const room2 = spatialManager.getRoom("room2");

      expect(room1).toBeInstanceOf(Room);
      expect(room2).toBeInstanceOf(Room);

      expect(room1?.name).toBe("Test Room");
      expect(room1?.description).toBe("A simple test room");
      expect(room1?.isOutdoors).toBe(true);
      expect(room1?.isDark).toBe(false);

      expect(room1?.hasExit("north")).toBe(true);
      expect(room1?.getConnection("north")).toBe("room2");
      expect(room2?.hasExit("south")).toBe(true);
      expect(room2?.getConnection("south")).toBe("room1");
    });

    it("should convert objects with correct types", () => {
      const spatialManager = converter.convertBlueprint(blueprint);

      const chest = spatialManager.getThing("chest1");
      const table = spatialManager.getThing("table1");
      const key = spatialManager.getThing("key1");
      const book = spatialManager.getThing("book1");

      expect(chest).toBeInstanceOf(Container);
      expect(table).toBeInstanceOf(Supporter);
      expect(key).toBeDefined();
      expect(book).toBeDefined();

      // Check container properties
      expect((chest as Container).isOpenable).toBe(true);
      expect((chest as Container).isOpen).toBe(false);
      expect(chest?.isPortable).toBe(false);

      // Check supporter properties
      expect(table?.isPortable).toBe(false);

      // Check portable object
      expect(key?.isPortable).toBe(true);

      // Check readable object
      expect((book as any).textContent).toBe(
        "This book contains ancient wisdom."
      );
    });

    it("should place objects in correct initial locations", () => {
      const spatialManager = converter.convertBlueprint(blueprint);

      const room1 = spatialManager.getRoom("room1");
      const room1Contents = room1?.getContents();

      expect(room1Contents?.size).toBe(4); // chest, table, key, book

      const contentsArray = Array.from(room1Contents || []);
      const contentIds = contentsArray.map((thing) => thing.id);

      expect(contentIds).toContain("chest1");
      expect(contentIds).toContain("table1");
      expect(contentIds).toContain("key1");
      expect(contentIds).toContain("book1");
    });

    it("should convert characters", () => {
      const spatialManager = converter.convertBlueprint(blueprint);

      const wizard = spatialManager.getThing("wizard1");
      expect(wizard).toBeDefined();
      expect(wizard?.name).toBe("Old Wizard");
      expect(wizard?.isPortable).toBe(false);
      expect(wizard?.isFixedInPlace).toBe(true);

      const room2 = spatialManager.getRoom("room2");
      const room2Contents = room2?.getContents();
      expect(room2Contents?.has(wizard!)).toBe(true);
    });
  });

  describe("EnhancedGameEngine", () => {
    it("should initialize with object system", () => {
      const mockUIHandler = vi.fn();
      const mockNLP = {};

      const engine = new EnhancedGameEngine(blueprint, {
        uiEventHandler: mockUIHandler,
        naturalLanguageProcessor: mockNLP,
      });

      expect(engine.getCurrentLocation()).toBe("room1");

      const spatialManager = engine.getSpatialManager();
      expect(spatialManager).toBeDefined();

      const room1 = spatialManager.getRoom("room1");
      expect(room1).toBeInstanceOf(Room);
    });

    it("should emit enhanced location display", () => {
      const mockUIHandler = vi.fn();
      const mockNLP = {};

      const engine = new EnhancedGameEngine(blueprint, {
        uiEventHandler: mockUIHandler,
        naturalLanguageProcessor: mockNLP,
      });

      engine.emitEnhancedLocationDisplay();

      // Check that location_display event was emitted
      const locationDisplayCalls = mockUIHandler.mock.calls.filter(
        (call) => call[0].type === "location_display"
      );

      expect(locationDisplayCalls.length).toBeGreaterThan(0);

      const locationData = locationDisplayCalls[0][0].data;
      expect(locationData.name).toBe("Test Room");
      expect(locationData.description).toBe("A simple test room");
      expect(locationData.objects.length).toBe(4); // chest, table, key, book
      expect(locationData.characters.length).toBe(0); // wizard is in room2
      expect(locationData.exits).toContain("north");
    });

    it("should handle player movement", () => {
      const mockUIHandler = vi.fn();
      const mockNLP = {};

      const engine = new EnhancedGameEngine(blueprint, {
        uiEventHandler: mockUIHandler,
        naturalLanguageProcessor: mockNLP,
      });

      // Move to room2
      const moveResult = engine.movePlayerTo("room2");
      expect(moveResult).toBe(true);
      expect(engine.getCurrentLocation()).toBe("room2");

      // Try to move to non-existent room
      const invalidMoveResult = engine.movePlayerTo("nonexistent");
      expect(invalidMoveResult).toBe(false);
      expect(engine.getCurrentLocation()).toBe("room2"); // Should stay in room2
    });
  });
});
