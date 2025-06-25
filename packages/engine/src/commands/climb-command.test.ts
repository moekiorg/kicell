import { describe, it, expect, beforeEach, vi } from "vitest";
import { ClimbCommand } from "./climb-command.js";
import { GameState } from "../game-state.js";
import { Blueprint } from "@kicell/blueprint";
import { InventorySystem } from "../inventory-system.js";

describe("ClimbCommand", () => {
  let climbCommand: ClimbCommand;
  let gameState: GameState;
  let blueprint: Blueprint;
  let inventorySystem: InventorySystem;
  let mockUIEventHandler: any;

  beforeEach(() => {
    blueprint = {
      meta: {
        title: "Test Game",
        author: "Test Author",
        version: "1.0.0",
        initial_player_location: "room",
      },
      entities: {
        locations: [
          {
            id: "room",
            name: "テストルーム",
            description: "登れるものがある部屋です。",
            connections: [],
          },
          {
            id: "high_place",
            name: "高い場所",
            description: "柱の上の高い場所です。",
            connections: [],
          },
        ],
        objects: [
          {
            id: "ancient_pillar",
            name: "古い柱",
            description:
              "風化した古代の石柱。彫刻が施されており、登ることができそうだ。",
            initial_location: "room",
            properties: {
              climbable: true,
              climb_destination: "high_place",
              portable: false,
            },
          },
          {
            id: "normal_box",
            name: "普通の箱",
            description: "普通の木箱です。",
            initial_location: "room",
            properties: {
              portable: true,
            },
          },
        ],
        characters: [],
      },
      rules: {
        action_rules: [],
        event_rules: [],
      },
    } as Blueprint;

    gameState = new GameState(blueprint);
    gameState.setCurrentLocation("room");

    inventorySystem = new InventorySystem();

    mockUIEventHandler = vi.fn();

    climbCommand = new ClimbCommand(
      blueprint,
      gameState,
      mockUIEventHandler,
      inventorySystem
    );
  });

  it("should successfully climb a climbable object", () => {
    const result = climbCommand.execute("ancient_pillar");

    expect(result.success).toBe(true);
    expect(gameState.getCurrentLocation()).toBe("high_place");
    expect(mockUIEventHandler).toHaveBeenCalledWith({
      type: "message_display",
      timestamp: expect.any(Number),
      data: {
        message: "古い柱を登りました。",
        category: "success",
      },
    });
  });

  it("should return error when target is not specified", () => {
    const result = climbCommand.execute();

    expect(result.success).toBe(false);
    expect(result.message).toBe("何を登りますか？");
  });

  it("should return error when target is not found", () => {
    const result = climbCommand.execute("tree");

    expect(result.success).toBe(false);
    expect(result.message).toBe("treeが見つかりません。");
  });

  it("should return error when target is not climbable", () => {
    const result = climbCommand.execute("normal_box");

    expect(result.success).toBe(false);
    expect(result.message).toBe("普通の箱は登ることができません。");
  });

  it("should return error when climbable object has no destination", () => {
    // Add object without climb_destination
    blueprint.entities.objects.push({
      id: "broken_ladder",
      name: "壊れた梯子",
      description: "壊れた梯子です。",
      initial_location: "room",
      properties: {
        climbable: true,
        portable: false,
      },
    });

    const result = climbCommand.execute("broken_ladder");

    expect(result.success).toBe(false);
    expect(result.message).toBe("壊れた梯子は登れません。");
  });
});
