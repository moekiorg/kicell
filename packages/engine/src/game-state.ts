import { Blueprint, EntityId } from "@kycell/blueprint";

export interface ConversationEntry {
  speaker: "player" | "character";
  message: string;
  timestamp: number;
}

export class GameState {
  private currentLocation: EntityId;
  private turnCount: number = 0;
  private gameOver: boolean = false;
  private entityStates: Map<EntityId, Map<string, any>> = new Map();
  private counters: Map<string, number> = new Map();
  private flags: Map<string, boolean> = new Map();
  private recentActions: string[] = [];
  private conversationHistory: Map<EntityId, ConversationEntry[]> = new Map();

  constructor(blueprint: Blueprint) {
    this.currentLocation = blueprint.meta.initial_player_location;

    // Initialize entity states from blueprint
    for (const character of blueprint.entities.characters) {
      if (character.state) {
        this.entityStates.set(
          character.id,
          new Map(Object.entries(character.state))
        );
      }
    }
  }

  // Location management
  getCurrentLocation(): EntityId {
    return this.currentLocation;
  }

  setCurrentLocation(locationId: EntityId): void {
    this.currentLocation = locationId;
  }

  // Turn management
  getTurnCount(): number {
    return this.turnCount;
  }

  incrementTurn(): void {
    this.turnCount++;
  }

  // Game over management
  isGameOver(): boolean {
    return this.gameOver;
  }

  setGameOver(gameOver: boolean): void {
    this.gameOver = gameOver;
  }

  // Entity state management
  getEntityState(entityId: EntityId, key: string): any {
    const entityState = this.entityStates.get(entityId);
    return entityState?.get(key);
  }

  setEntityState(entityId: EntityId, key: string, value: any): void {
    if (!this.entityStates.has(entityId)) {
      this.entityStates.set(entityId, new Map());
    }
    this.entityStates.get(entityId)!.set(key, value);
  }

  // Counter management
  getCounter(key: string): number {
    return this.counters.get(key) ?? 0;
  }

  setCounter(key: string, value: number): void {
    this.counters.set(key, value);
  }

  addCounter(key: string, value: number): void {
    const current = this.getCounter(key);
    this.setCounter(key, current + value);
  }

  // Flag management
  getFlag(key: string): boolean {
    return this.flags.get(key) ?? false;
  }

  setFlag(key: string, value: boolean): void {
    this.flags.set(key, value);
  }

  // Recent actions tracking
  addRecentAction(action: string): void {
    this.recentActions.push(action);
    // Keep only the last 10 actions
    if (this.recentActions.length > 10) {
      this.recentActions = this.recentActions.slice(-10);
    }
  }

  getRecentActions(): string[] {
    return [...this.recentActions];
  }

  // Conversation history
  addConversationEntry(characterId: EntityId, entry: ConversationEntry): void {
    if (!this.conversationHistory.has(characterId)) {
      this.conversationHistory.set(characterId, []);
    }
    this.conversationHistory.get(characterId)!.push(entry);
  }

  getConversationHistory(characterId: EntityId): ConversationEntry[] {
    return this.conversationHistory.get(characterId) || [];
  }

  // Game context for AI (read-only view)
  getGameContext() {
    return {
      currentLocation: this.currentLocation,
      inventory: new Set<EntityId>(), // Legacy compatibility - will be replaced by InventorySystem
      entityStates: this.entityStates,
      turnCount: this.turnCount,
      recentActions: this.recentActions,
    };
  }

  // Internal data access for save/load
  getAllEntityStates(): Map<EntityId, Map<string, any>> {
    return this.entityStates;
  }

  getAllCounters(): Map<string, number> {
    return this.counters;
  }

  getAllFlags(): Map<string, boolean> {
    return this.flags;
  }

  getAllConversationHistory(): Map<EntityId, ConversationEntry[]> {
    return this.conversationHistory;
  }

  // Load state from save data
  loadFromSaveData(saveData: any): void {
    this.currentLocation = saveData.currentLocation;
    this.turnCount = saveData.turnCount;
    this.gameOver = saveData.gameOver;
    this.recentActions = [...saveData.recentActions];

    // Restore entity states
    this.entityStates.clear();
    for (const [entityId, states] of Object.entries(saveData.entityStates)) {
      this.entityStates.set(
        entityId,
        new Map(Object.entries(states as Record<string, any>))
      );
    }

    // Restore counters
    this.counters.clear();
    for (const [key, value] of Object.entries(saveData.counters)) {
      this.counters.set(key, value as number);
    }

    // Restore flags
    this.flags.clear();
    for (const [key, value] of Object.entries(saveData.flags)) {
      this.flags.set(key, value as boolean);
    }

    // Restore conversation history
    this.conversationHistory.clear();
    for (const [entityId, history] of Object.entries(
      saveData.conversationHistory
    )) {
      this.conversationHistory.set(entityId, history as ConversationEntry[]);
    }
  }
}
