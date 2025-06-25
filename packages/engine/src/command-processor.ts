import { Blueprint, EntityId, Effect, Condition } from "@kicell/blueprint";
import { GameState } from "./game-state.js";
import { InventorySystem } from "./inventory-system.js";
import { UIEventHandler } from "./ui-events.js";
import { INaturalLanguageProcessor, IConversationHandler } from "./ai/index.js";
import {
  CommandResult,
  MoveCommand,
  LookCommand,
  TakeCommand,
  ClimbCommand,
  CheckMyInventoryCommand,
  TalkCommand,
  CheckYourInventoryCommand,
  TradeCommand,
} from "./commands/index.js";
import { CommandRegistry } from "./command-registry.js";

export class CommandProcessor {
  private blueprint: Blueprint;
  private gameState: GameState;
  private uiEventHandler: UIEventHandler;
  private inventorySystem: InventorySystem;
  private nlp: INaturalLanguageProcessor;
  private conversationHandler?: IConversationHandler;
  private commandRegistry: CommandRegistry;
  public spatialManager?: any; // Injected by GameEngine

  // Command instances
  private moveCommand: MoveCommand;
  private lookCommand: LookCommand;
  private takeCommand: TakeCommand;
  private climbCommand: ClimbCommand;
  private checkMyInventoryCommand: CheckMyInventoryCommand;
  private talkCommand: TalkCommand;
  private checkYourInventoryCommand: CheckYourInventoryCommand;
  private tradeCommand: TradeCommand;

  constructor(
    blueprint: Blueprint,
    gameState: GameState,
    uiEventHandler: UIEventHandler,
    nlp: INaturalLanguageProcessor,
    conversationHandler?: IConversationHandler
  ) {
    this.blueprint = blueprint;
    this.gameState = gameState;
    this.uiEventHandler = uiEventHandler;
    this.nlp = nlp;
    this.conversationHandler = conversationHandler;
    this.inventorySystem = new InventorySystem();
    this.commandRegistry = new CommandRegistry();

    // Initialize inventory system
    this.inventorySystem.createInventory("player");
    for (const character of blueprint.entities.characters) {
      this.inventorySystem.createInventory(character.id);
    }

    // Add items to character inventories based on initial_location (legacy format)
    for (const obj of blueprint.entities.objects) {
      if (obj.initial_location && obj.initial_location.endsWith("_bag")) {
        const characterId = obj.initial_location.replace("_bag", "");
        this.inventorySystem.addItemToInventory(characterId, obj.id);
      }
    }

    // Add items to character inventories based on initial_inventory (new DSL format)
    for (const character of blueprint.entities.characters) {
      if (character.initial_inventory) {
        for (const itemId of character.initial_inventory) {
          this.inventorySystem.addItemToInventory(character.id, itemId);
        }
      }
    }

    // Initialize command instances
    this.moveCommand = new MoveCommand(
      blueprint,
      gameState,
      uiEventHandler,
      this.inventorySystem
    );
    this.lookCommand = new LookCommand(
      blueprint,
      gameState,
      uiEventHandler,
      this.inventorySystem
    );
    this.takeCommand = new TakeCommand(
      blueprint,
      gameState,
      uiEventHandler,
      this.inventorySystem
    );
    this.climbCommand = new ClimbCommand(
      blueprint,
      gameState,
      uiEventHandler,
      this.inventorySystem
    );
    this.checkMyInventoryCommand = new CheckMyInventoryCommand(
      blueprint,
      gameState,
      uiEventHandler,
      this.inventorySystem
    );
    this.talkCommand = new TalkCommand(
      blueprint,
      gameState,
      uiEventHandler,
      this.inventorySystem,
      conversationHandler
    );
    this.checkYourInventoryCommand = new CheckYourInventoryCommand(
      blueprint,
      gameState,
      uiEventHandler,
      this.inventorySystem,
      conversationHandler
    );
    this.tradeCommand = new TradeCommand(
      blueprint,
      gameState,
      uiEventHandler,
      this.inventorySystem
    );

    // Register commands with metadata
    this.commandRegistry.registerCommand(
      "look",
      this.lookCommand.getMetadata()
    );
    this.commandRegistry.registerCommand(
      "check_my_inventory",
      this.checkMyInventoryCommand.getMetadata()
    );
    this.commandRegistry.registerCommand(
      "check_your_inventory",
      this.checkYourInventoryCommand.getMetadata()
    );
    this.commandRegistry.registerCommand(
      "trade",
      this.tradeCommand.getMetadata()
    );
    this.commandRegistry.registerCommand(
      "climb",
      this.climbCommand.getMetadata()
    );
    this.commandRegistry.registerCommand(
      "take",
      this.takeCommand.getMetadata()
    );
    this.commandRegistry.registerCommand(
      "move",
      this.moveCommand.getMetadata()
    );
    this.commandRegistry.registerCommand(
      "talk",
      this.talkCommand.getMetadata()
    );
  }

  // Inject spatial manager into all commands (called by GameEngine)
  injectSpatialManager(spatialManager: any): void {
    this.spatialManager = spatialManager;

    // Inject into all command instances
    (this.moveCommand as any).spatialManager = spatialManager;
    (this.lookCommand as any).spatialManager = spatialManager;
    (this.takeCommand as any).spatialManager = spatialManager;
    (this.climbCommand as any).spatialManager = spatialManager;
    (this.checkMyInventoryCommand as any).spatialManager = spatialManager;
    (this.talkCommand as any).spatialManager = spatialManager;
    (this.checkYourInventoryCommand as any).spatialManager = spatialManager;
    (this.tradeCommand as any).spatialManager = spatialManager;
  }

  async processCommand(input: string): Promise<CommandResult> {
    const command = await this.parseCommand(input);

    if (!command) {
      return { success: false, message: "" };
    }

    const result = await this.executeCommand(command);

    if (result.success) {
      this.gameState.incrementTurn();
      this.gameState.addRecentAction(input);
    }

    return result;
  }

  private async parseCommand(input: string): Promise<{
    action: string;
    target?: string;
    secondary?: string;
    tertiary?: string;
  } | null> {
    try {
      const gameContext = this.gameState.getGameContext();
      const availableCommands = this.commandRegistry.generateNLPDescription();

      const parsedAction = await this.nlp.parseInput({
        text: input,
        gameContext,
        blueprint: this.blueprint,
        availableCommands,
      });

      if (parsedAction && parsedAction.action !== "unknown") {
        let target = parsedAction.target || parsedAction.characterTarget;

        if (parsedAction.action === "check-bag" && !target) {
          const charactersHere = this.blueprint.entities.characters.filter(
            (char) =>
              char.initial_location === this.gameState.getCurrentLocation() &&
              char.id !== "player"
          );
          if (charactersHere.length > 0) {
            target = charactersHere[0].id;
          }
        }

        return {
          action: parsedAction.action,
          target: target,
          secondary: parsedAction.topic || parsedAction.playerItem,
          tertiary: parsedAction.targetItem,
        };
      }
    } catch (error) {
      console.log("Error in parseCommand:", error);
      return null;
    }

    return null;
  }

  private async executeCommand(command: {
    action: string;
    target?: string;
    secondary?: string;
    tertiary?: string;
  }): Promise<CommandResult> {
    switch (command.action) {
      case "move":
        return this.moveCommand.execute(command.target);

      case "look":
        return this.lookCommand.execute(command.target);

      case "take":
        return this.takeCommand.execute(command.target);

      case "climb":
        return this.climbCommand.execute(command.target);

      case "inventory":
      case "check_my_inventory":
        return this.checkMyInventoryCommand.execute();

      case "talk":
        return await this.talkCommand.execute(
          command.target,
          command.secondary
        );

      case "check-bag":
      case "check_your_inventory":
        return await this.checkYourInventoryCommand.execute(command.target);

      case "trade":
        return this.tradeCommand.execute(
          command.target,
          command.secondary,
          command.tertiary
        );

      default:
        // Check for custom action rules
        return this.handleCustomAction(command);
    }
  }

  private handleCustomAction(command: {
    action: string;
    target?: string;
    secondary?: string;
  }): CommandResult {
    console.log("handleCustomAction called with:", command);
    const actionRule = this.blueprint.rules.action_rules.find(
      (rule) =>
        rule.action === command.action &&
        rule.target === command.target &&
        (!rule.secondary_target || rule.secondary_target === command.secondary)
    );

    if (actionRule) {
      return this.executeActionRule(actionRule);
    }

    return { success: false, message: "そのコマンドが理解できません。" };
  }

  private executeActionRule(rule: any): CommandResult {
    // Check conditions
    if (rule.conditions) {
      for (const condition of rule.conditions) {
        if (!this.checkCondition(condition)) {
          return { success: false, message: "今はそれができません。" };
        }
      }
    }

    // Execute effects
    for (const effect of rule.effects) {
      this.executeEffect(effect);
    }

    return { success: true };
  }

  private checkCondition(condition: Condition): boolean {
    switch (condition.type) {
      case "location_is":
        return this.gameState.getCurrentLocation() === condition.value;

      case "has_item":
        if (condition.target === "player") {
          return this.inventorySystem
            .getInventoryItems("player")
            .includes(condition.value);
        }
        return false;

      case "state_equals":
        return (
          this.gameState.getEntityState(condition.target, condition.key) ===
          condition.value
        );

      case "counter_equals":
        return this.gameState.getCounter(condition.key) === condition.value;

      case "flag_is":
        return this.gameState.getFlag(condition.key) === condition.value;

      default:
        return true;
    }
  }

  private executeEffect(effect: Effect): void {
    switch (effect.type) {
      case "display_text":
        this.uiEventHandler({
          type: "message_display",
          timestamp: Date.now(),
          data: { message: effect.content },
        });
        break;

      case "move_entity":
        if (effect.target === "player") {
          this.gameState.setCurrentLocation(effect.destination);
        }
        break;

      case "set_state":
        this.gameState.setEntityState(effect.target, effect.key, effect.value);
        break;

      case "add_to_inventory":
        if (effect.target === "player") {
          this.inventorySystem.addItemToInventory("player", effect.item);
        }
        break;

      case "remove_from_inventory":
        if (effect.target === "player") {
          this.inventorySystem.removeItemFromInventory("player", effect.item);
        }
        break;

      case "end_game":
        this.gameState.setGameOver(true);
        this.uiEventHandler({
          type: "game_over",
          timestamp: Date.now(),
          data: {
            outcome: effect.outcome || "victory",
            message: effect.message,
          },
        });
        break;

      case "set_counter":
        this.gameState.setCounter(effect.key, effect.value);
        break;

      case "add_counter":
        this.gameState.addCounter(effect.key, effect.value);
        break;

      case "set_flag":
        this.gameState.setFlag(effect.key, effect.value);
        break;
    }
  }
}
