import { BaseCommand, CommandResult } from "./base-command.js";
import { Container, Supporter } from "../object-system/index.js";
import { CommandMetadata, ICommandWithMetadata } from "../command-registry.js";

export class TakeCommand extends BaseCommand implements ICommandWithMetadata {
  execute(target?: string): CommandResult {
    if (!target) {
      return { success: false, message: "何を取りますか？" };
    }

    if (this.spatialManager) {
      return this.executeEnhanced(target);
    } else {
      return this.executeLegacy(target);
    }
  }

  private executeEnhanced(target: string): CommandResult {
    const thing = this.findThingInCurrentRoom(target);
    
    if (!thing) {
      return { success: false, message: `${target}が見つかりません。` };
    }

    if (!this.canPlayerSee(thing.id)) {
      return { success: false, message: `${target}は見えません。` };
    }

    // Check if thing can be taken
    if (!thing.isPortable || thing.isFixedInPlace) {
      return { success: false, message: `${thing.name}は取ることができません。` };
    }

    // Check if thing is a character
    const isCharacter = this.blueprint.entities.characters.some(char => char.id === thing.id);
    if (isCharacter) {
      return { success: false, message: `${thing.name}を取ることはできません。` };
    }

    // Check if thing is accessible (not in closed container)
    if (!this.isThingAccessible(thing)) {
      return { success: false, message: `${thing.name}には手が届きません。` };
    }

    // Remove from current location/container/supporter
    if (thing.parent) {
      if (thing.parent instanceof Container) {
        thing.parent.removeItem(thing);
      } else if (thing.parent instanceof Supporter) {
        thing.parent.removeItem(thing);
      } else {
        thing.parent.removeChild(thing);
      }
    }

    // Add to player inventory
    this.inventorySystem.addItemToInventory("player", target);
    this.emitMessage(`${thing.name}を取りました。`, 'success');

    // Add to recent actions
    this.gameState.addRecentAction(`${thing.name}を取った`);

    return { success: true };
  }

  private executeLegacy(target: string): CommandResult {
    // Check if there's a rule for taking this object
    const takeRule = this.blueprint.rules.action_rules.find(
      rule => rule.action === "take" && rule.target === target
    );
    
    if (takeRule) {
      // TODO: Execute action rule
      return { success: true };
    }
    
    // Default take behavior
    const object = this.blueprint.entities.objects.find(obj => obj.id === target);
    
    if (!object) {
      return { success: false, message: `${target}がここにありません。` };
    }
    
    if (object.initial_location !== this.gameState.getCurrentLocation()) {
      return { success: false, message: `${object.name}がここにありません。` };
    }
    
    if (object.properties?.portable !== true) {
      return { success: false, message: `${object.name}は持ち運べません。` };
    }
    
    this.inventorySystem.addItemToInventory("player", target);
    this.emitMessage(`${object.name}を取りました。`, 'success');
    
    return { success: true };
  }

  private isThingAccessible(thing: any): boolean {
    // Walk up the parent chain to check if any container is closed
    let current = thing.parent;
    while (current) {
      if (current instanceof Container && !current.isOpen) {
        return false; // Thing is in a closed container
      }
      current = current.parent;
    }
    return true;
  }

  getMetadata(): CommandMetadata {
    return {
      name: "take",
      description: "オブジェクトを取る",
      naturalLanguagePatterns: [
        "取る", "拾う", "手に取る", "つかむ", "持つ",
        "take", "get", "pick up", "grab", "obtain",
        "〜を取る", "〜を拾う", "〜を手に取る"
      ],
      parameters: [
        {
          name: "target",
          type: "object",
          required: true,
          description: "取りたいオブジェクト"
        }
      ],
      examples: [
        "コインを取る",
        "荷物を拾う", 
        "鍵を手に取る",
        "take key",
        "pick up bag"
      ]
    };
  }
}