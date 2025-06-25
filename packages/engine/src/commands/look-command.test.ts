import { describe, it, expect, beforeEach, vi } from "vitest";
import { LookCommand } from "./look-command.js";
import { GameState } from "../game-state.js";
import { Blueprint } from "@kycell/blueprint";
import { InventorySystem } from "../inventory-system.js";

describe("LookCommand", () => {
  let lookCommand: LookCommand;
  let gameState: GameState;
  let blueprint: Blueprint;
  let inventorySystem: InventorySystem;
  let mockUIEventHandler: any;

  beforeEach(() => {
    // Blueprint setup with detailed locations, objects, and characters
    blueprint = {
      meta: {
        title: "Test Game",
        author: "Test Author",
        version: "1.0.0",
        initial_player_location: "forest",
      },
      entities: {
        locations: [
          {
            id: "forest",
            name: "暗い森",
            description: "木々が鬱蒼と茂る暗い森です。",
            connections: [
              { direction: "north", to: "village" },
              { direction: "east", to: "cave" },
            ],
          },
          {
            id: "village",
            name: "村",
            description: "小さな村です。",
            connections: [{ direction: "south", to: "forest" }],
          },
        ],
        objects: [
          {
            id: "sword",
            name: "剣",
            description: "鋭い剣です。",
            initial_location: "forest",
            properties: {},
          },
          {
            id: "chest",
            name: "宝箱",
            description: "古い木製の宝箱です。",
            initial_location: "forest",
            properties: {},
          },
        ],
        characters: [
          {
            id: "wizard",
            name: "魔法使い",
            description: "年老いた魔法使いです。",
            initial_location: "forest",
          },
        ],
      },
      rules: {
        action_rules: [],
        event_rules: [],
      },
    } as Blueprint;

    gameState = new GameState(blueprint);
    gameState.setCurrentLocation("forest");

    inventorySystem = new InventorySystem();

    mockUIEventHandler = vi.fn();

    lookCommand = new LookCommand(
      blueprint,
      gameState,
      mockUIEventHandler,
      inventorySystem
    );
  });

  it("should display detailed location description when looking around", () => {
    const result = lookCommand.execute();

    expect(result.success).toBe(true);
    expect(mockUIEventHandler).toHaveBeenCalledWith({
      type: "location_display",
      timestamp: expect.any(Number),
      data: {
        name: "暗い森",
        description: "木々が鬱蒼と茂る暗い森です。",
        objects: [
          { id: "sword", name: "剣" },
          { id: "chest", name: "宝箱" },
        ],
        characters: [{ id: "wizard", name: "魔法使い" }],
        exits: ["north", "east"],
      },
    });
  });

  it("should display object description when looking at specific object", () => {
    const result = lookCommand.execute("sword");

    expect(result.success).toBe(true);
    expect(mockUIEventHandler).toHaveBeenCalledWith({
      type: "entity_description",
      timestamp: expect.any(Number),
      data: {
        id: "sword",
        name: "剣",
        description: "鋭い剣です。",
        type: "object",
      },
    });
  });

  it("should display character description when looking at specific character", () => {
    const result = lookCommand.execute("wizard");

    expect(result.success).toBe(true);
    expect(mockUIEventHandler).toHaveBeenCalledWith({
      type: "entity_description",
      timestamp: expect.any(Number),
      data: {
        id: "wizard",
        name: "魔法使い",
        description: "年老いた魔法使いです。",
        type: "character",
      },
    });
  });

  it("should return error when looking at non-existent target", () => {
    const result = lookCommand.execute("dragon");

    expect(result.success).toBe(false);
    expect(result.message).toBe("dragonが見つかりません。");
  });

  it("should return error when looking at object not in current location", () => {
    // Add an object to another location
    blueprint.entities.objects.push({
      id: "book",
      name: "本",
      description: "古い本です。",
      initial_location: "village",
      properties: {},
    });

    const result = lookCommand.execute("book");

    expect(result.success).toBe(false);
    expect(result.message).toBe("bookが見つかりません。");
  });
});
