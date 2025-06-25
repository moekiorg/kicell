import { Blueprint, Effect, Condition } from "@kycell/blueprint";
import {
  GameContext,
  INarrator,
  IConversationHandler,
  ConversationContext,
} from "./ai/index.js";
import { GAME_CONSTANTS } from "./constants.js";
import { InventorySystem } from "./inventory-system.js";

interface GameState extends GameContext {
  isGameOver: boolean;
  recentActions: string[];
  conversationHistory: Map<
    string,
    Array<{
      speaker: "player" | "character";
      message: string;
      timestamp: number;
    }>
  >;
}

export class ActionHandler {
  constructor(
    private blueprint: Blueprint,
    private conversationHandler?: IConversationHandler,
    private output: (text: string) => void = console.log,
    private onLocationChange?: (locationId: string) => void,
    private inventorySystem?: InventorySystem
  ) {}

  async look(state: GameState) {
    const location = this.blueprint.entities.locations.find(
      (l) => l.id === state.currentLocation
    );
    if (!location) return;
    this.output(`\n${location.name}`);
    this.output(location.description);
  }

  showInventory(state: GameState) {
    const playerItems = this.inventorySystem
      ? this.inventorySystem.getInventoryItems("player")
      : Array.from(state.inventory);
    if (playerItems.length === 0) {
      this.output("\n🎒 インベントリは空です。");
    } else {
      this.output("\n🎒 持ち物:");
      playerItems.forEach((item: any) => {
        const obj = this.blueprint.entities.objects.find((o) => o.id === item);
        if (obj) {
          this.output(`  • ${obj.name}`);
        }
      });
    }
  }

  async takeObject(target: string, state: GameState): Promise<void> {
    const location = this.blueprint.entities.locations.find(
      (l) => l.id === state.currentLocation
    );

    if (!location) return;

    const obj = this.blueprint.entities.objects.find((o) => {
      const nameMatch =
        o.name.toLowerCase() === target.toLowerCase() || o.id === target;
      const isAtLocation = o.initial_location === location.id;
      const notInPlayerBag = this.inventorySystem
        ? !this.inventorySystem.getInventoryItems("player").includes(o.id)
        : !state.inventory.has(o.id);
      return nameMatch && isAtLocation && notInPlayerBag;
    });

    if (!obj) {
      return;
    }

    if (this.inventorySystem) {
      this.inventorySystem.addItemToInventory("player", obj.id);
    } else {
      state.inventory.add(obj.id);
    }
    obj.initial_location = "inventory";

    this.addToRecentActions(state, `took ${obj.name}`);
  }

  async dropObject(target: string, state: GameState): Promise<void> {
    const obj = this.blueprint.entities.objects.find((o) => {
      const nameMatch =
        o.name.toLowerCase() === target.toLowerCase() || o.id === target;
      const inPlayerBag = this.inventorySystem
        ? this.inventorySystem.getInventoryItems("player").includes(o.id)
        : state.inventory.has(o.id);
      return nameMatch && inPlayerBag;
    });

    if (!obj) {
      this.output(`You don't have ${target}.`);
      return;
    }

    // Remove from player bag and place at current location
    if (this.inventorySystem) {
      this.inventorySystem.removeItemFromInventory("player", obj.id);
    } else {
      state.inventory.delete(obj.id);
    }
    obj.initial_location = state.currentLocation;

    this.addToRecentActions(state, `dropped ${obj.name}`);
  }

  async giveItem(
    itemTarget: string,
    characterTarget: string,
    state: GameState
  ): Promise<void> {
    // Find the item in player's bag
    const item = this.blueprint.entities.objects.find((o) => {
      const nameMatch =
        o.name.toLowerCase() === itemTarget.toLowerCase() ||
        o.id === itemTarget;
      const inPlayerBag = this.inventorySystem
        ? this.inventorySystem.getInventoryItems("player").includes(o.id)
        : state.inventory.has(o.id);
      return nameMatch && inPlayerBag;
    });

    if (!item) {
      this.output(`${itemTarget}を持っていません。`);
      return;
    }

    // Find the character at current location
    const character = this.blueprint.entities.characters.find((c) => {
      const nameMatch =
        c.name.toLowerCase() === characterTarget.toLowerCase() ||
        c.id === characterTarget;
      const atLocation = c.initial_location === state.currentLocation;
      return nameMatch && atLocation;
    });

    if (!character) {
      this.output(`${characterTarget}はここにいません。`);
      return;
    }

    // Remove from player's bag
    if (this.inventorySystem) {
      this.inventorySystem.removeItemFromInventory("player", item.id);
    } else {
      state.inventory.delete(item.id);
    }

    // Add to character's bag if inventory system is available
    if (this.inventorySystem) {
      this.inventorySystem.addItemToInventory(character.id, item.id);
      this.output(`${item.name}を${character.name}に渡しました。`);
    }

    this.addToRecentActions(state, `gave ${item.name} to ${character.name}`);

    // Check if there are specific rules for giving this item to this character
    await this.processActionRule("give", item.id, state, character.id);
  }

  async move(direction: string, state: GameState): Promise<void> {
    const currentLocation = this.blueprint.entities.locations.find(
      (l) => l.id === state.currentLocation
    );

    if (!currentLocation) return;

    const connection = currentLocation.connections.find(
      (c) => c.direction.toLowerCase() === direction.toLowerCase()
    );

    if (!connection) {
      this.output(`You can't go ${direction} from here.`);
      return;
    }
    state.currentLocation = connection.to;
    if (this.onLocationChange) {
      this.onLocationChange(connection.to);
    }

    this.addToRecentActions(state, `moved ${direction}`);
    await this.look(state);
  }

  async processActionRule(
    action: string,
    target: string,
    state: GameState,
    topic?: string
  ): Promise<void> {
    const matchingRule = this.blueprint.rules.action_rules.find((rule: any) => {
      const actionMatch = rule.action === action;
      const targetMatch = !rule.target || rule.target === target;
      const topicMatch = !rule.topic || rule.topic === topic;
      return actionMatch && targetMatch && topicMatch;
    });

    if (matchingRule) {
      // Check conditions
      if (
        matchingRule.conditions &&
        !this.checkConditions(matchingRule.conditions, state)
      ) {
        this.output(`You can't ${action} right now.`);
        return;
      }

      // Execute effects
      if (matchingRule.effects) {
        this.executeEffects(matchingRule.effects, state);
      }

      this.addToRecentActions(
        state,
        `${action} ${target}${topic ? ` about ${topic}` : ""}`
      );
      return;
    }

    // If no specific rule found and it's a conversation, try fallback
    if (action === "ask" && this.conversationHandler) {
      await this.handleConversation(
        target,
        `${topic}について教えて`,
        topic,
        state
      );
      return;
    }

    this.output(`I don't understand "${action}".`);
  }

  async handleConversation(
    characterId: string,
    playerMessage: string,
    topic: string | undefined,
    state: GameState
  ): Promise<void> {
    const character = this.blueprint.entities.characters.find(
      (c) => c.id === characterId
    );

    if (!character) {
      this.output("そのキャラクターはここにいません。");
      return;
    }

    if (!character.conversational) {
      this.output(`${character.name}は会話をすることができません。`);
      return;
    }

    if (!this.conversationHandler) {
      this.output("会話機能が利用できません。");
      return;
    }

    // Get conversation history for this character
    if (!state.conversationHistory.has(characterId)) {
      state.conversationHistory.set(characterId, []);
    }
    const history = state.conversationHistory.get(characterId)!;

    // Add player message to history
    history.push({
      speaker: "player",
      message: playerMessage,
      timestamp: Date.now(),
    });

    // Generate character response
    try {
      const context: ConversationContext = {
        character: character.conversational,
        conversationHistory: history,
        gameContext: state,
        blueprint: this.blueprint,
      };

      const response = await this.conversationHandler.generateCharacterResponse(
        playerMessage,
        context
      );

      // Add character response to history
      history.push({
        speaker: "character",
        message: response.text,
        timestamp: Date.now(),
      });

      // Output the response
      this.output(`${character.name}: "${response.text}"`);

      // Keep history manageable
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      this.addToRecentActions(state, `talked to ${character.name}`);
    } catch (error) {
      this.output(`${character.name}は何も答えませんでした。`);
    }
  }

  private addToRecentActions(state: GameState, action: string): void {
    state.recentActions.push(action);
    if (state.recentActions.length > GAME_CONSTANTS.MAX_RECENT_ACTIONS) {
      state.recentActions.shift();
    }
  }

  private checkConditions(conditions: Condition[], state: GameState): boolean {
    return conditions.every((condition) => {
      switch (condition.type) {
        case "has_item":
          return this.inventorySystem
            ? this.inventorySystem
                .getInventoryItems("player")
                .includes(condition.value)
            : state.inventory.has(condition.value);
        case "location_is":
          return state.currentLocation === condition.value;
        case "state_equals":
          const entityState = state.entityStates.get(condition.target);
          return entityState?.get(condition.key) === condition.value;
        default:
          return true;
      }
    });
  }

  private executeEffects(effects: Effect[], state: GameState): void {
    effects.forEach((effect) => {
      switch (effect.type) {
        case "add_to_inventory":
          if (this.inventorySystem) {
            this.inventorySystem.addItemToInventory("player", effect.item);
          } else {
            state.inventory.add(effect.item);
          }
          break;
        case "remove_from_inventory":
          if (this.inventorySystem) {
            this.inventorySystem.removeItemFromInventory("player", effect.item);
          } else {
            state.inventory.delete(effect.item);
          }
          break;
        case "move_entity":
          state.currentLocation = effect.destination;
          break;
        case "display_text":
          this.output(effect.content);
          break;
        case "set_state":
          if (!state.entityStates.has(effect.target)) {
            state.entityStates.set(effect.target, new Map());
          }
          state.entityStates.get(effect.target)!.set(effect.key, effect.value);
          break;
        case "end_game":
          state.isGameOver = true;
          this.output(effect.message);
          break;
      }
    });
  }
}
