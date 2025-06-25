import { BaseCommand, CommandResult } from "./base-command.js";
import { CommandMetadata } from "../command-registry.js";

export class CheckMyInventoryCommand extends BaseCommand {
  execute(): CommandResult {
    const playerItems = this.inventorySystem.getInventoryItems("player");
    
    const items = playerItems.map(itemId => {
      const item = this.blueprint.entities.objects.find(obj => obj.id === itemId);
      return { id: itemId, name: item ? item.name : itemId };
    });

    this.uiEventHandler({
      type: 'inventory_display',
      timestamp: Date.now(),
      data: { items }
    });
    
    return { success: true };
  }

  getMetadata(): CommandMetadata {
    return {
      name: "check_my_inventory",
      description: "自分の持ち物を確認する", 
      naturalLanguagePatterns: [
        "持ち物を確認",
        "check bag",
        "check my bag", 
        "check inventory",
        "バッグの中身",
        "インベントリ",
        "何を持っている",
        "my items",
        "what do I have",
        "inventory"
      ],
      parameters: [],
      examples: [
        "持ち物を確認",
        "check bag",
        "バッグの中身",
        "何を持っているか確認"
      ],
    };
  }
}