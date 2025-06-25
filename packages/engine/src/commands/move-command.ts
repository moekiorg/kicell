import { BaseCommand, CommandResult } from "./base-command.js";
import { CommandMetadata, ICommandWithMetadata } from "../command-registry.js";

export class MoveCommand extends BaseCommand implements ICommandWithMetadata {
  execute(direction?: string): CommandResult {
    if (!direction) {
      return { success: false, message: "移動先の方向を指定してください。" };
    }

    if (this.spatialManager) {
      return this.executeEnhanced(direction);
    } else {
      return this.executeLegacy(direction);
    }
  }

  private executeEnhanced(direction: string): CommandResult {
    const currentRoom = this.getCurrentRoom();
    
    if (!currentRoom) {
      return { success: false, message: "現在の場所が見つかりません。" };
    }
    
    if (!currentRoom.hasExit(direction)) {
      return { success: false, message: "その方向には行けません。" };
    }
    
    const targetLocationId = currentRoom.getConnection(direction);
    const targetRoom = this.spatialManager!.getRoom(targetLocationId!);
    
    if (!targetRoom) {
      return { success: false, message: "移動先が見つかりません。" };
    }
    
    this.gameState.setCurrentLocation(targetLocationId!);
    this.emitLocationDisplay();
    
    return { success: true };
  }

  private executeLegacy(direction: string): CommandResult {
    const currentLocationId = this.gameState.getCurrentLocation();
    const currentLocation = this.blueprint.entities.locations.find(loc => loc.id === currentLocationId);
    
    if (!currentLocation) {
      return { success: false, message: "現在の場所が見つかりません。" };
    }
    
    const connection = currentLocation.connections.find(conn => conn.direction === direction);
    
    if (!connection) {
      return { success: false, message: "その方向には行けません。" };
    }
    
    const targetLocation = this.blueprint.entities.locations.find(loc => loc.id === connection.to);
    
    if (!targetLocation) {
      return { success: false, message: "移動先が見つかりません。" };
    }
    
    this.gameState.setCurrentLocation(connection.to);
    this.emitLocationDisplay();
    
    return { success: true };
  }

  getMetadata(): CommandMetadata {
    return {
      name: "move",
      description: "指定した方向に移動する",
      naturalLanguagePatterns: [
        "行く", "移動", "歩く", "進む", "向かう",
        "north", "south", "east", "west", "up", "down", "in", "out",
        "北", "南", "東", "西", "上", "下", "中", "外",
        "〜に行く", "〜へ移動", "〜へ向かう"
      ],
      parameters: [
        {
          name: "direction",
          type: "direction",
          required: true,
          description: "移動したい方向"
        }
      ],
      examples: [
        "北に行く",
        "東へ移動",
        "上に向かう",
        "go north",
        "move east"
      ]
    };
  }
}