import { BaseCommand, CommandResult } from "./base-command.js";
import { CommandMetadata } from "../command-registry.js";
import { Container, Supporter } from "../object-system/index.js";

export class LookCommand extends BaseCommand {
  execute(target?: string): CommandResult {
    if (!target) {
      // Look around current location
      this.emitLocationDisplay();
      return { success: true };
    } else {
      // Look at specific object/character
      return this.lookAtEntity(target);
    }
  }

  private lookAtEntity(target: string): CommandResult {
    if (this.spatialManager) {
      return this.lookAtEntityEnhanced(target);
    } else {
      return this.lookAtEntityLegacy(target);
    }
  }

  private lookAtEntityEnhanced(target: string): CommandResult {
    const thing = this.findThingInCurrentRoom(target);
    
    if (!thing) {
      return { success: false, message: `${target}が見つかりません。` };
    }

    if (!this.canPlayerSee(thing.id)) {
      return { success: false, message: `${target}は見えません。` };
    }

    // Check if it's a character
    const isCharacter = this.blueprint.entities.characters.some(char => char.id === thing.id);
    
    // Emit basic description
    this.uiEventHandler({
      type: 'entity_description',
      timestamp: Date.now(),
      data: {
        id: thing.id,
        name: thing.name,
        description: thing.description,
        type: isCharacter ? 'character' : 'object'
      }
    });

    // Add additional information based on object type
    const additionalInfo = this.getAdditionalInfo(thing);
    if (additionalInfo) {
      this.emitMessage(additionalInfo);
    }

    return { success: true };
  }

  private lookAtEntityLegacy(target: string): CommandResult {
    // Look at object
    const object = this.blueprint.entities.objects.find(obj => obj.id === target);
    if (object && object.initial_location === this.gameState.getCurrentLocation()) {
      this.uiEventHandler({
        type: 'entity_description',
        timestamp: Date.now(),
        data: {
          id: object.id,
          name: object.name,
          description: object.description,
          type: 'object'
        }
      });
      return { success: true };
    }
    
    // Look at character
    const character = this.blueprint.entities.characters.find(char => char.id === target);
    if (character && character.initial_location === this.gameState.getCurrentLocation()) {
      this.uiEventHandler({
        type: 'entity_description',
        timestamp: Date.now(),
        data: {
          id: character.id,
          name: character.name,
          description: character.description,
          type: 'character'
        }
      });
      return { success: true };
    }
    
    return { success: false, message: `${target}が見つかりません。` };
  }

  private getAdditionalInfo(thing: any): string | null {
    const info: string[] = [];

    // Container information
    if (thing instanceof Container) {
      if (thing.isOpenable) {
        info.push(`箱は${thing.isOpen ? '開いています' : '閉じています'}。`);
        
        if (thing.isOpen) {
          const contents = thing.getVisibleContents();
          if (contents.size === 0) {
            info.push('中は空です。');
          } else {
            const itemNames = Array.from(contents).map(item => item.name);
            info.push(`中には${itemNames.join('、')}があります。`);
          }
        }
      } else {
        const contents = thing.getVisibleContents();
        if (contents.size > 0) {
          const itemNames = Array.from(contents).map(item => item.name);
          info.push(`中には${itemNames.join('、')}があります。`);
        }
      }

      if (thing.isLocked) {
        info.push('鍵がかかっています。');
      }
    }

    // Supporter information
    if (thing instanceof Supporter) {
      const itemsOnTop = thing.getItemsOnTop();
      if (itemsOnTop.size > 0) {
        const itemNames = Array.from(itemsOnTop).map(item => item.name);
        info.push(`上には${itemNames.join('、')}があります。`);
      } else {
        info.push('上には何もありません。');
      }
    }

    // Readable content
    if ((thing as any).blueprintProperties?.readable && (thing as any).textContent) {
      info.push(`「${(thing as any).textContent}」と書かれています。`);
    }

    // Portability
    if (thing.isFixedInPlace) {
      info.push('これは固定されていて動かせません。');
    }

    return info.length > 0 ? info.join(' ') : null;
  }

  getMetadata(): CommandMetadata {
    return {
      name: 'look',
      description: '周りを見回す、または特定の物を調べる',
      naturalLanguagePatterns: [
        '周りを見る',
        '見回す',
        '〇〇を見る',
        '〇〇を調べる',
        '〇〇を確認する'
      ],
      parameters: [
        {
          name: 'target',
          type: 'object',
          required: false,
          description: '調べたいオブジェクトまたはキャラクター（省略時は周囲全体）'
        }
      ],
      examples: [
        '周りを見る',
        '剣を調べる',
        '老人を見る'
      ]
    };
  }
}