import { CommandResult } from "../commands/base-command.js";
import { CommandMetadata } from "../command-registry.js";
import { ObjectCommandBase } from "./object-command-base.js";
import { Container, Supporter } from "./index.js";
import { SpatialRelation } from "./index.js";

/**
 * Enhanced Take command using the object system
 */
export class EnhancedTakeCommand extends ObjectCommandBase {
  execute(target?: string): CommandResult {
    if (!target) {
      return { success: false, message: "何を取りますか？" };
    }

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

    // Try to add to player inventory using existing inventory system
    // For now, we'll use the legacy approach but track in spatial manager too
    const currentRoom = this.getCurrentRoom();
    if (!currentRoom) {
      return { success: false, message: "現在の場所が不明です。" };
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

    // For now, we don't have a player object in spatial manager
    // So we'll just remove it from the spatial system
    // In a full implementation, the player would be a Thing too
    
    this.uiEventHandler({
      type: 'message_display',
      timestamp: Date.now(),
      data: { message: `${thing.name}を取りました。` }
    });

    // Add to recent actions
    this.gameState.addRecentAction(`${thing.name}を取った`);

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
      name: 'take',
      description: 'アイテムを取る',
      naturalLanguagePatterns: [
        '〇〇を取る',
        '〇〇を拾う',
        '〇〇を手に取る',
        '〇〇をつかむ'
      ],
      parameters: [
        {
          name: 'target',
          type: 'object',
          required: true,
          description: '取りたいオブジェクト'
        }
      ],
      examples: [
        '剣を取る',
        'キーを拾う',
        'りんごを手に取る'
      ]
    };
  }
}