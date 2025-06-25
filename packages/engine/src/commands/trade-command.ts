import { BaseCommand, CommandResult } from "./base-command.js";
import { CommandMetadata } from "../command-registry.js";

export class TradeCommand extends BaseCommand {
  execute(target?: string, playerItem?: string, targetItem?: string): CommandResult {
    if (!target || !playerItem || !targetItem) {
      return { success: false, message: "trade [相手] [あなたのアイテム] [相手のアイテム] の形で入力してください。" };
    }

    const character = this.blueprint.entities.characters.find((char: any) => char.id === target);
    
    if (!character) {
      return { success: false, message: `${target}という人はここにいません。` };
    }
    
    if (character.initial_location !== this.gameState.getCurrentLocation()) {
      return { success: false, message: `${character.name}はここにいません。` };
    }

    // Check if player has the item they want to trade
    const playerItems = this.inventorySystem.getInventoryItems('player');
    if (!playerItems.includes(playerItem)) {
      const playerItemName = this.getItemName(playerItem);
      return { success: false, message: `あなたは${playerItemName}を持っていません。` };
    }

    // Check if the target character has the item the player wants
    const targetItems = this.inventorySystem.getInventoryItems(target);
    if (!targetItems.includes(targetItem)) {
      const targetItemName = this.getItemName(targetItem);
      return { success: false, message: `${character.name}は${targetItemName}を持っていません。` };
    }

    // Perform the exchange
    const exchangeResult = this.inventorySystem.exchangeItems('player', playerItem, target, targetItem);
    
    if (!exchangeResult) {
      return { success: false, message: "交換に失敗しました。" };
    }

    // Get item names for conversation
    const playerItemName = this.getItemName(playerItem);
    const targetItemName = this.getItemName(targetItem);

    const responseMessage = `${character.name}「${playerItemName}と${targetItemName}を交換いたしましょう。ありがとうございました！」`;

    this.uiEventHandler({
      type: 'conversation',
      timestamp: Date.now(),
      data: {
        characterId: character.id,
        characterName: character.name,
        message: responseMessage
      }
    });
    
    return { success: true };
  }

  private getItemName(itemId: string): string {
    const item = this.blueprint.entities.objects.find((obj: any) => obj.id === itemId);
    return item ? item.name : itemId;
  }

  getMetadata(): CommandMetadata {
    return {
      name: 'trade',
      description: 'キャラクターとアイテムを交換する',
      naturalLanguagePatterns: [
        '〇〇と△△を交換',
        '〇〇に△△をあげて××をもらう',
        '〇〇と△△をトレード',
        '△△で××と交換',
        '〇〇に△△を渡して××をもらう'
      ],
      parameters: [
        {
          name: 'target',
          type: 'character',
          required: true,
          description: '交換相手のキャラクター'
        },
        {
          name: 'playerItem',
          type: 'object',
          required: true,
          description: 'プレイヤーが渡すアイテム'
        },
        {
          name: 'targetItem',
          type: 'object',
          required: true,
          description: '相手から受け取るアイテム'
        }
      ],
      examples: [
        '商人と金貨を回復薬で交換',
        '老人にパンをあげてカギをもらう',
        '金貨で剣と交換'
      ]
    };
  }
}