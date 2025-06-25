export class InventorySystem {
  private inventories: Map<string, Set<string>> = new Map();

  createInventory(characterId: string): void {
    this.inventories.set(characterId, new Set());
  }

  hasInventory(characterId: string): boolean {
    return this.inventories.has(characterId);
  }

  addItemToInventory(characterId: string, itemId: string): void {
    if (!this.inventories.has(characterId)) {
      this.createInventory(characterId);
    }
    this.inventories.get(characterId)!.add(itemId);
  }

  getInventoryItems(characterId: string): string[] {
    if (!this.inventories.has(characterId)) {
      return [];
    }
    return Array.from(this.inventories.get(characterId)!);
  }

  transferItem(fromCharacterId: string, toCharacterId: string, itemId: string): boolean {
    if (!this.inventories.has(fromCharacterId) || !this.inventories.has(toCharacterId)) {
      return false;
    }

    const fromInventory = this.inventories.get(fromCharacterId)!;
    if (!fromInventory.has(itemId)) {
      return false;
    }

    fromInventory.delete(itemId);
    this.inventories.get(toCharacterId)!.add(itemId);
    return true;
  }

  removeItemFromInventory(characterId: string, itemId: string): boolean {
    if (!this.inventories.has(characterId)) {
      return false;
    }

    const inventory = this.inventories.get(characterId)!;
    if (!inventory.has(itemId)) {
      return false;
    }

    inventory.delete(itemId);
    return true;
  }

  exchangeItems(character1Id: string, item1Id: string, character2Id: string, item2Id: string): boolean {
    if (!this.inventories.has(character1Id) || !this.inventories.has(character2Id)) {
      return false;
    }

    const inventory1 = this.inventories.get(character1Id)!;
    const inventory2 = this.inventories.get(character2Id)!;

    if (!inventory1.has(item1Id) || !inventory2.has(item2Id)) {
      return false;
    }

    inventory1.delete(item1Id);
    inventory2.delete(item2Id);
    inventory1.add(item2Id);
    inventory2.add(item1Id);

    return true;
  }

  // Internal data access for save/load
  getAllInventories(): Map<string, Set<string>> {
    return this.inventories;
  }

  // Load state from save data
  loadFromSaveData(saveData: any): void {
    this.inventories.clear();
    for (const [characterId, items] of Object.entries(saveData.inventories)) {
      this.inventories.set(characterId, new Set(items as string[]));
    }
  }
}